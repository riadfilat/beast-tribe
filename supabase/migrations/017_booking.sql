-- ============================================
-- 017: Coach booking system
-- Time slots, availability, and booking management
-- ============================================

-- Coach weekly availability slots (set by admin)
CREATE TABLE IF NOT EXISTS coach_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partner_id, day_of_week, start_time)
);

-- Actual bookings (prevents double-booking via unique constraint)
CREATE TABLE IF NOT EXISTS coach_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  booked_by UUID NOT NULL REFERENCES profiles(id),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partner_id, booking_date, start_time)
);

CREATE INDEX IF NOT EXISTS idx_coach_slots_partner ON coach_slots(partner_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_coach_bookings_partner_date ON coach_bookings(partner_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_coach_bookings_booked_by ON coach_bookings(booked_by);

-- RLS
ALTER TABLE coach_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_bookings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY coach_slots_read ON coach_slots FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY coach_bookings_read ON coach_bookings FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY coach_bookings_insert ON coach_bookings FOR INSERT WITH CHECK (booked_by = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY coach_bookings_update ON coach_bookings FOR UPDATE USING (booked_by = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

SELECT 'Booking system created!' as status;
