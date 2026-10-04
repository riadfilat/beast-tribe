-- 078: the court price is split equally between everyone who is in.
-- Before, each share was the court price ÷ the planned players, and the organiser covered empty
-- spots. Now the share is the court price ÷ the players who are actually in, so it changes as
-- people join or leave and nobody carries more than anyone else. Paid shares stay as they were.

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS court_sar NUMERIC(8, 2) CHECK (court_sar IS NULL OR court_sar >= 0);
-- Column grants since 073: a new column needs its own grant to be readable.
GRANT SELECT (court_sar) ON public.events TO authenticated;

-- Recompute a court session's share from its booking and who is in.
CREATE OR REPLACE FUNCTION public.bt_court_resplit(p_event UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_court NUMERIC(8, 2);
  v_in INT;
  v_share NUMERIC(8, 2);
BEGIN
  SELECT b.price_sar INTO v_court FROM facility_bookings b WHERE b.event_id = p_event AND b.status = 'confirmed' LIMIT 1;
  IF v_court IS NULL THEN RETURN; END IF;
  SELECT count(*)::INT INTO v_in FROM event_rsvps r WHERE r.event_id = p_event AND r.status = 'going';
  v_share := round(v_court / greatest(1, v_in), 2);
  -- Runs from the RSVP trigger (depth > 1), so the money guards let it through.
  UPDATE events SET court_sar = v_court, share_sar = v_share
  WHERE id = p_event AND (court_sar IS DISTINCT FROM v_court OR share_sar IS DISTINCT FROM v_share);
  UPDATE session_dues SET amount_sar = v_share
  WHERE event_id = p_event AND kind = 'share' AND paid_at IS NULL AND amount_sar IS DISTINCT FROM v_share;
END $$;
REVOKE ALL ON FUNCTION public.bt_court_resplit(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.bt_rsvp_dues()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
    IF v_joined AND coalesce(e.court_sar, e.share_sar) > 0 THEN
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
END $$;

-- Members can't set the court price either (073 guards the other money fields).
CREATE OR REPLACE FUNCTION public.bt_events_court_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF bt_trusted_caller() OR pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  NEW.court_sar := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.court_sar END;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_events_court_guard ON public.events;
CREATE TRIGGER trg_events_court_guard BEFORE INSERT OR UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION bt_events_court_guard();
REVOKE ALL ON FUNCTION public.bt_events_court_guard() FROM PUBLIC, anon, authenticated;

-- Free courts owe nothing: drop zero dues left from before.
DELETE FROM session_dues WHERE kind = 'share' AND amount_sar = 0 AND paid_at IS NULL;

-- Re-split every court session that hasn't finished.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT e.id FROM events e WHERE e.share_sar IS NOT NULL AND coalesce(e.ends_at, e.starts_at) > now() - interval '1 day' LOOP
    PERFORM bt_court_resplit(r.id);
  END LOOP;
END $$;
