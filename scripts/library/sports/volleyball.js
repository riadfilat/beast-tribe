// Volleyball: a higher vertical jump and safe landings, shoulders that last a season of spiking and
// serving, a strong core, and quick feet for the dig. 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, sets, secs, mins, meters, perSide, WARM, MAIN, COOL } = require('../kit');

const warmNet = (minutes = 6) => block(WARM, 'flow', { minutes }, [
  item('jumping_jack', secs(45)),
  item('arm_circles', secs(30)),
  item('shoulder_rolls', secs(30)),
  item('leg_swings', perSide(['10', '10'])),
  item('air_squat', reps('10')),
]);
const coolLegs = block(COOL, 'flow', { minutes: 5 }, [
  item('quad_stretch', perSide(secs(30))),
  item('hamstring_stretch', perSide(secs(30))),
  item('calf_stretch', perSide(secs(30))),
  item('lat_stretch', perSide(secs(30))),
]);
const coolUpper = block(COOL, 'flow', { minutes: 4 }, [
  item('chest_stretch', secs(30)),
  item('lat_stretch', perSide(secs(30))),
  item('childs_pose', mins(1)),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'volleyball-first-jumps', level: 'beginner', format: 'rounds', minutes: 20, equipment: [],
    title: ['First Jumps', 'القفزات الأولى'],
    desc: ['Learn to jump and land on two feet with control: the base for blocking and spiking. For new players.', 'تعلّم القفز والهبوط على القدمين بتحكّم: أساس الصدّ والضربة الساحقة. للاعبين الجدد.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('march', mins(1)), item('ankle_mobility', perSide(['8', '8'])), item('air_squat', reps('8'))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('air_squat', reps('10')),
        item('jump_squat', reps('5'), ['Swing the arms up, land softly and hold 2 s', 'أرجح ذراعيك للأعلى واهبط بنعومة واثبت 2 ث']),
        item('glute_bridge', reps('12')),
        item('calf_raise', reps('15')),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'volleyball-healthy-shoulders', level: 'beginner', format: 'rounds', minutes: 18, equipment: ['band', 'bench'],
    title: ['Healthy Shoulders', 'كتفان سليمتان'],
    desc: ['Strengthens the small muscles behind the shoulder that every serve and spike depends on. Do it before practice.', 'يقوّي العضلات الصغيرة خلف الكتف التي يعتمد عليها كل إرسال وكل ضربة ساحقة. نفّذه قبل التدريب.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('shoulder_rolls', secs(30)), item('arm_circles', secs(30)), item('cat_cow', reps('6'))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Light band, slow and smooth · rest 45 s', 'شريط خفيف، ببطء وسلاسة · راحة 45 ث'] }, [
        item('band_pull_apart', reps('15'), ['Squeeze the shoulder blades together', 'اضغط لوحي الكتف معًا']),
        item('thoracic_rotation', perSide(['6', '6'])),
        item('incline_push_up', reps('10')),
        item('knee_plank', secs(30)),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'volleyball-ready-position', level: 'beginner', format: 'intervals', minutes: 18, equipment: [],
    title: ['Ready Position', 'وضعية الاستعداد'],
    desc: ['Hold a low ready stance and move from it fast. Builds the legs and feet for receiving serves and digging.', 'اثبت في وضعية استعداد منخفضة وتحرّك منها بسرعة. يبني الساقين والقدمين لاستقبال الإرسال والدفاع.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('march', mins(1)), item('step_jack', secs(45)), item('lateral_lunge', perSide(['5', '5']))]),
      block(MAIN, 'intervals', { rounds: 5, note: ['Weight on the balls of the feet', 'الوزن على مقدمة القدمين'] }, [
        item('wall_sit', secs(20)),
        item('quick_feet', secs(15)),
        item('lateral_shuffle', secs(15)),
        item('walk', secs(40)),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'volleyball-tournament-recovery', level: 'beginner', format: 'flow', minutes: 20, equipment: [],
    title: ['Tournament Recovery', 'استشفاء بعد البطولة'],
    desc: ['Gentle mobility for the back, hips and shoulders after a long day of matches. Anyone can do it.', 'حركات مرونة لطيفة للظهر والوركين والكتفين بعد يوم طويل من المباريات. يناسب الجميع.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('walk', mins(2)), item('shoulder_rolls', secs(30)), item('neck_rolls', secs(30))]),
      block(MAIN, 'flow', { minutes: 12, note: ['Breathe slowly, no forcing', 'تنفّس ببطء دون إجبار'] }, [
        item('cat_cow', reps('8')),
        item('thoracic_rotation', perSide(['8', '8'])),
        item('hip_openers', perSide(['6', '6'])),
        item('worlds_greatest_stretch', perSide(['3', '3'])),
        item('lat_stretch', perSide(secs(30))),
        item('figure_four_stretch', perSide(secs(30))),
      ]),
      block(COOL, 'flow', { minutes: 3 }, [item('childs_pose', mins(1)), item('calf_stretch', perSide(secs(30)))]),
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'volleyball-vertical-power', level: 'intermediate', format: 'strength', minutes: 35, equipment: ['box', 'bench', 'dumbbells'],
    title: ['Vertical Jump Power', 'قوة القفز العمودي'],
    desc: ['Box jumps while fresh, then single-leg strength and calves. For players who land well and want to reach higher at the net.', 'القفز على الصندوق وأنت نشيط، ثم قوة الساق الواحدة والسمانة. للاعبين الذين يهبطون جيدًا ويريدون الوصول أعلى عند الشبكة.'],
    blocks: [
      warmNet(),
      block(MAIN, 'strength', {}, [
        item('box_jump', sets(4, '5'), ['Arm swing, land softly, step down · rest 90 s', 'أرجح الذراعين واهبط بنعومة وانزل خطوة · راحة 90 ث']),
        item('jump_squat', sets(3, '6'), ['Rest 60 s', 'راحة 60 ث']),
        item('bulgarian_split_squat', sets(3, '8 / side'), ['2 reps left in the tank · rest 90 s', 'اترك تكرارين · راحة 90 ث']),
        item('single_leg_calf_raise', sets(3, '12 / side'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'volleyball-spiker-shoulders', level: 'intermediate', format: 'strength', minutes: 35, equipment: ['cable', 'dumbbells', 'bench', 'band'],
    title: ['Spiker Shoulder Strength', 'قوة كتف الضارب'],
    desc: ['Pulling and upper-back work to balance hundreds of hard arm swings. Keeps hitters and servers healthy.', 'حركات سحب وتقوية لأعلى الظهر لموازنة مئات الضربات القوية. تحافظ على سلامة الضاربين والمرسلين.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('arm_circles', secs(30)), item('band_pull_apart', reps('15')), item('thoracic_rotation', perSide(['6', '6'])), item('incline_push_up', reps('8'))]),
      block(MAIN, 'strength', {}, [
        item('face_pull', sets(3, '15'), ['Pull to the eyes, thumbs back · rest 60 s', 'اسحب نحو العينين والإبهامان للخلف · راحة 60 ث']),
        item('dumbbell_row', sets(3, '10 / side'), ['Rest 60 s', 'راحة 60 ث']),
        item('lateral_raise', sets(3, '12'), ['Light weight, stop at shoulder height · rest 45 s', 'وزن خفيف، توقف عند مستوى الكتف · راحة 45 ث']),
        item('pallof_press', sets(3, '10 / side'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'volleyball-dig-and-recover', level: 'intermediate', format: 'rounds', minutes: 30, equipment: [],
    title: ['Dig and Recover', 'الدفاع والنهوض'],
    desc: ['Get low, hit the floor and be back on your feet for the next ball. Conditioning for defenders and liberos.', 'انزل منخفضًا وانبطح ثم عد إلى قدميك للكرة التالية. لياقة للمدافعين ولاعب الليبرو.'],
    blocks: [
      warmNet(),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('lateral_lunge', perSide(['8', '8']), ['Chest up, reach low', 'الصدر مرفوع والوصول منخفض']),
        item('step_burpee', reps('8'), ['Down and up as fast as you can control', 'انزل واصعد بأسرع ما تتحكم به']),
        item('lateral_shuffle', secs(20)),
        item('mountain_climber', secs(30)),
        item('plank_shoulder_tap', perSide(['8', '8'])),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'volleyball-spike-core', level: 'intermediate', format: 'rounds', minutes: 30, equipment: ['med_ball'],
    title: ['Spike Core', 'جذع الضربة الساحقة'],
    desc: ['Slams and rotations that link legs to arm, so the spike comes from the whole body, not just the shoulder.', 'ضرب ودوران يربطان الساقين بالذراع، لتأتي الضربة الساحقة من الجسم كله لا من الكتف وحده.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('cat_cow', reps('8')), item('thoracic_rotation', perSide(['6', '6'])), item('worlds_greatest_stretch', perSide(['3', '3']))]),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('med_ball_slam', reps('10'), ['Reach tall, then slam with the whole body', 'تمدّد للأعلى ثم اضرب بالجسم كله']),
        item('med_ball_rotational_throw', perSide(['6', '6'])),
        item('dead_bug', perSide(['8', '8'])),
        item('side_plank', perSide(secs(25))),
      ]),
      coolUpper,
    ],
  },

  // ───── Advanced ─────
  {
    key: 'volleyball-block-and-attack', level: 'advanced', format: 'emom', minutes: 36, equipment: ['box', 'med_ball'],
    title: ['Block and Attack EMOM', 'الصدّ والهجوم كل دقيقة'],
    desc: ['Twenty-four minutes of jumps, slams and shuffles, a new move every minute. Keeps your jump high into the fifth set.', 'أربع وعشرون دقيقة من القفز والضرب والخطوات الجانبية، حركة جديدة كل دقيقة. تحافظ على قفزتك عالية حتى المجموعة الخامسة.'],
    blocks: [
      warmNet(7),
      block(MAIN, 'emom', { minutes: 24, note: ['Finish the work, rest what is left of the minute', 'أنهِ الحركة وارتح ما تبقّى من الدقيقة'] }, [
        item('box_jump', reps('6')),
        item('lateral_shuffle', secs(25)),
        item('med_ball_slam', reps('12')),
        item('jump_squat', reps('8')),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'volleyball-jump-strength', level: 'advanced', format: 'strength', minutes: 50, equipment: ['barbell', 'rack', 'bench', 'box'],
    title: ['Jump Strength at the Net', 'قوة القفز عند الشبكة'],
    desc: ['Heavy squats paired with box jumps, then hips and hamstrings. The engine behind a bigger approach jump.', 'سكوات ثقيل مقرون بالقفز على الصندوق، ثم الوركان والفخذ الخلفية. المحرّك خلف قفزة اقتراب أعلى.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('easy_jog', mins(4)), item('leg_swings', perSide(['10', '10'])), item('air_squat', reps('10')), item('jump_squat', reps('5'))]),
      block(MAIN, 'strength', { note: ['Do the box jumps right after each squat set', 'نفّذ القفز على الصندوق مباشرة بعد كل مجموعة سكوات'] }, [
        item('back_squat', sets(4, '4'), ['1–2 reps left in the tank · then box jumps', 'اترك تكرارًا أو اثنين · ثم القفز على الصندوق']),
        item('box_jump', sets(4, '3'), ['Max height, step down · rest 2–3 min', 'أقصى ارتفاع وانزل خطوة · راحة 2–3 د']),
        item('hip_thrust', sets(3, '8'), ['Rest 2 min', 'راحة 2 د']),
        item('nordic_curl', sets(3, '5'), ['Lower as slowly as you can · rest 90 s', 'انزل ببطء قدر ما تستطيع · راحة 90 ث']),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'volleyball-fifth-set-engine', level: 'advanced', format: 'amrap', minutes: 35, equipment: [],
    title: ['Fifth-Set Engine', 'لياقة المجموعة الخامسة'],
    desc: ['Twenty minutes of as many rounds as you can of jumps, shuffles and floor work. Stay explosive when the match goes long.', 'عشرون دقيقة لأكبر عدد ممكن من الجولات: قفز وخطوات جانبية وحركات أرضية. ابقَ انفجاريًا حين تطول المباراة.'],
    blocks: [
      warmNet(7),
      block(MAIN, 'amrap', { minutes: 20, note: ['Steady pace, count your rounds', 'إيقاع ثابت، عُدّ جولاتك'] }, [
        item('jump_squat', reps('10')),
        item('lateral_shuffle', secs(30)),
        item('burpee', reps('6')),
        item('plank_shoulder_tap', perSide(['8', '8'])),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'volleyball-overhead-athlete', level: 'advanced', format: 'strength', minutes: 50, equipment: ['pull_up_bar', 'band', 'dumbbells', 'cable'],
    title: ['Overhead Athlete Strength', 'قوة الرياضي فوق الرأس'],
    desc: ['Pull-ups, presses and upper-back work done heavy, so the shoulder stays strong through every overhead swing.', 'عقلة وضغط وتقوية لأعلى الظهر بأوزان ثقيلة، ليبقى الكتف قويًا في كل ضربة فوق الرأس.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('jumping_jack', mins(1)), item('arm_circles', secs(30)), item('band_pull_apart', reps('15')), item('inchworm', reps('5')), item('band_pull_up', reps('5'), ['Easy reps to wake up the back', 'تكرارات سهلة لتنشيط الظهر'])]),
      block(MAIN, 'strength', {}, [
        item('pull_up', sets(4, '5–8'), ['Full hang to chin over the bar · rest 2 min', 'من التعلق الكامل حتى الذقن فوق العارضة · راحة 2 د']),
        item('push_press', sets(4, '6'), ['Rest 2 min', 'راحة 2 د']),
        item('single_leg_rdl', sets(3, '8 / side'), ['Rest 90 s', 'راحة 90 ث']),
        item('face_pull', sets(3, '15'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      block(['Core', 'الجذع'], 'rounds', { rounds: 3, note: ['Rest 30 s between rounds', 'راحة 30 ث بين الجولات'] }, [
        item('hanging_knee_raise', reps('10')),
        item('side_plank', perSide(secs(30))),
      ]),
      coolUpper,
    ],
  },
];
