// The places list: which places match the search and filters, and the links that change them.

export interface PlaceRow {
  id: string;
  name: string;
  name_ar: string | null;
  city: string;
  country: string | null;
  description: string | null;
  address: string | null;
  image_url: string | null;
  sports: string[] | null;
  latitude: number | string | null;
  longitude: number | string | null;
  phone: string | null;
  booking_url: string | null;
  is_active: boolean | null;
  community_id: string | null;
}

export interface PlaceFilters {
  q?: string;
  city?: string;
  sport?: string;
  status?: string; // 'shown' | 'hidden' | 'nopin'
  community?: string; // 'global' or a community id
}

const KEYS: (keyof PlaceFilters)[] = ['q', 'city', 'sport', 'status', 'community'];

export const hasPin = (p: PlaceRow) => p.latitude != null && p.longitude != null;

export function filterPlaces(rows: PlaceRow[], f: PlaceFilters): PlaceRow[] {
  const q = (f.q || '').trim().toLowerCase();
  return rows.filter((p) => {
    if (q && ![p.name, p.name_ar, p.city, p.description, p.address].some((t) => (t || '').toLowerCase().includes(q))) return false;
    if (f.city && p.city !== f.city) return false;
    if (f.sport && !(p.sports || []).includes(f.sport)) return false;
    if (f.status === 'shown' && p.is_active === false) return false;
    if (f.status === 'hidden' && p.is_active !== false) return false;
    if (f.status === 'nopin' && hasPin(p)) return false;
    if (f.community === 'global' && p.community_id) return false;
    if (f.community && f.community !== 'global' && p.community_id !== f.community) return false;
    return true;
  });
}

/** The list address with one filter changed ('' clears it); the rest are kept. */
export function hrefWith(f: PlaceFilters, change: Partial<PlaceFilters>): string {
  const next = new URLSearchParams();
  for (const k of KEYS) {
    const v = k in change ? change[k] : f[k];
    if (v) next.set(k, v);
  }
  const qs = next.toString();
  return `/hq/places${qs ? `?${qs}` : ''}`;
}

/** Distinct values, most common first. */
export function byCount(values: string[]): string[] {
  const n = new Map<string, number>();
  for (const v of values) if (v) n.set(v, (n.get(v) || 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([v]) => v);
}
