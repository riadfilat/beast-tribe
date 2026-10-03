-- 051 Sales pipeline and business overview
-- partner_leads: gyms, companies, coaches and venues that ask for a trial from the public pages.
-- business_overview(): the numbers the business is run on, computed in the database in one call.
-- A 'venue' plan for healthy restaurants and courts (SAR 1,000 a month).

CREATE TABLE IF NOT EXISTS partner_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('gym', 'company', 'coach', 'venue')),
  business_name TEXT NOT NULL CHECK (length(business_name) BETWEEN 2 AND 120),
  contact_name TEXT NOT NULL CHECK (length(contact_name) BETWEEN 2 AND 120),
  email TEXT NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(email) <= 200),
  phone TEXT CHECK (phone IS NULL OR length(phone) <= 40),
  city TEXT CHECK (city IS NULL OR length(city) <= 80),
  size TEXT CHECK (size IS NULL OR length(size) <= 40),
  message TEXT CHECK (message IS NULL OR length(message) <= 2000),
  source TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'demo', 'trial', 'won', 'lost')),
  notes TEXT,
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_partner_leads_status ON partner_leads (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_leads_email ON partner_leads (lower(email), created_at);
CREATE INDEX IF NOT EXISTS idx_partner_leads_ip ON partner_leads (ip_hash, created_at);
ALTER TABLE partner_leads ENABLE ROW LEVEL SECURITY; -- no policies: the admin site (service role) only

ALTER TABLE partners DROP CONSTRAINT IF EXISTS partners_plan_chk;
ALTER TABLE partners ADD CONSTRAINT partners_plan_chk
  CHECK (plan IS NULL OR plan IN ('coach', 'studio', 'club', 'multi', 'company', 'venue'));

-- Monthly price of a partner's plan in SAR. Companies pay per member of their community;
-- yearly billing is ten months for twelve. Multi-branch is priced by hand (metadata.custom_mrr).
CREATE OR REPLACE FUNCTION bt_partner_mrr(p partners) RETURNS NUMERIC
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT round((CASE p.plan
    WHEN 'coach' THEN 149
    WHEN 'studio' THEN 790
    WHEN 'club' THEN 1590
    WHEN 'venue' THEN 1000
    WHEN 'company' THEN 10 * (SELECT count(*) FROM community_members m WHERE m.community_id = p.community_id AND m.user_id IS DISTINCT FROM p.user_id)
    WHEN 'multi' THEN coalesce((p.metadata->>'custom_mrr')::NUMERIC, 0)
    ELSE 0 END) * CASE WHEN p.billing_cycle = 'yearly' THEN 10.0 / 12 ELSE 1 END)
$$;
REVOKE ALL ON FUNCTION bt_partner_mrr(partners) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION business_overview() RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH act AS (
    SELECT user_id, created_at AS at FROM event_rsvps WHERE created_at > now() - interval '30 days' AND status IN ('going', 'waitlist')
    UNION ALL SELECT user_id, completed_at FROM workout_logs WHERE completed_at > now() - interval '30 days'
    UNION ALL SELECT user_id, created_at FROM feed_posts WHERE created_at > now() - interval '30 days'
  ), paying AS (
    SELECT p.*, bt_partner_mrr(p) AS mrr FROM partners p WHERE p.is_active AND p.plan_status = 'active' AND p.plan IS NOT NULL
  )
  SELECT jsonb_build_object(
    'members', (SELECT count(*) FROM profiles),
    'members_new_30d', (SELECT count(*) FROM profiles WHERE created_at > now() - interval '30 days'),
    'active_7d', (SELECT count(DISTINCT user_id) FROM act WHERE at > now() - interval '7 days'),
    'active_30d', (SELECT count(DISTINCT user_id) FROM act),
    'sessions_30d', (SELECT count(*) FROM events WHERE starts_at > now() - interval '30 days' AND starts_at <= now() AND cancelled_at IS NULL),
    'bookings_30d', (SELECT count(*) FROM event_rsvps WHERE created_at > now() - interval '30 days' AND status IN ('going', 'waitlist')),
    'workouts_30d', (SELECT count(*) FROM workout_logs WHERE completed_at > now() - interval '30 days'),
    'mrr', (SELECT coalesce(sum(mrr), 0) FROM paying),
    'paying', (SELECT coalesce(jsonb_object_agg(k, n), '{}'::jsonb) FROM (
        SELECT CASE WHEN plan IN ('studio', 'club', 'multi') THEN 'gym' ELSE plan END AS k, count(*) AS n FROM paying GROUP BY 1) x),
    'mrr_by', (SELECT coalesce(jsonb_object_agg(k, s), '{}'::jsonb) FROM (
        SELECT CASE WHEN plan IN ('studio', 'club', 'multi') THEN 'gym' ELSE plan END AS k, sum(mrr) AS s FROM paying GROUP BY 1) x),
    'company_seats', (SELECT coalesce(sum(mrr) / 10, 0) FROM paying WHERE plan = 'company' AND billing_cycle = 'monthly'),
    'trials', (SELECT count(*) FROM partners WHERE is_active AND plan_status = 'trial' AND partner_type IN ('gym', 'company', 'coach', 'nutritionist', 'nutrition')),
    'trials_ending', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', business_name, 'type', partner_type, 'ends', trial_ends_at) ORDER BY trial_ends_at), '[]'::jsonb)
        FROM partners WHERE is_active AND plan_status = 'trial' AND trial_ends_at IS NOT NULL AND trial_ends_at < now() + interval '14 days'),
    'past_due', (SELECT count(*) FROM partners WHERE is_active AND plan_status = 'past_due'),
    'leads', (SELECT coalesce(jsonb_object_agg(status, n), '{}'::jsonb) FROM (SELECT status, count(*) AS n FROM partner_leads GROUP BY 1) x),
    'leads_30d', (SELECT count(*) FROM partner_leads WHERE created_at > now() - interval '30 days'),
    'health_connected', (SELECT count(DISTINCT user_id) FROM daily_activity WHERE day > current_date - 7),
    'challenges_live', (SELECT count(*) FROM challenges WHERE cancelled_at IS NULL AND starts_on <= current_date AND ends_on >= current_date)
  )
$$;
REVOKE ALL ON FUNCTION business_overview() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION business_overview() TO service_role;

-- Where "Get the app" points (set from the admin Business page once the store links exist).
INSERT INTO app_settings (key, value) VALUES ('app_links', '{"ios": null, "android": null}'::jsonb)
ON CONFLICT (key) DO NOTHING;
