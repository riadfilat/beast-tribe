import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { CITIES } from './cities';

// Where the member is, only to suggest their city and sort places by distance. The position stays on
// the phone: it is never sent to Beast Tribe. Builds without the location module (or a refused
// permission) simply get null, and the app falls back to the member's profile city.

export interface Position {
  lat: number;
  lng: number;
}

type NativeLocation = {
  getForegroundPermissionsAsync(): Promise<{ granted: boolean; canAskAgain: boolean }>;
  requestForegroundPermissionsAsync(): Promise<{ granted: boolean }>;
  getLastKnownPositionAsync(options: object): Promise<{ coords: { latitude: number; longitude: number } } | null>;
  getCurrentPositionAsync(options: object): Promise<{ coords: { latitude: number; longitude: number } }>;
};

const native = (): NativeLocation | null => (Platform.OS === 'web' ? null : (requireOptionalNativeModule('ExpoLocation') as NativeLocation | null));

const withTimeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))]);

/** The member's position, asking once for permission when `ask` is set. */
export async function currentPosition(ask: boolean): Promise<Position | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator === 'undefined' || !navigator.geolocation) return null;
      return await withTimeout(
        new Promise<Position | null>((resolve) =>
          navigator.geolocation.getCurrentPosition(
            (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
            () => resolve(null),
            { maximumAge: 10 * 60000, timeout: 8000 },
          ),
        ),
        9000,
      );
    }
    const L = native();
    if (!L) return null;
    let perm = await L.getForegroundPermissionsAsync();
    if (!perm.granted && ask && perm.canAskAgain) perm = { ...perm, granted: (await L.requestForegroundPermissionsAsync()).granted };
    if (!perm.granted) return null;
    // A recent fix is enough for a city; fall back to a fresh one at city accuracy (Accuracy.Low = 2).
    const last = await L.getLastKnownPositionAsync({ maxAge: 30 * 60000 });
    const p = last ?? (await withTimeout(L.getCurrentPositionAsync({ accuracy: 2 }), 8000));
    return p ? { lat: p.coords.latitude, lng: p.coords.longitude } : null;
  } catch {
    return null;
  }
}

/** The member's position for this screen (null until known, or when unavailable). */
export function usePosition(ask = true) {
  const [pos, setPos] = useState<Position | null>(null);
  useEffect(() => {
    let alive = true;
    currentPosition(ask).then((p) => alive && setPos(p));
    return () => {
      alive = false;
    };
  }, [ask]);
  return pos;
}

export function distanceKm(a: Position, b: Position) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Centres of the cities the app knows (English names, as in CITIES).
const CENTRES: Record<string, Position> = {
  Riyadh: { lat: 24.7136, lng: 46.6753 }, Jeddah: { lat: 21.4858, lng: 39.1925 }, Dammam: { lat: 26.4207, lng: 50.0888 },
  Khobar: { lat: 26.2172, lng: 50.1971 }, Mecca: { lat: 21.3891, lng: 39.8579 }, Medina: { lat: 24.5247, lng: 39.5692 },
  Dubai: { lat: 25.2048, lng: 55.2708 }, 'Abu Dhabi': { lat: 24.4539, lng: 54.3773 }, Sharjah: { lat: 25.3463, lng: 55.4209 },
  'Al Ain': { lat: 24.1302, lng: 55.8023 }, Manama: { lat: 26.2285, lng: 50.586 }, Riffa: { lat: 26.13, lng: 50.555 },
  Muharraq: { lat: 26.2572, lng: 50.6119 }, 'Kuwait City': { lat: 29.3759, lng: 47.9774 }, Hawalli: { lat: 29.3328, lng: 48.0286 },
  Salmiya: { lat: 29.3339, lng: 48.0758 }, Doha: { lat: 25.2854, lng: 51.531 }, 'Al Wakrah': { lat: 25.1659, lng: 51.5976 },
  'Al Khor': { lat: 25.6839, lng: 51.5058 }, Muscat: { lat: 23.588, lng: 58.3829 }, Salalah: { lat: 17.0151, lng: 54.0924 },
  Sohar: { lat: 24.3643, lng: 56.7468 }, Cairo: { lat: 30.0444, lng: 31.2357 }, Alexandria: { lat: 31.2001, lng: 29.9187 },
  Giza: { lat: 30.0131, lng: 31.2089 }, Amman: { lat: 31.9454, lng: 35.9284 }, Aqaba: { lat: 29.5321, lng: 35.0063 },
  Irbid: { lat: 32.5556, lng: 35.85 },
};

/** The nearest known city (English name) within 80 km, or null. */
export function nearestCity(pos: Position): string | null {
  let best: string | null = null;
  let bestKm = 80;
  for (const list of Object.values(CITIES)) {
    for (const [en] of list) {
      const c = CENTRES[en];
      if (!c) continue;
      const km = distanceKm(pos, c);
      if (km < bestKm) {
        bestKm = km;
        best = en;
      }
    }
  }
  return best;
}
