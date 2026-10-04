// Pilates: controlled core and posture work at a slow tempo. Breathe out on the effort, move one
// segment at a time, quality over reps. 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, sets, secs, mins, perSide, WARM, MAIN, COOL } = require('../kit');

const slow = ['3 s down, 1 s pause, 3 s up', '3 ث نزولًا، ثانية توقّف، 3 ث صعودًا'];
const centre = (minutes = 4) => block(WARM, 'flow', { minutes, note: ['Breathe into the ribs, exhale and draw the belly in', 'تنفّس نحو الأضلاع، ثم ازفر واسحب البطن للداخل'] }, [
  item('cat_cow', reps('8'), ['One vertebra at a time', 'فقرة بعد فقرة']),
  item('shoulder_rolls', secs(30)),
  item('dead_bug', perSide(['4', '4']), ['Very slow', 'ببطء شديد']),
]);
const lengthen = (minutes = 4) => block(COOL, 'flow', { minutes }, [
  item('childs_pose', mins(1)),
  item('figure_four_stretch', perSide(secs(30))),
  item('hamstring_stretch', perSide(secs(30))),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'pilates-core-foundations', level: 'beginner', format: 'rounds', minutes: 20, equipment: [],
    title: ['Pilates Core Foundations', 'أساسيات الجذع في البيلاتس'],
    desc: ['Find your deep core and learn to keep the lower back steady. The starting point for Pilates.', 'اكتشف عضلات الجذع العميقة وتعلّم تثبيت أسفل الظهر. نقطة البداية في البيلاتس.'],
    blocks: [
      centre(),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('dead_bug', perSide(['6', '6']), ['Exhale as the arm and leg reach', 'ازفر عند امتداد الذراع والرجل']),
        item('bird_dog', perSide(['6', '6']), ['Hold 2 s, hips stay level', 'اثبت ثانيتين والوركان مستويان']),
        item('glute_bridge', reps('10'), ['Peel the spine up and down slowly', 'ارفع العمود الفقري وأنزله ببطء']),
        item('knee_plank', secs(30)),
      ]),
      lengthen(),
    ],
  },
  {
    key: 'pilates-posture-reset', level: 'beginner', format: 'rounds', minutes: 15, equipment: ['band'],
    title: ['Posture Reset', 'تصحيح القوام'],
    desc: ['Open the chest and wake up the upper back to stand taller. Ideal after hours of sitting.', 'افتح الصدر ونشّط أعلى الظهر لتقف أطول. مثالي بعد ساعات من الجلوس.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('shoulder_rolls', secs(30)), item('neck_rolls', secs(30)), item('cat_cow', reps('6'))]),
      block(MAIN, 'rounds', { rounds: 2, note: ['Slow and smooth, shoulders down', 'ببطء وسلاسة، والكتفان للأسفل'] }, [
        item('band_pull_apart', reps('12'), ['Squeeze the shoulder blades for 2 s', 'اضغط لوحي الكتف ثانيتين']),
        item('thoracic_rotation', perSide(['6', '6'])),
        item('bird_dog', perSide(['6', '6'])),
        item('pallof_press', perSide(['8', '8'])),
      ]),
      block(COOL, 'flow', { minutes: 3 }, [item('chest_stretch', secs(45)), item('childs_pose', mins(1))]),
    ],
  },
  {
    key: 'pilates-glutes-and-hips', level: 'beginner', format: 'rounds', minutes: 20, equipment: [],
    title: ['Glutes and Hips', 'الأرداف والوركان'],
    desc: ['Wakes up sleepy glutes and steadies the pelvis. Gentle for the knees and lower back.', 'ينشّط الأرداف الخاملة ويثبّت الحوض. لطيف على الركبتين وأسفل الظهر.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('march', mins(1)), item('hip_openers', perSide(['6', '6'])), item('cat_cow', reps('6'))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('glute_bridge', reps('12'), slow),
        item('split_squat', perSide(['6', '6']), slow),
        item('bird_dog', perSide(['6', '6'])),
        item('knee_plank', secs(25)),
      ]),
      lengthen(),
    ],
  },
  {
    key: 'pilates-standing-strong', level: 'beginner', format: 'rounds', minutes: 20, equipment: ['band'],
    title: ['Standing Strong', 'وقفة قوية'],
    desc: ['Pilates control on your feet: hinge, lunge and brace with a tall spine. Good for balance and posture.', 'تحكّم البيلاتس وقوفًا: انحناء وطعن وثبات مع ظهر مستقيم. مفيد للتوازن والقوام.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('march', mins(1)), item('arm_circles', reps('10')), item('leg_swings', perSide(['8', '8']))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('hip_hinge', reps('10'), slow),
        item('reverse_lunge', perSide(['6', '6']), ['Step back slowly, stay tall', 'اخطُ للخلف ببطء وابقَ مستقيمًا']),
        item('pallof_press', perSide(['8', '8'])),
        item('calf_raise', reps('12'), ['2 s up, 2 s down', 'ثانيتان صعودًا وثانيتان نزولًا']),
        item('wall_sit', secs(30)),
      ]),
      block(COOL, 'flow', { minutes: 3 }, [item('quad_stretch', perSide(secs(30))), item('standing_forward_fold', secs(45))]),
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'pilates-core-control', level: 'intermediate', format: 'rounds', minutes: 30, equipment: [],
    title: ['Core Control', 'التحكم بالجذع'],
    desc: ['Harder core work done slowly: hollow holds, long planks and twisting with control.', 'تمارين جذع أصعب تُنفَّذ ببطء: ثبات القارب وبلانك طويل والتواء بتحكّم.'],
    blocks: [
      centre(5),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('hollow_hold', secs(25), ['Lower back pressed down', 'أسفل الظهر ملاصق للأرض']),
        item('dead_bug', perSide(['8', '8']), ['4 s each reach', '4 ث لكل امتداد']),
        item('side_plank', perSide(secs(30))),
        item('bicycle_crunch', perSide(['10', '10']), ['Slow, elbow to knee', 'ببطء، المرفق نحو الركبة']),
        item('plank_shoulder_tap', perSide(['8', '8']), ['Hips do not rock', 'الوركان لا يتأرجحان']),
      ]),
      lengthen(5),
    ],
  },
  {
    key: 'pilates-slow-legs', level: 'intermediate', format: 'rounds', minutes: 30, equipment: [],
    title: ['Slow Legs', 'ساقان ببطء'],
    desc: ['Leg strength through slow tempo and long holds. No weights, lots of time under tension.', 'قوة الساقين عبر إيقاع بطيء وثبات طويل. بلا أوزان، ووقت طويل تحت الشد.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('march', mins(1)), item('hip_openers', perSide(['6', '6'])), item('air_squat', reps('8'))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('split_squat', perSide(['8', '8']), slow),
        item('lateral_lunge', perSide(['6', '6']), slow),
        item('glute_bridge', reps('12'), ['Hold 3 s at the top', 'اثبت 3 ث في الأعلى']),
        item('single_leg_calf_raise', perSide(['10', '10'])),
        item('wall_sit', secs(45)),
      ]),
      lengthen(5),
    ],
  },
  {
    key: 'pilates-tall-back', level: 'intermediate', format: 'strength', minutes: 30, equipment: ['band', 'dumbbells', 'bench'],
    title: ['Tall Back', 'ظهر مستقيم'],
    desc: ['A stronger upper and mid back for upright posture, with slow pulls and steady holds.', 'ظهر علوي وأوسط أقوى لقوام مستقيم، بسحب بطيء وثبات متزن.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('shoulder_rolls', secs(30)), item('cat_cow', reps('8')), item('thoracic_rotation', perSide(['6', '6']))]),
      block(MAIN, 'strength', {}, [
        item('band_pull_apart', sets(3, '15'), ['2 s squeeze · rest 45 s', 'ضغط ثانيتين · راحة 45 ث']),
        item('dumbbell_row', sets(3, '10 / side'), ['3 s lowering · rest 60 s', 'نزول 3 ث · راحة 60 ث']),
        item('bird_dog', sets(3, '8 / side'), ['Hold 3 s · rest 30 s', 'ثبات 3 ث · راحة 30 ث']),
        item('plank', sets(3, '40 s'), ['Rest 30 s', 'راحة 30 ث']),
      ]),
      block(COOL, 'flow', { minutes: 4 }, [item('chest_stretch', secs(45)), item('lat_stretch', perSide(secs(30))), item('childs_pose', mins(1))]),
    ],
  },
  {
    key: 'pilates-plank-series', level: 'intermediate', format: 'rounds', minutes: 25, equipment: [],
    title: ['Plank Series', 'سلسلة البلانك'],
    desc: ['Front, side and moving planks to build a trunk that holds its shape from every angle.', 'بلانك أمامي وجانبي ومتحرك لبناء جذع يحافظ على شكله من كل الزوايا.'],
    blocks: [
      centre(4),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('plank', secs(45), ['Long line from head to heels', 'خط مستقيم من الرأس إلى الكعبين']),
        item('side_plank', perSide(secs(30))),
        item('plank_shoulder_tap', perSide(['8', '8'])),
        item('mountain_climber', secs(30), ['Slow and controlled, one knee at a time', 'ببطء وتحكّم، ركبة بعد ركبة']),
      ]),
      lengthen(4),
    ],
  },

  // ───── Advanced ─────
  {
    key: 'pilates-hollow-strength', level: 'advanced', format: 'rounds', minutes: 40, equipment: ['bench', 'pull_up_bar'],
    title: ['Hollow Strength', 'قوة القارب'],
    desc: ['Long hollow holds, hanging raises and side work. A demanding core session for strong movers.', 'ثبات قارب طويل ورفع للركبتين معلّقًا وتمارين جانبية. جلسة جذع صعبة للمتمرسين.'],
    blocks: [
      centre(6),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('hollow_hold', secs(40)),
        item('hanging_knee_raise', reps('10'), ['No swing, 3 s down', 'بلا تأرجح، نزول 3 ث']),
        item('copenhagen_plank', perSide(secs(20))),
        item('dead_bug', perSide(['8', '8']), ['5 s each reach', '5 ث لكل امتداد']),
        item('side_plank', perSide(secs(45))),
      ]),
      lengthen(6),
    ],
  },
  {
    key: 'pilates-time-under-tension', level: 'advanced', format: 'rounds', minutes: 40, equipment: [],
    title: ['Time Under Tension', 'وقت تحت الشد'],
    desc: ['Very long holds and very slow reps. No equipment, but every minute counts.', 'ثبات طويل جدًا وتكرارات بطيئة جدًا. بلا معدات، لكن كل دقيقة لها وزنها.'],
    blocks: [
      centre(5),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 60 s between rounds; breathe in every hold', 'راحة 60 ث بين الجولات، وتنفّس في كل ثبات'] }, [
        item('wall_sit', secs(90)),
        item('glute_bridge', reps('15'), ['4 s up, 4 s down', '4 ث صعودًا و4 ث نزولًا']),
        item('plank', secs(90)),
        item('side_plank', perSide(secs(60))),
        item('hollow_hold', secs(45)),
      ]),
      lengthen(5),
    ],
  },
  {
    key: 'pilates-single-leg-control', level: 'advanced', format: 'strength', minutes: 40, equipment: ['dumbbells', 'bench'],
    title: ['Single-Leg Control', 'التحكم بالساق الواحدة'],
    desc: ['Slow single-leg strength that tests balance and keeps the hips level under load.', 'قوة ساق واحدة ببطء تختبر التوازن وتُبقي الوركين مستويين تحت الحمل.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('march', mins(1)), item('leg_swings', perSide(['10', '10'])), item('glute_bridge', reps('10')), item('ankle_mobility', perSide(['8', '8']))]),
      block(MAIN, 'strength', {}, [
        item('single_leg_rdl', sets(3, '8 / side'), ['3 s down, hips square · rest 60 s', 'نزول 3 ث والوركان مستويان · راحة 60 ث']),
        item('bulgarian_split_squat', sets(3, '8 / side'), ['3 s down · rest 90 s', 'نزول 3 ث · راحة 90 ث']),
        item('single_leg_calf_raise', sets(3, '12 / side'), ['Rest 45 s', 'راحة 45 ث']),
        item('copenhagen_plank', sets(3, '20 s / side'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      lengthen(5),
    ],
  },
  {
    key: 'pilates-full-body-control', level: 'advanced', format: 'rounds', minutes: 50, equipment: ['band'],
    title: ['Full-Body Control', 'تحكّم الجسم كله'],
    desc: ['A long, complete mat session: spine, core, hips and posture, all at a slow, exact tempo.', 'جلسة طويلة وكاملة على البساط: العمود الفقري والجذع والوركان والقوام، بإيقاع بطيء ودقيق.'],
    blocks: [
      centre(6),
      block(['Spine and core', 'العمود الفقري والجذع'], 'rounds', { rounds: 3, note: ['Rest 30 s between rounds', 'راحة 30 ث بين الجولات'] }, [
        item('cat_cow', reps('6'), ['One vertebra at a time', 'فقرة بعد فقرة']),
        item('hollow_hold', secs(40)),
        item('dead_bug', perSide(['8', '8'])),
        item('bicycle_crunch', perSide(['12', '12']), ['Slow, full twist', 'ببطء والتفاف كامل']),
      ]),
      block(['Hips and legs', 'الوركان والساقان'], 'rounds', { rounds: 3, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('glute_bridge', reps('12'), ['Hold 3 s at the top', 'اثبت 3 ث في الأعلى']),
        item('split_squat', perSide(['8', '8']), slow),
        item('side_plank', perSide(secs(45))),
      ]),
      block(['Posture', 'القوام'], 'rounds', { rounds: 2, note: ['Rest 30 s between rounds', 'راحة 30 ث بين الجولات'] }, [
        item('band_pull_apart', reps('15')),
        item('bird_dog', perSide(['8', '8']), ['Hold 3 s', 'اثبت 3 ث']),
        item('plank', secs(60)),
      ]),
      lengthen(6),
    ],
  },
];
