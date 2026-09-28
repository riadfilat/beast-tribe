-- ============================================
-- 033: Every sport the app offers exists in the sports table.
-- Picking Basketball, Tennis, Boxing… during onboarding used to be silently
-- dropped because only 12 of the app's 22 sports existed here.
-- ============================================
INSERT INTO sports (name, emoji, category, is_active)
SELECT v.name, v.emoji, v.category, true
FROM (VALUES
  ('Basketball', '🏀', 'team'),
  ('Tennis', '🎾', 'racket'),
  ('Pickleball', '🏓', 'racket'),
  ('Badminton', '🏸', 'racket'),
  ('Volleyball', '🏐', 'team'),
  ('Boxing', '🥊', 'combat'),
  ('MMA', '🥋', 'combat'),
  ('Hiking', '🥾', 'outdoor'),
  ('Climbing', '🧗', 'outdoor'),
  ('Skate', '🛹', 'outdoor'),
  ('Meditation', '🧘', 'mindfulness')
) AS v(name, emoji, category)
WHERE NOT EXISTS (SELECT 1 FROM sports s WHERE lower(s.name) = lower(v.name));

SELECT count(*) || ' active sports' AS status FROM sports WHERE is_active;
