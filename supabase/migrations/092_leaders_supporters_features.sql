-- 092 · Leaders, supporters, features, invites and daily activity (the new dashboard, step 1)
--
-- In plain words:
-- 1. A community is run by its LEADERS (stored as role 'admin', shown as "Leader") and their
--    SUPPORTERS (new role 'supporter'). Supporters get no extra rights in the app.
-- 2. FEATURES: each community switches on what it runs (courts, guest passes, 1:1 coaching,
--    nutrition, company teams). Leaders and HQ switch them; everyone may read them.
-- 3. INVITES by email: HQ invites leaders, leaders invite supporters. If the person already has a
--    verified account the role applies at once; otherwise it applies when they verify their email.
-- 4. DAILY ACTIVITY: one row per member per day (city, iPhone/Android, app language) so the
--    command center can count active members and where they are. City only, never the exact
--    place; rows older than 400 days are deleted.
-- 5. ADMINS: only the super admin adds or removes HQ admins and moderators.
-- Existing partners keep what they have: their login becomes the community's leader and their
-- partner type turns into features (a venue keeps its courts).

-- ─── 1. Leaders and supporters ─────────────────────────────────────────────
ALTER TABLE community_members DROP CONSTRAINT IF EXISTS community_members_role_check;
ALTER TABLE community_members ADD CONSTRAINT community_members_role_check CHECK (role IN ('member', 'admin', 'supporter'));

-- 'leader', 'supporter' or null for this person in this community.
-- Compare with IS NOT DISTINCT FROM: null (no role) must never pass a check.
CREATE OR REPLACE FUNCTION bt_team_role(p_community UUID, p_user UUID DEFAULT auth.uid()) RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE role WHEN 'admin' THEN 'leader' WHEN 'supporter' THEN 'supporter' END
  FROM community_members WHERE community_id = p_community AND user_id = p_user AND role IN ('admin', 'supporter')
$$;

-- Beast Tribe HQ: admins and the super admin (not moderators).
CREATE OR REPLACE FUNCTION bt_is_hq(p_user UUID DEFAULT auth.uid()) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM admin_roles WHERE user_id = p_user AND role IN ('admin', 'super_admin'))
$$;

CREATE OR REPLACE FUNCTION bt_is_super_admin(p_user UUID DEFAULT auth.uid()) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM admin_roles WHERE user_id = p_user AND role = 'super_admin')
$$;

-- The communities this person leads or supports (for the dashboard's community switcher).
CREATE OR REPLACE FUNCTION my_teams() RETURNS TABLE (community_id UUID, name TEXT, role TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.name, CASE m.role WHEN 'admin' THEN 'leader' ELSE 'supporter' END
  FROM community_members m JOIN communities c ON c.id = m.community_id
  WHERE m.user_id = auth.uid() AND m.role IN ('admin', 'supporter') AND coalesce(c.is_active, true)
  ORDER BY (m.role = 'admin') DESC, c.name
$$;

-- ─── 2. Features ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_features (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  feature TEXT NOT NULL CHECK (feature IN ('courts', 'guests', 'coaching', 'nutrition', 'teams')),
  enabled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  enabled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, feature)
);
ALTER TABLE community_features ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON community_features FROM anon, authenticated;
GRANT SELECT ON community_features TO authenticated;
DROP POLICY IF EXISTS community_features_read ON community_features;
CREATE POLICY community_features_read ON community_features FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION set_community_feature(p_community UUID, p_feature TEXT, p_on BOOLEAN) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (bt_team_role(p_community) IS NOT DISTINCT FROM 'leader' OR bt_is_hq()) THEN RAISE EXCEPTION 'NOT_LEADER'; END IF;
  IF p_feature NOT IN ('courts', 'guests', 'coaching', 'nutrition', 'teams') THEN RAISE EXCEPTION 'BAD_FEATURE'; END IF;
  IF p_on THEN
    INSERT INTO community_features (community_id, feature, enabled_by) VALUES (p_community, p_feature, auth.uid())
    ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM community_features WHERE community_id = p_community AND feature = p_feature;
  END IF;
END $$;

-- ─── 3. Invites ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(email) <= 200),
  role TEXT NOT NULL CHECK (role IN ('admin', 'supporter')),
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS community_invites_open ON community_invites (community_id, lower(email)) WHERE accepted_at IS NULL;
ALTER TABLE community_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON community_invites FROM anon, authenticated;
GRANT SELECT ON community_invites TO authenticated;
DROP POLICY IF EXISTS community_invites_read ON community_invites;
CREATE POLICY community_invites_read ON community_invites FOR SELECT TO authenticated
  USING (bt_is_hq() OR bt_team_role(community_id) IS NOT DISTINCT FROM 'leader');

