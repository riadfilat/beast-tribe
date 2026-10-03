-- 060 Guest classes, bookable facilities, and what each person owes
--
-- Guest classes: a gym or club can open a class to people outside its community for a guest
-- price. Guests see it on their city's Board, join, and pay the gym.
--
-- Facilities: courts, pitches, halls and school facilities that venues list with their hours and
-- price. A member books a free slot; that creates a session, and the price is split per person:
-- every player who joins owes one share.
--
-- session_dues: one row per person per session with the amount they owe and whether it is paid.
-- Members can read their own (the organiser reads everyone's in their session) and can never
-- write them: the venue marks payment today, the payment provider will later.
-- Beast Tribe takes nothing from these amounts.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ═══════════════════════════════ Facilities ═══════════════════════════════
CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 120),
  name_ar TEXT CHECK (name_ar IS NULL OR length(name_ar) <= 120),
  kind TEXT NOT NULL DEFAULT 'court' CHECK (kind IN ('court', 'pitch', 'hall', 'pool', 'studio', 'track')),
  sport TEXT NOT NULL DEFAULT 'padel',
  city TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  image_url TEXT,
  description TEXT CHECK (description IS NULL OR length(description) <= 600),
  description_ar TEXT CHECK (description_ar IS NULL OR length(description_ar) <= 600),
  price_sar NUMERIC(8, 2) NOT NULL DEFAULT 0 CHECK (price_sar >= 0),
  slot_minutes INT NOT NULL DEFAULT 60 CHECK (slot_minutes IN (30, 45, 60, 90, 120)),
  max_players INT NOT NULL DEFAULT 4 CHECK (max_players BETWEEN 1 AND 40),
  -- Opening hours by weekday (0 = Sunday), Riyadh time: {"0": [["16:00", "23:00"]], ...}
  hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  audience TEXT NOT NULL DEFAULT 'everyone' CHECK (audience IN ('everyone', 'women', 'community')),
  community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
  notice_hours INT NOT NULL DEFAULT 1 CHECK (notice_hours BETWEEN 0 AND 72),
  cancel_hours INT NOT NULL DEFAULT 6 CHECK (cancel_hours BETWEEN 0 AND 168),
  is_school BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_facilities_partner ON facilities (partner_id);
CREATE INDEX IF NOT EXISTS idx_facilities_city ON facilities (bt_city_key(city)) WHERE is_active;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS facilities_select ON facilities;
CREATE POLICY facilities_select ON facilities FOR SELECT USING (
  (is_active AND (audience <> 'community' OR community_id IN (SELECT bt_my_community_ids())))
  OR (SELECT is_admin())
);
REVOKE ALL ON facilities FROM anon, authenticated;
GRANT SELECT ON facilities TO authenticated; -- venues manage them from the dashboard (service role)

