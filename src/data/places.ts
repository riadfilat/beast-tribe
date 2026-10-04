import { useMemo } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { cityKey, cityKeys } from '../lib/cities';
import { Facility, useFacilities } from './facilities';
import { useMySports, usePopularSpots } from './member';

// Where to host: courts and places ranked for this member and the sport they picked.
// 1. Courts of their own communities (only members can see these), e.g. their compound's padel courts.
// 2. Courts they played on lately.
// 3. Courts and public spots for the sport (or, before a sport is picked, for their sports).
// 4. In their city before anywhere else.

export interface Place {
  key: string;
  name: string;
  city: string | null;
  imageUrl: string | null;
  sports: string[];
  lat: number | null;
  lng: number | null;
  /** A court or facility; null for a public spot (park, track, beach). */
  facility: Facility | null;
  /** Why it is shown, for the small line under the name. */
  reason: 'community' | 'used' | 'sport' | 'near' | null;
}

export function useHostPlaces(sport: string | null, lang: string) {
  const { profile } = useAuth();
  const mySports = useMySports().data ?? [];
  const facilities = useFacilities(lang).data ?? [];
  const spots = usePopularSpots(profile?.region || 'SA', lang).data ?? [];
  const sportsKey = mySports.join(',');

  return useMemo(() => {
    const home = new Set(cityKeys(profile?.city));
    const fits = (sports: string[]) => (sport ? sports.includes(sport) : !mySports.length || sports.some((x) => mySports.includes(x as any)));
    const near = (city: string | null) => !!city && home.has(cityKey(city));

    const courts: (Place & { score: number })[] = facilities
      .filter((f) => fits(f.sports))
      .map((f, i) => ({
        key: `f:${f.id}`,
        name: f.name,
        city: f.city,
        imageUrl: f.imageUrl,
        sports: f.sports,
        lat: f.lat,
        lng: f.lng,
        facility: f,
        reason: f.reason === 'community' ? 'community' : f.reason === 'used' ? 'used' : near(f.city) ? 'near' : 'sport',
        // useFacilities already orders by community, use, sport and city; keep that order inside each band.
        score: (f.reason === 'community' ? 1000 : 0) + (f.reason === 'used' ? 400 : 0) + (near(f.city) ? 150 : 0) + (f.bookable ? 20 : 0) - i,
      }));
    const publicSpots: (Place & { score: number })[] = spots
      .filter((x) => fits(x.sports))
      .map((x, i) => ({
        key: `s:${x.id}`,
        name: x.name,
        city: x.city,
        imageUrl: x.imageUrl,
        sports: x.sports,
        lat: x.lat,
        lng: x.lng,
        facility: null,
        reason: near(x.city) ? 'near' : 'sport',
        score: (near(x.city) ? 150 : 0) - i,
      }));

    const community = courts.filter((x) => x.reason === 'community').sort((a, b) => b.score - a.score);
    const more = [...courts.filter((x) => x.reason !== 'community'), ...publicSpots].sort((a, b) => b.score - a.score).slice(0, 12);
    return { community, more };
  }, [facilities, spots, sport, sportsKey, profile?.city]);
}
