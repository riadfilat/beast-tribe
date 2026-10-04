// Hiking: legs that climb all day, knees that survive the way down, a trunk that carries a pack, and the
// time on feet to finish a long trail. 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, sets, secs, mins, meters, perSide, WARM, MAIN, COOL } = require('../kit');

const EASY = ['Easy walk', 'مشي هادئ'];
const warmTrail = (minutes = 5) => block(WARM, 'flow', { minutes }, [
  item('march', mins(1)),
  item('leg_swings', perSide(['8', '8'])),
  item('ankle_mobility', perSide(['8', '8'])),
  item('air_squat', reps('8')),
]);
const warmWalk = block(WARM, 'flow', { minutes: 5 }, [
  item('walk', mins(3), null, EASY),
  item('leg_swings', perSide(['8', '8'])),
  item('ankle_mobility', perSide(['8', '8'])),
]);
const coolLegs = block(COOL, 'flow', { minutes: 5 }, [
  item('quad_stretch', perSide(secs(30))),
  item('hamstring_stretch', perSide(secs(30))),
  item('calf_stretch', perSide(secs(30))),
  item('figure_four_stretch', perSide(secs(30))),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'hiking-trail-legs-start', level: 'beginner', format: 'rounds', minutes: 22, equipment: ['box'],
    title: ['Trail Legs Start', 'بداية ساقي المسار'],
    desc: ['Simple leg strength for climbing and descending trails. For new hikers getting ready for their first longer walks.', 'قوة بسيطة للساقين لصعود المسارات ونزولها. للمبتدئين الذين يستعدون لأول مشية طويلة.'],
    blocks: [
      warmTrail(),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('step_up', perSide(['8', '8']), ['Low step, press through the whole foot', 'درجة منخفضة، وادفع بالقدم كاملة']),
        item('air_squat', reps('10')),
        item('reverse_lunge', perSide(['6', '6'])),
        item('calf_raise', reps('15')),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'hiking-easy-trail-walk', level: 'beginner', format: 'steady', minutes: 30, equipment: [],
    title: ['Easy Trail Walk', 'مشية مسار سهلة'],
    desc: ['Time on your feet over gentle ups and downs. Builds the base every hike rests on.', 'وقت على قدميك في صعود ونزول خفيفين. يبني الأساس الذي تقوم عليه كل رحلة مشي.'],
    blocks: [
      warmWalk,
      block(MAIN, 'steady', {}, [
        item('walk', mins(20), ['Pick a park or trail with gentle slopes; take short steps on the way down', 'اختر حديقة أو مسارًا بمنحدرات خفيفة، وخذ خطوات قصيرة عند النزول'], ['Trail walk', 'المشي على المسار']),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'hiking-ankle-knee-care', level: 'beginner', format: 'rounds', minutes: 20, equipment: [],
    title: ['Ankle and Knee Care', 'العناية بالكاحل والركبة'],
    desc: ['Strong, mobile ankles and steady knees for uneven ground. Helps prevent rolled ankles and sore knees.', 'كاحلان قويان ومرنان وركبتان ثابتتان للأرض غير المستوية. يساعد على تجنّب التواء الكاحل وألم الركبة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('march', mins(1)), item('ankle_mobility', perSide(['10', '10']))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('single_leg_calf_raise', perSide(['8', '8']), ['Hold a wall for balance', 'استند إلى الحائط للتوازن']),
        item('split_squat', perSide(['6', '6']), ['Lower slowly, knee in line with the toes', 'انزل ببطء والركبة باتجاه أصابع القدم']),
        item('glute_bridge', reps('12')),
        item('wall_sit', secs(20)),
      ]),
      block(COOL, 'flow', { minutes: 4 }, [
        item('calf_stretch', perSide(secs(30))),
        item('quad_stretch', perSide(secs(30))),
        item('figure_four_stretch', perSide(secs(30))),
      ]),
    ],
  },
  {
    key: 'hiking-pack-ready-core', level: 'beginner', format: 'rounds', minutes: 20, equipment: ['kettlebell'],
    title: ['Pack-Ready Core', 'جذع جاهز للحقيبة'],
    desc: ['A steady trunk and back to carry a day pack in comfort. Light weight, slow and controlled.', 'جذع وظهر ثابتان لحمل حقيبة الظهر براحة. وزن خفيف، ببطء وتحكم.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('cat_cow', reps('8')), item('hip_hinge', reps('8')), item('march', secs(45))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('dead_bug', perSide(['6', '6'])),
        item('bird_dog', perSide(['6', '6'])),
        item('knee_plank', secs(30)),
        item('suitcase_carry', perSide(meters(20)), ['Light weight; stay tall and do not lean', 'وزن خفيف، قف مستقيمًا ولا تمِل']),
      ]),
      block(COOL, 'flow', { minutes: 4 }, [
        item('childs_pose', mins(1)),
        item('lat_stretch', perSide(secs(30))),
        item('figure_four_stretch', perSide(secs(30))),
      ]),
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'hiking-step-up-climb', level: 'intermediate', format: 'rounds', minutes: 32, equipment: ['box', 'dumbbells'],
    title: ['Step-Up Climb', 'صعود الدرجات'],
    desc: ['Long sets of step-ups that copy a steep climb. Builds the leg endurance to keep going uphill.', 'مجموعات طويلة من الصعود على الصندوق تحاكي الصعود الحاد. تبني تحمّل الساقين لمواصلة الصعود.'],
    blocks: [
      warmTrail(),
      block(MAIN, 'rounds', { rounds: 5, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('step_up', perSide(['15', '15']), ['Light dumbbells; steady rhythm, like climbing stairs', 'دمبل خفيف، وإيقاع ثابت كصعود الدرج']),
        item('wall_sit', secs(30)),
        item('calf_raise', reps('20')),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'hiking-downhill-control', level: 'intermediate', format: 'strength', minutes: 32, equipment: [],
    title: ['Downhill Control', 'التحكم في النزول'],
    desc: ['Slow lowering work that trains your legs to brake on the way down, where most sore knees and thighs come from.', 'حركات نزول بطيء تدرّب ساقيك على الكبح أثناء النزول، حيث تبدأ معظم آلام الركبة والفخذ.'],
    blocks: [
      warmTrail(),
      block(MAIN, 'strength', {}, [
        item('split_squat', sets(3, '8 / side'), ['3 s down · rest 60 s', 'نزول في 3 ث · راحة 60 ث']),
        item('reverse_lunge', sets(3, '8 / side'), ['3 s down · rest 60 s', 'نزول في 3 ث · راحة 60 ث']),
        item('lateral_lunge', sets(3, '6 / side'), ['Rest 45 s', 'راحة 45 ث']),
        item('wall_sit', sets(3, '45 s'), ['Rest 45 s', 'راحة 45 ث']),
        item('single_leg_calf_raise', sets(3, '10 / side'), ['3 s down · rest 30 s', 'نزول في 3 ث · راحة 30 ث']),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'hiking-loaded-carries', level: 'intermediate', format: 'rounds', minutes: 35, equipment: ['dumbbells', 'kettlebell'],
    title: ['Loaded Carries', 'حمل الأوزان'],
    desc: ['Carry, squat and hinge with weight in your hands. Builds grip, posture and legs for heavier packs and longer days.', 'احمل الأوزان واجلس وانحنِ بها. تبني قبضة اليد والقوام والساقين لحقائب أثقل وأيام أطول.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('march', mins(1)), item('hip_hinge', reps('10')), item('kettlebell_halo', reps('6')), item('air_squat', reps('8'))]),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 75 s between rounds', 'راحة 75 ث بين الجولات'] }, [
        item('farmer_carry', meters(40), ['Shoulders down, short quick steps', 'الكتفان للأسفل، وخطوات قصيرة وسريعة']),
        item('goblet_squat', reps('10')),
        item('suitcase_carry', perSide(meters(20))),
        item('kettlebell_deadlift', reps('10')),
      ]),
      block(COOL, 'flow', { minutes: 5 }, [
        item('quad_stretch', perSide(secs(30))),
        item('hamstring_stretch', perSide(secs(30))),
        item('lat_stretch', perSide(secs(30))),
        item('calf_stretch', perSide(secs(30))),
      ]),
    ],
  },
  {
    key: 'hiking-hill-repeats', level: 'intermediate', format: 'intervals', minutes: 40, equipment: [],
    title: ['Trail Hill Repeats', 'تكرارات صعود المسار'],
    desc: ['Steady climbs and careful descents on a real hill. Practise pacing on the way up and control on the way down.', 'صعود ثابت ونزول حذر على تل حقيقي. تدرّب على ضبط السرعة صعودًا والتحكم نزولًا.'],
    blocks: [
      warmWalk,
      block(MAIN, 'intervals', { rounds: 6, note: ['Climb at a pace you could hold for an hour', 'اصعد بسرعة تستطيع الحفاظ عليها ساعة'] }, [
        item('walk', mins(3), null, ['Uphill walk', 'مشي صعودًا']),
        item('walk', mins(2), ['Short, soft steps, knees slightly bent', 'خطوات قصيرة وناعمة والركبتان منثنيتان قليلًا'], ['Controlled walk down', 'نزول متحكَّم به']),
      ]),
      coolLegs,
    ],
  },

  // ───── Advanced ─────
  {
    key: 'hiking-summit-day-prep', level: 'advanced', format: 'steady', minutes: 60, equipment: [],
    title: ['Summit Day Prep', 'التحضير ليوم القمة'],
    desc: ['Fifty minutes of hilly walking with a loaded day pack. Builds the stamina for a long mountain day.', 'خمسون دقيقة من المشي على التلال بحقيبة محمّلة. تبني قدرة التحمل ليوم طويل في الجبال.'],
    blocks: [
      warmWalk,
      block(MAIN, 'steady', { note: ['Start early to avoid the heat; carry plenty of water', 'ابدأ مبكرًا لتتجنّب الحر، واحمل ماءً كافيًا'] }, [
        item('walk', mins(50), ['5–8 kg in the pack; drink every 15 minutes', '5–8 كغ في الحقيبة، واشرب كل 15 دقيقة'], ['Hill walk with a pack', 'مشي على التلال بحقيبة']),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'hiking-mountain-legs', level: 'advanced', format: 'strength', minutes: 50, equipment: ['kettlebell', 'dumbbells', 'box'],
    title: ['Mountain Legs', 'ساقا الجبل'],
    desc: ['Heavy leg strength for big climbs and heavy packs: squat, hinge, step and calves.', 'قوة ساقين بأوزان ثقيلة للصعود الطويل والحقائب الثقيلة: سكوات وانحناء وصعود وسمانة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 7 }, [item('walk', mins(3), null, EASY), item('hip_hinge', reps('10')), item('air_squat', reps('10')), item('step_up', perSide(['6', '6']))]),
      block(MAIN, 'strength', {}, [
        item('goblet_squat', sets(4, '8'), ['1–2 reps left in the tank · rest 2 min', 'اترك تكرارًا أو اثنين · راحة 2 د']),
        item('romanian_deadlift', sets(4, '8'), ['Rest 90 s', 'راحة 90 ث']),
        item('step_up', sets(4, '8 / side'), ['Heavy dumbbells · rest 90 s', 'دمبل ثقيل · راحة 90 ث']),
        item('single_leg_calf_raise', sets(3, '12 / side'), ['Hold a dumbbell · rest 45 s', 'امسك دمبل · راحة 45 ث']),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'hiking-climb-every-minute', level: 'advanced', format: 'emom', minutes: 36, equipment: ['box', 'dumbbells'],
    title: ['Climb Every Minute', 'صعود كل دقيقة'],
    desc: ['Twenty-four minutes, a new move every minute. Builds the uphill engine to keep climbing when the trail gets steep.', 'أربع وعشرون دقيقة، حركة جديدة كل دقيقة. تبني قدرتك على مواصلة الصعود حين يشتدّ المسار.'],
    blocks: [
      warmTrail(7),
      block(MAIN, 'emom', { minutes: 24, note: ['Finish the work, rest what is left of the minute', 'أنهِ الحركة وارتح ما تبقّى من الدقيقة'] }, [
        item('step_up', perSide(['10', '10']), ['Hold dumbbells', 'امسك الدمبل']),
        item('farmer_carry', meters(40)),
        item('walking_lunge', perSide(['8', '8'])),
        item('mountain_climber', secs(30)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'hiking-knee-proof-descents', level: 'advanced', format: 'strength', minutes: 45, equipment: ['bench', 'dumbbells'],
    title: ['Knee-Proof Descents', 'نزول يحمي الركبتين'],
    desc: ['Heavy, slow lowering and landing practice for long, steep descents on rocky ground. Protects knees and thighs late in the day.', 'نزول بطيء بأوزان ثقيلة وتدريب على الهبوط للنزول الطويل الحاد على الأرض الصخرية. يحمي الركبتين والفخذين في آخر اليوم.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('walk', mins(2), null, EASY), item('leg_swings', perSide(['8', '8'])), item('split_squat', perSide(['6', '6'])), item('air_squat', reps('10'))]),
      block(['Landing', 'الهبوط'], 'strength', {}, [
        item('jump_squat', sets(3, '5'), ['Land softly and hold 2 s · rest 60 s', 'اهبط بنعومة واثبت 2 ث · راحة 60 ث']),
      ]),
      block(['Strength', 'القوة'], 'strength', {}, [
        item('bulgarian_split_squat', sets(4, '6 / side'), ['4 s down · rest 90 s', 'نزول في 4 ث · راحة 90 ث']),
        item('nordic_curl', sets(3, '5'), ['Lower as slowly as you can · rest 90 s', 'انزل ببطء قدر ما تستطيع · راحة 90 ث']),
        item('lateral_lunge', sets(3, '8 / side'), ['Hold a dumbbell · rest 60 s', 'امسك دمبل · راحة 60 ث']),
        item('wall_sit', sets(2, '60 s'), ['Rest 60 s', 'راحة 60 ث']),
      ]),
      coolLegs,
    ],
  },
];
