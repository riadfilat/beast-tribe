-- 094 · One sport list for the website, with the app's own sport ids
--
-- In plain words: the dashboard needs each sport's name and the id the app uses for it
-- ("Table Tennis" → table_tennis). It reads both from here, so the naming rule lives in one place
-- (bt_sport_slug, migration 091) and the website can never spell a sport differently from the app.

CREATE OR REPLACE FUNCTION sport_list() RETURNS TABLE (id UUID, name TEXT, slug TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.name, bt_sport_slug(s.name) FROM sports s ORDER BY s.name
$$;
GRANT EXECUTE ON FUNCTION sport_list() TO anon, authenticated;
