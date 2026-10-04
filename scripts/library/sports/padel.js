// Padel: quick lateral feet, strong hips and knees for the low volley, a rotating trunk, and shoulders
// that last a long match. 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, sets, secs, mins, meters, perSide, WARM, MAIN, COOL } = require('../kit');

const warmCourt = (minutes = 6) => block(WARM, 'flow', { minutes }, [
  item('march', secs(45)),
  item('arm_circles', reps('10')),
  item('leg_swings', perSide(['10', '10'])),
  item('lateral_shuffle', secs(30)),
]);
const coolLegs = block(COOL, 'flow', { minutes: 5 }, [
  item('quad_stretch', perSide(secs(30))),
  item('hamstring_stretch', perSide(secs(30))),
  item('calf_stretch', perSide(secs(30))),
]);
const coolUpper = block(COOL, 'flow', { minutes: 4 }, [
  item('chest_stretch', secs(30)),
  item('lat_stretch', perSide(secs(30))),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'padel-court-legs-basics', level: 'beginner', format: 'rounds', minutes: 20, equipment: [],
    title: ['Court Legs Basics', 'أساسيات الساقين للملعب'],
    desc: ['Legs that hold you low for the volley. Slow, controlled reps, no equipment.', 'ساقان تثبّتانك منخفضًا عند الضربة الطائرة. تكرارات بطيئة ومتحكَّم بها، بلا معدات.'],
    blocks: [
      warmCourt(5),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('air_squat', reps('12')),
        item('lateral_lunge', perSide(['8', '8'])),
        item('glute_bridge', reps('12')),
        item('calf_raise', reps('15')),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'padel-footwork-start', level: 'beginner', format: 'intervals', minutes: 15, equipment: [],
    title: ['Footwork Start', 'بداية حركة القدمين'],
    desc: ['Light, quick feet in short bursts. Learn to move side to side without crossing your feet.', 'قدمان خفيفتان وسريعتان في دفعات قصيرة. تعلّم التحرك جانبًا دون أن تتقاطع قدماك.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('march', mins(1)), item('step_jack', secs(45)), item('leg_swings', perSide(['8', '8']))]),
      block(MAIN, 'intervals', { rounds: 4, note: ['Walk slowly to recover after each round', 'امشِ ببطء للاستشفاء بعد كل جولة'] }, [
        item('lateral_shuffle', secs(20)),
        item('quick_feet', secs(20)),
        item('walk', secs(40)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'padel-shoulder-care', level: 'beginner', format: 'flow', minutes: 15, equipment: ['band'],
    title: ['Shoulder Care', 'العناية بالكتف'],
    desc: ['Keeps the smash shoulder healthy. Do it on rest days or before you play.', 'يحافظ على صحة كتف الضربة الساحقة. نفّذه في أيام الراحة أو قبل اللعب.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('shoulder_rolls', secs(30)), item('arm_circles', reps('10'))]),
      block(MAIN, 'rounds', { rounds: 2, note: ['Light band, slow and smooth', 'شريط خفيف، ببطء وسلاسة'] }, [
        item('band_pull_apart', reps('15')),
        item('pallof_press', perSide(['10', '10'])),
        item('thoracic_rotation', perSide(['6', '6'])),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'padel-rotation-core-start', level: 'beginner', format: 'rounds', minutes: 20, equipment: [],
    title: ['Rotation Core Start', 'بداية جذع الدوران'],
    desc: ['A steady middle for every swing. Hold positions and breathe; nothing fast.', 'جذع ثابت لكل ضربة. اثبت في الوضعيات وتنفّس، لا شيء سريع.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('cat_cow', reps('8')), item('thoracic_rotation', perSide(['6', '6']))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('dead_bug', perSide(['6', '6'])),
        item('bird_dog', perSide(['6', '6'])),
        item('knee_plank', secs(30)),
        item('glute_bridge', reps('10')),
      ]),
      block(COOL, 'flow', { minutes: 3 }, [item('childs_pose', mins(1)), item('figure_four_stretch', perSide(secs(30)))]),
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'padel-split-step-power', level: 'intermediate', format: 'rounds', minutes: 30, equipment: [],
    title: ['Split-Step Power', 'قوة الخطوة التحضيرية'],
    desc: ['Spring off the ground and change direction fast, the way you react to a hard ball.', 'انطلق من الأرض وغيّر اتجاهك بسرعة، كما تتفاعل مع كرة قوية.'],
    blocks: [
      warmCourt(),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 75 s between rounds', 'راحة 75 ث بين الجولات'] }, [
        item('jump_squat', reps('8'), ['Land softly, knees over toes', 'اهبط بنعومة والركبتان فوق أصابع القدم']),
        item('skater_jump', perSide(['6', '6'])),
        item('lateral_lunge', perSide(['8', '8'])),
        item('plank_shoulder_tap', perSide(['8', '8'])),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'padel-rally-engine', level: 'intermediate', format: 'intervals', minutes: 30, equipment: [],
    title: ['Rally Engine', 'لياقة التبادلات الطويلة'],
    desc: ['Long rallies without losing your legs: hard bursts like a point, short rests like between points.', 'تبادلات طويلة دون أن تخونك ساقاك: دفعات قوية مثل النقطة وراحة قصيرة مثل ما بين النقاط.'],
    blocks: [
      warmCourt(),
      block(MAIN, 'intervals', { rounds: 6, note: ['Go hard on the work, recover fully on the walk', 'اجتهد في العمل واستشفِ تمامًا أثناء المشي'] }, [
        item('lateral_shuffle', secs(30)),
        item('shuttle_run', secs(20)),
        item('walk', secs(40)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'padel-strong-hips-knees', level: 'intermediate', format: 'strength', minutes: 35, equipment: ['dumbbells', 'bench'],
    title: ['Strong Hips and Knees', 'وركان وركبتان قويتان'],
    desc: ['Single-leg strength that protects your knees in the low, wide positions padel asks for.', 'قوة الساق الواحدة التي تحمي ركبتيك في الوضعيات المنخفضة والواسعة في البادل.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('march', mins(1)), item('glute_bridge', reps('10')), item('lateral_lunge', perSide(['6', '6']))]),
      block(MAIN, 'strength', {}, [
        item('bulgarian_split_squat', sets(3, '8 / side'), ['2 reps left in the tank · rest 90 s', 'اترك تكرارين · راحة 90 ث']),
        item('single_leg_rdl', sets(3, '8 / side'), ['Rest 60 s', 'راحة 60 ث']),
        item('copenhagen_plank', sets(3, '15 s / side'), ['Rest 45 s', 'راحة 45 ث']),
        item('single_leg_calf_raise', sets(3, '12 / side'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'padel-rotation-power', level: 'intermediate', format: 'rounds', minutes: 30, equipment: ['med_ball', 'band'],
    title: ['Rotation Power', 'قوة الدوران'],
    desc: ['Turn from the hips, not the arm: more power on the bandeja and the drive with less strain.', 'دُر من الوركين لا من الذراع: قوة أكبر في البانديخا والضربة الأمامية بجهد أقل على الكتف.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('thoracic_rotation', perSide(['8', '8'])), item('worlds_greatest_stretch', perSide(['3', '3'])), item('band_pull_apart', reps('12'))]),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('med_ball_rotational_throw', perSide(['6', '6'])),
        item('pallof_press', perSide(['10', '10'])),
        item('russian_twist', perSide(['10', '10'])),
        item('side_plank', perSide(secs(25))),
      ]),
      coolUpper,
    ],
  },

  // ───── Advanced ─────
  {
    key: 'padel-match-conditioning', level: 'advanced', format: 'emom', minutes: 32, equipment: [],
    title: ['Match Conditioning', 'لياقة المباراة'],
    desc: ['Twenty minutes, a new move every minute. Built for the third set, when legs usually go.', 'عشرون دقيقة، حركة جديدة كل دقيقة. مصمَّم للمجموعة الثالثة حين تتعب الساقان عادة.'],
    blocks: [
      warmCourt(7),
      block(MAIN, 'emom', { minutes: 20, note: ['Finish the work, rest what is left of the minute', 'أنهِ الحركة وارتح ما تبقّى من الدقيقة'] }, [
        item('burpee', reps('10')),
        item('skater_jump', perSide(['8', '8'])),
        item('shuttle_run', secs(30)),
        item('mountain_climber', secs(30)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'padel-explosive-legs', level: 'advanced', format: 'strength', minutes: 45, equipment: ['box', 'kettlebell'],
    title: ['Explosive Legs', 'ساقان انفجاريتان'],
    desc: ['First step speed: jumps when you are fresh, then heavy legs, then hamstrings that resist pulls.', 'سرعة الخطوة الأولى: قفزات وأنت نشيط، ثم أوزان للساقين، ثم أوتار ركبة تقاوم الشد.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('easy_jog', mins(3)), item('leg_swings', perSide(['10', '10'])), item('air_squat', reps('10')), item('skips', meters(20))]),
      block(['Power', 'القوة الانفجارية'], 'strength', { note: ['Full rest: every jump should be your best', 'راحة كاملة: كل قفزة يجب أن تكون أفضل ما لديك'] }, [
        item('box_jump', sets(4, '4'), ['Step down · rest 90 s', 'انزل خطوة خطوة · راحة 90 ث']),
        item('lunge_jump', sets(3, '6 / side'), ['Rest 90 s', 'راحة 90 ث']),
      ]),
      block(['Strength', 'القوة'], 'strength', {}, [
        item('goblet_squat', sets(4, '8'), ['1–2 reps left in the tank · rest 2 min', 'اترك تكرارًا أو اثنين · راحة 2 د']),
        item('nordic_curl', sets(3, '5'), ['Lower as slowly as you can · rest 90 s', 'انزل ببطء قدر ما تستطيع · راحة 90 ث']),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'padel-golden-point', level: 'advanced', format: 'for_time', minutes: 25, equipment: ['med_ball'],
    title: ['Golden Point Finisher', 'نقطة الحسم'],
    desc: ['Three hard rounds against the clock. Stay sharp when you are tired, like a deciding point.', 'ثلاث جولات قوية ضد الوقت. حافظ على تركيزك وأنت متعب، مثل نقطة الحسم.'],
    blocks: [
      warmCourt(6),
      block(['For time', 'ضد الوقت'], 'for_time', { minutes: 15, rounds: 3, note: ['3 rounds, 15 min cap. Write down your time.', '3 جولات، الحد 15 د. سجّل وقتك.'] }, [
        item('shuttle_run', meters(100)),
        item('med_ball_slam', reps('12')),
        item('lateral_shuffle', secs(30)),
        item('burpee', reps('10')),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'padel-full-court-strength', level: 'advanced', format: 'strength', minutes: 50, equipment: ['dumbbells', 'pull_up_bar', 'bench', 'med_ball'],
    title: ['Full-Court Strength', 'قوة الملعب الكامل'],
    desc: ['The whole body a padel player needs: hinge, press, pull, single leg and rotation, done heavy.', 'كل ما يحتاجه جسم لاعب البادل: انحناء ودفع وسحب وساق واحدة ودوران، بأوزان ثقيلة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('bike', mins(4)), item('band_pull_apart', reps('15')), item('hip_hinge', reps('10')), item('inchworm', reps('5'))]),
      block(MAIN, 'strength', {}, [
        item('romanian_deadlift', sets(4, '6'), ['1–2 reps left in the tank · rest 2 min', 'اترك تكرارًا أو اثنين · راحة 2 د']),
        item('push_press', sets(4, '6'), ['Rest 2 min', 'راحة 2 د']),
        item('pull_up', sets(4, '5–8'), ['Rest 90 s', 'راحة 90 ث']),
        item('bulgarian_split_squat', sets(3, '8 / side'), ['Rest 90 s', 'راحة 90 ث']),
      ]),
      block(['Finisher', 'الختام'], 'rounds', { rounds: 3, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('med_ball_rotational_throw', perSide(['6', '6'])),
        item('side_plank', perSide(secs(30))),
      ]),
      coolUpper,
    ],
  },
];
