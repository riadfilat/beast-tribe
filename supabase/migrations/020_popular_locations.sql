-- ============================================
-- 020: Popular Locations (admin-managed)
-- Dynamic sports locations filtered by country/city
-- ============================================

CREATE TABLE IF NOT EXISTS popular_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'SA',
  description TEXT,
  image_url TEXT,
  sports TEXT[] DEFAULT '{}',
  address TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_popular_locations_country ON popular_locations(country, is_active);
CREATE INDEX IF NOT EXISTS idx_popular_locations_city ON popular_locations(city, is_active);

ALTER TABLE popular_locations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY locations_read ON popular_locations FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY locations_write ON popular_locations FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed with initial popular locations
INSERT INTO popular_locations (name, city, country, description, image_url, sports) VALUES
  ('Wadi Hanifah Path', 'Riyadh', 'SA', '8km scenic trail along the valley — perfect for runs and cycling', 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&h=300&fit=crop', ARRAY['running','cycling','walking']),
  ('King Fahd Park', 'Riyadh', 'SA', 'Open green spaces with running tracks and outdoor workout areas', 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&h=300&fit=crop', ARRAY['running','walking','yoga','football']),
  ('Jeddah Corniche', 'Jeddah', 'SA', '30km waterfront promenade — sunrise runs with sea views', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=300&fit=crop', ARRAY['running','cycling','walking']),
  ('Riyadh Boulevard', 'Riyadh', 'SA', 'Modern urban district with wide paths for evening runs', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=300&fit=crop', ARRAY['running','walking']),
  ('Leejam Fitness — Olaya', 'Riyadh', 'SA', 'Full-equipped gym with pool, group classes, and CrossFit zone', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=300&fit=crop', ARRAY['gym','crossfit','swimming']),
  ('Fitness Time — King Fahd', 'Riyadh', 'SA', 'Premium gym with Hyrox training area and personal coaches', 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&h=300&fit=crop', ARRAY['gym','crossfit','hyrox']),
  ('The Edge Fitness', 'Jeddah', 'SA', 'Community-focused gym with group sessions and yoga studio', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=300&fit=crop', ARRAY['gym','crossfit','yoga']),
  ('Padel Saudi — Olaya', 'Riyadh', 'SA', 'Indoor and outdoor padel courts with coaching available', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&h=300&fit=crop', ARRAY['padel','tennis']),
  ('Kite Beach', 'Dubai', 'AE', 'Beach workouts, swimming, and yoga with skyline views', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=300&fit=crop', ARRAY['running','swimming','yoga','volleyball']),
  ('Dubai Marina Walk', 'Dubai', 'AE', '7km waterfront loop with stunning marina and skyline views', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=300&fit=crop', ARRAY['running','cycling','walking']),
  ('Yas Marina Circuit', 'Abu Dhabi', 'AE', 'Run or cycle the F1 track — iconic open-track sessions', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=300&fit=crop', ARRAY['running','cycling'])
ON CONFLICT DO NOTHING;

SELECT 'Popular locations system created!' as status;
