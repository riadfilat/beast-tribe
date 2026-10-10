-- 099 · The super admin can delete a member's account
--
-- In plain words:
-- 1. delete_member(): only the super admin can call it. It refuses to delete yourself, an HQ admin
--    or moderator (remove their role first) or a community leader (hand the community over first).
--    It writes who was deleted, by whom and when to the staff log (name only, no email), then
--    deletes the account exactly like "Delete account" in the app does.
-- 2. Some links blocked ANY account deletion, including members deleting themselves in the app
--    (e.g. anyone who had reported a post or booked a coach). They now let go:
--    - things the person owns go with them: their coach bookings, their photos waiting for review;
--    - things that record what they did for others stay, without their name: businesses and admin
--      roles they created, reports they made, photos they reviewed, measurements they recorded,
--      and staff-log entries they wrote.

-- ─── Links that let an account be deleted ───────────────────────────────────
ALTER TABLE admin_roles DROP CONSTRAINT IF EXISTS admin_roles_created_by_fkey,
  ADD CONSTRAINT admin_roles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE partners DROP CONSTRAINT IF EXISTS partners_created_by_fkey,
  ADD CONSTRAINT partners_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE admin_audit_log ALTER COLUMN admin_user_id DROP NOT NULL;
ALTER TABLE admin_audit_log DROP CONSTRAINT IF EXISTS admin_audit_log_admin_user_id_fkey,
  ADD CONSTRAINT admin_audit_log_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE image_moderation_queue DROP CONSTRAINT IF EXISTS image_moderation_queue_uploaded_by_fkey,
  ADD CONSTRAINT image_moderation_queue_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE image_moderation_queue DROP CONSTRAINT IF EXISTS image_moderation_queue_reviewed_by_fkey,
  ADD CONSTRAINT image_moderation_queue_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE content_reports ALTER COLUMN reporter_id DROP NOT NULL;
ALTER TABLE content_reports DROP CONSTRAINT IF EXISTS content_reports_reporter_id_fkey,
  ADD CONSTRAINT content_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE content_reports DROP CONSTRAINT IF EXISTS content_reports_reviewed_by_fkey,
  ADD CONSTRAINT content_reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE coach_bookings DROP CONSTRAINT IF EXISTS coach_bookings_booked_by_fkey,
  ADD CONSTRAINT coach_bookings_booked_by_fkey FOREIGN KEY (booked_by) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE body_metrics DROP CONSTRAINT IF EXISTS body_metrics_recorded_by_fkey,
  ADD CONSTRAINT body_metrics_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- ─── Delete a member ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION delete_member(p_user UUID) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_name TEXT;
BEGIN
  IF NOT bt_is_super_admin() THEN RAISE EXCEPTION 'SUPER_ADMIN_ONLY'; END IF;
  IF p_user = auth.uid() THEN RAISE EXCEPTION 'NOT_YOURSELF'; END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user) THEN RAISE EXCEPTION 'NO_ACCOUNT'; END IF;
  IF EXISTS (SELECT 1 FROM admin_roles WHERE user_id = p_user) THEN RAISE EXCEPTION 'IS_ADMIN'; END IF;
  IF EXISTS (SELECT 1 FROM community_members WHERE user_id = p_user AND role = 'admin') THEN RAISE EXCEPTION 'IS_LEADER'; END IF;

  SELECT coalesce(nullif(display_name, ''), full_name) INTO v_name FROM profiles WHERE id = p_user;
  INSERT INTO admin_audit_log (admin_user_id, action, target_table, target_id, details)
  VALUES (auth.uid(), 'delete_member', 'profiles', p_user, jsonb_build_object('name', v_name));
  -- The same as "Delete account" in the app: the account goes, and with it everything that is theirs.
  DELETE FROM auth.users WHERE id = p_user;
END $$;

REVOKE ALL ON FUNCTION delete_member(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION delete_member(UUID) TO authenticated;
