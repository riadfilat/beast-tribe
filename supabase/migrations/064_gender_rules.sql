-- 064 Gender decides women-only and men-only, and it is set once.
-- - Only women create women-only groups or host women-only sessions; only men create men-only groups.
-- - Women-only sessions need a profile gender of female (no gender set: GENDER_NEEDED, not a free pass).
-- - A member sets their gender once (onboarding); after that only admins / the dashboard change it.
-- The dashboard (service role), admins and trusted functions (bt.trusted) are not limited by these checks.

CREATE OR REPLACE FUNCTION bt_trusted_caller() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(current_setting('bt.trusted', true), '') = '1' OR auth.uid() IS NULL OR is_admin(auth.uid())
$$;

CREATE OR REPLACE FUNCTION bt_my_gender() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT lower(gender) FROM profiles WHERE id = auth.uid()
$$;

-- ── Groups (packs) ──
CREATE OR REPLACE FUNCTION bt_packs_audience_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  g TEXT;
BEGIN
  IF NEW.audience = 'everyone' OR bt_trusted_caller() THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW.audience IS NOT DISTINCT FROM OLD.audience THEN RETURN NEW; END IF;
  g := bt_my_gender();
  IF g IS NULL THEN RAISE EXCEPTION 'PACK_GENDER_NEEDED' USING ERRCODE = '42501'; END IF;
  IF NEW.audience = 'women' AND g <> 'female' THEN RAISE EXCEPTION 'PACK_CREATE_WOMEN' USING ERRCODE = '42501'; END IF;
  IF NEW.audience = 'men' AND g <> 'male' THEN RAISE EXCEPTION 'PACK_CREATE_MEN' USING ERRCODE = '42501'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_packs_audience_guard ON packs;
CREATE TRIGGER trg_packs_audience_guard BEFORE INSERT OR UPDATE OF audience ON packs
  FOR EACH ROW EXECUTE FUNCTION bt_packs_audience_guard();

-- ── Hosting a women-only session ──
CREATE OR REPLACE FUNCTION bt_events_women_only_host() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  g TEXT;
BEGIN
  IF NOT coalesce(NEW.is_women_only, false) OR bt_trusted_caller() THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND coalesce(OLD.is_women_only, false) THEN RETURN NEW; END IF;
  g := bt_my_gender();
  IF g IS NULL THEN RAISE EXCEPTION 'GENDER_NEEDED' USING ERRCODE = '42501'; END IF;
  IF g <> 'female' THEN RAISE EXCEPTION 'WOMEN_ONLY_HOST' USING ERRCODE = '42501'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_events_women_only_host ON events;
CREATE TRIGGER trg_events_women_only_host BEFORE INSERT OR UPDATE OF is_women_only ON events
  FOR EACH ROW EXECUTE FUNCTION bt_events_women_only_host();

-- ── Gender is set once ──
CREATE OR REPLACE FUNCTION bt_profiles_gender_lock() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.gender IS NOT NULL AND NEW.gender IS DISTINCT FROM OLD.gender AND NOT bt_trusted_caller() THEN
    RAISE EXCEPTION 'GENDER_LOCKED' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_profiles_gender_lock ON profiles;
CREATE TRIGGER trg_profiles_gender_lock BEFORE UPDATE OF gender ON profiles
  FOR EACH ROW EXECUTE FUNCTION bt_profiles_gender_lock();

-- ── Joining a women-only session: no gender set is not a free pass ──
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
    IF NOT v_event.guest_open THEN
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

  IF v_event.max_capacity IS NOT NULL THEN
    SELECT count(*) INTO v_going FROM event_rsvps
    WHERE event_id = NEW.event_id AND status = 'going' AND user_id <> NEW.user_id;
    NEW.status := CASE WHEN v_going >= v_event.max_capacity THEN 'waitlist' ELSE 'going' END;
  ELSE
    NEW.status := 'going';
  END IF;
  RETURN NEW;
END $function$;
