-- Leejam Fitness (Olaya) showed a stock gym photo that is not Leejam. Clear it, so the app shows
-- the gym art like every other place without a photo of its own, until Leejam sends a real one.
update popular_locations
   set image_url = null
 where name = 'Leejam Fitness — Olaya'
   and image_url = 'https://beast-tribe.vercel.app/places/spots/gym.jpg';
