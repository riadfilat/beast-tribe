// Builds the Operation Beast programs from training templates and writes them to the database:
// one library workout per program session (program_only, so they don't crowd the library),
// plus programs and program_sessions. Re-running replaces the program's sessions and workouts
// (finished logs keep their history; their program_session link is cleared by the FK).
//
// Principles used (ACSM progression models; NSCA; standard run-walk and taper practice):
// - Progressive overload week to week, then a lighter recovery week (about 40–50% less volume).
// - Strength: effort set by reps in reserve (RIR); heavier sets with fewer reps as weeks go on.
// - Endurance: most running easy, one quality session; run-walk builds continuous running.
// - Every session: warm-up that rehearses the main moves, cool-down with the right stretches.
//
// Usage: PG_URL=... node scripts/programs/build.js [--dry]
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const lib = Object.fromEntries(
  fs.readdirSync(path.join(__dirname, '../exercises/lib')).filter((f) => f.endsWith('.json'))
    .flatMap((f) => JSON.parse(fs.readFileSync(path.join(__dirname, '../exercises/lib', f), 'utf8')))
    .map((x) => [x.slug, x]),
);

// ─── small helpers (EN + AR side by side) ─────────────────────────────────────
const AR_DIGITS = (s) => s; // keep Western digits, as the app does
const sets = (n, r) => [`${n} × ${r}`, `${n} × ${r}`];
const secs = (n) => [`${n} s`, `${n} ث`];
const mins = (n) => [`${n} min`, `${n} د`];
const meters = (n) => (n >= 1000 && n % 1000 === 0 ? [`${n / 1000} km`, `${n / 1000} كم`] : [`${n} m`, `${n} م`]);
const perSide = ([en, ar]) => [`${en} / side`, `${ar} لكل جهة`];
const rir = (n, rest) => [`${n} reps left in the tank · rest ${rest}`, `اترك ${n} تكرارات · راحة ${rest.replace('min', 'د').replace(' s', ' ث')}`];

function item(slug, reps, note) {
  const x = lib[slug];
  if (!x) throw new Error(`unknown exercise ${slug}`);
  const it = { ex: slug, name: x.name, name_ar: x.ar, reps: reps[0], reps_ar: reps[1] };
  if (note) { it.note = note[0]; it.note_ar = note[1]; }
  return it;
}
function block(title, format, opts, items) {
  const b = { title: title[0], title_ar: title[1], format, items };
  if (opts.minutes) b.minutes = opts.minutes;
  if (opts.rounds) b.rounds = opts.rounds;
  if (opts.note) { b.note = opts.note[0]; b.note_ar = opts.note[1]; }
  return b;
}
const WARM = ['Warm-up', 'إحماء'];
const COOL = ['Cool-down', 'تهدئة'];
const MAIN = ['Main', 'الأساسي'];

