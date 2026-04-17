-- ============================================
-- 015: Profile enrichment + event difficulty
-- Capture user demographics & experience for personalization
-- ============================================

-- Add city and experience level to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert'));

-- Add difficulty to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard'));
