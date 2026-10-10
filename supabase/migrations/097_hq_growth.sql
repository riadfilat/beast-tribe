-- 097 · The command center's Growth view (the new dashboard, step 4)
--
-- In plain words: for the last N days, how leads moved through the funnel (new → contacted → demo
-- → trial → paying), where they came from, and how many people signed up and then joined their
-- first session. HQ admins only. Revenue comes from the existing business_overview().

CREATE OR REPLACE FUNCTION hq_growth(p_days INT) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  d INT := least(365, greatest(1, coalesce(p_days, 30)));
  since TIMESTAMPTZ := now() - make_interval(days => d);
BEGIN
  PERFORM bt_require_hq();
  RETURN (
    WITH l AS (SELECT * FROM partner_leads WHERE created_at > since),
    firsts AS (SELECT user_id, min(created_at) AS first_at FROM event_rsvps WHERE status = 'going' GROUP BY user_id)
    SELECT jsonb_build_object(
      'days', d,
      -- Each step counts the leads that reached it or went further.
      'funnel', jsonb_build_object(
        'new', (SELECT count(*) FROM l),
        'contacted', (SELECT count(*) FROM l WHERE status IN ('contacted', 'demo', 'trial', 'won')),
        'demo', (SELECT count(*) FROM l WHERE status IN ('demo', 'trial', 'won')),
        'trial', (SELECT count(*) FROM l WHERE status IN ('trial', 'won')),
        'won', (SELECT count(*) FROM l WHERE status = 'won'),
        'lost', (SELECT count(*) FROM l WHERE status = 'lost')),
      'sources', coalesce((SELECT jsonb_agg(jsonb_build_object('source', s, 'n', n) ORDER BY n DESC) FROM (SELECT coalesce(nullif(source, ''), 'other') AS s, count(*) AS n FROM l GROUP BY 1) x), '[]'::jsonb),
      'kinds', coalesce((SELECT jsonb_agg(jsonb_build_object('kind', kind, 'n', n) ORDER BY n DESC) FROM (SELECT kind, count(*) AS n FROM l GROUP BY 1) x), '[]'::jsonb),
      'leads', coalesce((SELECT jsonb_agg(jsonb_build_object('id', id, 'name', business_name, 'kind', kind, 'city', city, 'source', source, 'status', status, 'created_at', created_at) ORDER BY created_at DESC)
          FROM (SELECT * FROM l ORDER BY created_at DESC LIMIT 60) x), '[]'::jsonb),
      'signups', (SELECT count(*) FROM profiles WHERE created_at > since),
      'signups_before', (SELECT count(*) FROM profiles WHERE created_at <= since AND created_at > since - make_interval(days => d)),
      'first_session', (SELECT count(*) FROM firsts WHERE first_at > since)
    )
  );
END $$;

REVOKE ALL ON FUNCTION hq_growth(INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION hq_growth(INT) TO authenticated;
