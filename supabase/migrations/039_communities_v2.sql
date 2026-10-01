-- 039: Community-driven Beast Tribe.
-- * Communities are OPEN (anyone joins from Explore) or PRIVATE (B2B: companies, compounds,
--   clubs; join with the community's invite code, within its seats and contract).
-- * Members can belong to several communities (community_members). profiles.community_id stays
--   as the member's "primary" community for older readers and the admin's assign control.
-- * Everything is private to where it lives: sessions belong to a community or a pack; packs and
--   their member lists are visible only to the pack; feed posts belong to a community; RSVPs,
--   comments and reactions follow what you can see; coach bookings are private.
-- * A default open community ("Beast Tribe") that everyone joins on sign-up keeps the board alive.
-- * Payments are prepared (events.price_sar, payments) but nothing charges yet.

-- ─── 1. Communities ─────────────────────────────────────────────────────────
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS join_code TEXT,
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'club',
  ADD COLUMN IF NOT EXISTS seat_limit INT,
  ADD COLUMN IF NOT EXISTS contract_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE communities DROP CONSTRAINT IF EXISTS communities_visibility_chk;
ALTER TABLE communities ADD CONSTRAINT communities_visibility_chk CHECK (visibility IN ('open', 'private'));
ALTER TABLE communities DROP CONSTRAINT IF EXISTS communities_kind_chk;
ALTER TABLE communities ADD CONSTRAINT communities_kind_chk CHECK (kind IN ('club', 'company', 'compound', 'city', 'brand'));
CREATE UNIQUE INDEX IF NOT EXISTS communities_join_code_key ON communities (upper(join_code)) WHERE join_code IS NOT NULL;

-- Short codes without look-alike characters (no 0/O, 1/I/L).
CREATE OR REPLACE FUNCTION bt_new_code(p_len INT DEFAULT 6) RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE
  v_chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_out TEXT := '';
BEGIN
  FOR i IN 1..p_len LOOP
    v_out := v_out || substr(v_chars, 1 + floor(random() * length(v_chars))::INT, 1);
  END LOOP;
  RETURN v_out;
END $$;

-- Private communities always have a code.
CREATE OR REPLACE FUNCTION bt_communities_code() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.visibility = 'private' AND (NEW.join_code IS NULL OR NEW.join_code = '') THEN
    LOOP
      NEW.join_code := bt_new_code(6);
      EXIT WHEN NOT EXISTS (SELECT 1 FROM communities WHERE upper(join_code) = NEW.join_code AND id <> NEW.id);
    END LOOP;
  END IF;
  IF NEW.join_code IS NOT NULL THEN
    NEW.join_code := upper(trim(NEW.join_code));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_communities_code ON communities;
CREATE TRIGGER trg_communities_code BEFORE INSERT OR UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION bt_communities_code();

UPDATE communities SET visibility = 'private' WHERE visibility IS NULL OR visibility = 'private';

INSERT INTO communities (name, slug, description, country, city, is_active, visibility, kind, is_default)
SELECT 'Beast Tribe', 'beast-tribe', 'The open Operation Beast community. Everyone is welcome.', 'SA', NULL, true, 'open', 'brand', true
WHERE NOT EXISTS (SELECT 1 FROM communities WHERE slug = 'beast-tribe');

-- ─── 2. Membership ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_members (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);
CREATE INDEX IF NOT EXISTS community_members_user_idx ON community_members (user_id);
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- Backfill: today's single assignment, plus everyone in the default open community.
INSERT INTO community_members (community_id, user_id)
SELECT community_id, id FROM profiles WHERE community_id IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO community_members (community_id, user_id)
SELECT c.id, p.id FROM profiles p CROSS JOIN communities c WHERE c.is_default
ON CONFLICT DO NOTHING;

-- Helpers (SECURITY DEFINER so policies can use them without recursing into RLS).
CREATE OR REPLACE FUNCTION bt_my_community_ids() RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT community_id FROM community_members WHERE user_id = auth.uid()
$$;
CREATE OR REPLACE FUNCTION bt_my_pack_ids() RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT pack_id FROM pack_members WHERE user_id = auth.uid()
$$;
CREATE OR REPLACE FUNCTION bt_open_community_ids() RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM communities WHERE visibility = 'open' AND is_active
$$;
/** May the current user see things that live in this community? */
CREATE OR REPLACE FUNCTION bt_sees_community(p_community UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_community IN (SELECT bt_open_community_ids())
      OR p_community IN (SELECT bt_my_community_ids())
      OR is_admin(auth.uid())
$$;

-- New members land in the default open community.
CREATE OR REPLACE FUNCTION bt_profile_default_community() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO community_members (community_id, user_id)
  SELECT id, NEW.id FROM communities WHERE is_default AND is_active
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_profile_default_community ON profiles;
CREATE TRIGGER trg_profile_default_community AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION bt_profile_default_community();

-- The admin's "assign community" (profiles.community_id) adds a membership too.
CREATE OR REPLACE FUNCTION sync_user_community_packs() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.community_id IS NOT NULL AND NEW.community_id IS DISTINCT FROM OLD.community_id THEN
    INSERT INTO community_members (community_id, user_id) VALUES (NEW.community_id, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

-- Joining a community puts you in its default packs.
CREATE OR REPLACE FUNCTION bt_community_member_packs() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO pack_members (pack_id, user_id, role, joined_at)
  SELECT id, NEW.user_id, 'member', now() FROM packs
  WHERE community_id = NEW.community_id AND is_community_default
  ON CONFLICT (pack_id, user_id) DO NOTHING;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_community_member_packs ON community_members;
CREATE TRIGGER trg_community_member_packs AFTER INSERT ON community_members
  FOR EACH ROW EXECUTE FUNCTION bt_community_member_packs();

-- Marking a pack as a community default adds the community's members.
CREATE OR REPLACE FUNCTION sync_community_pack_default() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_community_default = true AND NEW.community_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.is_community_default = false OR OLD.community_id IS DISTINCT FROM NEW.community_id) THEN
    INSERT INTO pack_members (pack_id, user_id, role, joined_at)
    SELECT NEW.id, m.user_id, 'member', now() FROM community_members m WHERE m.community_id = NEW.community_id
    ON CONFLICT (pack_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

-- Join / leave.
CREATE OR REPLACE FUNCTION join_community_by_code(p_code TEXT) RETURNS TABLE (id UUID, name TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_c communities%ROWTYPE;
  v_seats INT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN'; END IF;
  SELECT * INTO v_c FROM communities c WHERE upper(c.join_code) = upper(trim(p_code)) AND c.is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'INVALID'; END IF;
  IF v_c.contract_ends_at IS NOT NULL AND v_c.contract_ends_at < now() THEN RAISE EXCEPTION 'EXPIRED'; END IF;
  IF EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = v_c.id AND m.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'ALREADY';
  END IF;
  IF v_c.seat_limit IS NOT NULL THEN
    SELECT count(*) INTO v_seats FROM community_members m WHERE m.community_id = v_c.id;
    IF v_seats >= v_c.seat_limit THEN RAISE EXCEPTION 'FULL'; END IF;
  END IF;
  INSERT INTO community_members (community_id, user_id) VALUES (v_c.id, auth.uid());
  RETURN QUERY SELECT v_c.id, v_c.name;
END $$;

CREATE OR REPLACE FUNCTION join_open_community(p_id UUID) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN'; END IF;
  IF NOT EXISTS (SELECT 1 FROM communities WHERE id = p_id AND visibility = 'open' AND is_active) THEN
    RAISE EXCEPTION 'INVALID';
  END IF;
  INSERT INTO community_members (community_id, user_id) VALUES (p_id, auth.uid()) ON CONFLICT DO NOTHING;
END $$;

-- Packs are found by code without being visible to non-members.
CREATE OR REPLACE FUNCTION join_pack_by_code(p_code TEXT) RETURNS TABLE (id UUID, name TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_p packs%ROWTYPE;
  v_size INT;
  v_mine INT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN'; END IF;
  SELECT * INTO v_p FROM packs pk WHERE upper(pk.invite_code) = upper(trim(p_code)) AND NOT coalesce(pk.is_system, false);
  IF NOT FOUND THEN RAISE EXCEPTION 'INVALID'; END IF;
  IF EXISTS (SELECT 1 FROM pack_members m WHERE m.pack_id = v_p.id AND m.user_id = auth.uid()) THEN RAISE EXCEPTION 'ALREADY'; END IF;
  SELECT count(*) INTO v_size FROM pack_members m WHERE m.pack_id = v_p.id;
  IF v_size >= coalesce(v_p.max_members, 20) THEN RAISE EXCEPTION 'FULL'; END IF;
  SELECT count(*) INTO v_mine FROM pack_members m WHERE m.user_id = auth.uid();
  IF v_mine >= 20 THEN RAISE EXCEPTION 'LIMIT'; END IF;
  INSERT INTO pack_members (pack_id, user_id, role) VALUES (v_p.id, auth.uid(), 'member');
  RETURN QUERY SELECT v_p.id, v_p.name;
END $$;

REVOKE ALL ON FUNCTION join_community_by_code(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION join_open_community(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION join_pack_by_code(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION join_community_by_code(TEXT), join_open_community(UUID), join_pack_by_code(TEXT) TO authenticated;

-- ─── 3. Events belong to a community or a pack ──────────────────────────────
ALTER TABLE events ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id) ON DELETE CASCADE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS price_sar NUMERIC(10, 2);
CREATE INDEX IF NOT EXISTS events_community_idx ON events (community_id);

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_visibility_check;

UPDATE events SET community_id = (SELECT id FROM communities WHERE is_default LIMIT 1), visibility = 'community'
WHERE visibility IS DISTINCT FROM 'pack' AND community_id IS NULL;
UPDATE events SET visibility = 'community' WHERE visibility = 'public';

ALTER TABLE events ADD CONSTRAINT events_visibility_check CHECK (visibility IN ('community', 'pack'));
ALTER TABLE events ALTER COLUMN visibility SET DEFAULT 'community';
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_audience_chk;
ALTER TABLE events ADD CONSTRAINT events_audience_chk CHECK (
  (visibility = 'pack' AND pack_id IS NOT NULL) OR (visibility = 'community' AND community_id IS NOT NULL)
);

-- Hosts may only post where they belong.
CREATE OR REPLACE FUNCTION bt_events_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Older app builds post "public" sessions: they go to the default open community.
  IF NEW.visibility IS NULL OR NEW.visibility = 'public' THEN
    NEW.visibility := CASE WHEN NEW.pack_id IS NOT NULL AND NEW.community_id IS NULL THEN 'pack' ELSE 'community' END;
  END IF;
  IF NEW.visibility = 'community' AND NEW.community_id IS NULL THEN
    NEW.community_id := (SELECT id FROM communities WHERE is_default LIMIT 1);
  END IF;
  IF auth.uid() IS NULL OR is_admin(auth.uid()) THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW.community_id IS NOT DISTINCT FROM OLD.community_id AND NEW.pack_id IS NOT DISTINCT FROM OLD.pack_id THEN
    RETURN NEW;
  END IF;
  IF NEW.visibility = 'pack' AND NOT EXISTS (SELECT 1 FROM pack_members WHERE pack_id = NEW.pack_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'PACK_ONLY' USING ERRCODE = '42501';
  END IF;
  IF NEW.visibility = 'community' AND NOT EXISTS (SELECT 1 FROM community_members WHERE community_id = NEW.community_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'COMMUNITY_ONLY' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_events_guard ON events;
CREATE TRIGGER trg_events_guard BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION bt_events_guard();

DROP POLICY IF EXISTS events_select ON events;
CREATE POLICY events_select ON events FOR SELECT USING (
  auth.uid() = created_by
  OR (visibility = 'pack' AND pack_id IN (SELECT bt_my_pack_ids()))
  OR (visibility = 'community' AND bt_sees_community(community_id))
  OR is_admin(auth.uid())
);

-- Joining checks the same rules as seeing (plus women-only, capacity, timing).
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
    RAISE EXCEPTION 'COMMUNITY_ONLY';
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

-- RSVPs are visible only for sessions you can see.
DROP POLICY IF EXISTS event_rsvps_select ON event_rsvps;
DROP POLICY IF EXISTS "Users manage own RSVPs" ON event_rsvps;
CREATE POLICY event_rsvps_select ON event_rsvps FOR SELECT USING (
  user_id = auth.uid() OR event_id IN (SELECT id FROM events)
);

-- ─── 4. Packs are private to their members ──────────────────────────────────
DROP POLICY IF EXISTS packs_select ON packs;
CREATE POLICY packs_select ON packs FOR SELECT USING (
  id IN (SELECT bt_my_pack_ids())
  OR created_by = auth.uid()
  OR (is_community_default AND community_id IN (SELECT bt_my_community_ids()))
  OR is_admin(auth.uid())
);
DROP POLICY IF EXISTS "Pack members are public" ON pack_members;
DROP POLICY IF EXISTS pack_members_select ON pack_members;
CREATE POLICY pack_members_select ON pack_members FOR SELECT USING (
  user_id = auth.uid() OR pack_id IN (SELECT bt_my_pack_ids()) OR is_admin(auth.uid())
);

-- ─── 5. Feed posts belong to a community ────────────────────────────────────
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id) ON DELETE CASCADE;
UPDATE feed_posts fp SET community_id = coalesce(
  (SELECT e.community_id FROM events e WHERE e.id = fp.event_id),
  (SELECT id FROM communities WHERE is_default LIMIT 1)
) WHERE fp.community_id IS NULL;
CREATE INDEX IF NOT EXISTS feed_posts_community_idx ON feed_posts (community_id);

-- New posts with no community go to the session's community, else the default open one.
CREATE OR REPLACE FUNCTION bt_feed_post_community() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.community_id IS NULL THEN
    NEW.community_id := coalesce(
      (SELECT e.community_id FROM events e WHERE e.id = NEW.event_id),
      (SELECT id FROM communities WHERE is_default LIMIT 1)
    );
  END IF;
  IF auth.uid() IS NOT NULL AND NOT is_admin(auth.uid()) AND NOT bt_sees_community(NEW.community_id) THEN
    RAISE EXCEPTION 'COMMUNITY_ONLY' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_feed_post_community ON feed_posts;
CREATE TRIGGER trg_feed_post_community BEFORE INSERT ON feed_posts
  FOR EACH ROW EXECUTE FUNCTION bt_feed_post_community();

DROP POLICY IF EXISTS "Feed posts are public" ON feed_posts;
DROP POLICY IF EXISTS feed_posts_select ON feed_posts;
CREATE POLICY feed_posts_select ON feed_posts FOR SELECT USING (
  user_id = auth.uid()
  OR (is_visible AND bt_sees_community(community_id))
  OR is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Users can view active comments" ON feed_comments;
DROP POLICY IF EXISTS feed_comments_select ON feed_comments;
CREATE POLICY feed_comments_select ON feed_comments FOR SELECT USING (
  user_id = auth.uid()
  OR is_admin(auth.uid())
  OR (status IS DISTINCT FROM 'hidden'::comment_status AND post_id IN (SELECT id FROM feed_posts))
);

DROP POLICY IF EXISTS "Beasts are public" ON beasts;
DROP POLICY IF EXISTS beasts_select ON beasts;
CREATE POLICY beasts_select ON beasts FOR SELECT USING (
  user_id = auth.uid() OR post_id IN (SELECT id FROM feed_posts)
);

-- ─── 6. Places, coaches, partners ───────────────────────────────────────────
DROP POLICY IF EXISTS locations_read_active ON popular_locations;
CREATE POLICY locations_read_active ON popular_locations FOR SELECT USING (
  community_id IS NULL OR bt_sees_community(community_id)
);

-- Bookings are between the member and the coach.
DROP POLICY IF EXISTS coach_bookings_read ON coach_bookings;
CREATE POLICY coach_bookings_read ON coach_bookings FOR SELECT USING (
  booked_by = auth.uid()
  OR partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
  OR is_admin(auth.uid())
);

-- Which start times a coach already has booked on a day (no other details leak).
CREATE OR REPLACE FUNCTION coach_taken_starts(p_partner UUID, p_date DATE) RETURNS SETOF TIME
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT start_time FROM coach_bookings
  WHERE partner_id = p_partner AND booking_date = p_date AND status IS DISTINCT FROM 'cancelled'
$$;
REVOKE ALL ON FUNCTION coach_taken_starts(UUID, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION coach_taken_starts(UUID, DATE) TO authenticated;
-- One booking per coach per start time.
CREATE UNIQUE INDEX IF NOT EXISTS coach_bookings_one_per_slot ON coach_bookings (partner_id, booking_date, start_time)
  WHERE status IS DISTINCT FROM 'cancelled';

-- Healthy-food partners (partner_type 'nutrition') carry a member offer in metadata:
-- {"offer": "...", "offer_ar": "...", "code": "..."}; restaurants can be scoped to a community.
ALTER TABLE partners ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id) ON DELETE SET NULL;
DROP POLICY IF EXISTS "Public can view active partners" ON partners;
CREATE POLICY "Public can view active partners" ON partners FOR SELECT USING (
  status = 'active'::partner_status AND (community_id IS NULL OR bt_sees_community(community_id))
);

-- ─── 7. Communities & members visibility ────────────────────────────────────
DROP POLICY IF EXISTS communities_read ON communities;
CREATE POLICY communities_read ON communities FOR SELECT USING (
  (visibility = 'open' AND is_active) OR id IN (SELECT bt_my_community_ids()) OR is_admin(auth.uid())
);

DROP POLICY IF EXISTS community_members_select ON community_members;
CREATE POLICY community_members_select ON community_members FOR SELECT USING (
  user_id = auth.uid() OR community_id IN (SELECT bt_my_community_ids()) OR is_admin(auth.uid())
);
DROP POLICY IF EXISTS community_members_leave ON community_members;
CREATE POLICY community_members_leave ON community_members FOR DELETE USING (user_id = auth.uid() OR is_admin(auth.uid()));
DROP POLICY IF EXISTS community_members_admin ON community_members;
CREATE POLICY community_members_admin ON community_members FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- ─── 8. Payments (prepared, not live) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
  kind TEXT NOT NULL DEFAULT 'session' CHECK (kind IN ('session', 'coach', 'licence')),
  amount_sar NUMERIC(10, 2) NOT NULL CHECK (amount_sar >= 0),
  fee_sar NUMERIC(10, 2) NOT NULL DEFAULT 0,
  provider TEXT,
  provider_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payments_own_read ON payments;
CREATE POLICY payments_own_read ON payments FOR SELECT USING (user_id = auth.uid() OR is_admin(auth.uid()));
-- No client writes: rows will be created by the payment provider's server webhook (service role).
