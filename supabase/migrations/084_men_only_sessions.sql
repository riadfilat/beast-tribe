-- 084: men-only sessions, alongside women-only.
-- Only men host them and only men join (MEN_ONLY); a session can't be both. Call-outs and partner
-- invites respect it too.

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_men_only BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_one_gender_only;
ALTER TABLE public.events ADD CONSTRAINT events_one_gender_only CHECK (NOT (coalesce(is_women_only, false) AND is_men_only));
-- Column grants since 073: readable by members.
GRANT SELECT (is_men_only) ON public.events TO authenticated;

CREATE OR REPLACE FUNCTION public.bt_events_men_only_host()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE g TEXT;
BEGIN
  IF NOT coalesce(NEW.is_men_only, false) OR bt_trusted_caller() THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND coalesce(OLD.is_men_only, false) THEN RETURN NEW; END IF;
  g := bt_my_gender();
  IF g IS NULL THEN RAISE EXCEPTION 'GENDER_NEEDED' USING ERRCODE = '42501'; END IF;
  IF g <> 'male' THEN RAISE EXCEPTION 'MEN_ONLY_HOST' USING ERRCODE = '42501'; END IF;
  RETURN NEW;
END $function$;
DROP TRIGGER IF EXISTS trg_events_men_only_host ON public.events;
CREATE TRIGGER trg_events_men_only_host BEFORE INSERT OR UPDATE OF is_men_only ON public.events FOR EACH ROW EXECUTE FUNCTION bt_events_men_only_host();
REVOKE ALL ON FUNCTION public.bt_events_men_only_host() FROM PUBLIC, anon, authenticated;

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
  v_wait INT;
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
  IF v_event.is_men_only THEN
    SELECT lower(gender) INTO v_gender FROM profiles WHERE id = NEW.user_id;
    IF v_gender IS NULL THEN
      RAISE EXCEPTION 'GENDER_NEEDED';
    ELSIF v_gender <> 'male' THEN
      RAISE EXCEPTION 'MEN_ONLY';
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

  -- Court rules (e.g. one padel booking a day), counted for invited players too.
  IF v_event.facility_id IS NOT NULL THEN
    PERFORM bt_check_daily_limit(NEW.user_id, v_event.facility_id, v_event.starts_at, NEW.event_id);
  END IF;

  IF v_event.max_capacity IS NOT NULL THEN
    SELECT count(*) INTO v_going FROM event_rsvps
    WHERE event_id = NEW.event_id AND status = 'going' AND user_id <> NEW.user_id;
    IF v_going >= v_event.max_capacity THEN
      -- A short waiting list (0–3, set by the host) in case someone drops; beyond it the session is full.
      SELECT count(*) INTO v_wait FROM event_rsvps
      WHERE event_id = NEW.event_id AND status = 'waitlist' AND user_id <> NEW.user_id;
      IF v_wait >= coalesce(v_event.waitlist_max, 3) THEN
        RAISE EXCEPTION 'FULL';
      END IF;
      NEW.status := 'waitlist';
    ELSE
      NEW.status := 'going';
    END IF;
  ELSE
    NEW.status := 'going';
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.bt_call_players(p_event uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        AND (NOT coalesce(e.is_men_only, false) OR lower(pr.gender) = 'male')
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

CREATE OR REPLACE FUNCTION public.invite_partner(p_user uuid, p_event uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  IF e.is_men_only AND coalesce((SELECT gender FROM profiles WHERE id = p_user), '') <> 'male' THEN RAISE EXCEPTION 'MEN_ONLY'; END IF;
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
END $function$;
