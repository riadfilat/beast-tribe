-- 059 Club leaders, training partners, private level ratings, assistant usage
--
-- Club leaders: any member can run one club for free (a run club, a padel group). They are the
-- club's admin; a club they want listed for everyone is listed once Beast Tribe verifies it.
--
-- Training partners: members opt in to be suggested. find_partners() scores sport, level, usual
-- training times, running pace, a shared club and sessions done together. Women can choose to
-- be matched with women only. Invites point to a real session; there is no private messaging.
--
-- Level ratings: after a session, people who were there can rate each other's level in that
-- sport. Ratings are private: nobody can read them, not even the person rated. They are only
-- blended into the level the matching uses.

-- ═══════════════════════════════ Club leaders ═══════════════════════════════
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sport TEXT CHECK (sport IS NULL OR length(sport) <= 40),
  ADD COLUMN IF NOT EXISTS listing TEXT NOT NULL DEFAULT 'invite' CHECK (listing IN ('invite', 'public')),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS communities_one_club_per_leader ON communities (leader_id) WHERE leader_id IS NOT NULL AND is_active;
GRANT SELECT (leader_id, sport, listing, verified_at) ON communities TO authenticated;

ALTER TABLE partner_leads DROP CONSTRAINT IF EXISTS partner_leads_kind_check;
ALTER TABLE partner_leads ADD CONSTRAINT partner_leads_kind_check CHECK (kind IN ('gym', 'company', 'coach', 'venue', 'leader'));
ALTER TABLE partner_leads ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION bt_new_join_code() RETURNS TEXT
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v TEXT;
  alphabet CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
BEGIN
  LOOP
    v := '';
    FOR i IN 1..6 LOOP
      v := v || substr(alphabet, 1 + floor(random() * length(alphabet))::INT, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM communities WHERE upper(join_code) = v);
  END LOOP;
  RETURN v;
END $$;
REVOKE ALL ON FUNCTION bt_new_join_code() FROM PUBLIC, anon, authenticated;

