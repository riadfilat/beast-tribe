// Hybrid fitness racing: running mixed with station work (row, sled push, wall balls, carries, swings,
// burpees, lunges), pacing, and running on tired legs. 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, sets, secs, mins, meters, perSide, WARM, MAIN, COOL } = require('../kit');

const warmRun = (minutes = 7) => block(WARM, 'flow', { minutes }, [
  item('easy_jog', mins(3)),
  item('leg_swings', perSide(['10', '10'])),
  item('skips', meters(20)),
  item('air_squat', reps('10')),
]);
const coolLegs = block(COOL, 'flow', { minutes: 6 }, [
  item('walk', mins(2)),
  item('quad_stretch', perSide(secs(30))),
  item('hamstring_stretch', perSide(secs(30))),
  item('calf_stretch', perSide(secs(30))),
]);
const coolFull = block(COOL, 'flow', { minutes: 6 }, [
  item('walk', mins(2)),
  item('hip_flexor_stretch', perSide(secs(30))),
  item('calf_stretch', perSide(secs(30))),
  item('lat_stretch', perSide(secs(30))),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'hyrox-run-walk-stations', level: 'beginner', format: 'rounds', minutes: 28, equipment: ['wall_ball', 'dumbbells'],
    title: ['Run-Walk Stations', 'محطات بين الجري والمشي'],
    desc: ['Easy jogging with walking breaks, plus two simple stations. Your first step into hybrid racing.', 'هرولة خفيفة مع فترات مشي ومحطتان بسيطتان. خطوتك الأولى نحو سباقات اللياقة المختلطة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('walk', mins(2)), item('leg_swings', perSide(['8', '8'])), item('air_squat', reps('8'))]),
      block(MAIN, 'rounds', { rounds: 4, note: ['Jog at a pace where you can still talk', 'هرول بإيقاع تستطيع معه الكلام'] }, [
        item('easy_jog', mins(2)),
        item('walk', mins(1)),
        item('wall_ball', reps('10'), ['Light ball, squat deep', 'كرة خفيفة وسكوات عميق']),
        item('farmer_carry', meters(30)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'hyrox-station-school', level: 'beginner', format: 'rounds', minutes: 30, equipment: ['rower', 'kettlebell', 'wall_ball', 'dumbbells'],
    title: ['Station School', 'مدرسة المحطات'],
    desc: ['Practise the race stations one by one at an easy effort, with rest between each. Learn the moves first.', 'تدرّب على محطات السباق واحدة تلو الأخرى بجهد سهل مع راحة بين كل محطة. تعلّم الحركات أولًا.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('march', mins(1)), item('hip_hinge', reps('10')), item('reverse_lunge', perSide(['5', '5'])), item('arm_circles', secs(30))]),
      block(MAIN, 'rounds', { rounds: 2, note: ['Rest 60 s after each station · 3 reps left in the tank', 'راحة 60 ث بعد كل محطة · اترك 3 تكرارات'] }, [
        item('rower', meters(250), ['Legs, then body, then arms', 'الساقان ثم الجذع ثم الذراعان']),
        item('kettlebell_swing', reps('12'), ['Light bell, hips do the work', 'كيتل بل خفيف والوركان يقومان بالعمل']),
        item('walking_lunge', perSide(['8', '8'])),
        item('wall_ball', reps('10')),
        item('farmer_carry', meters(40)),
        item('step_burpee', reps('6')),
      ]),
      coolFull,
    ],
  },
  {
    key: 'hyrox-easy-engine', level: 'beginner', format: 'steady', minutes: 30, equipment: ['rower'],
    title: ['Easy Engine', 'لياقة هادئة'],
    desc: ['Steady, easy cardio that builds the base every hybrid race is won on. Slow is the point.', 'كارديو هادئ وثابت يبني القاعدة التي تُكسب عليها السباقات المختلطة. البطء هو المقصود.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('walk', mins(3)), item('ankle_mobility', perSide(['8', '8']))]),
      block(MAIN, 'steady', { note: ['Conversational pace the whole time: you can speak in full sentences', 'إيقاع يسمح بالكلام طوال الوقت: تستطيع التحدث بجمل كاملة'] }, [
        item('easy_jog', mins(10)),
        item('rower', mins(8), ['Smooth strokes, about 20 per minute', 'ضربات سلسة، نحو 20 في الدقيقة']),
        item('walk', mins(2)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'hyrox-carry-and-lunge', level: 'beginner', format: 'rounds', minutes: 25, equipment: ['dumbbells', 'kettlebell'],
    title: ['Carry and Lunge Base', 'أساس الحمل والطعن'],
    desc: ['Grip, legs and posture for the carry and lunge stations, at a weight you can hold with good form.', 'القبضة والساقان والقوام لمحطتي الحمل والطعن، بوزن تستطيع حمله بأداء سليم.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('march', mins(1)), item('hip_openers', perSide(['5', '5'])), item('reverse_lunge', perSide(['5', '5'])), item('shoulder_rolls', secs(30))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 90 s between rounds', 'راحة 90 ث بين الجولات'] }, [
        item('farmer_carry', meters(40), ['Tall chest, short quick steps', 'صدر مرفوع وخطوات قصيرة وسريعة']),
        item('walking_lunge', perSide(['8', '8']), ['Back knee softly to the floor', 'الركبة الخلفية تلمس الأرض بخفة']),
        item('suitcase_carry', perSide(meters(20))),
        item('wall_sit', secs(30)),
      ]),
      block(COOL, 'flow', { minutes: 5 }, [item('quad_stretch', perSide(secs(30))), item('hip_flexor_stretch', perSide(secs(30))), item('figure_four_stretch', perSide(secs(30)))]),
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'hyrox-compromised-runs', level: 'intermediate', format: 'rounds', minutes: 40, equipment: ['kettlebell'],
    title: ['Compromised Running', 'الجري بساقين متعبتين'],
    desc: ['Run straight off a station, the way the race makes you. Teaches your legs to settle into pace fast.', 'اجرِ مباشرة بعد المحطة كما يفرض عليك السباق. يعلّم ساقيك العودة إلى الإيقاع بسرعة.'],
    blocks: [
      warmRun(),
      block(MAIN, 'rounds', { rounds: 4, note: ['No rest between station and run · rest 90 s after each round', 'بلا راحة بين المحطة والجري · راحة 90 ث بعد كل جولة'] }, [
        item('kettlebell_swing', reps('15')),
        item('run', meters(400), ['First 100 m feels heavy, then find your pace', 'أول 100 م ثقيلة ثم جد إيقاعك']),
        item('walking_lunge', perSide(['10', '10'])),
        item('run', meters(400)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'hyrox-race-pace-intervals', level: 'intermediate', format: 'intervals', minutes: 35, equipment: [],
    title: ['Race Pace Intervals', 'فترات بإيقاع السباق'],
    desc: ['Repeat runs at your goal race pace with walking rest. Learn how that pace feels so you hold it on the day.', 'جري متكرر بإيقاع سباقك المستهدف مع مشي للراحة. تعرّف على شعور هذا الإيقاع لتحافظ عليه يوم السباق.'],
    blocks: [
      warmRun(8),
      block(MAIN, 'intervals', { rounds: 6, note: ['Same pace every rep: the last should match the first', 'الإيقاع نفسه في كل مرة: الأخيرة مثل الأولى'] }, [
        item('run', meters(500)),
        item('walk', secs(90)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'hyrox-push-and-row', level: 'intermediate', format: 'rounds', minutes: 40, equipment: ['rower', 'sled'],
    title: ['Push and Row', 'دفع وتجديف'],
    desc: ['Sled pushes and rowing back to back: the two stations that drain the legs most. For racers building station strength.', 'دفع الزلاجة والتجديف متتاليين: المحطتان الأكثر إنهاكًا للساقين. لمن يبني قوته في المحطات.'],
    blocks: [
      block(WARM, 'flow', { minutes: 7 }, [item('rower', mins(3)), item('leg_swings', perSide(['10', '10'])), item('air_squat', reps('10')), item('sled_push', meters(10), ['Light, to find your position', 'خفيف لتجد وضعيتك'])]),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 2 min between rounds', 'راحة 2 د بين الجولات'] }, [
        item('sled_push', meters(25), ['Low hips, arms long, short fast steps', 'وركان منخفضان وذراعان ممدودتان وخطوات قصيرة سريعة']),
        item('rower', meters(500), ['Steady race effort', 'جهد سباق ثابت']),
        item('sled_push', meters(25)),
      ]),
      coolFull,
    ],
  },
  {
    key: 'hyrox-station-strength', level: 'intermediate', format: 'strength', minutes: 40, equipment: ['bike', 'dumbbells', 'sled'],
    title: ['Station Strength', 'قوة المحطات'],
    desc: ['Strength work that makes the stations feel lighter: hinge, lunge, heavy sled and heavy carries.', 'تمرين قوة يجعل المحطات أخف: انحناء وطعن ودفع زلاجة ثقيل وحمل ثقيل.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('bike', mins(3)), item('hip_hinge', reps('10')), item('reverse_lunge', perSide(['6', '6']))]),
      block(MAIN, 'strength', {}, [
        item('romanian_deadlift', sets(3, '10'), ['2 reps left in the tank · rest 90 s', 'اترك تكرارين · راحة 90 ث']),
        item('walking_lunge', sets(3, '10 / side'), ['Dumbbells at your sides · rest 90 s', 'الدمبلان بجانبيك · راحة 90 ث']),
        item('sled_push', sets(4, '20 m'), ['Heavier than race weight · rest 2 min', 'أثقل من وزن السباق · راحة 2 د']),
        item('farmer_carry', sets(3, '40 m'), ['Heavy · rest 90 s', 'وزن ثقيل · راحة 90 ث']),
      ]),
      coolFull,
    ],
  },

  // ───── Advanced ─────
  {
    key: 'hyrox-half-race-sim', level: 'advanced', format: 'for_time', minutes: 60, equipment: ['rower', 'sled', 'wall_ball'],
    title: ['Half Race Simulation', 'محاكاة نصف السباق'],
    desc: ['Four 1 km runs with a station after each, done straight through. A dress rehearsal for race day.', 'أربعة أجزاء جري كل منها 1 كم وبعد كل جزء محطة، دون توقف. بروفة كاملة ليوم السباق.'],
    blocks: [
      warmRun(8),
      block(['For time', 'ضد الوقت'], 'for_time', { minutes: 45, note: ['45 min cap. Run at race pace, not faster.', 'الحد 45 د. اجرِ بإيقاع السباق لا أسرع.'] }, [
        item('run', meters(1000)),
        item('rower', meters(1000)),
        item('run', meters(1000)),
        item('sled_push', meters(50)),
        item('run', meters(1000)),
        item('burpee', reps('40')),
        item('run', meters(1000)),
        item('wall_ball', reps('50'), ['Sets of 10–15, short breaks', 'مجموعات من 10–15 مع فواصل قصيرة']),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'hyrox-station-emom', level: 'advanced', format: 'emom', minutes: 38, equipment: ['wall_ball', 'kettlebell'],
    title: ['Station EMOM', 'محطات كل دقيقة'],
    desc: ['A station every minute for 24 minutes, with a fast run in the rotation. High density, short rest.', 'محطة كل دقيقة لمدة 24 دقيقة مع جري سريع ضمنها. كثافة عالية وراحة قصيرة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('easy_jog', mins(3)), item('wall_ball', reps('8')), item('kettlebell_swing', reps('10')), item('step_burpee', reps('5'))]),
      block(MAIN, 'emom', { minutes: 24, note: ['Finish the work, rest what is left of the minute', 'أنهِ الحركة وارتح ما تبقّى من الدقيقة'] }, [
        item('wall_ball', reps('20')),
        item('burpee', reps('12')),
        item('kettlebell_swing', reps('20')),
        item('run', meters(200)),
      ]),
      coolFull,
    ],
  },
  {
    key: 'hyrox-endurance-grind', level: 'advanced', format: 'amrap', minutes: 45, equipment: ['wall_ball', 'dumbbells'],
    title: ['Endurance Grind', 'تحدي التحمّل'],
    desc: ['Thirty minutes of running, wall balls and carries without a break. Find a pace you can hold to the end.', 'ثلاثون دقيقة من الجري ورمي الكرة والحمل دون توقف. جد إيقاعًا تستطيع الحفاظ عليه حتى النهاية.'],
    blocks: [
      warmRun(8),
      block(MAIN, 'amrap', { minutes: 30, note: ['Every round should take about the same time', 'كل جولة يجب أن تستغرق الوقت نفسه تقريبًا'] }, [
        item('run', meters(600)),
        item('wall_ball', reps('20')),
        item('farmer_carry', meters(50)),
      ]),
      coolFull,
    ],
  },
  {
    key: 'hyrox-strong-legs-fast-runs', level: 'advanced', format: 'strength', minutes: 55, equipment: ['bike', 'barbell', 'rack', 'sled'],
    title: ['Strong Legs, Fast Runs', 'ساقان قويتان وجري سريع'],
    desc: ['Heavy squats and sled pushes, then fast 400s on loaded legs. Strength and speed in one session.', 'سكوات ثقيل ودفع زلاجة، ثم جري سريع 400 م بساقين متعبتين. القوة والسرعة في جلسة واحدة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('bike', mins(4)), item('leg_swings', perSide(['10', '10'])), item('air_squat', reps('10')), item('skips', meters(20))]),
      block(['Strength', 'القوة'], 'strength', {}, [
        item('back_squat', sets(4, '6'), ['1–2 reps left in the tank · rest 2–3 min', 'اترك تكرارًا أو اثنين · راحة 2–3 د']),
        item('sled_push', sets(5, '15 m'), ['Heavy · rest 90 s', 'وزن ثقيل · راحة 90 ث']),
      ]),
      block(['Fast runs', 'جري سريع'], 'intervals', { rounds: 4, note: ['Fast but controlled, faster than race pace', 'سريع مع تحكم، أسرع من إيقاع السباق'] }, [
        item('run', meters(400)),
        item('walk', secs(90)),
      ]),
      coolLegs,
    ],
  },
];
