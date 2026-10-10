import { cache } from 'react';
import { createAdminClient } from '../supabase-server';

// A community's sessions for the leader dashboard: the coming ones and the recent ones,
// with how many are in. Read with the server key after requireTeam() checked the person.

export const LEVELS: Record<string, string> = { easy: 'Beginner', medium: 'Intermediate', hard: 'Advanced' };

export interface TeamSession {
  id: string;
  title: string;
  sport: string;
  startsAt: Date;
  endsAt: Date | null;
  place: string | null;
  capacity: number | null;
  going: number;
  waitlist: number;
  level: string | null;
  price: number | null;
  guestOpen: boolean;
  guestPrice: number | null;
  womenOnly: boolean;
  menOnly: boolean;
  cancelled: boolean;
  seriesId: string | null;
  createdBy: string;
}

const COLUMNS = 'id, title, event_type, starts_at, ends_at, location_name, max_capacity, difficulty, price_sar, guest_open, guest_price_sar, is_women_only, is_men_only, cancelled_at, class_series_id, created_by';

function toSession(e: any, going: number, waitlist: number): TeamSession {
  return {
    id: e.id,
    title: e.title,
    sport: e.event_type,
    startsAt: new Date(e.starts_at),
    endsAt: e.ends_at ? new Date(e.ends_at) : null,
    place: e.location_name,
    capacity: e.max_capacity,
    going,
    waitlist,
    level: e.difficulty,
    price: Number(e.price_sar) > 0 ? Number(e.price_sar) : null,
    guestOpen: !!e.guest_open,
    guestPrice: Number(e.guest_price_sar) > 0 ? Number(e.guest_price_sar) : null,
    womenOnly: !!e.is_women_only,
    menOnly: !!e.is_men_only,
    cancelled: !!e.cancelled_at,
    seriesId: e.class_series_id,
    createdBy: e.created_by,
  };
}

async function counts(ids: string[]) {
  const by = new Map<string, { going: number; waitlist: number }>();
  if (!ids.length) return by;
  const { data } = await createAdminClient().from('event_rsvps').select('event_id, status').in('event_id', ids).in('status', ['going', 'waitlist']).limit(5000);
  for (const r of (data || []) as any[]) {
    const c = by.get(r.event_id) ?? { going: 0, waitlist: 0 };
    if (r.status === 'going') c.going++;
    else c.waitlist++;
    by.set(r.event_id, c);
  }
  return by;
}

/** Sessions from 30 days ago to 60 days ahead, soonest first. */
export const loadTeamSessions = cache(async (communityId: string): Promise<{ upcoming: TeamSession[]; past: TeamSession[] }> => {
  const now = Date.now();
  const { data } = await createAdminClient()
    .from('events')
    .select(COLUMNS)
    .eq('community_id', communityId)
    .gte('starts_at', new Date(now - 30 * 86400000).toISOString())
    .lte('starts_at', new Date(now + 60 * 86400000).toISOString())
    .order('starts_at')
    .limit(400);
  const rows = (data || []) as any[];
  const by = await counts(rows.map((r) => r.id));
  const all = rows.map((r) => toSession(r, by.get(r.id)?.going ?? 0, by.get(r.id)?.waitlist ?? 0));
  return { upcoming: all.filter((s) => s.startsAt.getTime() > now), past: all.filter((s) => s.startsAt.getTime() <= now).reverse() };
});

export interface Player {
  id: string;
  name: string;
  avatar: string | null;
  status: 'going' | 'waitlist';
  came: boolean;
  /** What they owe at the venue and whether it is ticked as paid (leaders only; null for supporters). */
  due: { amount: number; paid: boolean } | null;
}

/** One session of this community with its players, or null if it isn't theirs. */
export async function loadTeamSession(communityId: string, eventId: string, withMoney: boolean): Promise<{ session: TeamSession; players: Player[] } | null> {
  const db = createAdminClient();
  const { data: e } = await db.from('events').select(`${COLUMNS}, community_id`).eq('id', eventId).maybeSingle();
  if (!e || (e as any).community_id !== communityId) return null;
  const [{ data: rs }, { data: ds }] = await Promise.all([
    db.from('event_rsvps').select('user_id, status, attended_at, created_at').eq('event_id', eventId).in('status', ['going', 'waitlist']).order('created_at'),
    withMoney ? db.from('session_dues').select('user_id, amount_sar, paid_at').eq('event_id', eventId) : Promise.resolve({ data: [] as any[] }),
  ]);
  const rsvps = (rs || []) as any[];
  const ids = rsvps.map((r) => r.user_id);
  const { data: ps } = ids.length ? await db.from('profiles').select('id, full_name, display_name, avatar_url').in('id', ids) : { data: [] as any[] };
  const pById = new Map(((ps || []) as any[]).map((p) => [p.id, p]));
  const dById = new Map(((ds || []) as any[]).map((d) => [d.user_id, d]));
  const price = Number((e as any).price_sar) > 0 ? Number((e as any).price_sar) : null;
  const going = rsvps.filter((r) => r.status === 'going').length;
  const players: Player[] = rsvps.map((r) => {
    const p: any = pById.get(r.user_id) || {};
    const d: any = dById.get(r.user_id);
    const amount = d ? Number(d.amount_sar) : price;
    return {
      id: r.user_id,
      name: p.display_name || p.full_name || 'Member',
      avatar: p.avatar_url || null,
      status: r.status,
      came: !!r.attended_at,
      due: withMoney && amount != null && r.status === 'going' ? { amount, paid: !!d?.paid_at } : null,
    };
  });
  return { session: toSession(e, going, rsvps.length - going), players };
}

export const fmtDay = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Riyadh' });
export const fmtTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Riyadh' }).toLowerCase();
export const sar = (n: number) => `${(Math.round(n * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })} SAR`;
