-- 010_multi_pack.sql
-- Allow users to join up to 4 packs (tribe packs)
-- Previously enforced: one pack per user via unique index on pack_members(user_id)

-- Drop the unique constraint that allowed only one pack per user
DROP INDEX IF EXISTS idx_pack_members_one_pack;

-- Add a regular (non-unique) performance index on user_id
CREATE INDEX IF NOT EXISTS idx_pack_members_user ON pack_members(user_id);

-- The 4-pack-per-user limit is enforced at the application layer in hooks.
