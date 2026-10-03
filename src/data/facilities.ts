import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useQuery, invalidate } from './query';
import { PREVIEW } from './preview';
import { cityKey, cityKeys } from '../lib/cities';
import { sportIdOf } from '../lib/sports';

// Courts, pitches, halls and school facilities that venues list for booking (migration 060).
// Booking a free slot creates a session and holds the court; the price is split per player.

export interface Facility {
  id: string;
  name: string;
  kind: 'court' | 'pitch' | 'hall' | 'pool' | 'studio' | 'track';
  sport: string;
  city: string | null;
  address: string | null;
  imageUrl: string | null;
  description: string | null;
  price: number;
  slotMinutes: number;
  maxPlayers: number;
  audience: 'everyone' | 'women' | 'community';
  communityId: string | null;
  cancelHours: number;
  isSchool: boolean;
  venue: string;
  lat: number | null;
  lng: number | null;
  /** Weekdays (0 = Sunday) it opens at all. */
  openDays: number[];
}

export interface Slot {
  startsAt: Date;
  endsAt: Date;
  free: boolean;
}

export type BookErrorCode = 'TAKEN' | 'TOO_MANY' | 'WOMEN_ONLY' | 'COMMUNITY_ONLY' | 'PACK_ONLY' | 'NOT_FOUND' | 'generic';
export class BookError extends Error {
  code: BookErrorCode;
  constructor(code: BookErrorCode) {
    super(code);
    this.code = code;
  }
}

const SELECT =
  'id, name, name_ar, kind, sport, city, address, image_url, description, description_ar, price_sar, slot_minutes, max_players, audience, community_id, cancel_hours, is_school, latitude, longitude, hours, partner:partners(business_name, name)';

function toFacility(r: any, lang: string): Facility {
  return {
    id: r.id,
    name: (lang === 'ar' && r.name_ar) || r.name,
    kind: r.kind,
    sport: sportIdOf(r.sport),
    city: r.city ?? null,
    address: r.address ?? null,
    imageUrl: r.image_url ?? null,
    description: (lang === 'ar' && r.description_ar) || r.description || null,
    price: Number(r.price_sar) || 0,
    slotMinutes: r.slot_minutes,
    maxPlayers: r.max_players,
    audience: r.audience,
    communityId: r.community_id ?? null,
    cancelHours: r.cancel_hours,
    isSchool: !!r.is_school,
    venue: r.partner?.business_name || r.partner?.name || '',
    lat: r.latitude != null ? Number(r.latitude) : null,
    lng: r.longitude != null ? Number(r.longitude) : null,
    openDays: Object.keys(r.hours || {})
      .filter((d) => Array.isArray(r.hours[d]) && r.hours[d].length)
      .map(Number),
  };
}

/** Facilities the member can book, their own city first. */
export function useFacilities(lang: string) {
  const { user, profile } = useAuth();
  return useQuery<Facility[]>(!PREVIEW && user ? `facilities:list:${lang}` : null, async () => {
    const { data, error } = await supabase.from('facilities').select(SELECT).eq('is_active', true).order('name').limit(200);
    if (error) throw error;
    const mine = new Set(cityKeys(profile?.city));
    return (data || [])
      .map((r) => toFacility(r, lang))
      .sort((a, b) => Number(mine.has(cityKey(b.city))) - Number(mine.has(cityKey(a.city))) || a.name.localeCompare(b.name));
  });
}

export function useFacility(id: string | undefined, lang: string) {
  const { user } = useAuth();
  return useQuery<Facility | null>(!PREVIEW && user && id ? `facilities:one:${id}:${lang}` : null, async () => {
    const { data, error } = await supabase.from('facilities').select(SELECT).eq('id', id!).maybeSingle();
    if (error) throw error;
    return data ? toFacility(data, lang) : null;
  });
}

/** YYYY-MM-DD for a local calendar day. */
export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function useFacilitySlots(id: string | undefined, day: string) {
  const { user } = useAuth();
  return useQuery<Slot[]>(!PREVIEW && user && id ? `facilities:slots:${id}:${day}` : null, async () => {
    const { data, error } = await supabase.rpc('facility_slots', { p_facility: id, p_day: day });
    if (error) throw error;
    return ((data as any[]) || []).map((r) => ({ startsAt: new Date(r.starts_at), endsAt: new Date(r.ends_at), free: !!r.free }));
  });
}

/** Book a slot: holds the court and puts the session on the board. Returns the session id. */
export async function bookFacility(input: { facilityId: string; startsAt: Date; players: number; title: string; communityId: string | null; packId: string | null }): Promise<string> {
  const { data, error } = await supabase.rpc('book_facility', {
    p_facility: input.facilityId,
    p_starts_at: input.startsAt.toISOString(),
    p_players: input.players,
    p_title: input.title,
    p_community: input.communityId,
    p_pack: input.packId,
  });
  if (error) {
    const hit = String(error.message || '').match(/TAKEN|TOO_MANY|WOMEN_ONLY|COMMUNITY_ONLY|PACK_ONLY|NOT_FOUND/);
    throw new BookError((hit?.[0] as BookErrorCode) || 'generic');
  }
  invalidate('facilities:slots:');
  invalidate('sessions:');
  return data as string;
}