CREATE TABLE IF NOT EXISTS facility_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  booked_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  price_sar NUMERIC(8, 2) NOT NULL,
  players INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  -- One confirmed booking per facility per moment, whatever the app does.
  CONSTRAINT facility_bookings_no_overlap EXCLUDE USING gist (facility_id WITH =, tstzrange(starts_at, ends_at) WITH &&) WHERE (status = 'confirmed')
);
CREATE INDEX IF NOT EXISTS idx_facility_bookings_when ON facility_bookings (facility_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_facility_bookings_by ON facility_bookings (booked_by, starts_at);
ALTER TABLE facility_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS facility_bookings_select ON facility_bookings;
CREATE POLICY facility_bookings_select ON facility_bookings FOR SELECT USING (booked_by = (SELECT auth.uid()) OR (SELECT is_admin()));
REVOKE ALL ON facility_bookings FROM anon, authenticated;
GRANT SELECT ON facility_bookings TO authenticated;

-- ═══════════════════════════════ Sessions ═══════════════════════════════
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS guest_open BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guest_price_sar NUMERIC(8, 2) CHECK (guest_price_sar IS NULL OR guest_price_sar >= 0),
  ADD COLUMN IF NOT EXISTS guest_spots INT CHECK (guest_spots IS NULL OR guest_spots >= 0),
  ADD COLUMN IF NOT EXISTS share_sar NUMERIC(8, 2) CHECK (share_sar IS NULL OR share_sar >= 0),
  ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_events_guest_open ON events (city_key, starts_at) WHERE guest_open;

-- Only the dashboard (service role), admins and the booking function set guest and money fields.
CREATE OR REPLACE FUNCTION bt_events_money() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(current_setting('bt.trusted', true), '') = '1' OR auth.uid() IS NULL OR is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.guest_open := false;
    NEW.guest_price_sar := NULL;
    NEW.guest_spots := NULL;
    NEW.share_sar := NULL;
    NEW.facility_id := NULL;
  ELSE
    NEW.guest_open := OLD.guest_open;
    NEW.guest_price_sar := OLD.guest_price_sar;
    NEW.guest_spots := OLD.guest_spots;
    NEW.share_sar := OLD.share_sar;
    NEW.facility_id := OLD.facility_id;
  END IF;
  RETURN NEW;
END $$;
-- Runs after trg_events_guard and before trg_events_scope (triggers fire in name order).
DROP TRIGGER IF EXISTS trg_events_money ON events;
CREATE TRIGGER trg_events_money BEFORE INSERT OR UPDATE ON events FOR EACH ROW EXECUTE FUNCTION bt_events_money();

-- A guest class is shown by city, like an open community's sessions.
CREATE OR REPLACE FUNCTION public.bt_events_scope()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.city_key := bt_city_key(NEW.location_city);
  NEW.open_scope := NEW.visibility = 'community'
    AND (NEW.guest_open OR EXISTS (SELECT 1 FROM communities c WHERE c.id = NEW.community_id AND c.visibility = 'open'));
  RETURN NEW;
END $function$;

DROP POLICY IF EXISTS events_select ON events;
CREATE POLICY events_select ON events FOR SELECT USING (
  created_by = (SELECT auth.uid())
  OR (visibility = 'pack' AND pack_id IN (SELECT bt_my_pack_ids()))
  OR (visibility = 'community' AND (guest_open OR community_id IN (SELECT bt_visible_community_ids())))
  OR (SELECT is_admin())
);

-- Joining: people outside the community can take a guest spot in a guest class.
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

-- ═══════════════════════════════ What each person owes ═══════════════════════════════
CREATE TABLE IF NOT EXISTS session_dues (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('guest', 'share')),
  amount_sar NUMERIC(8, 2) NOT NULL CHECK (amount_sar >= 0),
  paid_at TIMESTAMPTZ,
  paid_via TEXT CHECK (paid_via IS NULL OR paid_via IN ('venue', 'online')),
  provider_ref TEXT,
  marked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_session_dues_user ON session_dues (user_id);
ALTER TABLE session_dues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS session_dues_select ON session_dues;
CREATE POLICY session_dues_select ON session_dues FOR SELECT USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (SELECT 1 FROM events e WHERE e.id = session_dues.event_id AND e.created_by = (SELECT auth.uid()))
  OR (SELECT is_admin())
);
REVOKE ALL ON session_dues FROM anon, authenticated;
GRANT SELECT ON session_dues TO authenticated;

