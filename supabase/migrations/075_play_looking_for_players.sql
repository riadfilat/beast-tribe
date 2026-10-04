-- 075 — "Play": looking for players at the same level, a short waiting list, calls every 2 hours.
-- User, 2026-10-04: a session shows on the board that it is looking for players; from creation it
-- notifies players at the same level, then every 2 hours until the seats fill; if the same level
-- can't fill it, one level lower may join (intermediate can join advanced); up to 3 extra seats as
-- a waiting list; filled sessions show it.

BEGIN;

-- Waiting list size per session (0–3), and the call-out bookkeeping (Beast Tribe sets these).
ALTER TABLE events ADD COLUMN IF NOT EXISTS waitlist_max INT NOT NULL DEFAULT 3 CHECK (waitlist_max BETWEEN 0 AND 3);
ALTER TABLE events ADD COLUMN IF NOT EXISTS call_round INT NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS last_call_at TIMESTAMPTZ;
-- events SELECT is column-level since 073: members read the waiting-list size.
GRANT SELECT (waitlist_max) ON events TO authenticated;

CREATE OR REPLACE FUNCTION public.bt_events_calls_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF bt_trusted_caller() OR pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.call_round := 0;
    NEW.last_call_at := NULL;
  ELSE
    NEW.call_round := OLD.call_round;
    NEW.last_call_at := OLD.last_call_at;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_events_calls_guard ON events;
CREATE TRIGGER trg_events_calls_guard BEFORE INSERT OR UPDATE ON events FOR EACH ROW EXECUTE FUNCTION bt_events_calls_guard();

-- Who has been called for which session (each member at most once per session).
CREATE TABLE IF NOT EXISTS session_calls (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  round INT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);
ALTER TABLE session_calls ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON session_calls FROM anon, authenticated;

