-- ============================================
-- 008: Per-Sport XP Ranking
-- Adds sport_id to xp_transactions so XP can be
-- filtered by sport for per-sport leaderboards.
-- ============================================

-- Add sport_id column (nullable — not all XP is sport-specific, e.g. streaks, quests)
ALTER TABLE xp_transactions
  ADD COLUMN IF NOT EXISTS sport_id UUID REFERENCES sports(id);

-- Index for fast per-sport leaderboard queries
CREATE INDEX IF NOT EXISTS idx_xp_sport_user
  ON xp_transactions(sport_id, user_id, created_at);

-- Backfill: link existing workout XP to the sport via workout_logs
-- source = 'workout' and source_id = workout_id → look up sport_id from workout_logs
UPDATE xp_transactions xt
SET sport_id = wl.sport_id
FROM workout_logs wl
WHERE xt.source = 'workout'
  AND xt.sport_id IS NULL
  AND wl.user_id = xt.user_id
  AND wl.workout_id = xt.source_id
  AND wl.sport_id IS NOT NULL;