-- Give a verified account its role; never lowers a leader to supporter.
CREATE OR REPLACE FUNCTION bt_grant_team_role(p_community UUID, p_user UUID, p_role TEXT) RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO community_members (community_id, user_id, role) VALUES (p_community, p_user, p_role)
  ON CONFLICT (community_id, user_id) DO UPDATE
    SET role = CASE WHEN community_members.role = 'admin' THEN 'admin' ELSE EXCLUDED.role END
$$;
REVOKE ALL ON FUNCTION bt_grant_team_role(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;

-- HQ invites leaders ('admin'); leaders (and HQ) invite supporters.
-- Returns 'added' (verified account found, role given now) or 'invited' (waits for sign-up).
CREATE OR REPLACE FUNCTION invite_to_team(p_community UUID, p_email TEXT, p_role TEXT) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email TEXT := lower(trim(coalesce(p_email, '')));
  v_user UUID;
BEGIN
  IF p_role NOT IN ('admin', 'supporter') THEN RAISE EXCEPTION 'BAD_ROLE'; END IF;
  IF p_role = 'admin' AND NOT bt_is_hq() THEN RAISE EXCEPTION 'HQ_ONLY'; END IF;
  IF p_role = 'supporter' AND NOT (bt_team_role(p_community) IS NOT DISTINCT FROM 'leader' OR bt_is_hq()) THEN RAISE EXCEPTION 'NOT_LEADER'; END IF;
  IF v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'BAD_EMAIL'; END IF;
  IF NOT EXISTS (SELECT 1 FROM communities WHERE id = p_community) THEN RAISE EXCEPTION 'NO_COMMUNITY'; END IF;

  SELECT id INTO v_user FROM auth.users WHERE lower(email) = v_email AND email_confirmed_at IS NOT NULL LIMIT 1;
  IF v_user IS NOT NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = v_user) THEN
    PERFORM bt_grant_team_role(p_community, v_user, p_role);
    INSERT INTO community_invites (community_id, email, role, invited_by, accepted_at, accepted_by)
    VALUES (p_community, v_email, p_role, auth.uid(), now(), v_user);
    RETURN 'added';
  END IF;

  INSERT INTO community_invites (community_id, email, role, invited_by)
  VALUES (p_community, v_email, p_role, auth.uid())
  ON CONFLICT (community_id, lower(email)) WHERE accepted_at IS NULL
  DO UPDATE SET role = CASE WHEN community_invites.role = 'admin' THEN 'admin' ELSE EXCLUDED.role END, invited_by = EXCLUDED.invited_by, created_at = now();
  RETURN 'invited';
END $$;

-- HQ removes anyone from the team; a leader removes supporters. They stay members.
CREATE OR REPLACE FUNCTION remove_from_team(p_community UUID, p_user UUID) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_role TEXT := bt_team_role(p_community, p_user);
BEGIN
  IF v_role IS NULL THEN RETURN; END IF;
  IF NOT (bt_is_hq() OR (v_role = 'supporter' AND bt_team_role(p_community) IS NOT DISTINCT FROM 'leader')) THEN RAISE EXCEPTION 'NOT_ALLOWED'; END IF;
  UPDATE community_members SET role = 'member' WHERE community_id = p_community AND user_id = p_user;
END $$;

CREATE OR REPLACE FUNCTION cancel_team_invite(p_invite UUID) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE i community_invites%ROWTYPE;
BEGIN
  SELECT * INTO i FROM community_invites WHERE id = p_invite AND accepted_at IS NULL;
  IF NOT FOUND THEN RETURN; END IF;
  IF NOT (bt_is_hq() OR (i.role = 'supporter' AND bt_team_role(i.community_id) IS NOT DISTINCT FROM 'leader')) THEN RAISE EXCEPTION 'NOT_ALLOWED'; END IF;
  DELETE FROM community_invites WHERE id = p_invite;
END $$;

-- When an invited person's email is verified (at sign-up for Apple/Google, on confirming for email).
CREATE OR REPLACE FUNCTION bt_apply_team_invites() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE i RECORD;
BEGIN
  IF NEW.email IS NULL OR NEW.email_confirmed_at IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;
  FOR i IN SELECT * FROM public.community_invites WHERE lower(email) = lower(NEW.email) AND accepted_at IS NULL LOOP
    PERFORM public.bt_grant_team_role(i.community_id, NEW.id, i.role);
    UPDATE public.community_invites SET accepted_at = now(), accepted_by = NEW.id WHERE id = i.id;
  END LOOP;
  RETURN NEW;
END $$;
-- Named to run after bt_on_auth_user_created (which makes the profile).
DROP TRIGGER IF EXISTS bt_on_auth_user_invites ON auth.users;
CREATE TRIGGER bt_on_auth_user_invites AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION bt_apply_team_invites();

-- ─── 4. Daily activity ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS member_days (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  city_key TEXT CHECK (city_key IS NULL OR length(city_key) <= 80),
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  locale TEXT CHECK (locale IN ('en', 'ar')),
  seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day)
);
CREATE INDEX IF NOT EXISTS member_days_day ON member_days (day);
ALTER TABLE member_days ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON member_days FROM anon, authenticated;

