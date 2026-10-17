-- Public places (parks, wadis, public courts) get real photos: the owner said normal photos are fine
-- for public places (businesses keep the brand art until they send their own).
-- 7 places get a photo of the place itself; the others a photo of a similar public place in
-- Riyadh or of an outdoor court. All free licences, checked by eye (no signage, people fully clothed),
-- credited in admin/public/places/spots/CREDITS.md and the app's Settings.
-- Only fills places that have no photo yet, so an uploaded photo is never replaced.
update popular_locations p
   set image_url = 'https://beast-tribe.vercel.app/places/spots/' || v.slug || '.jpg'
  from (values
  ('Al Bujairi, Diriyah', 'al-bujairi'),
  ('Al Ilb Dam, Wadi Hanifah', 'al-ilb-dam'),
  ('Al Rawdah Park', 'al-rawdah-park'),
  ('King Abdulaziz Historical Center Park', 'murabba-park'),
  ('King Fahad Library Park', 'king-fahad-library'),
  ('Wadi Namar Park', 'wadi-namar'),
  ('Diplomatic Quarter trails', 'dq-wadi'),
  ('Thumamah Park', 'dq-wadi'),
  ('Sports Boulevard, Hittin', 'manakh-park'),
  ('Ar Rabwah Basketball Court', 'basketball-court'),
  ('Al Wadi Sports Park', 'basketball-court'),
  ('Al Yarmuk Municipal Plaza', 'football-cage'),
  ('Diplomatic Quarter Sports Grounds', 'football-cage'),
  ('Al Aqiq Park', 'museum-park'),
  ('Al Dawh Park', 'manakh-park'),
  ('Al Futah Park', 'murabba-park'),
  ('Al Hada Park', 'palm-oasis'),
  ('Al Izdihar Park', 'museum-park'),
  ('Al Muruj Park', 'manakh-park'),
  ('Al Nahda Park', 'murabba-park'),
  ('Al Narjis Park', 'palm-oasis'),
  ('Al Rayan Park', 'museum-park'),
  ('Al Sahafa Park', 'manakh-park'),
  ('Al Shalal Park', 'murabba-park'),
  ('Al Shuhada Park', 'palm-oasis'),
  ('Al Suwaidi Park', 'museum-park'),
  ('Al Waha Park', 'manakh-park'),
  ('Al Wurud Park', 'murabba-park'),
  ('Al Yarmuk Park', 'palm-oasis'),
  ('King Abdulaziz Park', 'museum-park'),
  ('King Abdullah Park, Malaz', 'manakh-park'),
  ('King Salman Park', 'murabba-park'),
  ('Olaya Park', 'palm-oasis'),
  ('Qurtubah Park', 'museum-park'),
  ('Riyadh Boulevard', 'manakh-park'),
  ('Riyadh Marathon Village', 'murabba-park'),
  ('World Landmarks Park', 'palm-oasis')
  ) as v(name, slug)
 where p.name = v.name
   and p.community_id is null
   and p.image_url is null;
