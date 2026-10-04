// Skateboarding: balance and single-leg control, ankles and knees that take impacts, clean landings,
// strong hips and core, and a push leg that lasts the whole session. No board tricks here: this is
// training for skating, done off the board. 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, sets, secs, mins, meters, perSide, WARM, MAIN, COOL } = require('../kit');

const warmSkate = (minutes = 6) => block(WARM, 'flow', { minutes }, [
  item('march', secs(45)),
  item('ankle_mobility', perSide(['8', '8'])),
  item('leg_swings', perSide(['10', '10'])),
  item('hip_openers', perSide(['6', '6'])),
  item('air_squat', reps('8')),
]);
const coolLegs = block(COOL, 'flow', { minutes: 5 }, [
  item('quad_stretch', perSide(secs(30))),
  item('hip_flexor_stretch', perSide(secs(30))),
  item('figure_four_stretch', perSide(secs(30))),
  item('calf_stretch', perSide(secs(30))),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'skateboarding-balance-basics', level: 'beginner', format: 'rounds', minutes: 20, equipment: [],
    title: ['Balance Basics', 'أساسيات التوازن'],
    desc: ['Steadier on one leg and calmer through the trunk, the base for riding and pushing. For new skaters.', 'ثبات أكبر على ساق واحدة وجذع أهدأ، وهذا أساس الركوب والدفع. للمتزلجين الجدد.'],
    blocks: [
      warmSkate(5),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('split_squat', perSide(['6', '6'])),
        item('single_leg_calf_raise', perSide(['8', '8']), ['Use a wall only if you need it', 'استند إلى حائط فقط عند الحاجة']),
        item('bird_dog', perSide(['6', '6'])),
        item('knee_plank', secs(30)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'skateboarding-ankle-hip-mobility', level: 'beginner', format: 'flow', minutes: 18, equipment: [],
    title: ['Ankle and Hip Mobility', 'مرونة الكاحل والورك'],
    desc: ['Freer ankles and hips for a lower, more relaxed stance on the board. Good before a session or on rest days.', 'كاحلان ووركان أكثر حرية لوقفة أخفض وأكثر استرخاء على اللوح. مناسب قبل الجلسة أو في أيام الراحة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('march', mins(1)), item('leg_swings', perSide(['8', '8']))]),
      block(MAIN, 'flow', { minutes: 10, note: ['Slow and easy, breathe out into each position', 'ببطء وهدوء، وازفر في كل وضعية'] }, [
        item('ankle_mobility', perSide(['10', '10'])),
        item('hip_openers', perSide(['8', '8'])),
        item('cat_cow', reps('8')),
        item('thoracic_rotation', perSide(['6', '6'])),
        item('air_squat', reps('8'), ['Pause 3 s at the bottom', 'توقف 3 ث في الأسفل']),
        item('glute_bridge', reps('10')),
      ]),
      block(COOL, 'flow', { minutes: 5 }, [item('hip_flexor_stretch', perSide(secs(30))), item('figure_four_stretch', perSide(secs(30))), item('calf_stretch', perSide(secs(30)))]),
    ],
  },
  {
    key: 'skateboarding-soft-landings', level: 'beginner', format: 'rounds', minutes: 20, equipment: [],
    title: ['Soft Landings', 'هبوط ناعم'],
    desc: ['Learn to absorb impact through bent knees and hips instead of stiff legs. Small hops, quiet landings.', 'تعلّم امتصاص الصدمة بثني الركبتين والوركين بدل الساقين المتصلبتين. قفزات صغيرة وهبوط هادئ.'],
    blocks: [
      warmSkate(5),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 75 s between rounds', 'راحة 75 ث بين الجولات'] }, [
        item('air_squat', reps('10'), ['Drop fast, stop dead still at the bottom', 'انزل بسرعة وتوقف تمامًا في الأسفل']),
        item('jump_squat', reps('5'), ['Small hops, land quietly on bent knees', 'قفزات صغيرة، واهبط بهدوء على ركبتين مثنيتين']),
        item('hip_hinge', reps('10')),
        item('calf_raise', reps('15')),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'skateboarding-push-leg-start', level: 'beginner', format: 'intervals', minutes: 22, equipment: ['box'],
    title: ['Push Leg Start', 'بداية ساق الدفع'],
    desc: ['Endurance for the leg that pushes and the leg that stays on the board. Low box, steady pace.', 'تحمّل للساق التي تدفع وللساق التي تبقى على اللوح. صندوق منخفض وإيقاع ثابت.'],
    blocks: [
      warmSkate(5),
      block(MAIN, 'intervals', { rounds: 4, note: ['Walk to recover between rounds', 'امشِ للاستشفاء بين الجولات'] }, [
        item('step_up', perSide(['10', '10']), ['Low box, stand tall at the top', 'صندوق منخفض، وقف مستقيمًا في الأعلى']),
        item('reverse_lunge', perSide(['8', '8'])),
        item('walk', mins(1)),
      ]),
      coolLegs,
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'skateboarding-single-leg-strength', level: 'intermediate', format: 'strength', minutes: 40, equipment: ['bench', 'dumbbells', 'box'],
    title: ['Skater Single-Leg Strength', 'قوة الساق الواحدة للمتزلج'],
    desc: ['One leg at a time, the way you ride and push. Builds knees and hips that stay stable when the board moves.', 'ساق واحدة في كل مرة، كما تركب وتدفع. يبني ركبتين ووركين تبقيان ثابتتين حين يتحرك اللوح.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('march', mins(1)), item('ankle_mobility', perSide(['8', '8'])), item('glute_bridge', reps('10')), item('split_squat', perSide(['6', '6']))]),
      block(MAIN, 'strength', {}, [
        item('bulgarian_split_squat', sets(3, '8 / side'), ['2 reps left in the tank · rest 90 s', 'اترك تكرارين · راحة 90 ث']),
        item('single_leg_rdl', sets(3, '8 / side'), ['Rest 60 s', 'راحة 60 ث']),
        item('step_up', sets(3, '8 / side'), ['Rest 60 s', 'راحة 60 ث']),
      ]),
      block(['Core', 'الجذع'], 'rounds', { rounds: 3, note: ['Rest 30 s between rounds', 'راحة 30 ث بين الجولات'] }, [
        item('side_plank', perSide(secs(30))),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'skateboarding-landing-control', level: 'intermediate', format: 'rounds', minutes: 30, equipment: ['box'],
    title: ['Landing Control', 'التحكم في الهبوط'],
    desc: ['Jump, land and freeze. Trains ankles and knees to take impact and hold position, for skaters starting to drop and ollie.', 'اقفز واهبط واثبت. يدرّب الكاحلين والركبتين على تحمّل الصدمة والثبات، للمتزلجين الذين بدأوا القفز والنزول.'],
    blocks: [
      warmSkate(6),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 90 s between rounds · stop if landings get loud', 'راحة 90 ث بين الجولات · توقف إن صار هبوطك عاليًا'] }, [
        item('box_jump', reps('5'), ['Step down, never jump down', 'انزل خطوة خطوة ولا تقفز للأسفل']),
        item('skater_jump', perSide(['6', '6']), ['Hold each landing for 2 s', 'اثبت عند كل هبوط 2 ث']),
        item('jump_squat', reps('6')),
        item('single_leg_calf_raise', perSide(['12', '12'])),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'skateboarding-hips-core', level: 'intermediate', format: 'rounds', minutes: 28, equipment: ['band'],
    title: ['Hips and Core', 'الوركان والجذع'],
    desc: ['A trunk that resists twisting and hips that drive, for carving, turning and staying upright when you wobble.', 'جذع يقاوم الالتواء ووركان يدفعان، للانعطاف والدوران والبقاء واقفًا حين تتمايل.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('cat_cow', reps('8')), item('hip_openers', perSide(['6', '6'])), item('worlds_greatest_stretch', perSide(['3', '3']))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('pallof_press', perSide(['10', '10'])),
        item('lateral_lunge', perSide(['8', '8'])),
        item('dead_bug', perSide(['8', '8'])),
        item('glute_bridge', reps('15'), ['Squeeze 2 s at the top', 'اضغط 2 ث في الأعلى']),
        item('hollow_hold', secs(20)),
      ]),
      block(COOL, 'flow', { minutes: 4 }, [item('childs_pose', mins(1)), item('figure_four_stretch', perSide(secs(30))), item('hip_flexor_stretch', perSide(secs(30)))]),
    ],
  },
  {
    key: 'skateboarding-push-leg-engine', level: 'intermediate', format: 'intervals', minutes: 30, equipment: ['box'],
    title: ['Push Leg Engine', 'لياقة ساق الدفع'],
    desc: ['Longer leg work with short walks between, so your legs last a long session of pushing and riding low.', 'عمل أطول للساقين مع مشي قصير بينها، لتتحمّل ساقاك جلسة طويلة من الدفع والركوب المنخفض.'],
    blocks: [
      warmSkate(6),
      block(MAIN, 'intervals', { rounds: 6, note: ['Keep moving on the walk', 'استمر في الحركة أثناء المشي'] }, [
        item('step_up', perSide(['12', '12'])),
        item('wall_sit', secs(40), ['Your riding stance, held', 'وقفة الركوب بثبات']),
        item('quick_feet', secs(20)),
        item('walk', secs(40)),
      ]),
      coolLegs,
    ],
  },

  // ───── Advanced ─────
  {
    key: 'skateboarding-impact-ready-legs', level: 'advanced', format: 'strength', minutes: 55, equipment: ['box', 'barbell', 'rack'],
    title: ['Impact-Ready Legs', 'ساقان جاهزتان للصدمات'],
    desc: ['Explosive jumps, heavy squats and strong hamstrings: legs that pop higher and survive bigger drops.', 'قفزات انفجارية وسكوات ثقيل وأوتار ركبة قوية: ساقان تقفزان أعلى وتتحمّلان نزولًا أكبر.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('easy_jog', mins(3)), item('ankle_mobility', perSide(['8', '8'])), item('air_squat', reps('10')), item('skips', meters(20))]),
      block(['Power', 'القوة الانفجارية'], 'strength', { note: ['Full rest: every jump should be your best', 'راحة كاملة: كل قفزة يجب أن تكون أفضل ما لديك'] }, [
        item('box_jump', sets(5, '3'), ['Step down · rest 90 s', 'انزل خطوة خطوة · راحة 90 ث']),
        item('lunge_jump', sets(3, '5 / side'), ['Land soft and switch · rest 90 s', 'اهبط بنعومة وبدّل · راحة 90 ث']),
      ]),
      block(['Strength', 'القوة'], 'strength', {}, [
        item('front_squat', sets(4, '5'), ['1–2 reps left in the tank · rest 2 min', 'اترك تكرارًا أو اثنين · راحة 2 د']),
        item('nordic_curl', sets(3, '5'), ['Lower as slowly as you can · rest 90 s', 'انزل ببطء قدر ما تستطيع · راحة 90 ث']),
        item('single_leg_calf_raise', sets(3, '15 / side'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'skateboarding-session-stamina', level: 'advanced', format: 'emom', minutes: 36, equipment: [],
    title: ['Session Stamina', 'تحمّل الجلسة'],
    desc: ['Twenty-four minutes, a new move every minute. Keeps your legs and landings sharp late in a long session.', 'أربع وعشرون دقيقة، حركة جديدة كل دقيقة. يُبقي ساقيك قويتين وهبوطك ثابتًا في آخر الجلسة الطويلة.'],
    blocks: [
      warmSkate(7),
      block(MAIN, 'emom', { minutes: 24, note: ['Finish the work, rest what is left of the minute', 'أنهِ الحركة وارتح ما تبقّى من الدقيقة'] }, [
        item('skater_jump', perSide(['8', '8'])),
        item('jump_squat', reps('10')),
        item('mountain_climber', secs(30)),
        item('lateral_lunge', perSide(['8', '8'])),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'skateboarding-last-run-finisher', level: 'advanced', format: 'for_time', minutes: 38, equipment: ['box', 'kettlebell'],
    title: ['Last Run Finisher', 'ختام الجولة الأخيرة'],
    desc: ['Four rounds against the clock: push-leg work, jumps and a loaded carry. Train to stay in control when you are cooked.', 'أربع جولات ضد الوقت: حركات لساق الدفع وقفزات وحمل وزن أثناء المشي. تدرّب على البقاء متحكمًا وأنت منهك.'],
    blocks: [
      warmSkate(7),
      block(['For time', 'ضد الوقت'], 'for_time', { minutes: 22, rounds: 4, note: ['4 rounds, 22 min cap. Write down your time.', '4 جولات، الحد 22 د. سجّل وقتك.'] }, [
        item('step_up', perSide(['12', '12'])),
        item('box_jump', reps('8'), ['Step down', 'انزل خطوة خطوة']),
        item('suitcase_carry', meters(40), ['Switch hands halfway', 'بدّل اليد في منتصف المسافة']),
        item('burpee', reps('8')),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'skateboarding-board-control', level: 'advanced', format: 'amrap', minutes: 35, equipment: ['dumbbells', 'bench'],
    title: ['Board Control', 'التحكم في اللوح'],
    desc: ['Eighteen minutes of single-leg balance, sticky landings and side strength. Fine control that carries onto the board.', 'ثماني عشرة دقيقة من التوازن على ساق واحدة والهبوط الثابت وقوة الجانبين. تحكّم دقيق ينتقل معك إلى اللوح.'],
    blocks: [
      block(WARM, 'flow', { minutes: 7 }, [item('march', mins(1)), item('ankle_mobility', perSide(['8', '8'])), item('leg_swings', perSide(['10', '10'])), item('worlds_greatest_stretch', perSide(['3', '3']))]),
      block(['AMRAP', 'أكبر عدد من الجولات'], 'amrap', { minutes: 18, note: ['Steady pace; quality over speed', 'إيقاع ثابت، الجودة قبل السرعة'] }, [
        item('single_leg_rdl', perSide(['8', '8'])),
        item('skater_jump', perSide(['6', '6']), ['Hold each landing for 2 s', 'اثبت عند كل هبوط 2 ث']),
        item('copenhagen_plank', perSide(secs(20))),
        item('hollow_hold', secs(30)),
      ]),
      coolLegs,
    ],
  },
];
