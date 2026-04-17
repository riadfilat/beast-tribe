-- ============================================
-- 009: Operation System — 5-level gamification
-- Replaces Raw/Forged/Untamed with:
--   Initiate → Vanguard → Apex → Prime → Beast
-- XP thresholds:
--   Initiate:  0 – 999
--   Vanguard:  1,000 – 4,999
--   Apex:      5,000 – 14,999
--   Prime:     15,000 – 39,999
--   Beast:     40,000+
-- ============================================

-- Step 1: Drop the old check constraint on tier column
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_tier_check;

-- Step 2: Migrate existing tier values to closest new equivalent
UPDATE profiles SET tier = 'initiate'  WHERE tier = 'raw';
UPDATE profiles SET tier = 'apex'      WHERE tier = 'forged';
UPDATE profiles SET tier = 'beast'     WHERE tier = 'untamed';

-- Step 3: Add new check constraint with all 5 operation values
ALTER TABLE profiles
  ADD CONSTRAINT profiles_tier_check
  CHECK (tier IN ('initiate', 'vanguard', 'apex', 'prime', 'beast'));

-- Step 4: Re-apply correct tiers based on current XP
UPDATE profiles SET tier =
  CASE
    WHEN total_xp >= 40000 THEN 'beast'
    WHEN total_xp >= 15000 THEN 'prime'
    WHEN total_xp >= 5000  THEN 'apex'
    WHEN total_xp >= 1000  THEN 'vanguard'
    ELSE 'initiate'
  END;

-- Step 5: Update the XP recalculation trigger function
CREATE OR REPLACE FUNCTION recalculate_level_and_tier()
RETURNS TRIGGER AS $$
DECLARE
  new_xp    INTEGER;
  new_level INTEGER;
  new_tier  TEXT;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO new_xp
  FROM xp_transactions WHERE user_id = NEW.user_id;

  -- Level: sqrt-based curve, 1–100
  new_level := LEAST(100, GREATEST(1, FLOOR(SQRT(new_xp / 20.0)) + 1));

  -- Operation tier thresholds
  IF    new_xp >= 40000 THEN new_tier := 'beast';
  ELSIF new_xp >= 15000 THEN new_tier := 'prime';
  ELSIF new_xp >= 5000  THEN new_tier := 'apex';
  ELSIF new_xp >= 1000  THEN new_tier := 'vanguard';
  ELSE                       new_tier := 'initiate';
  END IF;

  UPDATE profiles
  SET total_xp = new_xp, level = new_level, tier = new_tier, updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Set default tier for new profile inserts
ALTER TABLE profiles
  ALTER COLUMN tier SET DEFAULT 'initiate';

-- Step 7: Index for new xp sources (beast_given, post_workout, streak)
CREATE INDEX IF NOT EXISTS idx_xp_source_user
  ON xp_transactions(source, user_id, created_at);
