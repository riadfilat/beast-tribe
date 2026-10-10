-- 096 · The HQ command center's numbers (the new dashboard, step 3)
--
-- In plain words: a few small functions that count what is happening across Beast Tribe for the
-- super admin and admins (never moderators, leaders or members): who is active today, sessions and
-- players today and over the next 7 days, where members are (by city), how each community is doing,
-- what needs attention, what people play and which phones they use. A city can be passed to see one
-- city only. "Active" = opened the app (member_days), joined a session or posted that day.

-- Riyadh's today, and a city name in the form events and member_days store it.
CREATE OR REPLACE FUNCTION bt_riyadh_today() RETURNS DATE LANGUAGE sql STABLE AS $$ SELECT (now() AT TIME ZONE 'Asia/Riyadh')::date $$;

CREATE OR REPLACE FUNCTION bt_require_hq() RETURNS VOID
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT bt_is_hq() THEN RAISE EXCEPTION 'HQ_ONLY'; END IF;
END $$;

-- Everyone active on a day: opened the app, booked a session or posted. With their city key.
CREATE OR REPLACE FUNCTION bt_active_on(p_from DATE, p_to DATE) RETURNS TABLE (user_id UUID, city_key TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.user_id, d.city_key FROM member_days d WHERE d.day BETWEEN p_from AND p_to
  UNION
  SELECT r.user_id, bt_city_key(p.city) FROM event_rsvps r JOIN profiles p ON p.id = r.user_id
  WHERE (r.created_at AT TIME ZONE 'Asia/Riyadh')::date BETWEEN p_from AND p_to
  UNION
  SELECT f.user_id, bt_city_key(p.city) FROM feed_posts f JOIN profiles p ON p.id = f.user_id
  WHERE (f.created_at AT TIME ZONE 'Asia/Riyadh')::date BETWEEN p_from AND p_to
$$;
REVOKE ALL ON FUNCTION bt_active_on(DATE, DATE) FROM PUBLIC, anon, authenticated;

-- ─── The live strip ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION hq_live(p_city TEXT DEFAULT NULL) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t DATE := bt_riyadh_today();
  k TEXT := bt_city_key(p_city);
BEGIN
  PERFORM bt_require_hq();
  RETURN jsonb_build_object(
    'active_today', (SELECT count(DISTINCT user_id) FROM bt_active_on(t, t) a WHERE k IS NULL OR a.city_key = k),
    'active_week', (SELECT count(DISTINCT user_id) FROM bt_active_on(t - 6, t) a WHERE k IS NULL OR a.city_key = k),
    'active_prev_week', (SELECT count(DISTINCT user_id) FROM bt_active_on(t - 13, t - 7) a WHERE k IS NULL OR a.city_key = k),
    'sessions_today', (SELECT count(*) FROM events e WHERE e.cancelled_at IS NULL AND (e.starts_at AT TIME ZONE 'Asia/Riyadh')::date = t AND (k IS NULL OR e.city_key = k)),
    'live_now', (SELECT count(*) FROM events e WHERE e.cancelled_at IS NULL AND e.starts_at <= now() AND coalesce(e.ends_at, e.starts_at + interval '1 hour') > now() AND (k IS NULL OR e.city_key = k)),
    'players_today', (SELECT count(*) FROM event_rsvps r JOIN events e ON e.id = r.event_id WHERE r.status = 'going' AND e.cancelled_at IS NULL AND (e.starts_at AT TIME ZONE 'Asia/Riyadh')::date = t AND (k IS NULL OR e.city_key = k)),
    'new_members_week', (SELECT count(*) FROM profiles p WHERE p.created_at > now() - interval '7 days' AND (k IS NULL OR bt_city_key(p.city) = k)),
    'new_members_prev_week', (SELECT count(*) FROM profiles p WHERE p.created_at <= now() - interval '7 days' AND p.created_at > now() - interval '14 days' AND (k IS NULL OR bt_city_key(p.city) = k)),
    'members', (SELECT count(*) FROM profiles p WHERE k IS NULL OR bt_city_key(p.city) = k),
    'communities', (SELECT count(*) FROM communities c WHERE coalesce(c.is_active, true) AND NOT coalesce(c.is_default, false) AND (k IS NULL OR bt_city_key(c.city) = k)),
    'requests_waiting', (SELECT count(*) FROM partner_leads l WHERE l.status = 'new' AND (k IS NULL OR bt_city_key(l.city) = k))
  );
END $$;

-- ─── The next 7 days: sessions, players, and sessions by 2-hour block ───────
CREATE OR REPLACE FUNCTION hq_days(p_city TEXT DEFAULT NULL) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE t DATE := bt_riyadh_today(); k TEXT := bt_city_key(p_city);
BEGIN
  PERFORM bt_require_hq();
  RETURN (
    WITH ev AS (
      SELECT e.id, (e.starts_at AT TIME ZONE 'Asia/Riyadh') AS local,
             (SELECT count(*) FROM event_rsvps r WHERE r.event_id = e.id AND r.status = 'going') AS players
      FROM events e
      WHERE e.cancelled_at IS NULL AND (e.starts_at AT TIME ZONE 'Asia/Riyadh')::date BETWEEN t AND t + 6 AND (k IS NULL OR e.city_key = k)
    )
    SELECT jsonb_agg(jsonb_build_object(
      'day', d,
      'sessions', (SELECT count(*) FROM ev WHERE local::date = d),
      'players', (SELECT coalesce(sum(players), 0) FROM ev WHERE local::date = d),
      'blocks', (SELECT jsonb_agg((SELECT count(*) FROM ev WHERE local::date = d AND extract(hour FROM local)::int / 2 = b) ORDER BY b) FROM generate_series(0, 11) b)
    ) ORDER BY d)
    FROM (SELECT (t + i) AS d FROM generate_series(0, 6) i) days
  );
END $$;

-- ─── One day's sessions, for the timeline ──────────────────────────────────
CREATE OR REPLACE FUNCTION hq_day_sessions(p_day DATE, p_city TEXT DEFAULT NULL) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE k TEXT := bt_city_key(p_city);
BEGIN
  PERFORM bt_require_hq();
  RETURN coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'id', e.id, 'title', e.title, 'sport', e.event_type,
      'hour', round(extract(hour FROM e.starts_at AT TIME ZONE 'Asia/Riyadh') + extract(minute FROM e.starts_at AT TIME ZONE 'Asia/Riyadh') / 60.0, 2),
      'minutes', greatest(15, round(extract(epoch FROM coalesce(e.ends_at, e.starts_at + interval '1 hour') - e.starts_at) / 60)),
      'going', (SELECT count(*) FROM event_rsvps r WHERE r.event_id = e.id AND r.status = 'going'),
      'capacity', e.max_capacity, 'community', c.name, 'city', e.city_key
    ) ORDER BY e.starts_at)
    FROM events e LEFT JOIN communities c ON c.id = e.community_id
    WHERE e.cancelled_at IS NULL AND (e.starts_at AT TIME ZONE 'Asia/Riyadh')::date = p_day AND (k IS NULL OR e.city_key = k)
  ), '[]'::jsonb);
