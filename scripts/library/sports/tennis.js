// Tennis: long points, a big serve and forehand driven by rotation, shoulders and elbows that hold up,
// lateral and forward-back movement, and legs that last a long match. 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, sets, secs, mins, meters, perSide, WARM, MAIN, COOL } = require('../kit');

const warmBaseline = (minutes = 6) => block(WARM, 'flow', { minutes }, [
  item('march', secs(45)),
  item('arm_circles', secs(30)),
  item('leg_swings', perSide(['10', '10'])),
  item('lateral_shuffle', secs(30)),
  item('thoracic_rotation', perSide(['6', '6'])),
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
  item('childs_pose', secs(45)),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'tennis-baseline-legs', level: 'beginner', format: 'rounds', minutes: 22, equipment: [],
    title: ['Baseline Legs', 'ساقا الخط الخلفي'],
    desc: ['Legs that bend for low balls and push back to the centre. Bodyweight only, for new players.', 'ساقان تنثنيان للكرات المنخفضة وتدفعانك إلى منتصف الملعب. بوزن الجسم فقط، للاعبين الجدد.'],
    blocks: [
      warmBaseline(5),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('air_squat', reps('12')),
        item('reverse_lunge', perSide(['8', '8'])),
        item('lateral_lunge', perSide(['6', '6']), ['Sit into the hip, chest up', 'اجلس في الورك والصدر مرفوع']),
        item('calf_raise', reps('15')),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'tennis-shoulder-elbow-care', level: 'beginner', format: 'rounds', minutes: 18, equipment: ['band', 'dumbbells'],
    title: ['Shoulder and Elbow Care', 'العناية بالكتف والمرفق'],
    desc: ['Light work for the hitting arm: balanced shoulders and a stronger grip that eases the load on the elbow.', 'حركات خفيفة لذراع الضرب: كتفان متوازنان وقبضة أقوى تخفّف الحمل عن المرفق.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('shoulder_rolls', secs(30)), item('arm_circles', secs(30)), item('neck_rolls', secs(30))]),
      block(MAIN, 'rounds', { rounds: 2, note: ['Light weights, slow and smooth · rest 60 s between rounds', 'أوزان خفيفة، ببطء وسلاسة · راحة 60 ث بين الجولات'] }, [
        item('band_pull_apart', reps('15')),
        item('lateral_raise', reps('10'), ['Stop at shoulder height', 'توقف عند مستوى الكتف']),
        item('biceps_curl', reps('10')),
        item('triceps_extension', reps('10')),
        item('farmer_carry', meters(20), ['Squeeze the handles hard', 'اضغط على المقابض بقوة']),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'tennis-match-stamina-base', level: 'beginner', format: 'intervals', minutes: 25, equipment: [],
    title: ['Match Stamina Base', 'أساس لياقة المباراة'],
    desc: ['Easy runs and walks that build the base for a full match. Talk-pace only.', 'هرولة ومشي سهلان يبنيان الأساس لمباراة كاملة. بإيقاع تستطيع معه الكلام.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('walk', mins(2)), item('leg_swings', perSide(['8', '8'])), item('ankle_mobility', perSide(['8', '8']))]),
      block(MAIN, 'intervals', { rounds: 5, note: ['Easy enough to hold a conversation', 'سهل بما يكفي لتتحدث أثناءه'] }, [
        item('easy_jog', mins(2)),
        item('walk', mins(1)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'tennis-swing-core-basics', level: 'beginner', format: 'rounds', minutes: 20, equipment: ['band'],
    title: ['Swing Core Basics', 'أساسيات جذع الضربة'],
    desc: ['A trunk that turns and then stops cleanly, so the swing comes from the body, not the arm.', 'جذع يدور ثم يتوقف بإحكام، لتأتي الضربة من الجسم لا من الذراع.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('cat_cow', reps('8')), item('thoracic_rotation', perSide(['6', '6'])), item('hip_openers', perSide(['6', '6']))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('pallof_press', perSide(['8', '8']), ['Do not let the band turn you', 'لا تدع الشريط يلفّك']),
        item('dead_bug', perSide(['6', '6'])),
        item('side_plank', perSide(secs(20))),
        item('bird_dog', perSide(['6', '6'])),
      ]),
      block(COOL, 'flow', { minutes: 3 }, [item('childs_pose', mins(1)), item('figure_four_stretch', perSide(secs(30)))]),
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'tennis-full-court-coverage', level: 'intermediate', format: 'intervals', minutes: 30, equipment: [],
    title: ['Full-Court Coverage', 'تغطية الملعب'],
    desc: ['Side to side along the baseline, then forward for the short ball. Long work bouts, like real tennis points.', 'من جانب إلى جانب على الخط الخلفي، ثم إلى الأمام للكرة القصيرة. فترات عمل طويلة مثل نقاط التنس الحقيقية.'],
    blocks: [
      warmBaseline(7),
      block(MAIN, 'intervals', { rounds: 6, note: ['Walk to recover, then go again', 'امشِ للاستشفاء ثم ابدأ من جديد'] }, [
        item('lateral_shuffle', secs(30)),
        item('shuttle_run', secs(30)),
        item('skater_jump', perSide(['5', '5'])),
        item('walk', mins(1)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'tennis-serve-forehand-power', level: 'intermediate', format: 'rounds', minutes: 30, equipment: ['med_ball'],
    title: ['Serve and Forehand Power', 'قوة الإرسال والضربة الأمامية'],
    desc: ['Drive from the legs, turn through the hips, then throw. Builds the chain behind a big serve and forehand.', 'ادفع من الساقين، ودُر بالوركين، ثم ارمِ. يبني السلسلة التي تقف خلف إرسال قوي وضربة أمامية قوية.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('arm_circles', secs(30)), item('worlds_greatest_stretch', perSide(['3', '3'])), item('thoracic_rotation', perSide(['8', '8'])), item('air_squat', reps('10'))]),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 75 s between rounds · every rep fast', 'راحة 75 ث بين الجولات · كل تكرار بسرعة'] }, [
        item('med_ball_rotational_throw', perSide(['6', '6']), ['Turn the back hip first', 'دوّر الورك الخلفي أولًا']),
        item('med_ball_slam', reps('8'), ['Reach tall like a serve, then slam', 'امتد عاليًا كالإرسال ثم اضرب']),
        item('jump_squat', reps('6')),
        item('plank_shoulder_tap', perSide(['8', '8'])),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'tennis-long-match-legs', level: 'intermediate', format: 'strength', minutes: 40, equipment: ['kettlebell', 'box', 'dumbbells'],
    title: ['Long-Match Legs', 'ساقان للمباريات الطويلة'],
    desc: ['Strength that keeps your legs under you in the third set: squat, step, hinge and calves.', 'قوة تُبقي ساقيك ثابتتين في المجموعة الثالثة: سكوات وصعود وانحناء وسمانة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('march', mins(1)), item('glute_bridge', reps('10')), item('hip_hinge', reps('10')), item('reverse_lunge', perSide(['6', '6']))]),
      block(MAIN, 'strength', {}, [
        item('goblet_squat', sets(3, '10'), ['2 reps left in the tank · rest 90 s', 'اترك تكرارين · راحة 90 ث']),
        item('step_up', sets(3, '8 / side'), ['Drive through the top foot · rest 60 s', 'ادفع بالقدم العليا · راحة 60 ث']),
        item('romanian_deadlift', sets(3, '10'), ['Rest 90 s', 'راحة 90 ث']),
        item('single_leg_calf_raise', sets(3, '15 / side'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'tennis-shoulder-balance', level: 'intermediate', format: 'strength', minutes: 35, equipment: ['dumbbells', 'bench', 'cable'],
    title: ['Shoulder Balance', 'توازن الكتف'],
    desc: ['Serving builds the front of the shoulder; this strengthens the back and the arm around the elbow to match.', 'الإرسال يقوّي مقدمة الكتف، وهذا التمرين يقوّي الخلف والذراع حول المرفق ليتوازن معه.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('shoulder_rolls', secs(30)), item('arm_circles', secs(30)), item('thoracic_rotation', perSide(['6', '6'])), item('incline_push_up', reps('8'))]),
      block(MAIN, 'strength', {}, [
        item('dumbbell_row', sets(3, '10 / side'), ['Rest 60 s', 'راحة 60 ث']),
        item('face_pull', sets(3, '15'), ['Elbows high, squeeze the shoulder blades · rest 45 s', 'المرفقان عاليان، اضغط لوحي الكتف · راحة 45 ث']),
        item('lateral_raise', sets(3, '12'), ['Rest 45 s', 'راحة 45 ث']),
        item('triceps_extension', sets(3, '12'), ['Rest 45 s', 'راحة 45 ث']),
        item('farmer_carry', sets(3, '30 m'), ['Rest 60 s', 'راحة 60 ث']),
      ]),
      coolUpper,
    ],
  },

  // ───── Advanced ─────
  {
    key: 'tennis-long-point-repeats', level: 'advanced', format: 'intervals', minutes: 38, equipment: [],
    title: ['Long Point Repeats', 'تكرارات النقاط الطويلة'],
    desc: ['Twelve long, hard points with short rests. For players who fade late in long rallies.', 'اثنتا عشرة نقطة طويلة وقوية مع راحة قصيرة. للاعبين الذين يتعبون في آخر التبادلات الطويلة.'],
    blocks: [
      warmBaseline(8),
      block(MAIN, 'intervals', { rounds: 12, note: ['Rest only on the walk; keep the feet busy', 'ارتح أثناء المشي فقط، وأبقِ قدميك نشيطتين'] }, [
        item('shuttle_run', secs(45)),
        item('lateral_shuffle', secs(25)),
        item('walk', secs(35)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'tennis-power-from-the-ground', level: 'advanced', format: 'strength', minutes: 55, equipment: ['box', 'med_ball', 'barbell', 'rack', 'dumbbells', 'pull_up_bar'],
    title: ['Power from the Ground', 'القوة من الأرض'],
    desc: ['Jumps and throws while fresh, then heavy lifting. More pace on serve and groundstrokes with a body built to take it.', 'قفزات ورميات وأنت نشيط، ثم أوزان ثقيلة. سرعة أكبر في الإرسال والضربات الأرضية بجسم قادر على تحمّلها.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('easy_jog', mins(3)), item('worlds_greatest_stretch', perSide(['3', '3'])), item('air_squat', reps('10')), item('skips', meters(20))]),
      block(['Power', 'القوة الانفجارية'], 'strength', { note: ['Full rest: every rep at full speed', 'راحة كاملة: كل تكرار بأقصى سرعة'] }, [
        item('box_jump', sets(4, '4'), ['Step down · rest 90 s', 'انزل خطوة خطوة · راحة 90 ث']),
        item('med_ball_rotational_throw', sets(4, '5 / side'), ['Rest 60 s', 'راحة 60 ث']),
      ]),
      block(['Strength', 'القوة'], 'strength', {}, [
        item('back_squat', sets(4, '5'), ['1–2 reps left in the tank · rest 2 min', 'اترك تكرارًا أو اثنين · راحة 2 د']),
        item('single_leg_rdl', sets(3, '8 / side'), ['Rest 90 s', 'راحة 90 ث']),
        item('pull_up', sets(3, '5–8'), ['Rest 90 s', 'راحة 90 ث']),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'tennis-tiebreak-finisher', level: 'advanced', format: 'for_time', minutes: 36, equipment: ['wall_ball'],
    title: ['Tiebreak Finisher', 'ختام الشوط الفاصل'],
    desc: ['Five fast rounds against the clock. Train to stay explosive and accurate when you are already tired.', 'خمس جولات سريعة ضد الوقت. تدرّب على البقاء انفجاريًا ودقيقًا وأنت متعب.'],
    blocks: [
      warmBaseline(7),
      block(['For time', 'ضد الوقت'], 'for_time', { minutes: 22, rounds: 5, note: ['5 rounds, 22 min cap. Write down your time.', '5 جولات، الحد 22 د. سجّل وقتك.'] }, [
        item('sprint', meters(60)),
        item('wall_ball', reps('15'), ['Full reach overhead, like a serve', 'امتداد كامل فوق الرأس مثل الإرسال']),
        item('skater_jump', perSide(['8', '8'])),
        item('mountain_climber', secs(30)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'tennis-serving-shoulder-strength', level: 'advanced', format: 'strength', minutes: 50, equipment: ['dumbbells', 'barbell', 'bench', 'kettlebell', 'band'],
    title: ['Serving Shoulder Strength', 'قوة كتف الإرسال'],
    desc: ['Heavy pressing and pulling plus loaded carries, so the serving shoulder and elbow cope with a full season.', 'دفع وسحب بأوزان ثقيلة مع حمل الأوزان أثناء المشي، ليتحمّل كتف الإرسال والمرفق موسمًا كاملًا.'],
    blocks: [
      block(WARM, 'flow', { minutes: 7 }, [item('easy_jog', mins(3)), item('band_pull_apart', reps('15')), item('kettlebell_halo', reps('8')), item('push_up', reps('8'))]),
      block(MAIN, 'strength', {}, [
        item('overhead_press', sets(4, '6'), ['1–2 reps left in the tank · rest 2 min', 'اترك تكرارًا أو اثنين · راحة 2 د']),
        item('barbell_row', sets(4, '6'), ['Rest 2 min', 'راحة 2 د']),
        item('decline_push_up', sets(3, '10'), ['Rest 90 s', 'راحة 90 ث']),
        item('suitcase_carry', sets(3, '30 m'), ['Each hand · stand tall, do not lean · rest 60 s', 'لكل يد · قف مستقيمًا ولا تمل · راحة 60 ث']),
      ]),
      block(['Finisher', 'الختام'], 'rounds', { rounds: 3, note: ['Rest 30 s between rounds', 'راحة 30 ث بين الجولات'] }, [
        item('band_pull_apart', reps('15')),
        item('hollow_hold', secs(30)),
      ]),
      coolUpper,
    ],
  },
];
