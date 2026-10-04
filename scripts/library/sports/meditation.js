// Meditation: calm, low-effort sessions that pair slow breathing with gentle mobility, easy walks and
// long stretch holds. Levels get longer and stiller, not harder. 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, secs, mins, perSide, WARM, MAIN, COOL } = require('../kit');

const in4out6 = ['Breathe in for 4, out for 6', 'شهيق 4 وزفير 6'];
const in4out8 = ['Breathe in for 4, out for 8', 'شهيق 4 وزفير 8'];
const boxBreath = ['Box breathing: in 4, hold 4, out 4, hold 4', 'تنفّس مربّع: شهيق 4، حبس 4، زفير 4، حبس 4'];
const natural = ['Let the breath find its own pace', 'دع النَّفَس يجد إيقاعه بنفسه'];
const settle = (minutes = 3) => block(['Settle', 'الاستقرار'], 'flow', { minutes, note: in4out6 }, [
  item('neck_rolls', secs(45), ['Slow half circles', 'أنصاف دوائر بطيئة']),
  item('shoulder_rolls', secs(45)),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'meditation-desk-unwind', level: 'beginner', format: 'flow', minutes: 10, equipment: [],
    title: ['Desk Unwind', 'استرخاء المكتب'],
    desc: ['Ten quiet minutes to release the neck, shoulders and chest after screen time.', 'عشر دقائق هادئة لإرخاء الرقبة والكتفين والصدر بعد وقت الشاشة.'],
    blocks: [
      settle(3),
      block(['Release', 'الإرخاء'], 'flow', { minutes: 5, note: in4out6 }, [
        item('chest_stretch', secs(45), ['Soften the jaw', 'أرخِ الفك']),
        item('lat_stretch', perSide(secs(30))),
        item('standing_forward_fold', secs(45), ['Let the head hang heavy', 'دع رأسك يتدلّى بثقله']),
      ]),
      block(['Close', 'الختام'], 'flow', { minutes: 2, note: natural }, [item('neck_rolls', secs(60))]),
    ],
  },
  {
    key: 'meditation-morning-breath', level: 'beginner', format: 'flow', minutes: 12, equipment: [],
    title: ['Morning Breath', 'نَفَس الصباح'],
    desc: ['Wake up slowly: gentle movement timed with the breath to start the day clear and calm.', 'استيقظ ببطء: حركة لطيفة مع النَّفَس لتبدأ يومك بذهن صافٍ وهادئ.'],
    blocks: [
      block(['Wake', 'الاستيقاظ'], 'flow', { minutes: 3, note: in4out6 }, [item('march', mins(1), ['Easy pace', 'إيقاع هادئ']), item('arm_circles', secs(45))]),
      block(['Breathe and move', 'تنفّس وتحرّك'], 'flow', { minutes: 7, note: ['Inhale to open, exhale to fold', 'شهيق عند الانفتاح وزفير عند الانحناء'] }, [
        item('cat_cow', reps('8')),
        item('thoracic_rotation', perSide(['5', '5'])),
        item('childs_pose', mins(1)),
        item('standing_forward_fold', secs(45)),
      ]),
      block(['Close', 'الختام'], 'flow', { minutes: 2, note: natural }, [item('shoulder_rolls', secs(60))]),
    ],
  },
  {
    key: 'meditation-evening-wind-down', level: 'beginner', format: 'flow', minutes: 15, equipment: [],
    title: ['Evening Wind-Down', 'تهدئة المساء'],
    desc: ['Slow the body and mind before bed with soft floor stretches and long exhales.', 'هدّئ الجسم والذهن قبل النوم بإطالات ناعمة على الأرض وزفير طويل.'],
    blocks: [
      settle(3),
      block(['Unwind', 'الاسترخاء'], 'flow', { minutes: 10, note: in4out8 }, [
        item('cat_cow', reps('6'), ['Very slow', 'ببطء شديد']),
        item('childs_pose', mins(2)),
        item('figure_four_stretch', perSide(secs(60))),
        item('hamstring_stretch', perSide(secs(45))),
      ]),
      block(['Close', 'الختام'], 'flow', { minutes: 2, note: natural }, [item('childs_pose', mins(2))]),
    ],
  },
  {
    key: 'meditation-mindful-walk', level: 'beginner', format: 'steady', minutes: 15, equipment: [],
    title: ['Mindful Walk', 'مشي بوعي'],
    desc: ['An easy walk where you count your steps with your breath. Outside if you can.', 'مشي هادئ تعدّ فيه خطواتك مع نَفَسك. في الهواء الطلق إن أمكن.'],
    blocks: [
      settle(2),
      block(['Walk', 'المشي'], 'steady', { note: ['Breathe in for 4 steps, out for 6 steps', 'شهيق لـ 4 خطوات وزفير لـ 6 خطوات'] }, [
        item('walk', mins(10), ['Unhurried pace, notice your feet', 'إيقاع غير مستعجل، وانتبه لقدميك'], ['Easy walk', 'مشي هادئ']),
      ]),
      block(['Close', 'الختام'], 'flow', { minutes: 3, note: in4out6 }, [item('calf_stretch', perSide(secs(30))), item('standing_forward_fold', secs(45))]),
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'meditation-quiet-hips', level: 'intermediate', format: 'flow', minutes: 25, equipment: [],
    title: ['Quiet Hips', 'وركان هادئان'],
    desc: ['Long, still holds for the hips while the breath slows down. For those who sit a lot.', 'ثبات طويل وساكن للوركين بينما يهدأ النَّفَس. لمن يجلس كثيرًا.'],
    blocks: [
      settle(4),
      block(['Open', 'الانفتاح'], 'flow', { minutes: 17, note: in4out8 }, [
        item('hip_openers', perSide(['6', '6']), ['Slow circles', 'دوائر بطيئة']),
        item('hip_flexor_stretch', perSide(secs(90))),
        item('figure_four_stretch', perSide(secs(90))),
        item('childs_pose', mins(3)),
      ]),
      block(['Close', 'الختام'], 'flow', { minutes: 4, note: natural }, [item('childs_pose', mins(3))]),
    ],
  },
  {
    key: 'meditation-breath-ladder', level: 'intermediate', format: 'flow', minutes: 20, equipment: [],
    title: ['Breath Ladder', 'سُلّم النَّفَس'],
    desc: ['Lengthen the breath step by step, from easy breathing to slow box breathing, with gentle movement.', 'أطِل نَفَسك خطوة بخطوة، من التنفّس السهل إلى التنفّس المربّع البطيء، مع حركة لطيفة.'],
    blocks: [
      block(['Even breath', 'نَفَس متساوٍ'], 'flow', { minutes: 5, note: ['In for 4, out for 4', 'شهيق 4 وزفير 4'] }, [item('cat_cow', reps('8')), item('shoulder_rolls', secs(60))]),
      block(['Longer exhale', 'زفير أطول'], 'flow', { minutes: 6, note: in4out6 }, [item('thoracic_rotation', perSide(['5', '5'])), item('childs_pose', mins(2))]),
      block(['Box breath', 'التنفّس المربّع'], 'flow', { minutes: 7, note: boxBreath }, [item('standing_forward_fold', mins(1)), item('childs_pose', mins(3))]),
      block(['Close', 'الختام'], 'flow', { minutes: 2, note: natural }, [item('neck_rolls', secs(60))]),
    ],
  },
  {
    key: 'meditation-after-training', level: 'intermediate', format: 'flow', minutes: 25, equipment: [],
    title: ['After-Training Reset', 'استعادة بعد التمرين'],
    desc: ['Bring the heart rate down and let tired legs relax after a hard session.', 'أنزل نبض القلب ودع الساقين المتعبتين ترتاحان بعد جلسة قوية.'],
    blocks: [
      block(['Slow down', 'التباطؤ'], 'steady', { note: in4out6 }, [item('walk', mins(4), ['Slower every minute', 'أبطأ مع كل دقيقة'], ['Easy walk', 'مشي هادئ'])]),
      block(['Release', 'الإرخاء'], 'flow', { minutes: 16, note: in4out8 }, [
        item('quad_stretch', perSide(secs(45))),
        item('hamstring_stretch', perSide(secs(60))),
        item('calf_stretch', perSide(secs(45))),
        item('figure_four_stretch', perSide(secs(60))),
        item('childs_pose', mins(2)),
      ]),
      block(['Close', 'الختام'], 'flow', { minutes: 5, note: natural }, [item('childs_pose', mins(4))]),
    ],
  },
  {
    key: 'meditation-body-scan', level: 'intermediate', format: 'flow', minutes: 30, equipment: [],
    title: ['Slow Body Scan', 'تأمل الجسم ببطء'],
    desc: ['Move attention from head to feet, releasing each area with a gentle movement and a long hold.', 'انقل انتباهك من الرأس إلى القدمين، وأرخِ كل منطقة بحركة لطيفة وثبات طويل.'],
    blocks: [
      block(['Head and shoulders', 'الرأس والكتفان'], 'flow', { minutes: 6, note: in4out6 }, [item('neck_rolls', mins(1)), item('shoulder_rolls', mins(1)), item('chest_stretch', secs(60))]),
      block(['Back', 'الظهر'], 'flow', { minutes: 8, note: ['Exhale and let each part soften', 'ازفر ودع كل جزء يرتخي'] }, [
        item('cat_cow', reps('8')),
        item('thoracic_rotation', perSide(['5', '5'])),
        item('childs_pose', mins(3)),
      ]),
      block(['Hips and legs', 'الوركان والساقان'], 'flow', { minutes: 12, note: in4out8 }, [
        item('figure_four_stretch', perSide(secs(90))),
        item('hamstring_stretch', perSide(secs(60))),
        item('calf_stretch', perSide(secs(45))),
      ]),
      block(['Close', 'الختام'], 'flow', { minutes: 4, note: natural }, [item('childs_pose', mins(3))]),
    ],
  },

  // ───── Advanced ─────
  {
    key: 'meditation-long-stillness', level: 'advanced', format: 'flow', minutes: 40, equipment: [],
    title: ['Long Stillness', 'سكون طويل'],
    desc: ['Few movements, very long holds. A deep, quiet session for those used to sitting with the breath.', 'حركات قليلة وثبات طويل جدًا. جلسة عميقة وهادئة لمن اعتاد البقاء مع نَفَسه.'],
    blocks: [
      settle(5),
      block(['Stillness', 'السكون'], 'flow', { minutes: 30, note: in4out8 }, [
        item('childs_pose', mins(5)),
        item('figure_four_stretch', perSide(mins(3))),
        item('hamstring_stretch', perSide(mins(2))),
        item('standing_forward_fold', mins(3), ['Knees soft, head heavy', 'ركبتان مرنتان ورأس ثقيل']),
        item('hip_flexor_stretch', perSide(mins(2))),
      ]),
      block(['Close', 'الختام'], 'flow', { minutes: 5, note: natural }, [item('childs_pose', mins(5))]),
    ],
  },
  {
    key: 'meditation-long-quiet-walk', level: 'advanced', format: 'steady', minutes: 45, equipment: [],
    title: ['Long Quiet Walk', 'مشي طويل هادئ'],
    desc: ['Half an hour of unhurried walking with the breath, then long stretches and a quiet rest. No phone, no music.', 'نصف ساعة من المشي غير المستعجل مع النَّفَس، ثم إطالات طويلة وراحة هادئة. بلا هاتف ولا موسيقى.'],
    blocks: [
      settle(4),
      block(['Walk', 'المشي'], 'steady', { note: ['Breathe in for 4 steps, out for 6; return to the count when the mind wanders', 'شهيق لـ 4 خطوات وزفير لـ 6، وعُد إلى العدّ كلما شرد ذهنك'] }, [
        item('walk', mins(30), ['Unhurried, soft gaze ahead', 'دون استعجال، ونظرك هادئ إلى الأمام'], ['Easy walk', 'مشي هادئ']),
      ]),
      block(['Close', 'الختام'], 'flow', { minutes: 11, note: in4out8 }, [
        item('calf_stretch', perSide(secs(60))),
        item('standing_forward_fold', mins(2)),
        item('childs_pose', mins(5)),
      ]),
    ],
  },
  {
    key: 'meditation-full-release', level: 'advanced', format: 'flow', minutes: 50, equipment: [],
    title: ['Full Release', 'إرخاء كامل'],
    desc: ['A long, complete session: breath work, slow mobility head to toe, deep holds and a long rest.', 'جلسة طويلة وكاملة: تمارين تنفّس وحركة بطيئة من الرأس إلى القدم وثبات عميق وراحة طويلة.'],
    blocks: [
      block(['Breath', 'النَّفَس'], 'flow', { minutes: 8, note: boxBreath }, [item('neck_rolls', mins(1)), item('shoulder_rolls', mins(1)), item('childs_pose', mins(4))]),
      block(['Slow mobility', 'حركة بطيئة'], 'flow', { minutes: 12, note: in4out6 }, [
        item('cat_cow', reps('10')),
        item('thoracic_rotation', perSide(['6', '6'])),
        item('hip_openers', perSide(['6', '6'])),
        item('worlds_greatest_stretch', perSide(['3', '3']), ['Move at half speed', 'تحرّك بنصف السرعة']),
      ]),
      block(['Deep holds', 'ثبات عميق'], 'flow', { minutes: 22, note: in4out8 }, [
        item('hip_flexor_stretch', perSide(mins(2))),
        item('figure_four_stretch', perSide(mins(2))),
        item('hamstring_stretch', perSide(mins(2))),
        item('lat_stretch', perSide(secs(90))),
      ]),
      block(['Close', 'الختام'], 'flow', { minutes: 8, note: natural }, [item('childs_pose', mins(6))]),
    ],
  },
  {
    key: 'meditation-before-sleep', level: 'advanced', format: 'flow', minutes: 35, equipment: [],
    title: ['Before Sleep', 'قبل النوم'],
    desc: ['A slow, near-motionless routine for the last half hour of the day. Lights low, breath long.', 'روتين بطيء شبه ساكن لآخر نصف ساعة من اليوم. إضاءة خافتة ونَفَس طويل.'],
    blocks: [
      settle(4),
      block(['Let go', 'التخلّي'], 'flow', { minutes: 24, note: ['Breathe in for 4, hold 7, out for 8', 'شهيق 4، حبس 7، زفير 8'] }, [
        item('cat_cow', reps('6'), ['Slower than feels normal', 'أبطأ مما تعتاد']),
        item('childs_pose', mins(4)),
        item('figure_four_stretch', perSide(mins(3))),
        item('hamstring_stretch', perSide(mins(2))),
        item('childs_pose', mins(3)),
      ]),
      block(['Close', 'الختام'], 'flow', { minutes: 7, note: natural }, [item('childs_pose', mins(5))]),
    ],
  },
];
