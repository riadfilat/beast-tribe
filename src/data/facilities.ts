import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useQuery, invalidate, CATALOGUE } from './query';
import { PREVIEW } from './preview';
import { cityKey, cityKeys } from '../lib/cities';
import { sportIdOf } from '../lib/sports';
import { useMySports } from './member';
import { CodedError, codeFrom } from './errors';
import { localDateKey } from '../i18n/format';

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
  /** Every sport it takes (a multi-use court lists several; the booker picks one). */
  sports: string[];
  /** A half court's full court. */
  parentId: string | null;
  /** False for a pool used for classes: shown, not booked. */
  bookable: boolean;
  /** House rule: bookings a day per member on this venue's courts of this sport. */
  dailyLimit: number | null;
  communityName: string | null;
  /** Why it's recommended (set by useFacilities). */
  reason?: 'community' | 'used' | 'sport' | 'near' | null;
}

export interface Slot {
  startsAt: Date;
  endsAt: Date;
  free: boolean;
}

const BOOK_CODES = ['DAILY_LIMIT', 'TAKEN', 'TOO_MANY', 'WOMEN_ONLY', 'COMMUNITY_ONLY', 'PACK_ONLY', 'NOT_FOUND'] as const;
export type BookErrorCode = (typeof BOOK_CODES)[number] | 'generic';
export class BookError extends CodedError<BookErrorCode> {}

const SELECT =
  'id, name, name_ar, kind, sport, city, address, image_url, description, description_ar, price_sar, slot_minutes, max_players, audience, community_id, cancel_hours, is_school, latitude, longitude, hours, sports, parent_id, bookable, daily_limit, sort, partner:partners(business_name, name), community:communities(name)';

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
    sports: (r.sports?.length ? r.sports : [r.sport]).map((x: string) => sportIdOf(x)),
    parentId: r.parent_id ?? null,
    bookable: r.bookable !== false,
    dailyLimit: r.daily_limit ?? null,
    communityName: r.community?.name ?? null,
  };
}

/**
 * Facilities the member can book, best first: their own community's courts (private ones only
 * members see), then the courts they use most, then courts for their sports, then their city.
 */
export function useFacilities(lang: string) {
  const { user, profile } = useAuth();
  const sports = useMySports().data ?? [];
  return useQuery<Facility[]>(!PREVIEW && user ? `facilities:list:${lang}:${sports.join(',')}` : null, async () => {
    const [{ data, error }, { data: played }] = await Promise.all([
      supabase.from('facilities').select(SELECT).eq('is_active', true).order('sort').order('name').limit(300),
      supabase
        .from('event_rsvps')
        .select('event:events!inner(facility_id, starts_at)')
        .eq('user_id', user!.id)
        .eq('status', 'going')
        .not('event.facility_id', 'is', null)
        .gte('event.starts_at', new Date(Date.now() - 120 * 86400000).toISOString())
        .limit(300),
    ]);
    if (error) throw error;
    const used = new Map<string, number>();
    (played || []).forEach((r: any) => r.event?.facility_id && used.set(r.event.facility_id, (used.get(r.event.facility_id) ?? 0) + 1));
    const mine = new Set(cityKeys(profile?.city));
    const scored = (data || []).map((r) => {
      const f = toFacility(r, lang);
      const uses = used.get(f.id) ?? 0;
      const forMe = f.sports.some((x) => sports.includes(x as any));
      const near = mine.has(cityKey(f.city));
      f.reason = f.audience === 'community' ? 'community' : uses ? 'used' : forMe ? 'sport' : near ? 'near' : null;
      const score = (f.audience === 'community' ? 100 : 0) + Math.min(uses, 4) * 10 + (forMe ? 30 : 0) + (near ? 15 : 0);
      return { f, score, sort: (r as any).sort ?? 0 };
    });
    return scored.sort((a, b) => b.score - a.score || a.sort - b.sort || a.f.name.localeCompare(b.f.name)).map((x) => x.f);
  }, CATALOGUE);
}

export function useFacility(id: string | undefined, lang: string) {
  const { user } = useAuth();
  return useQuery<Facility | null>(!PREVIEW && user && id ? `facilities:one:${id}:${lang}` : null, async () => {
    const { data, error } = await supabase.from('facilities').select(SELECT).eq('id', id!).maybeSingle();
    if (error) throw error;
    return data ? toFacility(data, lang) : null;
  }, CATALOGUE);
}

/** YYYY-MM-DD for a local calendar day. */
export const dayKey = localDateKey;

export function useFacilitySlots(id: string | undefined, day: string) {
  const { user } = useAuth();
  return useQuery<Slot[]>(!PREVIEW && user && id ? `facilities:slots:${id}:${day}` : null, async () => {
    const { data, error } = await supabase.rpc('facility_slots', { p_facility: id, p_day: day });
    if (error) throw error;
    return ((data as any[]) || []).map((r) => ({ startsAt: new Date(r.starts_at), endsAt: new Date(r.ends_at), free: !!r.free }));
  });
}

/** Book a slot: holds the court and puts the session on the board. Returns the session id. */
export async function bookFacility(input: { facilityId: string; startsAt: Date; players: number; title: string; communityId: string | null; packId: string | null; sport?: string | null }): Promise<string> {
  const { data, error } = await supabase.rpc('book_facility', {
    p_facility: input.facilityId,
    p_starts_at: input.startsAt.toISOString(),
    p_players: input.players,
    p_title: input.title,
    p_community: input.communityId,
    p_pack: input.packId,
    p_sport: input.sport ?? null,
  });
  if (error) {
    throw new BookError(codeFrom(error, BOOK_CODES));
  }
  invalidate('facilities:slots:');
  invalidate('sessions:');
  return data as string;
}
