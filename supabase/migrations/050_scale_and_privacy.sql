-- 050 Scale and privacy
-- Measured against 20,000 simulated members (scripts/scale/simulate.js) before applying.
--  1. Access rules no longer re-check the signed-in user, or the admin list, on every row.
--  2. "Who's going", reactions and comments no longer scan every session / post per query.
--  3. Missing indexes on the busy lookups; duplicate indexes dropped.
--  4. Profiles: other members only ever see name and photo. Date of birth, gender, goals and the
--     rest are readable only by their owner (my_profile). Signed-out visitors read nothing.
--  5. The Board is scoped to the member's city for open communities (events.city_key / open_scope).
--  6. Push notifications are sent in batches of 100 (Expo's limit per request).
--  7. Challenge rankings return the top rows plus the caller's own, not every entrant.
--  8. Join codes: ten wrong tries an hour, then a pause.

-- ════ 1. Admin check and visible communities, once per query ════
ALTER FUNCTION is_admin(uuid) STABLE;

CREATE OR REPLACE FUNCTION bt_visible_community_ids() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM communities WHERE visibility = 'open' AND is_active
  UNION
  SELECT community_id FROM community_members WHERE user_id = auth.uid()
$$;
REVOKE ALL ON FUNCTION bt_visible_community_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION bt_visible_community_ids() TO authenticated, service_role;

-- ════ 2. Hot read rules, rewritten ════
DROP POLICY IF EXISTS events_select ON events;
CREATE POLICY events_select ON events FOR SELECT USING (
  created_by = (SELECT auth.uid())
  OR (visibility = 'pack' AND pack_id IN (SELECT bt_my_pack_ids()))
  OR (visibility = 'community' AND community_id IN (SELECT bt_visible_community_ids()))
  OR (SELECT is_admin())
);

DROP POLICY IF EXISTS feed_posts_select ON feed_posts;
CREATE POLICY feed_posts_select ON feed_posts FOR SELECT USING (
  user_id = (SELECT auth.uid())
  OR (is_visible AND community_id IN (SELECT bt_visible_community_ids()))
  OR (SELECT is_admin())
);

-- These three used "id IN (SELECT id FROM <the whole table>)": a full scan per query.
DROP POLICY IF EXISTS event_rsvps_select ON event_rsvps;
CREATE POLICY event_rsvps_select ON event_rsvps FOR SELECT USING (
  user_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM events e WHERE e.id = event_rsvps.event_id)
);

DROP POLICY IF EXISTS beasts_select ON beasts;
CREATE POLICY beasts_select ON beasts FOR SELECT USING (
  user_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM feed_posts f WHERE f.id = beasts.post_id)
);

DROP POLICY IF EXISTS feed_comments_select ON feed_comments;
CREATE POLICY feed_comments_select ON feed_comments FOR SELECT USING (
  user_id = (SELECT auth.uid())
  OR (SELECT is_admin())
  OR (status IS DISTINCT FROM 'hidden'::comment_status AND EXISTS (SELECT 1 FROM feed_posts f WHERE f.id = feed_comments.post_id))
);

DROP POLICY IF EXISTS "Public can view active partners" ON partners;
CREATE POLICY "Public can view active partners" ON partners FOR SELECT USING (
  status = 'active'::partner_status
  AND (community_id IS NULL OR community_id IN (SELECT bt_visible_community_ids()) OR (SELECT is_admin()))
);

DROP POLICY IF EXISTS locations_read_active ON popular_locations;
CREATE POLICY locations_read_active ON popular_locations FOR SELECT USING (
  community_id IS NULL OR community_id IN (SELECT bt_visible_community_ids()) OR (SELECT is_admin())
);

-- Who the admins are is nobody else's business.
DROP POLICY IF EXISTS "Admins can read admin_roles" ON admin_roles;
CREATE POLICY admin_roles_read ON admin_roles FOR SELECT USING (user_id = (SELECT auth.uid()) OR (SELECT is_admin()));

-- Every other rule: evaluate auth.uid() and the admin check once per statement instead of per row.
DO $$
DECLARE
  r RECORD;
  q TEXT;
  w TEXT;