CREATE OR REPLACE FUNCTION bt_rsvp_dues() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  e events%ROWTYPE;
BEGIN
  -- Left the session: nothing owed any more (a paid one stays on record).
  IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.status = 'going' AND (TG_OP = 'DELETE' OR NEW.status <> 'going') THEN
    DELETE FROM session_dues WHERE event_id = OLD.event_id AND user_id = OLD.user_id AND paid_at IS NULL;
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.status = 'going' AND (TG_OP = 'INSERT' OR OLD.status <> 'going') THEN
    SELECT * INTO e FROM events WHERE id = NEW.event_id;
    IF NOT FOUND THEN RETURN NULL; END IF;
    IF e.share_sar IS NOT NULL THEN
      INSERT INTO session_dues (event_id, user_id, kind, amount_sar) VALUES (e.id, NEW.user_id, 'share', e.share_sar)
      ON CONFLICT (event_id, user_id) DO NOTHING;
    ELSIF e.guest_open AND coalesce(e.guest_price_sar, 0) > 0 AND NEW.user_id IS DISTINCT FROM e.created_by AND e.community_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = e.community_id AND m.user_id = NEW.user_id) THEN
      INSERT INTO session_dues (event_id, user_id, kind, amount_sar) VALUES (e.id, NEW.user_id, 'guest', e.guest_price_sar)
      ON CONFLICT (event_id, user_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_bt_rsvp_dues ON event_rsvps;
CREATE TRIGGER trg_bt_rsvp_dues AFTER INSERT OR UPDATE OR DELETE ON event_rsvps FOR EACH ROW EXECUTE FUNCTION bt_rsvp_dues();

-- A cancelled session frees its court.
CREATE OR REPLACE FUNCTION bt_events_free_facility() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.cancelled_at IS NOT NULL AND OLD.cancelled_at IS NULL AND NEW.facility_id IS NOT NULL THEN
    UPDATE facility_bookings SET status = 'cancelled', cancelled_at = now() WHERE event_id = NEW.id AND status = 'confirmed';
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_events_free_facility ON events;
CREATE TRIGGER trg_events_free_facility AFTER UPDATE OF cancelled_at ON events FOR EACH ROW EXECUTE FUNCTION bt_events_free_facility();

-- ═══════════════════════════════ Slots and booking ═══════════════════════════════
-- Every slot of one day (Riyadh time) with whether it can still be booked.
CREATE OR REPLACE FUNCTION facility_slots(p_facility UUID, p_day DATE)
RETURNS TABLE (starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ, free BOOLEAN)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  f facilities%ROWTYPE;
  win JSONB;
  t TIMESTAMPTZ;
  t_end TIMESTAMPTZ;
  closes TIMESTAMPTZ;
  step INTERVAL;
BEGIN
  SELECT * INTO f FROM facilities x WHERE x.id = p_facility AND x.is_active;
  IF NOT FOUND THEN RETURN; END IF;
  IF f.audience = 'community' AND NOT EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = f.community_id AND m.user_id = auth.uid()) THEN
    RETURN;
  END IF;
  step := make_interval(mins => f.slot_minutes);
  FOR win IN SELECT * FROM jsonb_array_elements(coalesce(f.hours -> (extract(dow FROM p_day)::INT)::TEXT, '[]'::jsonb)) LOOP
    CONTINUE WHEN (win ->> 0) !~ '^\d{2}:\d{2}$' OR (win ->> 1) !~ '^\d{2}:\d{2}$';
    t := (p_day::TEXT || ' ' || (win ->> 0))::TIMESTAMP AT TIME ZONE 'Asia/Riyadh';
    closes := (p_day::TEXT || ' ' || (win ->> 1))::TIMESTAMP AT TIME ZONE 'Asia/Riyadh';
    IF closes <= t THEN closes := closes + interval '1 day'; END IF; -- open past midnight
    WHILE t + step <= closes LOOP
      t_end := t + step;
      starts_at := t;
      ends_at := t_end;
      free := t >= now() + make_interval(hours => f.notice_hours)
        AND NOT EXISTS (SELECT 1 FROM facility_bookings b WHERE b.facility_id = p_facility AND b.status = 'confirmed' AND b.starts_at < t_end AND b.ends_at > t);
      RETURN NEXT;
      t := t_end;
    END LOOP;
  END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION facility_slots(UUID, DATE) TO authenticated;