END $$;

-- ─── Where members are: members and active this week by city ───────────────
CREATE OR REPLACE FUNCTION hq_cities() RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE t DATE := bt_riyadh_today();
BEGIN
  PERFORM bt_require_hq();
  RETURN coalesce((
    WITH members AS (SELECT bt_city_key(city) AS k, count(*) AS n FROM profiles WHERE bt_city_key(city) IS NOT NULL GROUP BY 1),
    active AS (SELECT city_key AS k, count(DISTINCT user_id) AS n FROM bt_active_on(t - 6, t) WHERE city_key IS NOT NULL GROUP BY 1),
    live AS (SELECT city_key AS k, count(*) AS n FROM events WHERE cancelled_at IS NULL AND starts_at <= now() AND coalesce(ends_at, starts_at + interval '1 hour') > now() AND city_key IS NOT NULL GROUP BY 1)
    SELECT jsonb_agg(jsonb_build_object('city', k, 'members', coalesce(m.n, 0), 'active', coalesce(a.n, 0), 'live', coalesce(l.n, 0)) ORDER BY coalesce(m.n, 0) DESC)
    FROM (SELECT k FROM members UNION SELECT k FROM active UNION SELECT k FROM live) cities
    LEFT JOIN members m USING (k) LEFT JOIN active a USING (k) LEFT JOIN live l USING (k)
  ), '[]'::jsonb);
