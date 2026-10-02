-- 040 — Train: a workout library (Operation Beast + coaches), logs, saves, and coach pay by use.
--
-- Builds on the tables the first app left behind (workouts, workout_logs). Workouts are written
-- as blocks (warm-up, the main piece, cool-down), in English and Arabic. Coaches publish through
-- the partner portal (service role); Operation Beast reviews before anything goes live. A member
-- finishing a coach's workout counts as one paid "use" — decided here, never by the client.

-- ─── 1. Workouts: bilingual, structured, owned ──────────────────────────────
ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS title_ar text,
  ADD COLUMN IF NOT EXISTS description_ar text,
  ADD COLUMN IF NOT EXISTS sport text,
  ADD COLUMN IF NOT EXISTS format text,
  ADD COLUMN IF NOT EXISTS equipment text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'library',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS author_partner_id uuid REFERENCES partners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_note text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- The first app's 58 workouts are English-only and unstructured: keep them, out of sight.
UPDATE workouts w SET sport = lower(s.name) FROM sports s WHERE s.id = w.sport_id AND w.sport IS NULL;
UPDATE workouts SET status = 'archived' WHERE blocks = '[]'::jsonb AND status = 'draft';

ALTER TABLE workouts DROP CONSTRAINT IF EXISTS workouts_format_check;
ALTER TABLE workouts ADD CONSTRAINT workouts_format_check
  CHECK (format IS NULL OR format IN ('amrap', 'emom', 'for_time', 'rounds', 'intervals', 'steady', 'flow', 'strength'));
ALTER TABLE workouts DROP CONSTRAINT IF EXISTS workouts_source_check;
ALTER TABLE workouts ADD CONSTRAINT workouts_source_check CHECK (source IN ('library', 'coach'));
ALTER TABLE workouts DROP CONSTRAINT IF EXISTS workouts_status_check;
ALTER TABLE workouts ADD CONSTRAINT workouts_status_check
  CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'archived'));
ALTER TABLE workouts DROP CONSTRAINT IF EXISTS workouts_coach_has_author;
ALTER TABLE workouts ADD CONSTRAINT workouts_coach_has_author
  CHECK (source <> 'coach' OR author_partner_id IS NOT NULL OR status = 'archived');

-- The app speaks sport ids ('hyrox'); the first app linked the sports table. Keep both in step,
-- stamp publish time, and keep updated_at honest, whichever side the writer filled in.
ALTER TABLE workouts ALTER COLUMN xp_reward SET DEFAULT 0;
CREATE OR REPLACE FUNCTION bt_workouts_before() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.sport IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.sport IS DISTINCT FROM OLD.sport OR NEW.sport_id IS NULL) THEN
    NEW.sport_id := coalesce(
      (SELECT id FROM sports WHERE lower(name) = lower(NEW.sport) LIMIT 1),
      (SELECT id FROM sports WHERE lower(name) = CASE lower(NEW.sport) WHEN 'skateboarding' THEN 'skate' ELSE lower(NEW.sport) END LIMIT 1),
      (SELECT id FROM sports WHERE lower(name) = 'group fitness' LIMIT 1),
      NEW.sport_id);
  ELSIF NEW.sport IS NULL AND NEW.sport_id IS NOT NULL THEN
    NEW.sport := (SELECT lower(name) FROM sports WHERE id = NEW.sport_id);
  END IF;
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_workouts_before ON workouts;
CREATE TRIGGER trg_workouts_before BEFORE INSERT OR UPDATE ON workouts
  FOR EACH ROW EXECUTE FUNCTION bt_workouts_before();

CREATE INDEX IF NOT EXISTS workouts_status_idx ON workouts (status, source);
CREATE INDEX IF NOT EXISTS workouts_author_idx ON workouts (author_partner_id);
CREATE INDEX IF NOT EXISTS workouts_community_idx ON workouts (community_id);

-- Members read what's published to everyone or to their communities; authors read their own.
-- Nobody writes from the app: the admin and the partner portal write with the service role.
DROP POLICY IF EXISTS "Workouts are public" ON workouts;
DROP POLICY IF EXISTS workouts_read ON workouts;
CREATE POLICY workouts_read ON workouts FOR SELECT USING (
  (status = 'published' AND (community_id IS NULL OR community_id IN (SELECT bt_my_community_ids())))
  OR author_partner_id IN (SELECT bt_my_partner_ids())
  OR is_admin(auth.uid())
);

