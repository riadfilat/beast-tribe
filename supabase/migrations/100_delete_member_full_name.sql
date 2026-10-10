-- 100 · The staff log keeps the deleted member's full name
--
-- In plain words: delete_member() logged the short display name ("Riad"); it now logs the full name.

CREATE OR REPLACE FUNCTION delete_member(p_user UUID) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_name TEXT;
BEGIN
  IF NOT bt_is_super_admin() THEN RAISE EXCEPTION 'SUPER_ADMIN_ONLY'; END IF;
  IF p_user = auth.uid() THEN RAISE EXCEPTION 'NOT_YOURSELF'; END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user) THEN RAISE EXCEPTION 'NO_ACCOUNT'; END IF;
  IF EXISTS (SELECT 1 FROM admin_roles WHERE user_id = p_user) THEN RAISE EXCEPTION 'IS_ADMIN'; END IF;
  IF EXISTS (SELECT 1 FROM community_members WHERE user_id = p_user AND role = 'admin') THEN RAISE EXCEPTION 'IS_LEADER'; END IF;

  SELECT coalesce(nullif(full_name, ''), display_name) INTO v_name FROM profiles WHERE id = p_user;
  INSERT INTO admin_audit_log (admin_user_id, action, target_table, target_id, details)
  VALUES (auth.uid(), 'delete_member', 'profiles', p_user, jsonb_build_object('name', v_name));
  -- The same as "Delete account" in the app: the account goes, and with it everything that is theirs.
  DELETE FROM auth.users WHERE id = p_user;
END $$;
