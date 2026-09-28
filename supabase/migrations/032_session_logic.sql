-- ============================================
-- 032: Session logic
--  - Capacity is enforced server-side; joins beyond capacity land on a waitlist,
--    and the first waitlisted member is promoted when a spot opens.
--  - Women-only and pack-only rules are enforced on RSVP, not just hidden in the UI.
--  - Hosts can cancel a session (attendees are notified).
--  - events.going_count is maintained by trigger (accurate counts everywhere).
--  - In-app notifications inbox + localized push (profiles.locale).
--  - Posts can be recaps of a session (feed_posts.event_id).
-- ============================================

-- ---- 1) RSVP statuses: add waitlist ----
ALTER TABLE event_rsvps DROP CONSTRAINT IF EXISTS event_rsvps_status_check;
ALTER TABLE event_rsvps ADD CONSTRAINT event_rsvps_status_check
  CHECK (status IN ('going', 'waitlist', 'interested', 'cancelled'));
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_status ON event_rsvps(event_id, status, created_at);

-- ---- 2) Events: cancellation + maintained going_count ----
ALTER TABLE events ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS going_count INTEGER NOT NULL DEFAULT 0;
UPDATE events e SET going_count = (
  SELECT count(*) FROM event_rsvps r WHERE r.event_id = e.id AND r.status = 'going'
);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at);

-- ---- 3) Recaps: a post can belong to a session ----
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_feed_posts_event ON feed_posts(event_id);

