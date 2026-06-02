-- ============================================
-- 030: Push notifications — token storage + RSVP triggers
-- Sends "X joined your event" to the creator and "Seats are now full"
-- to all attendees, via the Expo Push API (pg_net).
-- ============================================

-- Device push tokens (one row per device per user)
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY push_tokens_select_own ON push_tokens FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY push_tokens_insert_own ON push_tokens FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY push_tokens_update_own ON push_tokens FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY push_tokens_delete_own ON push_tokens FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- pg_net for outbound HTTP to the Expo push service
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Trigger: on a new "going" RSVP, notify creator + (if full) all attendees
CREATE OR REPLACE FUNCTION notify_event_rsvp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event   RECORD;
  v_joiner  TEXT;
  v_count   INT;
  v_msgs    JSONB;
BEGIN
  IF NEW.status IS DISTINCT FROM 'going' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_event FROM events WHERE id = NEW.event_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT COALESCE(display_name, full_name, 'Someone') INTO v_joiner
  FROM profiles WHERE id = NEW.user_id;

  SELECT COUNT(*) INTO v_count
  FROM event_rsvps WHERE event_id = NEW.event_id AND status = 'going';

  -- 1) Notify the creator that someone joined (skip when creator joins own event)
  IF v_event.created_by IS NOT NULL AND v_event.created_by <> NEW.user_id THEN
    SELECT jsonb_agg(jsonb_build_object(
      'to', pt.token, 'sound', 'default',
      'title', v_event.title,
      'body', v_joiner || ' joined your event',
      'data', jsonb_build_object('eventId', v_event.id, 'type', 'rsvp_join')
    )) INTO v_msgs
    FROM push_tokens pt WHERE pt.user_id = v_event.created_by;

    IF v_msgs IS NOT NULL THEN
      PERFORM net.http_post(
        url := 'https://exp.host/--/api/v2/push/send',
        headers := '{"Content-Type":"application/json"}'::jsonb,
        body := v_msgs
      );
    END IF;
  END IF;

  -- 2) If the event just became full, notify everyone going
  IF v_event.max_capacity IS NOT NULL AND v_count >= v_event.max_capacity THEN
    SELECT jsonb_agg(jsonb_build_object(
      'to', pt.token, 'sound', 'default',
      'title', v_event.title,
      'body', 'Seats are now full',
      'data', jsonb_build_object('eventId', v_event.id, 'type', 'event_full')
    )) INTO v_msgs
    FROM event_rsvps r
    JOIN push_tokens pt ON pt.user_id = r.user_id
    WHERE r.event_id = NEW.event_id AND r.status = 'going';

    IF v_msgs IS NOT NULL THEN
      PERFORM net.http_post(
        url := 'https://exp.host/--/api/v2/push/send',
        headers := '{"Content-Type":"application/json"}'::jsonb,
        body := v_msgs
      );
    END IF;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_event_rsvp ON event_rsvps;
CREATE TRIGGER trg_notify_event_rsvp
  AFTER INSERT ON event_rsvps
  FOR EACH ROW EXECUTE FUNCTION notify_event_rsvp();

SELECT 'Push notifications: token table + RSVP trigger installed' AS status;
