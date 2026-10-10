import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase-server';
import { searchTerm } from '@/lib/search';
import type { SportOption } from '@/lib/events';

// What the HQ Sessions pages read. Server key, after requireRole('admin') checked the person.

export const PER_PAGE = 25;
export type When = 'upcoming' | 'today' | 'week' | 'past' | 'all';
export const WHENS: { key: When; label: string }[] = [
  { key: 'upcoming', label: 'Coming up' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Next 7 days' },
  { key: 'past', label: 'Past' },
  { key: 'all', label: 'All' },
];

export interface Filters { q: string; when: When; day: string | null; city: string | null; sport: string | null; community: string | null; page: number }

export interface ListRow {
  id: string;
  title: string;
  sport: string;
  startsAt: Date;
  place: string | null;
  city: string | null;
  coach: string | null;
  community: string | null;
  inGroup: boolean;
  capacity: number | null;
  going: number;
  womenOnly: boolean;
  menOnly: boolean;
  cancelled: boolean;
}

/** Every sport (the same list as the app), as id, name and slug. */
export const loadSportList = cache(async (): Promise<SportOption[]> => {
  const { data } = await createAdminClient().rpc('sport_list');
  return ((data || []) as any[]).map((s) => ({ id: s.id, name: s.name, slug: s.slug }));
});

/** The open Beast Tribe community (the default) and the others, for pickers. */
export const loadCommunityList = cache(async () => {
  const { data } = await createAdminClient().from('communities').select('id, name, is_default').eq('is_active', true).order('name');
  const rows = (data || []) as { id: string; name: string; is_default: boolean }[];
  return { open: rows.find((c) => c.is_default) ?? null, others: rows.filter((c) => !c.is_default).map(({ id, name }) => ({ id, name })) };
});

/** Cities that have sessions, by their matching key (Riyadh = RIyadh = riyadh). */
export const loadSessionCities = cache(async () => {
  const { data } = await createAdminClient().from('events').select('location_city, city_key').not('city_key', 'is', null).limit(5000);
  const byKey = new Map<string, string>();
  for (const r of (data || []) as any[]) if (!byKey.has(r.city_key)) byKey.set(r.city_key, r.location_city || r.city_key);
  return Array.from(byKey, ([key, name]) => ({ key, name })).sort((a, b) => a.name.localeCompare(b.name));
});

export const riyadhDay = (offsetDays = 0) => new Date(Date.now() + 3 * 3600000 + offsetDays * 86400000).toISOString().slice(0, 10);
const dayStart = (day: string) => new Date(`${day}T00:00:00+03:00`).toISOString();
const dayEnd = (day: string) => new Date(new Date(`${day}T00:00:00+03:00`).getTime() + 86400000).toISOString();

export async function loadSessionList(f: Filters): Promise<{ rows: ListRow[]; count: number }> {
  const now = new Date().toISOString();
  const from = (f.page - 1) * PER_PAGE;
  let q = createAdminClient()
    .from('events')
    .select('id, title, event_type, starts_at, location_name, location_city, coach_name, gym_name, max_capacity, going_count, is_women_only, is_men_only, cancelled_at, visibility, community:communities(name)', { count: 'exact' });

  let ascending = true;
  if (f.day) q = q.gte('starts_at', dayStart(f.day)).lt('starts_at', dayEnd(f.day));
  else if (f.when === 'upcoming') q = q.gte('starts_at', now);
  else if (f.when === 'today') q = q.gte('starts_at', dayStart(riyadhDay())).lt('starts_at', dayEnd(riyadhDay()));
  else if (f.when === 'week') q = q.gte('starts_at', now).lt('starts_at', new Date(Date.now() + 7 * 86400000).toISOString());
  else {
    ascending = false;
    if (f.when === 'past') q = q.lt('starts_at', now);
  }

  const term = searchTerm(f.q);
  if (term) q = q.or(`title.ilike.%${term}%,coach_name.ilike.%${term}%,gym_name.ilike.%${term}%,location_name.ilike.%${term}%`);
  if (f.city) q = q.eq('city_key', f.city);
  if (f.sport) q = q.eq('event_type', f.sport);
  if (f.community) q = q.eq('community_id', f.community);

  const { data, count } = await q.order('starts_at', { ascending }).range(from, from + PER_PAGE - 1);
  const rows = ((data || []) as any[]).map((e) => ({
    id: e.id,
    title: e.title,
    sport: e.event_type,
    startsAt: new Date(e.starts_at),
    place: e.location_name || e.gym_name || null,
    city: e.location_city,
    coach: e.coach_name,
    community: e.community?.name ?? null,
    inGroup: e.visibility === 'pack',
    capacity: e.max_capacity,
    going: e.going_count ?? 0,
    womenOnly: !!e.is_women_only,
    menOnly: !!e.is_men_only,
    cancelled: !!e.cancelled_at,
  }));
  return { rows, count: count ?? 0 };
}

/** Quick numbers for the top of the list. */
export async function loadSessionCounts() {
  const db = createAdminClient();
  const now = Date.now();
  const [today, week, cancelled] = await Promise.all([
    db.from('events').select('id', { count: 'exact', head: true }).is('cancelled_at', null).gte('starts_at', dayStart(riyadhDay())).lt('starts_at', dayEnd(riyadhDay())),
    db.from('events').select('going_count').is('cancelled_at', null).gte('starts_at', new Date(now).toISOString()).lt('starts_at', new Date(now + 7 * 86400000).toISOString()).limit(2000),
    db.from('events').select('id', { count: 'exact', head: true }).gte('cancelled_at', new Date(now - 30 * 86400000).toISOString()),
  ]);
  const weekRows = (week.data || []) as { going_count: number | null }[];
  return {
    today: today.count ?? 0,
    week: weekRows.length,
    playersWeek: weekRows.reduce((t, r) => t + (r.going_count ?? 0), 0),
    emptyWeek: weekRows.filter((r) => !r.going_count).length,
    cancelled30: cancelled.count ?? 0,
  };
}

export interface Player { id: string; name: string; status: string; came: boolean; joined: Date }

/** One session (the whole row) with everyone who booked, or null. */
export async function loadSession(id: string): Promise<{ event: any; community: string | null; creator: string | null; players: Player[] } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = createAdminClient();
  const { data: e } = await db.from('events').select('*, community:communities(name)').eq('id', id).maybeSingle();
  if (!e) return null;
  const { data: rs } = await db.from('event_rsvps').select('user_id, status, attended_at, created_at').eq('event_id', id).order('created_at');
  const rsvps = (rs || []) as any[];
  const ids = Array.from(new Set([...rsvps.map((r) => r.user_id), (e as any).created_by].filter(Boolean)));
  const { data: ps } = ids.length ? await db.from('profiles').select('id, full_name, display_name').in('id', ids) : { data: [] as any[] };
  const name = new Map(((ps || []) as any[]).map((p) => [p.id, p.display_name || p.full_name || 'Member']));
  return {
    event: e,
    community: (e as any).community?.name ?? null,
    creator: (e as any).created_by ? name.get((e as any).created_by) ?? null : null,
    players: rsvps.map((r) => ({ id: r.user_id, name: name.get(r.user_id) ?? 'Member', status: r.status, came: !!r.attended_at, joined: new Date(r.created_at) })),
  };
}
