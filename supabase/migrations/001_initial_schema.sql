-- Beast Tribe — Initial Database Schema
-- Run this in Supabase SQL Editor or via CLI migration

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth DATE,
  region TEXT DEFAULT 'SA',
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  tier TEXT NOT NULL DEFAULT 'raw' CHECK (tier IN ('raw', 'forged', 'untamed')),
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  premium_expires_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  pack_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Public profiles readable" ON profiles FOR SELECT USING (true);

-- ============================================
-- SPORTS
-- ============================================
CREATE TABLE sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  emoji TEXT,
  category TEXT,
  popularity_male INTEGER DEFAULT 0,
  popularity_female INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sports are public" ON sports FOR SELECT USING (true);

-- ============================================
-- USER_SPORTS
-- ============================================
CREATE TABLE user_sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sport_id UUID NOT NULL REFERENCES sports(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, sport_id)
);

ALTER TABLE user_sports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sports" ON user_sports FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- BASELINES
-- ============================================
CREATE TABLE baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight_kg NUMERIC(5,1),
  height_cm NUMERIC(5,1),
  five_k_time_seconds INTEGER,
  max_bench_kg NUMERIC(5,1),
  daily_steps_avg INTEGER,
  progress_photo_url TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE baselines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own baselines" ON baselines FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- GOALS
-- ============================================
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sport_id UUID REFERENCES sports(id),
  title TEXT NOT NULL,
  target_value NUMERIC,
  target_unit TEXT,
  target_date DATE,
  progress_pct NUMERIC(5,2) DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goals" ON goals FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- PACKS
-- ============================================
CREATE TABLE packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  animal TEXT,
  icon_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Packs are public" ON packs FOR SELECT USING (true);

-- Add FK to profiles now that packs table exists
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_pack FOREIGN KEY (pack_id) REFERENCES packs(id);

-- ============================================
-- XP_TRANSACTIONS
-- ============================================
CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_xp_user_created ON xp_transactions(user_id, created_at);

ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own xp" ON xp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own xp" ON xp_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger: recalculate level and tier on XP insert
CREATE OR REPLACE FUNCTION recalculate_level_and_tier()
RETURNS TRIGGER AS $$
DECLARE
  new_xp INTEGER;
  new_level INTEGER;
  new_tier TEXT;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO new_xp
  FROM xp_transactions WHERE user_id = NEW.user_id;

  new_level := LEAST(100, GREATEST(1, FLOOR(SQRT(new_xp / 20.0)) + 1));

  IF new_xp >= 15000 THEN new_tier := 'untamed';
  ELSIF new_xp >= 2000 THEN new_tier := 'forged';
  ELSE new_tier := 'raw';
  END IF;

  UPDATE profiles
  SET total_xp = new_xp, level = new_level, tier = new_tier, updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_xp_recalc
AFTER INSERT ON xp_transactions
FOR EACH ROW EXECUTE FUNCTION recalculate_level_and_tier();

-- ============================================
-- WORKOUTS
-- ============================================
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  sport_id UUID NOT NULL REFERENCES sports(id),
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'all_levels')),
  duration_minutes INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 100,
  image_url TEXT,
  instructions JSONB,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workouts are public" ON workouts FOR SELECT USING (true);

-- ============================================
-- WORKOUT_LOGS
-- ============================================
CREATE TABLE workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workouts(id),
  sport_id UUID REFERENCES sports(id),
  title TEXT,
  duration_minutes INTEGER,
  calories_burned INTEGER,
  notes TEXT,
  source TEXT DEFAULT 'manual',
  external_id TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own workout logs" ON workout_logs FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- NUTRITION_LOGS
-- ============================================
CREATE TABLE nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  title TEXT NOT NULL,
  calories INTEGER,
  protein_g NUMERIC(6,1),
  carbs_g NUMERIC(6,1),
  fat_g NUMERIC(6,1),
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own nutrition" ON nutrition_logs FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- WATER_LOGS
-- ============================================
CREATE TABLE water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  glasses INTEGER NOT NULL DEFAULT 1,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own water logs" ON water_logs FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- STEP_LOGS
-- ============================================
CREATE TABLE step_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  steps INTEGER NOT NULL,
  step_goal INTEGER NOT NULL DEFAULT 10000,
  logged_date DATE NOT NULL,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, logged_date)
);

ALTER TABLE step_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own steps" ON step_logs FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FEED_POSTS
-- ============================================
CREATE TABLE feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sport_id UUID REFERENCES sports(id),
  workout_log_id UUID REFERENCES workout_logs(id),
  post_type TEXT DEFAULT 'activity',
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Feed posts are public" ON feed_posts FOR SELECT USING (is_visible = true);
CREATE POLICY "Users manage own posts" ON feed_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- BEASTS (reactions — replaces "kudos")
-- ============================================
CREATE TABLE beasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE beasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Beasts are public" ON beasts FOR SELECT USING (true);
CREATE POLICY "Users give beasts" ON beasts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own beasts" ON beasts FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- EVENTS
-- ============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  sport_id UUID REFERENCES sports(id),
  location_name TEXT,
  location_city TEXT,
  location_lat NUMERIC(10,7),
  location_lng NUMERIC(10,7),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  max_capacity INTEGER,
  partner_name TEXT,
  coach_name TEXT,
  gym_name TEXT,
  is_women_only BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for event search by coach, gym, sport
CREATE INDEX idx_events_coach ON events(coach_name);
CREATE INDEX idx_events_gym ON events(gym_name);
CREATE INDEX idx_events_sport ON events(sport_id);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are public" ON events FOR SELECT USING (true);

