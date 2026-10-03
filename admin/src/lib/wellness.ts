import { createAdminClient } from './supabase-server';
import { fetchAll } from './fetch-all';

// Wellness for a gym's or company's community: step challenges (entrants only on the ranking) and
// a steps total that is only shown when at least five members have connected Apple Health, so no
// one person's steps can be read from it.

export type Metric = 'steps' | 'active_days' | 'workouts' | 'minutes' | 'sessions';
export const METRIC_LABEL: Record<Metric, string> = { steps: 'Steps', active_days: 'Active days', workouts: 'Workouts logged', minutes: 'Minutes trained', sessions: 'Sessions joined' };
export const METRIC_HINT: Record<Metric, string> = {
  steps: 'From Apple Health. iPhone only for now.',
  active_days: 'A day counts with a workout, a session, or the step goal. Works on any phone.',
  workouts: 'Every workout a member logs in the app. Works on any phone.',
  minutes: 'Minutes from logged workouts and sessions attended. Works on any phone.',
  sessions: 'Sessions joined in your community. Gets people training together.',
};
const UNIT: Record<Metric, [string, string]> = { steps: ['step', 'steps'], active_days: ['day', 'days'], workouts: ['workout', 'workouts'], minutes: ['min', 'min'], sessions: ['session', 'sessions'] };
export const fmtScore = (metric: Metric, n: number) => `${Math.round(n).toLocaleString('en-US')} ${UNIT[metric][Math.round(n) === 1 ? 0 : 1]}`;

export interface ChallengeRow {
  id: string;
  title: string;
  titleAr: string | null;
  metric: Metric;
  byTeam: boolean;
  prize: string | null;
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
  score: number;
  steps: number;
  days_active: number;
  place: number;
  entrants?: number;
  team?: string | null;
}

export interface TeamBoardRow {
  team_id: string;
  name: string;
  people: number;
  average: number;
  total: number;
  place: number;
}

export interface TeamInfo {
  id: string;
  name: string;
  name_ar: string | null;
  members: number;
}

export async function loadChallenges(communityId: string): Promise<ChallengeRow[]> {
  const db = createAdminClient();
  const { data } = await db
    .from('challenges')
    .select('id, title, title_ar, metric, by_team, prize, daily_goal, starts_on, ends_on, cancelled_at, entries:challenge_entries(count)')
    .eq('community_id', communityId)
    .order('starts_on', { ascending: false })
    .limit(40);
  return (data || []).map((c: any) => ({
    id: c.id,
    title: c.title,
    titleAr: c.title_ar,
    metric: (c.metric as Metric) || 'steps',
    byTeam: !!c.by_team,
    prize: c.prize || null,
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
  return ((data as any[]) || []).map((r) => ({ ...r, score: Number(r.score ?? r.steps) || 0, steps: Number(r.steps) || 0 }));
}

export async function loadTeamBoard(challengeId: string): Promise<TeamBoardRow[]> {
  const db = createAdminClient();
  const { data } = await db.rpc('challenge_team_board', { p_challenge: challengeId });
  return ((data as any[]) || []).map((r) => ({ ...r, average: Number(r.average) || 0, total: Number(r.total) || 0 }));
}

export async function loadTeams(communityId: string): Promise<TeamInfo[]> {
  const db = createAdminClient();
  const { data } = await db.from('community_teams').select('id, name, name_ar, members:community_team_members(count)').eq('community_id', communityId).order('name');
  return (data || []).map((t: any) => ({ id: t.id, name: t.name, name_ar: t.name_ar, members: t.members?.[0]?.count ?? 0 }));
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
  for (let i = 0; i < memberIds.length; i += 100) {
    const part = memberIds.slice(i, i + 100); // 100 members × 7 days stays under the 1,000-row limit
    rows.push(...(await fetchAll((a, b) => db.from('daily_activity').select('user_id, steps').in('user_id', part).gte('day', since).order('user_id').order('day').range(a, b))));
  }
  const people = new Set(rows.map((r) => r.user_id));
  if (people.size < 5) return { connected: people.size, avgDaily: null, total: null };
  const total = rows.reduce((s, r) => s + (r.steps || 0), 0);
  return { connected: people.size, avgDaily: Math.round(total / people.size / 7), total };
}

export const fmtDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
