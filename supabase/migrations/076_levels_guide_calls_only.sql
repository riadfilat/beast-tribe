-- 076 — Levels guide who is called, not who may join (user, 2026-10-04): a member's level is private
-- (self-chosen, blended with teammates' ratings); turning someone away would reveal it. Anyone who
-- can see a session may join it; the call-outs (bt_call_players) still go to the right level first.

BEGIN;

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

COMMIT;
