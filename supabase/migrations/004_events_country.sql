-- Add country column to events for region-based filtering
ALTER TABLE events ADD COLUMN country TEXT DEFAULT 'SA';

-- Update existing seed events with country based on location_city
UPDATE events SET country = 'SA' WHERE location_city ILIKE '%riyadh%' OR location_city ILIKE '%jeddah%' OR location_city IS NULL;
UPDATE events SET country = 'AE' WHERE location_city ILIKE '%dubai%' OR location_city ILIKE '%abu dhabi%';

-- Index for fast country-based lookups
CREATE INDEX idx_events_country ON events(country);
