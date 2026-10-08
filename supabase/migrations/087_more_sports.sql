-- 087: popular sports that were missing (user, 2026-10-08): calisthenics, Lagree, spinning,
-- bootcamp (HIIT), barre, dance, Muay Thai, Jiu-Jitsu, golf, diving. Members link sports by name.
INSERT INTO sports (name, emoji, category, popularity_male, popularity_female, is_active)
SELECT v.name, v.emoji, v.cat, 4, 4, true FROM (VALUES
  ('Calisthenics', '🤸', 'fitness'),
  ('Lagree', '🔥', 'fitness'),
  ('Spinning', '🚴', 'fitness'),
  ('Bootcamp', '⏱️', 'fitness'),
  ('Barre', '🩰', 'fitness'),
  ('Dance', '💃', 'fitness'),
  ('Muay Thai', '🥊', 'combat'),
  ('Jiu-Jitsu', '🥋', 'combat'),
  ('Golf', '⛳', 'outdoor'),
  ('Diving', '🤿', 'water')
) AS v(name, emoji, cat)
WHERE NOT EXISTS (SELECT 1 FROM sports s WHERE lower(s.name) = lower(v.name));
