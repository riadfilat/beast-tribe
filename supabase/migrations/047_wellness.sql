-- 047 Wellness for companies and gyms
-- 1) daily_activity: a member's daily steps, synced from Apple Health on their phone. Private to them.
-- 2) challenges + challenge_entries: a company or gym runs a step challenge for a set period; members
--    opt in, and only those who joined appear on its ranking (challenge_board).
-- 3) community_partners: experts and venues included in a community's package (a company's
--    nutritionist, the gyms its people can use). Members connect to an included expert themselves.

-- ---- 1) Daily activity ----
CREATE TABLE IF NOT EXISTS daily_activity (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  steps INT NOT NULL DEFAULT 0 CHECK (steps BETWEEN 0 AND 200000),
  active_minutes INT CHECK (active_minutes BETWEEN 0 AND 1440),
  source TEXT NOT NULL DEFAULT 'apple_health' CHECK (source IN ('apple_health', 'health_connect')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day)
);
ALTER TABLE daily_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS daily_activity_own ON daily_activity;
CREATE POLICY daily_activity_own ON daily_activity FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND day <= current_date + 1);

-- ---- 2) Challenges ----
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 2 AND 80),
  title_ar TEXT,
  metric TEXT NOT NULL DEFAULT 'steps' CHECK (metric IN ('steps')),
  daily_goal INT CHECK (daily_goal BETWEEN 1000 AND 50000),
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT challenges_dates_chk CHECK (ends_on >= starts_on AND ends_on - starts_on <= 92)
);
CREATE INDEX IF NOT EXISTS idx_challenges_community ON challenges (community_id, ends_on);
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS challenges_select ON challenges;
CREATE POLICY challenges_select ON challenges FOR SELECT USING (
  is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = challenges.community_id AND m.user_id = auth.uid())
);
-- Created and changed by the partner portal (service role) and admins only.

CREATE TABLE IF NOT EXISTS challenge_entries (
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (challenge_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_challenge_entries_user ON challenge_entries (user_id);
ALTER TABLE challenge_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS challenge_entries_select ON challenge_entries;
CREATE POLICY challenge_entries_select ON challenge_entries FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM challenges c JOIN community_members m ON m.community_id = c.community_id
    WHERE c.id = challenge_entries.challenge_id AND m.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS challenge_entries_join ON challenge_entries;
CREATE POLICY challenge_entries_join ON challenge_entries FOR INSERT WITH CHECK (
  user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM challenges c JOIN community_members m ON m.community_id = c.community_id
    WHERE c.id = challenge_entries.challenge_id AND m.user_id = auth.uid()
      AND c.cancelled_at IS NULL AND c.ends_on >= current_date
  )
);
DROP POLICY IF EXISTS challenge_entries_leave ON challenge_entries;
CREATE POLICY challenge_entries_leave ON challenge_entries FOR DELETE USING (user_id = auth.uid());

-- The ranking: entrants only, steps inside the challenge's dates. Readable by the community's
-- members and by the portal (service role, no auth.uid()).
CREATE OR REPLACE FUNCTION challenge_board(p_challenge UUID)
RETURNS TABLE (user_id UUID, name TEXT, avatar_url TEXT, steps BIGINT, days_active INT, place INT)
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
  )
  SELECT t.user_id, coalesce(p.display_name, p.full_name, 'Member'), p.avatar_url, t.steps, t.days_active,
         (rank() OVER (ORDER BY t.steps DESC))::INT
  FROM totals t JOIN profiles p ON p.id = t.user_id
  ORDER BY t.steps DESC;
END $$;
REVOKE ALL ON FUNCTION challenge_board(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION challenge_board(UUID) TO authenticated, service_role;

-- ---- 3) Partners included in a community's package ----
CREATE TABLE IF NOT EXISTS community_partners (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('nutritionist', 'coach', 'gym', 'kitchen')),
  perk TEXT,
  perk_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, partner_id)
);
ALTER TABLE community_partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS community_partners_select ON community_partners;
CREATE POLICY community_partners_select ON community_partners FOR SELECT USING (
  is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = community_partners.community_id AND m.user_id = auth.uid())
);

-- A member connects to an expert included in their community's package. The member starts it, so
-- it is active at once, sharing exactly what they chose (coaching consent, migration 036).
CREATE OR REPLACE FUNCTION connect_package_expert(p_partner UUID, p_share_nutrition BOOLEAN, p_share_body BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM community_partners cp JOIN community_members m ON m.community_id = cp.community_id
    WHERE cp.partner_id = p_partner AND m.user_id = auth.uid() AND cp.role IN ('nutritionist', 'coach')
  ) THEN
    RAISE EXCEPTION 'NOT_IN_PACKAGE' USING ERRCODE = '42501';
  END IF;
  INSERT INTO trainee_privacy (trainee_id, coach_id, share_nutrition, share_body_metrics, share_workouts, share_habits, share_photos, share_on_feed)
  VALUES (auth.uid(), p_partner, p_share_nutrition, p_share_body, false, false, false, false)
  ON CONFLICT (trainee_id, coach_id) DO UPDATE SET share_nutrition = EXCLUDED.share_nutrition, share_body_metrics = EXCLUDED.share_body_metrics;
  INSERT INTO coach_trainees (coach_id, trainee_id, status, started_at)
  VALUES (p_partner, auth.uid(), 'active', now())
  ON CONFLICT DO NOTHING;
  UPDATE coach_trainees SET status = 'active', started_at = coalesce(started_at, now())
  WHERE coach_id = p_partner AND trainee_id = auth.uid() AND status = 'pending';
END $$;
REVOKE ALL ON FUNCTION connect_package_expert(UUID, BOOLEAN, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION connect_package_expert(UUID, BOOLEAN, BOOLEAN) TO authenticated;

-- ---- 4) Companies run their community from the partner portal too; nutritionists are partners ----
ALTER TYPE partner_type ADD VALUE IF NOT EXISTS 'company';
ALTER TYPE partner_type ADD VALUE IF NOT EXISTS 'nutritionist';

-- ---- 5) Companies subscribe per seat ----
ALTER TABLE partners DROP CONSTRAINT IF EXISTS partners_plan_chk;
ALTER TABLE partners ADD CONSTRAINT partners_plan_chk CHECK (plan IS NULL OR plan IN ('coach', 'studio', 'club', 'multi', 'company'));
