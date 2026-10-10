-- 091 · Sport names match the app
--
-- In plain words: the database turned "Table Tennis" into "table tennis", but the app calls the
-- sport "table_tennis". They never matched, so Table Tennis, Horse Riding, Muay Thai and
-- Jiu-Jitsu sessions never called players and partner matching skipped those sports.
-- Now spaces and hyphens become "_", exactly like the app's sport ids.
-- Nothing stored needs rewriting (checked 2026-10-10: no saved sport text has a space or hyphen).

CREATE OR REPLACE FUNCTION bt_sport_slug(p_name TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE lower(trim(p_name))
    WHEN 'skate' THEN 'skateboarding'
    WHEN 'group fitness' THEN 'community'
    ELSE regexp_replace(lower(trim(p_name)), '[\s-]+', '_', 'g')
  END
$$;