BEGIN
  FOR r IN SELECT tablename, policyname, qual, with_check FROM pg_policies WHERE schemaname = 'public' LOOP
    q := r.qual;
    w := r.with_check;
    IF q IS NOT NULL THEN
      q := regexp_replace(q, 'is_admin\(auth\.uid\(\)\)', '(SELECT is_admin())', 'g');
      q := regexp_replace(q, '(?<!SELECT )auth\.uid\(\)', '(SELECT auth.uid())', 'g');
    END IF;
    IF w IS NOT NULL THEN
      w := regexp_replace(w, 'is_admin\(auth\.uid\(\)\)', '(SELECT is_admin())', 'g');
      w := regexp_replace(w, '(?<!SELECT )auth\.uid\(\)', '(SELECT auth.uid())', 'g');
    END IF;
    IF q IS DISTINCT FROM r.qual OR w IS DISTINCT FROM r.with_check THEN
      EXECUTE format('ALTER POLICY %I ON public.%I %s %s', r.policyname, r.tablename,
        CASE WHEN q IS NOT NULL THEN 'USING (' || q || ')' ELSE '' END,
        CASE WHEN w IS NOT NULL THEN 'WITH CHECK (' || w || ')' ELSE '' END);
    END IF;
  END LOOP;
END $$;