-- ============================================
-- EVENT_RSVPS
-- ============================================
CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'going' CHECK (status IN ('going', 'interested', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RSVPs are public" ON event_rsvps FOR SELECT USING (true);
CREATE POLICY "Users manage own RSVPs" ON event_rsvps FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- PACK_CHALLENGES
-- ============================================
CREATE TABLE pack_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_a_id UUID NOT NULL REFERENCES packs(id),
  pack_b_id UUID NOT NULL REFERENCES packs(id),
  title TEXT,
  pack_a_xp INTEGER DEFAULT 0,
  pack_b_xp INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  winner_pack_id UUID REFERENCES packs(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pack_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pack challenges are public" ON pack_challenges FOR SELECT USING (true);

-- ============================================
-- QUESTS
-- ============================================
CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  sport_id UUID REFERENCES sports(id),
  quest_type TEXT DEFAULT 'daily',
  xp_reward INTEGER NOT NULL,
  requirements JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quests are public" ON quests FOR SELECT USING (true);

-- ============================================
-- USER_QUESTS
-- ============================================
CREATE TABLE user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id),
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, quest_id, assigned_date)
);

ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own quests" ON user_quests FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- BADGES
-- ============================================
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  color TEXT,
  requirement_type TEXT,
  requirement_value INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges are public" ON badges FOR SELECT USING (true);

-- ============================================
-- USER_BADGES
-- ============================================
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User badges are public" ON user_badges FOR SELECT USING (true);
CREATE POLICY "Users earn badges" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- BEAST_ROAR_NOMINATIONS
-- ============================================
CREATE TABLE beast_roar_nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  description TEXT,
  post_id UUID REFERENCES feed_posts(id),
  vote_count INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE beast_roar_nominations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nominations are public" ON beast_roar_nominations FOR SELECT USING (true);

-- ============================================
-- BEAST_ROAR_VOTES
-- ============================================
CREATE TABLE beast_roar_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomination_id UUID NOT NULL REFERENCES beast_roar_nominations(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(nomination_id, voter_id)
);

ALTER TABLE beast_roar_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes are public" ON beast_roar_votes FOR SELECT USING (true);
CREATE POLICY "Users cast votes" ON beast_roar_votes FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- ============================================
-- DEVICE_CONNECTIONS
-- ============================================
CREATE TABLE device_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  is_connected BOOLEAN DEFAULT FALSE,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

ALTER TABLE device_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own connections" ON device_connections FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- QR_CODES
-- ============================================
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  purchase_ref TEXT,
  premium_months INTEGER DEFAULT 3,
  is_redeemed BOOLEAN DEFAULT FALSE,
  redeemed_by UUID REFERENCES profiles(id),
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "QR codes readable" ON qr_codes FOR SELECT USING (true);

-- ============================================
-- SEED DATA: Sports
-- ============================================
INSERT INTO sports (name, emoji, category, popularity_male, popularity_female) VALUES
  ('Running', '🏃', 'cardio', 1, 3),
  ('Gym', '🏋', 'strength', 2, 4),
  ('Cycling', '🚴', 'cardio', 3, 5),
  ('CrossFit', '🤸', 'strength', 4, 0),
  ('Swimming', '🏊', 'water', 5, 6),
  ('Hyrox', '💪', 'strength', 6, 0),
  ('Yoga', '🧘', 'flexibility', 0, 1),
  ('Pilates', '🧘', 'flexibility', 0, 2),
  ('Padel', '🎾', 'cardio', 7, 7),
  ('Football', '⚽', 'cardio', 8, 0),
  ('Walking', '🚶', 'cardio', 9, 8),
  ('Group Fitness', '👥', 'cardio', 10, 9);

-- SEED DATA: Packs
INSERT INTO packs (name, animal) VALUES
  ('Wolf Pack', 'wolf'),
  ('Eagle Legion', 'eagle'),
  ('Tiger Squad', 'tiger'),
  ('Rhino Force', 'rhino');

-- SEED DATA: Badges
INSERT INTO badges (name, description, color, requirement_type, requirement_value) VALUES
  ('7-Day Streak', 'Maintain a 7-day activity streak', '#E88F24', 'streak', 7),
  ('14-Day Streak', 'Maintain a 14-day activity streak', '#E88F24', 'streak', 14),
  ('30-Day Streak', 'Maintain a 30-day activity streak', '#E88F24', 'streak', 30),
  ('First 5K', 'Complete your first 5K run', '#56C4C4', 'workout_milestone', 1),
  ('First Swim', 'Complete your first swim workout', '#EF8C86', 'workout_milestone', 1),
  ('Pack Win', 'Win a pack challenge', '#62B797', 'pack_challenge', 1),
  ('Beast Roar Winner', 'Win a Beast Roar vote', '#E88F24', 'beast_roar', 1),
  ('Century Club', 'Earn 100 beasts on your posts', '#56C4C4', 'beasts_received', 100);

-- SEED DATA: Quests
INSERT INTO quests (title, description, quest_type, xp_reward) VALUES
  ('Complete a 30-min gym session', 'Hit the gym for at least 30 minutes', 'daily', 200),
  ('Run 3K today', 'Complete a 3K run at any pace', 'daily', 150),
  ('Log all 3 meals', 'Track breakfast, lunch, and dinner', 'daily', 100),
  ('Give 5 beasts', 'Support your tribe — beast 5 posts', 'daily', 30),
  ('Hit 10K steps', 'Walk 10,000 steps today', 'daily', 120),
  ('Complete 5 workouts this week', 'Finish 5 workouts in one week', 'weekly', 500),
  ('Try a new sport', 'Complete a workout in a sport you haven''t tried', 'weekly', 300);
