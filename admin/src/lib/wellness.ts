import { createAdminClient } from './supabase-server';

// Wellness for a gym's or company's community: step challenges (entrants only on the ranking) and
// a steps total that is only shown when at least five members have connected Apple Health, so no
// one person's steps can be read from it.

export interface ChallengeRow {
  id: string;
  title: string;
  titleAr: string | null;
  dailyGoal: number | null;
  startsOn: string;
  endsOn: string;
  cancelled: boolean;
  entrants: number;
}

export interface BoardRow {
  user_id: string;
  name: string;
  avatar_url: string | null;
  steps: number;
  days_active: number;
  place: number;
}

export async function loadChallenges(communityId: string): Promise<ChallengeRow[]> {
  const db = createAdminClient();
  const { data } = await db
    .from('challenges')
    .select('id, title, title_ar, daily_goal, starts_on, ends_on, cancelled_at, entries:challenge_entries(count)')
    .eq('community_id', communityId)
    .order('starts_on', { ascending: false })
    .limit(40);
  return (data || []).map((c: any) => ({
    id: c.id,
    title: c.title,
    titleAr: c.title_ar,
    dailyGoal: c.daily_goal,
    startsOn: c.starts_on,
    endsOn: c.ends_on,
    cancelled: !!c.cancelled_at,
    entrants: c.entries?.[0]?.count ?? 0,
  }));
}

export async function loadBoard(challengeId: string): Promise<BoardRow[]> {
  const db = createAdminClient();
  const { data } = await db.rpc('challenge_board', { p_challenge: challengeId });
  return ((data as any[]) || []).map((r) => ({ ...r, steps: Number(r.steps) || 0 }));
}

export const todayRiyadh = () => new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);

export function stateOf(c: ChallengeRow): 'upcoming' | 'live' | 'ended' | 'cancelled' {
  const today = todayRiyadh();
  if (c.cancelled) return 'cancelled';
  if (c.startsOn > today) return 'upcoming';
  if (c.endsOn < today) return 'ended';
  return 'live';
}

/** Members' steps in the last 7 days, as a community total — only with 5+ connected members. */
export async function loadStepsSummary(memberIds: string[]): Promise<{ connected: number; avgDaily: number | null; total: number | null }> {
  if (!memberIds.length) return { connected: 0, avgDaily: null, total: null };
  const db = createAdminClient();
  const since = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const rows: any[] = [];
  for (let i = 0; i < memberIds.length; i += 150) {
    const { data } = await db.from('daily_activity').select('user_id, steps').in('user_id', memberIds.slice(i, i + 150)).gte('day', since);
    rows.push(...(data || []));
  }
  const people = new Set(rows.map((r) => r.user_id));
  if (people.size < 5) return { connected: people.size, avgDaily: null, total: null };
  const total = rows.reduce((s, r) => s + (r.steps || 0), 0);
  return { connected: people.size, avgDaily: Math.round(total / people.size / 7), total };
}

export const fmtDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