-- ════ 3. Indexes ════
CREATE INDEX IF NOT EXISTS idx_events_country_starts ON events (country, starts_at);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events (created_by);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor ON notifications (actor_id);
CREATE INDEX IF NOT EXISTS idx_pack_invites_invited ON pack_invites (invited_user_id, status);
CREATE INDEX IF NOT EXISTS idx_pack_invites_by ON pack_invites (invited_by);
CREATE INDEX IF NOT EXISTS idx_partners_community ON partners (community_id);
CREATE INDEX IF NOT EXISTS idx_packs_created_by ON packs (created_by);
CREATE INDEX IF NOT EXISTS idx_packs_community ON packs (community_id) WHERE community_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_packs_code ON packs (upper(invite_code));
CREATE INDEX IF NOT EXISTS idx_communities_code ON communities (upper(join_code));
CREATE INDEX IF NOT EXISTS idx_workout_logs_event ON workout_logs (event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feed_posts_workout_log ON feed_posts (workout_log_id) WHERE workout_log_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trainee_privacy_coach ON trainee_privacy (coach_id);
CREATE INDEX IF NOT EXISTS idx_community_partners_partner ON community_partners (partner_id);
CREATE INDEX IF NOT EXISTS idx_challenges_partner ON challenges (partner_id);
-- Name search ("invite by name") stays fast with many members.
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE INDEX IF NOT EXISTS idx_profiles_display_trgm ON profiles USING gin (display_name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_full_trgm ON profiles USING gin (full_name extensions.gin_trgm_ops);
-- Exact duplicates of other indexes: they only slow writes down.
DROP INDEX IF EXISTS idx_events_starts_at;
DROP INDEX IF EXISTS events_community_idx;
DROP INDEX IF EXISTS idx_event_rsvps_event;
DROP INDEX IF EXISTS idx_feed_posts_visible_created;
DROP INDEX IF EXISTS feed_posts_community_idx;
DROP INDEX IF EXISTS idx_feed_comments_post_id;
DROP INDEX IF EXISTS idx_feed_comments_user_id;
DROP INDEX IF EXISTS workout_logs_user_idx;

-- ════ 4. Profiles: name and photo for others, everything for the owner ════
CREATE OR REPLACE FUNCTION my_profile() RETURNS SETOF profiles
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM profiles WHERE id = auth.uid()
$$;
REVOKE ALL ON FUNCTION my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION my_profile() TO authenticated;

REVOKE SELECT ON profiles FROM anon, authenticated;
GRANT SELECT (id, full_name, display_name, avatar_url, created_at) ON profiles TO authenticated;

-- The app's public key is in every copy of the app: signed-out visitors get no table access at all.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;

-- ════ 5. Board by city ════
-- city_key: the session's city, normalised. open_scope: true when the session sits in an open
-- community (anyone's Board), false for private communities and packs (always on their members' Board).
ALTER TABLE events ADD COLUMN IF NOT EXISTS city_key TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS open_scope BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION bt_city_key(p TEXT) RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT nullif(lower(regexp_replace(trim(coalesce(p, '')), '\s+', ' ', 'g')), '')
$$;

CREATE OR REPLACE FUNCTION bt_events_scope() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.city_key := bt_city_key(NEW.location_city);
  NEW.open_scope := NEW.visibility = 'community'
    AND EXISTS (SELECT 1 FROM communities c WHERE c.id = NEW.community_id AND c.visibility = 'open');
  RETURN NEW;
END $$;
-- Named to sort after trg_events_guard, which fills in the community first.
DROP TRIGGER IF EXISTS trg_events_scope ON events;
CREATE TRIGGER trg_events_scope BEFORE INSERT OR UPDATE OF location_city, visibility, community_id, pack_id ON events
  FOR EACH ROW EXECUTE FUNCTION bt_events_scope();

CREATE OR REPLACE FUNCTION bt_community_scope_sync() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.visibility IS DISTINCT FROM OLD.visibility THEN
    UPDATE events SET open_scope = (visibility = 'community' AND NEW.visibility = 'open') WHERE community_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_community_scope_sync ON communities;
CREATE TRIGGER trg_community_scope_sync AFTER UPDATE OF visibility ON communities
  FOR EACH ROW EXECUTE FUNCTION bt_community_scope_sync();

UPDATE events e SET
  city_key = bt_city_key(e.location_city),
  open_scope = (e.visibility = 'community' AND EXISTS (SELECT 1 FROM communities c WHERE c.id = e.community_id AND c.visibility = 'open'));
CREATE INDEX IF NOT EXISTS idx_events_board ON events (country, open_scope, city_key, starts_at);

-- ════ 6. Push in batches of 100 ════
CREATE OR REPLACE FUNCTION bt_notify(p_user_ids uuid[], p_type text, p_actor uuid, p_data jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor_name TEXT;
  v_batch JSONB;
BEGIN
  IF p_user_ids IS NULL OR coalesce(array_length(p_user_ids, 1), 0) = 0 THEN
    RETURN;
  END IF;
  IF p_actor IS NOT NULL THEN
    SELECT coalesce(display_name, full_name) INTO v_actor_name FROM profiles WHERE id = p_actor;
  END IF;

  INSERT INTO notifications (user_id, type, actor_id, data)
  SELECT DISTINCT u, p_type, p_actor, p_data || jsonb_build_object('actor_name', v_actor_name)
  FROM unnest(p_user_ids) AS u
  WHERE u IS NOT NULL AND u IS DISTINCT FROM p_actor;

  FOR v_batch IN
    SELECT jsonb_agg(x.msg)
    FROM (
      SELECT jsonb_build_object(
               'to', pt.token,
               'sound', 'default',
               'title', coalesce(p_data->>'event_title', CASE WHEN pr.locale = 'ar' THEN 'بيست ترايب' ELSE 'Beast Tribe' END),
               'body', bt_push_body(p_type, pr.locale, v_actor_name),
               'data', p_data || jsonb_build_object('type', p_type)
             ) AS msg,
             (row_number() OVER (ORDER BY pt.token) - 1) / 100 AS grp
      FROM push_tokens pt
      JOIN profiles pr ON pr.id = pt.user_id
      WHERE pt.user_id = ANY (p_user_ids) AND pt.user_id IS DISTINCT FROM p_actor
    ) x
    GROUP BY x.grp
  LOOP
    PERFORM net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := v_batch
    );
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION bt_notify(UUID[], TEXT, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION bt_notify(UUID[], TEXT, UUID, JSONB) TO service_role;

-- ════ 7. Challenge ranking: the top rows and the caller's own ════
DROP FUNCTION IF EXISTS challenge_board(UUID);
CREATE OR REPLACE FUNCTION challenge_board(p_challenge UUID, p_limit INT DEFAULT 100)
RETURNS TABLE (user_id UUID, name TEXT, avatar_url TEXT, steps BIGINT, days_active INT, place INT, entrants INT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_c challenges%ROWTYPE;
BEGIN
  SELECT * INTO v_c FROM challenges WHERE id = p_challenge;
  IF NOT FOUND THEN RETURN; END IF;
  IF auth.uid() IS NOT NULL AND NOT is_admin(auth.uid()) AND NOT EXISTS (
    SELECT 1 FROM community_members m WHERE m.community_id = v_c.community_id AND m.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'NOT_MEMBER' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  WITH totals AS (
    SELECT e.user_id,
           coalesce(sum(a.steps), 0)::BIGINT AS steps,
           count(a.day) FILTER (WHERE a.steps > 0)::INT AS days_active
    FROM challenge_entries e
    LEFT JOIN daily_activity a ON a.user_id = e.user_id AND a.day BETWEEN v_c.starts_on AND least(v_c.ends_on, current_date)
    WHERE e.challenge_id = p_challenge
    GROUP BY e.user_id
  ), ranked AS (
    SELECT t.*, (rank() OVER (ORDER BY t.steps DESC))::INT AS place, (count(*) OVER ())::INT AS entrants,
           row_number() OVER (ORDER BY t.steps DESC, t.user_id) AS rn
    FROM totals t
  )
  SELECT r.user_id, coalesce(p.display_name, p.full_name, 'Member'), p.avatar_url, r.steps, r.days_active, r.place, r.entrants
  FROM ranked r JOIN profiles p ON p.id = r.user_id
  WHERE r.rn <= greatest(1, least(coalesce(p_limit, 100), 500)) OR r.user_id = auth.uid()
  ORDER BY r.rn;
END $$;
REVOKE ALL ON FUNCTION challenge_board(UUID, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION challenge_board(UUID, INT) TO authenticated, service_role;

-- ════ 8. Join codes: ten wrong tries an hour ════
-- A wrong code now returns no row (instead of raising), so the failed try can be recorded.
CREATE TABLE IF NOT EXISTS code_attempts (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_code_attempts_user ON code_attempts (user_id, at);
ALTER TABLE code_attempts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION bt_code_guard() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM code_attempts WHERE user_id = auth.uid() AND at > now() - interval '1 hour') >= 10 THEN
    RAISE EXCEPTION 'TOO_MANY' USING ERRCODE = '42501';
  END IF;
END $$;
REVOKE ALL ON FUNCTION bt_code_guard() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION join_community_by_code(p_code TEXT) RETURNS TABLE (id UUID, name TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_c communities%ROWTYPE;
  v_seats INT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN'; END IF;
  PERFORM bt_code_guard();
  SELECT * INTO v_c FROM communities c WHERE upper(c.join_code) = upper(trim(p_code)) AND c.is_active;
  IF NOT FOUND THEN
    INSERT INTO code_attempts (user_id) VALUES (auth.uid());
    RETURN;
  END IF;
  IF v_c.contract_ends_at IS NOT NULL AND v_c.contract_ends_at < now() THEN RAISE EXCEPTION 'EXPIRED'; END IF;
  IF EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = v_c.id AND m.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'ALREADY';
  END IF;
  IF v_c.seat_limit IS NOT NULL THEN
    SELECT count(*) INTO v_seats FROM community_members m WHERE m.community_id = v_c.id;
    IF v_seats >= v_c.seat_limit THEN RAISE EXCEPTION 'FULL'; END IF;
  END IF;
  INSERT INTO community_members (community_id, user_id) VALUES (v_c.id, auth.uid());
  RETURN QUERY SELECT v_c.id, v_c.name;
END $$;

CREATE OR REPLACE FUNCTION join_pack_by_code(p_code TEXT) RETURNS TABLE (id UUID, name TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_p packs%ROWTYPE;
  v_size INT;
  v_mine INT;
  v_gender TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN'; END IF;
  PERFORM bt_code_guard();
  SELECT * INTO v_p FROM packs pk WHERE upper(pk.invite_code) = upper(trim(p_code)) AND NOT coalesce(pk.is_system, false);
  IF NOT FOUND THEN
    INSERT INTO code_attempts (user_id) VALUES (auth.uid());
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM pack_members m WHERE m.pack_id = v_p.id AND m.user_id = auth.uid()) THEN RAISE EXCEPTION 'ALREADY'; END IF;
  IF v_p.audience <> 'everyone' THEN
    SELECT lower(gender) INTO v_gender FROM profiles WHERE profiles.id = auth.uid();
    IF v_gender IS NULL THEN RAISE EXCEPTION 'PACK_GENDER_NEEDED'; END IF;
    IF NOT ((v_p.audience = 'women' AND v_gender = 'female') OR (v_p.audience = 'men' AND v_gender = 'male')) THEN
      RAISE EXCEPTION '%', CASE v_p.audience WHEN 'women' THEN 'PACK_WOMEN_ONLY' ELSE 'PACK_MEN_ONLY' END;
    END IF;
  END IF;
  SELECT count(*) INTO v_size FROM pack_members m WHERE m.pack_id = v_p.id;
  IF v_size >= coalesce(v_p.max_members, 20) THEN RAISE EXCEPTION 'FULL'; END IF;
  SELECT count(*) INTO v_mine FROM pack_members m WHERE m.user_id = auth.uid();
  IF v_mine >= 20 THEN RAISE EXCEPTION 'LIMIT'; END IF;
  INSERT INTO pack_members (pack_id, user_id, role) VALUES (v_p.id, auth.uid(), 'member');
  RETURN QUERY SELECT v_p.id, v_p.name;
END $$;
REVOKE ALL ON FUNCTION join_community_by_code(TEXT), join_pack_by_code(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION join_community_by_code(TEXT), join_pack_by_code(TEXT) TO authenticated;
