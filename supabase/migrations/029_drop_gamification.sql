-- ============================================
-- 029: Remove ALL gamification (app simplification)
-- Drops XP, levels, tiers, beast score, streaks, badges, quests, habits.
-- Keeps: chat-room triggers, community sync, comment counts, admin, invite code.
-- ============================================

-- 1. Drop the XP recalc trigger + its function (references profiles.level/tier)
DROP TRIGGER IF EXISTS trg_xp_recalc ON xp_transactions;
DROP FUNCTION IF EXISTS recalculate_level_and_tier() CASCADE;

-- 2. Drop gamification tables (CASCADE handles FKs/child rows/triggers)
DROP TABLE IF EXISTS xp_transactions CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS user_quests CASCADE;
DROP TABLE IF EXISTS quests CASCADE;
DROP TABLE IF EXISTS beast_scores CASCADE;
DROP TABLE IF EXISTS habit_logs CASCADE;
DROP TABLE IF EXISTS user_habits CASCADE;
DROP TABLE IF EXISTS habit_definitions CASCADE;

-- 3. Drop gamification columns from profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS total_xp CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS level CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS tier CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS current_streak CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS longest_streak CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS beast_score CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS training_frequency CASCADE;

SELECT 'Gamification fully removed from database' AS status;
