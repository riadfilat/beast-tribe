// Basketball: a higher jump and safe landings, low defensive slides, strong ankles and calves, a core
// that holds up to contact, and legs for the fourth quarter. 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, sets, secs, mins, meters, perSide, WARM, MAIN, COOL } = require('../kit');

const warmCourt = (minutes = 6) => block(WARM, 'flow', { minutes }, [
  item('jumping_jack', secs(45)),
  item('leg_swings', perSide(['10', '10'])),
  item('ankle_mobility', perSide(['8', '8'])),
  item('lateral_shuffle', secs(20)),
  item('air_squat', reps('10')),
]);
const coolLegs = block(COOL, 'flow', { minutes: 5 }, [
  item('quad_stretch', perSide(secs(30))),
  item('hamstring_stretch', perSide(secs(30))),
  item('hip_flexor_stretch', perSide(secs(30))),
  item('calf_stretch', perSide(secs(30))),
]);
const coolUpper = block(COOL, 'flow', { minutes: 4 }, [
  item('chest_stretch', secs(30)),
  item('lat_stretch', perSide(secs(30))),
  item('childs_pose', mins(1)),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'basketball-landing-school', level: 'beginner', format: 'rounds', minutes: 20, equipment: [],
    title: ['Landing School', 'مدرسة الهبوط'],
    desc: ['Learn to land softly before you try to jump higher. Protects knees and ankles; ideal for new players.', 'تعلّم الهبوط بنعومة قبل أن تحاول القفز أعلى. يحمي الركبتين والكاحلين؛ مثالي للاعبين الجدد.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('march', mins(1)), item('ankle_mobility', perSide(['8', '8'])), item('air_squat', reps('8'))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('air_squat', reps('10'), ['Sit back, chest up', 'اجلس للخلف والصدر مرفوع']),
        item('jump_squat', reps('5'), ['Small jump, land quietly and freeze for 2 s', 'قفزة صغيرة، اهبط بهدوء واثبت 2 ث']),
        item('glute_bridge', reps('12')),
        item('calf_raise', reps('15')),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'basketball-defensive-stance', level: 'beginner', format: 'intervals', minutes: 18, equipment: [],
    title: ['Defensive Stance', 'وضعية الدفاع'],
    desc: ['Stay low and slide without crossing your feet. Builds the legs to guard your player for a whole possession.', 'ابقَ منخفضًا وانزلق جانبًا دون أن تتقاطع قدماك. يبني الساقين لمراقبة لاعبك طوال الهجمة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('march', mins(1)), item('step_jack', secs(45)), item('lateral_lunge', perSide(['5', '5']))]),
      block(MAIN, 'intervals', { rounds: 5, note: ['Hips low, hands active, feet never touch', 'الوركان منخفضان واليدان نشطتان والقدمان لا تتلامسان'] }, [
        item('wall_sit', secs(20)),
        item('lateral_shuffle', secs(20)),
        item('walk', secs(40)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'basketball-ankle-calf-care', level: 'beginner', format: 'rounds', minutes: 15, equipment: [],
    title: ['Ankle and Calf Care', 'العناية بالكاحل والسمانة'],
    desc: ['Strong calves and mobile ankles cut the risk of the most common basketball injury, the rolled ankle.', 'سمانة قوية وكاحل مرن يقلّلان خطر أكثر إصابات كرة السلة شيوعًا: التواء الكاحل.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('march', mins(1)), item('quick_feet', secs(20))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('ankle_mobility', perSide(['10', '10'])),
        item('calf_raise', reps('15'), ['Up in 1 s, down in 3 s', 'اصعد في ثانية وانزل في 3 ث']),
        item('reverse_lunge', perSide(['6', '6']), ['Pause on one leg before the next rep', 'توقف على رجل واحدة قبل التكرار التالي']),
        item('quick_feet', secs(20)),
      ]),
      block(COOL, 'flow', { minutes: 3 }, [item('calf_stretch', perSide(secs(45))), item('standing_forward_fold', secs(45))]),
    ],
  },
  {
    key: 'basketball-core-court', level: 'beginner', format: 'rounds', minutes: 20, equipment: [],
    title: ['Core for the Court', 'جذع للملعب'],
    desc: ['A steady trunk for finishing through contact and staying balanced in the air. Slow holds, no equipment.', 'جذع ثابت لإنهاء الهجمة رغم الاحتكاك والبقاء متوازنًا في الهواء. ثبات بطيء بلا معدات.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('cat_cow', reps('8')), item('bird_dog', perSide(['5', '5'])), item('thoracic_rotation', perSide(['5', '5']))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('dead_bug', perSide(['8', '8'])),
        item('plank', secs(30)),
        item('side_plank', perSide(secs(20))),
        item('glute_bridge', reps('12')),
      ]),
      block(COOL, 'flow', { minutes: 3 }, [item('childs_pose', mins(1)), item('hip_flexor_stretch', perSide(secs(30)))]),
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'basketball-vertical-jump', level: 'intermediate', format: 'strength', minutes: 35, equipment: ['box', 'kettlebell'],
    title: ['Vertical Jump Builder', 'بناء القفز العمودي'],
    desc: ['Jumps first while fresh, then the strength behind them. For players who land well and want to rebound higher.', 'القفز أولًا وأنت نشيط، ثم القوة التي تقف خلفه. للاعبين الذين يهبطون جيدًا ويريدون التقاط الكرات المرتدة أعلى.'],
    blocks: [
      warmCourt(),
      block(MAIN, 'strength', {}, [
        item('box_jump', sets(4, '5'), ['Land softly on the box, step down · rest 90 s', 'اهبط بنعومة على الصندوق وانزل خطوة · راحة 90 ث']),
        item('jump_squat', sets(3, '6'), ['Rest 60 s', 'راحة 60 ث']),
        item('goblet_squat', sets(3, '8'), ['2 reps left in the tank · rest 90 s', 'اترك تكرارين · راحة 90 ث']),
        item('single_leg_calf_raise', sets(3, '12 / side'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'basketball-single-leg-takeoff', level: 'intermediate', format: 'rounds', minutes: 30, equipment: ['box', 'dumbbells'],
    title: ['Single-Leg Takeoff', 'الارتقاء برجل واحدة'],
    desc: ['Layups and drives leave from one foot. Builds single-leg strength and balance on each side.', 'السلة السهلة والاختراق ينطلقان من قدم واحدة. يبني قوة الساق الواحدة والتوازن على كل جهة.'],
    blocks: [
      warmCourt(),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 75 s between rounds', 'راحة 75 ث بين الجولات'] }, [
        item('step_up', perSide(['8', '8']), ['Drive the free knee up like a layup', 'ارفع الركبة الحرة كأنك تؤدي سلة سهلة']),
        item('single_leg_rdl', perSide(['8', '8'])),
        item('skater_jump', perSide(['6', '6']), ['Stick each landing', 'اثبت عند كل هبوط']),
        item('single_leg_calf_raise', perSide(['12', '12'])),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'basketball-full-court-repeats', level: 'intermediate', format: 'intervals', minutes: 30, equipment: [],
    title: ['Full-Court Repeats', 'تكرارات الملعب الكامل'],
    desc: ['Run the floor, then slide on defence, again and again. Conditioning shaped like transition basketball.', 'اركض في الملعب ثم انزلق دفاعيًا، مرة بعد مرة. لياقة على شكل الهجمات المرتدة في كرة السلة.'],
    blocks: [
      warmCourt(),
      block(MAIN, 'intervals', { rounds: 8, note: ['Hard on the work, walk to recover', 'اجتهد في العمل وامشِ للاستشفاء'] }, [
        item('shuttle_run', secs(25), ['Baseline to baseline', 'من خط النهاية إلى الآخر']),
        item('lateral_shuffle', secs(15)),
        item('walk', secs(40)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'basketball-contact-upper-body', level: 'intermediate', format: 'strength', minutes: 35, equipment: ['dumbbells', 'bench'],
    title: ['Upper Body for Contact', 'الجزء العلوي للاحتكاك'],
    desc: ['Push, pull and brace to box out, post up and hold your ground under the rim.', 'دفع وسحب وشدّ للجذع لإبعاد الخصم واللعب ظهرًا للسلة والثبات تحت الحلقة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('arm_circles', secs(30)), item('inchworm', reps('5')), item('push_up', reps('5')), item('thoracic_rotation', perSide(['5', '5']))]),
      block(MAIN, 'strength', {}, [
        item('dumbbell_bench_press', sets(3, '8'), ['2 reps left in the tank · rest 90 s', 'اترك تكرارين · راحة 90 ث']),
        item('dumbbell_row', sets(3, '10 / side'), ['Rest 60 s', 'راحة 60 ث']),
        item('overhead_press', sets(3, '8'), ['Ribs down, no arching · rest 90 s', 'الأضلاع للأسفل دون تقوّس · راحة 90 ث']),
        item('plank_shoulder_tap', sets(3, '10 / side'), ['Hips stay still · rest 45 s', 'الوركان ثابتان · راحة 45 ث']),
      ]),
      coolUpper,
    ],
  },

  // ───── Advanced ─────
  {
    key: 'basketball-game-speed-emom', level: 'advanced', format: 'emom', minutes: 36, equipment: ['box'],
    title: ['Game-Speed EMOM', 'سرعة المباراة كل دقيقة'],
    desc: ['Twenty-four minutes of jumps, slides and sprints, a new move every minute. Keeps your legs alive deep into the game.', 'أربع وعشرون دقيقة من القفز والانزلاق الجانبي والعدو، حركة جديدة كل دقيقة. تحافظ على ساقيك حتى نهاية المباراة.'],
    blocks: [
      warmCourt(7),
      block(MAIN, 'emom', { minutes: 24, note: ['Finish the work, rest what is left of the minute', 'أنهِ الحركة وارتح ما تبقّى من الدقيقة'] }, [
        item('box_jump', reps('6')),
        item('lateral_shuffle', secs(30)),
        item('burpee', reps('8')),
        item('shuttle_run', secs(30)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'basketball-strength-day', level: 'advanced', format: 'strength', minutes: 50, equipment: ['barbell', 'rack', 'bench', 'dumbbells', 'band'],
    title: ['Hoops Strength Day', 'يوم القوة لكرة السلة'],
    desc: ['Heavy front squats, hip thrusts and hinges: the force behind a quicker first step and a higher jump.', 'سكوات أمامي ودفع حوض وانحناء بأوزان ثقيلة: القوة خلف خطوة أولى أسرع وقفزة أعلى.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('easy_jog', mins(4)), item('worlds_greatest_stretch', perSide(['3', '3'])), item('air_squat', reps('10')), item('glute_bridge', reps('10'))]),
      block(MAIN, 'strength', {}, [
        item('front_squat', sets(4, '5'), ['1–2 reps left in the tank · rest 2–3 min', 'اترك تكرارًا أو اثنين · راحة 2–3 د']),
        item('hip_thrust', sets(3, '8'), ['Pause 1 s at the top · rest 2 min', 'توقف ثانية في الأعلى · راحة 2 د']),
        item('romanian_deadlift', sets(3, '8'), ['Rest 90 s', 'راحة 90 ث']),
        item('single_leg_calf_raise', sets(3, '12 / side'), ['Hold a dumbbell · rest 45 s', 'أمسك دمبل · راحة 45 ث']),
      ]),
      block(['Core', 'الجذع'], 'rounds', { rounds: 3, note: ['Rest 30 s between rounds', 'راحة 30 ث بين الجولات'] }, [
        item('pallof_press', perSide(['10', '10'])),
        item('side_plank', perSide(secs(30))),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'basketball-reactive-plyos', level: 'advanced', format: 'rounds', minutes: 40, equipment: [],
    title: ['Reactive Plyos', 'قفزات الارتداد السريع'],
    desc: ['Quick, springy jumps with short ground contact, for second jumps on the rebound. Only for players with solid landings.', 'قفزات سريعة ومرنة بأقل تلامس مع الأرض، للقفزة الثانية على الكرة المرتدة. فقط لمن يتقن الهبوط.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('quick_feet', secs(30)), item('skips', meters(20)), item('leg_swings', perSide(['10', '10'])), item('jump_squat', reps('5'))]),
      block(MAIN, 'rounds', { rounds: 5, note: ['Off the floor fast · rest 90 s between rounds', 'غادر الأرض بسرعة · راحة 90 ث بين الجولات'] }, [
        item('jump_squat', reps('6'), ['Rebound straight into the next jump', 'ارتدّ مباشرة إلى القفزة التالية']),
        item('lunge_jump', perSide(['5', '5'])),
        item('skater_jump', perSide(['6', '6'])),
        item('hollow_hold', secs(20)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'basketball-fourth-quarter', level: 'advanced', format: 'amrap', minutes: 35, equipment: ['wall_ball'],
    title: ['Fourth-Quarter Grind', 'جهد الربع الأخير'],
    desc: ['Twenty minutes of as many rounds as you can. Trains you to jump, slide and stay sharp when you are tired.', 'عشرون دقيقة لأكبر عدد ممكن من الجولات. يدرّبك على القفز والانزلاق والتركيز وأنت متعب.'],
    blocks: [
      warmCourt(7),
      block(MAIN, 'amrap', { minutes: 20, note: ['Steady pace, count your rounds', 'إيقاع ثابت، عُدّ جولاتك'] }, [
        item('wall_ball', reps('12')),
        item('lateral_shuffle', secs(30)),
        item('jump_squat', reps('10')),
        item('shuttle_run', secs(20)),
      ]),
      coolLegs,
    ],
  },
];