-- ---- 4) Member language (drives push notification text) ----
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en';
DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT profiles_locale_check CHECK (locale IN ('en', 'ar'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---- 5) In-app notifications ----
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY notifications_select_own ON notifications FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY notifications_update_own ON notifications FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY notifications_delete_own ON notifications FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Localized push copy. Keep in sync with src/i18n/strings (notifications.*).
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
      ELSE 'بيست ترايب' END
    ELSE CASE p_type
      WHEN 'rsvp_join'       THEN coalesce(p_actor, 'Someone') || ' joined your session'
      WHEN 'event_full'      THEN 'The session is full'
      WHEN 'spot_opened'     THEN 'A spot opened up. You''re in.'
      WHEN 'event_cancelled' THEN 'This session was cancelled'
      WHEN 'beast'           THEN coalesce(p_actor, 'Someone') || ' beasted your post'
      WHEN 'comment'         THEN coalesce(p_actor, 'Someone') || ' commented on your post'
      ELSE 'Beast Tribe' END
  END
$$;

-- Insert inbox rows for each recipient and send a localized Expo push to their devices.
CREATE OR REPLACE FUNCTION bt_notify(p_user_ids UUID[], p_type TEXT, p_actor UUID, p_data JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_name TEXT;
  v_msgs JSONB;
BEGIN
  IF p_user_ids IS NULL OR coalesce(array_length(p_user_ids, 1), 0) = 0 THEN
    RETURN;
  END IF;
  IF p_actor IS NOT NULL THEN
    SELECT coalesce(display_name, full_name) INTO v_actor_name FROM profiles WHERE id = p_actor;
  END IF;

  INSERT INTO notifications (user_id, type, actor_id, data)
  SELECT DISTINCT u, p_type, p_actor, p_data || jsonb_build_object('actor_name', v_actor_name)
  FROM unnest(p_user_ids) AS u
  WHERE u IS NOT NULL AND u IS DISTINCT FROM p_actor;

  SELECT jsonb_agg(jsonb_build_object(
    'to', pt.token,
    'sound', 'default',
    'title', coalesce(p_data->>'event_title', CASE WHEN pr.locale = 'ar' THEN 'بيست ترايب' ELSE 'Beast Tribe' END),
    'body', bt_push_body(p_type, pr.locale, v_actor_name),
    'data', p_data || jsonb_build_object('type', p_type)
  )) INTO v_msgs
  FROM push_tokens pt
  JOIN profiles pr ON pr.id = pt.user_id
  WHERE pt.user_id = ANY (p_user_ids) AND pt.user_id IS DISTINCT FROM p_actor;

  IF v_msgs IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := v_msgs
    );
  END IF;
END $$;
REVOKE ALL ON FUNCTION bt_notify(UUID[], TEXT, UUID, JSONB) FROM PUBLIC;

-- ---- 6) RSVP rules (before write) ----
CREATE OR REPLACE FUNCTION bt_rsvp_before()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event events%ROWTYPE;
  v_gender TEXT;
  v_going INT;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  IF NEW.status NOT IN ('going', 'waitlist') THEN
    RETURN NEW;
  END IF;

  -- Serialize joins per session so two people can't take the last spot.
  SELECT * INTO v_event FROM events WHERE id = NEW.event_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENT_NOT_FOUND';
  END IF;

  -- The host is always in.
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
    SELECT gender INTO v_gender FROM profiles WHERE id = NEW.user_id;
    IF v_gender = 'male' THEN
      RAISE EXCEPTION 'WOMEN_ONLY';
    END IF;
  END IF;
  IF v_event.visibility = 'pack' AND NOT EXISTS (
    SELECT 1 FROM pack_members WHERE pack_id = v_event.pack_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'PACK_ONLY';
  END IF;

  IF v_event.max_capacity IS NOT NULL THEN
    SELECT count(*) INTO v_going FROM event_rsvps
    WHERE event_id = NEW.event_id AND status = 'going' AND user_id <> NEW.user_id;
    NEW.status := CASE WHEN v_going >= v_event.max_capacity THEN 'waitlist' ELSE 'going' END;
  ELSE
    NEW.status := 'going';
  END IF;
  RETURN NEW;
END $$;

-- ---- 7) After write: counts, notifications, waitlist promotion ----
CREATE OR REPLACE FUNCTION bt_rsvp_after()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event events%ROWTYPE;
  v_event_id UUID;
  v_old_going BOOLEAN := false;
  v_new_going BOOLEAN := false;
  v_count INT;
  v_next UUID;
  v_payload JSONB;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN v_old_going := (OLD.status = 'going'); END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN v_new_going := (NEW.status = 'going'); END IF;
  IF v_old_going = v_new_going THEN
    RETURN NULL;
  END IF;

  v_event_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.event_id ELSE NEW.event_id END;
  SELECT * INTO v_event FROM events WHERE id = v_event_id;
  IF NOT FOUND THEN
    RETURN NULL; -- session itself is being deleted
  END IF;

  SELECT count(*) INTO v_count FROM event_rsvps WHERE event_id = v_event_id AND status = 'going';
  UPDATE events SET going_count = v_count WHERE id = v_event_id;
  v_payload := jsonb_build_object('event_id', v_event.id, 'event_title', v_event.title);

  IF v_new_going THEN
    IF TG_OP = 'INSERT' AND v_event.created_by IS NOT NULL AND v_event.created_by <> NEW.user_id THEN
      PERFORM bt_notify(ARRAY[v_event.created_by], 'rsvp_join', NEW.user_id, v_payload);
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.status = 'waitlist' THEN
      PERFORM bt_notify(ARRAY[NEW.user_id], 'spot_opened', NULL, v_payload);
    END IF;
    IF TG_OP = 'INSERT' AND NEW.user_id IS DISTINCT FROM v_event.created_by
       AND v_event.max_capacity IS NOT NULL AND v_count = v_event.max_capacity THEN
      PERFORM bt_notify(
        ARRAY(SELECT user_id FROM event_rsvps WHERE event_id = v_event_id AND status = 'going'),
        'event_full', NULL, v_payload
      );
    END IF;
  ELSE
    -- A spot opened: promote the earliest waitlisted member while the session is still ahead.
    IF v_event.cancelled_at IS NULL
       AND coalesce(v_event.ends_at, v_event.starts_at + interval '2 hours') > now()
       AND (v_event.max_capacity IS NULL OR v_count < v_event.max_capacity) THEN
      SELECT user_id INTO v_next FROM event_rsvps
      WHERE event_id = v_event_id AND status = 'waitlist'
      ORDER BY created_at ASC
      LIMIT 1;
      IF v_next IS NOT NULL THEN
        UPDATE event_rsvps SET status = 'going' WHERE event_id = v_event_id AND user_id = v_next;
      END IF;
    END IF;
  END IF;
  RETURN NULL;
END $$;

