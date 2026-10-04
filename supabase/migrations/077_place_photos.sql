-- 077 — Real photos for the popular places (user, 2026-10-04: several showed the wrong thing — a gym
-- for a park, a yoga silhouette for the corniche, Wadi Rum for Wadi Hanifah, a workout for the
-- Boulevard). Files and credits: admin/public/places/spots/ (CREDITS.md); credited in the app's Settings.
BEGIN;
UPDATE popular_locations SET image_url = 'https://beast-tribe.vercel.app/places/spots/kite-beach.jpg' WHERE id = '4d27e5a6-db95-43cb-aa41-acb1f52dcab4';
UPDATE popular_locations SET image_url = 'https://beast-tribe.vercel.app/places/spots/wadi-hanifah.jpg' WHERE id = '408a6310-bd68-4fa0-97d7-ce2d3e139f9b';
UPDATE popular_locations SET image_url = 'https://beast-tribe.vercel.app/places/spots/jeddah-corniche.jpg' WHERE id = 'f70b2c4a-1432-4b7a-ac1d-27b57065d2ea';
UPDATE popular_locations SET image_url = 'https://beast-tribe.vercel.app/places/spots/gym.jpg' WHERE id = 'b961eeae-1487-4e4d-a7c4-9557e6a289cd';
-- No real photo of "King Fahd Park" in Riyadh could be found (the ones that exist are in Medina,
-- Hofuf and Samtah): the spot becomes Salam Park, a real central-Riyadh park with walking paths.
UPDATE popular_locations SET name = 'Salam Park', name_ar = 'حديقة السلام', image_url = 'https://beast-tribe.vercel.app/places/spots/salam-park.jpg'
WHERE id = '3fa58b5a-7abe-4eac-af81-ee2e161a2d90';
-- The Boulevard's only free photos are covered in brand billboards: no photo until a clean one comes.
UPDATE popular_locations SET image_url = NULL WHERE id = '4505b560-31a2-444b-9183-a51346b4c3e1';
COMMIT;
