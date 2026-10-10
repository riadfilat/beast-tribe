import { cache } from 'react';
import { userSupabase } from '../auth';
import { createAdminClient } from '../supabase-server';

// A community's numbers for the leader dashboard (migration 093, community_overview) and the
// insights written from them. The database decides who may see what: money is null for supporters.

export interface WeekNumbers {
  players: number;
  sessions: number;
  fill: number | null;
}

export interface Overview {
  members: number;
  new30: number;
  active7: number;
  quiet: number;
  thisWeek: WeekNumbers;
  lastWeek: WeekNumbers;
  days: { day: string; players: number }[];
  busiest: { dow: number; hour: number; fill: number; sessions: number } | null;
  topSport: { sport: string; players: number } | null;
  upcoming7: number;
  money: { expected: number; paid: number } | null;
}

const week = (w: any): WeekNumbers => ({ players: Number(w?.players ?? 0), sessions: Number(w?.sessions ?? 0), fill: w?.fill == null ? null : Number(w.fill) });

export const loadOverview = cache(async (communityId: string): Promise<Overview> => {
  const { data, error } = await (await userSupabase()).rpc('community_overview', { p_community: communityId });
  if (error) throw new Error(error.message);
  const o: any = data || {};
  return {
    members: Number(o.members ?? 0),
    new30: Number(o.new_30 ?? 0),
    active7: Number(o.active_7 ?? 0),
    quiet: Number(o.quiet ?? 0),
    thisWeek: week(o.this_week),
    lastWeek: week(o.last_week),
    days: ((o.days || []) as any[]).map((d) => ({ day: d.day, players: Number(d.players) })),
    busiest: o.busiest ? { dow: o.busiest.dow, hour: o.busiest.hour, fill: Number(o.busiest.fill), sessions: Number(o.busiest.sessions) } : null,
    topSport: o.top_sport ? { sport: o.top_sport.sport, players: Number(o.top_sport.players) } : null,
    upcoming7: Number(o.upcoming_7 ?? 0),
    money: o.money ? { expected: Number(o.money.expected), paid: Number(o.money.paid) } : null,
  };
});

export interface SportOption {
  id: string;
  name: string;
  slug: string;
}

/** Every sport with the app's id for it (migration 094). */
export const loadSports = cache(async (): Promise<SportOption[]> => {
  const { data } = await createAdminClient().rpc('sport_list');
  return ((data || []) as any[]).filter((s) => s.slug !== 'community').map((s) => ({ id: s.id, name: s.name, slug: s.slug }));
});

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const hourLabel = (h: number) => (h === 0 ? '12 am' : h < 12 ? `${h} am` : h === 12 ? '12 pm' : `${h - 12} pm`);

/** "+18%" against last week, or null when there is nothing to compare with. */
export function change(now: number, before: number): { text: string; dir: 'up' | 'down' | 'same' } | undefined {
  if (!before && !now) return undefined;
  if (!before) return { text: 'new this week', dir: 'up' };
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return { text: 'same as last week', dir: 'same' };
  return { text: `${pct > 0 ? '+' : ''}${pct}% vs last week`, dir: pct > 0 ? 'up' : 'down' };
}

export interface InsightCard {
  key: string;
  icon: string;
  title: string;
  body: string;
  action?: { label: string; href: string };
  tone: 'aqua' | 'orange';
}

/**
 * Up to three things worth knowing, most useful first. About the community and its sessions,
 * never ranking members (no leaderboards).
 */
export function insightsFor(o: Overview, sportName: (slug: string) => string): InsightCard[] {
  const out: InsightCard[] = [];
  if (!o.upcoming7) {
    out.push({ key: 'empty', icon: 'sessions', tone: 'orange', title: 'Nothing on the Board this week', body: 'Members open the app to see what is on. One session is enough to get them moving.', action: { label: 'Post a session', href: '/leader/sessions/new' } });
  }
  if (o.busiest && o.busiest.fill >= 0.6) {
    const day = DAY_NAMES[o.busiest.dow];
    out.push({ key: 'busiest', icon: 'chart', tone: 'orange', title: `${day} ${hourLabel(o.busiest.hour)} fills best`, body: `Those sessions were ${Math.round(o.busiest.fill * 100)}% full on average over the last 8 weeks.`, action: { label: `Post a ${day} session`, href: `/leader/sessions/new?dow=${o.busiest.dow}&hour=${o.busiest.hour}` } });
  }
  if (o.quiet > 0) {
    out.push({ key: 'quiet', icon: 'people', tone: 'aqua', title: `${o.quiet} member${o.quiet === 1 ? '' : 's'} haven’t played in 3 weeks`, body: 'A friendly nudge or an easy session usually brings people back.', action: { label: 'See who', href: '/leader/people?show=quiet' } });
  }
  if (o.topSport) {
    const name = sportName(o.topSport.sport);
    out.push({ key: 'sport', icon: 'gym', tone: 'aqua', title: `${name} brings the most players`, body: `${o.topSport.players} players joined ${name.toLowerCase()} sessions in the last 8 weeks.`, action: { label: `Post a ${name.toLowerCase()} session`, href: `/leader/sessions/new?sport=${encodeURIComponent(o.topSport.sport)}` } });
  }
  if (o.new30 > 0) {
    out.push({ key: 'new', icon: 'people', tone: 'aqua', title: `${o.new30} new member${o.new30 === 1 ? '' : 's'} this month`, body: 'A beginner-friendly session is the easiest first step for them.', action: { label: 'Post a beginner session', href: '/leader/sessions/new?level=easy' } });
  }
  if (!out.length) {
    out.push({ key: 'start', icon: 'insights', tone: 'aqua', title: 'Insights appear as people play', body: 'After a few sessions you will see your best times, favourite sports and who is going quiet.' });
  }
  return out.slice(0, 3);
}
