-- ============================================
-- PARTNERS (Coaches, Gyms, Event Companies)
-- ============================================

CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  partner_type TEXT NOT NULL CHECK (partner_type IN ('coach', 'gym', 'event_company')),
  business_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  city TEXT,
  country TEXT DEFAULT 'SA',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read verified partners" ON partners
  FOR SELECT USING (is_verified = true AND is_active = true);
CREATE POLICY "Partners can read own record" ON partners
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Partners can update own record" ON partners
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage partners" ON partners
  FOR ALL USING (is_admin());

-- Helper: check if current user is a partner
CREATE OR REPLACE FUNCTION is_partner()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM partners
    WHERE user_id = auth.uid()
    AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Link partners to events
CREATE TABLE partner_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('organizer', 'coach', 'venue')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(partner_id, event_id)
);

ALTER TABLE partner_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read partner_events" ON partner_events FOR SELECT USING (true);
CREATE POLICY "Partners manage own" ON partner_events
  FOR ALL USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));
CREATE POLICY "Admins manage partner_events" ON partner_events
  FOR ALL USING (is_admin());

-- Add partner tracking to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id);

CREATE INDEX idx_partners_type ON partners(partner_type);
CREATE INDEX idx_partners_verified ON partners(is_verified, is_active);
CREATE INDEX idx_events_partner ON events(partner_id);
