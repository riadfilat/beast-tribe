-- 088: courts we can't see into (no integration). The host books the court with the venue and says
-- so in the app: booked, or "I'll book it". An optional court price is split between everyone in and
-- paid at the venue. Places can carry the venue's phone and booking link. Reminders: the host the
-- evening before, players 3 hours before, while the court is still not booked.

ALTER TABLE popular_locations
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS booking_url text;
ALTER TABLE popular_locations DROP CONSTRAINT IF EXISTS popular_locations_booking_url_chk;
ALTER TABLE popular_locations ADD CONSTRAINT popular_locations_booking_url_chk CHECK (booking_url IS NULL OR booking_url ~* '^https?://');

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS court_booking text,
  ADD COLUMN IF NOT EXISTS court_nudged_at timestamptz,
  ADD COLUMN IF NOT EXISTS court_warned_at timestamptz;
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_court_booking_chk;
ALTER TABLE events ADD CONSTRAINT events_court_booking_chk CHECK (court_booking IS NULL OR court_booking IN ('booked', 'pending'));
GRANT SELECT (court_booking) ON events TO authenticated;
GRANT SELECT (phone, booking_url) ON popular_locations TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.bt_court_resplit(p_event uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_court NUMERIC(8, 2);
  v_in INT;
  v_share NUMERIC(8, 2);
BEGIN
  SELECT b.price_sar INTO v_court FROM facility_bookings b WHERE b.event_id = p_event AND b.status = 'confirmed' LIMIT 1;
  -- A court booked with the venue: the price the host entered.
  IF v_court IS NULL THEN
    SELECT e.court_sar INTO v_court FROM events e WHERE e.id = p_event AND e.facility_id IS NULL;
  END IF;
  IF v_court IS NULL THEN RETURN; END IF;
  SELECT count(*)::INT INTO v_in FROM event_rsvps r WHERE r.event_id = p_event AND r.status = 'going';
  v_share := round(v_court / greatest(1, v_in), 2);
  -- Runs from the RSVP trigger (depth > 1), so the money guards let it through.
  UPDATE events SET court_sar = v_court, share_sar = v_share
  WHERE id = p_event AND (court_sar IS DISTINCT FROM v_court OR share_sar IS DISTINCT FROM v_share);
  UPDATE session_dues SET amount_sar = v_share
  WHERE event_id = p_event AND kind = 'share' AND paid_at IS NULL AND amount_sar IS DISTINCT FROM v_share;
END $function$
;

CREATE OR REPLACE FUNCTION public.bt_rsvp_dues()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  e events%ROWTYPE;
  v_event UUID := coalesce(NEW.event_id, OLD.event_id);
  v_left BOOLEAN := TG_OP IN ('UPDATE', 'DELETE') AND OLD.status = 'going' AND (TG_OP = 'DELETE' OR NEW.status <> 'going');
  v_joined BOOLEAN := TG_OP IN ('INSERT', 'UPDATE') AND NEW.status = 'going' AND (TG_OP = 'INSERT' OR OLD.status <> 'going');
BEGIN
  IF NOT v_left AND NOT v_joined THEN RETURN NULL; END IF;
  -- Left the session: nothing owed any more (a paid one stays on record).
  IF v_left THEN
    DELETE FROM session_dues WHERE event_id = OLD.event_id AND user_id = OLD.user_id AND paid_at IS NULL;
  END IF;
  SELECT * INTO e FROM events WHERE id = v_event;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF e.share_sar IS NOT NULL THEN
    -- A court: everyone in pays the same, so every unpaid share moves when someone joins or leaves.
    -- Dues only for courts booked in the app (the venue ticks them paid); a venue court is settled there.
    IF v_joined AND e.facility_id IS NOT NULL AND coalesce(e.court_sar, e.share_sar) > 0 THEN
      INSERT INTO session_dues (event_id, user_id, kind, amount_sar) VALUES (e.id, NEW.user_id, 'share', e.share_sar)
      ON CONFLICT (event_id, user_id) DO NOTHING;
    END IF;
    PERFORM bt_court_resplit(e.id);
  ELSIF v_joined AND e.guest_open AND coalesce(e.guest_price_sar, 0) > 0 AND NEW.user_id IS DISTINCT FROM e.created_by AND e.community_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = e.community_id AND m.user_id = NEW.user_id) THEN
    INSERT INTO session_dues (event_id, user_id, kind, amount_sar) VALUES (e.id, NEW.user_id, 'guest', e.guest_price_sar)
    ON CONFLICT (event_id, user_id) DO NOTHING;
  END IF;
  RETURN NULL;
END $function$
;

