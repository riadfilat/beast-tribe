-- 069 Community courts with house rules; horse riding.
--
-- facilities gain: sports[] (a multi-use court lists every sport it takes), parent_id (a half court
-- belongs to the full court: booking the full court blocks both halves and a half blocks the full
-- court), bookable (a pool used for classes is shown, not booked), daily_limit (e.g. padel: one
-- booking a day per member, counting sessions they were invited to).
-- Andorra Sports Tribe's facilities are added for its members only (hours and prices to confirm).

INSERT INTO sports (name, emoji, category, popularity_male, popularity_female, is_active)
SELECT 'Horse Riding', '🏇', 'outdoor', 5, 5, true
WHERE NOT EXISTS (SELECT 1 FROM sports WHERE lower(name) = 'horse riding');

ALTER TABLE facilities
  ADD COLUMN IF NOT EXISTS sports TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS bookable BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS daily_limit INT CHECK (daily_limit IS NULL OR daily_limit BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS sort INT NOT NULL DEFAULT 0;
UPDATE facilities SET sports = ARRAY[sport] WHERE coalesce(array_length(sports, 1), 0) = 0;

-- One booking a day (or N) per member on a venue's courts of one sport.
CREATE OR REPLACE FUNCTION bt_check_daily_limit(p_user UUID, p_facility UUID, p_at TIMESTAMPTZ, p_except UUID)
RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  f facilities%ROWTYPE;
  n INT;
  d DATE := (p_at AT TIME ZONE 'Asia/Riyadh')::DATE;
BEGIN
  SELECT * INTO f FROM facilities WHERE id = p_facility;
  IF NOT FOUND OR f.daily_limit IS NULL THEN RETURN; END IF;
  SELECT count(*) INTO n
    FROM event_rsvps r JOIN events e ON e.id = r.event_id JOIN facilities x ON x.id = e.facility_id
   WHERE r.user_id = p_user AND r.status = 'going' AND e.cancelled_at IS NULL
     AND e.id IS DISTINCT FROM p_except
     AND x.partner_id = f.partner_id AND x.sport = f.sport
     AND (e.starts_at AT TIME ZONE 'Asia/Riyadh')::DATE = d;
  IF n >= f.daily_limit THEN RAISE EXCEPTION 'DAILY_LIMIT'; END IF;
END $$;

-- Taken: a confirmed booking on this facility, its full court, or one of its halves.
CREATE OR REPLACE FUNCTION bt_facility_busy(p_facility UUID, p_from TIMESTAMPTZ, p_to TIMESTAMPTZ)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM facility_bookings b
    WHERE b.status = 'confirmed' AND b.starts_at < p_to AND b.ends_at > p_from
      AND (b.facility_id = p_facility
           OR b.facility_id = (SELECT parent_id FROM facilities WHERE id = p_facility)
           OR b.facility_id IN (SELECT id FROM facilities WHERE parent_id = p_facility))
  )
$$;

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
  SELECT * INTO f FROM facilities x WHERE x.id = p_facility AND x.is_active AND x.bookable;
  IF NOT FOUND THEN RETURN; END IF;
  IF f.audience = 'community' AND NOT EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = f.community_id AND m.user_id = auth.uid()) THEN
    RETURN;
  END IF;
  step := make_interval(mins => f.slot_minutes);
  FOR win IN SELECT * FROM jsonb_array_elements(coalesce(f.hours -> (extract(dow FROM p_day)::INT)::TEXT, '[]'::jsonb)) LOOP
    CONTINUE WHEN (win ->> 0) !~ '^\d{2}:\d{2}$' OR (win ->> 1) !~ '^\d{2}:\d{2}$';
    t := (p_day::TEXT || ' ' || (win ->> 0))::TIMESTAMP AT TIME ZONE 'Asia/Riyadh';
    closes := (p_day::TEXT || ' ' || (win ->> 1))::TIMESTAMP AT TIME ZONE 'Asia/Riyadh';
    IF closes <= t THEN closes := closes + interval '1 day'; END IF;
    WHILE t + step <= closes LOOP
      t_end := t + step;
      starts_at := t;
      ends_at := t_end;
      free := t >= now() + make_interval(hours => f.notice_hours) AND NOT bt_facility_busy(p_facility, t, t_end);
      RETURN NEXT;
      t := t_end;
    END LOOP;
  END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION facility_slots(UUID, DATE) TO authenticated;