// ─── Strength Base: gym, 6 weeks × 3 full-body days ───────────────────────────
function strengthBase() {
  const W = [
    { main: [3, 10], rir: 3, acc: [2, 12] },
    { main: [3, 8], rir: 2, acc: [3, 12] },
    { main: [4, 6], rir: 2, acc: [3, 10] },
    { main: [2, 8], rir: 4, acc: [2, 10], deload: true },
    { main: [4, 5], rir: 1, acc: [3, 10] },
    { main: [5, 3], rir: 1, acc: [3, 8] },
  ];
  const warm = (moves) => block(WARM, 'flow', { minutes: 8, note: ['Then 2 lighter build-up sets of the first lift.', 'ثم مجموعتان أخف تمهيدًا لأول تمرين رئيسي.'] }, [
    item('bike', mins(5)), item('leg_swings', perSide(['10', '10'])), item('band_pull_apart', ['15', '15']), ...moves,
  ]);
  const cool = (a, b) => block(COOL, 'flow', { minutes: 5 }, [item(a, perSide(secs(30))), item(b, perSide(secs(30)))]);
  const days = [
    { key: 'A', focus: ['Squat + bench', 'قرفصاء + ضغط صدر'], build: (w) => [
      warm([item('air_squat', ['10', '10'])]),
      block(MAIN, 'strength', {}, [
        item('back_squat', sets(...w.main), rir(w.rir, '2–3 min')),
        item('bench_press', sets(...w.main), rir(w.rir, '2–3 min')),
        item('barbell_row', sets(...w.acc), rir(w.rir + 1, '90 s')),
        item('plank', sets(w.acc[0], '30–45 s'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      cool('hip_flexor_stretch', 'chest_stretch'),
    ] },
    { key: 'B', focus: ['Hinge + press', 'انحناء + ضغط علوي'], build: (w) => [
      warm([item('hip_hinge', ['10', '10'])]),
      block(MAIN, 'strength', {}, [
        item('romanian_deadlift', sets(...w.main), rir(w.rir, '2–3 min')),
        item('overhead_press', sets(...w.main), rir(w.rir, '2 min')),
        item('lat_pulldown', sets(...w.acc), rir(w.rir + 1, '90 s')),
        item('walking_lunge', sets(w.acc[0], perSide(['10', '10'])[0]), rir(w.rir + 1, '90 s')),
        item('pallof_press', sets(w.acc[0], perSide(['10', '10'])[0]), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      cool('hamstring_stretch', 'lat_stretch'),
    ] },
    { key: 'C', focus: ['Single-leg + pull', 'ساق واحدة + سحب'], build: (w) => [
      warm([item('glute_bridge', ['10', '10'])]),
      block(MAIN, 'strength', {}, [
        item('bulgarian_split_squat', sets(w.main[0], perSide([String(Math.max(6, w.main[1])), String(Math.max(6, w.main[1]))])[0]), rir(w.rir + 1, '2 min')),
        item('dumbbell_bench_press', sets(...w.acc), rir(w.rir + 1, '90 s')),
        item('dumbbell_row', sets(w.acc[0], perSide([String(w.acc[1]), String(w.acc[1])])[0]), rir(w.rir + 1, '90 s')),
        item('hip_thrust', sets(...w.acc), rir(w.rir + 1, '90 s')),
        item('farmer_carry', sets(w.acc[0], '40 m'), ['Heavy · rest 60 s', 'ثقيل · راحة 60 ث']),
      ]),
      cool('figure_four_stretch', 'quad_stretch'),
    ] },
  ];
  return {
    slug: 'strength-base', title: ['Strength Base', 'أساس القوة'], goal: 'strength', sport: 'gym', level: 'medium', weeks: 6, days: 3, minutes: 55,
    equipment: ['barbell', 'rack', 'bench', 'dumbbells', 'cable'],
    summary: ['Get strong on the big lifts in six weeks. Three full-body gym days, heavier each week, with a lighter week four to recover.', 'قوِّ نفسك في التمارين الأساسية خلال ستة أسابيع: ثلاثة أيام جسم كامل في الصالة، أثقل كل أسبوع، مع أسبوع رابع أخف للاستشفاء.'],
    principles: [
      ['Add a little weight when every set hits the reps with the reps-left target.', 'زد الوزن قليلًا عندما تكمل كل المجموعات بالتكرارات المطلوبة.'],
      ['Reps left in the tank keeps you strong without grinding: stop with that many good reps left.', 'التكرارات المتبقية تحميك من الإجهاد الزائد: توقف وما زال لديك هذا العدد.'],
      ['Week 4 is lighter on purpose; strength shows up in weeks 5 and 6.', 'الأسبوع الرابع أخف عمدًا، وتظهر القوة في الأسبوعين الخامس والسادس.'],
    ],
    sessions: W.flatMap((w, wi) => days.map((d, di) => ({
      week: wi + 1, day: di + 1, focus: d.focus,
      title: [`Strength ${d.key} · Week ${wi + 1}`, `القوة ${'أبج'[di]} · الأسبوع ${wi + 1}`],
      format: 'strength', difficulty: w.deload ? 'intermediate' : 'advanced', minutes: w.deload ? 40 : 55, equipment: ['barbell', 'bench', 'dumbbells'],
      blocks: d.build(w),
    }))),
  };
}

// ─── Home Strength: dumbbells or nothing, 4 weeks × 3 days ────────────────────
function homeStrength() {
  const W = [{ r: 3, reps: 10 }, { r: 3, reps: 12 }, { r: 4, reps: 12 }, { r: 4, reps: 15 }];
  const rest = ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'];
  const warm = block(WARM, 'flow', { minutes: 5 }, [item('jumping_jack', secs(60)), item('inchworm', ['5', '5']), item('worlds_greatest_stretch', perSide(['3', '3']))]);
  const cool = block(COOL, 'flow', { minutes: 4 }, [item('childs_pose', secs(45)), item('hip_flexor_stretch', perSide(secs(30)))]);
  const days = [
    { key: 'A', focus: ['Squat + push', 'قرفصاء + دفع'], moves: (w) => [
      item('goblet_squat', [String(w.reps), String(w.reps)], ['Air squat if no weight', 'قرفصاء بوزن الجسم إن لم يتوفر وزن']),
      item('push_up', [String(Math.round(w.reps * 0.8)), String(Math.round(w.reps * 0.8))], ['On knees is fine', 'على الركبتين لا بأس']),
      item('dumbbell_row', perSide([String(w.reps), String(w.reps)])),
      item('glute_bridge', [String(w.reps + 5), String(w.reps + 5)]),
      item('dead_bug', perSide(['8', '8'])),
    ] },
    { key: 'B', focus: ['Lunge + shoulders', 'طعن + أكتاف'], moves: (w) => [
      item('reverse_lunge', perSide([String(w.reps), String(w.reps)])),
      item('pike_push_up', [String(Math.round(w.reps * 0.6)), String(Math.round(w.reps * 0.6))]),
      item('single_leg_rdl', perSide([String(Math.round(w.reps * 0.8)), String(Math.round(w.reps * 0.8))])),
      item('side_plank', perSide(secs(20 + w.r * 5))),
      item('mountain_climber', secs(30)),
    ] },
    { key: 'C', focus: ['Single-leg + core', 'ساق واحدة + جذع'], moves: (w) => [
      item('split_squat', perSide([String(w.reps), String(w.reps)])),
      item('incline_push_up', [String(w.reps), String(w.reps)]),
      item('band_pull_apart', ['15', '15']),
      item('calf_raise', ['20', '20']),
      item('plank_shoulder_tap', perSide(['10', '10'])),
    ] },
  ];
  return {
    slug: 'home-strength', title: ['Home Strength', 'القوة في المنزل'], goal: 'home', sport: 'gym', level: 'easy', weeks: 4, days: 3, minutes: 35,
    equipment: ['dumbbells'],
    summary: ['Full-body strength at home with a pair of dumbbells or none at all. Three short days a week, a little more each week.', 'قوة للجسم كله في المنزل بدمبلين أو دونهما. ثلاثة أيام قصيرة أسبوعيًا مع زيادة بسيطة كل أسبوع.'],
    principles: [
      ['Move slowly on the way down: three seconds makes light weights hard.', 'انزل ببطء: ثلاث ثوانٍ تجعل الأوزان الخفيفة صعبة.'],
      ['When a round feels easy, switch to the harder version in the move.', 'عندما تصبح الجولة سهلة، انتقل إلى النسخة الأصعب من التمرين.'],
    ],
    sessions: W.flatMap((w, wi) => days.map((d, di) => ({
      week: wi + 1, day: di + 1, focus: d.focus,
      title: [`Home ${d.key} · Week ${wi + 1}`, `المنزل ${'أبج'[di]} · الأسبوع ${wi + 1}`],
      format: 'rounds', difficulty: 'beginner', minutes: 30 + wi * 3, equipment: ['dumbbells'],
      blocks: [warm, block(MAIN, 'rounds', { rounds: w.r, note: rest }, d.moves(w)), cool],
    }))),
  };
}

// ─── Padel Fit: 4 weeks × 2 days ──────────────────────────────────────────────
function padelFit() {
  const W = [{ r: 3, work: 30 }, { r: 3, work: 40 }, { r: 4, work: 40 }, { r: 4, work: 45 }];
  const warm = block(WARM, 'flow', { minutes: 7 }, [item('skips', meters(20)), item('high_knees', secs(30)), item('lateral_shuffle', secs(30)), item('thoracic_rotation', perSide(['6', '6'])), item('arm_circles', secs(30))]);
  const cool = (a, b) => block(COOL, 'flow', { minutes: 4 }, [item(a, perSide(secs(30))), item(b, perSide(secs(30)))]);
  const days = [
    { focus: ['Speed + legs', 'سرعة + أرجل'], build: (w) => [warm,
      block(['Footwork', 'حركة القدمين'], 'intervals', { rounds: w.r, note: [`${w.work} s on · ${60 - w.work} s off`, `${w.work} ث عمل · ${60 - w.work} ث راحة`] }, [
        item('lateral_shuffle', secs(w.work)), item('quick_feet', secs(w.work)), item('shuttle_run', secs(w.work)),
      ]),
      block(['Strength', 'القوة'], 'rounds', { rounds: w.r - 1, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('lateral_lunge', perSide(['8', '8'])), item('skater_jump', perSide(['6', '6'])), item('bulgarian_split_squat', perSide(['8', '8'])),
        item('copenhagen_plank', perSide(secs(15 + w.r * 3)), ['Knee on the bench to start', 'ابدأ بالركبة على المقعد']), item('single_leg_calf_raise', perSide(['12', '12'])),
      ]),
      cool('calf_stretch', 'hip_flexor_stretch')] },
    { focus: ['Rotation + shoulders', 'دوران + أكتاف'], build: (w) => [warm,
      block(['Power', 'القوة الانفجارية'], 'rounds', { rounds: w.r, note: ['Fast and crisp, full rest 60–90 s', 'سريع وحاد مع راحة 60–90 ث'] }, [
        item('med_ball_rotational_throw', perSide(['6', '6'])), item('jump_squat', ['6', '6']),
      ]),
      block(['Strength', 'القوة'], 'rounds', { rounds: w.r - 1, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('dumbbell_row', perSide(['10', '10'])), item('push_up', ['10', '10']), item('face_pull', ['15', '15'], ['Band works too', 'يمكن استخدام الحبل المطاطي']),
        item('pallof_press', perSide(['10', '10'])), item('side_plank', perSide(secs(30))),
      ]),
      cool('lat_stretch', 'chest_stretch')] },
  ];
  return {
    slug: 'padel-fit', title: ['Padel Fit', 'لياقة البادل'], goal: 'padel', sport: 'padel', level: 'medium', weeks: 4, days: 2, minutes: 45,
    equipment: ['dumbbells', 'med_ball', 'bench', 'band'],
    summary: ['Faster to the ball, stronger at the net, healthier shoulders. Two sessions a week alongside your matches.', 'أسرع نحو الكرة وأقوى عند الشبكة وأكتاف أكثر صحة. حصتان أسبوعيًا إلى جانب مبارياتك.'],
    principles: [
      ['Footwork drills are about speed: stop a set when you slow down.', 'تمارين القدمين للسرعة: أوقف المجموعة عندما تتباطأ.'],
      ['Copenhagen planks and calf work protect the groin and Achilles, the most common padel injuries.', 'بلانك كوبنهاغن وتمارين السمانة تحمي الفخذ الداخلي ووتر أخيل، أكثر إصابات البادل شيوعًا.'],
      ['Keep a day between these sessions and hard matches.', 'اترك يومًا بين هذه الحصص والمباريات القوية.'],
    ],
    sessions: W.flatMap((w, wi) => days.map((d, di) => ({
      week: wi + 1, day: di + 1, focus: d.focus,
      title: [`Padel Fit ${di + 1} · Week ${wi + 1}`, `لياقة البادل ${di + 1} · الأسبوع ${wi + 1}`],
      format: 'rounds', difficulty: 'intermediate', minutes: 40 + wi * 2, equipment: ['dumbbells', 'med_ball'],
      blocks: d.build(w),
    }))),
  };
}

// ─── First 5K: run-walk, 6 weeks × 3 runs ─────────────────────────────────────
function first5k() {
  // [rounds, run min, walk min] per week; day 3 a little longer
  const W = [[8, 1, 1.5], [6, 2, 1], [5, 3, 1], [4, 5, 1], [3, 8, 1], null];
  const warm = block(WARM, 'flow', { minutes: 6 }, [item('walk', mins(5)), item('leg_swings', perSide(['10', '10'])), item('skips', meters(20))]);
  const cool = block(COOL, 'flow', { minutes: 6 }, [item('walk', mins(3)), item('calf_stretch', perSide(secs(30))), item('quad_stretch', perSide(secs(30)))]);
  const sessions = [];
  for (let wi = 0; wi < 6; wi++) for (let di = 0; di < 3; di++) {
    let mainB, minutes;
    if (W[wi]) {
      const [r0, run, walk] = W[wi];
      const r = r0 + (di === 2 ? 1 : 0);
      mainB = block(['Run-walk', 'جري ومشي'], 'intervals', { rounds: r, note: ['Easy pace: you can talk in sentences.', 'وتيرة سهلة: تستطيع الكلام بجمل.'] }, [item('easy_jog', mins(run)), item('walk', mins(walk))]);
      minutes = Math.round(r * (run + walk)) + 12;
    } else {
      const m = [20, 25, 32][di];
      mainB = block(di === 2 ? ['Your 5K', 'الـ 5 كم'] : ['Continuous run', 'جري متواصل'], 'steady', { minutes: m, note: di === 2 ? ['Run 5 km at an even pace. Walk breaks are fine.', 'اجرِ 5 كم بوتيرة ثابتة. لا بأس بالمشي القصير.'] : ['Steady, easy pace.', 'وتيرة سهلة ثابتة.'] }, [item('easy_jog', di === 2 ? meters(5000) : mins(m))]);
      minutes = m + 12;
    }
    sessions.push({
      week: wi + 1, day: di + 1, focus: di === 2 ? ['Longest run of the week', 'أطول جري في الأسبوع'] : ['Run-walk', 'جري ومشي'],
      title: [`5K Run ${di + 1} · Week ${wi + 1}`, `جري 5 كم ${di + 1} · الأسبوع ${wi + 1}`],
      format: W[wi] ? 'intervals' : 'steady', difficulty: 'beginner', minutes, equipment: [],
      blocks: [warm, mainB, cool], sport: 'running',
    });
  }
  return {
    slug: 'first-5k', title: ['First 5K', 'أول 5 كيلو'], goal: 'running', sport: 'running', level: 'easy', weeks: 6, days: 3, minutes: 30, equipment: [],
    summary: ['From your first run to running 5 km without stopping. Three short run-walk sessions a week.', 'من أول جري لك إلى 5 كم دون توقف. ثلاث حصص قصيرة من الجري والمشي أسبوعيًا.'],
    principles: [
      ["Run easy: if you can't talk, slow down. Speed comes later.", 'اجرِ بسهولة: إن لم تستطع الكلام فأبطئ. السرعة تأتي لاحقًا.'],
      ['Keep a rest day between runs so tendons adapt.', 'اترك يوم راحة بين الجريات لتتكيف الأوتار.'],
      ["Repeat a week if it felt too hard. That's normal.", 'كرّر الأسبوع إن كان صعبًا. هذا طبيعي.'],
    ],
    sessions,
  };
}

// ─── Hyrox Ready: 6 weeks × 3 days ────────────────────────────────────────────
function hyroxReady() {
  const W = [
    { reps: 4, dist: 800, rounds: 3 }, { reps: 5, dist: 800, rounds: 3 }, { reps: 4, dist: 1000, rounds: 4 },
    { reps: 3, dist: 800, rounds: 2, deload: true }, { reps: 5, dist: 1000, rounds: 4 }, { reps: 6, dist: 1000, rounds: 5 },
  ];
  const warm = block(WARM, 'flow', { minutes: 8 }, [item('easy_jog', mins(5)), item('worlds_greatest_stretch', perSide(['3', '3'])), item('skips', meters(20))]);
  const cool = block(COOL, 'flow', { minutes: 5 }, [item('walk', mins(3)), item('hip_flexor_stretch', perSide(secs(30))), item('calf_stretch', perSide(secs(30)))]);
  const sessions = [];
  W.forEach((w, wi) => {
    sessions.push({ week: wi + 1, day: 1, focus: ['Run intervals', 'فترات جري'], title: [`Hyrox Run · Week ${wi + 1}`, `جري هايروكس · الأسبوع ${wi + 1}`],
      format: 'intervals', difficulty: 'advanced', minutes: 20 + w.reps * 6, equipment: [], sport: 'hyrox',
      blocks: [warm, block(['Intervals', 'فترات'], 'intervals', { rounds: w.reps, note: ['At your target race pace · rest 90 s', 'بوتيرة السباق المستهدفة · راحة 90 ث'] }, [item('run', meters(w.dist)), item('walk', secs(90))]), cool] });
    sessions.push({ week: wi + 1, day: 2, focus: ['Station strength', 'قوة المحطات'], title: [`Hyrox Stations · Week ${wi + 1}`, `محطات هايروكس · الأسبوع ${wi + 1}`],
      format: 'rounds', difficulty: 'advanced', minutes: 45, equipment: ['wall_ball', 'kettlebell', 'rower', 'sled'], sport: 'hyrox',
      blocks: [warm, block(['Stations', 'المحطات'], 'rounds', { rounds: w.rounds, note: ['Steady, not all-out · rest 90 s between rounds', 'ثابت لا أقصى جهد · راحة 90 ث بين الجولات'] }, [
        item('wall_ball', ['20', '20']), item('sled_push', meters(25), ['Walking lunges 20 if no sled', '20 طعن بالمشي إن لم تتوفر زلاجة']),
        item('farmer_carry', meters(50)), item('rower', meters(250)), item('burpee', ['10', '10']),
      ]), cool] });
    sessions.push({ week: wi + 1, day: 3, focus: ['Run + station', 'جري + محطة'], title: [`Hyrox Simulation · Week ${wi + 1}`, `محاكاة هايروكس · الأسبوع ${wi + 1}`],
      format: 'for_time', difficulty: 'advanced', minutes: 15 + w.rounds * 9, equipment: ['wall_ball', 'kettlebell'], sport: 'hyrox',
      blocks: [warm, block(['Compromised running', 'جري تحت التعب'], 'for_time', { rounds: w.rounds, note: ['Run straight into the station and back out.', 'اجرِ مباشرة إلى المحطة ثم عد للجري.'] }, [
        item('run', meters(1000)), item(['wall_ball', 'walking_lunge', 'farmer_carry', 'rower', 'burpee'][wi % 5], wi % 5 === 2 ? meters(100) : wi % 5 === 3 ? meters(500) : ['20', '20']),
      ]), cool] });
  });
  return {
    slug: 'hyrox-ready', title: ['Hyrox Ready', 'جاهز لهايروكس'], goal: 'hyrox', sport: 'hyrox', level: 'hard', weeks: 6, days: 3, minutes: 50,
    equipment: ['wall_ball', 'kettlebell', 'rower', 'sled'],
    summary: ['Six weeks to your first Hyrox: run intervals, station strength and race simulations, with a lighter week four.', 'ستة أسابيع لأول سباق هايروكس: فترات جري وقوة المحطات ومحاكاة السباق مع أسبوع رابع أخف.'],
    principles: [
      ['Half of Hyrox is running: protect the run sessions.', 'نصف هايروكس جري: لا تفوّت حصص الجري.'],
      ['Stations at a pace you could hold for the whole race.', 'نفّذ المحطات بوتيرة تستطيع الحفاظ عليها طوال السباق.'],
      ['Simulation days teach your legs to run tired.', 'أيام المحاكاة تعلّم ساقيك الجري وهما متعبتان.'],
    ],
    sessions,
  };
}

// ─── Busy Week 20: 4 weeks × 3 twenty-minute days ─────────────────────────────
function busyWeek() {
  const W = [{ work: 30 }, { work: 35 }, { work: 40 }, { work: 40, harder: true }];
  const warm = block(WARM, 'flow', { minutes: 3 }, [item('jumping_jack', secs(45)), item('inchworm', ['4', '4']), item('hip_openers', perSide(['5', '5']))]);
  const days = [
    { focus: ['Full body', 'الجسم كله'], format: 'emom', build: (w) => block(['Every minute', 'كل دقيقة'], 'emom', { minutes: 16, note: ['One move each minute, rest the rest of the minute.', 'تمرين في كل دقيقة واسترح بقية الدقيقة.'] }, [
      item(w.harder ? 'goblet_squat' : 'air_squat', ['15', '15']), item(w.harder ? 'push_up' : 'incline_push_up', ['10', '10']), item('mountain_climber', secs(w.work)), item('plank', secs(w.work)),
    ]) },
    { focus: ['Legs + core', 'أرجل + جذع'], format: 'amrap', build: (w) => block(['As many rounds', 'أكبر عدد من الجولات'], 'amrap', { minutes: 15 }, [
      item(w.harder ? 'walking_lunge' : 'reverse_lunge', perSide(['8', '8'])), item('glute_bridge', ['15', '15']), item('dead_bug', perSide(['6', '6'])), item(w.harder ? 'jump_squat' : 'air_squat', ['10', '10']),
    ]) },
    { focus: ['Conditioning', 'لياقة'], format: 'intervals', build: (w) => block(['Intervals', 'فترات'], 'intervals', { rounds: 3, note: [`${w.work} s on · ${60 - w.work} s off, 5 moves`, `${w.work} ث عمل · ${60 - w.work} ث راحة، 5 تمارين`] }, [
      item(w.harder ? 'burpee' : 'step_burpee', secs(w.work)), item('lateral_shuffle', secs(w.work)), item('high_knees', secs(w.work)), item('plank_shoulder_tap', secs(w.work)), item('jump_squat', secs(w.work)),
    ]) },
  ];
  return {
    slug: 'busy-week', title: ['Busy Week 20', 'أسبوع مزدحم 20'], goal: 'busy', sport: 'crossfit', level: 'easy', weeks: 4, days: 3, minutes: 20, equipment: [],
    summary: ['Twenty minutes, no equipment, three times a week. For the weeks when work takes everything.', 'عشرون دقيقة دون أدوات، ثلاث مرات أسبوعيًا. للأسابيع التي يأخذ فيها العمل كل وقتك.'],
    principles: [
      ['Short sessions done every week beat long ones you skip.', 'الحصص القصيرة المنتظمة أفضل من الطويلة التي تفوتها.'],
      ['Push the work, then really rest in the off time.', 'اجتهد في وقت العمل ثم استرح فعلًا في وقت الراحة.'],
    ],
    sessions: W.flatMap((w, wi) => days.map((d, di) => ({
      week: wi + 1, day: di + 1, focus: d.focus,
      title: [`Busy 20 · ${di + 1} · Week ${wi + 1}`, `مزدحم 20 · ${di + 1} · الأسبوع ${wi + 1}`],
      format: d.format, difficulty: 'beginner', minutes: 20, equipment: [], sport: 'crossfit',
      blocks: [warm, d.build(w), block(COOL, 'flow', { minutes: 1 }, [item('standing_forward_fold', secs(30)), item('childs_pose', secs(30))])],
    }))),
  };
}


// ─── Calisthenics Start: bodyweight, 6 weeks × 3 days, variations get harder ──
function calisthenics() {
  // easier → harder variant per slot as weeks progress
  const W = [
    { sets: 3, reps: 8, push: 'incline_push_up', pull: 'inverted_row', squat: 'air_squat', core: 'dead_bug' },
    { sets: 3, reps: 10, push: 'knee_push_up', pull: 'inverted_row', squat: 'air_squat', core: 'dead_bug' },
    { sets: 4, reps: 8, push: 'push_up', pull: 'band_pull_up', squat: 'split_squat', core: 'hollow_hold' },
    { sets: 2, reps: 8, push: 'push_up', pull: 'inverted_row', squat: 'split_squat', core: 'dead_bug', deload: true },
    { sets: 4, reps: 10, push: 'push_up', pull: 'band_pull_up', squat: 'bulgarian_split_squat', core: 'hollow_hold' },
    { sets: 4, reps: 12, push: 'decline_push_up', pull: 'pull_up', squat: 'bulgarian_split_squat', core: 'hollow_hold' },
  ];
  const rest = ['Rest 60–90 s between sets · 1–2 good reps left', 'راحة 60–90 ث بين المجموعات · اترك 1–2 تكرار'];
  const warm = block(WARM, 'flow', { minutes: 6 }, [item('jumping_jack', secs(60)), item('arm_circles', secs(30)), item('cat_cow', ['8', '8']), item('inchworm', ['5', '5'])]);
  const cool = (a, b) => block(COOL, 'flow', { minutes: 4 }, [item(a, secs(45)), item(b, perSide(secs(30)))]);
  const pullReps = (w) => (w.pull === 'pull_up' ? '3–6' : w.pull === 'band_pull_up' ? '5–8' : String(w.reps));
  const days = [
    { key: 'A', focus: ['Push + core', 'دفع + جذع'], build: (w) => [warm, block(MAIN, 'strength', { note: rest }, [
      item(w.push, sets(w.sets, w.reps)), item('pike_push_up', sets(w.sets, Math.max(5, w.reps - 4))), item('dips', sets(w.sets - 1, w.reps)),
      item(w.core, w.core === 'hollow_hold' ? sets(w.sets, '20 s') : sets(w.sets, perSide(['8', '8'])[0])), item('plank', sets(2, '30–45 s')),
    ]), cool('childs_pose', 'chest_stretch')] },
    { key: 'B', focus: ['Pull + legs', 'سحب + أرجل'], build: (w) => [warm, block(MAIN, 'strength', { note: rest }, [
      item(w.pull, sets(w.sets, pullReps(w))), item('inverted_row', sets(w.sets - 1, w.reps)),
      item(w.squat, w.squat === 'air_squat' ? sets(w.sets, w.reps + 7) : sets(w.sets, perSide([String(w.reps), String(w.reps)])[0])),
      item('glute_bridge', sets(w.sets - 1, w.reps + 5)), item('band_pull_apart', sets(2, 15)),
    ]), cool('lat_stretch', 'hip_flexor_stretch')] },
    { key: 'C', focus: ['Full body', 'الجسم كله'], build: (w) => [warm, block(MAIN, 'rounds', { rounds: w.sets, note: ['Rest 90 s between rounds', 'راحة 90 ث بين الجولات'] }, [
      item(w.push, [String(w.reps), String(w.reps)]), item('reverse_lunge', perSide([String(w.reps), String(w.reps)])),
      item('inverted_row', [String(w.reps), String(w.reps)]), item('side_plank', perSide(secs(20 + w.sets * 5))), item('mountain_climber', secs(30)),
    ]), cool('figure_four_stretch', 'quad_stretch')] },
  ];
  return {
    slug: 'calisthenics-start', title: ['Calisthenics Start', 'بداية الكاليستنكس'], goal: 'calisthenics', sport: 'gym', level: 'easy', weeks: 6, days: 3, minutes: 40,
    equipment: ['pull_up_bar', 'band', 'bench'],
    summary: ['Master your bodyweight in six weeks: from incline push-ups and rows to full push-ups and your first pull-ups.', 'أتقن وزن جسمك خلال ستة أسابيع: من الضغط المائل والتجديف إلى الضغط الكامل وأول عقلة.'],
    principles: [
      ['Each week the variation gets harder, not just the reps.', 'كل أسبوع تصبح النسخة أصعب، لا عدد التكرارات فقط.'],
      ['Clean reps only: stop the set when form breaks.', 'تكرارات نظيفة فقط: أوقف المجموعة عند انهيار التقنية.'],
      ['No bar yet? Do rows under a sturdy table instead of pull-ups.', 'لا يوجد بار؟ نفّذ التجديف تحت طاولة متينة بدل العقلة.'],
    ],
    sessions: W.flatMap((w, wi) => days.map((d, di) => ({
      week: wi + 1, day: di + 1, focus: d.focus,
      title: [`Calisthenics ${d.key} · Week ${wi + 1}`, `كاليستنكس ${'أبج'[di]} · الأسبوع ${wi + 1}`],
      format: di === 2 ? 'rounds' : 'strength', difficulty: wi < 2 ? 'beginner' : 'intermediate', minutes: w.deload ? 30 : 40, equipment: ['pull_up_bar', 'band'],
      blocks: d.build(w),
    }))),
  };
}

const PROGRAMS = [strengthBase(), calisthenics(), homeStrength(), first5k(), padelFit(), hyroxReady(), busyWeek()];

(async () => {
  const total = PROGRAMS.reduce((n, p) => n + p.sessions.length, 0);
  console.log(PROGRAMS.map((p) => `${p.slug}: ${p.sessions.length} sessions`).join('\n'), `\n${total} workouts`);
  if (process.argv.includes('--dry')) { console.log(JSON.stringify(PROGRAMS[0].sessions[0], null, 1).slice(0, 2500)); return; }
  const c = new Client({ connectionString: process.env.PG_URL });
  await c.connect();
  try {
    await c.query('begin');
    for (const [sort, p] of PROGRAMS.entries()) {
      const pr = await c.query(
        `insert into public.programs (slug, title, title_ar, summary, summary_ar, goal, sport, level, weeks, days_per_week, minutes, equipment, principles, sort, status)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'published')
         on conflict (slug) do update set title=excluded.title, title_ar=excluded.title_ar, summary=excluded.summary, summary_ar=excluded.summary_ar,
           goal=excluded.goal, sport=excluded.sport, level=excluded.level, weeks=excluded.weeks, days_per_week=excluded.days_per_week,
           minutes=excluded.minutes, equipment=excluded.equipment, principles=excluded.principles, sort=excluded.sort
         returning id`,
        [p.slug, p.title[0], p.title[1], p.summary[0], p.summary[1], p.goal, p.sport, p.level, p.weeks, p.days, p.minutes, p.equipment,
         JSON.stringify(p.principles.map(([en, ar]) => ({ en, ar }))), sort],
      );
      const programId = pr.rows[0].id;
      const old = await c.query('select workout_id from public.program_sessions where program_id=$1', [programId]);
      await c.query('delete from public.program_sessions where program_id=$1', [programId]);
      if (old.rows.length) await c.query(`update public.workouts set status='archived' where id = any($1) and program_only`, [old.rows.map((r) => r.workout_id)]);
      for (const s of p.sessions) {
        const w = await c.query(
          `insert into public.workouts (title, title_ar, description, description_ar, sport, format, difficulty, duration_minutes, equipment, blocks, source, status, program_only, xp_reward)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'library','published',true,0) returning id`,
          [s.title[0], s.title[1], s.focus[0], s.focus[1], s.sport || p.sport, s.format, s.difficulty, s.minutes, s.equipment, JSON.stringify(s.blocks)],
        );
        await c.query('insert into public.program_sessions (program_id, week, day, workout_id, focus, focus_ar) values ($1,$2,$3,$4,$5,$6)',
          [programId, s.week, s.day, w.rows[0].id, s.focus[0], s.focus[1]]);
      }
    }
    await c.query('commit');
    console.log('programs written');
  } catch (e) {
    await c.query('rollback');
    throw e;
  } finally {
    await c.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
