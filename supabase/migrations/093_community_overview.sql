-- 093 · The leader dashboard's numbers, and ticking who paid (the new dashboard, step 2)
--
-- In plain words:
-- 1. community_overview(): one call returns a community's numbers for the dashboard's Home:
--    members, active this week, players and sessions this week vs last week, spots filled,
--    players per day, the busiest time, the most played sport and quiet members.
--    Leaders, supporters and HQ may ask; anyone else is refused.
--    MONEY (expected and paid at the venue) is returned only to leaders and HQ, never to supporters.
-- 2. A session can have a price per player (events.price_sar, paid at the venue). The leader ticks
--    who paid with set_player_paid(); that keeps a 'fee' row in session_dues. Beast Tribe takes 0%.

ALTER TABLE session_dues DROP CONSTRAINT IF EXISTS session_dues_kind_check;
ALTER TABLE session_dues ADD CONSTRAINT session_dues_kind_check CHECK (kind IN ('guest', 'share', 'fee'));

CREATE OR REPLACE FUNCTION community_overview(p_community UUID) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role TEXT := bt_team_role(p_community);
  v_hq BOOLEAN := bt_is_hq();
  v_today DATE := (now() AT TIME ZONE 'Asia/Riyadh')::date;
  v_out JSONB;
  v_money JSONB := NULL;
BEGIN
  IF v_role IS NULL AND NOT v_hq THEN RAISE EXCEPTION 'NOT_ALLOWED'; END IF;

  WITH ev AS (
    SELECT e.id, e.starts_at, (e.starts_at AT TIME ZONE 'Asia/Riyadh') AS local, e.max_capacity, e.event_type,
           (SELECT count(*) FROM event_rsvps r WHERE r.event_id = e.id AND r.status = 'going') AS players
    FROM events e
    WHERE e.community_id = p_community AND e.cancelled_at IS NULL
      AND e.starts_at >= (v_today - 56)::timestamp AT TIME ZONE 'Asia/Riyadh' AND e.starts_at <= now()
  ),
  wk AS (
    SELECT CASE WHEN local::date > v_today - 7 THEN 'this' WHEN local::date > v_today - 14 THEN 'last' END AS w, *
    FROM ev
  ),
  mem AS (SELECT user_id, joined_at FROM community_members WHERE community_id = p_community),
  played AS (
    SELECT r.user_id, max(e.starts_at) AS last_played
    FROM event_rsvps r JOIN events e ON e.id = r.event_id
    WHERE e.community_id = p_community AND r.status = 'going' AND e.cancelled_at IS NULL AND e.starts_at <= now()
    GROUP BY r.user_id
  )
  SELECT jsonb_build_object(
    'members', (SELECT count(*) FROM mem),
    'new_30', (SELECT count(*) FROM mem WHERE joined_at > now() - interval '30 days'),
    'active_7', (SELECT count(DISTINCT m.user_id) FROM mem m WHERE
        EXISTS (SELECT 1 FROM member_days d WHERE d.user_id = m.user_id AND d.day > v_today - 7)
        OR EXISTS (SELECT 1 FROM played p WHERE p.user_id = m.user_id AND p.last_played > now() - interval '7 days')),
    'quiet', (SELECT count(*) FROM mem m JOIN played p ON p.user_id = m.user_id WHERE p.last_played < now() - interval '21 days'),
    'this_week', (SELECT jsonb_build_object('players', coalesce(sum(players), 0), 'sessions', count(*),
        'fill', round(avg(least(1, players::numeric / max_capacity)) FILTER (WHERE max_capacity > 0), 2)) FROM wk WHERE w = 'this'),
    'last_week', (SELECT jsonb_build_object('players', coalesce(sum(players), 0), 'sessions', count(*),
        'fill', round(avg(least(1, players::numeric / max_capacity)) FILTER (WHERE max_capacity > 0), 2)) FROM wk WHERE w = 'last'),
    'days', (SELECT jsonb_agg(jsonb_build_object('day', d, 'players', coalesce((SELECT sum(players) FROM ev WHERE local::date = d), 0)) ORDER BY d)
        FROM generate_series(v_today - 6, v_today, interval '1 day') AS g(t), LATERAL (SELECT g.t::date AS d) x),
    'busiest', (SELECT jsonb_build_object('dow', dow, 'hour', hr, 'fill', fill, 'sessions', n) FROM (
        SELECT extract(dow FROM local)::int AS dow, extract(hour FROM local)::int AS hr, count(*) AS n,
               round(avg(least(1, players::numeric / max_capacity)), 2) AS fill
        FROM ev WHERE max_capacity > 0 GROUP BY 1, 2 HAVING count(*) >= 2 ORDER BY fill DESC, n DESC LIMIT 1) b),
    'top_sport', (SELECT jsonb_build_object('sport', event_type, 'players', s) FROM (
        SELECT event_type, sum(players) AS s FROM ev GROUP BY 1 HAVING sum(players) > 0 ORDER BY s DESC LIMIT 1) t),
    'upcoming_7', (SELECT count(*) FROM events e WHERE e.community_id = p_community AND e.cancelled_at IS NULL
        AND e.starts_at > now() AND e.starts_at < now() + interval '7 days')
  ) INTO v_out;

  -- Money is for leaders and HQ only. Expected = price per player × players + guest fees and court
  -- shares; paid = what was ticked as paid at the venue. Sessions held in the last 7 days.
  IF v_hq OR v_role = 'leader' THEN
    WITH wk AS (
      SELECT e.id, coalesce(e.price_sar, 0) AS price,
             (SELECT count(*) FROM event_rsvps r WHERE r.event_id = e.id AND r.status = 'going') AS players
      FROM events e
      WHERE e.community_id = p_community AND e.cancelled_at IS NULL
        AND (e.starts_at AT TIME ZONE 'Asia/Riyadh')::date > v_today - 7 AND e.starts_at <= now()
    )
    SELECT jsonb_build_object(
      'expected', coalesce((SELECT sum(price * players) FROM wk), 0)
                + coalesce((SELECT sum(d.amount_sar) FROM session_dues d JOIN wk ON wk.id = d.event_id WHERE d.kind IN ('guest', 'share')), 0),
      'paid', coalesce((SELECT sum(d.amount_sar) FROM session_dues d JOIN wk ON wk.id = d.event_id WHERE d.paid_at IS NOT NULL), 0)
    ) INTO v_money;
  END IF;

  RETURN v_out || jsonb_build_object('money', v_money, 'role', coalesce(v_role, 'hq'));
