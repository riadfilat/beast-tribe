// MMA: strength and conditioning for mixed martial artists, not technique. Five-minute rounds, getting
// down and up fast, strong hips and grip, carries, and a trunk that holds in scrambles.
// 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, sets, secs, mins, meters, perSide, WARM, MAIN, COOL } = require('../kit');

const warmMat = (minutes = 6) => block(WARM, 'flow', { minutes }, [
  item('jumping_jack', secs(45)),
  item('neck_rolls', secs(30)),
  item('hip_openers', perSide(['6', '6'])),
  item('inchworm', reps('4')),
]);
const coolHips = block(COOL, 'flow', { minutes: 5 }, [
  item('hip_flexor_stretch', perSide(secs(30))),
  item('figure_four_stretch', perSide(secs(30))),
  item('childs_pose', mins(1)),
]);
const coolUpper = block(COOL, 'flow', { minutes: 5 }, [
  item('neck_rolls', secs(30)),
  item('lat_stretch', perSide(secs(30))),
  item('chest_stretch', secs(30)),
  item('childs_pose', mins(1)),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'mma-ground-strength-basics', level: 'beginner', format: 'rounds', minutes: 20, equipment: [],
    title: ['Ground Strength Basics', 'أساسيات القوة على الأرض'],
    desc: ['Bodyweight strength for working on the mat: hips, push and a steady trunk. No equipment.', 'قوة بوزن الجسم للعمل على البساط: وركان ودفع وجذع ثابت. بلا معدات.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('march', mins(1)), item('cat_cow', reps('8')), item('hip_openers', perSide(['6', '6']))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('glute_bridge', reps('12'), ['Squeeze at the top for 1 s', 'اضغط الأرداف في الأعلى ثانية']),
        item('knee_push_up', reps('8')),
        item('bird_dog', perSide(['6', '6'])),
        item('air_squat', reps('12')),
        item('dead_bug', perSide(['6', '6'])),
      ]),
      coolHips,
    ],
  },
  {
    key: 'mma-down-and-up', level: 'beginner', format: 'rounds', minutes: 20, equipment: [],
    title: ['Down and Up', 'نزول ونهوض'],
    desc: ['Learn to drop to the floor and get back up with control. The base for every scramble.', 'تعلّم النزول إلى الأرض والنهوض بتحكّم. أساس كل تبادل سريع على الأرض.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('step_jack', secs(45)), item('arm_circles', reps('10')), item('leg_swings', perSide(['8', '8']))]),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('step_burpee', reps('6'), ['Step back, step in, stand tall', 'خطوة للخلف ثم للأمام وقف مستقيمًا']),
        item('inchworm', reps('4')),
        item('mountain_climber', secs(20)),
        item('reverse_lunge', perSide(['6', '6'])),
      ]),
      coolHips,
    ],
  },
  {
    key: 'mma-hips-for-the-mat', level: 'beginner', format: 'flow', minutes: 15, equipment: [],
    title: ['Hips for the Mat', 'وركان للبساط'],
    desc: ['Open, mobile hips for guard work and low stances. Slow, easy holds; good on rest days.', 'وركان منفتحان ومرنان للعمل على الأرض والوقفات المنخفضة. ثبات هادئ وسهل، مناسب لأيام الراحة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('march', mins(1)), item('leg_swings', perSide(['10', '10']))]),
      block(MAIN, 'flow', { minutes: 9, note: ['Breathe slowly, never force the range', 'تنفّس ببطء ولا تجبر المدى'] }, [
        item('hip_openers', perSide(['8', '8'])),
        item('worlds_greatest_stretch', perSide(['3', '3'])),
        item('cat_cow', reps('8')),
        item('thoracic_rotation', perSide(['6', '6'])),
        item('hip_flexor_stretch', perSide(secs(45))),
        item('figure_four_stretch', perSide(secs(45))),
      ]),
      block(COOL, 'flow', { minutes: 3 }, [item('childs_pose', mins(1)), item('hamstring_stretch', perSide(secs(30)))]),
    ],
  },
  {
    key: 'mma-grip-carry-start', level: 'beginner', format: 'rounds', minutes: 25, equipment: ['dumbbells', 'kettlebell', 'bench'],
    title: ['Grip and Carry Start', 'بداية القبضة والحمل'],
    desc: ['A stronger grip and a trunk that stays upright under load. Light weights, steady walks.', 'قبضة أقوى وجذع يبقى مستقيمًا تحت الحمل. أوزان خفيفة ومشي ثابت.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('march', mins(1)), item('kettlebell_halo', reps('6')), item('hip_hinge', reps('10'))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 75 s between rounds', 'راحة 75 ث بين الجولات'] }, [
        item('kettlebell_deadlift', reps('10'), ['Flat back, push the floor away', 'ظهر مستقيم، وادفع الأرض بقدميك']),
        item('farmer_carry', meters(30)),
        item('dumbbell_row', perSide(['10', '10'])),
        item('suitcase_carry', perSide(meters(20)), ['Do not lean toward the weight', 'لا تمِل نحو الوزن']),
      ]),
      coolUpper,
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'mma-five-minute-rounds', level: 'intermediate', format: 'intervals', minutes: 30, equipment: ['jump_rope'],
    title: ['Five-Minute Rounds', 'جولات الخمس دقائق'],
    desc: ['Three rounds of five minutes with a minute’s break, the length of a real MMA round.', 'ثلاث جولات من خمس دقائق مع دقيقة راحة، بطول جولة حقيقية في الفنون القتالية المختلطة.'],
    blocks: [
      warmMat(),
      block(MAIN, 'intervals', { rounds: 3, note: ['Walk 1 min between rounds', 'امشِ دقيقة بين الجولات'] }, [
        item('jump_rope', mins(1)),
        item('lateral_shuffle', mins(1)),
        item('step_burpee', mins(1)),
        item('mountain_climber', mins(1)),
        item('quick_feet', mins(1)),
        item('walk', mins(1)),
      ]),
      coolHips,
    ],
  },
  {
    key: 'mma-pull-and-grip', level: 'intermediate', format: 'strength', minutes: 40, equipment: ['pull_up_bar', 'band', 'dumbbells', 'bench', 'kettlebell'],
    title: ['Pull and Grip', 'السحب والقبضة'],
    desc: ['Pulling strength and a grip that does not let go, for clinches and holding position.', 'قوة سحب وقبضة لا تُفلت، للاشتباك والحفاظ على الوضعية.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('arm_circles', reps('10')), item('band_pull_apart', reps('15')), item('cat_cow', reps('8')), item('inchworm', reps('4'))]),
      block(MAIN, 'strength', {}, [
        item('band_pull_up', sets(4, '6'), ['Slow on the way down · rest 90 s', 'انزل ببطء · راحة 90 ث']),
        item('dumbbell_row', sets(3, '10 / side'), ['Rest 60 s', 'راحة 60 ث']),
        item('hanging_knee_raise', sets(3, '10'), ['No swinging · rest 60 s', 'بلا تأرجح · راحة 60 ث']),
        item('farmer_carry', sets(4, '30 m'), ['Heavy, tall posture · rest 60 s', 'وزن ثقيل ووقفة مستقيمة · راحة 60 ث']),
        item('suitcase_carry', sets(2, '20 m / side'), ['Rest 60 s', 'راحة 60 ث']),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'mma-hip-drive', level: 'intermediate', format: 'strength', minutes: 40, equipment: ['bench', 'barbell', 'dumbbells', 'kettlebell'],
    title: ['Hip Drive', 'دفع الوركين'],
    desc: ['Strong, explosive hips to bridge, stand up and drive forward. Single-leg work protects the knees.', 'وركان قويان وانفجاريان للدفع والنهوض والتقدّم. تمارين الساق الواحدة تحمي الركبتين.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('march', mins(1)), item('glute_bridge', reps('12')), item('hip_openers', perSide(['6', '6'])), item('air_squat', reps('10'))]),
      block(MAIN, 'strength', {}, [
        item('hip_thrust', sets(4, '8'), ['Pause 1 s at the top · rest 90 s', 'توقّف ثانية في الأعلى · راحة 90 ث']),
        item('kettlebell_swing', sets(4, '15'), ['Snap the hips · rest 60 s', 'ادفع الوركين بقوة · راحة 60 ث']),
        item('bulgarian_split_squat', sets(3, '8 / side'), ['Rest 90 s', 'راحة 90 ث']),
        item('side_plank', sets(3, '30 s / side'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      coolHips,
    ],
  },
  {
    key: 'mma-scramble-core', level: 'intermediate', format: 'rounds', minutes: 30, equipment: ['med_ball'],
    title: ['Scramble Core', 'جذع التبادلات السريعة'],
    desc: ['A trunk that twists, braces and recovers fast, the way you fight for position on the ground.', 'جذع يلتف ويثبت ويستعيد نفسه بسرعة، كما تقاتل على الوضعية على الأرض.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('cat_cow', reps('8')), item('thoracic_rotation', perSide(['8', '8'])), item('mountain_climber', secs(20))]),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('plank_shoulder_tap', perSide(['10', '10'])),
        item('bicycle_crunch', perSide(['12', '12'])),
        item('russian_twist', perSide(['10', '10'])),
        item('hollow_hold', secs(20)),
        item('med_ball_slam', reps('10')),
      ]),
      coolHips,
    ],
  },

  // ───── Advanced ─────
  {
    key: 'mma-five-hard-rounds', level: 'advanced', format: 'intervals', minutes: 45, equipment: ['med_ball', 'kettlebell'],
    title: ['Five Hard Rounds', 'خمس جولات قوية'],
    desc: ['A full championship fight on your legs: five rounds of five minutes, one minute between them.', 'نزال بطولة كامل: خمس جولات من خمس دقائق ودقيقة بينها.'],
    blocks: [
      warmMat(8),
      block(MAIN, 'intervals', { rounds: 5, note: ['Walk 1 min between rounds. Hold your pace to the end.', 'امشِ دقيقة بين الجولات. حافظ على إيقاعك حتى النهاية.'] }, [
        item('burpee', mins(1)),
        item('med_ball_slam', mins(1)),
        item('mountain_climber', mins(1)),
        item('kettlebell_swing', mins(1)),
        item('shuttle_run', mins(1)),
        item('walk', mins(1)),
      ]),
      coolHips,
    ],
  },
  {
    key: 'mma-heavy-strength', level: 'advanced', format: 'strength', minutes: 55, equipment: ['barbell', 'rack', 'pull_up_bar', 'dumbbells', 'rower'],
    title: ['Heavy Strength', 'القوة الثقيلة'],
    desc: ['Heavy barbell work for raw strength, then pull-ups and a heavy carry for grip.', 'تمارين ثقيلة بالبار لقوة خام، ثم العقلة وحمل ثقيل للقبضة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('rower', mins(4)), item('hip_hinge', reps('10')), item('air_squat', reps('10')), item('inchworm', reps('5'))]),
      block(MAIN, 'strength', {}, [
        item('deadlift', sets(5, '3'), ['1–2 reps left in the tank · rest 2–3 min', 'اترك تكرارًا أو اثنين · راحة 2–3 د']),
        item('front_squat', sets(4, '5'), ['Rest 2 min', 'راحة 2 د']),
        item('pull_up', sets(4, '6–8'), ['Rest 90 s', 'راحة 90 ث']),
        item('barbell_row', sets(3, '8'), ['Rest 90 s', 'راحة 90 ث']),
      ]),
      block(['Finisher', 'الختام'], 'rounds', { rounds: 3, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('farmer_carry', meters(40), ['As heavy as you can hold', 'أثقل وزن تستطيع حمله']),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'mma-grind-emom', level: 'advanced', format: 'emom', minutes: 36, equipment: ['kettlebell', 'pull_up_bar'],
    title: ['The Grind', 'الطحن'],
    desc: ['Twenty-four minutes, a new move every minute. Steady, relentless work like a long grappling exchange.', 'أربع وعشرون دقيقة، حركة جديدة كل دقيقة. عمل ثابت لا يتوقف مثل اشتباك طويل على الأرض.'],
    blocks: [
      warmMat(7),
      block(MAIN, 'emom', { minutes: 24, note: ['Finish the work, rest what is left of the minute', 'أنهِ الحركة وارتح ما تبقّى من الدقيقة'] }, [
        item('burpee', reps('10')),
        item('kettlebell_swing', reps('15')),
        item('pull_up', reps('6')),
        item('suitcase_carry', perSide(meters(20))),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'mma-carry-medley', level: 'advanced', format: 'for_time', minutes: 35, equipment: ['dumbbells', 'kettlebell', 'sled'],
    title: ['Carry Medley', 'تشكيلة الحمل والدفع'],
    desc: ['Carries, a heavy sled and floor work against the clock. Grip, legs and lungs all at once.', 'حمل ودفع زلاجة ثقيلة وعمل على الأرض ضد الوقت. القبضة والساقان والرئتان معًا.'],
    blocks: [
      warmMat(7),
      block(['For time', 'ضد الوقت'], 'for_time', { minutes: 20, rounds: 4, note: ['4 rounds, 20 min cap. Write down your time.', '4 جولات، الحد 20 د. سجّل وقتك.'] }, [
        item('farmer_carry', meters(40)),
        item('sled_push', meters(20)),
        item('suitcase_carry', perSide(meters(20))),
        item('plank_shoulder_tap', perSide(['10', '10'])),
        item('burpee', reps('10')),
      ]),
      coolHips,
    ],
  },
];
