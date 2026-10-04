// Pickleball: a low, quiet ready position at the kitchen line, short quick steps, careful wrists and
// shoulders, and good balance. Many players are new or older, so beginner work stays gentle.
// 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, sets, secs, mins, meters, perSide, WARM, MAIN, COOL } = require('../kit');

const warmGentle = (minutes = 5) => block(WARM, 'flow', { minutes }, [
  item('march', secs(45)),
  item('shoulder_rolls', secs(30)),
  item('leg_swings', perSide(['8', '8']), ['Hold a wall or fence if you need to', 'استند إلى حائط أو سياج إن احتجت']),
  item('step_jack', secs(30)),
]);
const warmKitchen = (minutes = 6) => block(WARM, 'flow', { minutes }, [
  item('march', secs(45)),
  item('arm_circles', secs(30)),
  item('hip_openers', perSide(['6', '6'])),
  item('air_squat', reps('8')),
  item('quick_feet', secs(20)),
]);
const coolLegs = block(COOL, 'flow', { minutes: 5 }, [
  item('quad_stretch', perSide(secs(30))),
  item('hamstring_stretch', perSide(secs(30))),
  item('calf_stretch', perSide(secs(30))),
  item('standing_forward_fold', secs(30)),
]);
const coolUpper = block(COOL, 'flow', { minutes: 4 }, [
  item('chest_stretch', secs(30)),
  item('lat_stretch', perSide(secs(30))),
  item('neck_rolls', secs(30)),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'pickleball-ready-position', level: 'beginner', format: 'rounds', minutes: 20, equipment: ['bench'],
    title: ['Ready Position Basics', 'أساسيات وضعية الاستعداد'],
    desc: ['Get comfortable staying low with your knees bent at the kitchen line. Gentle and safe for new players.', 'اعتد على البقاء منخفضًا وركبتاك مثنيتان عند خط المطبخ. لطيف وآمن للاعبين الجدد.'],
    blocks: [
      warmGentle(),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 90 s between rounds', 'راحة 90 ث بين الجولات'] }, [
        item('box_squat', reps('10'), ['Sit down softly, stand up tall', 'اجلس بهدوء وانهض مستقيمًا']),
        item('wall_sit', secs(20), ['Your low ready position, held still', 'وضعية الاستعداد المنخفضة بثبات']),
        item('glute_bridge', reps('10')),
        item('calf_raise', reps('12')),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'pickleball-steady-feet', level: 'beginner', format: 'rounds', minutes: 20, equipment: [],
    title: ['Steady on Your Feet', 'ثبات على القدمين'],
    desc: ['Better balance for reaching and recovering without wobbling. Use a wall for support any time.', 'توازن أفضل للوصول إلى الكرة والعودة دون تمايل. استند إلى حائط متى احتجت.'],
    blocks: [
      warmGentle(),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 60 s between rounds · move slowly', 'راحة 60 ث بين الجولات · تحرّك ببطء'] }, [
        item('split_squat', perSide(['6', '6']), ['Hold a wall if needed', 'استند إلى حائط إن لزم']),
        item('single_leg_calf_raise', perSide(['8', '8']), ['Light fingertip support on a wall', 'استند بأطراف أصابعك إلى حائط']),
        item('hip_hinge', reps('10')),
        item('bird_dog', perSide(['6', '6'])),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'pickleball-kitchen-footwork', level: 'beginner', format: 'intervals', minutes: 16, equipment: [],
    title: ['Kitchen Footwork', 'خطوات منطقة المطبخ'],
    desc: ['Short, quick steps instead of big lunges. Short bursts with plenty of rest.', 'خطوات قصيرة وسريعة بدل الخطوات الواسعة. دفعات قصيرة مع راحة كافية.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('march', mins(1)), item('step_jack', secs(45)), item('ankle_mobility', perSide(['8', '8']))]),
      block(MAIN, 'intervals', { rounds: 5, note: ['Small steps, stay on the balls of your feet', 'خطوات صغيرة، وابقَ على مقدمة قدميك'] }, [
        item('quick_feet', secs(15)),
        item('lateral_shuffle', secs(15), ['Two short steps each way', 'خطوتان قصيرتان في كل اتجاه']),
        item('march', secs(45)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'pickleball-paddle-arm-care', level: 'beginner', format: 'rounds', minutes: 16, equipment: ['band', 'dumbbells'],
    title: ['Paddle Arm Care', 'العناية بذراع المضرب'],
    desc: ['Light work for the shoulder and a firmer grip, which takes stress off the wrist and elbow. Good on rest days.', 'حركات خفيفة للكتف وقبضة أقوى تخفّف الضغط عن الرسغ والمرفق. مناسب لأيام الراحة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('shoulder_rolls', secs(30)), item('arm_circles', secs(30)), item('neck_rolls', secs(30))]),
      block(MAIN, 'rounds', { rounds: 2, note: ['Light band and weights · rest 60 s between rounds', 'شريط وأوزان خفيفة · راحة 60 ث بين الجولات'] }, [
        item('band_pull_apart', reps('12')),
        item('pallof_press', perSide(['8', '8'])),
        item('thoracic_rotation', perSide(['6', '6'])),
        item('farmer_carry', meters(20), ['Light dumbbells, firm grip', 'دمبل خفيف وقبضة ثابتة']),
      ]),
      coolUpper,
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'pickleball-low-steady-legs', level: 'intermediate', format: 'rounds', minutes: 30, equipment: ['kettlebell'],
    title: ['Low and Steady Legs', 'ساقان منخفضتان وثابتتان'],
    desc: ['Legs that stay low through a long dink rally without burning out.', 'ساقان تبقيان منخفضتين طوال تبادل طويل من الضربات القصيرة دون أن تتعبا.'],
    blocks: [
      warmKitchen(),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('goblet_squat', reps('10')),
        item('lateral_lunge', perSide(['8', '8'])),
        item('wall_sit', secs(40)),
        item('single_leg_calf_raise', perSide(['10', '10'])),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'pickleball-transition-steps', level: 'intermediate', format: 'intervals', minutes: 28, equipment: [],
    title: ['Transition Steps', 'خطوات الانتقال'],
    desc: ['Move up from the baseline, stop, and get low before the next ball. Trains the run to the kitchen line.', 'تقدّم من الخط الخلفي، ثم توقف وانخفض قبل الكرة التالية. يدرّب الانتقال إلى خط المطبخ.'],
    blocks: [
      warmKitchen(),
      block(MAIN, 'intervals', { rounds: 7, note: ['Walk to recover between rounds', 'امشِ للاستشفاء بين الجولات'] }, [
        item('shuttle_run', secs(15)),
        item('wall_sit', secs(20), ['Stop and sit low, like arriving at the kitchen', 'توقف وانخفض كأنك وصلت إلى المطبخ']),
        item('quick_feet', secs(20)),
        item('walk', secs(45)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'pickleball-single-leg-control', level: 'intermediate', format: 'strength', minutes: 35, equipment: ['dumbbells', 'box'],
    title: ['Single-Leg Balance', 'توازن الساق الواحدة'],
    desc: ['Strength on one leg at a time, for stretching wide to a ball and getting back without losing balance.', 'قوة على ساق واحدة في كل مرة، للامتداد نحو الكرة والعودة دون فقدان التوازن.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('march', mins(1)), item('leg_swings', perSide(['8', '8'])), item('reverse_lunge', perSide(['6', '6']))]),
      block(MAIN, 'strength', {}, [
        item('single_leg_rdl', sets(3, '8 / side'), ['Slow and controlled · rest 60 s', 'ببطء وتحكّم · راحة 60 ث']),
        item('step_up', sets(3, '8 / side'), ['Rest 60 s', 'راحة 60 ث']),
        item('split_squat', sets(3, '10 / side'), ['Rest 60 s', 'راحة 60 ث']),
      ]),
      block(['Core', 'الجذع'], 'rounds', { rounds: 2, note: ['Rest 30 s between rounds', 'راحة 30 ث بين الجولات'] }, [
        item('side_plank', perSide(secs(25))),
        item('dead_bug', perSide(['8', '8'])),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'pickleball-drive-reset-core', level: 'intermediate', format: 'rounds', minutes: 28, equipment: ['med_ball', 'band'],
    title: ['Drive and Reset Core', 'جذع للضربات القوية والهادئة'],
    desc: ['Turn hard for the drive, stay quiet for the reset. A strong trunk keeps the arm and wrist from doing all the work.', 'دوران قوي للضربة الهجومية وهدوء للضربة الهادئة. الجذع القوي يمنع الذراع والرسغ من تحمّل العمل كله.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('cat_cow', reps('8')), item('thoracic_rotation', perSide(['8', '8'])), item('band_pull_apart', reps('12'))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('med_ball_rotational_throw', perSide(['6', '6'])),
        item('pallof_press', perSide(['10', '10'])),
        item('bird_dog', perSide(['8', '8'])),
        item('plank', secs(40)),
      ]),
      block(COOL, 'flow', { minutes: 4 }, [item('childs_pose', mins(1)), item('lat_stretch', perSide(secs(30))), item('figure_four_stretch', perSide(secs(30)))]),
    ],
  },

  // ───── Advanced ─────
  {
    key: 'pickleball-firefight-minutes', level: 'advanced', format: 'emom', minutes: 35, equipment: [],
    title: ['Firefight Minutes', 'دقائق التبادل السريع'],
    desc: ['A new move every minute for 24 minutes: fast feet, low hips and quick recovery, like a volley exchange at the net.', 'حركة جديدة كل دقيقة لمدة 24 دقيقة: قدمان سريعتان ووركان منخفضان واستشفاء سريع، مثل تبادل الضربات الطائرة عند الشبكة.'],
    blocks: [
      warmKitchen(6),
      block(MAIN, 'emom', { minutes: 24, note: ['Finish the work, rest what is left of the minute', 'أنهِ الحركة وارتح ما تبقّى من الدقيقة'] }, [
        item('lateral_shuffle', secs(35)),
        item('jump_squat', reps('10')),
        item('quick_feet', secs(30)),
        item('skater_jump', perSide(['8', '8'])),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'pickleball-strong-all-game', level: 'advanced', format: 'strength', minutes: 50, equipment: ['bike', 'barbell', 'rack', 'dumbbells', 'bench', 'cable'],
    title: ['Strong All Game', 'قوة طوال المباراة'],
    desc: ['Heavy legs and hips plus shoulder work, for players who want power on drives and fewer niggles.', 'أوزان ثقيلة للساقين والوركين مع حركات للكتف، للاعبين الذين يريدون قوة في الضربات وإصابات أقل.'],
    blocks: [
      block(WARM, 'flow', { minutes: 7 }, [item('bike', mins(3)), item('hip_hinge', reps('10')), item('air_squat', reps('10')), item('shoulder_rolls', secs(30))]),
      block(MAIN, 'strength', {}, [
        item('front_squat', sets(4, '6'), ['1–2 reps left in the tank · rest 2 min', 'اترك تكرارًا أو اثنين · راحة 2 د']),
        item('romanian_deadlift', sets(4, '8'), ['Rest 90 s', 'راحة 90 ث']),
        item('bulgarian_split_squat', sets(3, '8 / side'), ['Rest 90 s', 'راحة 90 ث']),
        item('face_pull', sets(3, '15'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'pickleball-game-point-race', level: 'advanced', format: 'for_time', minutes: 36, equipment: ['kettlebell'],
    title: ['Game-Point Race', 'سباق نقطة المباراة'],
    desc: ['Five rounds against the clock. Keep your footwork tidy even when your heart rate is high.', 'خمس جولات ضد الوقت. حافظ على دقة حركة قدميك حتى مع ارتفاع نبضك.'],
    blocks: [
      warmKitchen(7),
      block(['For time', 'ضد الوقت'], 'for_time', { minutes: 20, rounds: 5, note: ['5 rounds, 20 min cap. Write down your time.', '5 جولات، الحد 20 د. سجّل وقتك.'] }, [
        item('shuttle_run', meters(80)),
        item('kettlebell_swing', reps('15')),
        item('lateral_shuffle', secs(30)),
        item('plank_shoulder_tap', perSide(['10', '10'])),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'pickleball-reach-recover', level: 'advanced', format: 'amrap', minutes: 35, equipment: ['dumbbells', 'bench'],
    title: ['Reach and Recover', 'امتد وعُد'],
    desc: ['Balance under fatigue: stick every landing and keep your hips level for 18 minutes. For players who lunge for wide balls.', 'التوازن مع التعب: ثبّت كل هبوط وأبقِ وركيك مستويين لمدة 18 دقيقة. للاعبين الذين يمتدون نحو الكرات البعيدة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 7 }, [item('march', mins(1)), item('leg_swings', perSide(['10', '10'])), item('lateral_lunge', perSide(['6', '6'])), item('ankle_mobility', perSide(['8', '8']))]),
      block(['AMRAP', 'أكبر عدد من الجولات'], 'amrap', { minutes: 18, note: ['Steady pace; quality over speed', 'إيقاع ثابت، الجودة قبل السرعة'] }, [
        item('skater_jump', perSide(['6', '6']), ['Hold each landing for 2 s', 'اثبت عند كل هبوط 2 ث']),
        item('single_leg_rdl', perSide(['8', '8'])),
        item('lateral_lunge', perSide(['8', '8'])),
        item('copenhagen_plank', perSide(secs(15))),
      ]),
      coolLegs,
    ],
  },
];
