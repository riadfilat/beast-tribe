import { useMemo } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { cityKey, cityKeys } from '../lib/cities';
import { Facility, useFacilities } from './facilities';
import { distanceKm, type Position } from '../lib/location';
import { useMySports, usePopularSpots } from './member';
import { ROUTE_SPORTS } from '../lib/sports';

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
  /** Kilometres from the member, when their position is known. */
  km: number | null;
  /** A venue booked outside the app: its phone and booking page. */
  phone?: string | null;
  bookingUrl?: string | null;
}

export function useHostPlaces(sport: string | null, lang: string, pos: Position | null = null, city: string | null = null) {
  const { profile } = useAuth();
  const mySports = useMySports().data ?? [];
  const facilities = useFacilities(lang).data ?? [];
  const spots = usePopularSpots(profile?.region || 'SA', lang).data ?? [];
  const sportsKey = mySports.join(',');

  const routeSport = !!sport && (ROUTE_SPORTS as string[]).includes(sport);
  return useMemo(() => {
    // The chosen city decides what's listed (the member's own city until they pick another).
    const home = new Set(cityKeys(city || profile?.city));
    const fits = (sports: string[]) => (sport ? sports.includes(sport) : !mySports.length || sports.some((x) => mySports.includes(x as any)));
    const near = (city: string | null) => !!city && home.has(cityKey(city));
    const kmOf = (lat: number | null, lng: number | null) => (pos && lat != null && lng != null ? distanceKm(pos, { lat, lng }) : null);
    // With a position: closer is better (up to 200 points within a few km, nothing past 50 km).
    const closeness = (km: number | null) => (km == null ? 0 : Math.max(0, 200 - km * 4));

    // Only places in that city, and only ones with a photo; my own community's courts always show.
    const inCity = (c: string | null, lat: number | null, lng: number | null) => (home.size ? near(c) : (kmOf(lat, lng) ?? Infinity) <= 50);
    const courts: (Place & { score: number })[] = facilities
      .filter((f) => fits(f.sports))
      .filter((f) => f.reason === 'community' || (!!f.imageUrl && inCity(f.city, f.lat, f.lng)))
      .map((f, i) => ({
        key: `f:${f.id}`,
        name: f.name,
        city: f.city,
        imageUrl: f.imageUrl,
        sports: f.sports,
        lat: f.lat,
        lng: f.lng,
        facility: f,
        km: kmOf(f.lat, f.lng),
        reason: f.reason === 'community' ? 'community' : f.reason === 'used' ? 'used' : near(f.city) ? 'near' : 'sport',
        // useFacilities already orders by community, use, sport and city; keep that order inside each band.
        score: (f.reason === 'community' ? 1000 : 0) + (f.reason === 'used' ? 400 : 0) + (near(f.city) ? 150 : 0) + (f.bookable ? 20 : 0) + closeness(kmOf(f.lat, f.lng)) - i,
      }));
    const publicSpots: (Place & { score: number })[] = spots
      .filter((x) => fits(x.sports))
      // A photo, or for runs and rides a spot on the map (the track is drawn there).
      .filter((x) => (!!x.imageUrl || (routeSport && x.lat != null)) && inCity(x.city, x.lat, x.lng))
      .map((x, i) => ({
        key: `s:${x.id}`,
        name: x.name,
        city: x.city,
        imageUrl: x.imageUrl,
        sports: x.sports,
        lat: x.lat,
        lng: x.lng,
        facility: null,
        phone: x.phone ?? null,
        bookingUrl: x.bookingUrl ?? null,
        km: kmOf(x.lat, x.lng),
        reason: near(x.city) ? 'near' : 'sport',
        score: (near(x.city) ? 150 : 0) + closeness(kmOf(x.lat, x.lng)) - i,
      }));

    const community = courts.filter((x) => x.reason === 'community').sort((a, b) => b.score - a.score);
    const more = [...courts.filter((x) => x.reason !== 'community'), ...publicSpots].sort((a, b) => b.score - a.score).slice(0, 12);
    return { community, more };
  }, [facilities, spots, sport, sportsKey, city, profile?.city, pos?.lat, pos?.lng]);
}
