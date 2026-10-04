// Gym: full-body, upper/lower and push/pull splits, dumbbell-only and cable days, hypertrophy and
// heavy barbell strength, plus core. 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, sets, secs, mins, meters, perSide, WARM, MAIN, COOL } = require('../kit');

const warmUpper = (minutes = 6) => block(WARM, 'flow', { minutes }, [
  item('bike', mins(3)),
  item('arm_circles', secs(30)),
  item('band_pull_apart', reps('15')),
  item('incline_push_up', reps('8')),
]);
const warmLower = (minutes = 6) => block(WARM, 'flow', { minutes }, [
  item('bike', mins(3)),
  item('leg_swings', perSide(['10', '10'])),
  item('hip_hinge', reps('10')),
  item('air_squat', reps('10')),
]);
const coolLegs = block(COOL, 'flow', { minutes: 5 }, [
  item('quad_stretch', perSide(secs(30))),
  item('hamstring_stretch', perSide(secs(30))),
  item('figure_four_stretch', perSide(secs(30))),
]);
const coolUpper = block(COOL, 'flow', { minutes: 4 }, [
  item('chest_stretch', secs(30)),
  item('lat_stretch', perSide(secs(30))),
  item('childs_pose', mins(1)),
]);
const coolFull = block(COOL, 'flow', { minutes: 5 }, [
  item('quad_stretch', perSide(secs(30))),
  item('hamstring_stretch', perSide(secs(30))),
  item('chest_stretch', secs(30)),
  item('lat_stretch', perSide(secs(30))),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'gym-full-body-start', level: 'beginner', format: 'strength', minutes: 35, equipment: ['bike', 'kettlebell', 'dumbbells', 'bench'],
    title: ['Full Body Start', 'بداية الجسم كاملًا'],
    desc: ['Your first weeks in the gym: one squat, one press, one row and one hinge, all with light weights.', 'أسابيعك الأولى في الصالة الرياضية: سكوات ودفع وسحب وانحناء، كلها بأوزان خفيفة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('bike', mins(3)), item('arm_circles', secs(30)), item('hip_hinge', reps('10')), item('air_squat', reps('10'))]),
      block(MAIN, 'strength', {}, [
        item('goblet_squat', sets(3, '10'), ['3 reps left in the tank · rest 90 s', 'اترك 3 تكرارات · راحة 90 ث']),
        item('dumbbell_bench_press', sets(3, '10'), ['3 reps left in the tank · rest 90 s', 'اترك 3 تكرارات · راحة 90 ث']),
        item('dumbbell_row', sets(3, '10 / side'), ['Flat back, pull to your hip · rest 60 s', 'ظهر مستقيم واسحب نحو الورك · راحة 60 ث']),
        item('kettlebell_deadlift', sets(3, '10'), ['Push the floor away · rest 90 s', 'ادفع الأرض بقدميك · راحة 90 ث']),
        item('plank', sets(2, '20 s'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      coolFull,
    ],
  },
  {
    key: 'gym-upper-body-basics', level: 'beginner', format: 'strength', minutes: 30, equipment: ['bike', 'band', 'bench', 'cable', 'dumbbells'],
    title: ['Upper Body Basics', 'أساسيات الجزء العلوي'],
    desc: ['Chest, back, shoulders and arms using cables and light dumbbells. A calm start for a stronger upper body.', 'الصدر والظهر والكتفان والذراعان بالكابل ودمبلات خفيفة. بداية هادئة لجزء علوي أقوى.'],
    blocks: [
      warmUpper(5),
      block(MAIN, 'strength', {}, [
        item('lat_pulldown', sets(3, '12'), ['Pull to your upper chest · rest 75 s', 'اسحب نحو أعلى الصدر · راحة 75 ث']),
        item('incline_push_up', sets(3, '10'), ['Body in one line · rest 60 s', 'الجسم في خط واحد · راحة 60 ث']),
        item('face_pull', sets(2, '15'), ['Light weight · rest 45 s', 'وزن خفيف · راحة 45 ث']),
        item('lateral_raise', sets(2, '12'), ['Rest 45 s', 'راحة 45 ث']),
        item('biceps_curl', sets(2, '12'), ['Rest 45 s', 'راحة 45 ث']),
        item('triceps_extension', sets(2, '12'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'gym-lower-body-basics', level: 'beginner', format: 'strength', minutes: 30, equipment: ['bike', 'bench', 'box'],
    title: ['Lower Body Basics', 'أساسيات الجزء السفلي'],
    desc: ['Learn to squat, step and bridge with control. Builds the legs and glutes before you add a barbell.', 'تعلّم السكوات والصعود والجسر بتحكم. يبني الساقين والأرداف قبل أن تضيف البار.'],
    blocks: [
      warmLower(5),
      block(MAIN, 'strength', {}, [
        item('box_squat', sets(3, '10'), ['Sit back, touch the bench lightly · rest 75 s', 'اجلس للخلف والمس المقعد بخفة · راحة 75 ث']),
        item('step_up', sets(3, '8 / side'), ['Drive through the whole foot · rest 60 s', 'ادفع بكامل القدم · راحة 60 ث']),
        item('glute_bridge', sets(3, '12'), ['Pause 1 s at the top · rest 45 s', 'توقف ثانية في الأعلى · راحة 45 ث']),
        item('wall_sit', sets(2, '30 s'), ['Rest 45 s', 'راحة 45 ث']),
        item('calf_raise', sets(2, '15'), ['Rest 30 s', 'راحة 30 ث']),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'gym-core-foundations', level: 'beginner', format: 'rounds', minutes: 20, equipment: ['band', 'kettlebell'],
    title: ['Core Foundations', 'أساسيات الجذع'],
    desc: ['A strong middle that protects your back on every lift. Slow reps and steady breathing.', 'جذع قوي يحمي ظهرك في كل رفعة. تكرارات بطيئة وتنفّس ثابت.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('cat_cow', reps('8')), item('march', mins(1)), item('bird_dog', perSide(['5', '5']))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('dead_bug', perSide(['6', '6']), ['Lower back stays on the floor', 'أسفل الظهر يبقى على الأرض']),
        item('pallof_press', perSide(['10', '10'])),
        item('suitcase_carry', perSide(meters(20)), ['Light weight, stand tall', 'وزن خفيف وقف مستقيمًا']),
        item('knee_plank', secs(30)),
      ]),
      block(COOL, 'flow', { minutes: 3 }, [item('childs_pose', mins(1)), item('hip_flexor_stretch', perSide(secs(30)))]),
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'gym-push-day', level: 'intermediate', format: 'strength', minutes: 45, equipment: ['bike', 'band', 'bench', 'dumbbells'],
    title: ['Push Day', 'يوم الدفع'],
    desc: ['Chest, shoulders and triceps with more sets and moderate rest. Pair it with Pull Day in the same week.', 'الصدر والكتفان والترايسبس بمجموعات أكثر وراحة متوسطة. اجمعه مع يوم السحب في الأسبوع نفسه.'],
    blocks: [
      warmUpper(),
      block(MAIN, 'strength', {}, [
        item('dumbbell_bench_press', sets(4, '8'), ['2 reps left in the tank · rest 2 min', 'اترك تكرارين · راحة 2 د']),
        item('overhead_press', sets(3, '8'), ['Ribs down, no leaning back · rest 90 s', 'الأضلاع للأسفل دون ميل للخلف · راحة 90 ث']),
        item('push_up', sets(3, '10–12'), ['Rest 60 s', 'راحة 60 ث']),
        item('dips', sets(3, '12'), ['Shoulders away from your ears · rest 60 s', 'الكتفان بعيدان عن الأذنين · راحة 60 ث']),
        item('lateral_raise', sets(3, '12–15'), ['Rest 45 s', 'راحة 45 ث']),
        item('triceps_extension', sets(3, '12'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'gym-pull-day', level: 'intermediate', format: 'strength', minutes: 45, equipment: ['rower', 'band', 'pull_up_bar', 'cable', 'dumbbells', 'bench'],
    title: ['Pull Day', 'يوم السحب'],
    desc: ['Back and biceps from every angle, with cables and dumbbells. Better posture and a stronger grip.', 'الظهر والبايسبس من كل الزوايا بالكابل والدمبل. قوام أفضل وقبضة أقوى.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('rower', mins(3)), item('shoulder_rolls', secs(30)), item('band_pull_apart', reps('15')), item('cat_cow', reps('6'))]),
      block(MAIN, 'strength', {}, [
        item('band_pull_up', sets(3, '6–8'), ['Lighter band as you get stronger · rest 90 s', 'شريط أخف كلما قويت · راحة 90 ث']),
        item('lat_pulldown', sets(4, '10'), ['2 reps left in the tank · rest 90 s', 'اترك تكرارين · راحة 90 ث']),
        item('dumbbell_row', sets(3, '10 / side'), ['Rest 60 s', 'راحة 60 ث']),
        item('face_pull', sets(3, '15'), ['Pull to your eyes, elbows high · rest 45 s', 'اسحب نحو العينين والمرفقان عاليان · راحة 45 ث']),
        item('biceps_curl', sets(3, '12'), ['No swinging · rest 45 s', 'دون أرجحة · راحة 45 ث']),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'gym-leg-day-volume', level: 'intermediate', format: 'strength', minutes: 45, equipment: ['bike', 'kettlebell', 'dumbbells', 'bench', 'barbell'],
    title: ['Leg Day Volume', 'يوم الساقين بحجم عالٍ'],
    desc: ['Higher reps for bigger, stronger legs and glutes. Expect to feel it the next day.', 'تكرارات أعلى لساقين وأرداف أكبر وأقوى. توقّع أن تشعر بها في اليوم التالي.'],
    blocks: [
      warmLower(),
      block(MAIN, 'strength', {}, [
        item('goblet_squat', sets(4, '12'), ['2 reps left in the tank · rest 90 s', 'اترك تكرارين · راحة 90 ث']),
        item('romanian_deadlift', sets(4, '10'), ['Soft knees, hips back · rest 90 s', 'ركبتان مرنتان والوركان للخلف · راحة 90 ث']),
        item('bulgarian_split_squat', sets(3, '10 / side'), ['Rest 60 s', 'راحة 60 ث']),
        item('hip_thrust', sets(3, '12'), ['Squeeze 1 s at the top · rest 60 s', 'اضغط الأرداف ثانية في الأعلى · راحة 60 ث']),
        item('single_leg_calf_raise', sets(3, '12 / side'), ['Rest 30 s', 'راحة 30 ث']),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'gym-dumbbell-circuit', level: 'intermediate', format: 'rounds', minutes: 35, equipment: ['dumbbells'],
    title: ['Dumbbell Only', 'دمبل فقط'],
    desc: ['A full-body circuit with one pair of dumbbells. Good for a busy gym or a home set-up.', 'دائرة للجسم كاملًا بزوج دمبل واحد. مناسبة لصالة مزدحمة أو للتمرين في البيت.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('jumping_jack', secs(45)), item('inchworm', reps('5')), item('hip_hinge', reps('10')), item('reverse_lunge', perSide(['5', '5']))]),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 90 s between rounds', 'راحة 90 ث بين الجولات'] }, [
        item('romanian_deadlift', reps('10')),
        item('push_press', reps('8')),
        item('walking_lunge', perSide(['10', '10']), ['Hold the dumbbells at your sides', 'أمسك الدمبلين بجانبيك']),
        item('push_up', reps('10')),
        item('farmer_carry', meters(40)),
      ]),
      coolFull,
    ],
  },

  // ───── Advanced ─────
  {
    key: 'gym-heavy-squat-bench', level: 'advanced', format: 'strength', minutes: 60, equipment: ['bike', 'band', 'barbell', 'rack', 'bench', 'pull_up_bar'],
    title: ['Heavy Squat and Bench', 'سكوات وضغط صدر ثقيل'],
    desc: ['Five heavy sets of five on the two big lifts, then rows and core. For lifters with solid technique.', 'خمس مجموعات ثقيلة من خمس تكرارات في الرفعتين الكبيرتين، ثم سحب وجذع. لمن يتقن الأداء.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('bike', mins(4)), item('air_squat', reps('10')), item('inchworm', reps('5')), item('band_pull_apart', reps('15'))]),
      block(MAIN, 'strength', { note: ['Build up with 2–3 lighter sets before your first work set', 'تدرّج بمجموعتين أو ثلاث أخف قبل أول مجموعة عمل'] }, [
        item('back_squat', sets(5, '5'), ['1–2 reps left in the tank · rest 3 min', 'اترك تكرارًا أو اثنين · راحة 3 د']),
        item('bench_press', sets(5, '5'), ['Use a spotter or safety bars · rest 2–3 min', 'استعن بمساعد أو بقضبان الأمان · راحة 2–3 د']),
        item('barbell_row', sets(3, '8'), ['Rest 90 s', 'راحة 90 ث']),
        item('hanging_knee_raise', sets(3, '10'), ['No swinging · rest 60 s', 'دون أرجحة · راحة 60 ث']),
      ]),
      coolFull,
    ],
  },
  {
    key: 'gym-deadlift-day', level: 'advanced', format: 'strength', minutes: 55, equipment: ['rower', 'barbell', 'pull_up_bar', 'bench', 'kettlebell'],
    title: ['Deadlift Day', 'يوم الرفعة الميتة'],
    desc: ['Heavy triples on the deadlift, then pull-ups, glutes and hamstrings. The back of your body, built strong.', 'ثلاثيات ثقيلة في الرفعة الميتة، ثم العقلة والأرداف وأوتار الركبة. خلف الجسم كله أقوى.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('rower', mins(4)), item('hip_hinge', reps('10')), item('glute_bridge', reps('10')), item('worlds_greatest_stretch', perSide(['3', '3']))]),
      block(MAIN, 'strength', {}, [
        item('deadlift', sets(5, '3'), ['Brace before every rep · rest 3 min', 'شدّ الجذع قبل كل تكرار · راحة 3 د']),
        item('pull_up', sets(4, '5–8'), ['Rest 2 min', 'راحة 2 د']),
        item('hip_thrust', sets(3, '8'), ['Rest 90 s', 'راحة 90 ث']),
        item('nordic_curl', sets(3, '5'), ['Lower as slowly as you can · rest 90 s', 'انزل ببطء قدر ما تستطيع · راحة 90 ث']),
        item('suitcase_carry', ['3 × 30 m / side', '3 × 30 م لكل جهة'], ['Heavy · rest 60 s', 'وزن ثقيل · راحة 60 ث']),
      ]),
      block(COOL, 'flow', { minutes: 5 }, [item('hamstring_stretch', perSide(secs(30))), item('figure_four_stretch', perSide(secs(30))), item('lat_stretch', perSide(secs(30)))]),
    ],
  },
  {
    key: 'gym-upper-supersets', level: 'advanced', format: 'rounds', minutes: 50, equipment: ['bike', 'band', 'dumbbells', 'bench', 'barbell', 'cable'],
    title: ['Upper Body Supersets', 'مجموعات مزدوجة للجزء العلوي'],
    desc: ['Hypertrophy day: paired moves back to back with short rest, so more work fits in less time.', 'يوم تضخيم: حركتان متتاليتان براحة قصيرة، فتنجز عملًا أكثر في وقت أقل.'],
    blocks: [
      warmUpper(7),
      block(['Chest and back', 'الصدر والظهر'], 'rounds', { rounds: 4, note: ['No rest between the two · rest 75 s after each round', 'بلا راحة بين الحركتين · راحة 75 ث بعد كل جولة'] }, [
        item('dumbbell_bench_press', reps('10')),
        item('barbell_row', reps('10')),
      ]),
      block(['Shoulders and lats', 'الكتفان وجانبا الظهر'], 'rounds', { rounds: 3, note: ['Rest 60 s after each round', 'راحة 60 ث بعد كل جولة'] }, [
        item('overhead_press', reps('10')),
        item('lat_pulldown', reps('12')),
      ]),
      block(['Arms', 'الذراعان'], 'rounds', { rounds: 3, note: ['Rest 45 s after each round', 'راحة 45 ث بعد كل جولة'] }, [
        item('biceps_curl', reps('12')),
        item('triceps_extension', reps('12')),
        item('lateral_raise', reps('15')),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'gym-lower-density', level: 'advanced', format: 'emom', minutes: 40, equipment: ['bike', 'barbell', 'rack', 'kettlebell'],
    title: ['Lower Body Density', 'كثافة الجزء السفلي'],
    desc: ['A new move every minute for 24 minutes: front squats, swings, lunges and core. Strength under fatigue.', 'حركة جديدة كل دقيقة لمدة 24 دقيقة: سكوات أمامي وأرجحة وطعن وجذع. قوة تحت التعب.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('bike', mins(4)), item('leg_swings', perSide(['10', '10'])), item('goblet_squat', reps('8')), item('kettlebell_swing', reps('10'))]),
      block(MAIN, 'emom', { minutes: 24, note: ['Finish the work, rest what is left of the minute', 'أنهِ الحركة وارتح ما تبقّى من الدقيقة'] }, [
        item('front_squat', reps('5'), ['Heavy but fast · elbows high', 'ثقيل لكن سريع · المرفقان عاليان']),
        item('kettlebell_swing', reps('15')),
        item('walking_lunge', perSide(['8', '8'])),
        item('hollow_hold', secs(30)),
      ]),
      coolLegs,
    ],
  },
];
