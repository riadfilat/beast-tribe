-- 065 Training-partner switches, and guests invited to community sessions by link.
--
-- Partners: same_community and same_gender replace women_only (kept in sync for old app builds).
-- If either person asks for one, the pair must satisfy it.
--
-- Guests by invite: the host of a community session can let people outside the community join with
-- the session's private link (events.guest_invite + events.guest_token). It is not listed on any board.
-- A community can switch this off (communities.allow_guests; companies decide from the dashboard).
-- Guests see the session after they join (events_select: people with a booking can see it).

-- ═══════════════════════════════ Partners ═══════════════════════════════
ALTER TABLE partner_profiles
  ADD COLUMN IF NOT EXISTS same_community BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS same_gender BOOLEAN NOT NULL DEFAULT false;
UPDATE partner_profiles SET same_gender = true WHERE women_only AND NOT same_gender;

CREATE OR REPLACE FUNCTION bt_partner_profiles_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  g TEXT := lower(coalesce((SELECT gender FROM profiles WHERE id = NEW.user_id), ''));
BEGIN
  -- Old builds still send women_only: treat it as same gender.
  IF NEW.women_only AND NOT NEW.same_gender THEN NEW.same_gender := true; END IF;
  -- Same gender needs a gender on the profile.
  IF NEW.same_gender AND g NOT IN ('female', 'male') THEN NEW.same_gender := false; END IF;
  NEW.women_only := NEW.same_gender AND g = 'female';
  NEW.updated_at := now();
  RETURN NEW;
END $$;

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
      -- Same gender: if either of the two asks for it, both must have the same gender.
      AND (NOT (my.same_gender OR pp.same_gender) OR (my_gender IS NOT NULL AND lower(p.gender) = lower(my_gender)))
      -- Same community: if either asks for it, they must share a real community (not the default one).
      AND (NOT (my.same_community OR pp.same_community) OR EXISTS (
            SELECT 1 FROM community_members a JOIN community_members b2 ON b2.community_id = a.community_id
            JOIN communities co ON co.id = a.community_id
            WHERE a.user_id = me AND b2.user_id = p.id AND NOT co.is_default AND co.is_active))
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

-- ═══════════════════════════════ Guests by invite ═══════════════════════════════
ALTER TABLE communities ADD COLUMN IF NOT EXISTS allow_guests BOOLEAN NOT NULL DEFAULT true;
GRANT SELECT (allow_guests) ON communities TO authenticated;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS guest_invite BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guest_token TEXT;

CREATE OR REPLACE FUNCTION bt_events_guest_invite() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT NEW.guest_invite THEN
    NEW.guest_token := NULL;
    RETURN NEW;
  END IF;
  IF NEW.visibility <> 'community' OR NEW.community_id IS NULL THEN
    NEW.guest_invite := false;
    NEW.guest_token := NULL;
    RETURN NEW;
  END IF;
  IF NOT bt_trusted_caller() AND NOT coalesce((SELECT allow_guests FROM communities WHERE id = NEW.community_id), true) THEN
    RAISE EXCEPTION 'GUESTS_OFF' USING ERRCODE = '42501';
  END IF;
  IF NEW.guest_token IS NULL OR (TG_OP = 'UPDATE' AND NOT OLD.guest_invite) THEN
    NEW.guest_token := substr(md5(gen_random_uuid()::TEXT || clock_timestamp()::TEXT), 1, 12);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_events_guest_invite ON events;
CREATE TRIGGER trg_events_guest_invite BEFORE INSERT OR UPDATE OF guest_invite, visibility, community_id ON events
  FOR EACH ROW EXECUTE FUNCTION bt_events_guest_invite();

-- Guests who joined can see the session (and only then). A definer function avoids the
-- events ↔ event_rsvps policy loop.
CREATE OR REPLACE FUNCTION bt_my_guest_event_ids() RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.event_id FROM event_rsvps r JOIN events e ON e.id = r.event_id
  WHERE r.user_id = auth.uid() AND e.guest_invite
$$;
GRANT EXECUTE ON FUNCTION bt_my_guest_event_ids() TO authenticated;

DROP POLICY IF EXISTS events_select ON events;
CREATE POLICY events_select ON events FOR SELECT USING (
  created_by = (SELECT auth.uid())
  OR (visibility = 'pack' AND pack_id IN (SELECT bt_my_pack_ids()))
  OR (visibility = 'community' AND (guest_open OR community_id IN (SELECT bt_visible_community_ids())))
  OR (guest_invite AND id IN (SELECT bt_my_guest_event_ids()))
  OR (SELECT is_admin())
);

