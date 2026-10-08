import { supabase } from '../lib/supabase';
import { invalidate, useQuery } from './query';
import { PREVIEW } from './preview';
import { useMeId } from './me';

// Routes: a line on the map that a run (or walk, ride, hike) follows. Any host can draw one; the
// routes of a city are shared, most run first. Stored as [lng, lat] points.

export type LngLat = [number, number];
export interface Route {
  id: string;
  name: string;
  city: string | null;
  sport: string;
  path: LngLat[];
  distanceM: number;
  start: LngLat;
  isLoop: boolean;
  runs: number;
  mine: boolean;
}

/** Metres between two points (haversine). */
export function metres(a: LngLat, b: LngLat) {
  const R = 6371000;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a[1] * Math.PI) / 180) * Math.cos((b[1] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function pathLength(path: LngLat[]) {
  let m = 0;
  for (let i = 1; i < path.length; i++) m += metres(path[i - 1], path[i]);
  return Math.round(m);
}

/** "1.2 km" / "800 m" (Arabic: "1.2 كم" / "800 م"). */
export function fmtDistance(m: number, lang: string) {
  if (m >= 1000) return `${(Math.round(m / 100) / 10).toString()} ${lang === 'ar' ? 'كم' : 'km'}`;
  return `${Math.round(m / 10) * 10} ${lang === 'ar' ? 'م' : 'm'}`;
}

function toRoute(r: any): Route {
  const path = (Array.isArray(r.path) ? r.path : []) as LngLat[];
  return {
    id: r.id,
    name: r.name,
    city: r.city ?? null,
    sport: r.sport || 'running',
    path,
    distanceM: r.distance_m ?? pathLength(path),
    start: [Number(r.start_lng), Number(r.start_lat)],
    isLoop: !!r.is_loop,
    runs: Number(r.runs ?? 0),
    mine: !!r.mine,
  };
}

// A loop around Salam Park (Riyadh), for the web preview.
const PREVIEW_ROUTES: Route[] = (() => {
  const c: LngLat = [46.7085, 24.6205];
  const loop: LngLat[] = Array.from({ length: 49 }, (_, i) => {
    const a = (i / 48) * 2 * Math.PI;
    return [c[0] + 0.0016 * Math.cos(a), c[1] + 0.00145 * Math.sin(a)] as LngLat;
  });
  const path: LngLat[] = [[46.7072, 24.6176], ...loop.slice(36), ...loop.slice(0, 37)];
  return [
    { id: 'r-salam', name: 'Salam Park loop', city: 'Riyadh', sport: 'running', path, distanceM: pathLength(path), start: path[0], isLoop: true, runs: 214, mine: false },
  ];
})();

/** Routes in a city for a sport, most run first. */
export function useRoutesNear(city: string | null, sport: string | null) {
  const me = useMeId();
  return useQuery<Route[]>(me && sport ? `routes:near:${(city || '').toLowerCase()}:${sport}` : null, async () => {
    if (PREVIEW) return PREVIEW_ROUTES;
    const { data, error } = await supabase.rpc('routes_near', { p_city: city || null, p_sport: sport });
    if (error) throw error;
    return (data || []).map(toRoute);
  });
}

export function useRoute(id?: string | null) {
  return useQuery<Route | null>(id ? `routes:one:${id}` : null, async () => {
    if (PREVIEW) return PREVIEW_ROUTES.find((r) => r.id === id) ?? PREVIEW_ROUTES[0];
    const { data, error } = await supabase.from('routes').select('id, name, city, sport, path, distance_m, start_lat, start_lng, is_loop').eq('id', id!).maybeSingle();
    if (error) throw error;
    return data ? toRoute(data) : null;
  });
}

/** Save a drawn route; shared with the city unless kept private. */
export async function saveRoute(input: { name: string; city: string | null; sport: string; path: LngLat[]; isPublic: boolean }): Promise<Route> {
  const path = input.path.map(([lng, lat]) => [Math.round(lng * 1e6) / 1e6, Math.round(lat * 1e6) / 1e6] as LngLat);
  const distanceM = pathLength(path);
  const isLoop = path.length > 2 && metres(path[0], path[path.length - 1]) < 60;
  if (PREVIEW) return { id: 'r-new', name: input.name, city: input.city, sport: input.sport, path, distanceM, start: path[0], isLoop, runs: 0, mine: true };
  const { data, error } = await supabase
    .from('routes')
    .insert({
      name: input.name.trim(),
      city: input.city,
      sport: input.sport,
      path,
      distance_m: Math.max(50, distanceM),
      start_lat: path[0][1],
      start_lng: path[0][0],
      is_loop: isLoop,
      is_public: input.isPublic,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select('id, name, city, sport, path, distance_m, start_lat, start_lng, is_loop')
    .single();
  if (error) throw error;
  invalidate('routes:');
  return { ...toRoute(data), mine: true };
}

// The route a host just picked or drew, handed back to the Play form.
import { create } from 'zustand';
export const useRoutePick = create<{ route: Route | null; set: (r: Route | null) => void }>((set) => ({ route: null, set: (route) => set({ route }) }));
