// Horse riding: training FOR the saddle. A tall, quiet posture; deep core and pelvic control; inner thighs
// and hips that hold the leg; calves that keep the heel down; an upper back for soft hands; balance;
// open hips and lower back; and the stamina for long rides. 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, sets, secs, mins, meters, perSide, WARM, MAIN, COOL } = require('../kit');

const halfSeat = ['Half-seat wall sit', 'الجلوس على الحائط بوضعية نصف المقعد'];

const warmLegs = (minutes = 5) => block(WARM, 'flow', { minutes }, [
  item('march', mins(1)),
  item('leg_swings', perSide(['10', '10'])),
  item('ankle_mobility', perSide(['8', '8'])),
]);
const coolLegs = block(COOL, 'flow', { minutes: 5 }, [
  item('calf_stretch', perSide(secs(30))),
  item('quad_stretch', perSide(secs(30))),
  item('figure_four_stretch', perSide(secs(30))),
]);
const coolHips = block(COOL, 'flow', { minutes: 5 }, [
  item('hip_flexor_stretch', perSide(secs(45))),
  item('figure_four_stretch', perSide(secs(45))),
  item('childs_pose', mins(1)),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'horse_riding-tall-posture', level: 'beginner', format: 'rounds', minutes: 20, equipment: ['band'],
    title: ['Tall Posture', 'قوام مستقيم'],
    desc: ['Sit tall without going stiff. Opens the chest and wakes the upper back so your hands stay soft.', 'اجلس مستقيمًا دون تيبّس. يفتح الصدر وينشّط أعلى الظهر لتبقى يداك لينتين على اللجام.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('shoulder_rolls', secs(30)), item('neck_rolls', secs(30)), item('cat_cow', reps('8'))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('band_pull_apart', reps('15'), ['Squeeze the shoulder blades, shoulders down', 'اضمم لوحَي الكتف والكتفان للأسفل']),
        item('pallof_press', perSide(['8', '8'])),
        item('thoracic_rotation', perSide(['6', '6'])),
        item('plank', secs(20), ['One long line from head to heels', 'خط واحد مستقيم من الرأس إلى الكعبين']),
      ]),
      block(COOL, 'flow', { minutes: 4 }, [item('chest_stretch', secs(30)), item('lat_stretch', perSide(secs(30))), item('childs_pose', mins(1))]),
    ],
  },
  {
    key: 'horse_riding-deep-seat-core', level: 'beginner', format: 'rounds', minutes: 20, equipment: [],
    title: ['Deep Seat Core', 'جذع المقعد العميق'],
    desc: ['A quiet pelvis and a steady middle so you move with the horse, not against it. Slow and controlled.', 'حوض هادئ وجذع ثابت لتتحرك مع الحصان لا ضده. ببطء وتحكّم.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('march', mins(1)), item('cat_cow', reps('8')), item('hip_openers', perSide(['5', '5']))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('dead_bug', perSide(['6', '6']), ['Lower back stays on the floor', 'يبقى أسفل الظهر ملاصقًا للأرض']),
        item('bird_dog', perSide(['6', '6'])),
        item('glute_bridge', reps('12')),
        item('side_plank', perSide(secs(15))),
      ]),
      block(COOL, 'flow', { minutes: 3 }, [item('childs_pose', mins(1)), item('figure_four_stretch', perSide(secs(30)))]),
    ],
  },
  {
    key: 'horse_riding-heels-down', level: 'beginner', format: 'rounds', minutes: 20, equipment: [],
    title: ['Heels Down Basics', 'أساسيات الكعب للأسفل'],
    desc: ['Calves, ankles and thighs for a secure leg: the heel sinks and the knee stays soft.', 'السمانة والكاحلان والفخذان لساق ثابتة: ينزل الكعب وتبقى الركبة مرنة.'],
    blocks: [
      warmLegs(5),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('calf_raise', reps('15'), ['Slow on the way down', 'انزل ببطء']),
        item('wall_sit', secs(20), ['Weight in the heels, chest open', 'الوزن على الكعبين والصدر مفتوح'], halfSeat),
        item('split_squat', perSide(['8', '8'])),
        item('hip_hinge', reps('10')),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'horse_riding-after-the-ride', level: 'beginner', format: 'flow', minutes: 20, equipment: [],
    title: ['After the Ride', 'بعد ركوب الخيل'],
    desc: ['Unwinds tight hips and a tired lower back after a long ride or lesson. Gentle, all on the floor.', 'يُرخي الوركين المشدودين وأسفل الظهر المتعب بعد ركوب طويل أو درس. هادئ وكله على الأرض.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('walk', mins(3), null, ['Easy walk', 'مشي هادئ'])]),
      block(MAIN, 'flow', { minutes: 13, note: ['Breathe slowly, never force a stretch', 'تنفّس ببطء ولا تُجبر أي إطالة'] }, [
        item('cat_cow', reps('8')),
        item('hip_flexor_stretch', perSide(secs(45))),
        item('figure_four_stretch', perSide(secs(45))),
        item('thoracic_rotation', perSide(['6', '6'])),
        item('hamstring_stretch', perSide(secs(30))),
      ]),
      block(COOL, 'flow', { minutes: 3 }, [item('childs_pose', mins(1)), item('neck_rolls', secs(30))]),
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'horse_riding-half-seat-endurance', level: 'intermediate', format: 'intervals', minutes: 30, equipment: [],
    title: ['Half-Seat Endurance', 'تحمّل نصف المقعد'],
    desc: ['Hold the half-seat longer without burning out: long holds, short recoveries, legs that last the course.', 'اثبت في نصف المقعد مدة أطول دون إرهاق: ثبات طويل واستشفاء قصير وساقان تصمدان حتى نهاية المسار.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('march', mins(1)), item('air_squat', reps('10')), item('ankle_mobility', perSide(['8', '8'])), item('leg_swings', perSide(['8', '8']))]),
      block(MAIN, 'intervals', { rounds: 6, note: ['Hold the position, recover on the march', 'اثبت في الوضعية واستشفِ أثناء المشي في المكان'] }, [
        item('wall_sit', secs(45), ['Weight in the heels, chest open', 'الوزن على الكعبين والصدر مفتوح'], halfSeat),
        item('calf_raise', reps('15')),
        item('march', secs(45)),
      ]),
      block(['Finisher', 'الختام'], 'rounds', { rounds: 2, note: ['Rest 30 s between rounds', 'راحة 30 ث بين الجولات'] }, [
        item('side_plank', perSide(secs(30))),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'horse_riding-inner-thighs', level: 'intermediate', format: 'strength', minutes: 35, equipment: ['bench', 'dumbbells'],
    title: ['Strong Inner Thighs', 'فخذان داخليتان قويتان'],
    desc: ['Inner thighs and hips that keep your leg on without gripping with the knee.', 'فخذان داخليتان ووركان يثبّتون ساقك على الحصان دون أن تشدّ بالركبة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('march', mins(1)), item('hip_openers', perSide(['6', '6'])), item('lateral_lunge', perSide(['6', '6']))]),
      block(MAIN, 'strength', {}, [
        item('copenhagen_plank', sets(3, '20 s / side'), ['Knee on the bench if needed · rest 45 s', 'الركبة على المقعد إن احتجت · راحة 45 ث']),
        item('lateral_lunge', sets(3, '10 / side'), ['Dumbbell at the chest · rest 60 s', 'دمبل عند الصدر · راحة 60 ث']),
        item('bulgarian_split_squat', sets(3, '8 / side'), ['2 reps left in the tank · rest 90 s', 'اترك تكرارين · راحة 90 ث']),
        item('glute_bridge', sets(3, '15'), ['Pause 2 s at the top · rest 45 s', 'توقف 2 ث في الأعلى · راحة 45 ث']),
      ]),
      block(COOL, 'flow', { minutes: 5 }, [item('figure_four_stretch', perSide(secs(45))), item('hip_flexor_stretch', perSide(secs(45))), item('hamstring_stretch', perSide(secs(30)))]),
    ],
  },
  {
    key: 'horse_riding-one-leg-balance', level: 'intermediate', format: 'rounds', minutes: 30, equipment: ['dumbbells', 'kettlebell'],
    title: ['One-Leg Balance', 'التوازن على رجل واحدة'],
    desc: ['Balance and even strength left and right, so you sit square and stay centred when the horse shifts.', 'توازن وقوة متساوية يمينًا ويسارًا لتجلس معتدلًا وتبقى في المنتصف حين يتحرك الحصان.'],
    blocks: [
      warmLegs(5),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('single_leg_rdl', perSide(['8', '8']), ['Hips level, move slowly', 'الوركان في مستوى واحد، تحرّك ببطء']),
        item('single_leg_calf_raise', perSide(['12', '12'])),
        item('reverse_lunge', perSide(['8', '8'])),
        item('suitcase_carry', perSide(meters(20)), ['Stay tall, do not lean', 'ابقَ مستقيمًا ولا تمِل']),
        item('bird_dog', perSide(['8', '8'])),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'horse_riding-hips-for-the-saddle', level: 'intermediate', format: 'rounds', minutes: 25, equipment: [],
    title: ['Hips for the Saddle', 'وركان للسرج'],
    desc: ['Open hips let your legs drape around the horse. Active mobility, best before you ride.', 'الوركان المرنان يتركان ساقيك تلتفّان حول الحصان. مرونة نشطة، الأفضل قبل الركوب.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('march', mins(1)), item('cat_cow', reps('8')), item('leg_swings', perSide(['8', '8']))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Move slowly through the full range', 'تحرّك ببطء في المدى الكامل'] }, [
        item('worlds_greatest_stretch', perSide(['3', '3'])),
        item('hip_openers', perSide(['8', '8'])),
        item('lateral_lunge', perSide(['6', '6']), ['Sit deep into the hip, chest up', 'انزل بعمق في الورك والصدر مرفوع']),
        item('thoracic_rotation', perSide(['6', '6'])),
      ]),
      coolHips,
    ],
  },

  // ───── Advanced ─────
  {
    key: 'horse_riding-long-ride-engine', level: 'advanced', format: 'steady', minutes: 55, equipment: [],
    title: ['Long Ride Engine', 'لياقة الركوب الطويل'],
    desc: ['Aerobic base for long rides and endurance days, then core work while you are tired.', 'قاعدة هوائية للركوب الطويل وأيام التحمّل، ثم تمارين للجذع وأنت متعب.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('walk', mins(3)), item('leg_swings', perSide(['10', '10'])), item('skips', meters(20))]),
      block(MAIN, 'steady', { note: ['Easy enough to talk in full sentences', 'سرعة مريحة تسمح لك بالكلام بجمل كاملة'] }, [
        item('easy_jog', mins(35)),
      ]),
      block(['Posture when tired', 'القوام مع التعب'], 'rounds', { rounds: 2, note: ['Rest 30 s between rounds', 'راحة 30 ث بين الجولات'] }, [
        item('plank', secs(45)),
        item('side_plank', perSide(secs(30))),
        item('dead_bug', perSide(['8', '8'])),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'horse_riding-rider-strength', level: 'advanced', format: 'strength', minutes: 55, equipment: ['barbell', 'bench', 'dumbbells', 'cable'],
    title: ['Rider Strength Day', 'يوم القوة للفارس'],
    desc: ['Heavy hips, single-leg strength and a strong upper back: the base for a secure seat and steady hands.', 'وركان بأوزان ثقيلة وقوة الساق الواحدة وظهر علوي قوي: الأساس لجلوس ثابت ويدين هادئتين.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('jumping_jack', secs(45)), item('hip_hinge', reps('10')), item('inchworm', reps('5')), item('glute_bridge', reps('10'))]),
      block(MAIN, 'strength', {}, [
        item('hip_thrust', sets(4, '8'), ['1–2 reps left in the tank · rest 2 min', 'اترك تكرارًا أو اثنين · راحة 2 د']),
        item('bulgarian_split_squat', sets(3, '8 / side'), ['Rest 90 s', 'راحة 90 ث']),
        item('barbell_row', sets(4, '8'), ['Flat back · rest 90 s', 'ظهر مستقيم · راحة 90 ث']),
        item('face_pull', sets(3, '15'), ['Light, elbows high · rest 60 s', 'وزن خفيف والمرفقان عاليان · راحة 60 ث']),
      ]),
      block(['Finisher', 'الختام'], 'rounds', { rounds: 3, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('side_plank', perSide(secs(30))),
        item('dead_bug', perSide(['8', '8']), ['Slow, lower back down', 'ببطء وأسفل الظهر ملاصق للأرض']),
      ]),
      block(COOL, 'flow', { minutes: 5 }, [item('hip_flexor_stretch', perSide(secs(45))), item('chest_stretch', secs(30)), item('figure_four_stretch', perSide(secs(30)))]),
    ],
  },
  {
    key: 'horse_riding-cross-country', level: 'advanced', format: 'emom', minutes: 35, equipment: ['rower'],
    title: ['Cross-Country Conditioning', 'لياقة اختراق الضاحية'],
    desc: ['Twenty minutes for event days: hold your position and your core while your lungs work hard.', 'عشرون دقيقة لأيام المسابقات: حافظ على وضعيتك وثبات جذعك ورئتاك تعملان بقوة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 7 }, [item('rower', mins(3)), item('leg_swings', perSide(['10', '10'])), item('air_squat', reps('10')), item('arm_circles', secs(30))]),
      block(MAIN, 'emom', { minutes: 20, note: ['Finish the work, rest what is left of the minute', 'أنهِ الحركة وارتح ما تبقّى من الدقيقة'] }, [
        item('rower', secs(40)),
        item('wall_sit', secs(45), null, halfSeat),
        item('mountain_climber', secs(30)),
        item('lateral_lunge', perSide(['8', '8'])),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'horse_riding-rock-steady-core', level: 'advanced', format: 'rounds', minutes: 40, equipment: ['bench', 'band', 'kettlebell'],
    title: ['Rock-Steady Core', 'جذع ثابت كالصخر'],
    desc: ['Hard core and inner-thigh work for a seat that does not move when the horse does.', 'تمارين صعبة للجذع والفخذين الداخليتين لجلوس لا يتزحزح حين يتحرك الحصان.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('cat_cow', reps('8')), item('dead_bug', perSide(['6', '6'])), item('bird_dog', perSide(['6', '6']))]),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('hollow_hold', secs(30)),
        item('pallof_press', perSide(['10', '10'])),
        item('copenhagen_plank', perSide(secs(20))),
        item('side_plank', perSide(secs(40))),
        item('suitcase_carry', perSide(meters(30)), ['Stay tall, do not lean', 'ابقَ مستقيمًا ولا تمِل']),
      ]),
      coolHips,
    ],
  },
];
