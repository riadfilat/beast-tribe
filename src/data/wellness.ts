import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useQuery, invalidate } from './query';
import { PREVIEW } from './preview';

// Wellness inside a community: challenges members opt into (steps, active days, workouts, minutes,
// sessions; by person or by team), teams, the experts and venues included in the community's
// package, and what the community puts on its page (a notice, a plan of the month).
// Migrations 047 and 052.

export type ChallengeMetric = 'steps' | 'active_days' | 'workouts' | 'minutes' | 'sessions';

export interface Challenge {
  id: string;
  communityId: string;
  title: string;
  metric: ChallengeMetric;
  byTeam: boolean;
  prize: string | null;
  dailyGoal: number | null;
  startsOn: Date;
  endsOn: Date;
  joined: boolean;
  entrants: number;
}

export interface BoardRow {
  userId: string;
  name: string;
  avatarUrl: string | null;
  score: number;
  daysActive: number;
  place: number;
  team: string | null;
}

export interface TeamRow {
  teamId: string;
  name: string;
  people: number;
  average: number;
  place: number;
  mine: boolean;
}

export interface Team {
  id: string;
  name: string;
  members: number;
}

export interface PackagePartner {
  partnerId: string;
  role: 'nutritionist' | 'coach' | 'gym' | 'kitchen';
  name: string;
  logoUrl: string | null;
  perk: string | null;
  connected: boolean;
}

export interface CommunityExtras {
  notice: string | null;
  plan: { slug: string; title: string; weeks: number; days: number; minutes: number } | null;
}

const date = (s: string) => new Date(`${s}T00:00:00`);
const METRICS: ChallengeMetric[] = ['steps', 'active_days', 'workouts', 'minutes', 'sessions'];

/** Current and upcoming challenges of one community (ended ones drop off after a week). */
export function useChallenges(communityId: string | null | undefined, lang: string) {
  const { user } = useAuth();
  return useQuery<Challenge[]>(!PREVIEW && user && communityId ? `wellness:challenges:${communityId}:${lang}` : null, async () => {
    const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('challenges')
      .select('id, community_id, title, title_ar, metric, by_team, prize, prize_ar, daily_goal, starts_on, ends_on, entries:challenge_entries(user_id)')
      .eq('community_id', communityId!)
      .is('cancelled_at', null)
      .gte('ends_on', since)
      .order('starts_on');
    if (error) throw error;
    return (data || []).map((c: any) => ({
      id: c.id,
      communityId: c.community_id,
      title: (lang === 'ar' && c.title_ar) || c.title,
      metric: METRICS.includes(c.metric) ? c.metric : 'steps',
      byTeam: !!c.by_team,
      prize: (lang === 'ar' && c.prize_ar) || c.prize || null,
      dailyGoal: c.daily_goal,
      startsOn: date(c.starts_on),
      endsOn: date(c.ends_on),
      joined: (c.entries || []).some((e: any) => e.user_id === user!.id),
      entrants: (c.entries || []).length,
    }));
  });
}

/** The top of the ranking, plus the member's own row when they are further down. */
export function useChallengeBoard(challengeId: string | null) {
  return useQuery<BoardRow[]>(!PREVIEW && challengeId ? `wellness:board:${challengeId}` : null, async () => {
    const { data, error } = await supabase.rpc('challenge_board', { p_challenge: challengeId, p_limit: 20 });
    if (error) throw error;
    return (data || []).map((r: any) => ({
      userId: r.user_id,
      name: r.name,
      avatarUrl: r.avatar_url,
      score: Number(r.score ?? r.steps) || 0,
      daysActive: r.days_active || 0,
      place: r.place,
      team: r.team || null,
    }));
  });
}

export function useTeamBoard(challengeId: string | null, lang: string) {
  return useQuery<TeamRow[]>(!PREVIEW && challengeId ? `wellness:teamboard:${challengeId}:${lang}` : null, async () => {
    const { data, error } = await supabase.rpc('challenge_team_board', { p_challenge: challengeId });
    if (error) throw error;
    return (data || []).map((r: any) => ({
      teamId: r.team_id,
      name: (lang === 'ar' && r.name_ar) || r.name,
      people: r.people || 0,
      average: Number(r.average) || 0,
      place: r.place,
      mine: !!r.mine,
    }));
  });
}

export async function joinChallenge(meId: string, challengeId: string) {
  const { error } = await supabase.from('challenge_entries').insert({ challenge_id: challengeId, user_id: meId });
  if (error && (error as any).code !== '23505') throw error;
  invalidate('wellness:');
}

