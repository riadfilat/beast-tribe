-- 052 Company wellness beyond steps
--  1. Challenges for any activity: steps, active days, workouts, minutes trained, sessions joined.
--     (Everything but steps works on any phone, with no Apple Health.)
--  2. Teams inside a community (departments, offices, class groups) and team challenges,
--     ranked by the average per person so a small team can win.
--  3. A prize line on a challenge.
--  4. A notice and a plan of the month on a community's page.

-- ════ 1. Challenge types, team mode, prize ════
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_metric_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_metric_check
  CHECK (metric IN ('steps', 'active_days', 'workouts', 'minutes', 'sessions'));
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS by_team BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS prize TEXT CHECK (prize IS NULL OR length(prize) <= 160),
  ADD COLUMN IF NOT EXISTS prize_ar TEXT CHECK (prize_ar IS NULL OR length(prize_ar) <= 160);

-- ════ 2. Teams ════
CREATE TABLE IF NOT EXISTS community_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 40),
  name_ar TEXT CHECK (name_ar IS NULL OR length(name_ar) <= 40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_teams_community ON community_teams (community_id);

-- One team per member per community.
CREATE TABLE IF NOT EXISTS community_team_members (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES community_teams(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON community_team_members (team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON community_team_members (user_id);

ALTER TABLE community_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS community_teams_select ON community_teams;
CREATE POLICY community_teams_select ON community_teams FOR SELECT USING (
  community_id IN (SELECT bt_my_community_ids()) OR (SELECT is_admin())
);
DROP POLICY IF EXISTS community_team_members_select ON community_team_members;
CREATE POLICY community_team_members_select ON community_team_members FOR SELECT USING (
  community_id IN (SELECT bt_my_community_ids()) OR (SELECT is_admin())
);
-- Teams are created in the partner portal; members pick theirs through choose_team().

CREATE OR REPLACE FUNCTION choose_team(p_team UUID) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_c UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN' USING ERRCODE = '42501'; END IF;
  SELECT community_id INTO v_c FROM community_teams WHERE id = p_team;
  IF v_c IS NULL OR NOT EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = v_c AND m.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'NOT_MEMBER' USING ERRCODE = '42501';
  END IF;
  INSERT INTO community_team_members (community_id, user_id, team_id) VALUES (v_c, auth.uid(), p_team)
  ON CONFLICT (community_id, user_id) DO UPDATE SET team_id = EXCLUDED.team_id, joined_at = now();
END $$;
CREATE OR REPLACE FUNCTION leave_team(p_community UUID) RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM community_team_members WHERE community_id = p_community AND user_id = auth.uid()
$$;
REVOKE ALL ON FUNCTION choose_team(UUID), leave_team(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION choose_team(UUID), leave_team(UUID) TO authenticated;

-- Leaving a community leaves its team.
CREATE OR REPLACE FUNCTION bt_community_member_left() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM community_team_members WHERE community_id = OLD.community_id AND user_id = OLD.user_id;
  RETURN OLD;
END $$;
DROP TRIGGER IF EXISTS trg_community_member_left ON community_members;
CREATE TRIGGER trg_community_member_left AFTER DELETE ON community_members
  FOR EACH ROW EXECUTE FUNCTION bt_community_member_left();

-- ════ Scores ════
-- One row per entrant. Days are Riyadh days. A session counts once it has started.
CREATE OR REPLACE FUNCTION bt_challenge_scores(p_challenge UUID)
RETURNS TABLE (user_id UUID, score BIGINT, days_active INT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
DECLARE
  c challenges%ROWTYPE;
  v_to DATE;
BEGIN
  SELECT * INTO c FROM challenges WHERE id = p_challenge;
  IF NOT FOUND THEN RETURN; END IF;
  v_to := least(c.ends_on, (now() AT TIME ZONE 'Asia/Riyadh')::DATE);
  RETURN QUERY
  WITH ent AS (SELECT e.user_id FROM challenge_entries e WHERE e.challenge_id = p_challenge),
  steps AS (
    SELECT a.user_id, a.day, a.steps FROM daily_activity a JOIN ent ON ent.user_id = a.user_id
    WHERE a.day BETWEEN c.starts_on AND v_to AND a.steps > 0
  ),
  logs AS (
    SELECT l.user_id, (l.completed_at AT TIME ZONE 'Asia/Riyadh')::DATE AS day, coalesce(l.duration_minutes, 0) AS minutes
    FROM workout_logs l JOIN ent ON ent.user_id = l.user_id
    WHERE l.completed_at >= (c.starts_on::TIMESTAMP AT TIME ZONE 'Asia/Riyadh')
      AND l.completed_at < ((v_to + 1)::TIMESTAMP AT TIME ZONE 'Asia/Riyadh')
  ),
  went AS (
    SELECT r.user_id, (ev.starts_at AT TIME ZONE 'Asia/Riyadh')::DATE AS day, ev.community_id,
           least(180, greatest(0, extract(epoch FROM coalesce(ev.ends_at, ev.starts_at + interval '60 minutes') - ev.starts_at) / 60))::INT AS minutes
    FROM event_rsvps r JOIN ent ON ent.user_id = r.user_id JOIN events ev ON ev.id = r.event_id
    WHERE r.status = 'going' AND ev.cancelled_at IS NULL AND ev.starts_at <= now()
      AND ev.starts_at >= (c.starts_on::TIMESTAMP AT TIME ZONE 'Asia/Riyadh')
      AND ev.starts_at < ((v_to + 1)::TIMESTAMP AT TIME ZONE 'Asia/Riyadh')
  ),
  days AS (
    SELECT s.user_id, s.day FROM steps s WHERE c.metric = 'steps' OR s.steps >= coalesce(c.daily_goal, 8000)
    UNION SELECT l.user_id, l.day FROM logs l WHERE c.metric <> 'steps'
    UNION SELECT w.user_id, w.day FROM went w WHERE c.metric <> 'steps'
  )
  SELECT ent.user_id,
    (CASE c.metric
      WHEN 'steps' THEN (SELECT coalesce(sum(s.steps), 0) FROM steps s WHERE s.user_id = ent.user_id)
      WHEN 'active_days' THEN (SELECT count(*) FROM days d WHERE d.user_id = ent.user_id)
      WHEN 'workouts' THEN (SELECT count(*) FROM logs l WHERE l.user_id = ent.user_id)
      WHEN 'minutes' THEN (SELECT coalesce(sum(l.minutes), 0) FROM logs l WHERE l.user_id = ent.user_id)
                        + (SELECT coalesce(sum(w.minutes), 0) FROM went w WHERE w.user_id = ent.user_id)
      WHEN 'sessions' THEN (SELECT count(*) FROM went w WHERE w.user_id = ent.user_id AND w.community_id = c.community_id)
      ELSE 0 END)::BIGINT,
    (SELECT count(*) FROM days d WHERE d.user_id = ent.user_id)::INT
  FROM ent;
END $$;
REVOKE ALL ON FUNCTION bt_challenge_scores(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION bt_challenge_gate(p_challenge UUID) RETURNS UUID
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_c UUID;
BEGIN
  SELECT community_id INTO v_c FROM challenges WHERE id = p_challenge;
  IF v_c IS NULL THEN RETURN NULL; END IF;
  IF auth.uid() IS NOT NULL AND NOT is_admin(auth.uid()) AND NOT EXISTS (
    SELECT 1 FROM community_members m WHERE m.community_id = v_c AND m.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'NOT_MEMBER' USING ERRCODE = '42501';
  END IF;
  RETURN v_c;
END $$;
REVOKE ALL ON FUNCTION bt_challenge_gate(UUID) FROM PUBLIC, anon, authenticated;

-- People: the top rows and the caller's own. `steps` is kept as a second name for the score.
DROP FUNCTION IF EXISTS challenge_board(UUID, INT);
CREATE OR REPLACE FUNCTION challenge_board(p_challenge UUID, p_limit INT DEFAULT 100)
RETURNS TABLE (user_id UUID, name TEXT, avatar_url TEXT, score BIGINT, steps BIGINT, days_active INT, place INT, entrants INT, team TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
DECLARE v_c UUID;
BEGIN
  v_c := bt_challenge_gate(p_challenge);
  IF v_c IS NULL THEN RETURN; END IF;
  RETURN QUERY
  WITH ranked AS (
    SELECT s.user_id, s.score, s.days_active,
           (rank() OVER (ORDER BY s.score DESC))::INT AS place, (count(*) OVER ())::INT AS entrants,
           row_number() OVER (ORDER BY s.score DESC, s.user_id) AS rn
    FROM bt_challenge_scores(p_challenge) s
  )
  SELECT r.user_id, coalesce(p.display_name, p.full_name, 'Member'), p.avatar_url, r.score, r.score, r.days_active, r.place, r.entrants,
         (SELECT t.name FROM community_team_members tm JOIN community_teams t ON t.id = tm.team_id WHERE tm.community_id = v_c AND tm.user_id = r.user_id)
  FROM ranked r JOIN profiles p ON p.id = r.user_id
  WHERE r.rn <= greatest(1, least(coalesce(p_limit, 100), 500)) OR r.user_id = auth.uid()
  ORDER BY r.rn;
END $$;
REVOKE ALL ON FUNCTION challenge_board(UUID, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION challenge_board(UUID, INT) TO authenticated, service_role;

-- Teams: ranked by the average per person who joined, so team size doesn't decide it.
CREATE OR REPLACE FUNCTION challenge_team_board(p_challenge UUID)
RETURNS TABLE (team_id UUID, name TEXT, name_ar TEXT, people INT, average NUMERIC, total BIGINT, place INT, mine BOOLEAN)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
DECLARE v_c UUID;
BEGIN
  v_c := bt_challenge_gate(p_challenge);
  IF v_c IS NULL THEN RETURN; END IF;
  RETURN QUERY
  WITH per AS (
    SELECT tm.team_id, count(*)::INT AS people, round(avg(s.score), 1) AS average, sum(s.score)::BIGINT AS total
    FROM bt_challenge_scores(p_challenge) s
    JOIN community_team_members tm ON tm.community_id = v_c AND tm.user_id = s.user_id
    GROUP BY tm.team_id
  )
  SELECT t.id, t.name, t.name_ar, per.people, per.average, per.total, (rank() OVER (ORDER BY per.average DESC))::INT,
         EXISTS (SELECT 1 FROM community_team_members me WHERE me.team_id = t.id AND me.user_id = auth.uid())
  FROM per JOIN community_teams t ON t.id = per.team_id
  ORDER BY per.average DESC, t.name;
END $$;
REVOKE ALL ON FUNCTION challenge_team_board(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION challenge_team_board(UUID) TO authenticated, service_role;

-- ════ 4. A notice and a plan of the month on the community page ════
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS notice TEXT CHECK (notice IS NULL OR length(notice) <= 280),
  ADD COLUMN IF NOT EXISTS notice_ar TEXT CHECK (notice_ar IS NULL OR length(notice_ar) <= 280),
  ADD COLUMN IF NOT EXISTS notice_until DATE,
  ADD COLUMN IF NOT EXISTS featured_program_id UUID REFERENCES programs(id) ON DELETE SET NULL;
-- communities is read by column (049): the new ones must be granted too.
GRANT SELECT (notice, notice_ar, notice_until, featured_program_id) ON communities TO authenticated;
