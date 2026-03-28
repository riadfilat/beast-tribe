-- Beast Tribe — Pack Groups (Friend Teams)
-- Extends packs for user-created groups with invite codes

-- ============================================
-- ALTER PACKS TABLE
-- ============================================
ALTER TABLE packs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE packs ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;
ALTER TABLE packs ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;
ALTER TABLE packs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE packs ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 20;

-- Mark existing seeded packs as system packs
UPDATE packs SET is_system = TRUE WHERE created_by IS NULL;

-- Allow authenticated users to create packs
CREATE POLICY "Users can create packs" ON packs FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Pack creator can update" ON packs FOR UPDATE USING (auth.uid() = created_by);

-- ============================================
-- PACK_MEMBERS
-- ============================================
CREATE TABLE pack_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pack_id, user_id)
);

-- One pack per user (user can only be in one friend pack)
CREATE UNIQUE INDEX idx_pack_members_one_pack ON pack_members(user_id);

ALTER TABLE pack_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pack members are public" ON pack_members FOR SELECT USING (true);
CREATE POLICY "Users can join packs" ON pack_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave packs" ON pack_members FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- PACK_INVITES
-- ============================================
CREATE TABLE pack_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id),
  invited_user_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pack_id, invited_user_id)
);

ALTER TABLE pack_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own invites" ON pack_invites FOR SELECT
  USING (auth.uid() = invited_user_id OR auth.uid() = invited_by);
CREATE POLICY "Pack members can invite" ON pack_invites FOR INSERT
  WITH CHECK (auth.uid() = invited_by);
CREATE POLICY "Invited user can respond" ON pack_invites FOR UPDATE
  USING (auth.uid() = invited_user_id);

-- ============================================
-- INVITE CODE GENERATOR
-- ============================================
CREATE OR REPLACE FUNCTION generate_invite_code() RETURNS TEXT AS $$
DECLARE code TEXT;
BEGIN
  LOOP
    code := upper(substr(md5(random()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM packs WHERE invite_code = code);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;