export async function leaveChallenge(meId: string, challengeId: string) {
  const { error } = await supabase.from('challenge_entries').delete().eq('challenge_id', challengeId).eq('user_id', meId);
  if (error) throw error;
  invalidate('wellness:');
}

/** A community's teams (departments, offices) and which one the member is on. */
export function useTeams(communityId: string | null | undefined, lang: string) {
  const { user } = useAuth();
  return useQuery<{ teams: Team[]; mine: string | null }>(!PREVIEW && user && communityId ? `wellness:teams:${communityId}:${lang}` : null, async () => {
    const [{ data, error }, { data: me }] = await Promise.all([
      supabase.from('community_teams').select('id, name, name_ar, members:community_team_members(count)').eq('community_id', communityId!).order('name'),
      supabase.from('community_team_members').select('team_id').eq('community_id', communityId!).eq('user_id', user!.id).maybeSingle(),
    ]);
    if (error) throw error;
    return {
      teams: (data || []).map((t: any) => ({ id: t.id, name: (lang === 'ar' && t.name_ar) || t.name, members: t.members?.[0]?.count ?? 0 })),
      mine: (me as any)?.team_id ?? null,
    };
  });
}

export async function chooseTeam(teamId: string) {
  const { error } = await supabase.rpc('choose_team', { p_team: teamId });
  if (error) throw error;
  invalidate('wellness:');
}

/** Experts and venues included with a community. */
export function usePackagePartners(communityId: string | null | undefined, lang: string) {
  const { user } = useAuth();
  return useQuery<PackagePartner[]>(!PREVIEW && user && communityId ? `wellness:package:${communityId}:${lang}` : null, async () => {
    const [{ data, error }, { data: links }] = await Promise.all([
      supabase.from('community_partners').select('partner_id, role, perk, perk_ar, partner:partners(business_name, name, logo_url)').eq('community_id', communityId!),
      supabase.from('coach_trainees').select('coach_id, status').eq('trainee_id', user!.id),
    ]);
    if (error) throw error;
    const linked = new Set((links || []).filter((l: any) => l.status === 'active').map((l: any) => l.coach_id));
    return (data || []).map((r: any) => ({
      partnerId: r.partner_id,
      role: r.role,
      name: r.partner?.business_name || r.partner?.name || '',
      logoUrl: r.partner?.logo_url || null,
      perk: (lang === 'ar' && r.perk_ar) || r.perk || null,
      connected: linked.has(r.partner_id),
    }));
  });
}

/** Start working with an included nutritionist or coach, sharing what the member chose. */
export async function connectExpert(partnerId: string, share: { nutrition: boolean; body: boolean }) {
  const { error } = await supabase.rpc('connect_package_expert', { p_partner: partnerId, p_share_nutrition: share.nutrition, p_share_body: share.body });
  if (error) throw error;
  invalidate('wellness:');
  invalidate('coaching:');
}

/** What the community has put on its page: a notice (until its date) and a plan of the month. */
export function useCommunityExtras(communityId: string | null | undefined, lang: string) {
  const { user } = useAuth();
  return useQuery<CommunityExtras>(!PREVIEW && user && communityId ? `wellness:extras:${communityId}:${lang}` : null, async () => {
    const { data, error } = await supabase
      .from('communities')
      .select('notice, notice_ar, notice_until, plan:programs!featured_program_id(slug, title, title_ar, weeks, days_per_week, minutes, status)')
      .eq('id', communityId!)
      .maybeSingle();
    if (error) throw error;
    const d: any = data || {};
    const today = new Date().toISOString().slice(0, 10);
    const live = !d.notice_until || d.notice_until >= today;
    const text = live ? (lang === 'ar' && d.notice_ar) || d.notice || null : null;
    const p = d.plan && d.plan.status === 'published' ? d.plan : null;
    return {
      notice: text,
      plan: p ? { slug: p.slug, title: (lang === 'ar' && p.title_ar) || p.title, weeks: p.weeks, days: p.days_per_week, minutes: p.minutes } : null,
    };
  });
}

/** My steps: today and the last 7 days (from daily_activity). */
export function useMySteps() {
  const { user } = useAuth();
  return useQuery<{ today: number; week: number; days: { day: string; steps: number }[] }>(!PREVIEW && user ? `wellness:steps:${user.id}` : null, async () => {
    const since = new Date(Date.now() - 6 * 86400000);
    const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const { data, error } = await supabase.from('daily_activity').select('day, steps').eq('user_id', user!.id).gte('day', key(since)).order('day');
    if (error) throw error;
    const days = (data || []).map((r: any) => ({ day: r.day, steps: r.steps }));
    return { today: days.find((d) => d.day === key(new Date()))?.steps ?? 0, week: days.reduce((s, d) => s + d.steps, 0), days };
  });
}
