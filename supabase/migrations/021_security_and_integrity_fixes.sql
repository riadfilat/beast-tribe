-- ============================================
-- 021: Security & Data Integrity Fixes
-- Fixes from production readiness audit
-- ============================================

-- ============================================
-- 1. FIX OVERLY PERMISSIVE RLS POLICIES
-- ============================================

-- coach_trainees: restrict to coach + trainee only
DROP POLICY IF EXISTS coach_trainees_insert ON coach_trainees;
DROP POLICY IF EXISTS coach_trainees_update ON coach_trainees;
DO $$ BEGIN CREATE POLICY coach_trainees_insert_restricted ON coach_trainees FOR INSERT WITH CHECK (
  coach_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY coach_trainees_update_restricted ON coach_trainees FOR UPDATE USING (
  coach_id IN (SELECT id FROM partners WHERE user_id = auth.uid()) OR trainee_id = auth.uid()
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- coach_notes: restrict insert to assigned coaches only
DROP POLICY IF EXISTS coach_notes_insert ON coach_notes;
DO $$ BEGIN CREATE POLICY coach_notes_insert_restricted ON coach_notes FOR INSERT WITH CHECK (
  coach_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- workout_programs: restrict write to creator
DROP POLICY IF EXISTS wp_insert ON workout_programs;
DROP POLICY IF EXISTS wp_update ON workout_programs;
DROP POLICY IF EXISTS wp_delete ON workout_programs;
DO $$ BEGIN CREATE POLICY wp_insert_own ON workout_programs FOR INSERT WITH CHECK (created_by = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY wp_update_own ON workout_programs FOR UPDATE USING (created_by = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY wp_delete_own ON workout_programs FOR DELETE USING (created_by = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- program_assignments: restrict to program creator
DROP POLICY IF EXISTS pa_insert ON program_assignments;
DO $$ BEGIN CREATE POLICY pa_insert_own ON program_assignments FOR INSERT WITH CHECK (assigned_by = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- popular_locations: restrict writes to admins only (read stays public)
DROP POLICY IF EXISTS locations_write ON popular_locations;

-- trainee_privacy: restrict to trainee + their coach
DROP POLICY IF EXISTS trainee_privacy_coach ON trainee_privacy;
DO $$ BEGIN CREATE POLICY trainee_privacy_coach_restricted ON trainee_privacy FOR SELECT USING (
  trainee_id = auth.uid() OR coach_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- 2. ADD MISSING INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_feed_posts_user_created ON feed_posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_visible_created ON feed_posts(is_visible, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_completed ON workout_logs(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON nutrition_logs(user_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at ASC);
CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON profiles(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_beast_score ON profiles(beast_score DESC);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user ON event_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_beasts_user ON beasts(user_id);

-- ============================================
-- 3. FIX MISSING CASCADE RULES
-- ============================================

-- profiles.pack_id -> ON DELETE SET NULL
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS fk_profiles_pack;
DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT fk_profiles_pack
    FOREIGN KEY (pack_id) REFERENCES packs(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- user_sports.sport_id -> ON DELETE CASCADE
ALTER TABLE user_sports DROP CONSTRAINT IF EXISTS user_sports_sport_id_fkey;
DO $$ BEGIN
  ALTER TABLE user_sports ADD CONSTRAINT user_sports_sport_id_fkey
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 4. ADD NOT NULL TO CRITICAL TIMESTAMP COLUMNS
-- ============================================

ALTER TABLE habit_definitions ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE habit_definitions ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE user_habits ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE user_habits ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE chat_rooms ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE chat_rooms ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE chat_messages ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE chat_messages ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE body_metrics ALTER COLUMN recorded_at SET NOT NULL;
ALTER TABLE body_metrics ALTER COLUMN recorded_at SET DEFAULT now();

-- ============================================
-- 5. ADD MISSING UNIQUE CONSTRAINTS
-- ============================================

-- Prevent duplicate location entries
DO $$ BEGIN
  ALTER TABLE popular_locations ADD CONSTRAINT uq_location_name_city UNIQUE(name, city);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 6. ADD feed_posts UPDATE/DELETE POLICIES
-- ============================================

DO $$ BEGIN CREATE POLICY feed_posts_update_own ON feed_posts FOR UPDATE USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY feed_posts_delete_own ON feed_posts FOR DELETE USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

SELECT 'Security & integrity fixes applied!' as status;