DROP FUNCTION IF EXISTS book_facility(UUID, TIMESTAMPTZ, INT, TEXT, UUID, UUID);
CREATE OR REPLACE FUNCTION book_facility(p_facility UUID, p_starts_at TIMESTAMPTZ, p_players INT, p_title TEXT, p_community UUID, p_pack UUID, p_sport TEXT DEFAULT NULL)
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
  v_sport TEXT;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN'; END IF;
  SELECT * INTO f FROM facilities x WHERE x.id = p_facility AND x.is_active;
  IF NOT FOUND OR NOT f.bookable THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF f.audience = 'women' AND coalesce((SELECT gender FROM profiles WHERE id = me), '') <> 'female' THEN RAISE EXCEPTION 'WOMEN_ONLY'; END IF;
  IF f.audience = 'community' AND NOT EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = f.community_id AND m.user_id = me) THEN
    RAISE EXCEPTION 'COMMUNITY_ONLY';
  END IF;
  -- One booking at a time for a court and its halves.
  PERFORM pg_advisory_xact_lock(hashtext(coalesce(f.parent_id, f.id)::TEXT));
  IF NOT EXISTS (
    SELECT 1 FROM (SELECT * FROM facility_slots(p_facility, v_day) UNION ALL SELECT * FROM facility_slots(p_facility, v_day - 1)) s
    WHERE s.starts_at = p_starts_at AND s.free
  ) THEN
    RAISE EXCEPTION 'TAKEN';
  END IF;
  IF (SELECT count(*) FROM facility_bookings b WHERE b.booked_by = me AND b.status = 'confirmed' AND b.starts_at > now()) >= 3 THEN
    RAISE EXCEPTION 'TOO_MANY';
  END IF;
  PERFORM bt_check_daily_limit(me, f.id, p_starts_at, NULL);
  v_end := p_starts_at + make_interval(mins => f.slot_minutes);
  v_players := greatest(1, least(coalesce(p_players, f.max_players), f.max_players));
  v_share := round(f.price_sar / v_players, 2);
  v_sport := CASE WHEN p_sport IS NOT NULL AND p_sport = ANY (f.sports) THEN p_sport ELSE f.sport END;

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
  VALUES (coalesce(nullif(trim(p_title), ''), f.name), v_sport, p_starts_at, v_end, f.name, f.city, f.latitude, f.longitude, v_players, me,
          CASE WHEN v_community IS NULL THEN 'pack' ELSE 'community' END, v_community, CASE WHEN v_community IS NULL THEN p_pack END,
          f.audience = 'women', f.image_url, v_share, f.id)
  RETURNING id INTO v_event;
  PERFORM set_config('bt.trusted', '', true);

  UPDATE facility_bookings SET event_id = v_event WHERE id = v_booking;
  INSERT INTO event_rsvps (event_id, user_id, status) VALUES (v_event, me, 'going') ON CONFLICT (event_id, user_id) DO NOTHING;
  RETURN v_event;
END $$;
GRANT EXECUTE ON FUNCTION book_facility(UUID, TIMESTAMPTZ, INT, TEXT, UUID, UUID, TEXT) TO authenticated;

-- Joining someone's court booking counts toward the daily limit too.
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
    -- Outsiders: a guest class (listed), or a session whose host invites guests with its link
    -- (join_as_guest sets bt.guest_invite to this session's id after checking the link's token).
    IF NOT v_event.guest_open
       AND NOT (v_event.guest_invite AND coalesce(current_setting('bt.guest_invite', true), '') = NEW.event_id::TEXT) THEN
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

  -- Court rules (e.g. one padel booking a day), counted for invited players too.
  IF v_event.facility_id IS NOT NULL THEN
    PERFORM bt_check_daily_limit(NEW.user_id, v_event.facility_id, v_event.starts_at, NEW.event_id);
  END IF;

  IF v_event.max_capacity IS NOT NULL THEN
    SELECT count(*) INTO v_going FROM event_rsvps
    WHERE event_id = NEW.event_id AND status = 'going' AND user_id <> NEW.user_id;
    NEW.status := CASE WHEN v_going >= v_event.max_capacity THEN 'waitlist' ELSE 'going' END;
  ELSE
    NEW.status := 'going';
  END IF;
  RETURN NEW;
END $function$
;

-- ── Andorra Sports Tribe: its own courts, for its members ──
INSERT INTO partners (id, name, slug, type, status, partner_type, business_name, is_active, is_verified, city, country, community_id)
VALUES ('a1d0aa00-0000-4000-8000-000000000001', 'Andorra Sports Tribe', 'andorra-sports-tribe', 'other', 'active', 'venue', 'Andorra Sports Tribe', true, true, 'Riyadh', 'SA', 'b4fb2a29-3e33-461f-b1cb-ad4fd9277e2f')
ON CONFLICT (id) DO NOTHING;

