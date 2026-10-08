-- 086: hosts can edit a session they posted (name, time, place, spots, level, notes).
-- One function does it so the rules live in one place: only the host, only before it starts,
-- a court booking keeps its time and place, spots never drop below who's already in, more spots
-- move people up from the waiting list, and everyone in hears when the time or place changes.

CREATE OR REPLACE FUNCTION public.update_session(
  p_event uuid,
  p_title text,
  p_starts_at timestamptz,
  p_duration_min int,
  p_place text,
  p_capacity int,
  p_difficulty text,
  p_notes text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v events%ROWTYPE;
  v_ends timestamptz;
  v_place text := nullif(btrim(coalesce(p_place, '')), '');
  v_moved boolean;
  v_going int;
  v_next uuid;
BEGIN
  SELECT * INTO v FROM events WHERE id = p_event FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'EVENT_NOT_FOUND'; END IF;
  IF v.created_by IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'NOT_HOST'; END IF;
  IF v.cancelled_at IS NOT NULL THEN RAISE EXCEPTION 'EVENT_CANCELLED'; END IF;
  IF v.starts_at <= now() THEN RAISE EXCEPTION 'STARTED'; END IF;
  IF nullif(btrim(coalesce(p_title, '')), '') IS NULL THEN RAISE EXCEPTION 'TITLE_NEEDED'; END IF;
  IF p_difficulty IS NOT NULL AND p_difficulty NOT IN ('easy', 'medium', 'hard') THEN RAISE EXCEPTION 'generic'; END IF;

  v_ends := p_starts_at + make_interval(mins => greatest(15, least(coalesce(p_duration_min, 60), 600)));
  v_moved := p_starts_at IS DISTINCT FROM v.starts_at
          OR v_ends IS DISTINCT FROM coalesce(v.ends_at, v.starts_at + interval '2 hours')
          OR v_place IS DISTINCT FROM v.location_name;

  -- A court booking: the booked slot decides the time and place.
  IF v.facility_id IS NOT NULL AND v_moved THEN RAISE EXCEPTION 'COURT_FIXED'; END IF;
  IF p_starts_at < now() + interval '5 minutes' THEN RAISE EXCEPTION 'PAST_TIME'; END IF;

  SELECT count(*) INTO v_going FROM event_rsvps WHERE event_id = p_event AND status = 'going';
  IF NOT v.drop_in AND p_capacity IS NOT NULL AND p_capacity < greatest(v_going, 2) THEN
    RAISE EXCEPTION 'SPOTS_BELOW_GOING';
  END IF;

  UPDATE events SET
    title = btrim(p_title),
    starts_at = p_starts_at,
    ends_at = v_ends,
    location_name = v_place,
    -- A place typed by hand no longer matches the old map pin.
    location_lat = CASE WHEN v_place IS DISTINCT FROM v.location_name THEN NULL ELSE v.location_lat END,
    location_lng = CASE WHEN v_place IS DISTINCT FROM v.location_name THEN NULL ELSE v.location_lng END,
    max_capacity = CASE WHEN v.drop_in THEN NULL ELSE p_capacity END,
    difficulty = p_difficulty,
    description = nullif(btrim(coalesce(p_notes, '')), '')
  WHERE id = p_event;

  -- More spots (or no limit): move people up from the waiting list, oldest first.
  LOOP
    EXIT WHEN p_capacity IS NOT NULL AND v_going >= p_capacity;
    SELECT user_id INTO v_next FROM event_rsvps
    WHERE event_id = p_event AND status = 'waitlist' ORDER BY created_at LIMIT 1;
    EXIT WHEN v_next IS NULL;
    BEGIN
      UPDATE event_rsvps SET status = 'going' WHERE event_id = p_event AND user_id = v_next;
    EXCEPTION WHEN others THEN
      -- Someone the rules won't let in (e.g. a court's one-a-day rule) stays waiting.
      EXIT;
    END;
    SELECT count(*) INTO v_going FROM event_rsvps WHERE event_id = p_event AND status = 'going';
    EXIT WHEN NOT EXISTS (SELECT 1 FROM event_rsvps WHERE event_id = p_event AND user_id = v_next AND status = 'going');
  END LOOP;

  IF v_moved THEN
    PERFORM bt_notify(
      ARRAY(SELECT user_id FROM event_rsvps
            WHERE event_id = p_event AND status IN ('going', 'waitlist') AND user_id <> v.created_by),
      'event_changed', v.created_by,
      jsonb_build_object('event_id', v.id, 'event_title', btrim(p_title))
    );
  END IF;
END $fn$;

REVOKE ALL ON FUNCTION public.update_session(uuid, text, timestamptz, int, text, int, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.update_session(uuid, text, timestamptz, int, text, int, text, text) TO authenticated;

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
      WHEN 'event_changed'   THEN 'تغيّر موعد أو مكان جلسة انضممت إليها'
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
      WHEN 'event_changed'   THEN 'The time or place changed for a session you joined'
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
$function$
;