-- One round of "looking for players" for a session. Round 1 calls players at the session's level
-- (and members whose level we don't know yet); later rounds also call one level lower. Only members
-- who can join (its community or group, its city for open communities, women for women-only, people
-- who play the sport), never twice for the same session, at most 3 such calls a day per member.
CREATE OR REPLACE FUNCTION public.bt_call_players(p_event UUID)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  e events%ROWTYPE;
  v_sport TEXT;
  v_need NUMERIC;
  v_round INT;
  v_open INT;
  v_ids UUID[];
BEGIN
  SELECT * INTO e FROM events WHERE id = p_event;
  IF NOT FOUND OR e.cancelled_at IS NOT NULL OR e.max_capacity IS NULL OR e.starts_at < now() + interval '1 hour' THEN
    RETURN 0;
  END IF;
  v_open := e.max_capacity - (SELECT count(*) FROM event_rsvps r WHERE r.event_id = e.id AND r.status = 'going');
  IF v_open <= 0 THEN RETURN 0; END IF;
  v_round := e.call_round + 1;
  v_sport := bt_sport_slug(coalesce((SELECT s.name FROM sports s WHERE s.id = e.sport_id), e.event_type));
  v_need := CASE e.difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 WHEN 'hard' THEN 3 END;

  SELECT array_agg(x.u) INTO v_ids FROM (
    SELECT m.user_id AS u
    FROM (
      SELECT cm.user_id FROM community_members cm WHERE e.visibility = 'community' AND cm.community_id = e.community_id
      UNION
      SELECT pm.user_id FROM pack_members pm WHERE e.visibility = 'pack' AND pm.pack_id = e.pack_id
    ) m
    JOIN profiles pr ON pr.id = m.user_id
    WHERE m.user_id <> e.created_by
      AND NOT EXISTS (SELECT 1 FROM event_rsvps r WHERE r.event_id = e.id AND r.user_id = m.user_id)
      AND NOT EXISTS (SELECT 1 FROM session_calls sc WHERE sc.event_id = e.id AND sc.user_id = m.user_id)
      AND (NOT e.is_women_only OR lower(pr.gender) = 'female')
      AND v_sport = ANY (bt_member_sports(m.user_id))
      AND (e.visibility <> 'community' OR NOT coalesce(e.open_scope, false) OR e.city_key IS NULL OR bt_city_key(pr.city) = e.city_key)
      AND (v_need IS NULL OR CASE
            WHEN v_round = 1 THEN abs(coalesce(bt_level_of(m.user_id, v_sport), v_need) - v_need) < 0.75
            ELSE coalesce(bt_level_of(m.user_id, v_sport), v_need) >= v_need - 1.25 END)
      AND (SELECT count(*) FROM notifications n WHERE n.user_id = m.user_id AND n.type = 'players_wanted' AND n.created_at > now() - interval '1 day') < 3
    ORDER BY random()
    LIMIT 60
  ) x;

  UPDATE events SET call_round = v_round, last_call_at = now() WHERE id = e.id;
  IF v_ids IS NULL THEN RETURN 0; END IF;
  INSERT INTO session_calls (event_id, user_id, round) SELECT e.id, u, v_round FROM unnest(v_ids) u ON CONFLICT DO NOTHING;
  PERFORM bt_notify(v_ids, 'players_wanted', e.created_by,
    jsonb_build_object('event_id', e.id, 'event_title', e.title, 'level', e.difficulty, 'open', v_open));
  RETURN array_length(v_ids, 1);
END $$;
REVOKE ALL ON FUNCTION public.bt_call_players(UUID) FROM PUBLIC, anon, authenticated;

-- Waking hours in Riyadh (07:00–21:59): nobody gets a call-out at night.
CREATE OR REPLACE FUNCTION public.bt_call_hours() RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT extract(hour FROM now() AT TIME ZONE 'Asia/Riyadh') BETWEEN 7 AND 21
$$;

-- The moment a session with seats goes on the board (within the next 3 days), the first call goes out.
CREATE OR REPLACE FUNCTION public.bt_events_first_call()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.max_capacity IS NOT NULL AND NEW.cancelled_at IS NULL AND bt_call_hours()
     AND NEW.starts_at BETWEEN now() + interval '1 hour' AND now() + interval '3 days' THEN
    PERFORM bt_call_players(NEW.id);
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_events_first_call ON events;
CREATE TRIGGER trg_events_first_call AFTER INSERT ON events FOR EACH ROW EXECUTE FUNCTION bt_events_first_call();

-- Every 30 minutes: sessions in the next 3 days still short of players, last called 2+ hours ago
-- (or never), at most 6 rounds.
CREATE OR REPLACE FUNCTION public.bt_players_wanted_job()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD; n INT := 0;
BEGIN
  IF NOT bt_call_hours() THEN RETURN 0; END IF;
  FOR r IN
    SELECT e.id FROM events e
    WHERE e.max_capacity IS NOT NULL AND e.cancelled_at IS NULL
      AND e.starts_at BETWEEN now() + interval '1 hour' AND now() + interval '3 days'
      AND coalesce(e.last_call_at, '-infinity') < now() - interval '2 hours'
      AND e.call_round < 6
      AND (SELECT count(*) FROM event_rsvps x WHERE x.event_id = e.id AND x.status = 'going') < e.max_capacity
  LOOP
    n := n + bt_call_players(r.id);
  END LOOP;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.bt_players_wanted_job() FROM PUBLIC, anon, authenticated;

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
  v_need NUMERIC;
  v_level NUMERIC;
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

  -- Level: a session set for a level takes that level, or one level below (the member's level is
  -- private: self-chosen, blended with teammates' ratings; unknown levels are welcome).
  IF v_event.difficulty IN ('easy', 'medium', 'hard') THEN
    v_need := CASE v_event.difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END;
    v_level := bt_level_of(NEW.user_id, bt_sport_slug(coalesce((SELECT s.name FROM sports s WHERE s.id = v_event.sport_id), v_event.event_type)));
    IF v_level IS NOT NULL AND v_level < v_need - 1.25 THEN
      RAISE EXCEPTION 'LEVEL';
    END IF;
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
      WHEN 'photo_review'    THEN 'صور بانتظار المراجعة'
      WHEN 'photo_overdue'   THEN 'صور تنتظر المراجعة منذ أكثر من 48 ساعة'
      WHEN 'community_request' THEN 'طلب مجتمع جديد من ' || coalesce(p_actor, 'عضو')
      WHEN 'players_wanted'  THEN coalesce(p_actor, 'أحدهم') || ' يبحث عن لاعبين بمستواك. انضم الآن.'
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
      WHEN 'photo_review'    THEN 'Photos are waiting for review'
      WHEN 'photo_overdue'   THEN 'Photos have waited over 48 hours for review'
      WHEN 'community_request' THEN 'New community request from ' || coalesce(p_actor, 'a member')
      WHEN 'players_wanted'  THEN coalesce(p_actor, 'Someone') || ' is looking for players at your level. Jump in.'
      ELSE 'Beast Tribe' END
  END
$function$;

DO $$
BEGIN
  PERFORM cron.unschedule('players-wanted') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'players-wanted');
  PERFORM cron.schedule('players-wanted', '*/30 * * * *', 'SELECT public.bt_players_wanted_job()');
END $$;

COMMIT;
