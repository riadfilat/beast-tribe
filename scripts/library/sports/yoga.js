// Yoga: mobility and flexibility flows built from held positions and slow transitions, with steady
// breathing throughout. Harder levels hold longer and add strength holds. 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, secs, mins, perSide, WARM, MAIN, COOL } = require('../kit');

const breathe = ['Breathe slowly through the nose', 'تنفّس ببطء من الأنف'];
const arrive = (minutes = 3) => block(WARM, 'flow', { minutes, note: breathe }, [
  item('neck_rolls', secs(30)),
  item('shoulder_rolls', secs(30)),
  item('cat_cow', reps('8'), ['Move with the breath', 'تحرّك مع النَّفَس']),
]);
const rest = (minutes = 3) => block(COOL, 'flow', { minutes, note: ['Let the breath slow down', 'دع النَّفَس يهدأ'] }, [
  item('figure_four_stretch', perSide(secs(30))),
  item('childs_pose', mins(minutes > 4 ? 3 : 1)),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'yoga-morning-flow', level: 'beginner', format: 'flow', minutes: 15, equipment: [],
    title: ['Morning Flow', 'تدفّق الصباح'],
    desc: ['A gentle start to the day: wake up the spine, hips and legs with easy holds.', 'بداية لطيفة لليوم: أيقظ العمود الفقري والوركين والساقين بثبات سهل.'],
    blocks: [
      arrive(),
      block(MAIN, 'flow', { minutes: 9, note: ['Hold each position, never bounce', 'اثبت في كل وضعية ولا ترتدّ'] }, [
        item('childs_pose', secs(45)),
        item('thoracic_rotation', perSide(['5', '5'])),
        item('hip_flexor_stretch', perSide(secs(30))),
        item('standing_forward_fold', secs(30), ['Soft knees', 'ركبتان مرنتان']),
        item('lat_stretch', perSide(secs(30))),
      ]),
      rest(3),
    ],
  },
  {
    key: 'yoga-gentle-hips', level: 'beginner', format: 'rounds', minutes: 20, equipment: [],
    title: ['Gentle Hips', 'وركان مرتاحان'],
    desc: ['Softens tight hips from sitting. Easy holds, good for anyone new to yoga.', 'يليّن الوركين المشدودين من الجلوس. ثبات سهل يناسب كل من يبدأ اليوغا.'],
    blocks: [
      arrive(4),
      block(MAIN, 'rounds', { rounds: 2, note: ['Breathe in for 4, out for 6', 'شهيق 4 وزفير 6'] }, [
        item('hip_openers', perSide(['6', '6'])),
        item('hip_flexor_stretch', perSide(secs(40))),
        item('glute_bridge', reps('8'), ['Roll up and down slowly', 'ارفع وانزل ببطء']),
        item('figure_four_stretch', perSide(secs(40))),
      ]),
      block(COOL, 'flow', { minutes: 4 }, [item('hamstring_stretch', perSide(secs(30))), item('childs_pose', mins(1))]),
    ],
  },
  {
    key: 'yoga-spine-reset', level: 'beginner', format: 'flow', minutes: 15, equipment: [],
    title: ['Spine Reset', 'إعادة ضبط الظهر'],
    desc: ['Bend, twist and lengthen the back after a long day at a desk or in the car.', 'انحنِ والتفّ وأطِل ظهرك بعد يوم طويل على المكتب أو في السيارة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3, note: breathe }, [item('shoulder_rolls', secs(30)), item('neck_rolls', secs(30))]),
      block(MAIN, 'flow', { minutes: 9, note: ['Exhale as you twist or fold', 'ازفر عند الالتفاف أو الانحناء'] }, [
        item('cat_cow', reps('10')),
        item('bird_dog', perSide(['5', '5']), ['Reach long, hold 2 s', 'امتدّ بعيدًا واثبت ثانيتين']),
        item('thoracic_rotation', perSide(['6', '6'])),
        item('childs_pose', mins(1)),
        item('lat_stretch', perSide(secs(30))),
        item('standing_forward_fold', secs(30)),
      ]),
      block(COOL, 'flow', { minutes: 3 }, [item('childs_pose', mins(1)), item('figure_four_stretch', perSide(secs(30)))]),
    ],
  },
  {
    key: 'yoga-hamstring-release', level: 'beginner', format: 'rounds', minutes: 20, equipment: [],
    title: ['Hamstring Release', 'تحرير الفخذ الخلفية'],
    desc: ['Loosens the back of the legs so you can fold forward with ease. Slow and patient.', 'يُرخي الجهة الخلفية للساقين لتنحني للأمام براحة. ببطء وصبر.'],
    blocks: [
      arrive(4),
      block(MAIN, 'rounds', { rounds: 2, note: ['Ease deeper on each exhale', 'تعمّق قليلًا مع كل زفير'] }, [
        item('hip_hinge', reps('8')),
        item('hamstring_stretch', perSide(secs(45))),
        item('calf_stretch', perSide(secs(30))),
        item('standing_forward_fold', secs(45)),
        item('glute_bridge', reps('8')),
      ]),
      rest(4),
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'yoga-strength-flow', level: 'intermediate', format: 'rounds', minutes: 30, equipment: [],
    title: ['Strength Flow', 'تدفّق القوة'],
    desc: ['Holds that build strength as well as range: planks, bridges and long stretches in one flow.', 'ثبات يبني القوة والمرونة معًا: بلانك وجسور وإطالات طويلة في تدفّق واحد.'],
    blocks: [
      arrive(5),
      block(MAIN, 'rounds', { rounds: 3, note: ['Move slowly between positions, rest 30 s after each round', 'تنقّل ببطء بين الوضعيات، وراحة 30 ث بعد كل جولة'] }, [
        item('inchworm', reps('3')),
        item('plank', secs(45)),
        item('side_plank', perSide(secs(30))),
        item('worlds_greatest_stretch', perSide(['3', '3'])),
        item('glute_bridge', reps('10'), ['Hold 3 s at the top', 'اثبت 3 ث في الأعلى']),
      ]),
      rest(5),
    ],
  },
  {
    key: 'yoga-deep-hips', level: 'intermediate', format: 'flow', minutes: 30, equipment: [],
    title: ['Deep Hip Opener', 'فتح عميق للوركين'],
    desc: ['Longer holds that reach deep into the hips and groin. For people who already stretch regularly.', 'ثبات أطول يصل إلى عمق الوركين. لمن يمارس الإطالة بانتظام.'],
    blocks: [
      arrive(5),
      block(MAIN, 'flow', { minutes: 20, note: ['Breathe in for 4, out for 6; relax into each hold', 'شهيق 4 وزفير 6، واسترخِ في كل ثبات'] }, [
        item('hip_openers', perSide(['8', '8'])),
        item('worlds_greatest_stretch', perSide(['5', '5'])),
        item('lateral_lunge', perSide(['5', '5']), ['Slow, sink and hold 2 s', 'ببطء، انزل واثبت ثانيتين']),
        item('hip_flexor_stretch', perSide(secs(60))),
        item('figure_four_stretch', perSide(secs(90))),
        item('childs_pose', mins(2)),
      ]),
      block(COOL, 'flow', { minutes: 4 }, [item('hamstring_stretch', perSide(secs(45))), item('standing_forward_fold', secs(45))]),
    ],
  },
  {
    key: 'yoga-open-shoulders', level: 'intermediate', format: 'flow', minutes: 25, equipment: [],
    title: ['Open Shoulders', 'كتفان منفتحان'],
    desc: ['Opens the chest, upper back and shoulders that close up from phones and desks.', 'يفتح الصدر وأعلى الظهر والكتفين التي تنغلق من الهاتف والمكتب.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4, note: breathe }, [item('arm_circles', reps('10')), item('shoulder_rolls', secs(30)), item('cat_cow', reps('8'))]),
      block(MAIN, 'flow', { minutes: 16, note: ['Let the shoulders drop away from the ears', 'أنزل كتفيك بعيدًا عن أذنيك'] }, [
        item('thoracic_rotation', perSide(['8', '8'])),
        item('chest_stretch', secs(60)),
        item('lat_stretch', perSide(secs(45))),
        item('inchworm', reps('4')),
        item('plank', secs(40)),
        item('childs_pose', mins(1), ['Walk the hands forward', 'مدّ يديك للأمام']),
        item('chest_stretch', secs(60)),
      ]),
      block(COOL, 'flow', { minutes: 4 }, [item('neck_rolls', secs(45)), item('childs_pose', mins(2))]),
    ],
  },
  {
    key: 'yoga-slow-body-flow', level: 'intermediate', format: 'rounds', minutes: 35, equipment: [],
    title: ['Slow Body Flow', 'تدفّق بطيء للجسم'],
    desc: ['One continuous sequence repeated five times, linking breath to movement head to toe.', 'سلسلة متصلة تتكرر خمس مرات، تربط النَّفَس بالحركة من الرأس إلى القدم.'],
    blocks: [
      arrive(4),
      block(MAIN, 'rounds', { rounds: 5, note: ['One breath per movement, no rest between rounds', 'نَفَس واحد لكل حركة، بلا راحة بين الجولات'] }, [
        item('standing_forward_fold', secs(30)),
        item('inchworm', reps('2')),
        item('plank', secs(30)),
        item('cat_cow', reps('5')),
        item('childs_pose', secs(30)),
        item('worlds_greatest_stretch', perSide(['2', '2'])),
      ]),
      rest(5),
    ],
  },

  // ───── Advanced ─────
  {
    key: 'yoga-long-hold-practice', level: 'advanced', format: 'flow', minutes: 45, equipment: [],
    title: ['Long Hold Practice', 'ممارسة الثبات الطويل'],
    desc: ['Two-minute holds that ask for patience and calm. For experienced practitioners chasing real range.', 'ثبات لدقيقتين يتطلب صبرًا وهدوءًا. للممارسين المتمرسين الذين يسعون لمرونة حقيقية.'],
    blocks: [
      arrive(6),
      block(MAIN, 'flow', { minutes: 33, note: ['Breathe in for 4, out for 8; stay still', 'شهيق 4 وزفير 8، وابقَ ساكنًا'] }, [
        item('worlds_greatest_stretch', perSide(['4', '4'])),
        item('hip_flexor_stretch', perSide(mins(2))),
        item('figure_four_stretch', perSide(mins(2))),
        item('hamstring_stretch', perSide(mins(2))),
        item('standing_forward_fold', mins(2)),
        item('lat_stretch', perSide(mins(1))),
        item('childs_pose', mins(3)),
      ]),
      block(COOL, 'flow', { minutes: 6, note: ['Natural breath, eyes closed', 'تنفّس طبيعي وعينان مغمضتان'] }, [item('cat_cow', reps('6')), item('childs_pose', mins(4))]),
    ],
  },
  {
    key: 'yoga-power-flow', level: 'advanced', format: 'rounds', minutes: 45, equipment: [],
    title: ['Power Flow', 'تدفّق القوة العالية'],
    desc: ['Demanding strength holds woven into a flow. Long planks and side planks, steady breath throughout.', 'ثبات قوة صعب منسوج في تدفّق واحد. بلانك طويل وبلانك جانبي ونَفَس ثابت طوال الوقت.'],
    blocks: [
      arrive(6),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 45 s between rounds; keep breathing in every hold', 'راحة 45 ث بين الجولات، واستمر بالتنفّس في كل ثبات'] }, [
        item('inchworm', reps('4')),
        item('plank', secs(60)),
        item('side_plank', perSide(secs(45))),
        item('hollow_hold', secs(30)),
        item('worlds_greatest_stretch', perSide(['3', '3'])),
        item('wall_sit', secs(60)),
      ]),
      rest(6),
    ],
  },
  {
    key: 'yoga-core-and-control', level: 'advanced', format: 'rounds', minutes: 35, equipment: ['bench'],
    title: ['Core and Control', 'الجذع والتحكم'],
    desc: ['Slow, precise core holds that demand balance and control. Every rep is deliberate.', 'ثبات بطيء ودقيق للجذع يتطلب توازنًا وتحكمًا. كل تكرار مقصود.'],
    blocks: [
      arrive(5),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('bird_dog', perSide(['6', '6']), ['Hold 3 s at full reach', 'اثبت 3 ث عند أقصى امتداد']),
        item('dead_bug', perSide(['6', '6']), ['Exhale fully as you reach', 'ازفر بالكامل عند الامتداد']),
        item('hollow_hold', secs(40)),
        item('copenhagen_plank', perSide(secs(20))),
        item('side_plank', perSide(secs(40))),
      ]),
      rest(5),
    ],
  },
  {
    key: 'yoga-full-practice', level: 'advanced', format: 'flow', minutes: 60, equipment: [],
    title: ['Full Practice', 'الممارسة الكاملة'],
    desc: ['A full hour: standing flow, strength holds, deep floor stretches and a long rest at the end.', 'ساعة كاملة: تدفّق وقوفًا وثبات قوة وإطالات عميقة على الأرض وراحة طويلة في الختام.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8, note: breathe }, [
        item('neck_rolls', secs(45)), item('shoulder_rolls', secs(45)), item('cat_cow', reps('10')), item('thoracic_rotation', perSide(['6', '6'])),
      ]),
      block(['Standing flow', 'تدفّق وقوفًا'], 'rounds', { rounds: 3, note: ['One breath per movement', 'نَفَس واحد لكل حركة'] }, [
        item('standing_forward_fold', secs(30)),
        item('inchworm', reps('3')),
        item('plank', secs(45)),
        item('worlds_greatest_stretch', perSide(['3', '3'])),
        item('lateral_lunge', perSide(['4', '4'])),
      ]),
      block(['Strength holds', 'ثبات القوة'], 'rounds', { rounds: 2, note: ['Rest 30 s between rounds', 'راحة 30 ث بين الجولات'] }, [
        item('side_plank', perSide(secs(45))),
        item('hollow_hold', secs(30)),
        item('glute_bridge', reps('10'), ['Hold 3 s at the top', 'اثبت 3 ث في الأعلى']),
      ]),
      block(['Floor', 'على الأرض'], 'flow', { minutes: 16, note: ['Breathe in for 4, out for 6', 'شهيق 4 وزفير 6'] }, [
        item('hip_flexor_stretch', perSide(secs(90))),
        item('figure_four_stretch', perSide(secs(90))),
        item('hamstring_stretch', perSide(secs(90))),
        item('lat_stretch', perSide(secs(60))),
      ]),
      block(COOL, 'flow', { minutes: 7, note: ['Natural breath, let the body go heavy', 'تنفّس طبيعي ودع جسمك يرتخي'] }, [item('childs_pose', mins(5))]),
    ],
  },
];