-- Called by the app when it opens: "seen today, in this city, on this phone, in this language".
CREATE OR REPLACE FUNCTION bt_seen(p_city TEXT, p_platform TEXT, p_locale TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) THEN RETURN; END IF;
  INSERT INTO member_days (user_id, day, city_key, platform, locale)
  VALUES (
    auth.uid(),
    (now() AT TIME ZONE 'Asia/Riyadh')::date,
    left(bt_city_key(p_city), 80),
    CASE WHEN p_platform IN ('ios', 'android', 'web') THEN p_platform END,
    CASE WHEN p_locale IN ('en', 'ar') THEN p_locale END
  )
  ON CONFLICT (user_id, day) DO UPDATE SET
    city_key = coalesce(EXCLUDED.city_key, member_days.city_key),
    platform = coalesce(EXCLUDED.platform, member_days.platform),
    locale = coalesce(EXCLUDED.locale, member_days.locale),
    seen_at = now();
END $$;

SELECT cron.unschedule('member-days-cleanup') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'member-days-cleanup');
SELECT cron.schedule('member-days-cleanup', '30 3 1 * *', 'DELETE FROM public.member_days WHERE day < current_date - 400');

-- ─── 5. HQ admins ──────────────────────────────────────────────────────────
-- Only the super admin adds or removes admins and moderators (never another super admin, never themself).
CREATE OR REPLACE FUNCTION set_admin_role(p_email TEXT, p_role TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID;
BEGIN
  IF NOT bt_is_super_admin() THEN RAISE EXCEPTION 'SUPER_ADMIN_ONLY'; END IF;
  IF p_role IS NOT NULL AND p_role NOT IN ('admin', 'moderator') THEN RAISE EXCEPTION 'BAD_ROLE'; END IF;
  SELECT id INTO v_user FROM auth.users WHERE lower(email) = lower(trim(coalesce(p_email, ''))) AND email_confirmed_at IS NOT NULL LIMIT 1;
  IF v_user IS NULL THEN RAISE EXCEPTION 'NO_ACCOUNT'; END IF;
  IF v_user = auth.uid() THEN RAISE EXCEPTION 'NOT_YOURSELF'; END IF;
  IF EXISTS (SELECT 1 FROM admin_roles WHERE user_id = v_user AND role = 'super_admin') THEN RAISE EXCEPTION 'NOT_SUPER_ADMIN'; END IF;
  DELETE FROM admin_roles WHERE user_id = v_user;
  IF p_role IS NOT NULL THEN
    INSERT INTO admin_roles (user_id, role, created_by) VALUES (v_user, p_role::admin_role, auth.uid());
  END IF;
END $$;

-- ─── Who may call what ─────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION bt_team_role(UUID, UUID), bt_is_hq(UUID), bt_is_super_admin(UUID), my_teams(),
  set_community_feature(UUID, TEXT, BOOLEAN), invite_to_team(UUID, TEXT, TEXT), remove_from_team(UUID, UUID),
  cancel_team_invite(UUID), bt_seen(TEXT, TEXT, TEXT), set_admin_role(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION bt_team_role(UUID, UUID), bt_is_hq(UUID), bt_is_super_admin(UUID), my_teams(),
  set_community_feature(UUID, TEXT, BOOLEAN), invite_to_team(UUID, TEXT, TEXT), remove_from_team(UUID, UUID),
  cancel_team_invite(UUID), bt_seen(TEXT, TEXT, TEXT), set_admin_role(TEXT, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION bt_apply_team_invites() FROM PUBLIC, anon, authenticated;

-- ─── Existing partners become leaders with matching features ────────────────
INSERT INTO community_members (community_id, user_id, role)
SELECT p.community_id, p.user_id, 'admin' FROM partners p
WHERE p.community_id IS NOT NULL AND p.user_id IS NOT NULL AND p.is_active AND EXISTS (SELECT 1 FROM profiles WHERE id = p.user_id)
ON CONFLICT (community_id, user_id) DO UPDATE SET role = 'admin';

INSERT INTO community_features (community_id, feature)
SELECT DISTINCT p.community_id, f.feature
FROM partners p
JOIN LATERAL unnest(CASE p.partner_type
  WHEN 'gym' THEN ARRAY['courts', 'guests', 'teams']
  WHEN 'school' THEN ARRAY['courts', 'guests']
  WHEN 'venue' THEN ARRAY['courts']
  WHEN 'company' THEN ARRAY['teams']
  WHEN 'coach' THEN ARRAY['coaching']
  WHEN 'nutritionist' THEN ARRAY['nutrition']
  ELSE ARRAY[]::text[] END) AS f(feature) ON true
WHERE p.community_id IS NOT NULL AND p.is_active
ON CONFLICT DO NOTHING;
