-- 055 Beast Captains: what the admin site needs
--  * bt_user_id_by_email(): find a member by the email they signed up with (assigning a captain).
--  * captain_week(): every captaincy with this week and next week against its target.
-- Both are for the admin site only (service role).

CREATE OR REPLACE FUNCTION bt_user_id_by_email(p_email TEXT) RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT u.id FROM auth.users u WHERE lower(u.email) = lower(trim(p_email)) LIMIT 1
$$;
REVOKE ALL ON FUNCTION bt_user_id_by_email(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION bt_user_id_by_email(TEXT) TO service_role;

CREATE OR REPLACE FUNCTION captain_week()
RETURNS TABLE (community_id UUID, community TEXT, user_id UUID, captain TEXT, avatar_url TEXT, weekly_target INT,
               this_week INT, next_week INT, hourly_rate_sar NUMERIC, cut_pct NUMERIC, starts_on DATE, ends_on DATE,
               notes TEXT, last_session TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.community_id, co.name, c.user_id, coalesce(p.display_name, p.full_name, 'Captain'), p.avatar_url, c.weekly_target,
    (SELECT count(*)::INT FROM events e WHERE e.captain_hosted AND e.created_by = c.user_id AND e.community_id = c.community_id
       AND e.cancelled_at IS NULL AND e.starts_at >= bt_week_start() AND e.starts_at < bt_week_start() + interval '7 days'),
    (SELECT count(*)::INT FROM events e WHERE e.captain_hosted AND e.created_by = c.user_id AND e.community_id = c.community_id
       AND e.cancelled_at IS NULL AND e.starts_at >= bt_week_start() + interval '7 days' AND e.starts_at < bt_week_start() + interval '14 days'),
    c.hourly_rate_sar, c.cut_pct, c.starts_on, c.ends_on, c.notes,
    (SELECT max(e.starts_at) FROM events e WHERE e.captain_hosted AND e.created_by = c.user_id AND e.community_id = c.community_id
       AND e.cancelled_at IS NULL AND e.starts_at <= now())
  FROM community_captains c
  JOIN communities co ON co.id = c.community_id
  JOIN profiles p ON p.id = c.user_id
  ORDER BY co.name, 4
$$;
REVOKE ALL ON FUNCTION captain_week() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION captain_week() TO service_role;
