-- ============================================
-- 031: App Store compliance — account deletion + user blocking
-- Required by Apple Guideline 5.1.1(v) (in-app account deletion) and
-- Guideline 1.2 (block abusive users for user-generated content).
-- ============================================

-- ---- 1) In-app account deletion ----
-- A user can permanently delete their own account. Deleting the auth.users row
-- cascades to profiles (ON DELETE CASCADE) and everything that references it.
-- SECURITY DEFINER so it runs with the function owner's rights (access to the
-- auth schema); we hard-scope the delete to the caller's own id.
CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  -- Cascades to profiles and all dependent rows
  DELETE FROM auth.users WHERE id = v_uid;
END $$;

REVOKE ALL ON FUNCTION delete_my_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_my_account() TO authenticated;

-- ---- 2) Block abusive users ----
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);

ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY blocked_users_select_own ON blocked_users
    FOR SELECT USING (blocker_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY blocked_users_insert_own ON blocked_users
    FOR INSERT WITH CHECK (blocker_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY blocked_users_delete_own ON blocked_users
    FOR DELETE USING (blocker_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

SELECT 'Compliance: account deletion fn + blocked_users table installed' AS status;