-- ─── 2. Logs: what a member did, ready for wearables ───────────────────────
ALTER TABLE workout_logs
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS result text,
  ADD COLUMN IF NOT EXISTS rpe smallint,
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  -- heart rate, strain, calories… from Whoop / Apple Health / Garmin later
  ADD COLUMN IF NOT EXISTS metrics jsonb,
  -- one paid "use" of a coach's workout (set by the trigger below, never by the client)
  ADD COLUMN IF NOT EXISTS counted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS coach_partner_id uuid REFERENCES partners(id) ON DELETE SET NULL;

ALTER TABLE workout_logs DROP CONSTRAINT IF EXISTS workout_logs_rpe_check;
ALTER TABLE workout_logs ADD CONSTRAINT workout_logs_rpe_check CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10);
ALTER TABLE workout_logs DROP CONSTRAINT IF EXISTS workout_logs_source_check;
ALTER TABLE workout_logs ADD CONSTRAINT workout_logs_source_check
  CHECK (source IS NULL OR source IN ('manual', 'app', 'whoop', 'apple_health', 'garmin', 'strava'));

CREATE INDEX IF NOT EXISTS workout_logs_user_idx ON workout_logs (user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS workout_logs_workout_idx ON workout_logs (workout_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS workout_logs_counted_idx ON workout_logs (coach_partner_id, completed_at) WHERE counted;

-- Counting rule for coach pay: a member finished a published coach workout, trained for a fair
-- share of its planned time (40%, at least 5 minutes), it isn't the coach's own workout, and it's
-- their first counted finish of that workout that day (Riyadh time).
CREATE OR REPLACE FUNCTION bt_workout_logs_before() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  w record;
  day date;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.user_id := OLD.user_id;
    NEW.workout_id := OLD.workout_id;
    NEW.counted := OLD.counted;
    NEW.coach_partner_id := OLD.coach_partner_id;
    NEW.completed_at := OLD.completed_at;
    NEW.duration_minutes := OLD.duration_minutes;
    RETURN NEW;
  END IF;

  IF NEW.completed_at IS NULL OR NEW.completed_at > now() + interval '5 minutes' THEN
    NEW.completed_at := now();
  END IF;
  NEW.counted := false;
  NEW.coach_partner_id := NULL;

  IF NEW.workout_id IS NOT NULL THEN
    SELECT id, title, sport_id, source, status, author_partner_id, duration_minutes
      INTO w FROM workouts WHERE id = NEW.workout_id;
    IF FOUND THEN
      NEW.title := coalesce(NEW.title, w.title);
      NEW.sport_id := coalesce(NEW.sport_id, w.sport_id);
      IF w.source = 'coach' AND w.status = 'published' AND w.author_partner_id IS NOT NULL THEN
        NEW.coach_partner_id := w.author_partner_id;
        day := (NEW.completed_at AT TIME ZONE 'Asia/Riyadh')::date;
        -- one member finishing the same workout twice at once must not count twice
        PERFORM pg_advisory_xact_lock(hashtext(NEW.user_id::text || NEW.workout_id::text));
        IF NOT EXISTS (SELECT 1 FROM partners p WHERE p.id = w.author_partner_id AND p.user_id = NEW.user_id)
           AND coalesce(NEW.duration_minutes, 0) >= greatest(5, floor(coalesce(w.duration_minutes, 0) * 0.4))
           AND NOT EXISTS (
             SELECT 1 FROM workout_logs l
             WHERE l.user_id = NEW.user_id AND l.workout_id = NEW.workout_id AND l.counted
               AND (l.completed_at AT TIME ZONE 'Asia/Riyadh')::date = day)
        THEN
          NEW.counted := true;
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_workout_logs_before ON workout_logs;
CREATE TRIGGER trg_workout_logs_before BEFORE INSERT OR UPDATE ON workout_logs
  FOR EACH ROW EXECUTE FUNCTION bt_workout_logs_before();

-- ─── 3. Saves ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workout_saves (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, workout_id)
);
ALTER TABLE workout_saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workout_saves_own ON workout_saves;
CREATE POLICY workout_saves_own ON workout_saves FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── 4. A session can carry the workout, and a post can share one ───────────
ALTER TABLE events ADD COLUMN IF NOT EXISTS workout_id uuid REFERENCES workouts(id) ON DELETE SET NULL;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS workout_id uuid REFERENCES workouts(id) ON DELETE SET NULL;

-- ─── 5. "Done by 38 this week": counts only, never who ─────────────────────
CREATE OR REPLACE FUNCTION workout_done_counts(p_ids uuid[])
RETURNS TABLE (workout_id uuid, done_week integer, done_total integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.workout_id,
         count(DISTINCT l.user_id) FILTER (WHERE l.completed_at > now() - interval '7 days')::int,
         count(DISTINCT l.user_id)::int
  FROM workout_logs l
  JOIN workouts w ON w.id = l.workout_id AND w.status = 'published'
  WHERE l.workout_id = ANY (p_ids)
  GROUP BY l.workout_id
$$;
REVOKE ALL ON FUNCTION workout_done_counts(uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION workout_done_counts(uuid[]) TO authenticated;

-- ─── 6. Settings only the admin touches (coach pay) ────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY; -- no policies: service role only
INSERT INTO app_settings (key, value)
VALUES ('coach_pay', '{"mode": "rate", "rate_sar": 0, "pool_sar": 0}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ─── 7. The Operation Beast library ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION pg_temp.ph(id text) RETURNS text LANGUAGE sql IMMUTABLE AS
$$ SELECT 'https://images.unsplash.com/' || id || '?w=1200&h=750&fit=crop&q=70' $$;

INSERT INTO workouts (id, title, title_ar, description, description_ar, sport, sport_id, format, difficulty, duration_minutes,
                      equipment, image_url, blocks, source, status, published_at, xp_reward, is_premium, is_ai_generated)
SELECT v.id::uuid, v.title, v.title_ar, v.description, v.description_ar, v.sport,
       (SELECT s.id FROM sports s WHERE lower(s.name) = v.sport_db LIMIT 1),
       v.format, v.difficulty, v.minutes, v.equipment, CASE WHEN v.photo IS NULL THEN NULL ELSE pg_temp.ph(v.photo) END, v.blocks::jsonb,
       'library', 'published', now(), 0, false, false
FROM (VALUES
  ('0b7e0000-0000-4000-8000-000000000001', 'Engine 20', 'محرك 20',
   'Hyrox-style engine work: twenty minutes, as many rounds as you can. Pace it so the last round looks like the first.',
   'تمرين تحمّل بأسلوب هايروكس: عشرون دقيقة، أكبر عدد ممكن من الجولات. وزّع جهدك لتكون جولتك الأخيرة مثل الأولى.',
   'hyrox', 'hyrox', 'amrap', 'advanced', 35, ARRAY['rower', 'wall_ball', 'kettlebell'], 'photo-1540474861915-87c6b849f6d0',
   '[{"title":"Warm-up","title_ar":"إحماء","format":"rounds","rounds":2,"items":[{"name":"Row","name_ar":"تجديف","reps":"250 m","reps_ar":"250 م"},{"name":"Air squats","name_ar":"سكوات بوزن الجسم","reps":"10"},{"name":"Push-ups","name_ar":"ضغط","reps":"8"},{"name":"Kettlebell deadlifts","name_ar":"رفعة ميتة بالكيتل بل","reps":"10"}]},
     {"title":"Engine","title_ar":"المحرك","format":"amrap","minutes":20,"note":"Run 400 m or row 500 m.","note_ar":"اجرِ 400 م أو جدّف 500 م.","items":[{"name":"Run","name_ar":"جري","reps":"400 m","reps_ar":"400 م"},{"name":"Wall balls","name_ar":"رمي الكرة على الحائط","reps":"20"},{"name":"Kettlebell swings","name_ar":"أرجحة الكيتل بل","reps":"15"},{"name":"Burpees","name_ar":"بيربي","reps":"10"}]},
     {"title":"Cool-down","title_ar":"تهدئة","format":"flow","minutes":5,"items":[{"name":"Easy walk","name_ar":"مشي هادئ","reps":"2 min","reps_ar":"2 د"},{"name":"Hip flexor stretch","name_ar":"إطالة مثنيات الورك","reps":"30 s / side","reps_ar":"30 ث لكل جهة"},{"name":"Child''s pose","name_ar":"وضعية الطفل","reps":"1 min","reps_ar":"1 د"}]}]'),

  ('0b7e0000-0000-4000-8000-000000000002', 'No-Kit 15', 'بدون معدات 15',
   'Fifteen minutes, no equipment, anywhere. A new move every minute on the minute.',
   'خمس عشرة دقيقة بلا معدات وفي أي مكان. حركة جديدة مع بداية كل دقيقة.',
   'gym', 'gym', 'emom', 'beginner', 20, ARRAY[]::text[], 'photo-1787154604266-e29f25f07056',
   '[{"title":"Warm-up","title_ar":"إحماء","format":"flow","minutes":3,"items":[{"name":"Jumping jacks","name_ar":"قفز الجاك","reps":"30 s","reps_ar":"30 ث"},{"name":"Arm circles","name_ar":"دوائر الذراعين","reps":"30 s","reps_ar":"30 ث"},{"name":"Bodyweight good mornings","name_ar":"انحناء صباح الخير","reps":"10"}]},
     {"title":"Every minute","title_ar":"كل دقيقة","format":"emom","minutes":15,"note":"Three times through. Rest for what''s left of each minute.","note_ar":"ثلاث مرات. استرح في بقية كل دقيقة.","items":[{"name":"Air squats","name_ar":"سكوات بوزن الجسم","reps":"12"},{"name":"Push-ups (knees are fine)","name_ar":"ضغط (على الركبتين لا بأس)","reps":"10"},{"name":"Plank","name_ar":"بلانك","reps":"30 s","reps_ar":"30 ث"},{"name":"Reverse lunges","name_ar":"طعنات خلفية","reps":"6 / side","reps_ar":"6 لكل رجل"},{"name":"Mountain climbers","name_ar":"متسلق الجبل","reps":"20"}]}]'),

  ('0b7e0000-0000-4000-8000-000000000003', 'Dawn 5K Builder', 'تحضير 5 كم مع الفجر',
   'Intervals that make 5 km feel shorter. Run the hard parts comfortably hard, not flat out.',
   'فترات تجعل الـ5 كم أقصر. اجرِ الأجزاء الصعبة بجهد مرتفع مريح، لا بأقصى سرعتك.',
   'running', 'running', 'intervals', 'intermediate', 40, ARRAY[]::text[], 'photo-1720995437688-68cc4b9cab75',
   '[{"title":"Warm-up","title_ar":"إحماء","format":"steady","minutes":10,"items":[{"name":"Easy jog","name_ar":"هرولة خفيفة","reps":"10 min","reps_ar":"10 د"}]},
     {"title":"Intervals","title_ar":"فترات","format":"intervals","rounds":5,"items":[{"name":"Comfortably hard","name_ar":"جهد مرتفع مريح","reps":"3 min","reps_ar":"3 د"},{"name":"Easy jog","name_ar":"هرولة خفيفة","reps":"90 s","reps_ar":"90 ث"}]},
     {"title":"Cool-down","title_ar":"تهدئة","format":"flow","minutes":5,"items":[{"name":"Walk","name_ar":"مشي","reps":"4 min","reps_ar":"4 د"},{"name":"Calf stretch","name_ar":"إطالة السمانة","reps":"30 s / side","reps_ar":"30 ث لكل جهة"}]}]'),

  ('0b7e0000-0000-4000-8000-000000000004', 'Padel Legs', 'أرجل البادل',
   'Quick feet and strong legs for the court: lateral power, landings and short bursts.',
   'خطوات سريعة وأرجل قوية للملعب: قوة جانبية، هبوط ثابت، وانطلاقات قصيرة.',
   'padel', 'padel', 'rounds', 'intermediate', 30, ARRAY[]::text[], 'photo-1781310370779-9c45ab3f4e04',
   '[{"title":"Warm-up","title_ar":"إحماء","format":"flow","minutes":4,"items":[{"name":"Lateral shuffles","name_ar":"خطوات جانبية","reps":"30 s","reps_ar":"30 ث"},{"name":"Skips","name_ar":"قفزات خفيفة","reps":"30 s","reps_ar":"30 ث"},{"name":"Hip openers","name_ar":"فتح الورك","reps":"10"}]},
     {"title":"Court strength","title_ar":"قوة الملعب","format":"rounds","rounds":4,"note":"Rest 60 s between rounds.","note_ar":"استرح 60 ث بين الجولات.","items":[{"name":"Lateral lunges","name_ar":"طعنات جانبية","reps":"5 / side","reps_ar":"5 لكل جهة"},{"name":"Split-squat jumps","name_ar":"قفزات الطعن","reps":"4 / side","reps_ar":"4 لكل رجل"},{"name":"Shuttle runs (5 m)","name_ar":"جري مكوكي (5 م)","reps":"6"},{"name":"Calf raises","name_ar":"رفع السمانة","reps":"15"}]},
     {"title":"Quick feet","title_ar":"خطوات سريعة","format":"intervals","rounds":3,"items":[{"name":"Side-to-side quick feet","name_ar":"خطوات سريعة يمين ويسار","reps":"20 s","reps_ar":"20 ث"},{"name":"Rest","name_ar":"راحة","reps":"20 s","reps_ar":"20 ث"}]}]'),

  ('0b7e0000-0000-4000-8000-000000000005', 'Desk Reset 10', 'استراحة المكتب 10',
   'Ten minutes to undo a day at the desk. No sweat, no kit, done next to your chair.',
   'عشر دقائق تمحو يومًا على المكتب. بلا تعرّق ولا معدات، بجانب كرسيك.',
   'yoga', 'yoga', 'flow', 'beginner', 10, ARRAY[]::text[], 'photo-1545205597-3d9d02c29597',
   '[{"title":"Reset","title_ar":"استعادة","format":"flow","minutes":10,"items":[{"name":"Neck rolls","name_ar":"دوران الرقبة","reps":"30 s","reps_ar":"30 ث"},{"name":"Shoulder rolls","name_ar":"دوران الكتفين","reps":"30 s","reps_ar":"30 ث"},{"name":"Cat-cow","name_ar":"القطة والبقرة","reps":"8"},{"name":"Thoracic rotations","name_ar":"تدوير الظهر العلوي","reps":"6 / side","reps_ar":"6 لكل جهة"},{"name":"Hip flexor stretch","name_ar":"إطالة مثنيات الورك","reps":"30 s / side","reps_ar":"30 ث لكل جهة"},{"name":"Standing forward fold","name_ar":"انحناء أمامي واقف","reps":"30 s","reps_ar":"30 ث"},{"name":"Chest opener at the desk","name_ar":"فتح الصدر على المكتب","reps":"30 s","reps_ar":"30 ث"}]}]'),

  ('0b7e0000-0000-4000-8000-000000000006', 'Squat & Press', 'سكوات وضغط',
   'A classic strength day. Heavy, simple, and every set counts.',
   'يوم قوة كلاسيكي. أوزان ثقيلة، حركات بسيطة، وكل مجموعة لها قيمة.',
   'gym', 'gym', 'strength', 'advanced', 50, ARRAY['barbell', 'dumbbells', 'bike'], 'photo-1632077804406-188472f1a810',
   '[{"title":"Warm-up","title_ar":"إحماء","format":"flow","minutes":8,"items":[{"name":"Bike or row","name_ar":"دراجة أو تجديف","reps":"5 min","reps_ar":"5 د"},{"name":"Goblet squats","name_ar":"سكوات الكأس","reps":"10"},{"name":"Band pull-aparts","name_ar":"فتح الحبل المطاطي","reps":"10"}]},
     {"title":"Strength","title_ar":"قوة","format":"strength","items":[{"name":"Back squat","name_ar":"سكوات خلفي","reps":"5 × 5","note":"Rest 2 min","note_ar":"راحة 2 د"},{"name":"Push press","name_ar":"دفع فوق الرأس","reps":"4 × 6","note":"Rest 90 s","note_ar":"راحة 90 ث"}]},
     {"title":"Accessories","title_ar":"تمارين مساعدة","format":"rounds","rounds":3,"items":[{"name":"Walking lunges","name_ar":"طعنات مشي","reps":"12"},{"name":"Dumbbell rows","name_ar":"سحب الدمبل","reps":"10 / side","reps_ar":"10 لكل جهة"},{"name":"Plank","name_ar":"بلانك","reps":"30 s","reps_ar":"30 ث"}]}]'),

  ('0b7e0000-0000-4000-8000-000000000007', 'Kettlebell 30', 'كيتل بل 30',
   'One kettlebell, five rounds, a short run between. Strong hips, strong back, big lungs.',
   'كيتل بل واحد، خمس جولات، وجري قصير بينها. ورك قوي، ظهر قوي، ونَفَس أطول.',
   'crossfit', 'crossfit', 'rounds', 'intermediate', 30, ARRAY['kettlebell'], 'photo-1623428455276-c5243d302dbe',
   '[{"title":"Warm-up","title_ar":"إحماء","format":"flow","minutes":5,"items":[{"name":"Easy jog","name_ar":"هرولة خفيفة","reps":"2 min","reps_ar":"2 د"},{"name":"Kettlebell halos","name_ar":"دوران الكيتل بل حول الرأس","reps":"5 / side","reps_ar":"5 لكل جهة"},{"name":"Hip hinges","name_ar":"انحناء الورك","reps":"10"}]},
     {"title":"Five rounds","title_ar":"خمس جولات","format":"rounds","rounds":5,"items":[{"name":"Kettlebell swings","name_ar":"أرجحة الكيتل بل","reps":"15"},{"name":"Goblet squats","name_ar":"سكوات الكأس","reps":"10"},{"name":"Single-arm rows","name_ar":"سحب بذراع واحدة","reps":"8 / side","reps_ar":"8 لكل جهة"},{"name":"Run","name_ar":"جري","reps":"200 m","reps_ar":"200 م"}]}]'),

  ('0b7e0000-0000-4000-8000-000000000008', 'Football Engine', 'لياقة الكورة',
   'Match fitness: sprints, sharp turns and the engine to keep going in the second half.',
   'لياقة المباريات: انطلاقات، تغيير اتجاه حاد، ونَفَس يكفي للشوط الثاني.',
   'football', 'football', 'intervals', 'intermediate', 35, ARRAY[]::text[], 'photo-1785003897036-d777c28c2f91',
   '[{"title":"Warm-up","title_ar":"إحماء","format":"flow","minutes":8,"items":[{"name":"Easy jog","name_ar":"هرولة خفيفة","reps":"5 min","reps_ar":"5 د"},{"name":"Leg swings","name_ar":"أرجحة الرجل","reps":"10 / side","reps_ar":"10 لكل رجل"},{"name":"High knees","name_ar":"رفع الركبتين","reps":"20 m","reps_ar":"20 م"}]},
     {"title":"Sprints","title_ar":"انطلاقات","format":"intervals","rounds":8,"items":[{"name":"Sprint","name_ar":"انطلاقة","reps":"40 m","reps_ar":"40 م"},{"name":"Walk back","name_ar":"عودة مشيًا","reps":"40 m","reps_ar":"40 م"}]},
     {"title":"Turns","title_ar":"تغيير الاتجاه","format":"rounds","rounds":3,"note":"Rest 90 s between rounds.","note_ar":"استرح 90 ث بين الجولات.","items":[{"name":"5-10-5 shuttle","name_ar":"مكوكي 5-10-5","reps":"4"}]},
     {"title":"Second half","title_ar":"الشوط الثاني","format":"intervals","rounds":4,"items":[{"name":"Hard run","name_ar":"جري قوي","reps":"30 s","reps_ar":"30 ث"},{"name":"Walk","name_ar":"مشي","reps":"30 s","reps_ar":"30 ث"}]}]'),

  ('0b7e0000-0000-4000-8000-000000000009', 'Run & Wall Balls', 'جري وكرات حائط',
   'Four rounds for time. The Hyrox finish line, in thirty minutes or less.',
   'أربع جولات ضد الوقت. خط نهاية هايروكس في ثلاثين دقيقة أو أقل.',
   'hyrox', 'hyrox', 'for_time', 'advanced', 30, ARRAY['wall_ball'], 'photo-1775322838072-829ad37ab52d',
   '[{"title":"Warm-up","title_ar":"إحماء","format":"flow","minutes":5,"items":[{"name":"Easy jog","name_ar":"هرولة خفيفة","reps":"3 min","reps_ar":"3 د"},{"name":"Wall balls (light)","name_ar":"كرات حائط (خفيفة)","reps":"10"}]},
     {"title":"For time","title_ar":"ضد الوقت","format":"for_time","rounds":4,"minutes":30,"note":"Time cap 30 min.","note_ar":"الحد الأقصى 30 د.","items":[{"name":"Run","name_ar":"جري","reps":"800 m","reps_ar":"800 م"},{"name":"Wall balls","name_ar":"رمي الكرة على الحائط","reps":"25"}]}]'),

  ('0b7e0000-0000-4000-8000-000000000010', 'Partner Core', 'كور مع شريك',
   'You go, I go. One works while the other rests — bring your crew.',
   'أنت ثم أنا. واحد يتمرن والآخر يرتاح — أحضر فريقك.',
   'gym', 'gym', 'rounds', 'beginner', 15, ARRAY[]::text[], 'photo-1519311965067-36d3e5f33d39',
   '[{"title":"You go, I go","title_ar":"أنت ثم أنا","format":"rounds","rounds":4,"note":"Swap after each move: your partner rests while you work.","note_ar":"تبادلا بعد كل حركة: يرتاح شريكك وأنت تتمرن.","items":[{"name":"Plank","name_ar":"بلانك","reps":"30 s","reps_ar":"30 ث"},{"name":"Dead bugs","name_ar":"تمرين الحشرة الميتة","reps":"20"},{"name":"Bicycle crunches","name_ar":"تمرين الدراجة للبطن","reps":"20"},{"name":"Side plank","name_ar":"بلانك جانبي","reps":"30 s / side","reps_ar":"30 ث لكل جهة"}]}]'),

  ('0b7e0000-0000-4000-8000-000000000011', 'Recovery Walk & Stretch', 'مشي واستطالة',
   'An easy day that still counts: walk at talking pace, then stretch what''s tight.',
   'يوم خفيف وله قيمة: امشِ بسرعة تسمح بالحديث، ثم أطِل ما هو مشدود.',
   'walking', 'walking', 'steady', 'beginner', 35, ARRAY[]::text[], 'photo-1680246637685-65081afd4df8',
   '[{"title":"Walk","title_ar":"مشي","format":"steady","minutes":25,"items":[{"name":"Easy walk at talking pace","name_ar":"مشي هادئ بسرعة تسمح بالحديث","reps":"25 min","reps_ar":"25 د"}]},
     {"title":"Stretch","title_ar":"إطالة","format":"flow","minutes":10,"items":[{"name":"Hamstring stretch","name_ar":"إطالة الفخذ الخلفية","reps":"30 s / side","reps_ar":"30 ث لكل جهة"},{"name":"Quad stretch","name_ar":"إطالة الفخذ الأمامية","reps":"30 s / side","reps_ar":"30 ث لكل جهة"},{"name":"Hip opener","name_ar":"فتح الورك","reps":"30 s / side","reps_ar":"30 ث لكل جهة"},{"name":"Chest stretch","name_ar":"إطالة الصدر","reps":"30 s","reps_ar":"30 ث"}]}]'),

  ('0b7e0000-0000-4000-8000-000000000012', 'Burpee Ladder', 'سلّم البيربي',
   'One burpee, walk, two burpees, walk… all the way to ten. Fifty-five in total.',
   'بيربي واحد، مشي، ثم اثنان، مشي… حتى العشرة. خمسة وخمسون بيربي.',
   'crossfit', 'crossfit', 'for_time', 'intermediate', 15, ARRAY[]::text[], NULL,
   '[{"title":"Warm-up","title_ar":"إحماء","format":"flow","minutes":3,"items":[{"name":"Jumping jacks","name_ar":"قفز الجاك","reps":"30 s","reps_ar":"30 ث"},{"name":"Inchworms","name_ar":"تمرين الدودة","reps":"5"}]},
     {"title":"Ladder","title_ar":"السلّم","format":"for_time","minutes":15,"note":"1 to 10 burpees, a 10 m walk between rungs. Time cap 15 min.","note_ar":"من 1 إلى 10 بيربي، ومشي 10 م بين كل درجة. الحد الأقصى 15 د.","items":[{"name":"Burpees","name_ar":"بيربي","reps":"1 → 10"},{"name":"Walk","name_ar":"مشي","reps":"10 m","reps_ar":"10 م"}]}]')
) AS v(id, title, title_ar, description, description_ar, sport, sport_db, format, difficulty, minutes, equipment, photo, blocks)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, title_ar = EXCLUDED.title_ar, description = EXCLUDED.description,
  description_ar = EXCLUDED.description_ar, sport = EXCLUDED.sport, sport_id = EXCLUDED.sport_id,
  format = EXCLUDED.format, difficulty = EXCLUDED.difficulty, duration_minutes = EXCLUDED.duration_minutes,
  equipment = EXCLUDED.equipment, image_url = EXCLUDED.image_url, blocks = EXCLUDED.blocks,
  source = 'library', status = 'published', updated_at = now();
