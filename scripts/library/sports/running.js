// Running: an aerobic base built with easy kilometres, then tempo, hills and speed on top, with the
// single-leg strength and mobility that keep runners healthy. 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, sets, secs, mins, meters, perSide, WARM, MAIN, COOL } = require('../kit');

const WALK = ['Walk', 'مشي'];
const warmEasy = block(WARM, 'flow', { minutes: 5 }, [
  item('walk', mins(3), null, WALK),
  item('leg_swings', perSide(['8', '8'])),
  item('march', secs(30)),
]);
const warmRun = (jog = 5) => block(WARM, 'flow', { minutes: jog + 3 }, [
  item('easy_jog', mins(jog)),
  item('leg_swings', perSide(['10', '10'])),
  item('skips', meters(20)),
  item('high_knees', secs(20)),
]);
const warmFast = block(WARM, 'flow', { minutes: 10 }, [
  item('easy_jog', mins(6)),
  item('leg_swings', perSide(['10', '10'])),
  item('skips', meters(30)),
  item('sprint', sets(2, '60 m'), ['Relaxed strides, not all-out', 'خطوات سريعة ومسترخية، ليست بأقصى جهد']),
]);
const coolRun = block(COOL, 'flow', { minutes: 5 }, [
  item('calf_stretch', perSide(secs(30))),
  item('quad_stretch', perSide(secs(30))),
  item('hamstring_stretch', perSide(secs(30))),
  item('hip_flexor_stretch', perSide(secs(30))),
]);
const coolLong = block(COOL, 'flow', { minutes: 7 }, [
  item('walk', mins(2), null, WALK),
  item('calf_stretch', perSide(secs(30))),
  item('quad_stretch', perSide(secs(30))),
  item('hamstring_stretch', perSide(secs(30))),
  item('hip_flexor_stretch', perSide(secs(30))),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'running-run-walk-start', level: 'beginner', format: 'intervals', minutes: 28, equipment: [],
    title: ['Run-Walk Start', 'بداية الجري والمشي'],
    desc: ['Your first steps into running: one easy minute of jogging, two of walking. For anyone starting from zero.', 'خطواتك الأولى في الجري: دقيقة هرولة خفيفة ودقيقتان مشي. لمن يبدأ من الصفر.'],
    blocks: [
      warmEasy,
      block(MAIN, 'intervals', { rounds: 6, note: ['Jog slow enough to talk; walk until your breathing settles', 'هرول ببطء يسمح لك بالكلام، وامشِ حتى يهدأ تنفسك'] }, [
        item('easy_jog', mins(1)),
        item('walk', mins(2), null, WALK),
      ]),
      coolRun,
    ],
  },
  {
    key: 'running-talk-pace', level: 'beginner', format: 'steady', minutes: 25, equipment: [],
    title: ['Talk-Pace Run', 'جري بسرعة الكلام'],
    desc: ['Builds your aerobic base at a pace where you can still hold a conversation. Short walk breaks are fine.', 'يبني قاعدتك الهوائية بسرعة تسمح لك بالحديث. لا بأس بفترات مشي قصيرة.'],
    blocks: [
      warmEasy,
      block(MAIN, 'steady', {}, [
        item('easy_jog', mins(15), ['If you cannot speak in full sentences, slow down or walk for a minute', 'إن لم تستطع الكلام بجمل كاملة، خفّف السرعة أو امشِ دقيقة']),
      ]),
      coolRun,
    ],
  },
  {
    key: 'running-strength-basics', level: 'beginner', format: 'rounds', minutes: 25, equipment: [],
    title: ['Runner Strength Basics', 'أساسيات القوة للعدّاء'],
    desc: ['Stronger hips, knees and calves so running feels easier and hurts less. Bodyweight only.', 'وركان وركبتان وسمانة أقوى ليصبح الجري أسهل وأقل إيلامًا. بوزن الجسم فقط.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('march', mins(1)), item('leg_swings', perSide(['8', '8'])), item('air_squat', reps('8'))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('air_squat', reps('12')),
        item('reverse_lunge', perSide(['8', '8'])),
        item('glute_bridge', reps('12')),
        item('calf_raise', reps('15'), ['Slow on the way down', 'انزل ببطء']),
        item('dead_bug', perSide(['6', '6'])),
      ]),
      block(COOL, 'flow', { minutes: 5 }, [
        item('quad_stretch', perSide(secs(30))),
        item('hamstring_stretch', perSide(secs(30))),
        item('calf_stretch', perSide(secs(30))),
        item('figure_four_stretch', perSide(secs(30))),
      ]),
    ],
  },
  {
    key: 'running-mobility-reset', level: 'beginner', format: 'flow', minutes: 15, equipment: [],
    title: ['Runner Mobility Reset', 'استعادة المرونة للعدّاء'],
    desc: ['Loosens the ankles, hips and hamstrings that running tightens. Use it on rest days or after a run.', 'يليّن الكاحلين والوركين والفخذ الخلفية التي يشدّها الجري. نفّذه في أيام الراحة أو بعد الجري.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('march', mins(1)), item('cat_cow', reps('8'))]),
      block(MAIN, 'flow', { rounds: 2, note: ['Move slowly and breathe; no bouncing', 'تحرّك ببطء وتنفّس، دون ارتداد'] }, [
        item('ankle_mobility', perSide(['10', '10'])),
        item('hip_openers', perSide(['8', '8'])),
        item('leg_swings', perSide(['10', '10'])),
        item('worlds_greatest_stretch', perSide(['3', '3'])),
      ]),
      block(COOL, 'flow', { minutes: 4 }, [
        item('hip_flexor_stretch', perSide(secs(45))),
        item('calf_stretch', perSide(secs(30))),
        item('childs_pose', mins(1)),
      ]),
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'running-tempo-builder', level: 'intermediate', format: 'intervals', minutes: 37, equipment: [],
    title: ['Tempo Builder', 'بناء الإيقاع'],
    desc: ['Holds a comfortably hard pace for longer, the key to running faster over 5 and 10 km.', 'يعلّمك الحفاظ على سرعة صعبة لكن مريحة لفترة أطول، وهو مفتاح السرعة في سباقات 5 و10 كم.'],
    blocks: [
      warmRun(),
      block(MAIN, 'intervals', { rounds: 3, note: ['Tempo: you can say a few words, not full sentences', 'الإيقاع: تستطيع قول كلمات قليلة لا جملًا كاملة'] }, [
        item('run', mins(6)),
        item('easy_jog', mins(2)),
      ]),
      coolRun,
    ],
  },
  {
    key: 'running-hill-repeats', level: 'intermediate', format: 'intervals', minutes: 31, equipment: [],
    title: ['Hill Repeats', 'تكرارات التل'],
    desc: ['Short, strong climbs that build leg power and running form. Find a hill that takes about a minute to climb.', 'صعود قصير وقوي يبني قوة الساقين وأسلوب الجري. اختر تلًّا يستغرق صعوده نحو دقيقة.'],
    blocks: [
      warmRun(),
      block(MAIN, 'intervals', { rounds: 8, note: ['Strong but controlled; the last climb should feel like the first', 'قوي لكن متحكَّم به، والصعود الأخير مثل الأول'] }, [
        item('run', secs(45), ['Drive the arms, short quick steps, tall chest', 'حرّك ذراعيك بقوة، خطوات قصيرة وسريعة، وصدر مرفوع'], ['Uphill run', 'جري صعودًا']),
        item('walk', secs(90), null, ['Walk back down', 'مشي نزولًا للعودة']),
      ]),
      coolRun,
    ],
  },
  {
    key: 'running-speed-play', level: 'intermediate', format: 'intervals', minutes: 33, equipment: [],
    title: ['Speed Play', 'لعب السرعة'],
    desc: ['Mixes easy, steady and fast running in one session so your legs learn to change gear.', 'يمزج الجري الخفيف والثابت والسريع في جلسة واحدة لتتعلّم ساقاك تغيير السرعة.'],
    blocks: [
      warmRun(),
      block(MAIN, 'intervals', { rounds: 5 }, [
        item('easy_jog', mins(2)),
        item('run', mins(1)),
        item('sprint', secs(20), ['Fast and relaxed, not all-out', 'سريع ومسترخٍ، ليس بأقصى جهد']),
        item('walk', secs(40), null, WALK),
      ]),
      coolRun,
    ],
  },
  {
    key: 'running-single-leg-strength', level: 'intermediate', format: 'strength', minutes: 40, equipment: ['dumbbells', 'bench', 'box'],
    title: ['Single-Leg Strength', 'قوة الساق الواحدة'],
    desc: ['Running happens one leg at a time. Builds the strength that keeps knees, hips and Achilles healthy as distance rises.', 'الجري ساق واحدة في كل خطوة. يبني القوة التي تحمي الركبتين والوركين ووتر العرقوب مع زيادة المسافة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('march', mins(1)), item('glute_bridge', reps('10')), item('split_squat', perSide(['6', '6'])), item('leg_swings', perSide(['8', '8']))]),
      block(MAIN, 'strength', {}, [
        item('bulgarian_split_squat', sets(3, '8 / side'), ['2 reps left in the tank · rest 90 s', 'اترك تكرارين · راحة 90 ث']),
        item('single_leg_rdl', sets(3, '8 / side'), ['Hips level · rest 60 s', 'الوركان مستويان · راحة 60 ث']),
        item('step_up', sets(3, '10 / side'), ['Rest 60 s', 'راحة 60 ث']),
        item('single_leg_calf_raise', sets(3, '15 / side'), ['Rest 45 s', 'راحة 45 ث']),
        item('side_plank', sets(3, '30 s / side'), ['Rest 30 s', 'راحة 30 ث']),
      ]),
      coolRun,
    ],
  },

  // ───── Advanced ─────
  {
    key: 'running-track-repeats', level: 'advanced', format: 'intervals', minutes: 45, equipment: [],
    title: ['Track Repeats', 'تكرارات المضمار'],
    desc: ['Eight fast 400 m repeats with short jog recoveries. Raises your top-end speed for 5 km racing.', 'ثماني جولات سريعة لمسافة 400 م مع هرولة قصيرة للاستشفاء. ترفع سرعتك القصوى لسباقات 5 كم.'],
    blocks: [
      warmFast,
      block(MAIN, 'intervals', { rounds: 8, note: ['Same pace on every rep; the last should match the first', 'السرعة نفسها في كل جولة، والأخيرة مثل الأولى'] }, [
        item('run', meters(400), ['About your 5 km race pace', 'قريب من سرعتك في سباق 5 كم'], ['Fast run', 'جري سريع']),
        item('easy_jog', meters(200), ['Recover, but keep moving', 'استشفِ مع الاستمرار في الحركة']),
      ]),
      coolRun,
    ],
  },
  {
    key: 'running-long-run-fast-finish', level: 'advanced', format: 'steady', minutes: 60, equipment: [],
    title: ['Long Run, Fast Finish', 'جري طويل بنهاية سريعة'],
    desc: ['Long, easy kilometres with the last ten minutes at tempo. Teaches you to push on tired legs, like the end of a race.', 'كيلومترات طويلة وهادئة، وآخر عشر دقائق بإيقاع ثابت. تعلّمك الدفع بساقين متعبتين كنهاية السباق.'],
    blocks: [
      warmEasy,
      block(MAIN, 'steady', { note: ['In the heat, run early or late and carry water', 'في الحر، اجرِ في الصباح الباكر أو المساء واحمل الماء'] }, [
        item('easy_jog', mins(38), ['Conversation pace', 'سرعة تسمح بالكلام']),
        item('run', mins(10), ['Strong and steady, not a sprint', 'قوي وثابت، ليس عدوًا']),
      ]),
      coolLong,
    ],
  },
  {
    key: 'running-runner-power', level: 'advanced', format: 'strength', minutes: 50, equipment: ['box', 'dumbbells', 'bench'],
    title: ['Runner Power', 'قوة العدّاء الانفجارية'],
    desc: ['Jumps, heavy hinges and hamstring work that make each stride more powerful and harder to injure.', 'قفزات وانحناءات بأوزان ثقيلة وحركات للفخذ الخلفية تجعل كل خطوة أقوى وأقل عرضة للإصابة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('easy_jog', mins(3)), item('leg_swings', perSide(['10', '10'])), item('hip_hinge', reps('10')), item('air_squat', reps('10')), item('skips', meters(20))]),
      block(['Power', 'القوة الانفجارية'], 'strength', { note: ['Full rest: every jump should be your best', 'راحة كاملة: كل قفزة يجب أن تكون أفضل ما لديك'] }, [
        item('box_jump', sets(4, '4'), ['Step down · rest 90 s', 'انزل خطوة خطوة · راحة 90 ث']),
        item('lunge_jump', sets(3, '5 / side'), ['Rest 90 s', 'راحة 90 ث']),
      ]),
      block(['Strength', 'القوة'], 'strength', {}, [
        item('romanian_deadlift', sets(4, '6'), ['1–2 reps left in the tank · rest 2 min', 'اترك تكرارًا أو اثنين · راحة 2 د']),
        item('bulgarian_split_squat', sets(3, '6 / side'), ['Rest 90 s', 'راحة 90 ث']),
        item('nordic_curl', sets(3, '4'), ['Lower as slowly as you can · rest 90 s', 'انزل ببطء قدر ما تستطيع · راحة 90 ث']),
        item('single_leg_calf_raise', sets(3, '12 / side'), ['Hold a dumbbell · rest 45 s', 'امسك دمبل · راحة 45 ث']),
      ]),
      coolRun,
    ],
  },
  {
    key: 'running-time-trial', level: 'advanced', format: 'for_time', minutes: 45, equipment: [],
    title: ['Time Trial', 'اختبار الوقت'],
    desc: ['Run 5 km as fast as you can and record it. Repeat every 6–8 weeks to see how far you have come.', 'اجرِ 5 كم بأسرع ما تستطيع وسجّل وقتك. كرّره كل 6–8 أسابيع لترى مدى تقدّمك.'],
    blocks: [
      warmFast,
      block(['For time', 'ضد الوقت'], 'for_time', { minutes: 35, note: ['Start controlled, build after halfway, empty the tank in the last kilometre. Write down your time.', 'ابدأ بتحكم، وزِد السرعة بعد المنتصف، وأعطِ كل ما لديك في الكيلومتر الأخير. سجّل وقتك.'] }, [
        item('run', meters(5000), null, ['Race-effort run', 'جري بجهد السباق']),
      ]),
      coolLong,
    ],
  },
];