END $$;

-- ─── Every community: leaders, members, sessions, spots filled, 7-week trend, health ───
CREATE OR REPLACE FUNCTION hq_communities(p_city TEXT DEFAULT NULL) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE k TEXT := bt_city_key(p_city);
BEGIN
  PERFORM bt_require_hq();
  RETURN coalesce((
    WITH ev AS (
      SELECT e.community_id, e.starts_at, e.max_capacity,
             (SELECT count(*) FROM event_rsvps r WHERE r.event_id = e.id AND r.status = 'going') AS players
      FROM events e WHERE e.cancelled_at IS NULL AND e.starts_at > now() - interval '49 days' AND e.starts_at <= now() + interval '7 days'
    )
    SELECT jsonb_agg(jsonb_build_object(
      'id', c.id, 'name', c.name, 'kind', c.kind, 'city', c.city,
      'leaders', (SELECT coalesce(jsonb_agg(coalesce(p.display_name, p.full_name)), '[]'::jsonb) FROM community_members m JOIN profiles p ON p.id = m.user_id WHERE m.community_id = c.id AND m.role = 'admin'),
      'supporters', (SELECT count(*) FROM community_members m WHERE m.community_id = c.id AND m.role = 'supporter'),
      'members', (SELECT count(*) FROM community_members m WHERE m.community_id = c.id AND m.role = 'member'),
      'sessions_week', (SELECT count(*) FROM ev WHERE ev.community_id = c.id AND ev.starts_at <= now() AND ev.starts_at > now() - interval '7 days'),
      'upcoming_week', (SELECT count(*) FROM ev WHERE ev.community_id = c.id AND ev.starts_at > now()),
      'fill', (SELECT round(avg(least(1, players::numeric / max_capacity)), 2) FROM ev WHERE ev.community_id = c.id AND ev.starts_at <= now() AND ev.starts_at > now() - interval '28 days' AND max_capacity > 0),
      'weekly', (SELECT jsonb_agg((SELECT count(*) FROM ev WHERE ev.community_id = c.id AND ev.starts_at <= now() - (w * interval '7 days') AND ev.starts_at > now() - ((w + 1) * interval '7 days')) ORDER BY w DESC) FROM generate_series(0, 6) w),
      'recent', (SELECT count(*) FROM ev WHERE ev.community_id = c.id AND ev.starts_at <= now() AND ev.starts_at > now() - interval '14 days'),
      'before', (SELECT count(*) FROM ev WHERE ev.community_id = c.id AND ev.starts_at <= now() - interval '14 days' AND ev.starts_at > now() - interval '28 days'),
      'features', (SELECT coalesce(jsonb_agg(f.feature ORDER BY f.feature), '[]'::jsonb) FROM community_features f WHERE f.community_id = c.id)
    ) ORDER BY c.name)
    FROM communities c
    WHERE coalesce(c.is_active, true) AND NOT coalesce(c.is_default, false) AND (k IS NULL OR bt_city_key(c.city) = k)
  ), '[]'::jsonb);
END $$;

