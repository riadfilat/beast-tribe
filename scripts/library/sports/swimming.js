// Swimming (dryland only: the library has no pool strokes): pulling strength for the catch, shoulder
// care, a tight streamline core, legs for starts and turns, and mobile shoulders and upper back.
// 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, sets, secs, mins, meters, perSide, WARM, MAIN, COOL } = require('../kit');

const warmShoulders = (minutes = 5) => block(WARM, 'flow', { minutes }, [
  item('jumping_jack', mins(1)),
  item('arm_circles', secs(30)),
  item('shoulder_rolls', secs(30)),
  item('band_pull_apart', reps('12')),
  item('thoracic_rotation', perSide(['6', '6'])),
]);
const coolUpper = block(COOL, 'flow', { minutes: 5 }, [
  item('lat_stretch', perSide(secs(30))),
  item('chest_stretch', secs(45)),
  item('childs_pose', mins(1)),
]);
const coolLegs = block(COOL, 'flow', { minutes: 5 }, [
  item('quad_stretch', perSide(secs(30))),
  item('hamstring_stretch', perSide(secs(30))),
  item('calf_stretch', perSide(secs(30))),
  item('lat_stretch', perSide(secs(30))),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'swimming-dryland-shoulder-care', level: 'beginner', format: 'rounds', minutes: 15, equipment: ['band'],
    title: ['Dryland Shoulder Care', 'العناية بالكتف خارج الماء'],
    desc: ['Light band work for the muscles that keep a swimmer\'s shoulder stable. Do it before every swim.', 'تمارين خفيفة بشريط المقاومة للعضلات التي تثبّت كتف السبّاح. نفّذه قبل كل سباحة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('shoulder_rolls', secs(30)), item('arm_circles', secs(30)), item('neck_rolls', secs(30))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Light band, slow and smooth · rest 30 s', 'شريط خفيف، ببطء وسلاسة · راحة 30 ث'] }, [
        item('band_pull_apart', reps('15'), ['Squeeze the shoulder blades, no shrugging', 'اضغط لوحي الكتف دون رفع الكتفين']),
        item('pallof_press', perSide(['8', '8'])),
        item('thoracic_rotation', perSide(['6', '6'])),
        item('bird_dog', perSide(['6', '6']), ['Reach long like a streamline', 'تمدّد طويلًا كوضعية الانسياب']),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'swimming-dryland-core-basics', level: 'beginner', format: 'rounds', minutes: 20, equipment: [],
    title: ['Streamline Core Basics', 'أساسيات جذع الانسياب'],
    desc: ['A tight, flat body glides further with less effort. Simple holds for new swimmers, done on dry land.', 'الجسم المشدود والمستقيم ينساب أبعد بجهد أقل. ثبات بسيط للسبّاحين الجدد، خارج الماء.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('cat_cow', reps('8')), item('dead_bug', perSide(['4', '4'])), item('glute_bridge', reps('8'))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('dead_bug', perSide(['8', '8']), ['Lower back stays on the floor', 'أسفل الظهر ملتصق بالأرض']),
        item('knee_plank', secs(30)),
        item('bird_dog', perSide(['6', '6'])),
        item('glute_bridge', reps('12')),
        item('side_plank', perSide(secs(15))),
      ]),
      block(COOL, 'flow', { minutes: 3 }, [item('childs_pose', mins(1)), item('hip_flexor_stretch', perSide(secs(30)))]),
    ],
  },
  {
    key: 'swimming-first-pull-strength', level: 'beginner', format: 'strength', minutes: 30, equipment: ['cable', 'dumbbells', 'bench', 'band'],
    title: ['First Pulling Strength', 'أول قوة سحب للسبّاح'],
    desc: ['The pull of every stroke comes from the lats and upper back. Light gym work to start building it, on dry land.', 'سحب كل ضربة في الماء يأتي من عضلات الظهر العريضة وأعلاه. تمارين خفيفة في النادي لبدء بنائه خارج الماء.'],
    blocks: [
      warmShoulders(),
      block(MAIN, 'strength', {}, [
        item('lat_pulldown', sets(3, '10'), ['Pull to the upper chest, elbows down · rest 75 s', 'اسحب إلى أعلى الصدر والمرفقان للأسفل · راحة 75 ث']),
        item('dumbbell_row', sets(3, '10 / side'), ['Rest 60 s', 'راحة 60 ث']),
        item('incline_push_up', sets(3, '10'), ['Rest 60 s', 'راحة 60 ث']),
        item('band_pull_apart', sets(2, '15'), ['Rest 30 s', 'راحة 30 ث']),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'swimming-mobility', level: 'beginner', format: 'flow', minutes: 20, equipment: [],
    title: ["Swimmer's Mobility", 'مرونة السبّاح'],
    desc: ['Opens the shoulders, upper back and hips so you can reach long and rotate in the water. Good on rest days.', 'يفتح الكتفين وأعلى الظهر والوركين لتصل أبعد وتدور بسهولة في الماء. مناسب لأيام الراحة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('walk', mins(2)), item('shoulder_rolls', secs(30)), item('arm_circles', secs(30))]),
      block(MAIN, 'flow', { minutes: 12, note: ['Breathe slowly, move to a gentle stretch only', 'تنفّس ببطء وتحرّك حتى إطالة خفيفة فقط'] }, [
        item('cat_cow', reps('8')),
        item('thoracic_rotation', perSide(['8', '8'])),
        item('worlds_greatest_stretch', perSide(['3', '3'])),
        item('lat_stretch', perSide(secs(40))),
        item('chest_stretch', secs(45)),
        item('ankle_mobility', perSide(['8', '8'])),
      ]),
      block(COOL, 'flow', { minutes: 3 }, [item('childs_pose', mins(1)), item('figure_four_stretch', perSide(secs(30)))]),
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'swimming-pull-strength', level: 'intermediate', format: 'strength', minutes: 40, equipment: ['pull_up_bar', 'band', 'dumbbells', 'bench', 'cable'],
    title: ['Dryland Pull Strength', 'قوة السحب خارج الماء'],
    desc: ['Assisted pull-ups, rows and face pulls for a stronger catch and healthier shoulders. For swimmers who train most weeks.', 'عقلة بمساعدة الشريط وسحب وسحب نحو الوجه لقبضة أقوى في الماء وكتفين أسلم. للسبّاحين الذين يتدرّبون معظم الأسابيع.'],
    blocks: [
      warmShoulders(6),
      block(MAIN, 'strength', {}, [
        item('band_pull_up', sets(4, '6'), ['Full hang at the bottom · rest 90 s', 'تعلّق كامل في الأسفل · راحة 90 ث']),
        item('dumbbell_row', sets(3, '10 / side'), ['Rest 60 s', 'راحة 60 ث']),
        item('face_pull', sets(3, '15'), ['Rest 45 s', 'راحة 45 ث']),
        item('hanging_knee_raise', sets(3, '10'), ['No swinging · rest 45 s', 'دون تأرجح · راحة 45 ث']),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'swimming-push-off-power', level: 'intermediate', format: 'strength', minutes: 35, equipment: ['kettlebell', 'box'],
    title: ['Push-Off Power', 'قوة الدفع من الجدار'],
    desc: ['Stronger, springier legs for faster starts and turns off the wall. Dryland leg work for swimmers.', 'ساقان أقوى وأكثر انفجارًا لانطلاقات ودورات أسرع عند الجدار. تمارين ساقين خارج الماء للسبّاحين.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('jumping_jack', mins(1)), item('leg_swings', perSide(['10', '10'])), item('air_squat', reps('10')), item('ankle_mobility', perSide(['8', '8']))]),
      block(MAIN, 'strength', {}, [
        item('jump_squat', sets(4, '5'), ['Arms overhead in a streamline, land softly · rest 75 s', 'الذراعان فوق الرأس بوضعية الانسياب واهبط بنعومة · راحة 75 ث']),
        item('goblet_squat', sets(3, '10'), ['2 reps left in the tank · rest 90 s', 'اترك تكرارين · راحة 90 ث']),
        item('step_up', sets(3, '8 / side'), ['Rest 60 s', 'راحة 60 ث']),
        item('calf_raise', sets(3, '15'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'swimming-streamline-core', level: 'intermediate', format: 'rounds', minutes: 30, equipment: ['med_ball'],
    title: ['Streamline and Rotation Core', 'جذع الانسياب والدوران'],
    desc: ['Hollow holds for a flat body and rotation work for freestyle and backstroke. Harder than the basics.', 'ثبات القارب لجسم مستقيم وحركات دوران للسباحة الحرة وسباحة الظهر. أصعب من الأساسيات.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('cat_cow', reps('8')), item('thoracic_rotation', perSide(['6', '6'])), item('dead_bug', perSide(['6', '6']))]),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('hollow_hold', secs(25), ['Arms overhead, lower back down', 'الذراعان فوق الرأس وأسفل الظهر ملتصق']),
        item('russian_twist', perSide(['10', '10'])),
        item('side_plank', perSide(secs(30))),
        item('plank_shoulder_tap', perSide(['10', '10'])),
      ]),
      block(COOL, 'flow', { minutes: 4 }, [item('childs_pose', mins(1)), item('lat_stretch', perSide(secs(30))), item('hip_flexor_stretch', perSide(secs(30)))]),
    ],
  },
  {
    key: 'swimming-dryland-engine', level: 'intermediate', format: 'intervals', minutes: 35, equipment: ['rower', 'jump_rope'],
    title: ['Dryland Engine', 'لياقة خارج الماء'],
    desc: ['Rowing and rope intervals to build fitness when you can\'t get to the pool. Pull and kick, on dry land.', 'فترات على جهاز التجديف ونط الحبل لبناء اللياقة حين لا تصل إلى المسبح. سحب وركل خارج الماء.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('rower', mins(3), ['Easy pace', 'إيقاع خفيف']), item('arm_circles', secs(30)), item('leg_swings', perSide(['8', '8']))]),
      block(MAIN, 'intervals', { rounds: 6, note: ['Strong, even pace every round', 'إيقاع قوي ومتساوٍ في كل جولة'] }, [
        item('rower', secs(90)),
        item('jump_rope', secs(45)),
        item('walk', secs(45)),
      ]),
      coolLegs,
    ],
  },

  // ───── Advanced ─────
  {
    key: 'swimming-dryland-strength', level: 'advanced', format: 'strength', minutes: 55, equipment: ['pull_up_bar', 'barbell', 'dumbbells', 'cable', 'band'],
    title: ['Heavy Dryland Strength', 'القوة الثقيلة خارج الماء'],
    desc: ['Strict pull-ups, heavy rows and hinges for powerful strokes and a strong body line. For experienced swimmers in the gym.', 'عقلة صارمة وسحب ثقيل وانحناء لضربات قوية وجسم مستقيم في الماء. للسبّاحين المتمرّسين في النادي.'],
    blocks: [
      warmShoulders(8),
      block(MAIN, 'strength', {}, [
        item('pull_up', sets(5, '5'), ['Full hang to chin over the bar · rest 2 min', 'من التعلق الكامل حتى الذقن فوق العارضة · راحة 2 د']),
        item('barbell_row', sets(4, '6'), ['Back flat, pull to the belly · rest 2 min', 'الظهر مستقيم واسحب نحو البطن · راحة 2 د']),
        item('romanian_deadlift', sets(3, '8'), ['Rest 90 s', 'راحة 90 ث']),
        item('face_pull', sets(3, '15'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      block(['Core', 'الجذع'], 'rounds', { rounds: 3, note: ['Rest 30 s between rounds', 'راحة 30 ث بين الجولات'] }, [
        item('hollow_hold', secs(30)),
        item('pallof_press', perSide(['10', '10'])),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'swimming-race-pace-emom', level: 'advanced', format: 'emom', minutes: 36, equipment: ['rower', 'med_ball', 'pull_up_bar', 'band'],
    title: ['Race-Pace EMOM', 'إيقاع السباق كل دقيقة'],
    desc: ['Twenty-four minutes of hard pulling and full-body work, a new move every minute. Dryland fitness for race season.', 'أربع وعشرون دقيقة من السحب القوي وحركات الجسم كله، حركة جديدة كل دقيقة. لياقة خارج الماء لموسم السباقات.'],
    blocks: [
      block(WARM, 'flow', { minutes: 7 }, [item('rower', mins(3), ['Easy pace', 'إيقاع خفيف']), item('band_pull_apart', reps('12')), item('inchworm', reps('4')), item('jump_squat', reps('5'))]),
      block(MAIN, 'emom', { minutes: 24, note: ['Finish the work, rest what is left of the minute', 'أنهِ الحركة وارتح ما تبقّى من الدقيقة'] }, [
        item('rower', secs(40), ['Hard', 'بقوة']),
        item('med_ball_slam', reps('12')),
        item('pull_up', reps('6'), ['Use a band if you need it', 'استعن بشريط المقاومة إن احتجت']),
        item('burpee', reps('8')),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'swimming-start-turn-power', level: 'advanced', format: 'strength', minutes: 50, equipment: ['box', 'barbell', 'rack', 'kettlebell'],
    title: ['Start and Turn Power', 'قوة الانطلاق والدوران'],
    desc: ['Box jumps, heavy squats and swings: the leg and hip power that wins the first 15 metres off the block and the wall.', 'قفز على الصندوق وسكوات ثقيل وأرجحة: قوة الساقين والوركين التي تحسم أول 15 مترًا من منصة الانطلاق والجدار.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('jumping_jack', mins(1)), item('leg_swings', perSide(['10', '10'])), item('air_squat', reps('10')), item('hip_hinge', reps('10')), item('jump_squat', reps('5'))]),
      block(['Power', 'القوة الانفجارية'], 'strength', { note: ['Full rest: every jump should be your best', 'راحة كاملة: كل قفزة يجب أن تكون أفضل ما لديك'] }, [
        item('box_jump', sets(5, '3'), ['Arms swing up into a streamline · step down · rest 90 s', 'أرجح الذراعين إلى وضعية الانسياب · انزل خطوة · راحة 90 ث']),
        item('kettlebell_swing', sets(4, '12'), ['Snap the hips · rest 75 s', 'ادفع الوركين بقوة · راحة 75 ث']),
      ]),
      block(['Strength', 'القوة'], 'strength', {}, [
        item('back_squat', sets(4, '5'), ['1–2 reps left in the tank · rest 2–3 min', 'اترك تكرارًا أو اثنين · راحة 2–3 د']),
        item('single_leg_calf_raise', sets(3, '12 / side'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'swimming-dryland-test-set', level: 'advanced', format: 'for_time', minutes: 40, equipment: ['rower', 'pull_up_bar', 'kettlebell', 'band'],
    title: ['Dryland Test Set', 'مجموعة الاختبار خارج الماء'],
    desc: ['Four rounds against the clock of rowing, pulling and swings. Repeat it every few weeks to track your dryland fitness.', 'أربع جولات ضد الوقت من التجديف والعقلة والأرجحة. كرّره كل بضعة أسابيع لتتابع لياقتك خارج الماء.'],
    blocks: [
      block(WARM, 'flow', { minutes: 7 }, [item('rower', mins(3), ['Easy pace', 'إيقاع خفيف']), item('band_pull_apart', reps('12')), item('hip_hinge', reps('10')), item('kettlebell_swing', reps('8'), ['Light', 'وزن خفيف'])]),
      block(['For time', 'ضد الوقت'], 'for_time', { minutes: 25, rounds: 4, note: ['4 rounds, 25 min cap. Write down your time.', '4 جولات، الحد 25 د. سجّل وقتك.'] }, [
        item('rower', meters(500)),
        item('pull_up', reps('8'), ['Use a band if you need it', 'استعن بشريط المقاومة إن احتجت']),
        item('kettlebell_swing', reps('15')),
        item('hollow_hold', secs(30)),
      ]),
      coolUpper,
    ],
  },
];
