// Boxing: strength and conditioning for boxers, not technique. Round-based engine, light quick feet,
// a rotating trunk, and a neck and shoulders that last. 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, sets, secs, mins, meters, perSide, WARM, MAIN, COOL } = require('../kit');

const warmRing = (minutes = 6) => block(WARM, 'flow', { minutes }, [
  item('jumping_jack', secs(45)),
  item('neck_rolls', secs(30)),
  item('arm_circles', reps('10')),
  item('quick_feet', secs(20)),
]);
const coolUpper = block(COOL, 'flow', { minutes: 5 }, [
  item('neck_rolls', secs(30)),
  item('chest_stretch', secs(30)),
  item('lat_stretch', perSide(secs(30))),
  item('childs_pose', mins(1)),
]);
const coolLegs = block(COOL, 'flow', { minutes: 5 }, [
  item('calf_stretch', perSide(secs(30))),
  item('hip_flexor_stretch', perSide(secs(30))),
  item('chest_stretch', secs(30)),
]);
const roundRest = ['Walk 1 min between rounds, like the break in the corner', 'امشِ دقيقة بين الجولات، مثل الاستراحة في الزاوية'];

module.exports = [
  // ───── Beginner ─────
  {
    key: 'boxing-footwork-basics', level: 'beginner', format: 'intervals', minutes: 18, equipment: [],
    title: ['Footwork Basics', 'أساسيات حركة القدمين'],
    desc: ['Stay light on the balls of your feet and move without crossing them. Short bursts, full recovery.', 'ابقَ خفيفًا على مقدمة قدميك وتحرّك دون أن تتقاطعا. دفعات قصيرة واستشفاء كامل.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('march', mins(1)), item('step_jack', secs(45)), item('ankle_mobility', perSide(['8', '8']))]),
      block(MAIN, 'intervals', { rounds: 5, note: ['Walk slowly to recover after each round', 'امشِ ببطء للاستشفاء بعد كل جولة'] }, [
        item('lateral_shuffle', secs(20), ['Stay low, feet never touch', 'ابقَ منخفضًا ولا تتلامس القدمان']),
        item('quick_feet', secs(20)),
        item('walk', secs(60)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'boxing-rope-start', level: 'beginner', format: 'intervals', minutes: 20, equipment: ['jump_rope'],
    title: ['Rope Start', 'بداية نط الحبل'],
    desc: ['The boxer’s first tool: one minute on the rope, one minute walking. Build rhythm before speed.', 'أداة الملاكم الأولى: دقيقة على الحبل ودقيقة مشي. ابنِ الإيقاع قبل السرعة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('march', mins(1)), item('calf_raise', reps('15')), item('shoulder_rolls', secs(30))]),
      block(MAIN, 'intervals', { rounds: 6, note: ['Small jumps, wrists turn the rope', 'قفزات صغيرة، والمعصمان يديران الحبل'] }, [
        item('jump_rope', mins(1)),
        item('walk', mins(1)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'boxing-guard-core', level: 'beginner', format: 'rounds', minutes: 20, equipment: ['band'],
    title: ['Guard Core', 'جذع ثابت للدفاع'],
    desc: ['A trunk that stays solid when you take a shot. Slow holds and anti-rotation, nothing fast.', 'جذع يبقى صلبًا حين تتلقى ضربة. ثبات بطيء ومقاومة للدوران، لا شيء سريع.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('cat_cow', reps('8')), item('thoracic_rotation', perSide(['6', '6'])), item('arm_circles', reps('10'))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('dead_bug', perSide(['6', '6']), ['Lower back stays on the floor', 'أسفل الظهر يبقى ملاصقًا للأرض']),
        item('pallof_press', perSide(['10', '10']), ['Do not let the band turn you', 'لا تدع الشريط يُديرك']),
        item('bird_dog', perSide(['6', '6'])),
        item('knee_plank', secs(30)),
      ]),
      block(COOL, 'flow', { minutes: 3 }, [item('childs_pose', mins(1)), item('figure_four_stretch', perSide(secs(30)))]),
    ],
  },
  {
    key: 'boxing-neck-shoulder-care', level: 'beginner', format: 'rounds', minutes: 15, equipment: ['band'],
    title: ['Neck and Shoulder Care', 'العناية بالرقبة والكتفين'],
    desc: ['Keeps the neck and shoulders healthy for long rounds. Good on rest days or before training.', 'يحافظ على صحة الرقبة والكتفين في الجولات الطويلة. مناسب لأيام الراحة أو قبل التدريب.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('shoulder_rolls', secs(30)), item('neck_rolls', secs(30)), item('arm_circles', reps('10'))]),
      block(MAIN, 'rounds', { rounds: 2, note: ['Light band, slow and smooth', 'شريط خفيف، ببطء وسلاسة'] }, [
        item('band_pull_apart', reps('15')),
        item('neck_rolls', secs(45), ['Slow half circles, no pain', 'أنصاف دوائر بطيئة، بلا ألم']),
        item('thoracic_rotation', perSide(['6', '6'])),
        item('plank', secs(20)),
      ]),
      block(COOL, 'flow', { minutes: 3 }, [item('chest_stretch', secs(30)), item('lat_stretch', perSide(secs(30)))]),
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'boxing-three-minute-rounds', level: 'intermediate', format: 'intervals', minutes: 32, equipment: ['jump_rope'],
    title: ['Three-Minute Rounds', 'جولات الثلاث دقائق'],
    desc: ['Five rounds of three minutes with a minute’s break, the real rhythm of a boxing bout.', 'خمس جولات من ثلاث دقائق مع دقيقة راحة، الإيقاع الحقيقي لنزال الملاكمة.'],
    blocks: [
      warmRing(),
      block(MAIN, 'intervals', { rounds: 5, note: roundRest }, [
        item('jump_rope', mins(1)),
        item('lateral_shuffle', secs(45)),
        item('quick_feet', secs(30)),
        item('mountain_climber', secs(45)),
        item('walk', mins(1)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'boxing-rotation-power', level: 'intermediate', format: 'rounds', minutes: 30, equipment: ['med_ball', 'band'],
    title: ['Fighter Rotation Power', 'قوة الدوران للمقاتل'],
    desc: ['Power comes from the hips and trunk turning together. Throws, twists and anti-rotation holds.', 'القوة تأتي من دوران الوركين والجذع معًا. رميات والتواءات وثبات ضد الدوران.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('thoracic_rotation', perSide(['8', '8'])), item('worlds_greatest_stretch', perSide(['3', '3'])), item('band_pull_apart', reps('12'))]),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('med_ball_rotational_throw', perSide(['6', '6']), ['Turn the back foot, hips lead', 'دوّر القدم الخلفية، والوركان يقودان']),
        item('russian_twist', perSide(['10', '10'])),
        item('pallof_press', perSide(['10', '10'])),
        item('med_ball_slam', reps('8')),
        item('side_plank', perSide(secs(25))),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'boxing-fighter-strength', level: 'intermediate', format: 'strength', minutes: 40, equipment: ['kettlebell', 'dumbbells', 'bench'],
    title: ['Fighter Strength', 'قوة المقاتل'],
    desc: ['Whole-body strength without bulk: legs, push, pull and a strong back to hold your stance.', 'قوة للجسم كله دون تضخيم: ساقان ودفع وسحب وظهر قوي يثبّت وقفتك.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('jumping_jack', mins(1)), item('kettlebell_halo', reps('8')), item('hip_hinge', reps('10')), item('inchworm', reps('4'))]),
      block(MAIN, 'strength', {}, [
        item('goblet_squat', sets(3, '10'), ['2 reps left in the tank · rest 90 s', 'اترك تكرارين · راحة 90 ث']),
        item('push_up', sets(3, '10–12'), ['Rest 60 s', 'راحة 60 ث']),
        item('dumbbell_row', sets(3, '10 / side'), ['Rest 60 s', 'راحة 60 ث']),
        item('romanian_deadlift', sets(3, '10'), ['Rest 90 s', 'راحة 90 ث']),
        item('overhead_press', sets(3, '8'), ['Rest 60 s', 'راحة 60 ث']),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'boxing-roadwork', level: 'intermediate', format: 'intervals', minutes: 35, equipment: [],
    title: ['Roadwork', 'الجري الصباحي للملاكم'],
    desc: ['The classic boxer’s run: steady running with short sprints to build the engine for late rounds.', 'جري الملاكم الكلاسيكي: جري ثابت مع عدْو قصير لبناء اللياقة للجولات الأخيرة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('easy_jog', mins(4)), item('leg_swings', perSide(['10', '10'])), item('skips', meters(20))]),
      block(MAIN, 'intervals', { rounds: 6, note: ['Sprint hard, then walk until breathing settles', 'اعدُ بقوة، ثم امشِ حتى يهدأ تنفّسك'] }, [
        item('run', mins(2)),
        item('sprint', secs(20)),
        item('walk', secs(70)),
      ]),
      block(COOL, 'flow', { minutes: 5 }, [item('walk', mins(2)), item('calf_stretch', perSide(secs(30))), item('hamstring_stretch', perSide(secs(30)))]),
    ],
  },

  // ───── Advanced ─────
  {
    key: 'boxing-championship-rounds', level: 'advanced', format: 'intervals', minutes: 45, equipment: ['jump_rope'],
    title: ['Championship Rounds', 'جولات البطولة'],
    desc: ['Eight hard rounds of three minutes. Built for the late rounds, when legs and lungs are tested.', 'ثماني جولات قوية من ثلاث دقائق. مصمَّم للجولات الأخيرة حين تُختبر الساقان والرئتان.'],
    blocks: [
      warmRing(7),
      block(MAIN, 'intervals', { rounds: 8, note: roundRest }, [
        item('jump_rope', mins(1), ['Double speed for the last 15 s', 'ضاعف السرعة في آخر 15 ث']),
        item('lateral_shuffle', secs(30)),
        item('burpee', secs(30)),
        item('mountain_climber', secs(30)),
        item('quick_feet', secs(30)),
        item('walk', mins(1)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'boxing-power-strength', level: 'advanced', format: 'strength', minutes: 50, equipment: ['med_ball', 'barbell', 'dumbbells', 'pull_up_bar', 'jump_rope', 'band'],
    title: ['Power and Strength', 'القوة الانفجارية والقوة'],
    desc: ['Explosive throws while you are fresh, then heavy pulls and presses. For boxers who want a harder hit.', 'رميات انفجارية وأنت نشيط، ثم سحب ودفع بأوزان ثقيلة. للملاكم الذي يريد ضربة أقوى.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('jump_rope', mins(3)), item('band_pull_apart', reps('15')), item('hip_hinge', reps('10')), item('inchworm', reps('5'))]),
      block(['Power', 'القوة الانفجارية'], 'strength', { note: ['Full rest: every throw at full speed', 'راحة كاملة: كل رمية بأقصى سرعة'] }, [
        item('med_ball_rotational_throw', sets(4, '5 / side'), ['Rest 60 s', 'راحة 60 ث']),
        item('med_ball_slam', sets(3, '6'), ['Rest 60 s', 'راحة 60 ث']),
      ]),
      block(['Strength', 'القوة'], 'strength', {}, [
        item('deadlift', sets(4, '5'), ['1–2 reps left in the tank · rest 2 min', 'اترك تكرارًا أو اثنين · راحة 2 د']),
        item('push_press', sets(4, '5'), ['Drive from the legs · rest 2 min', 'ادفع من الساقين · راحة 2 د']),
        item('pull_up', sets(4, '5–8'), ['Rest 90 s', 'راحة 90 ث']),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'boxing-final-round', level: 'advanced', format: 'amrap', minutes: 30, equipment: ['med_ball', 'jump_rope'],
    title: ['Final Round', 'الجولة الأخيرة'],
    desc: ['Fifteen minutes, as many rounds as you can. Keep moving and stay sharp when you are tired.', 'خمس عشرة دقيقة، أكبر عدد ممكن من الجولات. استمر في الحركة وابقَ حادًّا وأنت متعب.'],
    blocks: [
      warmRing(7),
      block(['AMRAP', 'أكبر عدد من الجولات'], 'amrap', { minutes: 15, note: ['Steady pace, count your rounds', 'إيقاع ثابت، واحسب جولاتك'] }, [
        item('jump_rope', secs(45)),
        item('burpee', reps('8')),
        item('med_ball_slam', reps('10')),
        item('russian_twist', perSide(['10', '10'])),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'boxing-iron-guard', level: 'advanced', format: 'rounds', minutes: 35, equipment: ['bench', 'cable', 'band'],
    title: ['Iron Guard', 'الدفاع الحديدي'],
    desc: ['Hard core holds and upper-back work so you keep your shape deep into a fight.', 'ثبات قوي للجذع وتمارين للظهر العلوي لتحافظ على وضعيتك حتى آخر النزال.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('neck_rolls', secs(30)), item('shoulder_rolls', secs(30)), item('cat_cow', reps('8')), item('band_pull_apart', reps('15'))]),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('hollow_hold', secs(30)),
        item('copenhagen_plank', perSide(secs(20))),
        item('face_pull', reps('15'), ['Pause with hands by your ears', 'توقّف واليدان بجانب الأذنين']),
        item('plank_shoulder_tap', perSide(['10', '10'])),
        item('pallof_press', perSide(['12', '12'])),
      ]),
      coolUpper,
    ],
  },
];
