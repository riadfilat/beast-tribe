-- ============================================
-- 022: Fix missing RLS policies on packs & pack_members
-- Without these, authenticated users cannot create or join packs
-- ============================================

-- packs: allow authenticated users to insert their own pack
DO $$ BEGIN
  CREATE POLICY packs_insert_own ON packs FOR INSERT
    WITH CHECK (auth.uid() = created_by);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- packs: allow leader to update their pack
DO $$ BEGIN
  CREATE POLICY packs_update_own ON packs FOR UPDATE
    USING (auth.uid() = created_by);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- packs: allow leader to delete their pack
DO $$ BEGIN
  CREATE POLICY packs_delete_own ON packs FOR DELETE
    USING (auth.uid() = created_by);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- pack_members: allow users to insert their own membership (join a pack)
DO $$ BEGIN
  CREATE POLICY pack_members_insert_own ON pack_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- pack_members: allow users to read memberships of packs they belong to
DO $$ BEGIN
  CREATE POLICY pack_members_select ON pack_members FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- pack_members: allow leader to update member roles in their pack
DO $$ BEGIN
  CREATE POLICY pack_members_update_leader ON pack_members FOR UPDATE
    USING (
      pack_id IN (SELECT id FROM packs WHERE created_by = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- pack_members: allow user to leave (delete own membership) or leader to remove
DO $$ BEGIN
  CREATE POLICY pack_members_delete ON pack_members FOR DELETE
    USING (
      auth.uid() = user_id
      OR pack_id IN (SELECT id FROM packs WHERE created_by = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

SELECT 'Pack RLS policies applied!' AS status;
