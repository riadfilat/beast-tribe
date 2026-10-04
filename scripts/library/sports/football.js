// Football: repeat sprints, quick changes of direction, single-leg and hamstring strength, a groin
// that holds up to wide tackles, and an engine for 90 minutes. 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, sets, secs, mins, meters, perSide, WARM, MAIN, COOL } = require('../kit');

const warmPitch = (minutes = 6) => block(WARM, 'flow', { minutes }, [
  item('easy_jog', mins(2)),
  item('skips', meters(20)),
  item('leg_swings', perSide(['10', '10'])),
  item('lateral_shuffle', secs(20)),
  item('high_knees', secs(20)),
]);
const coolLegs = block(COOL, 'flow', { minutes: 5 }, [
  item('quad_stretch', perSide(secs(30))),
  item('hamstring_stretch', perSide(secs(30))),
  item('hip_flexor_stretch', perSide(secs(30))),
  item('calf_stretch', perSide(secs(30))),
]);
const coolHips = block(COOL, 'flow', { minutes: 5 }, [
  item('hamstring_stretch', perSide(secs(30))),
  item('figure_four_stretch', perSide(secs(30))),
  item('hip_flexor_stretch', perSide(secs(30))),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'football-pitch-legs-basics', level: 'beginner', format: 'rounds', minutes: 20, equipment: [],
    title: ['Pitch Legs Basics', 'أساسيات ساقي لاعب كرة القدم'],
    desc: ['Simple leg strength for running, stopping and kicking. No equipment, for anyone starting out.', 'قوة أساسية للساقين للجري والتوقف والتسديد. بلا معدات، لكل من يبدأ.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('march', mins(1)), item('leg_swings', perSide(['8', '8'])), item('air_squat', reps('8'))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('air_squat', reps('12')),
        item('reverse_lunge', perSide(['8', '8']), ['Front knee stays over the foot', 'تبقى الركبة الأمامية فوق القدم']),
        item('glute_bridge', reps('12')),
        item('calf_raise', reps('15')),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'football-shuttle-starter', level: 'beginner', format: 'intervals', minutes: 20, equipment: [],
    title: ['Shuttle Starter', 'بداية الجري المكوكي'],
    desc: ['Your first repeat runs: short bursts, a turn, and plenty of time to recover. Builds the base for sprinting in a match.', 'أول جري متكرر لك: دفعات قصيرة ودوران ووقت كافٍ للاستشفاء. يبني الأساس للعدو في المباراة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('walk', mins(2)), item('skips', meters(20)), item('leg_swings', perSide(['8', '8'])), item('quick_feet', secs(15))]),
      block(MAIN, 'intervals', { rounds: 6, note: ['Steady speed, not flat out. Turn low with small steps.', 'سرعة ثابتة لا قصوى. استدر منخفضًا بخطوات صغيرة.'] }, [
        item('shuttle_run', secs(15)),
        item('walk', secs(45)),
        item('quick_feet', secs(10)),
        item('walk', secs(30)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'football-injury-guard-basics', level: 'beginner', format: 'rounds', minutes: 20, equipment: [],
    title: ['Injury Guard Basics', 'أساسيات الوقاية من الإصابات'],
    desc: ['Hamstrings, groin, ankles and trunk: the places footballers get hurt most. Do it twice a week before training.', 'الفخذ الخلفية والمنطقة الداخلية للفخذ والكاحل والجذع: أكثر ما يُصاب عند لاعبي كرة القدم. نفّذه مرتين أسبوعيًا قبل التدريب.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('march', mins(1)), item('hip_openers', perSide(['6', '6'])), item('ankle_mobility', perSide(['8', '8']))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Slow and controlled · rest 45 s between rounds', 'ببطء وتحكّم · راحة 45 ث بين الجولات'] }, [
        item('hip_hinge', reps('10'), ['Push the hips back, back stays flat', 'ادفع الوركين للخلف والظهر مستقيم']),
        item('glute_bridge', reps('12')),
        item('lateral_lunge', perSide(['6', '6'])),
        item('side_plank', perSide(secs(20))),
        item('calf_raise', reps('15'), ['Lower slowly', 'انزل ببطء']),
      ]),
      coolHips,
    ],
  },
  {
    key: 'football-recovery-run', level: 'beginner', format: 'steady', minutes: 25, equipment: [],
    title: ['Day-After Recovery', 'استشفاء اليوم التالي'],
    desc: ['An easy jog and gentle mobility the day after a match. Loosens tight legs without adding fatigue.', 'هرولة خفيفة وحركات مرونة لطيفة في اليوم التالي للمباراة. تُرخي الساقين المشدودتين دون تعب إضافي.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('walk', mins(3))]),
      block(MAIN, 'steady', { note: ['You should be able to talk the whole time', 'يجب أن تستطيع الكلام طوال الوقت'] }, [
        item('easy_jog', mins(12)),
      ]),
      block(['Mobility', 'المرونة'], 'flow', { minutes: 5 }, [
        item('worlds_greatest_stretch', perSide(['3', '3'])),
        item('hip_openers', perSide(['6', '6'])),
        item('leg_swings', perSide(['10', '10'])),
      ]),
      coolLegs,
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'football-repeat-sprints', level: 'intermediate', format: 'intervals', minutes: 30, equipment: [],
    title: ['Repeat Sprints', 'العدو المتكرر'],
    desc: ['Sprint, recover, sprint again: the pattern of a real match. Trains you to be as fast in the 80th minute as in the 5th.', 'عدو ثم استشفاء ثم عدو من جديد: نمط المباراة الحقيقية. يدرّبك لتكون سريعًا في الدقيقة 80 كما في الدقيقة 5.'],
    blocks: [
      warmPitch(),
      block(MAIN, 'intervals', { rounds: 10, note: ['Near top speed · walk back to the start to recover', 'قرب السرعة القصوى · امشِ عائدًا إلى البداية للاستشفاء'] }, [
        item('sprint', meters(30)),
        item('walk', secs(30)),
      ]),
      block(['Core', 'الجذع'], 'rounds', { rounds: 2 }, [
        item('plank', secs(40)),
        item('side_plank', perSide(secs(25))),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'football-agility-cuts', level: 'intermediate', format: 'rounds', minutes: 30, equipment: [],
    title: ['Agility and Cuts', 'الرشاقة وتغيير الاتجاه'],
    desc: ['Sharp turns, side steps and quick plants to beat a defender or track a winger. For players who already run comfortably.', 'استدارات حادة وخطوات جانبية وتثبيت سريع للقدم لتجاوز مدافع أو ملاحقة جناح. للاعبين الذين يجرون براحة.'],
    blocks: [
      warmPitch(),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 75 s between rounds', 'راحة 75 ث بين الجولات'] }, [
        item('shuttle_run', secs(20), ['Plant the outside foot, push off hard', 'ثبّت القدم الخارجية وانطلق بقوة']),
        item('skater_jump', perSide(['6', '6']), ['Stick each landing for a second', 'اثبت ثانية عند كل هبوط']),
        item('lateral_shuffle', secs(20)),
        item('lateral_lunge', perSide(['8', '8'])),
        item('quick_feet', secs(15)),
      ]),
      coolHips,
    ],
  },
  {
    key: 'football-hamstring-groin-strength', level: 'intermediate', format: 'strength', minutes: 35, equipment: ['box', 'dumbbells', 'bench'],
    title: ['Hamstring and Groin Strength', 'قوة الفخذ الخلفية والداخلية'],
    desc: ['Nordic curls and Copenhagen planks, the two moves with the best proof for cutting hamstring and groin injuries in football.', 'تمرين النورديك وبلانك كوبنهاغن، أكثر حركتين أثبتتا فائدتهما في الحد من إصابات الفخذ الخلفية والداخلية في كرة القدم.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('easy_jog', mins(2)), item('hip_hinge', reps('10')), item('lateral_lunge', perSide(['6', '6'])), item('glute_bridge', reps('10'))]),
      block(MAIN, 'strength', {}, [
        item('step_up', sets(3, '8 / side'), ['Drive through the top foot · rest 60 s', 'ادفع بالقدم العلوية · راحة 60 ث']),
        item('single_leg_rdl', sets(3, '8 / side'), ['Rest 60 s', 'راحة 60 ث']),
        item('nordic_curl', sets(3, '4'), ['Lower as slowly as you can, catch with your hands · rest 90 s', 'انزل ببطء قدر ما تستطيع واستقبل نفسك بيديك · راحة 90 ث']),
        item('copenhagen_plank', sets(3, '15 s / side'), ['Bend the top knee to make it easier · rest 45 s', 'اثنِ الركبة العلوية لتسهيلها · راحة 45 ث']),
      ]),
      coolHips,
    ],
  },
  {
    key: 'football-box-to-box-engine', level: 'intermediate', format: 'intervals', minutes: 40, equipment: [],
    title: ['Box-to-Box Engine', 'لياقة من منطقة إلى منطقة'],
    desc: ['Longer runs at a strong pace to build the aerobic base a midfielder needs to cover the whole pitch.', 'جري أطول بإيقاع قوي لبناء القاعدة الهوائية التي يحتاجها لاعب الوسط لتغطية الملعب كله.'],
    blocks: [
      warmPitch(7),
      block(MAIN, 'intervals', { rounds: 6, note: ['Hard but steady: the same pace every round', 'إيقاع قوي وثابت: السرعة نفسها في كل جولة'] }, [
        item('run', mins(3)),
        item('walk', mins(1)),
      ]),
      coolLegs,
    ],
  },

  // ───── Advanced ─────
  {
    key: 'football-match-fitness-emom', level: 'advanced', format: 'emom', minutes: 38, equipment: [],
    title: ['Match Fitness EMOM', 'لياقة المباراة كل دقيقة'],
    desc: ['Twenty-four minutes of sprints, jumps and turns, a new move every minute. Built for the last 20 minutes of a match.', 'أربع وعشرون دقيقة من العدو والقفز والاستدارة، حركة جديدة كل دقيقة. مصمَّم لآخر 20 دقيقة من المباراة.'],
    blocks: [
      warmPitch(7),
      block(MAIN, 'emom', { minutes: 24, note: ['Finish the work, rest what is left of the minute', 'أنهِ الحركة وارتح ما تبقّى من الدقيقة'] }, [
        item('sprint', meters(60)),
        item('lunge_jump', perSide(['6', '6'])),
        item('shuttle_run', secs(30)),
        item('burpee', reps('8')),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'football-first-step-acceleration', level: 'advanced', format: 'strength', minutes: 45, equipment: ['sled', 'box'],
    title: ['First-Step Acceleration', 'تسارع الخطوة الأولى'],
    desc: ['Win the race to the ball over the first five metres: heavy sled pushes, then short sprints and jumps while you are fresh.', 'اربح السباق إلى الكرة في الأمتار الخمسة الأولى: دفع زلاجة ثقيلة، ثم عدو قصير وقفزات وأنت نشيط.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('easy_jog', mins(3)), item('skips', meters(20)), item('leg_swings', perSide(['10', '10'])), item('high_knees', secs(20)), item('sprint', meters(20), ['Build to 80% speed', 'تدرّج حتى 80% من سرعتك'])]),
      block(['Power', 'القوة الانفجارية'], 'strength', { note: ['Full rest: quality over quantity', 'راحة كاملة: الجودة قبل الكمية'] }, [
        item('sled_push', sets(5, '15 m'), ['Body leaning forward, short powerful steps · rest 2 min', 'الجسم مائل للأمام وخطوات قصيرة قوية · راحة 2 د']),
        item('sprint', sets(6, '20 m'), ['From a standing start · walk back to rest', 'من وضع الوقوف · امشِ عائدًا للراحة']),
        item('box_jump', sets(4, '4'), ['Step down · rest 90 s', 'انزل خطوة خطوة · راحة 90 ث']),
      ]),
      block(['Strength', 'القوة'], 'strength', {}, [
        item('lunge_jump', sets(3, '5 / side'), ['Rest 90 s', 'راحة 90 ث']),
        item('single_leg_calf_raise', sets(3, '12 / side'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'football-strength-for-the-pitch', level: 'advanced', format: 'strength', minutes: 55, equipment: ['barbell', 'rack', 'dumbbells', 'bench', 'band'],
    title: ['Strength for the Pitch', 'قوة الملعب'],
    desc: ['Heavy squats and hinges for shoulder-to-shoulder duels, plus Nordic and Copenhagen work at full volume. For off-days in season.', 'سكوات وانحناء بأوزان ثقيلة للالتحامات الكتف بالكتف، مع النورديك وكوبنهاغن بحجم كامل. لأيام الراحة خلال الموسم.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('easy_jog', mins(4)), item('worlds_greatest_stretch', perSide(['3', '3'])), item('air_squat', reps('10')), item('hip_hinge', reps('10'))]),
      block(MAIN, 'strength', {}, [
        item('back_squat', sets(4, '5'), ['1–2 reps left in the tank · rest 2–3 min', 'اترك تكرارًا أو اثنين · راحة 2–3 د']),
        item('romanian_deadlift', sets(3, '8'), ['Rest 90 s', 'راحة 90 ث']),
        item('nordic_curl', sets(4, '5'), ['Lower as slowly as you can · rest 90 s', 'انزل ببطء قدر ما تستطيع · راحة 90 ث']),
        item('copenhagen_plank', sets(3, '25 s / side'), ['Top leg straight · rest 45 s', 'الرجل العلوية مستقيمة · راحة 45 ث']),
      ]),
      block(['Core', 'الجذع'], 'rounds', { rounds: 3, note: ['Rest 30 s between rounds', 'راحة 30 ث بين الجولات'] }, [
        item('pallof_press', perSide(['10', '10'])),
        item('hollow_hold', secs(25)),
      ]),
      coolHips,
    ],
  },
  {
    key: 'football-second-half-finisher', level: 'advanced', format: 'for_time', minutes: 38, equipment: [],
    title: ['Second-Half Finisher', 'ختام الشوط الثاني'],
    desc: ['Five hard rounds against the clock. Keep your legs and your head when the match is on the line.', 'خمس جولات قوية ضد الوقت. حافظ على ساقيك وتركيزك حين تُحسم المباراة.'],
    blocks: [
      warmPitch(7),
      block(['For time', 'ضد الوقت'], 'for_time', { minutes: 24, rounds: 5, note: ['5 rounds, 24 min cap. Write down your time.', '5 جولات، الحد 24 د. سجّل وقتك.'] }, [
        item('run', meters(400)),
        item('walking_lunge', perSide(['10', '10'])),
        item('burpee', reps('10')),
        item('sprint', meters(50)),
      ]),
      coolLegs,
    ],
  },
];