CREATE OR REPLACE FUNCTION public.bt_rsvp_before()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_event events%ROWTYPE;
  v_gender TEXT;
  v_going INT;
  v_guests INT;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  IF NEW.status NOT IN ('going', 'waitlist') THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_event FROM events WHERE id = NEW.event_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENT_NOT_FOUND';
  END IF;

  IF v_event.created_by = NEW.user_id THEN
    NEW.status := 'going';
    RETURN NEW;
  END IF;

  IF v_event.cancelled_at IS NOT NULL THEN
    RAISE EXCEPTION 'EVENT_CANCELLED';
  END IF;
  IF coalesce(v_event.ends_at, v_event.starts_at + interval '2 hours') < now() THEN
    RAISE EXCEPTION 'EVENT_OVER';
  END IF;
  IF v_event.is_women_only THEN
    SELECT lower(gender) INTO v_gender FROM profiles WHERE id = NEW.user_id;
    IF v_gender IS NULL THEN
      RAISE EXCEPTION 'GENDER_NEEDED';
    ELSIF v_gender <> 'female' THEN
      RAISE EXCEPTION 'WOMEN_ONLY';
    END IF;
  END IF;
  IF v_event.visibility = 'pack' AND NOT EXISTS (
    SELECT 1 FROM pack_members WHERE pack_id = v_event.pack_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'PACK_ONLY';
  END IF;
  IF v_event.visibility = 'community' AND NOT EXISTS (
    SELECT 1 FROM communities c WHERE c.id = v_event.community_id AND c.visibility = 'open' AND c.is_active
  ) AND NOT EXISTS (
    SELECT 1 FROM community_members WHERE community_id = v_event.community_id AND user_id = NEW.user_id
  ) THEN
    -- Outsiders: a guest class (listed), or a session whose host invites guests with its link
    -- (join_as_guest sets bt.guest_invite to this session's id after checking the link's token).
    IF NOT v_event.guest_open
       AND NOT (v_event.guest_invite AND coalesce(current_setting('bt.guest_invite', true), '') = NEW.event_id::TEXT) THEN
      RAISE EXCEPTION 'COMMUNITY_ONLY';
    END IF;
    IF v_event.guest_spots IS NOT NULL THEN
      SELECT count(*) INTO v_guests FROM event_rsvps r
      WHERE r.event_id = NEW.event_id AND r.status = 'going' AND r.user_id <> NEW.user_id
        AND NOT EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = v_event.community_id AND m.user_id = r.user_id);
      IF v_guests >= v_event.guest_spots THEN
        RAISE EXCEPTION 'GUESTS_FULL';
      END IF;
    END IF;
  END IF;

  IF v_event.max_capacity IS NOT NULL THEN
    SELECT count(*) INTO v_going FROM event_rsvps
    WHERE event_id = NEW.event_id AND status = 'going' AND user_id <> NEW.user_id;
    NEW.status := CASE WHEN v_going >= v_event.max_capacity THEN 'waitlist' ELSE 'going' END;
  ELSE
    NEW.status := 'going';
  END IF;
  RETURN NEW;
END $function$;

-- What a guest sees before joining (only with the right link).
CREATE OR REPLACE FUNCTION guest_session_preview(p_event UUID, p_token TEXT)
RETURNS TABLE (id UUID, title TEXT, sport TEXT, starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ, place TEXT, city TEXT,
               host TEXT, community TEXT, going INT, capacity INT, women_only BOOLEAN, guest_spots INT, image_url TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.id, e.title, e.event_type, e.starts_at, e.ends_at, e.location_name, e.location_city,
         coalesce(nullif(p.display_name, ''), p.full_name), c.name,
         (SELECT count(*)::INT FROM event_rsvps r WHERE r.event_id = e.id AND r.status = 'going'),
         e.max_capacity, coalesce(e.is_women_only, false), e.guest_spots, e.image_url
  FROM events e
  LEFT JOIN profiles p ON p.id = e.created_by
  LEFT JOIN communities c ON c.id = e.community_id
  WHERE e.id = p_event AND e.guest_invite AND e.guest_token = p_token AND e.cancelled_at IS NULL
    AND coalesce(e.ends_at, e.starts_at + interval '2 hours') > now()
$$;
GRANT EXECUTE ON FUNCTION guest_session_preview(UUID, TEXT) TO authenticated, anon;

-- Join with the link. All the usual checks (women only, capacity, guest spots) still apply.
CREATE OR REPLACE FUNCTION join_as_guest(p_event UUID, p_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := auth.uid();
  v_status TEXT;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN'; END IF;
  IF NOT EXISTS (SELECT 1 FROM events e WHERE e.id = p_event AND e.guest_invite AND e.guest_token = p_token) THEN
    RAISE EXCEPTION 'LINK_INVALID';
  END IF;
  PERFORM set_config('bt.guest_invite', p_event::TEXT, true);
  INSERT INTO event_rsvps (event_id, user_id, status) VALUES (p_event, me, 'going')
  ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'going'
  RETURNING status INTO v_status;
  PERFORM set_config('bt.guest_invite', '', true);
  RETURN v_status;
END $$;
GRANT EXECUTE ON FUNCTION join_as_guest(UUID, TEXT) TO authenticated;
