-- 082: fewer queries per row (N+1 audit, 2026-10-04).

-- ── 1. Players-wanted call-outs: cheap checks first, the level lookup only for who is left ─────────
-- The planner was calling bt_member_sports() and bt_level_of() for every member of the community
-- (everyone, for the open community) before the cheap filters, on each session, every 30 minutes.
CREATE OR REPLACE FUNCTION public.bt_call_players(p_event uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  e events%ROWTYPE;
  v_sport TEXT;
  v_sport_ids UUID[];
  v_need NUMERIC;
  v_round INT;
  v_open INT;
  v_ids UUID[];
BEGIN
  SELECT * INTO e FROM events WHERE id = p_event;
  IF NOT FOUND OR e.cancelled_at IS NOT NULL OR e.max_capacity IS NULL OR e.starts_at < now() + interval '1 hour' THEN
    RETURN 0;
  END IF;
  v_open := e.max_capacity - coalesce(e.going_count, 0);   -- kept by bt_rsvp_after
  IF v_open <= 0 THEN RETURN 0; END IF;
  v_round := e.call_round + 1;
  v_sport := bt_sport_slug(coalesce((SELECT s.name FROM sports s WHERE s.id = e.sport_id), e.event_type));
  v_sport_ids := ARRAY(SELECT s.id FROM sports s WHERE bt_sport_slug(s.name) = v_sport);
  v_need := CASE e.difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 WHEN 'hard' THEN 3 END;

  SELECT array_agg(x.u) INTO v_ids FROM (
    WITH base AS MATERIALIZED (
      SELECT m.user_id
      FROM (
        SELECT cm.user_id FROM community_members cm WHERE e.visibility = 'community' AND cm.community_id = e.community_id
        UNION
        SELECT pm.user_id FROM pack_members pm WHERE e.visibility = 'pack' AND pm.pack_id = e.pack_id
      ) m
      JOIN profiles pr ON pr.id = m.user_id
      WHERE m.user_id <> e.created_by
        AND (NOT e.is_women_only OR lower(pr.gender) = 'female')
        AND (e.visibility <> 'community' OR NOT coalesce(e.open_scope, false) OR e.city_key IS NULL OR bt_city_key(pr.city) = e.city_key)
        AND EXISTS (SELECT 1 FROM user_sports us WHERE us.user_id = m.user_id AND us.sport_id = ANY (v_sport_ids))
        AND NOT EXISTS (SELECT 1 FROM event_rsvps r WHERE r.event_id = e.id AND r.user_id = m.user_id)
        AND NOT EXISTS (SELECT 1 FROM session_calls sc WHERE sc.event_id = e.id AND sc.user_id = m.user_id)
        -- At most 3 call-outs a day: stop counting at the third.
        AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = m.user_id AND n.type = 'players_wanted'
                        AND n.created_at > now() - interval '1 day' OFFSET 2)
    )
    SELECT b.user_id AS u FROM base b
    WHERE v_need IS NULL OR CASE
      WHEN v_round = 1 THEN abs(coalesce(bt_level_of(b.user_id, v_sport), v_need) - v_need) < 0.75
      ELSE coalesce(bt_level_of(b.user_id, v_sport), v_need) >= v_need - 1.25 END
    ORDER BY random()
    LIMIT 60
  ) x;

  UPDATE events SET call_round = v_round, last_call_at = now() WHERE id = e.id;
  IF v_ids IS NULL THEN RETURN 0; END IF;
  INSERT INTO session_calls (event_id, user_id, round) SELECT e.id, u, v_round FROM unnest(v_ids) u ON CONFLICT DO NOTHING;
  PERFORM bt_notify(v_ids, 'players_wanted', e.created_by,
    jsonb_build_object('event_id', e.id, 'event_title', e.title, 'level', e.difficulty, 'open', v_open));
  RETURN array_length(v_ids, 1);
END $function$;

CREATE OR REPLACE FUNCTION public.bt_players_wanted_job()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE r RECORD; n INT := 0;
BEGIN
  IF NOT bt_call_hours() THEN RETURN 0; END IF;
  FOR r IN
    SELECT e.id FROM events e
    WHERE e.max_capacity IS NOT NULL AND e.cancelled_at IS NULL
      AND e.starts_at BETWEEN now() + interval '1 hour' AND now() + interval '3 days'
      AND coalesce(e.last_call_at, '-infinity') < now() - interval '2 hours'
      AND e.call_round < 6
      AND coalesce(e.going_count, 0) < e.max_capacity
  LOOP
    n := n + bt_call_players(r.id);
  END LOOP;
  RETURN n;
END $function$;

CREATE INDEX IF NOT EXISTS idx_notifications_players_wanted ON public.notifications (user_id, created_at) WHERE type = 'players_wanted';

