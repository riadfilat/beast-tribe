-- ============================================
-- 026: Communities (forced-membership tribes)
-- - Each user belongs to one community
-- - Communities have their own additional popular_locations
-- - Communities can mark certain packs as "default" (auto-joined)
-- - Pack limit raised to 20 (default packs count toward the 20)
-- ============================================

-- 1. Communities table
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  country TEXT NOT NULL DEFAULT 'SA',
  city TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_communities_active ON communities(is_active);
CREATE INDEX IF NOT EXISTS idx_communities_country ON communities(country);

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS communities_read ON communities;
CREATE POLICY communities_read ON communities FOR SELECT USING (true);

DROP POLICY IF EXISTS communities_admin_write ON communities;
CREATE POLICY communities_admin_write ON communities FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid()));

-- 2. profiles.community_id
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_community ON profiles(community_id) WHERE community_id IS NOT NULL;

-- 3. popular_locations.community_id (NULL = global, otherwise scoped to a community)
ALTER TABLE popular_locations ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_popular_locations_community ON popular_locations(community_id) WHERE community_id IS NOT NULL;

-- Update read policy: visible if global OR matches user's community
DROP POLICY IF EXISTS locations_read ON popular_locations;
DROP POLICY IF EXISTS locations_read_active ON popular_locations;
CREATE POLICY locations_read_active ON popular_locations FOR SELECT USING (
  community_id IS NULL
  OR community_id IN (SELECT community_id FROM profiles WHERE id = auth.uid())
);

-- 4. packs.community_id + is_community_default
ALTER TABLE packs ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id) ON DELETE CASCADE;
ALTER TABLE packs ADD COLUMN IF NOT EXISTS is_community_default BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_packs_community ON packs(community_id) WHERE community_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_packs_community_default ON packs(community_id, is_community_default) WHERE is_community_default = true;

-- 5. Auto-join community default packs when a user is assigned to a community
CREATE OR REPLACE FUNCTION sync_user_community_packs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only act when community_id is being set (not on every update)
  IF NEW.community_id IS DISTINCT FROM OLD.community_id AND NEW.community_id IS NOT NULL THEN
    INSERT INTO pack_members (pack_id, user_id, role, joined_at)
    SELECT p.id, NEW.id, 'member', now()
    FROM packs p
    WHERE p.community_id = NEW.community_id
      AND p.is_community_default = true
    ON CONFLICT (pack_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_community_packs ON profiles;
CREATE TRIGGER trigger_sync_community_packs
  AFTER UPDATE OF community_id ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_community_packs();

-- 6. Helper: when a pack is marked as community_default, retroactively join existing community members
CREATE OR REPLACE FUNCTION sync_community_pack_default()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.is_community_default = true
     AND NEW.community_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.is_community_default = false OR OLD.community_id IS DISTINCT FROM NEW.community_id) THEN
    INSERT INTO pack_members (pack_id, user_id, role, joined_at)
    SELECT NEW.id, p.id, 'member', now()
    FROM profiles p
    WHERE p.community_id = NEW.community_id
    ON CONFLICT (pack_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_pack_default ON packs;
CREATE TRIGGER trigger_sync_pack_default
  AFTER INSERT OR UPDATE OF is_community_default, community_id ON packs
  FOR EACH ROW
  EXECUTE FUNCTION sync_community_pack_default();

-- 7. Pack visibility: community packs visible to community members; global packs (community_id IS NULL) public
DROP POLICY IF EXISTS "Packs are public" ON packs;
DROP POLICY IF EXISTS packs_select ON packs;
CREATE POLICY packs_select ON packs FOR SELECT USING (
  community_id IS NULL
  OR community_id IN (SELECT community_id FROM profiles WHERE id = auth.uid())
  OR auth.uid() = created_by
  OR id IN (SELECT pack_id FROM pack_members WHERE user_id = auth.uid())
);

SELECT 'Communities system installed' AS status;