-- Replace the June notify-only trigger with the full rule set.
DROP TRIGGER IF EXISTS trg_notify_event_rsvp ON event_rsvps;
DROP FUNCTION IF EXISTS notify_event_rsvp();
DROP TRIGGER IF EXISTS trg_bt_rsvp_before ON event_rsvps;
CREATE TRIGGER trg_bt_rsvp_before
  BEFORE INSERT OR UPDATE OF status ON event_rsvps
  FOR EACH ROW EXECUTE FUNCTION bt_rsvp_before();
DROP TRIGGER IF EXISTS trg_bt_rsvp_after ON event_rsvps;
CREATE TRIGGER trg_bt_rsvp_after
  AFTER INSERT OR UPDATE OF status OR DELETE ON event_rsvps
  FOR EACH ROW EXECUTE FUNCTION bt_rsvp_after();

-- ---- 8) Hosts cancel a session ----
CREATE OR REPLACE FUNCTION cancel_event(p_event_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event events%ROWTYPE;
BEGIN
  SELECT * INTO v_event FROM events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'EVENT_NOT_FOUND'; END IF;
  IF v_event.created_by IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'NOT_HOST'; END IF;
  IF v_event.cancelled_at IS NOT NULL THEN RETURN; END IF;

  UPDATE events SET cancelled_at = now(), cancel_reason = p_reason WHERE id = p_event_id;
  PERFORM bt_notify(
    ARRAY(SELECT user_id FROM event_rsvps
          WHERE event_id = p_event_id AND status IN ('going', 'waitlist') AND user_id <> v_event.created_by),
    'event_cancelled', v_event.created_by,
    jsonb_build_object('event_id', v_event.id, 'event_title', v_event.title)
  );
END $$;
REVOKE ALL ON FUNCTION cancel_event(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cancel_event(UUID, TEXT) TO authenticated;

-- ---- 9) Beasts and comments notify the post author (deduplicated) ----
CREATE OR REPLACE FUNCTION bt_beast_after()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author UUID;
BEGIN
  SELECT user_id INTO v_author FROM feed_posts WHERE id = NEW.post_id;
  IF v_author IS NOT NULL AND v_author <> NEW.user_id AND NOT EXISTS (
    SELECT 1 FROM notifications
    WHERE user_id = v_author AND type = 'beast' AND actor_id = NEW.user_id
      AND data->>'post_id' = NEW.post_id::text
  ) THEN
    PERFORM bt_notify(ARRAY[v_author], 'beast', NEW.user_id, jsonb_build_object('post_id', NEW.post_id));
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_bt_beast_after ON beasts;
CREATE TRIGGER trg_bt_beast_after AFTER INSERT ON beasts
  FOR EACH ROW EXECUTE FUNCTION bt_beast_after();

CREATE OR REPLACE FUNCTION bt_comment_after()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author UUID;
BEGIN
  SELECT user_id INTO v_author FROM feed_posts WHERE id = NEW.post_id;
  IF v_author IS NOT NULL AND v_author <> NEW.user_id THEN
    PERFORM bt_notify(ARRAY[v_author], 'comment', NEW.user_id, jsonb_build_object('post_id', NEW.post_id));
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_bt_comment_after ON feed_comments;
CREATE TRIGGER trg_bt_comment_after AFTER INSERT ON feed_comments
  FOR EACH ROW EXECUTE FUNCTION bt_comment_after();

-- ---- 10) Member stats: facts, not points ----
CREATE OR REPLACE FUNCTION my_stats()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH mine AS (
    SELECT e.id, e.created_by
    FROM event_rsvps r JOIN events e ON e.id = r.event_id
    WHERE r.user_id = auth.uid() AND r.status = 'going' AND e.cancelled_at IS NULL
      AND coalesce(e.ends_at, e.starts_at + interval '2 hours') < now()
  )
  SELECT jsonb_build_object(
    'attended', (SELECT count(*) FROM mine),
    'hosted', (SELECT count(*) FROM events WHERE created_by = auth.uid() AND cancelled_at IS NULL
               AND coalesce(ends_at, starts_at + interval '2 hours') < now()),
    'met', (SELECT count(DISTINCT r2.user_id) FROM event_rsvps r2
            WHERE r2.event_id IN (SELECT id FROM mine) AND r2.status = 'going' AND r2.user_id <> auth.uid())
  )
$$;
REVOKE ALL ON FUNCTION my_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION my_stats() TO authenticated;

SELECT 'Session logic: capacity + waitlist, cancel, inbox, recaps, stats installed' AS status;
