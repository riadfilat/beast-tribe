-- 053 Beast Captains
-- A Beast Captain is a coach assigned to a community to keep its board alive: a set number of open
-- sessions a week (three by default) that anyone in the community can drop into. It is a paid
-- service outside the subscription: the community pays an hourly rate, the captain is paid that
-- rate less Beast Tribe's share.
--  * community_captains: who, where, weekly target, hourly rate, share. Members can see who their
--    captains are; rates and shares are visible to the admin site only.
--  * events.captain_hosted is set by the database when a captain hosts in their community;
--    events.drop_in marks an open session ("come if you can").
--  * my_captaincies(): the captain's own week. captain_statement(): hours, billing and payout.

CREATE TABLE IF NOT EXISTS community_captains (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weekly_target INT NOT NULL DEFAULT 3 CHECK (weekly_target BETWEEN 1 AND 14),
  hourly_rate_sar NUMERIC(8, 2) CHECK (hourly_rate_sar IS NULL OR hourly_rate_sar >= 0),
  cut_pct NUMERIC(5, 2) CHECK (cut_pct IS NULL OR cut_pct BETWEEN 0 AND 100),
  starts_on DATE NOT NULL DEFAULT current_date,
  ends_on DATE,
  notes TEXT,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_captains_user ON community_captains (user_id);
ALTER TABLE community_captains ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS community_captains_select ON community_captains;
CREATE POLICY community_captains_select ON community_captains FOR SELECT USING (
  user_id = (SELECT auth.uid()) OR community_id IN (SELECT bt_visible_community_ids()) OR (SELECT is_admin())
);
-- Members see who and where; money stays with the admin site (service role).
REVOKE ALL ON community_captains FROM authenticated;
GRANT SELECT (community_id, user_id, weekly_target, starts_on, ends_on) ON community_captains TO authenticated;

-- Beast Tribe's default share of a captain's hourly rate, in percent.
INSERT INTO app_settings (key, value) VALUES ('captain', '{"cut_pct": 20}'::jsonb) ON CONFLICT (key) DO NOTHING;

-- ════ Sessions ════
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS drop_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS captain_hosted BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_events_captain ON events (created_by, community_id, starts_at) WHERE captain_hosted;

-- Only the database decides whether a session counts as captain-hosted.
CREATE OR REPLACE FUNCTION bt_events_captain() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.captain_hosted := NEW.visibility = 'community' AND EXISTS (
    SELECT 1 FROM community_captains c
    WHERE c.community_id = NEW.community_id AND c.user_id = NEW.created_by
      AND c.starts_on <= current_date AND (c.ends_on IS NULL OR c.ends_on >= current_date)
  );
  RETURN NEW;
END $$;
-- Named to run after trg_events_guard (which fills in the community).
DROP TRIGGER IF EXISTS trg_events_zcaptain ON events;
CREATE TRIGGER trg_events_zcaptain BEFORE INSERT ON events
  FOR EACH ROW EXECUTE FUNCTION bt_events_captain();

-- The Saudi week starts on Sunday, Riyadh time.
CREATE OR REPLACE FUNCTION bt_week_start(p_at TIMESTAMPTZ DEFAULT now()) RETURNS TIMESTAMPTZ
LANGUAGE sql STABLE AS $$
  SELECT (date_trunc('day', p_at AT TIME ZONE 'Asia/Riyadh')
          - (extract(dow FROM p_at AT TIME ZONE 'Asia/Riyadh')::INT * interval '1 day')) AT TIME ZONE 'Asia/Riyadh'
$$;

-- The captain's own view: where they are captain, and this week against the target.
CREATE OR REPLACE FUNCTION my_captaincies()
RETURNS TABLE (community_id UUID, name TEXT, weekly_target INT, this_week INT, next_week INT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.community_id, co.name, c.weekly_target,
    (SELECT count(*)::INT FROM events e WHERE e.captain_hosted AND e.created_by = c.user_id AND e.community_id = c.community_id
       AND e.cancelled_at IS NULL AND e.starts_at >= bt_week_start() AND e.starts_at < bt_week_start() + interval '7 days'),
    (SELECT count(*)::INT FROM events e WHERE e.captain_hosted AND e.created_by = c.user_id AND e.community_id = c.community_id
       AND e.cancelled_at IS NULL AND e.starts_at >= bt_week_start() + interval '7 days' AND e.starts_at < bt_week_start() + interval '14 days')
  FROM community_captains c JOIN communities co ON co.id = c.community_id
  WHERE c.user_id = auth.uid() AND c.starts_on <= current_date AND (c.ends_on IS NULL OR c.ends_on >= current_date)
  ORDER BY co.name
$$;
REVOKE ALL ON FUNCTION my_captaincies() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION my_captaincies() TO authenticated;

-- Hours, billing and payout between two dates (Riyadh days), one row per captain and community.
-- A session counts once it has started and was not cancelled. Hours come from its length (one hour
-- when it has no end, four at most).
CREATE OR REPLACE FUNCTION captain_statement(p_from DATE, p_to DATE)
RETURNS TABLE (community_id UUID, community TEXT, user_id UUID, captain TEXT, sessions INT, joined INT, hours NUMERIC,
               rate NUMERIC, cut_pct NUMERIC, billed NUMERIC, our_share NUMERIC, payout NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH def AS (SELECT coalesce((SELECT (value->>'cut_pct')::NUMERIC FROM app_settings WHERE key = 'captain'), 20) AS cut),
  held AS (
    SELECT e.community_id, e.created_by AS user_id, count(*)::INT AS sessions, coalesce(sum(e.going_count), 0)::INT AS joined,
           round(sum(least(240, greatest(15, extract(epoch FROM coalesce(e.ends_at, e.starts_at + interval '60 minutes') - e.starts_at) / 60))) / 60.0, 2) AS hours
    FROM events e
    WHERE e.captain_hosted AND e.cancelled_at IS NULL AND e.starts_at <= now()
      AND e.starts_at >= (p_from::TIMESTAMP AT TIME ZONE 'Asia/Riyadh')
      AND e.starts_at < ((p_to + 1)::TIMESTAMP AT TIME ZONE 'Asia/Riyadh')
    GROUP BY e.community_id, e.created_by
  )
  SELECT c.community_id, co.name, c.user_id, coalesce(p.display_name, p.full_name, 'Captain'),
         coalesce(h.sessions, 0), coalesce(h.joined, 0), coalesce(h.hours, 0),
         coalesce(c.hourly_rate_sar, 0), coalesce(c.cut_pct, def.cut),
         round(coalesce(h.hours, 0) * coalesce(c.hourly_rate_sar, 0), 2),
         round(coalesce(h.hours, 0) * coalesce(c.hourly_rate_sar, 0) * coalesce(c.cut_pct, def.cut) / 100, 2),
         round(coalesce(h.hours, 0) * coalesce(c.hourly_rate_sar, 0) * (100 - coalesce(c.cut_pct, def.cut)) / 100, 2)
  FROM community_captains c
  CROSS JOIN def
  JOIN communities co ON co.id = c.community_id
  JOIN profiles p ON p.id = c.user_id
  LEFT JOIN held h ON h.community_id = c.community_id AND h.user_id = c.user_id
  ORDER BY co.name, 4
$$;
REVOKE ALL ON FUNCTION captain_statement(DATE, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION captain_statement(DATE, DATE) TO service_role;

-- ════ Reminders ════
CREATE OR REPLACE FUNCTION bt_push_body(p_type TEXT, p_lang TEXT, p_actor TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_lang = 'ar' THEN CASE p_type
      WHEN 'rsvp_join'       THEN 'انضمام جديد لتمرينك: ' || coalesce(p_actor, '')
      WHEN 'event_full'      THEN 'اكتمل العدد'
      WHEN 'spot_opened'     THEN 'تحرّر مكان وتم تأكيد مشاركتك'
      WHEN 'event_cancelled' THEN 'تم إلغاء هذا التمرين'
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
$$;

-- Run three mornings a week: any captain whose week is short of its target gets a reminder.
CREATE OR REPLACE FUNCTION bt_captain_nudges() RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r RECORD;
  n INT := 0;
BEGIN
  FOR r IN
    SELECT c.community_id, c.user_id, c.weekly_target, co.name,
      (SELECT count(*) FROM events e WHERE e.captain_hosted AND e.created_by = c.user_id AND e.community_id = c.community_id
         AND e.cancelled_at IS NULL AND e.starts_at >= bt_week_start() AND e.starts_at < bt_week_start() + interval '7 days') AS have
    FROM community_captains c JOIN communities co ON co.id = c.community_id
    WHERE c.starts_on <= current_date AND (c.ends_on IS NULL OR c.ends_on >= current_date)
  LOOP
    IF r.have < r.weekly_target THEN
      PERFORM bt_notify(ARRAY[r.user_id], 'captain_nudge', NULL,
        jsonb_build_object('event_title', r.name, 'community_id', r.community_id, 'have', r.have, 'target', r.weekly_target));
      n := n + 1;
    END IF;
  END LOOP;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION bt_captain_nudges() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION bt_captain_nudges() TO service_role;
