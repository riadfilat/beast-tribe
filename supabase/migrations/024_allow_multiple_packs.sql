-- ============================================
-- 024: Allow users to be in multiple packs (up to 4)
-- The one-pack-per-user unique index is too restrictive
-- Enforcement is done in app logic instead
-- ============================================

DROP INDEX IF EXISTS idx_pack_members_one_pack;

SELECT 'Multiple packs per user now allowed!' AS status;
