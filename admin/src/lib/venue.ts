import { createAdminClient } from './supabase-server';

// Courts, pitches, halls and school facilities a partner lists, and what was booked on them.
// Money here is what players owe the venue. Beast Tribe takes nothing from it.

export const FACILITY_KINDS: Record<string, string> = { court: 'Court', pitch: 'Pitch', hall: 'Hall', pool: 'Pool', studio: 'Studio', track: 'Track' };
export const AUDIENCES: Record<string, string> = { everyone: 'Everyone', women: 'Women only', community: 'Our members only' };
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const SLOT_MINUTES = [30, 45, 60, 90, 120];

export interface Facility {
  id: string;
  name: string;
  name_ar: string | null;
  kind: string;
  sport: string;
  city: string | null;
  address: string | null;
  image_url: string | null;
  description: string | null;
  description_ar: string | null;
  price_sar: number;
  slot_minutes: number;
  max_players: number;
  hours: Record<string, [string, string][]>;
  audience: string;
  community_id: string | null;
  notice_hours: number;
  cancel_hours: number;
  is_school: boolean;
  is_active: boolean;
  sports: string[];
  parent_id: string | null;
  bookable: boolean;
  daily_limit: number | null;
}

export interface BookingPlayer {
  id: string;
  name: string;
  avatar: string | null;
  amount: number;
  paid: boolean;
  booker: boolean;
}

export interface Booking {
  id: string;
  eventId: string | null;
  facilityId: string;
  facility: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  price: number;
  players: number;
  share: number;
  cancelled: boolean;
  booker: string;
  people: BookingPlayer[];
  paid: number;
}

export interface Income {
  guestBookings: number;
  guestDue: number;
  guestPaid: number;
  courtBookings: number;
  courtDue: number;
  courtPaid: number;
}

export const money = (n: number) => `SAR ${(Math.round(n * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

export function hoursLine(hours: Facility['hours']): string {
  const open = DAYS.map((d, i) => ({ d: d.slice(0, 3), w: hours?.[String(i)]?.[0] })).filter((x) => x.w);
  if (!open.length) return 'No opening hours yet';
  const same = open.every((x) => x.w![0] === open[0].w![0] && x.w![1] === open[0].w![1]);
  if (same && open.length === 7) return `Every day ${open[0].w![0]}–${open[0].w![1]}`;
  if (same) return `${open.map((x) => x.d).join(', ')} ${open[0].w![0]}–${open[0].w![1]}`;
  return open.map((x) => `${x.d} ${x.w![0]}–${x.w![1]}`).join(' · ');
}

export async function loadFacilities(partnerId: string): Promise<Facility[]> {
  const db = createAdminClient();
  const { data } = await db.from('facilities').select('*').eq('partner_id', partnerId).order('created_at');
  return ((data || []) as any[]).map((f) => ({ ...f, price_sar: Number(f.price_sar), hours: f.hours || {} }));
}

/** Bookings on a partner's facilities from `from` on (default: the last 30 days), soonest first. */
export async function loadBookings(partnerId: string, from?: Date): Promise<Booking[]> {
  const db = createAdminClient();
  const { data: fs } = await db.from('facilities').select('id, name').eq('partner_id', partnerId);
  const facilities = (fs || []) as any[];
  if (!facilities.length) return [];
  const nameOf = new Map(facilities.map((f) => [f.id, f.name]));
  const since = (from || new Date(Date.now() - 30 * 86400000)).toISOString();
  const { data: bs } = await db
    .from('facility_bookings')
    .select('id, facility_id, event_id, booked_by, starts_at, ends_at, price_sar, players, status')
    .in('facility_id', facilities.map((f) => f.id))
    .gte('starts_at', since)
    .order('starts_at')
    .limit(500);
  const bookings = (bs || []) as any[];
  const eventIds = bookings.map((b) => b.event_id).filter(Boolean);
  if (!bookings.length) return [];

  const [{ data: evs }, { data: rs }, { data: ds }] = await Promise.all([
    eventIds.length ? db.from('events').select('id, title, share_sar').in('id', eventIds) : Promise.resolve({ data: [] as any[] }),
    eventIds.length ? db.from('event_rsvps').select('event_id, user_id, created_at').in('event_id', eventIds).eq('status', 'going').order('created_at') : Promise.resolve({ data: [] as any[] }),
    eventIds.length ? db.from('session_dues').select('event_id, user_id, amount_sar, paid_at').in('event_id', eventIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const userIds = [...new Set([...bookings.map((b) => b.booked_by), ...((rs || []) as any[]).map((r) => r.user_id)])];
  const { data: ps } = userIds.length ? await db.from('profiles').select('id, full_name, display_name, avatar_url').in('id', userIds) : { data: [] as any[] };
  const pById = new Map(((ps || []) as any[]).map((p) => [p.id, p]));
  const who = (id: string) => {
    const p: any = pById.get(id) || {};
    return { name: p.display_name || p.full_name || 'Member', avatar: p.avatar_url || null };
  };
  const evById = new Map(((evs || []) as any[]).map((e) => [e.id, e]));

  return bookings.map((b) => {
    const ev: any = evById.get(b.event_id) || {};
    const share = ev.share_sar != null ? Number(ev.share_sar) : Math.round((Number(b.price_sar) / Math.max(1, b.players)) * 100) / 100;
    const dues = ((ds || []) as any[]).filter((d) => d.event_id === b.event_id);
    const people: BookingPlayer[] = ((rs || []) as any[])
      .filter((r) => r.event_id === b.event_id)
      .map((r) => {
        const d = dues.find((x) => x.user_id === r.user_id);
        return { id: r.user_id, ...who(r.user_id), amount: d ? Number(d.amount_sar) : share, paid: !!d?.paid_at, booker: r.user_id === b.booked_by };
      });
    return {
      id: b.id,
      eventId: b.event_id,
      facilityId: b.facility_id,
      facility: nameOf.get(b.facility_id) || 'Facility',
      title: ev.title || nameOf.get(b.facility_id) || 'Booking',
      startsAt: new Date(b.starts_at),
      endsAt: new Date(b.ends_at),
      price: Number(b.price_sar),
      players: b.players,
      share,
      cancelled: b.status !== 'confirmed',
      booker: who(b.booked_by).name,
      people,
      paid: Math.min(Number(b.price_sar), people.filter((p) => p.paid).reduce((t, p) => t + p.amount, 0)),
    };
  });
}

/** Guest-class and court income between two Riyadh dates (inclusive). */
export async function loadIncome(partnerId: string, from: string, to: string): Promise<Income> {
  const db = createAdminClient();
  const { data } = await db.rpc('partner_income', { p_partner: partnerId, p_from: from, p_to: to });
  const r: any = Array.isArray(data) ? data[0] || {} : data || {};
  return {
    guestBookings: r.guest_bookings || 0,
    guestDue: Number(r.guest_due || 0),
    guestPaid: Number(r.guest_paid || 0),
    courtBookings: r.court_bookings || 0,
    courtDue: Number(r.court_due || 0),
    courtPaid: Number(r.court_paid || 0),
  };
}
