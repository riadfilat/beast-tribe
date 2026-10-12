-- 101 · More places to play in Riyadh
--
-- In plain words: 30 real venues (10 padel clubs, football pitches, tennis, basketball,
-- climbing, pools, boxing/MMA, yoga and pilates studios) and 24 public parks across Riyadh,
-- so hosts can pick a place instead of typing one. Every venue was checked on at least two sources
-- (Google Maps, Playtomic, the venue's own site, OpenStreetMap); parks come from OpenStreetMap.
-- Each has its map position, and venues their phone and booking page (shown in Play next to
-- "I'll book it"). No photos of their own yet: the app shows each place's sport photo until the
-- venue sends one (HQ → Places & courts). Places already listed are skipped.
-- Also: Andorra's courts as a place only Andorra members see (in-app court booking is off at launch),
-- with Andorra's own court photos.

INSERT INTO popular_locations (name, name_ar, description, sports, latitude, longitude, phone, booking_url, sort_order, city, country, is_active)
SELECT v.name, v.name_ar, v.description, v.sports, v.lat, v.lng, v.phone, v.booking_url, v.sort_order, 'Riyadh', 'SA', true
FROM (VALUES
  ('Padel Rush', 'بادل رش', 'Hittin', ARRAY['padel']::text[], 24.77074, 46.60264, '+966 53 372 9699', 'https://playtomic.com/clubs/padel-rush', 5),
  ('PadelX Al Yasmin', 'بادل اكس الياسمين', 'Al Yasmin', ARRAY['padel']::text[], 24.82625, 46.65269, '+966 59 521 4969', 'https://playtomic.com/clubs/padelx-alyasmein', 5),
  ('Padel Way', 'بادل وي', 'Al Aarid', ARRAY['padel']::text[], 24.85764, 46.60701, '+966 55 744 7422', 'https://playtomic.com/clubs/padel-way-2026', 5),
  ('Hala Padel', 'هلا بادل', 'Al Aarid', ARRAY['padel']::text[], 24.90425, 46.61401, '+966 55 202 3072', 'https://playtomic.com/clubs/hala-padel', 5),
  ('Padel Masters (Riyadh Marriott)', 'بادل ماسترز', 'Al Wizarat', ARRAY['padel']::text[], 24.68676, 46.71328, '+966 50 671 1884', 'https://playtomic.com/clubs/padel-masters-marriot', 5),
  ('Padel Cloud', 'سحابة البادل', 'Al Olaya', ARRAY['padel']::text[], 24.70518, 46.67435, '+966 55 759 9565', NULL, 5),
  ('Padel IN Al Rabwah', 'بادل ان الربوة', 'Ar Rabwah', ARRAY['padel']::text[], 24.69257, 46.76414, '+966 54 463 3188', 'https://playtomic.com/clubs/padel-in-rabwah', 5),
  ('Valley Padel', 'فالي بادل', 'Al Hada (Wadi Hanifah)', ARRAY['padel']::text[], 24.65562, 46.6048, '+966 53 434 9569', 'https://playtomic.com/clubs/valley-padel-indoor-50-sar-off', 5),
  ('2Padel', NULL, 'Al Uraija (Wadi Hanifah)', ARRAY['padel']::text[], 24.62848, 46.64768, '+966 50 662 6769', 'https://playtomic.com/clubs/2padel', 5),
  ('PadelX KACST', 'بادل اكس كاكست', 'Prince Turki Al Awal Rd', ARRAY['padel']::text[], 24.72527, 46.6439, '+966 59 521 4044', 'https://playtomic.com/clubs/kacst-padel', 5),
  ('442 Football Park (Hayat Mall)', 'ملاعب 442 (حياة مول)', 'King Fahd', ARRAY['football']::text[], 24.74277, 46.67977, '+966 53 980 0915', 'https://www.442footballparksa.com/', 5),
  ('Al-Muhtarifun Pitches (Irqah)', 'ملاعب المحترفون', 'Irqah', ARRAY['football']::text[], 24.69242, 46.60827, '+966 55 300 6548', 'https://www.golatoapp.com/book/almuhtarifoon/irqah', 5),
  ('Elite Sports Academy (Downe House)', NULL, 'Al Aqiq', ARRAY['football','basketball','swimming']::text[], 24.76124, 46.62731, '+966 53 434 6003', 'https://elitesports.sa/', 5),
  ('2030 Stadiums', 'ملاعب 2030', 'Al Qirawan', ARRAY['football']::text[], 24.83708, 46.60552, '+966 55 988 2030', NULL, 5),
  ('Al Wadi Football Pitches', 'ملاعب الوادي', 'Al Uraija', ARRAY['football']::text[], 24.62761, 46.64744, '+966 50 807 7398', NULL, 5),
  ('DQ Tennis & Padel Center', 'مركز التنس والبادل - حي السفارات', 'Diplomatic Quarter', ARRAY['tennis','padel']::text[], 24.68357, 46.61784, '+966 55 051 5146', 'https://dqtennis-sa.com/', 5),
  ('Tennis Home Academy (King Fahd)', 'اكاديمية بيت التنس', 'King Fahd', ARRAY['tennis']::text[], 24.74478, 46.66312, '+966 55 500 3500', 'http://tennishomeacademy.com/', 5),
  ('Racket Tennis & Padel (King Salman Social Center)', 'ركت تنس', 'King Abdullah', ARRAY['tennis','padel']::text[], 24.75358, 46.73031, '+966 53 033 3963', 'https://racket-tennis.com/', 5),
  ('Al Wadi Sports Park', 'حديقة حي الوادي الرياضية', 'Al Wadi', ARRAY['basketball','football','tennis']::text[], 24.78797, 46.69818, NULL, NULL, 5),
  ('Al Yarmuk Municipal Plaza', 'ساحة اليرموك', 'Al Yarmuk', ARRAY['basketball','football']::text[], 24.80999, 46.77386, NULL, NULL, 5),
  ('Ar Rabwah Basketball Court', 'ملعب كرة السلة بالربوة', 'Ar Rabwah', ARRAY['basketball']::text[], 24.70046, 46.74715, NULL, NULL, 5),
  ('The Cave Climbing (Al Nakheel)', 'ذا كيف للتسلق', 'An Nakheel', ARRAY['climbing']::text[], 24.74614, 46.64328, '+966 50 416 0633', 'http://book.thecaveclimbing.com', 5),
  ('Climb Up Rock Climbing Center', 'كلايم أب للتسلق', 'Al Aarid', ARRAY['climbing']::text[], 24.90271, 46.61074, '+966 55 682 2251', NULL, 5),
  ('Marriott Diplomatic Quarter pool (day pass)', 'مسبح فندق ماريوت حي السفارات', 'Diplomatic Quarter', ARRAY['swimming']::text[], 24.67442, 46.62365, '+966 11 835 3000', 'https://www.marriott.com/en-us/hotels/ruhdq-marriott-riyadh-diplomatic-quarter/overview/', 5),
  ('The Ladies Spa pool, Mandarin Oriental Al Faisaliah', 'مسبح سبا السيدات - ماندارين أورينتال الفيصلية', 'Al Olaya · Women only', ARRAY['swimming']::text[], 24.69016, 46.68505, '+966 11 273 3000', 'https://www.mandarinoriental.com/en/riyadh/olaya/spa', 5),
  ('Riyadh Combat Club (Al Nakheel)', 'نادي رياض كومبات', 'An Nakheel', ARRAY['boxing','mma']::text[], 24.74619, 46.64298, '+966 920006907', 'https://riyadhcombatclub.sa/', 5),
  ('Blue Gloves Gym (Al Rawdah)', 'نادي القفاز الأزرق الرياضي', 'Ar Rawdah', ARRAY['boxing']::text[], 24.72804, 46.76562, '+966 53 986 7053', 'https://blueglovesgym.com/', 5),
  ('The Yoga House Riyadh', 'ذا يوغا هاوس', 'Al Yasmin', ARRAY['yoga']::text[], 24.82608, 46.6185, '+966 53 833 5633', 'https://www.theyogahousesa.com/download-our-app', 5),
  ('Spectrum Wellness for Women (Olaya)', 'سبيكتروم ويلنس للنساء', 'Al Olaya · Women only', ARRAY['yoga','pilates','gym']::text[], 24.70138, 46.67992, '+966 11 216 5522', 'https://www.spectrum4women.com/timetable/', 5),
  ('Sculpto Pilates Reformer Studio', 'سكلبتو بيلاتس', 'An Nakheel', ARRAY['pilates']::text[], 24.73324, 46.61102, '+966 53 809 1090', 'https://sculpto.tamarran.com/', 5),
  ('Al Rawdah Park', 'حديقة الروضة', 'Public park', ARRAY['running','walking','cycling','yoga']::text[], 24.7313, 46.7749, NULL, NULL, 8),
  ('Olaya Park', 'حديقة العليا', 'Public park', ARRAY['running','walking','yoga']::text[], 24.6806, 46.6827, NULL, NULL, 8),
  ('Al Futah Park', 'حديقة الفوطة', 'Public park', ARRAY['running','walking']::text[], 24.6397, 46.7092, NULL, NULL, 8),
  ('King Abdulaziz Historical Center Park', 'حديقة مركز الملك عبدالعزيز التاريخي', 'Public park', ARRAY['running','walking']::text[], 24.6475, 46.7098, NULL, NULL, 8),
  ('Al Aqiq Park', 'حديقة العقيق', 'Public park', ARRAY['running','walking']::text[], 24.7817, 46.6255, NULL, NULL, 8),
  ('Al Muruj Park', 'حديقة المروج', 'Public park', ARRAY['running','walking']::text[], 24.7578, 46.6708, NULL, NULL, 8),
  ('Qurtubah Park', 'حديقة قرطبة', 'Public park', ARRAY['running','walking']::text[], 24.8161, 46.7383, NULL, NULL, 8),
  ('Al Shuhada Park', 'منتزه الشهداء', 'Public park', ARRAY['running','walking','cycling']::text[], 24.7911, 46.7423, NULL, NULL, 8),
  ('King Abdulaziz Park', 'حديقة الملك عبدالعزيز', 'Public park', ARRAY['running','walking','cycling']::text[], 24.8529, 46.6964, NULL, NULL, 8),
  ('Riyadh Marathon Village', 'قرية ماراثون الرياض', 'Public park', ARRAY['running','walking']::text[], 24.7822, 46.61, NULL, NULL, 8),
  ('Al Wurud Park', 'حديقة الورود', 'Public park', ARRAY['running','walking','yoga']::text[], 24.719, 46.6764, NULL, NULL, 8),
  ('Al Suwaidi Park', 'منتزه السويدي', 'Public park', ARRAY['running','walking']::text[], 24.597, 46.695, NULL, NULL, 8),
  ('Al Yarmuk Park', 'حديقة اليرموك', 'Public park', ARRAY['running','walking']::text[], 24.8125, 46.8022, NULL, NULL, 8),
  ('Al Narjis Park', 'حديقة النرجس', 'Public park', ARRAY['running','walking']::text[], 24.8563, 46.6505, NULL, NULL, 8),
  ('Al Waha Park', 'حديقة الواحة', 'Public park', ARRAY['running','walking']::text[], 24.736, 46.7199, NULL, NULL, 8),
  ('Al Rayan Park', 'حديقة الريان', 'Public park', ARRAY['running','walking']::text[], 24.711, 46.7803, NULL, NULL, 8),
  ('World Landmarks Park', 'حديقة المعالم', 'Public park', ARRAY['running','walking']::text[], 24.7623, 46.7358, NULL, NULL, 8),
  ('Al Dawh Park', 'حديقة الدوح', 'Public park', ARRAY['running','walking']::text[], 24.5803, 46.5867, NULL, NULL, 8),
  ('Al Izdihar Park', 'حديقة الازدهار', 'Public park', ARRAY['running','walking']::text[], 24.7715, 46.7157, NULL, NULL, 8),
  ('Al Sahafa Park', 'حديقة الصحافة', 'Public park', ARRAY['running','walking']::text[], 24.8002, 46.6347, NULL, NULL, 8),
  ('Al Hada Park', 'حديقة الهدا', 'Public park', ARRAY['running','walking']::text[], 24.6588, 46.6271, NULL, NULL, 8),
  ('Al Shalal Park', 'حديقة الشلال', 'Public park', ARRAY['running','walking']::text[], 24.6779, 46.8172, NULL, NULL, 8),
  ('Diplomatic Quarter Sports Grounds', 'ملاعب حي السفارات', 'Public park', ARRAY['running','football','basketball','tennis']::text[], 24.6802, 46.6304, NULL, NULL, 8),
  ('King Fahad Library Park', 'حديقة مكتبة الملك فهد', 'Public park', ARRAY['running','walking','yoga']::text[], 24.6862, 46.6879, NULL, NULL, 8)
) AS v(name, name_ar, description, sports, lat, lng, phone, booking_url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM popular_locations p WHERE lower(p.name) = lower(v.name) AND p.city = 'Riyadh');

INSERT INTO popular_locations (name, name_ar, description, sports, image_url, sort_order, city, country, is_active, community_id)
SELECT 'Andorra courts', 'ملاعب أندورا', 'Andorra compound · members only',
       ARRAY['padel','tennis','football','squash','swimming','badminton','table_tennis','volleyball','basketball','boxing','mma','cycling']::text[],
       'https://beast-tribe.vercel.app/places/andorra/padel.jpg', 1, 'Riyadh', 'SA', true, c.id
FROM communities c
WHERE c.id = 'b4fb2a29-3e33-461f-b1cb-ad4fd9277e2f'
  AND NOT EXISTS (SELECT 1 FROM popular_locations p WHERE p.name = 'Andorra courts');