-- ── 2. Sessions to rate: start from my own recent sessions, count people once ─────────────────────
CREATE OR REPLACE FUNCTION public.sessions_to_rate()
RETURNS TABLE(event_id uuid, title text, sport text, ended_at timestamp with time zone, people integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  WITH ids AS (
    SELECT e.id FROM events e WHERE e.created_by = auth.uid() AND e.starts_at BETWEEN now() - interval '4 days' AND now()
    UNION
    SELECT r.event_id FROM event_rsvps r JOIN events e ON e.id = r.event_id
    WHERE r.user_id = auth.uid() AND r.status = 'going' AND e.starts_at BETWEEN now() - interval '4 days' AND now()
  )
  SELECT m.id, m.title, m.event_type, coalesce(m.ends_at, m.starts_at + interval '60 minutes'), p.n
  FROM ids JOIN events m ON m.id = ids.id
  CROSS JOIN LATERAL (
    SELECT count(*)::INT AS n FROM bt_session_people(m.id) x
    WHERE x <> auth.uid() AND NOT EXISTS (SELECT 1 FROM level_ratings r WHERE r.event_id = m.id AND r.rater_id = auth.uid() AND r.ratee_id = x)
  ) p
  WHERE auth.uid() IS NOT NULL
    AND m.cancelled_at IS NULL
    AND coalesce(m.event_type, '') NOT IN ('', 'community', 'other')
    AND coalesce(m.ends_at, m.starts_at + interval '60 minutes') BETWEEN now() - interval '3 days' AND now()
    AND p.n > 0
  ORDER BY 4 DESC
  LIMIT 3
$function$;

-- ── 3. Feed counts stored on the post (was a count query per post; comments were never counted) ──
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS beast_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS comment_count INT NOT NULL DEFAULT 0;
UPDATE public.feed_posts f SET
  beast_count = (SELECT count(*) FROM beasts b WHERE b.post_id = f.id),
  comment_count = (SELECT count(*) FROM feed_comments c WHERE c.post_id = f.id AND c.status IS DISTINCT FROM 'hidden');
GRANT SELECT (beast_count, comment_count) ON public.feed_posts TO authenticated;

CREATE OR REPLACE FUNCTION public.bt_post_beast_count() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_post UUID := coalesce(NEW.post_id, OLD.post_id);
BEGIN
  UPDATE feed_posts SET beast_count = (SELECT count(*) FROM beasts b WHERE b.post_id = v_post) WHERE id = v_post;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_post_beast_count ON public.beasts;
CREATE TRIGGER trg_post_beast_count AFTER INSERT OR DELETE ON public.beasts FOR EACH ROW EXECUTE FUNCTION bt_post_beast_count();

CREATE OR REPLACE FUNCTION public.bt_post_comment_count() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_post UUID := coalesce(NEW.post_id, OLD.post_id);
BEGIN
  UPDATE feed_posts SET comment_count = (SELECT count(*) FROM feed_comments c WHERE c.post_id = v_post AND c.status IS DISTINCT FROM 'hidden') WHERE id = v_post;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_post_comment_count ON public.feed_comments;
CREATE TRIGGER trg_post_comment_count AFTER INSERT OR DELETE OR UPDATE OF status ON public.feed_comments FOR EACH ROW EXECUTE FUNCTION bt_post_comment_count();
REVOKE ALL ON FUNCTION public.bt_post_beast_count(), public.bt_post_comment_count() FROM PUBLIC, anon, authenticated;

-- ── 4. Permission rules: evaluate admin checks once, and only where they apply ─────────────────────
-- communities: the write policy was FOR ALL, so every read also ran it.
DROP POLICY IF EXISTS communities_admin_write ON public.communities;
CREATE POLICY communities_admin_ins ON public.communities FOR INSERT WITH CHECK ((SELECT is_admin()));
CREATE POLICY communities_admin_upd ON public.communities FOR UPDATE USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));
CREATE POLICY communities_admin_del ON public.communities FOR DELETE USING ((SELECT is_admin()));
-- admin_roles: admin_roles_read already covers "my own role" and "admins see all".
ALTER FUNCTION public.has_admin_role(admin_role, uuid) STABLE;
DROP POLICY IF EXISTS "Admins can view roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Users can read their own role" ON public.admin_roles;
ALTER POLICY "Super admins can manage all roles" ON public.admin_roles USING ((SELECT has_admin_role('super_admin'::admin_role)));
-- partners
ALTER POLICY "Admins can manage all partners" ON public.partners USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));
-- feed_comments: duplicates of the _own policies; keep admins' rights, checked once.
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.feed_comments;
DROP POLICY IF EXISTS "Admins can delete comments" ON public.feed_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.feed_comments;
CREATE POLICY feed_comments_admin_delete ON public.feed_comments FOR DELETE TO authenticated USING ((SELECT is_admin()));
CREATE POLICY feed_comments_admin_update ON public.feed_comments FOR UPDATE TO authenticated USING ((SELECT is_admin()));

-- ── 5. Open groups: count members once ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.open_packs()
RETURNS TABLE (id UUID, name TEXT, animal TEXT, emblem_kind TEXT, emblem_value TEXT, emblem_color TEXT, photo_url TEXT,
               audience TEXT, community_id UUID, community_name TEXT, members INT, max_members INT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.name, p.animal, p.emblem_kind, p.emblem_value, p.emblem_color, p.photo_url, p.audience,
         p.community_id, c.name, k.n, coalesce(p.max_members, 20)
  FROM packs p JOIN communities c ON c.id = p.community_id
  CROSS JOIN LATERAL (SELECT count(*)::INT AS n FROM pack_members m WHERE m.pack_id = p.id) k
  WHERE auth.uid() IS NOT NULL
    AND p.visibility = 'open' AND NOT coalesce(p.is_system, false) AND NOT coalesce(p.is_community_default, false)
    AND p.community_id IN (SELECT bt_my_community_ids())
    AND bt_fits_audience(p.audience)
    AND NOT EXISTS (SELECT 1 FROM pack_members m WHERE m.pack_id = p.id AND m.user_id = auth.uid())
  ORDER BY k.n DESC, p.created_at DESC
  LIMIT 50
$$;

-- ── 6. Missing indexes ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_facility_bookings_event ON public.facility_bookings (event_id);
CREATE INDEX IF NOT EXISTS idx_events_facility ON public.events (facility_id) WHERE facility_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications (user_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_session_calls_user ON public.session_calls (user_id);
CREATE INDEX IF NOT EXISTS idx_level_ratings_event ON public.level_ratings (event_id);