INSERT INTO facilities (id, partner_id, name, name_ar, kind, sport, sports, city, image_url, description, description_ar, price_sar, slot_minutes, max_players, hours, audience, community_id, notice_hours, cancel_hours, bookable, daily_limit, parent_id, sort)
VALUES
 ('a1d0aa00-0000-4000-8000-000000000011', 'a1d0aa00-0000-4000-8000-000000000001', 'Padel Court 1', 'ملعب البادل 1', 'court', 'padel', ARRAY['padel'], 'Riyadh', 'https://beast-tribe.vercel.app/places/andorra/padel.jpg',
  'Outdoor, floodlit. One padel booking a day per member, 90 minutes.', 'خارجي ومضاء. حجز بادل واحد في اليوم لكل عضو، 90 دقيقة.', 0, 90, 4, '{"0":[["06:00","23:00"]],"1":[["06:00","23:00"]],"2":[["06:00","23:00"]],"3":[["06:00","23:00"]],"4":[["06:00","23:00"]],"5":[["06:00","23:00"]],"6":[["06:00","23:00"]]}', 'community', 'b4fb2a29-3e33-461f-b1cb-ad4fd9277e2f', 1, 6, true, 1, NULL, 1),
 ('a1d0aa00-0000-4000-8000-000000000012', 'a1d0aa00-0000-4000-8000-000000000001', 'Padel Court 2', 'ملعب البادل 2', 'court', 'padel', ARRAY['padel'], 'Riyadh', 'https://beast-tribe.vercel.app/places/andorra/padel.jpg',
  'Outdoor, floodlit. One padel booking a day per member, 90 minutes.', 'خارجي ومضاء. حجز بادل واحد في اليوم لكل عضو، 90 دقيقة.', 0, 90, 4, '{"0":[["06:00","23:00"]],"1":[["06:00","23:00"]],"2":[["06:00","23:00"]],"3":[["06:00","23:00"]],"4":[["06:00","23:00"]],"5":[["06:00","23:00"]],"6":[["06:00","23:00"]]}', 'community', 'b4fb2a29-3e33-461f-b1cb-ad4fd9277e2f', 1, 6, true, 1, NULL, 2),
 ('a1d0aa00-0000-4000-8000-000000000013', 'a1d0aa00-0000-4000-8000-000000000001', 'Padel Court 3', 'ملعب البادل 3', 'court', 'padel', ARRAY['padel'], 'Riyadh', 'https://beast-tribe.vercel.app/places/andorra/padel.jpg',
  'Outdoor, floodlit. One padel booking a day per member, 90 minutes.', 'خارجي ومضاء. حجز بادل واحد في اليوم لكل عضو، 90 دقيقة.', 0, 90, 4, '{"0":[["06:00","23:00"]],"1":[["06:00","23:00"]],"2":[["06:00","23:00"]],"3":[["06:00","23:00"]],"4":[["06:00","23:00"]],"5":[["06:00","23:00"]],"6":[["06:00","23:00"]]}', 'community', 'b4fb2a29-3e33-461f-b1cb-ad4fd9277e2f', 1, 6, true, 1, NULL, 3),
 ('a1d0aa00-0000-4000-8000-000000000021', 'a1d0aa00-0000-4000-8000-000000000001', 'Tennis Court 1', 'ملعب التنس 1', 'court', 'tennis', ARRAY['tennis'], 'Riyadh', 'https://beast-tribe.vercel.app/places/andorra/tennis.jpg',
  'Outdoor hard court, floodlit.', 'ملعب صلب خارجي ومضاء.', 0, 60, 4, '{"0":[["06:00","23:00"]],"1":[["06:00","23:00"]],"2":[["06:00","23:00"]],"3":[["06:00","23:00"]],"4":[["06:00","23:00"]],"5":[["06:00","23:00"]],"6":[["06:00","23:00"]]}', 'community', 'b4fb2a29-3e33-461f-b1cb-ad4fd9277e2f', 1, 6, true, NULL, NULL, 4),
 ('a1d0aa00-0000-4000-8000-000000000022', 'a1d0aa00-0000-4000-8000-000000000001', 'Tennis Court 2', 'ملعب التنس 2', 'court', 'tennis', ARRAY['tennis'], 'Riyadh', 'https://beast-tribe.vercel.app/places/andorra/tennis.jpg',
  'Outdoor hard court, floodlit.', 'ملعب صلب خارجي ومضاء.', 0, 60, 4, '{"0":[["06:00","23:00"]],"1":[["06:00","23:00"]],"2":[["06:00","23:00"]],"3":[["06:00","23:00"]],"4":[["06:00","23:00"]],"5":[["06:00","23:00"]],"6":[["06:00","23:00"]]}', 'community', 'b4fb2a29-3e33-461f-b1cb-ad4fd9277e2f', 1, 6, true, NULL, NULL, 5),
 ('a1d0aa00-0000-4000-8000-000000000031', 'a1d0aa00-0000-4000-8000-000000000001', 'Indoor court · full', 'الصالة الداخلية · كاملة', 'hall', 'basketball', ARRAY['basketball','football','volleyball','handball'], 'Riyadh', 'https://beast-tribe.vercel.app/places/andorra/indoor-court.jpg',
  'Full court for basketball, football, handball or volleyball. Badminton books half the court.', 'الصالة كاملة لكرة السلة أو القدم أو اليد أو الطائرة. الريشة الطائرة تحجز نصف الصالة.', 0, 60, 20, '{"0":[["06:00","23:00"]],"1":[["06:00","23:00"]],"2":[["06:00","23:00"]],"3":[["06:00","23:00"]],"4":[["06:00","23:00"]],"5":[["06:00","23:00"]],"6":[["06:00","23:00"]]}', 'community', 'b4fb2a29-3e33-461f-b1cb-ad4fd9277e2f', 1, 6, true, NULL, NULL, 6),
 ('a1d0aa00-0000-4000-8000-000000000032', 'a1d0aa00-0000-4000-8000-000000000001', 'Indoor court · half A', 'الصالة الداخلية · النصف أ', 'hall', 'badminton', ARRAY['badminton'], 'Riyadh', 'https://beast-tribe.vercel.app/places/andorra/indoor-court.jpg',
  'Half of the indoor court, for badminton.', 'نصف الصالة الداخلية للريشة الطائرة.', 0, 60, 4, '{"0":[["06:00","23:00"]],"1":[["06:00","23:00"]],"2":[["06:00","23:00"]],"3":[["06:00","23:00"]],"4":[["06:00","23:00"]],"5":[["06:00","23:00"]],"6":[["06:00","23:00"]]}', 'community', 'b4fb2a29-3e33-461f-b1cb-ad4fd9277e2f', 1, 6, true, NULL, 'a1d0aa00-0000-4000-8000-000000000031', 7),
 ('a1d0aa00-0000-4000-8000-000000000033', 'a1d0aa00-0000-4000-8000-000000000001', 'Indoor court · half B', 'الصالة الداخلية · النصف ب', 'hall', 'badminton', ARRAY['badminton'], 'Riyadh', 'https://beast-tribe.vercel.app/places/andorra/indoor-court.jpg',
  'Half of the indoor court, for badminton.', 'نصف الصالة الداخلية للريشة الطائرة.', 0, 60, 4, '{"0":[["06:00","23:00"]],"1":[["06:00","23:00"]],"2":[["06:00","23:00"]],"3":[["06:00","23:00"]],"4":[["06:00","23:00"]],"5":[["06:00","23:00"]],"6":[["06:00","23:00"]]}', 'community', 'b4fb2a29-3e33-461f-b1cb-ad4fd9277e2f', 1, 6, true, NULL, 'a1d0aa00-0000-4000-8000-000000000031', 8),
 ('a1d0aa00-0000-4000-8000-000000000041', 'a1d0aa00-0000-4000-8000-000000000001', 'Indoor pool', 'المسبح الداخلي', 'pool', 'swimming', ARRAY['swimming'], 'Riyadh', 'https://beast-tribe.vercel.app/places/andorra/pool.jpg',
  'Indoor pool for swimming classes with a coach.', 'مسبح داخلي لحصص السباحة مع مدرب.', 0, 60, 12, '{"0":[["06:00","23:00"]],"1":[["06:00","23:00"]],"2":[["06:00","23:00"]],"3":[["06:00","23:00"]],"4":[["06:00","23:00"]],"5":[["06:00","23:00"]],"6":[["06:00","23:00"]]}', 'community', 'b4fb2a29-3e33-461f-b1cb-ad4fd9277e2f', 1, 6, false, NULL, NULL, 9)
ON CONFLICT (id) DO NOTHING;
