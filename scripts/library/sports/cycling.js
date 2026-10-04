// Cycling: an aerobic engine built on the bike, threshold and sprint power on top, strong hips, hamstrings
// and core off the bike, and mobility that undoes the hunched riding position. 4 beginner, 4 intermediate,
// 4 advanced.
const { item, block, reps, sets, secs, mins, perSide, WARM, MAIN, COOL } = require('../kit');

const SPIN = ['Easy spin', 'دوران خفيف'];
const FAST = ['Fast spin', 'دوران سريع'];
const warmBike = (minutes = 6) => block(WARM, 'flow', { minutes }, [
  item('bike', mins(minutes - 2), ['Light resistance, build the pace slowly', 'مقاومة خفيفة، وزِد السرعة تدريجيًا'], SPIN),
  item('leg_swings', perSide(['8', '8'])),
  item('hip_openers', perSide(['6', '6'])),
]);
const warmHard = block(WARM, 'flow', { minutes: 10 }, [
  item('bike', mins(6), null, SPIN),
  item('bike', mins(2), ['Lift the pace a little every 30 s', 'ارفع السرعة قليلًا كل 30 ث'], ['Build-up spin', 'دوران تصاعدي']),
  item('leg_swings', perSide(['8', '8'])),
]);
const coolBike = block(COOL, 'flow', { minutes: 5 }, [
  item('hip_flexor_stretch', perSide(secs(30))),
  item('quad_stretch', perSide(secs(30))),
  item('hamstring_stretch', perSide(secs(30))),
  item('chest_stretch', secs(30)),
]);
const coolStrength = block(COOL, 'flow', { minutes: 5 }, [
  item('hip_flexor_stretch', perSide(secs(30))),
  item('hamstring_stretch', perSide(secs(30))),
  item('figure_four_stretch', perSide(secs(30))),
  item('chest_stretch', secs(30)),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'cycling-easy-spin', level: 'beginner', format: 'steady', minutes: 28, equipment: ['bike'],
    title: ['Easy Spin', 'دوران خفيف'],
    desc: ['Twenty minutes of light pedalling to build your base and get used to the bike. Anyone can start here.', 'عشرون دقيقة من التبديل الخفيف لبناء قاعدتك والتعوّد على الدراجة. يمكن لأي شخص أن يبدأ هنا.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('bike', mins(3), null, ['Very easy spin', 'دوران خفيف جدًا'])]),
      block(MAIN, 'steady', {}, [
        item('bike', mins(20), ['Light resistance; you should be able to talk the whole time', 'مقاومة خفيفة، ويجب أن تستطيع الكلام طوال الوقت'], SPIN),
      ]),
      coolBike,
    ],
  },
  {
    key: 'cycling-cadence-builder', level: 'beginner', format: 'intervals', minutes: 26, equipment: ['bike'],
    title: ['Cadence Builder', 'بناء سرعة التبديل'],
    desc: ['Short spells of fast, light pedalling. Teaches smooth legs and a quicker cadence without heavy effort.', 'فترات قصيرة من التبديل السريع والخفيف. تعلّمك تبديلًا سلسًا وإيقاعًا أسرع دون جهد كبير.'],
    blocks: [
      warmBike(4),
      block(MAIN, 'intervals', { rounds: 6, note: ['Keep the resistance light: spin faster, not harder', 'أبقِ المقاومة خفيفة: دوّر أسرع لا أثقل'] }, [
        item('bike', mins(1), ['Hips still on the saddle, no bouncing', 'الوركان ثابتان على المقعد دون ارتداد'], FAST),
        item('bike', mins(2), null, SPIN),
      ]),
      coolBike,
    ],
  },
  {
    key: 'cycling-rider-strength-start', level: 'beginner', format: 'rounds', minutes: 22, equipment: [],
    title: ['Rider Strength Start', 'بداية قوة الدرّاج'],
    desc: ['Glutes, hamstrings and core that make pedalling stronger and your back happier. Bodyweight only.', 'أرداف وفخذ خلفية وجذع تجعل التبديل أقوى وظهرك أكثر راحة. بوزن الجسم فقط.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('march', mins(1)), item('cat_cow', reps('6')), item('hip_hinge', reps('8'))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('glute_bridge', reps('12'), ['Squeeze the glutes at the top', 'اضغط الأرداف في الأعلى']),
        item('air_squat', reps('10')),
        item('hip_hinge', reps('10')),
        item('bird_dog', perSide(['6', '6'])),
        item('dead_bug', perSide(['6', '6'])),
      ]),
      coolStrength,
    ],
  },
  {
    key: 'cycling-saddle-reset', level: 'beginner', format: 'flow', minutes: 15, equipment: [],
    title: ['Saddle Reset', 'استعادة بعد الركوب'],
    desc: ['Undoes the hunched riding position: opens the chest and hips and frees the upper back. Do it after any ride.', 'يعاكس وضعية الانحناء على الدراجة: يفتح الصدر والوركين ويحرّر الظهر العلوي. نفّذه بعد أي ركوب.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('neck_rolls', secs(30)), item('shoulder_rolls', secs(30)), item('cat_cow', reps('8'))]),
      block(MAIN, 'flow', { rounds: 2, note: ['Slow and steady; breathe into each position', 'ببطء وثبات، وتنفّس في كل وضعية'] }, [
        item('thoracic_rotation', perSide(['8', '8'])),
        item('worlds_greatest_stretch', perSide(['3', '3'])),
        item('hip_flexor_stretch', perSide(secs(30))),
        item('chest_stretch', secs(30)),
      ]),
      block(COOL, 'flow', { minutes: 4 }, [
        item('childs_pose', mins(1)),
        item('figure_four_stretch', perSide(secs(30))),
        item('hamstring_stretch', perSide(secs(30))),
      ]),
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'cycling-threshold-blocks', level: 'intermediate', format: 'intervals', minutes: 42, equipment: ['bike'],
    title: ['Threshold Blocks', 'فترات العتبة'],
    desc: ['Three long, hard-but-steady efforts that raise the pace you can hold on long climbs and group rides.', 'ثلاثة جهود طويلة وقوية وثابتة ترفع السرعة التي تستطيع الحفاظ عليها في الصعود الطويل والركوب الجماعي.'],
    blocks: [
      warmBike(7),
      block(MAIN, 'intervals', { rounds: 3, note: ['Hard but steady: only a few words at a time', 'قوي وثابت: كلمات قليلة فقط'] }, [
        item('bike', mins(7), null, ['Threshold effort', 'جهد العتبة']),
        item('bike', mins(3), null, SPIN),
      ]),
      coolBike,
    ],
  },
  {
    key: 'cycling-climb-simulation', level: 'intermediate', format: 'intervals', minutes: 36, equipment: ['bike'],
    title: ['Climb Simulation', 'محاكاة الصعود'],
    desc: ['Heavy resistance, seated and standing, like a long hill. Builds leg strength on the bike.', 'مقاومة عالية جالسًا ووقوفًا كأنك تصعد تلًّا طويلًا. تبني قوة الساقين على الدراجة.'],
    blocks: [
      warmBike(),
      block(MAIN, 'intervals', { rounds: 5, note: ['Turn the resistance up for the climbs and down for the easy spin', 'ارفع المقاومة للصعود وخفّضها للدوران الخفيف'] }, [
        item('bike', mins(2), ['Slow, strong pedal strokes', 'تبديل بطيء وقوي'], ['Seated climb', 'صعود جالسًا']),
        item('bike', mins(1), ['Hands light on the bars, hips over the pedals', 'يدان خفيفتان على المقود والوركان فوق الدواسات'], ['Standing climb', 'صعود وقوفًا']),
        item('bike', mins(2), null, SPIN),
      ]),
      coolBike,
    ],
  },
  {
    key: 'cycling-rider-strength', level: 'intermediate', format: 'strength', minutes: 40, equipment: ['kettlebell', 'dumbbells', 'bench'],
    title: ['Rider Strength', 'قوة الدرّاج'],
    desc: ['Squat, hinge and single-leg work for more power per pedal stroke and fewer knee and back niggles.', 'سكوات وانحناء وحركات للساق الواحدة لقوة أكبر في كل دورة ومشاكل أقل في الركبة والظهر.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('march', mins(1)), item('hip_hinge', reps('10')), item('air_squat', reps('8')), item('glute_bridge', reps('8'))]),
      block(MAIN, 'strength', {}, [
        item('goblet_squat', sets(3, '10'), ['2 reps left in the tank · rest 90 s', 'اترك تكرارين · راحة 90 ث']),
        item('romanian_deadlift', sets(3, '10'), ['Feel the hamstrings stretch · rest 90 s', 'اشعر بإطالة الفخذ الخلفية · راحة 90 ث']),
        item('bulgarian_split_squat', sets(3, '8 / side'), ['Rest 60 s', 'راحة 60 ث']),
        item('side_plank', sets(3, '30 s / side'), ['Rest 30 s', 'راحة 30 ث']),
      ]),
      coolStrength,
    ],
  },
  {
    key: 'cycling-long-ride-back', level: 'intermediate', format: 'rounds', minutes: 30, equipment: ['band'],
    title: ['Strong Back for Long Rides', 'ظهر قوي للركوب الطويل'],
    desc: ['An upper back and core that hold your riding position for hours without aching. Light band, steady reps.', 'ظهر علوي وجذع يثبّتان وضعيتك على الدراجة لساعات دون ألم. شريط مقاومة خفيف وتكرارات ثابتة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('shoulder_rolls', secs(30)), item('cat_cow', reps('8')), item('band_pull_apart', reps('10'))]),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('band_pull_apart', reps('15'), ['Squeeze the shoulder blades together', 'اضغط لوحي الكتف معًا']),
        item('dead_bug', perSide(['8', '8'])),
        item('pallof_press', perSide(['10', '10'])),
        item('bird_dog', perSide(['8', '8'])),
        item('plank', secs(40)),
      ]),
      block(COOL, 'flow', { minutes: 4 }, [
        item('chest_stretch', secs(30)),
        item('lat_stretch', perSide(secs(30))),
        item('childs_pose', mins(1)),
      ]),
    ],
  },

  // ───── Advanced ─────
  {
    key: 'cycling-max-aerobic', level: 'advanced', format: 'intervals', minutes: 45, equipment: ['bike'],
    title: ['Max Aerobic Intervals', 'فترات القدرة الهوائية القصوى'],
    desc: ['Six hard three-minute efforts that lift your ceiling: faster climbs and stronger attacks.', 'ستة جهود قوية مدة كل منها ثلاث دقائق ترفع سقف قدرتك: صعود أسرع وهجمات أقوى.'],
    blocks: [
      warmHard,
      block(MAIN, 'intervals', { rounds: 6, note: ['Hard: breathing heavily, the last minute should really bite', 'قوي: تنفّس ثقيل، والدقيقة الأخيرة صعبة فعلًا'] }, [
        item('bike', mins(3), null, ['Hard effort', 'جهد قوي']),
        item('bike', mins(2), null, SPIN),
      ]),
      coolBike,
    ],
  },
  {
    key: 'cycling-sprint-power', level: 'advanced', format: 'intervals', minutes: 37, equipment: ['bike'],
    title: ['Sprint Power', 'قوة الانطلاق'],
    desc: ['All-out 20-second sprints with full recoveries. Builds the punch for attacks and finishing sprints.', 'انطلاقات بأقصى قوة لمدة 20 ث مع استشفاء كامل. تبني قوة الهجوم والانطلاقة الأخيرة.'],
    blocks: [
      warmHard,
      block(MAIN, 'intervals', { rounds: 10, note: ['Every sprint at full power; recover fully before the next', 'كل انطلاقة بكامل قوتك، واستشفِ تمامًا قبل التالية'] }, [
        item('bike', secs(20), ['Heavy gear, out of the saddle', 'مقاومة عالية ووقوفًا عن المقعد'], ['Bike sprint', 'دراجة بأقصى سرعة']),
        item('bike', mins(2), null, SPIN),
      ]),
      coolBike,
    ],
  },
  {
    key: 'cycling-long-endurance', level: 'advanced', format: 'steady', minutes: 60, equipment: ['bike'],
    title: ['Long Endurance Ride', 'ركوب التحمل الطويل'],
    desc: ['Fifty steady minutes in your aerobic zone. The foundation for long rides and events.', 'خمسون دقيقة ثابتة في منطقتك الهوائية. الأساس للركوب الطويل والفعاليات.'],
    blocks: [
      warmBike(5),
      block(MAIN, 'steady', {}, [
        item('bike', mins(50), ['Steady: you can talk in full sentences; drink every 15 minutes', 'ثابت: تستطيع الكلام بجمل كاملة، واشرب كل 15 دقيقة'], ['Steady ride', 'ركوب ثابت']),
      ]),
      coolBike,
    ],
  },
  {
    key: 'cycling-power-legs', level: 'advanced', format: 'strength', minutes: 55, equipment: ['box', 'barbell', 'rack', 'bench'],
    title: ['Power Legs', 'ساقان قويتان'],
    desc: ['Heavy squats and hip thrusts plus jumps, for more power on climbs and sprints. For riders with gym experience.', 'سكوات ودفع حوض بأوزان ثقيلة مع قفزات، لقوة أكبر في الصعود والانطلاق. للدرّاجين ذوي الخبرة في الصالة الرياضية.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('march', mins(1)), item('leg_swings', perSide(['8', '8'])), item('hip_hinge', reps('10')), item('glute_bridge', reps('10')), item('air_squat', reps('10'))]),
      block(['Power', 'القوة الانفجارية'], 'strength', { note: ['Full rest: every jump should be your best', 'راحة كاملة: كل قفزة يجب أن تكون أفضل ما لديك'] }, [
        item('box_jump', sets(4, '4'), ['Step down · rest 90 s', 'انزل خطوة خطوة · راحة 90 ث']),
      ]),
      block(['Strength', 'القوة'], 'strength', {}, [
        item('back_squat', sets(4, '5'), ['1–2 reps left in the tank · rest 2 min', 'اترك تكرارًا أو اثنين · راحة 2 د']),
        item('hip_thrust', sets(4, '8'), ['Pause 1 s at the top · rest 90 s', 'توقّف 1 ث في الأعلى · راحة 90 ث']),
        item('nordic_curl', sets(3, '5'), ['Lower as slowly as you can · rest 90 s', 'انزل ببطء قدر ما تستطيع · راحة 90 ث']),
        item('hollow_hold', sets(3, '30 s'), ['Rest 30 s', 'راحة 30 ث']),
      ]),
      coolStrength,
    ],
  },
];