-- Book a free slot. Creates the session (so friends can join and see their share) and holds the court.
CREATE OR REPLACE FUNCTION book_facility(p_facility UUID, p_starts_at TIMESTAMPTZ, p_players INT, p_title TEXT, p_community UUID, p_pack UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := auth.uid();
  f facilities%ROWTYPE;
  v_day DATE := (p_starts_at AT TIME ZONE 'Asia/Riyadh')::DATE;
  v_end TIMESTAMPTZ;
  v_players INT;
  v_booking UUID;
  v_event UUID;
  v_community UUID;
  v_share NUMERIC(8, 2);
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN'; END IF;
  SELECT * INTO f FROM facilities x WHERE x.id = p_facility AND x.is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF f.audience = 'women' AND coalesce((SELECT gender FROM profiles WHERE id = me), '') <> 'female' THEN RAISE EXCEPTION 'WOMEN_ONLY'; END IF;
  IF f.audience = 'community' AND NOT EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = f.community_id AND m.user_id = me) THEN
    RAISE EXCEPTION 'COMMUNITY_ONLY';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM (SELECT * FROM facility_slots(p_facility, v_day) UNION ALL SELECT * FROM facility_slots(p_facility, v_day - 1)) s
    WHERE s.starts_at = p_starts_at AND s.free
  ) THEN
    RAISE EXCEPTION 'TAKEN';
  END IF;
  IF (SELECT count(*) FROM facility_bookings b WHERE b.booked_by = me AND b.status = 'confirmed' AND b.starts_at > now()) >= 3 THEN
    RAISE EXCEPTION 'TOO_MANY';
  END IF;
  v_end := p_starts_at + make_interval(mins => f.slot_minutes);
  v_players := greatest(1, least(coalesce(p_players, f.max_players), f.max_players));
  v_share := round(f.price_sar / v_players, 2);

  -- Who sees the session: a pack, a community, or (for a community-only facility) that community.
  IF f.audience = 'community' THEN
    v_community := f.community_id;
  ELSIF p_pack IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pack_members pm WHERE pm.pack_id = p_pack AND pm.user_id = me) THEN RAISE EXCEPTION 'PACK_ONLY'; END IF;
  ELSE
    v_community := coalesce(p_community, (SELECT id FROM communities WHERE is_default LIMIT 1));
    IF NOT EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = v_community AND m.user_id = me) THEN RAISE EXCEPTION 'COMMUNITY_ONLY'; END IF;
  END IF;

  BEGIN
    INSERT INTO facility_bookings (facility_id, booked_by, starts_at, ends_at, price_sar, players)
    VALUES (f.id, me, p_starts_at, v_end, f.price_sar, v_players)
    RETURNING id INTO v_booking;
  EXCEPTION WHEN exclusion_violation THEN
    RAISE EXCEPTION 'TAKEN';
  END;

  PERFORM set_config('bt.trusted', '1', true);
  INSERT INTO events (title, event_type, starts_at, ends_at, location_name, location_city, location_lat, location_lng, max_capacity, created_by,
                      visibility, community_id, pack_id, is_women_only, image_url, share_sar, facility_id)
  VALUES (coalesce(nullif(trim(p_title), ''), f.name), f.sport, p_starts_at, v_end, f.name, f.city, f.latitude, f.longitude, v_players, me,
          CASE WHEN v_community IS NULL THEN 'pack' ELSE 'community' END, v_community, CASE WHEN v_community IS NULL THEN p_pack END,
          f.audience = 'women', f.image_url, v_share, f.id)
  RETURNING id INTO v_event;
  PERFORM set_config('bt.trusted', '', true);

  UPDATE facility_bookings SET event_id = v_event WHERE id = v_booking;
  INSERT INTO event_rsvps (event_id, user_id, status) VALUES (v_event, me, 'going') ON CONFLICT (event_id, user_id) DO NOTHING;
  RETURN v_event;
END $$;
GRANT EXECUTE ON FUNCTION book_facility(UUID, TIMESTAMPTZ, INT, TEXT, UUID, UUID) TO authenticated;

-- ═══════════════════════════════ Dashboard numbers ═══════════════════════════════
-- Guest and court income of one partner in a period (for the dashboard; service role).
CREATE OR REPLACE FUNCTION partner_income(p_partner UUID, p_from DATE, p_to DATE)
RETURNS TABLE (guest_bookings INT, guest_due NUMERIC, guest_paid NUMERIC, court_bookings INT, court_due NUMERIC, court_paid NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH pa AS (SELECT community_id FROM partners WHERE id = p_partner),
  span AS (SELECT (p_from::TIMESTAMP AT TIME ZONE 'Asia/Riyadh') AS a, ((p_to + 1)::TIMESTAMP AT TIME ZONE 'Asia/Riyadh') AS b),
  g AS (
    SELECT d.amount_sar, d.paid_at FROM session_dues d JOIN events e ON e.id = d.event_id, pa, span
    WHERE d.kind = 'guest' AND e.community_id = pa.community_id AND e.cancelled_at IS NULL AND e.starts_at >= span.a AND e.starts_at < span.b
  ),
  c AS (
    SELECT b.id, b.price_sar,
           (SELECT coalesce(sum(d.amount_sar), 0) FROM session_dues d WHERE d.event_id = b.event_id AND d.paid_at IS NOT NULL) AS paid
    FROM facility_bookings b JOIN facilities f ON f.id = b.facility_id, span
    WHERE f.partner_id = p_partner AND b.status = 'confirmed' AND b.starts_at >= span.a AND b.starts_at < span.b
  )
  SELECT (SELECT count(*)::INT FROM g), (SELECT coalesce(sum(amount_sar), 0) FROM g), (SELECT coalesce(sum(amount_sar), 0) FROM g WHERE paid_at IS NOT NULL),
         (SELECT count(*)::INT FROM c), (SELECT coalesce(sum(price_sar), 0) FROM c), (SELECT coalesce(sum(least(paid, price_sar)), 0) FROM c)
$$;
REVOKE ALL ON FUNCTION partner_income(UUID, DATE, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION partner_income(UUID, DATE, DATE) TO service_role;
