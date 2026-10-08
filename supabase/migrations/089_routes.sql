-- 089: running routes. A route is a line on the map (start point, distance) that any host can draw
-- and anyone in that city can reuse; sessions can point to one. Most-run routes come first.

CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 80),
  city text,
  sport text NOT NULL DEFAULT 'running',
  -- [[lng, lat], ...] along the way, at most 2,000 points.
  path jsonb NOT NULL CHECK (jsonb_typeof(path) = 'array' AND jsonb_array_length(path) BETWEEN 2 AND 2000),
  distance_m integer NOT NULL CHECK (distance_m BETWEEN 50 AND 300000),
  start_lat double precision NOT NULL,
  start_lng double precision NOT NULL,
  is_loop boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT true,
  is_hidden boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS routes_city_idx ON routes (lower(city)) WHERE is_public AND NOT is_hidden;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS routes_select ON routes;
CREATE POLICY routes_select ON routes FOR SELECT TO authenticated
  USING ((is_public AND NOT is_hidden) OR created_by = (SELECT auth.uid()) OR (SELECT is_admin()));
DROP POLICY IF EXISTS routes_insert ON routes;
CREATE POLICY routes_insert ON routes FOR INSERT TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));
DROP POLICY IF EXISTS routes_update ON routes;
CREATE POLICY routes_update ON routes FOR UPDATE TO authenticated
  USING (created_by = (SELECT auth.uid()) OR (SELECT is_admin()));
DROP POLICY IF EXISTS routes_delete ON routes;
CREATE POLICY routes_delete ON routes FOR DELETE TO authenticated
  USING (created_by = (SELECT auth.uid()) OR (SELECT is_admin()));

REVOKE ALL ON routes FROM anon, authenticated;
GRANT SELECT ON routes TO authenticated;
GRANT INSERT (name, city, sport, path, distance_m, start_lat, start_lng, is_loop, is_public, created_by) ON routes TO authenticated;
GRANT UPDATE (name, is_public) ON routes TO authenticated;
GRANT DELETE ON routes TO authenticated;

-- Members only hide via staff; the creator is always the caller.
CREATE OR REPLACE FUNCTION public.bt_routes_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
BEGIN
  IF bt_trusted_caller() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
    NEW.is_hidden := false;
  ELSE
    NEW.created_by := OLD.created_by;
    NEW.is_hidden := OLD.is_hidden;
  END IF;
  RETURN NEW;
END $fn$;
DROP TRIGGER IF EXISTS trg_routes_guard ON routes;
CREATE TRIGGER trg_routes_guard BEFORE INSERT OR UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION bt_routes_guard();

ALTER TABLE events ADD COLUMN IF NOT EXISTS route_id uuid REFERENCES routes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS events_route_idx ON events (route_id) WHERE route_id IS NOT NULL;
GRANT SELECT (route_id) ON events TO authenticated;
GRANT INSERT (route_id), UPDATE (route_id) ON events TO authenticated;

-- Routes in a city, most run first (counts every session that used it, visible or not).
CREATE OR REPLACE FUNCTION public.routes_near(p_city text, p_sport text DEFAULT NULL)
RETURNS TABLE (id uuid, name text, city text, sport text, path jsonb, distance_m integer, start_lat double precision, start_lng double precision, is_loop boolean, runs bigint, mine boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $fn$
  SELECT r.id, r.name, r.city, r.sport, r.path, r.distance_m, r.start_lat, r.start_lng, r.is_loop,
         (SELECT count(*) FROM events e WHERE e.route_id = r.id AND e.cancelled_at IS NULL) AS runs,
         r.created_by = auth.uid() AS mine
  FROM routes r
  WHERE ((r.is_public AND NOT r.is_hidden) OR r.created_by = auth.uid())
    AND (p_city IS NULL OR r.city IS NULL OR lower(r.city) = lower(p_city))
    AND (p_sport IS NULL OR r.sport = p_sport OR (p_sport IN ('running', 'walking') AND r.sport IN ('running', 'walking')))
  ORDER BY runs DESC, r.created_at DESC
  LIMIT 50;
$fn$;
REVOKE ALL ON FUNCTION public.routes_near(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.routes_near(text, text) TO authenticated;
