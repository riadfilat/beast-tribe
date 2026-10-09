-- 090: Riyadh places to run and ride, with their exact spot (OpenStreetMap, via Photon), so picking
-- one in Play opens the map right there to draw the track. Places for running/cycling show even
-- without a photo (the app draws them on the map instead).

UPDATE popular_locations SET latitude = 24.62002, longitude = 46.70835,
  sports = ARRAY['running', 'walking', 'cycling', 'yoga', 'football']
WHERE id = '3fa58b5a-7abe-4eac-af81-ee2e161a2d90';
UPDATE popular_locations SET latitude = 24.67832, longitude = 46.61025
WHERE id = '408a6310-bd68-4fa0-97d7-ce2d3e139f9b';

INSERT INTO popular_locations (name, name_ar, city, country, sports, latitude, longitude, is_active, sort_order)
SELECT v.name, v.name_ar, 'Riyadh', 'SA', v.sports, v.lat, v.lng, true, 0
FROM (VALUES
  ('King Abdullah Park, Malaz', 'منتزه الملك عبدالله بالملز', ARRAY['running', 'walking', 'cycling'], 24.66656, 46.73696),
  ('Sports Boulevard, Hittin', 'المسار الرياضي، حطين', ARRAY['running', 'cycling', 'walking'], 24.75543, 46.58686),
  ('Diplomatic Quarter trails', 'ممشى حي السفارات', ARRAY['running', 'cycling', 'walking'], 24.67710, 46.62515),
  ('Al Bujairi, Diriyah', 'البجيري، الدرعية', ARRAY['running', 'walking'], 24.73879, 46.57327),
  ('Wadi Namar Park', 'حديقة وادي نمار', ARRAY['running', 'walking', 'cycling'], 24.58141, 46.69346),
  ('King Salman Park', 'حديقة الملك سلمان', ARRAY['running', 'walking', 'cycling'], 24.72279, 46.71898),
  ('Al Nahda Park', 'حديقة النهضة', ARRAY['running', 'walking'], 24.69561, 46.75114),
  ('Al Ilb Dam, Wadi Hanifah', 'سد العلب، وادي حنيفة', ARRAY['cycling', 'running', 'hiking'], 24.77455, 46.53138),
  ('Thumamah Park', 'منتزه الثمامة', ARRAY['cycling', 'running', 'hiking'], 25.15420, 46.65010)
) AS v(name, name_ar, sports, lat, lng)
WHERE NOT EXISTS (SELECT 1 FROM popular_locations p WHERE lower(p.name) = lower(v.name));
