-- 058 Arabic wording: a session on the board is a "جلسة"
-- The app now says جلسة for a session, تمرين for a workout and حركة for a single exercise.
-- Push notifications used تمرين for a session; bring them in line.
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
      ELSE 'Beast Tribe' END
  END
$function$;