-- The host says whether the court is booked and, if they like, what it costs.
CREATE OR REPLACE FUNCTION public.set_session_court(p_event uuid, p_booking text, p_price numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v events%ROWTYPE;
  v_price numeric(8, 2) := CASE WHEN coalesce(p_price, 0) > 0 THEN round(p_price, 2) END;
  v_in int;
BEGIN
  SELECT * INTO v FROM events WHERE id = p_event FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'EVENT_NOT_FOUND'; END IF;
  IF v.created_by IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'NOT_HOST'; END IF;
  IF v.cancelled_at IS NOT NULL THEN RAISE EXCEPTION 'EVENT_CANCELLED'; END IF;
  IF v.facility_id IS NOT NULL THEN RAISE EXCEPTION 'COURT_FIXED'; END IF;
  IF p_booking IS NOT NULL AND p_booking NOT IN ('booked', 'pending') THEN RAISE EXCEPTION 'generic'; END IF;
  IF v_price IS NOT NULL AND v_price > 5000 THEN RAISE EXCEPTION 'generic'; END IF;

  SELECT count(*)::int INTO v_in FROM event_rsvps WHERE event_id = p_event AND status = 'going';
  PERFORM set_config('bt.trusted', '1', true);
  UPDATE events SET
    court_booking = p_booking,
    court_sar = v_price,
    share_sar = CASE WHEN v_price IS NULL THEN NULL ELSE round(v_price / greatest(1, v_in), 2) END,
    -- Back to "I'll book it": the reminders may go out again.
    court_nudged_at = CASE WHEN p_booking = 'pending' AND v.court_booking IS DISTINCT FROM 'pending' THEN NULL ELSE court_nudged_at END,
    court_warned_at = CASE WHEN p_booking = 'pending' AND v.court_booking IS DISTINCT FROM 'pending' THEN NULL ELSE court_warned_at END
  WHERE id = p_event;
  PERFORM set_config('bt.trusted', '', true);

  IF p_booking = 'booked' AND v.court_booking = 'pending' THEN
    PERFORM bt_notify(
      ARRAY(SELECT user_id FROM event_rsvps WHERE event_id = p_event AND status IN ('going', 'waitlist') AND user_id <> v.created_by),
      'court_booked', v.created_by, jsonb_build_object('event_id', v.id, 'event_title', v.title));
  END IF;
END $fn$;
REVOKE ALL ON FUNCTION public.set_session_court(uuid, text, numeric) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_session_court(uuid, text, numeric) TO authenticated;

-- Still "I'll book it": nudge the host the evening before (from 6 PM Riyadh, or within 12 hours),
-- then tell everyone in 3 hours before. Each goes out once.
CREATE OR REPLACE FUNCTION public.bt_court_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT id, title, created_by FROM events
    WHERE court_booking = 'pending' AND cancelled_at IS NULL AND court_nudged_at IS NULL
      AND starts_at > now() + interval '3 hours' AND starts_at < now() + interval '30 hours'
      AND (extract(hour FROM now() AT TIME ZONE 'Asia/Riyadh') >= 18 OR starts_at < now() + interval '12 hours')
  LOOP
    PERFORM bt_notify(ARRAY[r.created_by], 'court_unbooked_host', NULL, jsonb_build_object('event_id', r.id, 'event_title', r.title));
    UPDATE events SET court_nudged_at = now() WHERE id = r.id;
  END LOOP;

  FOR r IN
    SELECT id, title, created_by FROM events
    WHERE court_booking = 'pending' AND cancelled_at IS NULL AND court_warned_at IS NULL
      AND starts_at > now() AND starts_at <= now() + interval '3 hours'
  LOOP
    PERFORM bt_notify(
      ARRAY(SELECT user_id FROM event_rsvps WHERE event_id = r.id AND status IN ('going', 'waitlist') AND user_id <> r.created_by),
      'court_unbooked', r.created_by, jsonb_build_object('event_id', r.id, 'event_title', r.title));
    UPDATE events SET court_warned_at = now() WHERE id = r.id;
  END LOOP;
END $fn$;
REVOKE ALL ON FUNCTION public.bt_court_reminders() FROM public, anon, authenticated;

SELECT cron.unschedule('court-reminders') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'court-reminders');
SELECT cron.schedule('court-reminders', '*/15 * * * *', 'SELECT public.bt_court_reminders()');

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
      WHEN 'court_booked'    THEN 'تم حجز الملعب. نراك هناك.'
      WHEN 'court_unbooked_host' THEN 'هل حجزت الملعب؟ المشاركون ينتظرون.'
      WHEN 'court_unbooked'  THEN 'لم يُحجز الملعب بعد. تواصل مع المنظّم قبل أن تذهب.'
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
      WHEN 'court_booked'    THEN 'The court is booked. See you there.'
      WHEN 'court_unbooked_host' THEN 'Booked the court yet? Players are counting on it.'
      WHEN 'court_unbooked'  THEN 'The court isn''t booked yet. Check with the host before you go.'
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
