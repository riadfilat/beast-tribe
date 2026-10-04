// CrossFit-style training: short, intense couplets and triplets (amrap, emom, for time), gymnastics
// basics and barbell days. 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, sets, secs, mins, meters, perSide, WARM, MAIN, COOL } = require('../kit');

const warmBox = (minutes = 6) => block(WARM, 'flow', { minutes }, [
  item('jumping_jack', secs(45)),
  item('inchworm', reps('5')),
  item('air_squat', reps('10')),
  item('arm_circles', secs(30)),
]);
const coolFull = block(COOL, 'flow', { minutes: 5 }, [
  item('quad_stretch', perSide(secs(30))),
  item('hamstring_stretch', perSide(secs(30))),
  item('chest_stretch', secs(30)),
  item('childs_pose', mins(1)),
]);
const coolLegs = block(COOL, 'flow', { minutes: 5 }, [
  item('quad_stretch', perSide(secs(30))),
  item('hamstring_stretch', perSide(secs(30))),
  item('figure_four_stretch', perSide(secs(30))),
]);
const coolUpper = block(COOL, 'flow', { minutes: 4 }, [
  item('lat_stretch', perSide(secs(30))),
  item('chest_stretch', secs(30)),
  item('childs_pose', mins(1)),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'crossfit-first-amrap', level: 'beginner', format: 'amrap', minutes: 22, equipment: ['bench'],
    title: ['First AMRAP', 'أول تحدٍّ للجولات'],
    desc: ['As many rounds as you can in 10 minutes of simple bodyweight moves. Steady pace, no rushing.', 'أكبر عدد من الجولات خلال 10 دقائق بحركات بسيطة بوزن الجسم. إيقاع ثابت دون استعجال.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('march', mins(1)), item('arm_circles', secs(30)), item('air_squat', reps('8')), item('incline_push_up', reps('5'))]),
      block(MAIN, 'amrap', { minutes: 10, note: ['Breathe through the nose if you can; rest when you need to', 'تنفّس من أنفك إن استطعت، وارتح متى احتجت'] }, [
        item('air_squat', reps('10')),
        item('incline_push_up', reps('8')),
        item('step_burpee', reps('5')),
      ]),
      coolFull,
    ],
  },
  {
    key: 'crossfit-kettlebell-basics', level: 'beginner', format: 'emom', minutes: 25, equipment: ['kettlebell'],
    title: ['Kettlebell Basics', 'أساسيات الكيتل بل'],
    desc: ['Learn to hinge and squat with a kettlebell, one move each minute with plenty of rest built in.', 'تعلّم الانحناء والسكوات بالكيتل بل، حركة واحدة كل دقيقة مع راحة كافية فيها.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('march', mins(1)), item('kettlebell_halo', reps('8')), item('hip_hinge', reps('10')), item('air_squat', reps('10'))]),
      block(MAIN, 'emom', { minutes: 12, note: ['Light bell: you should finish each minute with 25 s or more to rest', 'كيتل بل خفيف: يجب أن يبقى لك 25 ث أو أكثر للراحة كل دقيقة'] }, [
        item('kettlebell_deadlift', reps('10'), ['Hips back, flat back', 'الوركان للخلف والظهر مستقيم']),
        item('goblet_squat', reps('8')),
        item('plank', secs(30)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'crossfit-row-and-squat', level: 'beginner', format: 'for_time', minutes: 28, equipment: ['rower'],
    title: ['Row and Squat', 'تجديف وسكوات'],
    desc: ['A simple couplet against the clock: a short row, then squats. Your first taste of for-time training.', 'ثنائية بسيطة ضد الوقت: تجديف قصير ثم سكوات. أول تجربة لك مع التمرين ضد الوقت.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('rower', mins(3)), item('leg_swings', perSide(['8', '8'])), item('air_squat', reps('10'))]),
      block(['For time', 'ضد الوقت'], 'for_time', { minutes: 14, rounds: 4, note: ['4 rounds, 14 min cap. Easy first round, then hold the pace.', '4 جولات، الحد 14 د. جولة أولى سهلة ثم حافظ على الإيقاع.'] }, [
        item('rower', meters(250), ['Push with the legs first', 'ادفع بالساقين أولًا']),
        item('air_squat', reps('15')),
      ]),
      block(COOL, 'flow', { minutes: 5 }, [item('walk', mins(2)), item('quad_stretch', perSide(secs(30))), item('hamstring_stretch', perSide(secs(30)))]),
    ],
  },
  {
    key: 'crossfit-gymnastics-start', level: 'beginner', format: 'strength', minutes: 25, equipment: ['band', 'pull_up_bar', 'bench'],
    title: ['Gymnastics Start', 'بداية الجمباز'],
    desc: ['The first steps to pull-ups, push-ups and dips. Quality reps with full rest, nothing to failure.', 'الخطوات الأولى نحو العقلة والضغط والغطس. تكرارات متقنة مع راحة كاملة، دون الوصول إلى الإنهاك.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('shoulder_rolls', secs(30)), item('arm_circles', secs(30)), item('band_pull_apart', reps('15')), item('cat_cow', reps('6'))]),
      block(MAIN, 'strength', {}, [
        item('band_pull_up', sets(4, '4'), ['Strong band, chin over the bar · rest 90 s', 'شريط قوي والذقن فوق البار · راحة 90 ث']),
        item('incline_push_up', sets(3, '8'), ['3 reps left in the tank · rest 60 s', 'اترك 3 تكرارات · راحة 60 ث']),
        item('dips', sets(3, '8'), ['Bend your knees to make it easier · rest 60 s', 'اثنِ ركبتيك لتسهيلها · راحة 60 ث']),
        item('dead_bug', sets(3, '6 / side'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      coolUpper,
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'crossfit-swing-jump-push', level: 'intermediate', format: 'amrap', minutes: 30, equipment: ['kettlebell', 'box'],
    title: ['Swing, Jump, Push', 'أرجحة وقفز ودفع'],
    desc: ['A classic triplet for 15 minutes: hips, legs and chest. Keep moving and count your rounds.', 'ثلاثية كلاسيكية لمدة 15 دقيقة: الوركان والساقان والصدر. استمر في الحركة وعُدّ جولاتك.'],
    blocks: [
      block(WARM, 'flow', { minutes: 7 }, [item('jumping_jack', secs(45)), item('hip_hinge', reps('10')), item('kettlebell_deadlift', reps('8')), item('box_jump', reps('3')), item('push_up', reps('5'))]),
      block(MAIN, 'amrap', { minutes: 15, note: ['Write down your rounds and beat them next time', 'سجّل جولاتك وتفوّق عليها في المرة القادمة'] }, [
        item('kettlebell_swing', reps('15'), ['Snap the hips, arms just guide the bell', 'ادفع بالوركين، والذراعان توجّهان الكيتل بل فقط']),
        item('box_jump', reps('10'), ['Step down', 'انزل خطوة خطوة']),
        item('push_up', reps('10')),
      ]),
      coolFull,
    ],
  },
  {
    key: 'crossfit-engine-emom', level: 'intermediate', format: 'emom', minutes: 30, equipment: ['rower', 'wall_ball'],
    title: ['Engine EMOM', 'لياقة كل دقيقة'],
    desc: ['Row, wall balls and burpees, one each minute for 18 minutes. Builds the engine without wrecking your form.', 'تجديف ورمي الكرة على الحائط وبيربي، حركة كل دقيقة لمدة 18 دقيقة. يبني لياقتك دون أن يفسد أداءك.'],
    blocks: [
      block(WARM, 'flow', { minutes: 7 }, [item('rower', mins(3)), item('air_squat', reps('10')), item('wall_ball', reps('5')), item('step_burpee', reps('4'))]),
      block(MAIN, 'emom', { minutes: 18, note: ['Aim to finish each minute with 15 s to spare', 'حاول أن تنهي كل دقيقة وقد بقي لك 15 ث'] }, [
        item('rower', meters(200)),
        item('wall_ball', reps('12')),
        item('burpee', reps('8')),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'crossfit-barbell-foundations', level: 'intermediate', format: 'strength', minutes: 45, equipment: ['rower', 'barbell', 'rack', 'dumbbells'],
    title: ['Barbell Foundations', 'أساسيات البار'],
    desc: ['Deadlift and front squat at a weight you can own, then a short finisher. For when the moves feel familiar.', 'رفعة ميتة وسكوات أمامي بوزن تتحكم فيه، ثم ختام قصير. لمن صارت الحركات مألوفة لديه.'],
    blocks: [
      block(WARM, 'flow', { minutes: 7 }, [item('rower', mins(3)), item('hip_hinge', reps('10')), item('air_squat', reps('10')), item('inchworm', reps('4'))]),
      block(MAIN, 'strength', {}, [
        item('deadlift', sets(4, '5'), ['2 reps left in the tank · rest 2 min', 'اترك تكرارين · راحة 2 د']),
        item('front_squat', sets(4, '5'), ['Elbows high, chest up · rest 2 min', 'المرفقان عاليان والصدر مرفوع · راحة 2 د']),
        item('push_press', sets(3, '8'), ['Dip and drive with the legs · rest 90 s', 'انزل قليلًا وادفع بالساقين · راحة 90 ث']),
      ]),
      block(['Finisher', 'الختام'], 'amrap', { minutes: 6 }, [
        item('air_squat', reps('10')),
        item('push_up', reps('8')),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'crossfit-bodyweight-chipper', level: 'intermediate', format: 'for_time', minutes: 38, equipment: ['band', 'pull_up_bar'],
    title: ['Bodyweight Chipper', 'سلسلة بوزن الجسم'],
    desc: ['One long list, done once from top to bottom. Break the big numbers into small sets and keep going.', 'قائمة طويلة تنفّذها مرة واحدة من أولها إلى آخرها. قسّم الأعداد الكبيرة إلى مجموعات صغيرة واستمر.'],
    blocks: [
      block(WARM, 'flow', { minutes: 7 }, [item('easy_jog', mins(3)), item('air_squat', reps('10')), item('push_up', reps('5')), item('band_pull_up', reps('3'))]),
      block(['For time', 'ضد الوقت'], 'for_time', { minutes: 25, note: ['1 round, 25 min cap', 'جولة واحدة، الحد 25 د'] }, [
        item('run', meters(400)),
        item('air_squat', reps('50')),
        item('push_up', reps('40')),
        item('band_pull_up', reps('30')),
        item('hanging_knee_raise', reps('20')),
        item('run', meters(400)),
      ]),
      coolFull,
    ],
  },

  // ───── Advanced ─────
  {
    key: 'crossfit-heavy-couplet', level: 'advanced', format: 'for_time', minutes: 35, equipment: ['rower', 'barbell', 'box'],
    title: ['Heavy Couplet', 'ثنائية ثقيلة'],
    desc: ['Deadlifts and box jumps in falling reps: 21, 15, 9. Heavy, fast and over quickly.', 'رفعة ميتة وقفز على الصندوق بتكرارات تتناقص: 21 ثم 15 ثم 9. ثقيل وسريع وينتهي بسرعة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 10 }, [item('rower', mins(4)), item('hip_hinge', reps('10')), item('deadlift', ['3 × 5', '3 × 5'], ['Build to your work weight', 'تدرّج حتى وزن العمل']), item('box_jump', reps('5'))]),
      block(['For time', 'ضد الوقت'], 'for_time', { minutes: 15, note: ['15 min cap. Deadlift at about 60% of your best single.', 'الحد 15 د. الرفعة الميتة بنحو 60% من أقصى رفعة لك.'] }, [
        item('deadlift', reps('21')),
        item('box_jump', reps('21')),
        item('deadlift', reps('15')),
        item('box_jump', reps('15')),
        item('deadlift', reps('9')),
        item('box_jump', reps('9')),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'crossfit-pull-push-jump', level: 'advanced', format: 'amrap', minutes: 38, equipment: ['band', 'pull_up_bar', 'box'],
    title: ['Pull, Push, Jump', 'عقلة وضغط وقفز'],
    desc: ['A long 20-minute grind of strict gymnastics and jumps. For athletes with solid pull-ups.', 'تحدٍّ طويل لمدة 20 دقيقة من الجمباز الصارم والقفز. لمن يتقن العقلة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('jumping_jack', mins(1)), item('band_pull_apart', reps('15')), item('band_pull_up', reps('5')), item('push_up', reps('8')), item('box_jump', reps('3'))]),
      block(MAIN, 'amrap', { minutes: 20, note: ['Break pull-ups early, before you have to', 'قسّم العقلة مبكرًا قبل أن تُجبَر على ذلك'] }, [
        item('pull_up', reps('6')),
        item('push_up', reps('12')),
        item('box_jump', reps('10')),
        item('hanging_knee_raise', reps('10')),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'crossfit-squat-and-metcon', level: 'advanced', format: 'strength', minutes: 50, equipment: ['bike', 'barbell', 'rack', 'wall_ball'],
    title: ['Squat Strength and Metcon', 'قوة السكوات وتحدي اللياقة'],
    desc: ['Heavy back squat triples, then 8 hard minutes of wall balls and burpees on tired legs.', 'ثلاثيات ثقيلة في السكوات الخلفي، ثم 8 دقائق قوية من رمي الكرة والبيربي بساقين متعبتين.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('bike', mins(4)), item('leg_swings', perSide(['10', '10'])), item('air_squat', reps('10')), item('worlds_greatest_stretch', perSide(['3', '3']))]),
      block(['Strength', 'القوة'], 'strength', { note: ['Build up with lighter sets first', 'تدرّج بمجموعات أخف أولًا'] }, [
        item('back_squat', sets(5, '3'), ['1–2 reps left in the tank · rest 3 min', 'اترك تكرارًا أو اثنين · راحة 3 د']),
      ]),
      block(['Metcon', 'تحدي اللياقة'], 'amrap', { minutes: 8, note: ['Rest 3 min after the squats, then go', 'ارتح 3 د بعد السكوات ثم ابدأ'] }, [
        item('wall_ball', reps('12')),
        item('burpee', reps('8')),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'crossfit-long-haul', level: 'advanced', format: 'for_time', minutes: 45, equipment: ['kettlebell', 'dumbbells'],
    title: ['Long Haul', 'المسافة الطويلة'],
    desc: ['Four long rounds of running, swings, presses and burpees. Pace it like a race, not a sprint.', 'أربع جولات طويلة من الجري والأرجحة والدفع فوق الرأس والبيربي. وزّع جهدك كأنه سباق لا عدو سريع.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('easy_jog', mins(3)), item('skips', meters(20)), item('kettlebell_swing', reps('10')), item('push_press', reps('5')), item('step_burpee', reps('4'))]),
      block(['For time', 'ضد الوقت'], 'for_time', { minutes: 30, rounds: 4, note: ['4 rounds, 30 min cap. Run the first 400 m slower than you want to.', '4 جولات، الحد 30 د. اجرِ أول 400 م أبطأ مما تريد.'] }, [
        item('run', meters(400)),
        item('kettlebell_swing', reps('15')),
        item('push_press', reps('10')),
        item('burpee', reps('10')),
      ]),
      coolFull,
    ],
  },
];