END $$;

-- The leader (or HQ) ticks that a player paid at the venue, or un-ticks a mistake.
CREATE OR REPLACE FUNCTION set_player_paid(p_event UUID, p_user UUID, p_paid BOOLEAN) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e RECORD;
BEGIN
  SELECT id, community_id, price_sar INTO e FROM events WHERE id = p_event;
  IF NOT FOUND THEN RAISE EXCEPTION 'NO_SESSION'; END IF;
  IF NOT (bt_is_hq() OR bt_team_role(e.community_id) IS NOT DISTINCT FROM 'leader') THEN RAISE EXCEPTION 'NOT_LEADER'; END IF;
  IF NOT EXISTS (SELECT 1 FROM event_rsvps WHERE event_id = p_event AND user_id = p_user AND status = 'going') THEN RAISE EXCEPTION 'NOT_PLAYING'; END IF;

  IF NOT EXISTS (SELECT 1 FROM session_dues WHERE event_id = p_event AND user_id = p_user) THEN
    IF coalesce(e.price_sar, 0) <= 0 THEN RAISE EXCEPTION 'FREE_SESSION'; END IF;
    INSERT INTO session_dues (event_id, user_id, kind, amount_sar) VALUES (p_event, p_user, 'fee', e.price_sar);
  END IF;
  UPDATE session_dues
  SET paid_at = CASE WHEN p_paid THEN now() END,
      paid_via = CASE WHEN p_paid THEN 'venue' END,
      marked_by = CASE WHEN p_paid THEN auth.uid() END
  WHERE event_id = p_event AND user_id = p_user;
END $$;

REVOKE ALL ON FUNCTION community_overview(UUID), set_player_paid(UUID, UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION community_overview(UUID), set_player_paid(UUID, UUID, BOOLEAN) TO authenticated;
