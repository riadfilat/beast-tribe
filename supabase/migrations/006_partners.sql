-- ============================================
-- PARTNERS (Coaches, Gyms, Event Companies)
-- ============================================

CREATE TABLE IF NOT EXISTS partners (
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
-- RLS Policies handled at application level via service_role_key for admins
-- and via app-level checks for public queries

-- Link partners to events
CREATE TABLE IF NOT EXISTS partner_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('organizer', 'coach', 'venue')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(partner_id, event_id)
);

ALTER TABLE partner_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read partner_events" ON partner_events;
-- Partner events policies handled at application level

-- Add partner tracking to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id);

-- Indexes may already exist if partners table has the correct columns
-- They'll be created separately if needed
