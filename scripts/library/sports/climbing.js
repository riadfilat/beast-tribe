// Training for climbing, off the wall: pulling strength, core tension, grip, healthy shoulders, and the
// hip and shoulder mobility that high steps and long reaches need. 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, sets, secs, mins, meters, perSide, WARM, MAIN, COOL } = require('../kit');

const warmPull = (minutes = 6) => block(WARM, 'flow', { minutes }, [
  item('rower', mins(3)),
  item('shoulder_rolls', secs(30)),
  item('band_pull_apart', reps('15')),
  item('cat_cow', reps('6')),
]);
const coolUpper = block(COOL, 'flow', { minutes: 5 }, [
  item('lat_stretch', perSide(secs(30))),
  item('chest_stretch', secs(30)),
  item('childs_pose', mins(1)),
]);
const coolCore = block(COOL, 'flow', { minutes: 4 }, [
  item('childs_pose', mins(1)),
  item('hip_flexor_stretch', perSide(secs(30))),
  item('lat_stretch', perSide(secs(30))),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'climbing-pulling-foundations', level: 'beginner', format: 'strength', minutes: 30, equipment: ['rower', 'band', 'rack', 'barbell', 'cable'],
    title: ['Pulling Foundations', 'أساسيات قوة السحب'],
    desc: ['The back and arm strength every climb starts with, using rows and the lat pulldown. For new climbers.', 'قوة الظهر والذراعين التي يبدأ بها كل تسلق، بالسحب المقلوب والسحب العالي. للمبتدئين في التسلق.'],
    blocks: [
      warmPull(5),
      block(MAIN, 'strength', {}, [
        item('inverted_row', sets(3, '8'), ['Higher bar makes it easier · rest 75 s', 'البار الأعلى يجعلها أسهل · راحة 75 ث']),
        item('lat_pulldown', sets(3, '10'), ['3 reps left in the tank · rest 75 s', 'اترك 3 تكرارات · راحة 75 ث']),
        item('band_pull_apart', sets(2, '15'), ['Rest 45 s', 'راحة 45 ث']),
        item('dead_bug', sets(3, '6 / side'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'climbing-healthy-shoulders', level: 'beginner', format: 'rounds', minutes: 20, equipment: ['band', 'cable', 'kettlebell'],
    title: ["Climber's Shoulders", 'أكتاف المتسلق'],
    desc: ['Light work for the small muscles that keep climbing shoulders stable. Do it on rest days or before you climb.', 'تمرين خفيف للعضلات الصغيرة التي تحافظ على ثبات الكتفين. نفّذه في أيام الراحة أو قبل التسلق.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('arm_circles', secs(30)), item('shoulder_rolls', secs(30)), item('neck_rolls', secs(30))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Light weight, slow and smooth · rest 45 s between rounds', 'وزن خفيف ببطء وسلاسة · راحة 45 ث بين الجولات'] }, [
        item('face_pull', reps('15'), ['Elbows high, squeeze the shoulder blades', 'المرفقان عاليان واضغط لوحي الكتف']),
        item('band_pull_apart', reps('15')),
        item('kettlebell_halo', reps('6'), ['3 each way', '3 في كل اتجاه']),
        item('thoracic_rotation', perSide(['6', '6'])),
      ]),
      block(COOL, 'flow', { minutes: 3 }, [item('chest_stretch', secs(30)), item('lat_stretch', perSide(secs(30)))]),
    ],
  },
  {
    key: 'climbing-core-tension-start', level: 'beginner', format: 'rounds', minutes: 20, equipment: [],
    title: ['Core Tension Start', 'بداية شدّ الجذع'],
    desc: ['Learn to keep your body tight from hands to feet, so your feet stay on the wall. No equipment needed.', 'تعلّم إبقاء جسمك مشدودًا من اليدين إلى القدمين لتبقى قدماك على الجدار. بلا معدات.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('cat_cow', reps('8')), item('march', mins(1)), item('bird_dog', perSide(['4', '4']))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('dead_bug', perSide(['8', '8']), ['Press your lower back into the floor', 'اضغط أسفل ظهرك على الأرض']),
        item('plank', secs(30)),
        item('bird_dog', perSide(['6', '6'])),
        item('glute_bridge', reps('12')),
      ]),
      coolCore,
    ],
  },
  {
    key: 'climbing-hip-mobility', level: 'beginner', format: 'flow', minutes: 20, equipment: [],
    title: ['Hips for High Steps', 'وركان للخطوات العالية'],
    desc: ['Open hips let you step high and keep your body close to the wall. Gentle mobility for any day.', 'الوركان المرنان يتيحان لك خطوة عالية وإبقاء جسمك قريبًا من الجدار. حركات مرونة لطيفة لأي يوم.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('march', mins(1)), item('leg_swings', perSide(['8', '8']))]),
      block(MAIN, 'rounds', { rounds: 2, note: ['Move slowly, breathe out as you sink deeper', 'تحرّك ببطء وأخرج النفس وأنت تنزل أعمق'] }, [
        item('hip_openers', perSide(['6', '6'])),
        item('lateral_lunge', perSide(['6', '6']), ['Sit deep into the bent leg', 'انزل عميقًا على الرجل المثنية']),
        item('worlds_greatest_stretch', perSide(['3', '3'])),
        item('air_squat', reps('8'), ['Pause 3 s at the bottom', 'توقف 3 ث في الأسفل']),
      ]),
      block(COOL, 'flow', { minutes: 5 }, [item('hip_flexor_stretch', perSide(secs(30))), item('figure_four_stretch', perSide(secs(30))), item('hamstring_stretch', perSide(secs(30)))]),
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'climbing-pull-up-progress', level: 'intermediate', format: 'strength', minutes: 40, equipment: ['rower', 'band', 'pull_up_bar', 'dumbbells', 'bench', 'cable'],
    title: ['Pull-Up Progress', 'التقدّم في العقلة'],
    desc: ['More pull-up volume with a band, plus rows and shoulder work. The step from assisted to strict pull-ups.', 'حجم أكبر من العقلة بمساعدة الشريط مع السحب وتمارين الكتف. الخطوة من العقلة المساعدة إلى العقلة الكاملة.'],
    blocks: [
      warmPull(),
      block(MAIN, 'strength', {}, [
        item('band_pull_up', sets(4, '6'), ['Slow on the way down · rest 2 min', 'ببطء أثناء النزول · راحة 2 د']),
        item('dumbbell_row', sets(3, '10 / side'), ['2 reps left in the tank · rest 60 s', 'اترك تكرارين · راحة 60 ث']),
        item('hanging_knee_raise', sets(3, '8'), ['No swinging · rest 60 s', 'دون أرجحة · راحة 60 ث']),
        item('face_pull', sets(3, '15'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'climbing-core-steep-walls', level: 'intermediate', format: 'rounds', minutes: 30, equipment: ['pull_up_bar'],
    title: ['Core for Steep Walls', 'جذع للجدران المائلة'],
    desc: ['Hanging and hollow work that keeps your feet on when the wall leans over you.', 'تمارين التعلق والقارب التي تبقي قدميك على الجدار حين يميل فوقك.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('cat_cow', reps('8')), item('dead_bug', perSide(['6', '6'])), item('arm_circles', secs(30)), item('plank', secs(30))]),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('hanging_knee_raise', reps('8'), ['Curl the hips up, not just the knees', 'ارفع الحوض لا الركبتين فقط']),
        item('hollow_hold', secs(20)),
        item('side_plank', perSide(secs(25))),
        item('plank_shoulder_tap', perSide(['8', '8'])),
      ]),
      coolCore,
    ],
  },
  {
    key: 'climbing-opposite-muscles', level: 'intermediate', format: 'strength', minutes: 35, equipment: ['band', 'dumbbells', 'bench', 'cable'],
    title: ['Opposite Muscles', 'العضلات المقابلة'],
    desc: ['Climbing is all pulling. Pushing work balances the shoulders and helps prevent elbow and shoulder pain.', 'التسلق كله سحب. تمارين الدفع توازن الكتفين وتساعد على الوقاية من آلام المرفق والكتف.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('arm_circles', secs(30)), item('band_pull_apart', reps('15')), item('incline_push_up', reps('8')), item('thoracic_rotation', perSide(['5', '5']))]),
      block(MAIN, 'strength', {}, [
        item('push_up', sets(3, '10'), ['2 reps left in the tank · rest 75 s', 'اترك تكرارين · راحة 75 ث']),
        item('overhead_press', sets(3, '8'), ['Rest 90 s', 'راحة 90 ث']),
        item('dips', sets(3, '10'), ['Rest 60 s', 'راحة 60 ث']),
        item('face_pull', sets(3, '15'), ['Rest 45 s', 'راحة 45 ث']),
        item('triceps_extension', sets(2, '12'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'climbing-reach-flow', level: 'intermediate', format: 'flow', minutes: 25, equipment: [],
    title: ['Shoulder and Hip Flow', 'انسيابية الكتف والورك'],
    desc: ['A longer mobility flow for long reaches and deep steps. Good after a hard climbing day.', 'سلسلة مرونة أطول للوصول البعيد والخطوات العميقة. مناسبة بعد يوم تسلق صعب.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('march', mins(1)), item('arm_circles', secs(30)), item('cat_cow', reps('8'))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Slow and smooth, no rest needed', 'ببطء وسلاسة دون حاجة للراحة'] }, [
        item('inchworm', reps('4')),
        item('worlds_greatest_stretch', perSide(['3', '3'])),
        item('thoracic_rotation', perSide(['6', '6'])),
        item('hip_openers', perSide(['6', '6'])),
        item('ankle_mobility', perSide(['8', '8'])),
      ]),
      block(COOL, 'flow', { minutes: 6 }, [item('lat_stretch', perSide(secs(45))), item('chest_stretch', secs(45)), item('figure_four_stretch', perSide(secs(45))), item('childs_pose', mins(1))]),
    ],
  },

  // ───── Advanced ─────
  {
    key: 'climbing-max-pulling', level: 'advanced', format: 'strength', minutes: 50, equipment: ['rower', 'band', 'pull_up_bar', 'barbell', 'cable'],
    title: ['Max Pulling Strength', 'أقصى قوة سحب'],
    desc: ['Low reps, long rest, hard pulls. For strong climbers who already do strict pull-ups.', 'تكرارات قليلة وراحة طويلة وسحب قوي. للمتسلقين الأقوياء الذين يؤدون العقلة الكاملة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('rower', mins(4)), item('band_pull_apart', reps('15')), item('band_pull_up', reps('5')), item('pull_up', reps('3'))]),
      block(MAIN, 'strength', {}, [
        item('pull_up', sets(5, '3–5'), ['Hold a dumbbell between your feet if 5 is easy · rest 3 min', 'أمسك دمبل بين قدميك إن كانت 5 سهلة · راحة 3 د']),
        item('barbell_row', sets(4, '6'), ['1–2 reps left in the tank · rest 2 min', 'اترك تكرارًا أو اثنين · راحة 2 د']),
        item('lat_pulldown', sets(3, '8'), ['3 s on the way up · rest 90 s', '3 ث أثناء الصعود · راحة 90 ث']),
        item('hanging_knee_raise', sets(3, '12'), ['Rest 60 s', 'راحة 60 ث']),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'climbing-pulling-emom', level: 'advanced', format: 'emom', minutes: 35, equipment: ['band', 'pull_up_bar', 'rack', 'barbell'],
    title: ['Pulling EMOM', 'سحب كل دقيقة'],
    desc: ['Pull-ups, rows and core tension, one each minute for 20 minutes. Builds pulling endurance for long routes.', 'عقلة وسحب وشدّ للجذع، حركة كل دقيقة لمدة 20 دقيقة. يبني تحمّل السحب للمسارات الطويلة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 7 }, [item('jumping_jack', mins(1)), item('band_pull_apart', reps('15')), item('inverted_row', reps('6')), item('band_pull_up', reps('4')), item('dead_bug', perSide(['5', '5']))]),
      block(MAIN, 'emom', { minutes: 20, note: ['Finish the work, rest what is left of the minute', 'أنهِ الحركة وارتح ما تبقّى من الدقيقة'] }, [
        item('pull_up', reps('5')),
        item('hollow_hold', secs(30)),
        item('inverted_row', reps('10'), ['Feet on a bench to make it harder', 'القدمان على مقعد لزيادة الصعوبة']),
        item('side_plank', perSide(secs(20))),
      ]),
      coolCore,
    ],
  },
  {
    key: 'climbing-full-body-tension', level: 'advanced', format: 'amrap', minutes: 35, equipment: ['pull_up_bar', 'bench'],
    title: ['Full-Body Tension', 'شدّ الجسم كاملًا'],
    desc: ['Fifteen minutes of hanging core, overhead pressing and hard holds. Body tension for powerful moves.', 'خمس عشرة دقيقة من الجذع بالتعلق والدفع فوق الرأس والثبات الصعب. شدّ الجسم للحركات القوية.'],
    blocks: [
      block(WARM, 'flow', { minutes: 7 }, [item('cat_cow', reps('8')), item('inchworm', reps('5')), item('dead_bug', perSide(['6', '6'])), item('side_plank', perSide(secs(15)))]),
      block(MAIN, 'amrap', { minutes: 15, note: ['Quality first: stop a set before your form breaks', 'الجودة أولًا: توقف قبل أن يختل أداؤك'] }, [
        item('hanging_knee_raise', reps('10')),
        item('pike_push_up', reps('8')),
        item('hollow_hold', secs(30)),
        item('copenhagen_plank', perSide(secs(15))),
      ]),
      block(COOL, 'flow', { minutes: 5 }, [item('childs_pose', mins(1)), item('lat_stretch', perSide(secs(30))), item('figure_four_stretch', perSide(secs(30)))]),
    ],
  },
  {
    key: 'climbing-grip-endurance', level: 'advanced', format: 'rounds', minutes: 45, equipment: ['rower', 'band', 'dumbbells', 'kettlebell', 'pull_up_bar', 'rack', 'barbell'],
    title: ['Grip and Pull Endurance', 'تحمّل القبضة والسحب'],
    desc: ['Heavy carries for grip, then pull-ups and rows with short rest. For forearms that last a whole session.', 'حمل ثقيل للقبضة ثم عقلة وسحب براحة قصيرة. لساعدين يصمدان طوال الجلسة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 7 }, [item('rower', mins(3)), item('shoulder_rolls', secs(30)), item('band_pull_apart', reps('15')), item('inverted_row', reps('6'))]),
      block(MAIN, 'rounds', { rounds: 5, note: ['Rest 60 s between rounds; never let go of the grip mid-set', 'راحة 60 ث بين الجولات، ولا تُفلت القبضة في منتصف المجموعة'] }, [
        item('farmer_carry', meters(40), ['Heavy, crush the handles', 'وزن ثقيل واضغط المقابض بقوة']),
        item('pull_up', reps('6')),
        item('suitcase_carry', perSide(meters(20))),
        item('inverted_row', reps('12')),
      ]),
      block(COOL, 'flow', { minutes: 5 }, [item('lat_stretch', perSide(secs(30))), item('chest_stretch', secs(30)), item('childs_pose', mins(1)), item('neck_rolls', secs(30))]),
    ],
  },
];
