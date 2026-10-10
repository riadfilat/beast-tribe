import { cache } from 'react';
import { userSupabase } from '../auth';

// The command center's numbers (migration 096). Every call goes with the admin's own sign-in, so the
// database itself refuses anyone who isn't HQ (bt_require_hq).

async function call<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await (await userSupabase()).rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export interface Live {
  active_today: number;
  active_week: number;
  active_prev_week: number;
  sessions_today: number;
  live_now: number;
  players_today: number;
  new_members_week: number;
  new_members_prev_week: number;
  members: number;
  communities: number;
  requests_waiting: number;
}
export interface Day {
  day: string;
  sessions: number;
  players: number;
  blocks: number[];
}
export interface DaySession {
  id: string;
  title: string;
  sport: string;
  hour: number;
  minutes: number;
  going: number;
  capacity: number | null;
  community: string | null;
  city: string | null;
}
export interface CityRow {
  city: string;
  members: number;
  active: number;
  live: number;
}
export interface CommunityRow {
  id: string;
  name: string;
  kind: string | null;
  city: string | null;
  leaders: string[];
  supporters: number;
  members: number;
  sessions_week: number;
  upcoming_week: number;
  fill: number | null;
  weekly: number[];
  recent: number;
  before: number;
  features: string[];
}
export interface Attention {
  courts_unbooked: { id: string; title: string; starts_at: string; community: string | null }[];
  empty_soon: { id: string; title: string; starts_at: string; community: string | null }[];
  requests: number;
  reports: number;
  photos: number;
  slowing: { id: string; name: string; recent: number; before: number }[];
}
export interface Mix {
  sports: { sport: string; players: number }[];
  platforms: Record<string, number>;
  languages: Record<string, number>;
  growth: number[];
}

export const loadLive = cache((city: string | null) => call<Live>('hq_live', { p_city: city }));
export const loadDays = cache((city: string | null) => call<Day[]>('hq_days', { p_city: city }));
export const loadDaySessions = cache((day: string, city: string | null) => call<DaySession[]>('hq_day_sessions', { p_day: day, p_city: city }));
export const loadCities = cache(() => call<CityRow[]>('hq_cities'));
export const loadCommunities = cache((city: string | null) => call<CommunityRow[]>('hq_communities', { p_city: city }));
export const loadAttention = cache(() => call<Attention>('hq_attention'));
export const loadMix = cache((city: string | null) => call<Mix>('hq_mix', { p_city: city }));

/** Health from the last two weeks against the two before (sessions held). */
export function health(c: Pick<CommunityRow, 'recent' | 'before'>): { label: string; tone: 'good' | 'info' | 'bad' | 'mute' } {
  if (!c.recent && !c.before) return { label: 'Getting started', tone: 'mute' };
  if (c.recent > c.before) return { label: 'Growing', tone: 'good' };
  if (c.recent * 2 < c.before) return { label: 'Needs help', tone: 'bad' };
  return { label: 'Steady', tone: 'info' };
}
