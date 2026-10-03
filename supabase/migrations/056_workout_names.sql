-- 056 Workout names
-- The twelve Operation Beast library workouts (migration 040) were named before the exercise
-- library existed, so the same move had two Arabic names and a few titles were mistranslated
-- ("Engine" as a motor, "Core" as a ball) or carried a number that was not the workout's length.
-- One vocabulary everywhere: سكوات, طعن, الرفعة الميتة, سحب, كيتل بل, شريط المقاومة, إطالة.
-- Plan workouts and the exercise library are regenerated from scripts/programs and scripts/exercises.

-- ── Titles and descriptions ──
UPDATE workouts w SET title = v.title, title_ar = v.title_ar
FROM (VALUES
  ('Engine 20',               'Hyrox Engine',            'تحمّل هايروكس'),
  ('No-Kit 15',               'No-Kit Circuit',          'دائرة بدون معدات'),
  ('Dawn 5K Builder',         'Dawn 5K Builder',         'جري الفجر: استعداد لـ 5 كم'),
  ('Desk Reset 10',           'Desk Reset 10',           'إطالات المكتب 10'),
  ('Football Engine',         'Football Engine',         'لياقة كرة القدم'),
  ('Padel Legs',              'Padel Legs',              'تقوية الأرجل للبادل'),
  ('Partner Core',            'Partner Core',            'تمرين البطن مع شريك'),
  ('Recovery Walk & Stretch', 'Recovery Walk & Stretch', 'مشي وإطالة للاستشفاء'),
  ('Run & Wall Balls',        'Run & Wall Balls',        'جري ورمي الكرة على الحائط'),
  ('Squat & Press',           'Squat & Press',           'سكوات ودفع فوق الرأس')
) AS v(old, title, title_ar)
WHERE w.source = 'library' AND NOT w.program_only AND w.title = v.old;

UPDATE workouts SET
  description = 'You go, I go. One works while the other rests. Bring a friend.',
  description_ar = 'أنت ثم أنا. واحد يتمرن والآخر يرتاح. أحضر صديقًا.'
WHERE source = 'library' AND NOT program_only AND title = 'Partner Core';

UPDATE workouts SET
  description = 'No equipment, anywhere. A new move every minute for fifteen minutes, three times through.',
  description_ar = 'بلا معدات وفي أي مكان. حركة جديدة مع بداية كل دقيقة لمدة خمس عشرة دقيقة، ثلاث مرات.'
WHERE source = 'library' AND NOT program_only AND title = 'No-Kit Circuit';

-- ── Moves and block titles inside the workouts ──
CREATE TEMP TABLE _move_ar (en TEXT PRIMARY KEY, ar TEXT NOT NULL) ON COMMIT DROP;
INSERT INTO _move_ar VALUES
  ('Jumping jacks', 'جامبينغ جاك'), ('Inchworms', 'مشية الدودة'), ('Burpees', 'بيربي'),
  ('Comfortably hard', 'جري بجهد مرتفع مريح'), ('Neck rolls', 'تدوير الرقبة'), ('Shoulder rolls', 'تدوير الكتفين'),
  ('Standing forward fold', 'الانحناء للأمام وقوفًا'), ('Chest opener at the desk', 'فتح الصدر عند المكتب'),
  ('Kettlebell deadlifts', 'الرفعة الميتة بالكيتل بل'), ('Wall balls', 'رمي الكرة على الحائط'),
  ('Wall balls (light)', 'رمي الكرة على الحائط (كرة خفيفة)'), ('High knees', 'رفع الركبتين عاليًا'),
  ('Sprint', 'عدو سريع'), ('5-10-5 shuttle', 'الجري المكوكي 5-10-5'),
  ('Kettlebell halos', 'تدوير الكيتل بل حول الرأس'), ('Hip hinges', 'الانحناء من الورك'),
  ('Single-arm rows', 'سحب الكيتل بل بذراع واحدة'), ('Bodyweight good mornings', 'تمرين صباح الخير بوزن الجسم'),
  ('Push-ups (knees are fine)', 'ضغط (يمكن على الركبتين)'), ('Reverse lunges', 'طعن خلفي'),
  ('Mountain climbers', 'متسلق الجبال'), ('Skips', 'حجل خفيف'), ('Lateral lunges', 'طعن جانبي'),
  ('Split-squat jumps', 'طعن مع القفز والتبديل'), ('Band pull-aparts', 'فتح شريط المقاومة'),
  ('Back squat', 'سكوات خلفي بالبار'), ('Walking lunges', 'طعن مع المشي'), ('Dumbbell rows', 'سحب الدمبل بذراع واحدة');

CREATE TEMP TABLE _block_ar (en TEXT PRIMARY KEY, new_en TEXT NOT NULL, ar TEXT NOT NULL) ON COMMIT DROP;
INSERT INTO _block_ar VALUES
  ('Engine', 'As many rounds', 'أكبر عدد من الجولات'),
  ('Strength', 'Strength', 'القوة');

UPDATE workouts w SET blocks = (
  SELECT jsonb_agg(
    (b
      || coalesce((SELECT jsonb_build_object('title', k.new_en, 'title_ar', k.ar) FROM _block_ar k WHERE k.en = b->>'title'), '{}'::jsonb)
      || jsonb_build_object('items', coalesce((
           SELECT jsonb_agg(it || coalesce((SELECT jsonb_build_object('name_ar', m.ar) FROM _move_ar m WHERE m.en = it->>'name'), '{}'::jsonb) ORDER BY io)
           FROM jsonb_array_elements(b->'items') WITH ORDINALITY AS i(it, io)), '[]'::jsonb))
    ) ORDER BY bo)
  FROM jsonb_array_elements(w.blocks) WITH ORDINALITY AS x(b, bo)
)
WHERE w.source = 'library' AND NOT w.program_only AND w.status = 'published'
  AND jsonb_typeof(w.blocks) = 'array' AND jsonb_array_length(w.blocks) > 0;
