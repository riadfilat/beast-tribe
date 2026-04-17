-- Beast Tribe: Habits & Beast Score System
-- Migration 013

-- 1. Habit definitions (catalog)
CREATE TABLE IF NOT EXISTS habit_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'checkmark-circle',
  category TEXT NOT NULL DEFAULT 'general',
  frequency_type TEXT NOT NULL CHECK (frequency_type IN ('daily', 'weekly', 'monthly')),
  default_target INTEGER NOT NULL DEFAULT 1,
  target_unit TEXT NOT NULL DEFAULT 'times',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User habits (chosen during onboarding)
CREATE TABLE IF NOT EXISTS user_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  habit_definition_id UUID NOT NULL REFERENCES habit_definitions(id) ON DELETE CASCADE,
  target INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, habit_definition_id)
);

-- 3. Habit logs (daily tracking)
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_habit_id UUID NOT NULL REFERENCES user_habits(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_habit_id, logged_date)
);

-- 4. Beast scores (materialized per user)
CREATE TABLE IF NOT EXISTS beast_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  score NUMERIC(8,2) NOT NULL DEFAULT 0,
  workout_consistency NUMERIC(5,2) DEFAULT 0,
  nutrition_consistency NUMERIC(5,2) DEFAULT 0,
  step_consistency NUMERIC(5,2) DEFAULT 0,
  streak_bonus NUMERIC(5,2) DEFAULT 0,
  event_bonus NUMERIC(5,2) DEFAULT 0,
  perfect_days INTEGER DEFAULT 0,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  period_start DATE,
  period_end DATE
);

-- 5. Add columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_frequency INTEGER DEFAULT 4;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS beast_score NUMERIC(8,2) DEFAULT 0;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_user_habits_user ON user_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON habit_logs(user_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(user_habit_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_beast_scores_score ON beast_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_beast_score ON profiles(beast_score DESC);

-- 7. Seed habit definitions
INSERT INTO habit_definitions (key, label, description, icon, category, frequency_type, default_target, target_unit, sort_order) VALUES
  ('train_weekly', 'Train', 'Complete workouts each week', 'barbell-outline', 'workout', 'weekly', 4, 'days', 1),
  ('log_meals', 'Log Meals', 'Track your nutrition daily', 'restaurant-outline', 'nutrition', 'daily', 3, 'meals', 2),
  ('hit_steps', 'Hit 10K Steps', 'Reach your daily step goal', 'walk-outline', 'movement', 'daily', 10000, 'steps', 3),
  ('drink_water', 'Drink Water', 'Stay hydrated throughout the day', 'water-outline', 'nutrition', 'daily', 3, 'liters', 4),
  ('attend_event', 'Attend Events', 'Join community events', 'calendar-outline', 'social', 'monthly', 1, 'events', 5)
ON CONFLICT (key) DO NOTHING;

-- 8. RLS policies
ALTER TABLE habit_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE beast_scores ENABLE ROW LEVEL SECURITY;

-- Habit definitions: public read
CREATE POLICY "Anyone can read habit definitions" ON habit_definitions FOR SELECT USING (true);

-- User habits: users manage their own
CREATE POLICY "Users can read own habits" ON user_habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON user_habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON user_habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON user_habits FOR DELETE USING (auth.uid() = user_id);

-- Habit logs: users manage their own
CREATE POLICY "Users can read own habit logs" ON habit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habit logs" ON habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habit logs" ON habit_logs FOR UPDATE USING (auth.uid() = user_id);

-- Beast scores: public read (for leaderboard), users manage their own
CREATE POLICY "Anyone can read beast scores" ON beast_scores FOR SELECT USING (true);
CREATE POLICY "Users can upsert own beast score" ON beast_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own beast score" ON beast_scores FOR UPDATE USING (auth.uid() = user_id);
