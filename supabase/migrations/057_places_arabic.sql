-- 057 Places in Arabic
-- Popular spots only had an English name, so the Arabic Board showed English place names.
ALTER TABLE popular_locations ADD COLUMN IF NOT EXISTS name_ar TEXT CHECK (name_ar IS NULL OR length(name_ar) <= 160);

UPDATE popular_locations p SET name_ar = v.ar
FROM (VALUES
  ('King Fahd Park', 'حديقة الملك فهد'),
  ('Wadi Hanifah Path', 'ممشى وادي حنيفة'),
  ('Riyadh Boulevard', 'بوليفارد الرياض'),
  ('Kite Beach', 'كايت بيتش'),
  ('Leejam Fitness — Olaya', 'لجام للياقة — العليا'),
  ('Jeddah Corniche', 'كورنيش جدة'),
  ('Andoraa basketball court - near entrance court', 'ملعب كرة السلة في أندورا - بجانب المدخل')
) AS v(en, ar)
WHERE p.name = v.en AND p.name_ar IS NULL;
