// Walking: brisk walks for the heart, hills for the legs, simple strength for everyday life, and gentle
// mobility for recovery. Kept accessible at every level. 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, sets, secs, mins, meters, perSide, WARM, MAIN, COOL } = require('../kit');

const EASY = ['Easy walk', 'مشي هادئ'];
const DOWN = ['Easy walk down', 'مشي هادئ نزولًا'];
const FAST = ['Fast walk', 'مشي سريع جدًا'];
const warmWalk = (minutes = 4) => block(WARM, 'flow', { minutes }, [
  item('walk', mins(minutes - 2), null, EASY),
  item('leg_swings', perSide(['8', '8'])),
  item('arm_circles', secs(30)),
]);
const coolWalk = block(COOL, 'flow', { minutes: 4 }, [
  item('calf_stretch', perSide(secs(30))),
  item('quad_stretch', perSide(secs(30))),
  item('hamstring_stretch', perSide(secs(30))),
]);
const coolHills = block(COOL, 'flow', { minutes: 5 }, [
  item('calf_stretch', perSide(secs(30))),
  item('quad_stretch', perSide(secs(30))),
  item('hamstring_stretch', perSide(secs(30))),
  item('hip_flexor_stretch', perSide(secs(30))),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'walking-daily-walk', level: 'beginner', format: 'steady', minutes: 22, equipment: [],
    title: ['Daily Walk', 'مشية يومية'],
    desc: ['A gentle start: fifteen minutes at a pace that warms you up but still lets you chat. Good for any day.', 'بداية لطيفة: خمس عشرة دقيقة بسرعة تدفئك وتسمح لك بالحديث. مناسبة لأي يوم.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('march', mins(1)), item('leg_swings', perSide(['8', '8'])), item('arm_circles', secs(30))]),
      block(MAIN, 'steady', {}, [
        item('walk', mins(15), ['Start easy, then walk a little faster for the last five minutes', 'ابدأ بهدوء ثم أسرع قليلًا في آخر خمس دقائق'], ['Walk', 'مشي']),
      ]),
      coolWalk,
    ],
  },
  {
    key: 'walking-brisk-bursts', level: 'beginner', format: 'intervals', minutes: 26, equipment: [],
    title: ['Brisk Bursts', 'دفعات المشي السريع'],
    desc: ['Short spells of faster walking lift your heart rate and fitness, with easy walking in between.', 'فترات قصيرة من المشي الأسرع ترفع نبضك ولياقتك، يتخللها مشي هادئ.'],
    blocks: [
      warmWalk(),
      block(MAIN, 'intervals', { rounds: 6, note: ['Brisk: breathing harder, but you can still talk', 'سريع: تنفّس أعمق مع قدرتك على الكلام'] }, [
        item('walk', mins(1)),
        item('walk', mins(2), null, EASY),
      ]),
      coolWalk,
    ],
  },
  {
    key: 'walking-walk-and-strength', level: 'beginner', format: 'rounds', minutes: 25, equipment: ['bench'],
    title: ['Walk and Strength', 'مشي وقوة'],
    desc: ['Walking mixed with simple strength moves for legs and arms. A sturdy chair or bench is all you need.', 'مشي ممزوج بحركات قوة بسيطة للساقين والذراعين. يكفيك كرسي متين أو مقعد.'],
    blocks: [
      warmWalk(),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest as long as you need between moves', 'ارتح قدر حاجتك بين الحركات'] }, [
        item('walk', mins(3)),
        item('box_squat', reps('10'), ['Sit down slowly, stand up tall', 'اجلس ببطء وقف مستقيمًا']),
        item('incline_push_up', reps('8'), ['Hands on the chair or bench', 'اليدان على الكرسي أو المقعد']),
        item('calf_raise', reps('12'), ['Hold the chair for balance', 'امسك الكرسي للتوازن']),
      ]),
      block(COOL, 'flow', { minutes: 4 }, [
        item('quad_stretch', perSide(secs(30))),
        item('calf_stretch', perSide(secs(30))),
        item('chest_stretch', secs(30)),
      ]),
    ],
  },
  {
    key: 'walking-easy-joints', level: 'beginner', format: 'flow', minutes: 15, equipment: [],
    title: ['Easy Joints', 'مفاصل مرنة'],
    desc: ['Gentle mobility for the ankles, hips, back and neck. For a recovery day or a slow morning start.', 'مرونة لطيفة للكاحلين والوركين والظهر والرقبة. ليوم الاستشفاء أو لبداية صباح هادئة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('march', mins(1)), item('shoulder_rolls', secs(30)), item('neck_rolls', secs(30))]),
      block(MAIN, 'flow', { rounds: 2, note: ['Small, comfortable ranges; never force a stretch', 'مدى صغير ومريح، ولا تجبر نفسك على الإطالة'] }, [
        item('ankle_mobility', perSide(['8', '8'])),
        item('hip_openers', perSide(['6', '6'])),
        item('leg_swings', perSide(['8', '8'])),
        item('cat_cow', reps('8')),
        item('thoracic_rotation', perSide(['6', '6'])),
      ]),
      block(COOL, 'flow', { minutes: 3 }, [
        item('chest_stretch', secs(30)),
        item('calf_stretch', perSide(secs(30))),
        item('standing_forward_fold', secs(30)),
      ]),
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'walking-hill-walk', level: 'intermediate', format: 'intervals', minutes: 34, equipment: [],
    title: ['Hill Walk', 'المشي على التل'],
    desc: ['Walking uphill works the glutes and calves and raises the effort without running. Use a hill, a ramp or a treadmill incline.', 'المشي صعودًا يقوّي الأرداف والسمانة ويرفع الجهد دون جري. استخدم تلًّا أو منحدرًا أو ميل جهاز المشي.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('walk', mins(3), null, EASY), item('leg_swings', perSide(['8', '8'])), item('ankle_mobility', perSide(['8', '8']))]),
      block(MAIN, 'intervals', { rounds: 6, note: ['Lean slightly forward from the ankles and keep steps short', 'مِل قليلًا للأمام من الكاحلين، وأبقِ خطواتك قصيرة'] }, [
        item('walk', mins(2), null, ['Uphill walk', 'مشي صعودًا']),
        item('walk', mins(2), null, DOWN),
      ]),
      coolHills,
    ],
  },
  {
    key: 'walking-long-brisk', level: 'intermediate', format: 'steady', minutes: 40, equipment: [],
    title: ['Long Brisk Walk', 'مشية سريعة طويلة'],
    desc: ['Thirty minutes of steady brisk walking to build endurance. Keep the pace even from start to finish.', 'ثلاثون دقيقة من المشي السريع الثابت لبناء التحمل. حافظ على سرعة متساوية من البداية إلى النهاية.'],
    blocks: [
      warmWalk(5),
      block(MAIN, 'steady', {}, [
        item('walk', mins(30), ['Swing your arms, land on the heel and roll through to the toes', 'حرّك ذراعيك، والمس الأرض بالكعب ثم انتقل إلى أصابع القدم']),
      ]),
      coolHills,
    ],
  },
  {
    key: 'walking-walk-circuit', level: 'intermediate', format: 'rounds', minutes: 40, equipment: ['bench'],
    title: ['Walk Circuit', 'دائرة المشي'],
    desc: ['Brisk walking broken up by lunges, push-ups and a plank. Builds fitness and full-body strength in one session.', 'مشي سريع تتخلله حركات الطعن والضغط والبلانك. يبني اللياقة وقوة الجسم كله في جلسة واحدة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('walk', mins(2), null, EASY), item('leg_swings', perSide(['8', '8'])), item('reverse_lunge', perSide(['5', '5'])), item('arm_circles', secs(30))]),
      block(MAIN, 'rounds', { rounds: 4, note: ['Go straight from the walk into the moves; rest 30 s after the plank', 'انتقل مباشرة من المشي إلى الحركات، وارتح 30 ث بعد البلانك'] }, [
        item('walk', mins(4)),
        item('reverse_lunge', perSide(['10', '10'])),
        item('incline_push_up', reps('12')),
        item('glute_bridge', reps('15')),
        item('plank', secs(30)),
      ]),
      block(COOL, 'flow', { minutes: 5 }, [
        item('quad_stretch', perSide(secs(30))),
        item('hamstring_stretch', perSide(secs(30))),
        item('hip_flexor_stretch', perSide(secs(30))),
        item('chest_stretch', secs(30)),
      ]),
    ],
  },
  {
    key: 'walking-legs-and-posture', level: 'intermediate', format: 'strength', minutes: 32, equipment: ['box', 'kettlebell', 'band'],
    title: ['Legs and Posture', 'الساقان والقوام'],
    desc: ['Stronger legs for hills and stairs, and an upper back that keeps you walking tall.', 'ساقان أقوى للتلال والدرج، وظهر علوي يُبقيك منتصب القامة أثناء المشي.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('march', mins(1)), item('hip_hinge', reps('10')), item('band_pull_apart', reps('10')), item('split_squat', perSide(['5', '5']))]),
      block(MAIN, 'strength', {}, [
        item('step_up', sets(3, '10 / side'), ['Rest 60 s', 'راحة 60 ث']),
        item('kettlebell_deadlift', sets(3, '10'), ['Flat back, push the hips back · rest 75 s', 'ظهر مستقيم وادفع الوركين للخلف · راحة 75 ث']),
        item('split_squat', sets(3, '8 / side'), ['Rest 60 s', 'راحة 60 ث']),
        item('band_pull_apart', sets(3, '15'), ['Squeeze the shoulder blades · rest 30 s', 'اضغط لوحي الكتف معًا · راحة 30 ث']),
        item('single_leg_calf_raise', sets(3, '10 / side'), ['Rest 30 s', 'راحة 30 ث']),
      ]),
      block(COOL, 'flow', { minutes: 4 }, [
        item('quad_stretch', perSide(secs(30))),
        item('hamstring_stretch', perSide(secs(30))),
        item('chest_stretch', secs(30)),
      ]),
    ],
  },

  // ───── Advanced ─────
  {
    key: 'walking-hill-climb', level: 'advanced', format: 'intervals', minutes: 48, equipment: [],
    title: ['Hill Climb Intervals', 'فترات صعود التل'],
    desc: ['Longer, faster climbs with short recoveries. For experienced walkers who want a real cardio challenge without running.', 'صعود أطول وأسرع مع استشفاء قصير. للمشّائين المتمرسين الذين يريدون تحديًا هوائيًا حقيقيًا دون جري.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('walk', mins(4), null, EASY), item('leg_swings', perSide(['8', '8'])), item('ankle_mobility', perSide(['8', '8']))]),
      block(MAIN, 'intervals', { rounds: 8, note: ['Push the pace on the climb until talking gets hard', 'زِد السرعة في الصعود حتى يصعب الكلام'] }, [
        item('walk', mins(3), null, ['Fast uphill walk', 'مشي سريع صعودًا']),
        item('walk', secs(90), null, DOWN),
      ]),
      coolHills,
    ],
  },
  {
    key: 'walking-long-walk', level: 'advanced', format: 'steady', minutes: 60, equipment: [],
    title: ['Long Walk', 'المشية الطويلة'],
    desc: ['Fifty minutes on your feet at a brisk, even pace. Builds the stamina for long walking events.', 'خمسون دقيقة على قدميك بسرعة نشطة وثابتة. تبني قدرة التحمل لفعاليات المشي الطويلة.'],
    blocks: [
      warmWalk(5),
      block(MAIN, 'steady', {}, [
        item('walk', mins(50), ['Drink water every 15 minutes, especially in the heat', 'اشرب الماء كل 15 دقيقة، خاصة في الحر']),
      ]),
      coolHills,
    ],
  },
  {
    key: 'walking-pace-pyramid', level: 'advanced', format: 'intervals', minutes: 38, equipment: [],
    title: ['Pace Pyramid', 'هرم السرعة'],
    desc: ['Fast walking that builds from one to three minutes and back down. Trains you to hold a quicker pace for longer.', 'مشي سريع يتدرّج من دقيقة إلى ثلاث دقائق ثم ينزل. يدرّبك على الحفاظ على سرعة أعلى لفترة أطول.'],
    blocks: [
      warmWalk(5),
      block(MAIN, 'intervals', { rounds: 2, note: ['Fast: as quick as you can walk without breaking into a run', 'سريع: أسرع ما تستطيع مشيًا دون أن تجري'] }, [
        item('walk', mins(1), null, FAST),
        item('walk', mins(1), null, EASY),
        item('walk', mins(2), null, FAST),
        item('walk', mins(1), null, EASY),
        item('walk', mins(3), null, FAST),
        item('walk', mins(1), null, EASY),
        item('walk', mins(2), null, FAST),
        item('walk', mins(1), null, EASY),
        item('walk', mins(1), null, FAST),
        item('walk', mins(1), null, EASY),
      ]),
      coolWalk,
    ],
  },
  {
    key: 'walking-walking-challenge', level: 'advanced', format: 'for_time', minutes: 45, equipment: [],
    title: ['Walking Challenge', 'تحدّي المشي'],
    desc: ['Three rounds of fast walking and strength moves against the clock. A full-body test for fit walkers.', 'ثلاث جولات من المشي السريع وحركات القوة ضد الوقت. اختبار للجسم كله للمشّائين المتمرسين.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('walk', mins(3), null, EASY), item('leg_swings', perSide(['8', '8'])), item('air_squat', reps('10')), item('walking_lunge', perSide(['5', '5']))]),
      block(['For time', 'ضد الوقت'], 'for_time', { minutes: 35, rounds: 3, note: ['3 rounds, 35 min cap. Walk only, no running. Write down your time.', '3 جولات، الحد 35 د. مشي فقط بلا جري. سجّل وقتك.'] }, [
        item('walk', meters(800), null, FAST),
        item('walking_lunge', perSide(['12', '12'])),
        item('push_up', reps('10'), ['Body in one straight line', 'الجسم في خط مستقيم واحد']),
        item('air_squat', reps('20')),
      ]),
      block(COOL, 'flow', { minutes: 5 }, [
        item('quad_stretch', perSide(secs(30))),
        item('hamstring_stretch', perSide(secs(30))),
        item('hip_flexor_stretch', perSide(secs(30))),
        item('chest_stretch', secs(30)),
      ]),
    ],
  },
];