-- Start a club. One club per leader; it starts invite-only with a join code.
CREATE OR REPLACE FUNCTION create_club(p_name TEXT, p_sport TEXT, p_city TEXT, p_description TEXT, p_listing TEXT)
RETURNS TABLE (id UUID, join_code TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := auth.uid();
  v_name TEXT := trim(coalesce(p_name, ''));
  v_id UUID;
  v_code TEXT;
  v_slug TEXT;
  v_me profiles%ROWTYPE;
  v_email TEXT;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN'; END IF;
  IF length(v_name) < 3 OR length(v_name) > 60 THEN RAISE EXCEPTION 'NAME'; END IF;
  IF EXISTS (SELECT 1 FROM communities c WHERE c.leader_id = me AND c.is_active) THEN RAISE EXCEPTION 'ALREADY_LEADER'; END IF;
  SELECT * INTO v_me FROM profiles WHERE profiles.id = me;
  v_code := bt_new_join_code();
  v_slug := trim(BOTH '-' FROM regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'));
  v_slug := coalesce(nullif(v_slug, ''), 'club') || '-' || lower(v_code);

  INSERT INTO communities (name, slug, description, city, visibility, kind, join_code, leader_id, sport, listing, is_active, is_default)
  VALUES (v_name, v_slug, nullif(trim(coalesce(p_description, '')), ''), nullif(trim(coalesce(p_city, v_me.city, '')), ''),
          'private', 'club', v_code, me, nullif(trim(coalesce(p_sport, '')), ''),
          CASE WHEN p_listing = 'public' THEN 'public' ELSE 'invite' END, true, false)
  RETURNING communities.id INTO v_id;
  INSERT INTO community_members (community_id, user_id, role) VALUES (v_id, me, 'admin')
  ON CONFLICT (community_id, user_id) DO UPDATE SET role = 'admin';

  -- Beast Tribe sees every new club in the Leads pipeline (to verify it and say hello).
  BEGIN
    SELECT u.email INTO v_email FROM auth.users u WHERE u.id = me;
    INSERT INTO partner_leads (kind, business_name, contact_name, email, city, source, message, community_id)
    VALUES ('leader', v_name, coalesce(nullif(v_me.full_name, ''), nullif(v_me.display_name, ''), 'Club leader'),
            coalesce(v_email, 'unknown@lead.invalid'), nullif(trim(coalesce(p_city, v_me.city, '')), ''),
            'club created in the app',
            concat_ws(' · ', nullif(p_sport, ''), CASE WHEN p_listing = 'public' THEN 'wants to be listed' ELSE 'invite only' END, nullif(trim(coalesce(p_description, '')), '')),
            v_id);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN QUERY SELECT v_id, v_code;
END $$;
GRANT EXECUTE ON FUNCTION create_club(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- A club's leader (or its admins) edits it from the app.
CREATE OR REPLACE FUNCTION update_my_club(p_id UUID, p_name TEXT, p_description TEXT, p_notice TEXT, p_listing TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := auth.uid();
  v communities%ROWTYPE;
  v_listing TEXT;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN'; END IF;
  SELECT * INTO v FROM communities WHERE id = p_id AND is_active;
  IF NOT FOUND OR NOT (v.leader_id = me OR EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = p_id AND m.user_id = me AND m.role = 'admin')) THEN
    RAISE EXCEPTION 'NOT_LEADER';
  END IF;
  IF p_name IS NOT NULL AND (length(trim(p_name)) < 3 OR length(trim(p_name)) > 60) THEN RAISE EXCEPTION 'NAME'; END IF;
  v_listing := CASE WHEN p_listing IN ('invite', 'public') THEN p_listing ELSE v.listing END;
  UPDATE communities SET
    name = coalesce(nullif(trim(p_name), ''), name),
    description = CASE WHEN p_description IS NULL THEN description ELSE nullif(trim(p_description), '') END,
    notice = CASE WHEN p_notice IS NULL THEN notice ELSE nullif(left(trim(p_notice), 280), '') END,
    notice_until = CASE WHEN p_notice IS NULL THEN notice_until ELSE NULL END,
    listing = v_listing,
    -- Listed for everyone only once verified.
    visibility = CASE WHEN v.leader_id IS NOT NULL THEN (CASE WHEN v_listing = 'public' AND verified_at IS NOT NULL THEN 'open' ELSE 'private' END) ELSE visibility END,
    updated_at = now()
  WHERE id = p_id;
END $$;
GRANT EXECUTE ON FUNCTION update_my_club(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ═══════════════════════════════ Sports and levels ═══════════════════════════════
-- The app's sport id for a sports-table name ("Skate" → skateboarding).
CREATE OR REPLACE FUNCTION bt_sport_slug(p_name TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE lower(trim(p_name)) WHEN 'skate' THEN 'skateboarding' WHEN 'group fitness' THEN 'community' ELSE lower(trim(p_name)) END
$$;

CREATE OR REPLACE FUNCTION bt_member_sports(p_user UUID) RETURNS TEXT[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(array_agg(DISTINCT bt_sport_slug(s.name)), '{}') FROM user_sports us JOIN sports s ON s.id = us.sport_id WHERE us.user_id = p_user
$$;

-- What the member said about themselves, on the 1–4 scale (Beginner, Intermediate, Advanced, Expert).
CREATE OR REPLACE FUNCTION bt_self_level(p_user UUID) RETURNS NUMERIC
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE lower(coalesce(p.train_level, p.experience_level, ''))
    WHEN 'beginner' THEN 1 WHEN 'dreamer' THEN 1
    WHEN 'intermediate' THEN 2 WHEN 'seeker' THEN 2
    WHEN 'advanced' THEN 3 WHEN 'mover' THEN 3
    WHEN 'expert' THEN 4 ELSE NULL END::NUMERIC
  FROM profiles p WHERE p.id = p_user
$$;

CREATE TABLE IF NOT EXISTS level_ratings (
  rater_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ratee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  level SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 4),
  weight NUMERIC(3, 1) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (rater_id, ratee_id, event_id),
  CHECK (rater_id <> ratee_id)
);
CREATE INDEX IF NOT EXISTS idx_level_ratings_ratee ON level_ratings (ratee_id, sport, created_at DESC);
ALTER TABLE level_ratings ENABLE ROW LEVEL SECURITY; -- no policies: read and written only through the functions below
REVOKE ALL ON level_ratings FROM anon, authenticated;

-- The level matching uses: what the member said, moved toward what people who trained with them
-- said. Each rater counts once (their latest rating); a coach's or club leader's rating counts double.
-- Never exposed to members.
CREATE OR REPLACE FUNCTION bt_level_of(p_user UUID, p_sport TEXT) RETURNS NUMERIC
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH latest AS (
    SELECT DISTINCT ON (r.rater_id) r.level, r.weight
    FROM level_ratings r
    WHERE r.ratee_id = p_user AND r.sport = p_sport AND r.created_at > now() - interval '365 days'
    ORDER BY r.rater_id, r.created_at DESC
  ), peer AS (
    SELECT sum(level * weight) / nullif(sum(weight), 0) AS avg_level, least(sum(weight), 6) AS w FROM latest
  )
  SELECT CASE
    WHEN peer.avg_level IS NULL THEN bt_self_level(p_user)
    ELSE round((coalesce(bt_self_level(p_user), peer.avg_level) + peer.avg_level * peer.w) / (1 + peer.w), 2)
  END
  FROM peer
$$;
REVOKE ALL ON FUNCTION bt_level_of(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION bt_self_level(UUID) FROM PUBLIC, anon, authenticated;

-- Who took part in a session: everyone going, plus the host.
CREATE OR REPLACE FUNCTION bt_session_people(p_event UUID) RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.user_id FROM event_rsvps r WHERE r.event_id = p_event AND r.status = 'going'
  UNION
  SELECT e.created_by FROM events e WHERE e.id = p_event AND e.created_by IS NOT NULL
$$;
REVOKE ALL ON FUNCTION bt_session_people(UUID) FROM PUBLIC, anon, authenticated;

-- Rate the level of people you trained with. p_ratings: [{"user_id": "...", "level": 1-4}, ...]
CREATE OR REPLACE FUNCTION rate_players(p_event UUID, p_ratings JSONB)
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := auth.uid();
  e events%ROWTYPE;
  v_end TIMESTAMPTZ;
  v_weight NUMERIC := 1;
  v_n INT := 0;
  r JSONB;
  v_user UUID;
  v_level INT;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN'; END IF;
  SELECT * INTO e FROM events WHERE id = p_event;
  IF NOT FOUND OR e.cancelled_at IS NOT NULL THEN RAISE EXCEPTION 'EVENT_NOT_FOUND'; END IF;
  IF coalesce(e.event_type, '') IN ('', 'community', 'other') THEN RAISE EXCEPTION 'NOT_RATEABLE'; END IF;
  v_end := coalesce(e.ends_at, e.starts_at + interval '60 minutes');
  IF v_end > now() THEN RAISE EXCEPTION 'NOT_OVER'; END IF;
  IF v_end < now() - interval '14 days' THEN RAISE EXCEPTION 'TOO_LATE'; END IF;
  IF NOT EXISTS (SELECT 1 FROM bt_session_people(p_event) x WHERE x = me) THEN RAISE EXCEPTION 'NOT_THERE'; END IF;

  -- A coach, a captain of the session's community, or a club leader/admin rates with double weight.
  IF EXISTS (SELECT 1 FROM partners pa WHERE pa.user_id = me AND pa.partner_type = 'coach' AND coalesce(pa.is_active, true))
     OR (e.community_id IS NOT NULL AND EXISTS (SELECT 1 FROM community_captains cc WHERE cc.community_id = e.community_id AND cc.user_id = me))
     OR (e.community_id IS NOT NULL AND EXISTS (SELECT 1 FROM community_members cm JOIN communities co ON co.id = cm.community_id
                                                WHERE cm.community_id = e.community_id AND cm.user_id = me AND cm.role = 'admin' AND NOT co.is_default)) THEN
    v_weight := 2;
  END IF;

  FOR r IN SELECT * FROM jsonb_array_elements(coalesce(p_ratings, '[]'::jsonb)) LOOP
    v_user := (r->>'user_id')::UUID;
    v_level := (r->>'level')::INT;
    CONTINUE WHEN v_user IS NULL OR v_user = me OR v_level IS NULL OR v_level NOT BETWEEN 1 AND 4;
    CONTINUE WHEN NOT EXISTS (SELECT 1 FROM bt_session_people(p_event) x WHERE x = v_user);
    INSERT INTO level_ratings (rater_id, ratee_id, event_id, sport, level, weight)
    VALUES (me, v_user, p_event, e.event_type, v_level, v_weight)
    ON CONFLICT (rater_id, ratee_id, event_id) DO UPDATE SET level = EXCLUDED.level, weight = EXCLUDED.weight, created_at = now();
    v_n := v_n + 1;
  END LOOP;
  RETURN v_n;
END $$;
GRANT EXECUTE ON FUNCTION rate_players(UUID, JSONB) TO authenticated;

-- What I gave in one session (my own opinions only; never what others said about me).
CREATE OR REPLACE FUNCTION my_level_ratings(p_event UUID)
RETURNS TABLE (user_id UUID, level SMALLINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.ratee_id, r.level FROM level_ratings r WHERE r.event_id = p_event AND r.rater_id = auth.uid()
$$;
GRANT EXECUTE ON FUNCTION my_level_ratings(UUID) TO authenticated;

-- Recent sessions (last 3 days) with people I haven't rated yet.
CREATE OR REPLACE FUNCTION sessions_to_rate()
RETURNS TABLE (event_id UUID, title TEXT, sport TEXT, ended_at TIMESTAMPTZ, people INT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.id, e.title, e.event_type, coalesce(e.ends_at, e.starts_at + interval '60 minutes'),
         (SELECT count(*)::INT FROM bt_session_people(e.id) x
           WHERE x <> auth.uid() AND NOT EXISTS (SELECT 1 FROM level_ratings r WHERE r.event_id = e.id AND r.rater_id = auth.uid() AND r.ratee_id = x))
  FROM events e
  WHERE auth.uid() IS NOT NULL
    AND e.cancelled_at IS NULL
    AND coalesce(e.event_type, '') NOT IN ('', 'community', 'other')
    AND coalesce(e.ends_at, e.starts_at + interval '60 minutes') BETWEEN now() - interval '3 days' AND now()
    AND (e.created_by = auth.uid() OR EXISTS (SELECT 1 FROM event_rsvps r WHERE r.event_id = e.id AND r.user_id = auth.uid() AND r.status = 'going'))
    AND EXISTS (SELECT 1 FROM bt_session_people(e.id) x WHERE x <> auth.uid()
                AND NOT EXISTS (SELECT 1 FROM level_ratings r WHERE r.event_id = e.id AND r.rater_id = auth.uid() AND r.ratee_id = x))
  ORDER BY 4 DESC
  LIMIT 3
$$;
GRANT EXECUTE ON FUNCTION sessions_to_rate() TO authenticated;

-- ═══════════════════════════════ Training partners ═══════════════════════════════
CREATE TABLE IF NOT EXISTS partner_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  open BOOLEAN NOT NULL DEFAULT false,
  women_only BOOLEAN NOT NULL DEFAULT false,
  times TEXT[] NOT NULL DEFAULT '{}' CHECK (times <@ ARRAY['early', 'morning', 'midday', 'evening', 'night']),
  run_pace_s INT CHECK (run_pace_s IS NULL OR run_pace_s BETWEEN 150 AND 900),
  note TEXT CHECK (note IS NULL OR length(note) <= 140),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_open ON partner_profiles (user_id) WHERE open;
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS partner_profiles_own ON partner_profiles;
CREATE POLICY partner_profiles_own ON partner_profiles FOR ALL
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON partner_profiles TO authenticated;

-- Women-only matching is for women.
CREATE OR REPLACE FUNCTION bt_partner_profiles_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.women_only AND coalesce((SELECT gender FROM profiles WHERE id = NEW.user_id), '') <> 'female' THEN
    NEW.women_only := false;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_partner_profiles_guard ON partner_profiles;
CREATE TRIGGER trg_partner_profiles_guard BEFORE INSERT OR UPDATE ON partner_profiles FOR EACH ROW EXECUTE FUNCTION bt_partner_profiles_guard();

-- When a member usually trains, from the sessions they joined in the last 90 days (Riyadh time).
CREATE OR REPLACE FUNCTION bt_usual_times(p_user UUID) RETURNS TEXT[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(array_agg(b ORDER BY n DESC), '{}') FROM (
    SELECT CASE
             WHEN h < 7 THEN 'early' WHEN h < 11 THEN 'morning' WHEN h < 16 THEN 'midday' WHEN h < 20 THEN 'evening' ELSE 'night'
           END AS b, count(*) AS n
    FROM (
      SELECT extract(hour FROM e.starts_at AT TIME ZONE 'Asia/Riyadh')::INT AS h
      FROM events e
      WHERE e.cancelled_at IS NULL AND e.starts_at > now() - interval '90 days'
        AND (e.created_by = p_user OR EXISTS (SELECT 1 FROM event_rsvps r WHERE r.event_id = e.id AND r.user_id = p_user AND r.status = 'going'))
    ) hours
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 2
  ) t
$$;
REVOKE ALL ON FUNCTION bt_usual_times(UUID) FROM PUBLIC, anon, authenticated;

-- Suggested training partners for the signed-in member. Only members who are open themselves can
-- look, and only open members are suggested. The level is never returned: only whether it's close.
CREATE OR REPLACE FUNCTION find_partners(p_cities TEXT[], p_sport TEXT DEFAULT NULL, p_limit INT DEFAULT 20)
RETURNS TABLE (
  user_id UUID, name TEXT, avatar_url TEXT, sport TEXT, sports TEXT[], times TEXT[], pace_s INT, note TEXT,
  close_level BOOLEAN, club TEXT, together INT, score INT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
DECLARE
  me UUID := auth.uid();
  my partner_profiles%ROWTYPE;
  my_gender TEXT;
  my_sports TEXT[];
  my_times TEXT[];
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN'; END IF;
  SELECT * INTO my FROM partner_profiles pp WHERE pp.user_id = me;
  IF NOT FOUND OR NOT my.open THEN RAISE EXCEPTION 'NOT_OPEN'; END IF;
  SELECT p.gender INTO my_gender FROM profiles p WHERE p.id = me;
  my_sports := bt_member_sports(me);
  my_times := CASE WHEN coalesce(array_length(my.times, 1), 0) > 0 THEN my.times ELSE bt_usual_times(me) END;

  RETURN QUERY
  WITH cand AS (
    SELECT p.id, coalesce(nullif(p.display_name, ''), p.full_name, '') AS nm, p.avatar_url AS av, p.last_active_date AS seen,
           pp.times AS ptimes, pp.run_pace_s AS pace, pp.note AS nt, bt_member_sports(p.id) AS sp
    FROM partner_profiles pp
    JOIN profiles p ON p.id = pp.user_id
    WHERE pp.open AND p.id <> me
      AND NOT EXISTS (SELECT 1 FROM blocked_users b WHERE (b.blocker_id = me AND b.blocked_id = p.id) OR (b.blocker_id = p.id AND b.blocked_id = me))
      AND (NOT my.women_only OR p.gender = 'female')
      AND (NOT pp.women_only OR my_gender = 'female')
      AND (bt_city_key(p.city) = ANY (coalesce(p_cities, '{}'))
           OR EXISTS (SELECT 1 FROM community_members a JOIN community_members b2 ON b2.community_id = a.community_id
                      JOIN communities co ON co.id = a.community_id
                      WHERE a.user_id = me AND b2.user_id = p.id AND NOT co.is_default AND co.is_active))
    ORDER BY p.last_active_date DESC NULLS LAST
    LIMIT 400
  ), focus AS (
    SELECT c.*,
           CASE WHEN p_sport IS NOT NULL THEN p_sport ELSE (SELECT s FROM unnest(c.sp) s WHERE s = ANY (my_sports) LIMIT 1) END AS fs,
           ARRAY(SELECT s FROM unnest(c.sp) s WHERE s = ANY (my_sports)) AS shared,
           CASE WHEN coalesce(array_length(c.ptimes, 1), 0) > 0 THEN c.ptimes ELSE bt_usual_times(c.id) END AS tm
    FROM cand c
    WHERE (p_sport IS NULL AND c.sp && my_sports) OR (p_sport IS NOT NULL AND p_sport = ANY (c.sp))
  ), lv AS (
    SELECT f.*, abs(bt_level_of(me, f.fs) - bt_level_of(f.id, f.fs)) AS gap,
           (SELECT co.name FROM community_members a JOIN community_members b2 ON b2.community_id = a.community_id
              JOIN communities co ON co.id = a.community_id
             WHERE a.user_id = me AND b2.user_id = f.id AND NOT co.is_default AND co.is_active LIMIT 1) AS shared_club,
           (SELECT count(*)::INT FROM events e
             WHERE e.cancelled_at IS NULL AND coalesce(e.ends_at, e.starts_at) < now()
               AND EXISTS (SELECT 1 FROM bt_session_people(e.id) x WHERE x = me)
               AND EXISTS (SELECT 1 FROM bt_session_people(e.id) x WHERE x = f.id)) AS tog,
           ARRAY(SELECT t FROM unnest(f.tm) t WHERE t = ANY (my_times)) AS both_times
    FROM focus f
  )
  SELECT lv.id, lv.nm, lv.av, lv.fs, lv.shared, lv.tm, lv.pace, lv.nt,
         (lv.gap IS NOT NULL AND lv.gap < 1),
         lv.shared_club, lv.tog,
         (least(coalesce(array_length(lv.shared, 1), 0) * 10, 30)
          + CASE WHEN p_sport IS NOT NULL THEN 20 ELSE 0 END
          + CASE WHEN lv.gap IS NULL THEN 0 WHEN lv.gap < 0.75 THEN 25 WHEN lv.gap < 1.5 THEN 12 ELSE -15 END
          + least(coalesce(array_length(lv.both_times, 1), 0) * 8, 24)
          + CASE WHEN lv.shared_club IS NOT NULL THEN 15 ELSE 0 END
          + CASE WHEN lv.fs = 'running' AND my.run_pace_s IS NOT NULL AND lv.pace IS NOT NULL
                 THEN CASE WHEN abs(my.run_pace_s - lv.pace) <= 20 THEN 15 WHEN abs(my.run_pace_s - lv.pace) <= 45 THEN 8 ELSE 0 END
                 ELSE 0 END
          + least(lv.tog * 8, 16)
          + CASE WHEN lv.seen >= current_date - 14 THEN 5 WHEN lv.seen >= current_date - 60 THEN 2 ELSE 0 END)::INT AS sc
  FROM lv
  -- Far apart in level (a beginner and an advanced player) are not suggested to each other.
  WHERE lv.gap IS NULL OR lv.gap < 1.75
  ORDER BY sc DESC, lv.seen DESC NULLS LAST
  LIMIT greatest(1, least(coalesce(p_limit, 20), 50));
END $$;
GRANT EXECUTE ON FUNCTION find_partners(TEXT[], TEXT, INT) TO authenticated;

-- Invite a suggested partner to one of your upcoming sessions.
CREATE OR REPLACE FUNCTION invite_partner(p_user UUID, p_event UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := auth.uid();
  e events%ROWTYPE;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN'; END IF;
  IF NOT EXISTS (SELECT 1 FROM partner_profiles WHERE user_id = me AND open) THEN RAISE EXCEPTION 'NOT_OPEN'; END IF;
  IF NOT EXISTS (SELECT 1 FROM partner_profiles WHERE user_id = p_user AND open) THEN RAISE EXCEPTION 'NOT_AVAILABLE'; END IF;
  IF EXISTS (SELECT 1 FROM blocked_users b WHERE (b.blocker_id = me AND b.blocked_id = p_user) OR (b.blocker_id = p_user AND b.blocked_id = me)) THEN
    RAISE EXCEPTION 'NOT_AVAILABLE';
  END IF;
  SELECT * INTO e FROM events WHERE id = p_event;
  IF NOT FOUND OR e.cancelled_at IS NOT NULL OR e.starts_at < now() THEN RAISE EXCEPTION 'EVENT_OVER'; END IF;
  IF NOT EXISTS (SELECT 1 FROM bt_session_people(p_event) x WHERE x = me) THEN RAISE EXCEPTION 'NOT_THERE'; END IF;
  IF EXISTS (SELECT 1 FROM bt_session_people(p_event) x WHERE x = p_user) THEN RAISE EXCEPTION 'ALREADY'; END IF;
  IF e.is_women_only AND coalesce((SELECT gender FROM profiles WHERE id = p_user), '') <> 'female' THEN RAISE EXCEPTION 'WOMEN_ONLY'; END IF;
  -- They must be able to see the session.
  IF e.pack_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM pack_members pm WHERE pm.pack_id = e.pack_id AND pm.user_id = p_user) THEN
    RAISE EXCEPTION 'CANT_SEE';
  END IF;
  IF e.pack_id IS NULL AND e.community_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM community_members cm WHERE cm.community_id = e.community_id AND cm.user_id = p_user) THEN
    RAISE EXCEPTION 'CANT_SEE';
  END IF;
  IF EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = p_user AND n.actor_id = me AND n.type = 'partner_invite' AND n.data->>'event_id' = p_event::TEXT) THEN
    RAISE EXCEPTION 'ALREADY_INVITED';
  END IF;
  IF (SELECT count(*) FROM notifications n WHERE n.actor_id = me AND n.type = 'partner_invite' AND n.created_at > now() - interval '24 hours') >= 10 THEN
    RAISE EXCEPTION 'TOO_MANY';
  END IF;
  PERFORM bt_notify(ARRAY[p_user], 'partner_invite', me, jsonb_build_object('event_id', p_event, 'event_title', e.title));
END $$;
GRANT EXECUTE ON FUNCTION invite_partner(UUID, UUID) TO authenticated;

-- ═══════════════════════════════ Push text ═══════════════════════════════
CREATE OR REPLACE FUNCTION public.bt_push_body(p_type text, p_lang text, p_actor text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT CASE
    WHEN p_lang = 'ar' THEN CASE p_type
      WHEN 'rsvp_join'       THEN 'انضمام جديد لجلستك: ' || coalesce(p_actor, '')
      WHEN 'event_full'      THEN 'اكتمل العدد'
      WHEN 'spot_opened'     THEN 'تحرّر مكان وتم تأكيد مشاركتك'
      WHEN 'event_cancelled' THEN 'تم إلغاء هذه الجلسة'
      WHEN 'beast'           THEN 'تفاعل جديد على منشورك من ' || coalesce(p_actor, '')
      WHEN 'comment'         THEN 'تعليق جديد على منشورك من ' || coalesce(p_actor, '')
      WHEN 'coach_request'   THEN 'طلب تدريب من ' || coalesce(p_actor, 'مدرب')
      WHEN 'coach_accepted'  THEN 'تمت الموافقة على طلب التدريب: ' || coalesce(p_actor, '')
      WHEN 'captain_assigned' THEN 'أنت الآن كابتن هذا المجتمع. أضف أول جلسة.'
      WHEN 'captain_nudge'   THEN 'جلسات هذا الأسبوع لم تكتمل بعد. أضف الجلسة التالية.'
      WHEN 'partner_invite'  THEN coalesce(p_actor, 'أحدهم') || ' يدعوك للتمرن معًا'
      WHEN 'club_verified'   THEN 'تم توثيق ناديك وأصبح ظاهرًا للجميع'
      ELSE 'بيست ترايب' END
    ELSE CASE p_type
      WHEN 'rsvp_join'       THEN coalesce(p_actor, 'Someone') || ' joined your session'
      WHEN 'event_full'      THEN 'The session is full'
      WHEN 'spot_opened'     THEN 'A spot opened up. You''re in.'
      WHEN 'event_cancelled' THEN 'This session was cancelled'
      WHEN 'beast'           THEN coalesce(p_actor, 'Someone') || ' beasted your post'
      WHEN 'comment'         THEN coalesce(p_actor, 'Someone') || ' commented on your post'
      WHEN 'coach_request'   THEN coalesce(p_actor, 'A coach') || ' wants to coach you'
      WHEN 'coach_accepted'  THEN coalesce(p_actor, 'Someone') || ' accepted your coaching request'
      WHEN 'captain_assigned' THEN 'You''re now the Beast Captain here. Put the first session on the board.'
      WHEN 'captain_nudge'   THEN 'This week''s sessions aren''t all on the board yet. Add the next one.'
      WHEN 'partner_invite'  THEN coalesce(p_actor, 'Someone') || ' invited you to train together'
      WHEN 'club_verified'   THEN 'Your club is verified and now listed for everyone'
      ELSE 'Beast Tribe' END
  END
$function$;

-- ═══════════════════════════════ Assistant ═══════════════════════════════
CREATE TABLE IF NOT EXISTS assistant_usage (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
ALTER TABLE assistant_usage ENABLE ROW LEVEL SECURITY; -- no policies: the admin site (service role) only

-- Counts one question; false once the member has used today's allowance.
CREATE OR REPLACE FUNCTION assistant_take(p_user UUID, p_limit INT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v INT;
BEGIN
  INSERT INTO assistant_usage (user_id, day, count) VALUES (p_user, (now() AT TIME ZONE 'Asia/Riyadh')::DATE, 1)
  ON CONFLICT (user_id, day) DO UPDATE SET count = assistant_usage.count + 1
  RETURNING count INTO v;
  RETURN v <= p_limit;
END $$;
REVOKE ALL ON FUNCTION assistant_take(UUID, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION assistant_take(UUID, INT) TO service_role;
