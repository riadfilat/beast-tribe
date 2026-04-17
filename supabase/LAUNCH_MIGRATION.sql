-- ============================================
-- BEAST TRIBE — LAUNCH MIGRATION
-- Run this in Supabase Dashboard → SQL Editor
-- Combines migrations 013-016
-- ============================================

-- ============================================
-- 013: Habits & Beast Score
-- ============================================
CREATE TABLE IF NOT EXISTS habit_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  frequency_type TEXT NOT NULL DEFAULT 'daily' CHECK (frequency_type IN ('daily', 'weekly', 'monthly')),
  default_target INTEGER NOT NULL DEFAULT 1,
  target_unit TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  habit_definition_id UUID NOT NULL REFERENCES habit_definitions(id) ON DELETE CASCADE,
  target INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, habit_definition_id)
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_habit_id UUID NOT NULL REFERENCES user_habits(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  value NUMERIC DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_habit_id, logged_date)
);

CREATE TABLE IF NOT EXISTS beast_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score NUMERIC(8,2) DEFAULT 0,
  workout_consistency NUMERIC(5,2) DEFAULT 0,
  nutrition_consistency NUMERIC(5,2) DEFAULT 0,
  step_consistency NUMERIC(5,2) DEFAULT 0,
  streak_bonus NUMERIC(5,2) DEFAULT 0,
  event_bonus NUMERIC(5,2) DEFAULT 0,
  perfect_days INTEGER DEFAULT 0,
  calculated_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns to profiles if not exists
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_frequency INTEGER DEFAULT 4;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS beast_score NUMERIC(8,2) DEFAULT 0;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Seed habit definitions
INSERT INTO habit_definitions (key, label, description, icon, category, frequency_type, default_target, target_unit, sort_order) VALUES
  ('train_weekly', 'Train', 'Complete workouts each week', 'barbell-outline', 'workout', 'weekly', 4, 'days', 1),
  ('log_meals', 'Log Meals', 'Track your nutrition daily', 'restaurant-outline', 'nutrition', 'daily', 3, 'meals', 2),
  ('hit_steps', 'Hit 10K Steps', 'Reach your daily step goal', 'walk-outline', 'movement', 'daily', 10000, 'steps', 3),
  ('drink_water', 'Drink Water', 'Stay hydrated throughout the day', 'water-outline', 'nutrition', 'daily', 3, 'liters', 4),
  ('attend_event', 'Attend Events', 'Join community events', 'calendar-outline', 'social', 'monthly', 1, 'events', 5)
ON CONFLICT (key) DO NOTHING;

-- XP reward for perfect day
DO $$ BEGIN
  INSERT INTO xp_reward_config (source, amount) VALUES ('perfect_day', 100) ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- RLS
ALTER TABLE habit_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE beast_scores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY habit_defs_public ON habit_definitions FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY user_habits_own ON user_habits FOR ALL USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY habit_logs_own ON habit_logs FOR ALL USING (user_habit_id IN (SELECT id FROM user_habits WHERE user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY beast_scores_own ON beast_scores FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- 014: Chat rooms & messages
-- ============================================
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('pack', 'event')),
  pack_id UUID REFERENCES packs(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pack_id),
  UNIQUE(event_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'status', 'ping')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id, created_at DESC);

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat room policies
DO $$ BEGIN
CREATE POLICY chat_rooms_select ON chat_rooms FOR SELECT USING (
  (type = 'pack' AND pack_id IN (SELECT pack_id FROM pack_members WHERE user_id = auth.uid()))
  OR
  (type = 'event' AND event_id IN (SELECT event_id FROM event_rsvps WHERE user_id = auth.uid() AND status = 'going'))
);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY chat_messages_select ON chat_messages FOR SELECT USING (
  room_id IN (SELECT id FROM chat_rooms WHERE
    (type = 'pack' AND pack_id IN (SELECT pack_id FROM pack_members WHERE user_id = auth.uid()))
    OR
    (type = 'event' AND event_id IN (SELECT event_id FROM event_rsvps WHERE user_id = auth.uid() AND status = 'going'))
  )
);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY chat_messages_insert ON chat_messages FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND room_id IN (SELECT id FROM chat_rooms WHERE
    (type = 'pack' AND pack_id IN (SELECT pack_id FROM pack_members WHERE user_id = auth.uid()))
    OR
    (type = 'event' AND event_id IN (SELECT event_id FROM event_rsvps WHERE user_id = auth.uid() AND status = 'going'))
  )
);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Auto-create chat rooms
CREATE OR REPLACE FUNCTION create_pack_chat_room()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chat_rooms (type, pack_id, name)
  VALUES ('pack', NEW.id, NEW.name || ' Chat')
  ON CONFLICT (pack_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pack_chat_room ON packs;
CREATE TRIGGER trg_pack_chat_room
  AFTER INSERT ON packs
  FOR EACH ROW
  EXECUTE FUNCTION create_pack_chat_room();

CREATE OR REPLACE FUNCTION create_event_chat_room()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chat_rooms (type, event_id, name)
  VALUES ('event', NEW.id, NEW.title || ' Chat')
  ON CONFLICT (event_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_event_chat_room ON events;
CREATE TRIGGER trg_event_chat_room
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION create_event_chat_room();

-- ============================================
-- 015: Profile enrichment + event difficulty
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_level TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS difficulty TEXT;

-- ============================================
-- 016: Journal entries
-- ============================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_journal_user_date ON journal_entries(user_id, entry_date);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY journal_select ON journal_entries FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
CREATE POLICY journal_insert ON journal_entries FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
CREATE POLICY journal_update ON journal_entries FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- Create chat rooms for existing packs/events
-- ============================================
INSERT INTO chat_rooms (type, pack_id, name)
SELECT 'pack', id, name || ' Chat' FROM packs
ON CONFLICT (pack_id) DO NOTHING;

INSERT INTO chat_rooms (type, event_id, name)
SELECT 'event', id, title || ' Chat' FROM events
ON CONFLICT (event_id) DO NOTHING;

-- Done!
SELECT 'Launch migration completed successfully!' as status;