-- ─── Needs attention ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION hq_attention() RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM bt_require_hq();
  RETURN jsonb_build_object(
    'courts_unbooked', coalesce((SELECT jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title, 'starts_at', e.starts_at, 'community', c.name) ORDER BY e.starts_at)
        FROM events e LEFT JOIN communities c ON c.id = e.community_id
        WHERE e.court_booking = 'pending' AND e.cancelled_at IS NULL AND e.starts_at > now() AND e.starts_at < now() + interval '12 hours'), '[]'::jsonb),
    'empty_soon', coalesce((SELECT jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title, 'starts_at', e.starts_at, 'community', c.name) ORDER BY e.starts_at)
        FROM events e LEFT JOIN communities c ON c.id = e.community_id
        WHERE e.cancelled_at IS NULL AND e.starts_at > now() AND e.starts_at < now() + interval '6 hours'
          AND NOT EXISTS (SELECT 1 FROM event_rsvps r WHERE r.event_id = e.id AND r.status = 'going' AND r.user_id <> e.created_by)), '[]'::jsonb),
    'requests', (SELECT count(*) FROM partner_leads WHERE status = 'new'),
    'reports', (SELECT count(*) FROM content_reports WHERE status = 'pending'),
    'photos', (SELECT count(*) FROM image_moderation_queue WHERE status = 'pending'),
    'slowing', coalesce((SELECT jsonb_agg(jsonb_build_object('id', x.id, 'name', x.name, 'recent', x.recent, 'before', x.before)) FROM (
        SELECT c.id, c.name,
          (SELECT count(*) FROM events e WHERE e.community_id = c.id AND e.cancelled_at IS NULL AND e.starts_at <= now() AND e.starts_at > now() - interval '14 days') AS recent,
          (SELECT count(*) FROM events e WHERE e.community_id = c.id AND e.cancelled_at IS NULL AND e.starts_at <= now() - interval '14 days' AND e.starts_at > now() - interval '28 days') AS before
        FROM communities c WHERE coalesce(c.is_active, true) AND NOT coalesce(c.is_default, false)) x
      WHERE x.before >= 2 AND x.recent * 2 < x.before), '[]'::jsonb)
  );
END $$;

-- ─── What people play, which phones, which language, growth ────────────────
CREATE OR REPLACE FUNCTION hq_mix(p_city TEXT DEFAULT NULL) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE t DATE := bt_riyadh_today(); k TEXT := bt_city_key(p_city);
BEGIN
  PERFORM bt_require_hq();
  RETURN jsonb_build_object(
    'sports', coalesce((SELECT jsonb_agg(jsonb_build_object('sport', s, 'players', n) ORDER BY n DESC) FROM (
        SELECT e.event_type AS s, count(*) AS n FROM event_rsvps r JOIN events e ON e.id = r.event_id
        WHERE r.status = 'going' AND e.cancelled_at IS NULL AND e.starts_at > now() - interval '30 days' AND (k IS NULL OR e.city_key = k)
        GROUP BY 1 ORDER BY 2 DESC LIMIT 8) x), '[]'::jsonb),
    'platforms', coalesce((SELECT jsonb_object_agg(platform, n) FROM (
        SELECT platform, count(DISTINCT user_id) AS n FROM member_days WHERE day > t - 30 AND platform IS NOT NULL AND (k IS NULL OR city_key = k) GROUP BY 1) x), '{}'::jsonb),
    'languages', coalesce((SELECT jsonb_object_agg(locale, n) FROM (
        SELECT locale, count(DISTINCT user_id) AS n FROM member_days WHERE day > t - 30 AND locale IS NOT NULL AND (k IS NULL OR city_key = k) GROUP BY 1) x), '{}'::jsonb),
    'growth', (SELECT jsonb_agg((SELECT count(*) FROM profiles p WHERE p.created_at <= now() - (w * interval '7 days') AND p.created_at > now() - ((w + 1) * interval '7 days') AND (k IS NULL OR bt_city_key(p.city) = k)) ORDER BY w DESC) FROM generate_series(0, 7) w)
  );
END $$;

REVOKE ALL ON FUNCTION bt_require_hq(), hq_live(TEXT), hq_days(TEXT), hq_day_sessions(DATE, TEXT), hq_cities(), hq_communities(TEXT), hq_attention(), hq_mix(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION bt_require_hq(), hq_live(TEXT), hq_days(TEXT), hq_day_sessions(DATE, TEXT), hq_cities(), hq_communities(TEXT), hq_attention(), hq_mix(TEXT) TO authenticated;
