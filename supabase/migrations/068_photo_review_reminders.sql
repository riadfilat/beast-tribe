-- 068 Photo review window: Beast Tribe admins review flagged / unchecked photos within 48 hours.
-- An hourly job reminds admins (push + inbox) while photos wait: soon after new ones arrive, then
-- every 6 hours, every 3 hours once any photo is past 48 hours ("overdue"), until the queue is empty.

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
      ELSE 'Beast Tribe' END
  END
$function$
;

CREATE OR REPLACE FUNCTION bt_photo_reminders() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pending INT;
  v_overdue INT;
  v_last TIMESTAMPTZ;
  v_fresh BOOLEAN;
  v_admins UUID[];
BEGIN
  SELECT count(*), count(*) FILTER (WHERE created_at < now() - interval '48 hours')
    INTO v_pending, v_overdue
    FROM image_moderation_queue WHERE status = 'pending';
  IF v_pending = 0 THEN RETURN; END IF;
  SELECT nullif(value ->> 'last_reminder', '')::TIMESTAMPTZ INTO v_last FROM app_settings WHERE key = 'moderation';
  -- New photos since the last reminder that have waited 10 minutes (the automatic check gets a chance first).
  v_fresh := EXISTS (SELECT 1 FROM image_moderation_queue WHERE status = 'pending'
                     AND created_at > coalesce(v_last, '-infinity'::TIMESTAMPTZ) AND created_at < now() - interval '10 minutes');
  IF NOT (v_last IS NULL
          OR now() - v_last >= CASE WHEN v_overdue > 0 THEN interval '3 hours' ELSE interval '6 hours' END
          OR (v_fresh AND now() - v_last >= interval '1 hour')) THEN
    RETURN;
  END IF;
  SELECT array_agg(user_id) INTO v_admins FROM admin_roles;
  IF v_admins IS NULL THEN RETURN; END IF;
  PERFORM bt_notify(v_admins, CASE WHEN v_overdue > 0 THEN 'photo_overdue' ELSE 'photo_review' END, NULL,
                    jsonb_build_object('count', v_pending, 'overdue', v_overdue, 'url', 'https://beast-tribe.vercel.app/moderation'));
  UPDATE app_settings SET value = value || jsonb_build_object('last_reminder', now()) WHERE key = 'moderation';
END $$;
REVOKE ALL ON FUNCTION bt_photo_reminders() FROM PUBLIC, anon, authenticated;

SELECT cron.unschedule('photo-review-reminders') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'photo-review-reminders');
SELECT cron.schedule('photo-review-reminders', '7 * * * *', 'SELECT public.bt_photo_reminders()');
