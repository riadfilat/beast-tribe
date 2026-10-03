import { cache } from 'react';
import { createAdminClient } from './supabase-server';
import type { PartnerUser } from './auth';
import { fetchAll } from './fetch-all';

// A gym's club, measured. Everything per member is club activity only: booking or coming to the
// club's classes and sessions, and posting or commenting in the club feed. Training a member does
// on their own (workout logs) is only ever shown as a club total, never per person.

export type MemberStatus = 'new' | 'active' | 'quiet' | 'at_risk';

export const STATUS_LABEL: Record<MemberStatus, string> = {
  new: 'New',
  active: 'Active',
  quiet: 'Quiet',
  at_risk: 'At risk',
};

export const STATUS_HINT: Record<MemberStatus, string> = {
  new: 'Joined in the last 14 days',
  active: 'Booked, came or posted in the last 14 days',
  quiet: 'Nothing for 14–30 days',
  at_risk: 'Nothing for over 30 days',
};

export interface ClubMember {
  id: string;
  name: string;
  avatar: string | null;
  joinedAt: Date;
  lastActive: Date | null;
  booked30: number;
  attended30: number;
  posts30: number;
  status: MemberStatus;
}

export interface ClubClass {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  capacity: number | null;
  going: number;
  waitlist: number;
  attended: number;
  coach: string | null;
  cancelled: boolean;
  isClass: boolean;
  byMember: boolean;
  sport: string | null;
  seriesId: string | null;
}

export interface ClubData {
  community: { id: string; name: string; join_code: string | null; seat_limit: number | null; kind: string };
  members: ClubMember[];
  counts: { members: number; active7: number; active30: number; new30: number; quiet: number; atRisk: number };
  weekly: { start: Date; active: number; bookings: number }[];
  /** Bookings by weekday (0 = Sunday) and hour of the class start, last 90 days. */
  heat: number[][];
  upcoming: ClubClass[];
  past: ClubClass[];
  month: {
    bookings: number;
    attended: number;
    classesHeld: number;
    classesMarked: number;
    fill: number | null;
    memberHosted: number;
    posts: number;
    comments: number;
    reactivated: number;
    soloSessions: number;
    soloMembers: number;
  };
}

const DAY = 86400000;
const chunk = <T,>(xs: T[], n = 150) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));
function weekStart(d: Date) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  x.setUTCDate(x.getUTCDate() - x.getUTCDay()); // Sunday, Saudi week
  return x;
}

export const loadClub = cache(async (partner: PartnerUser, communityId: string): Promise<ClubData | null> => {
  const db = createAdminClient();
  const now = new Date();
  const since90 = new Date(now.getTime() - 91 * DAY);
  const since30 = new Date(now.getTime() - 30 * DAY);
  const until = new Date(now.getTime() + 60 * DAY);

  // Read in pages: a full club passes the API's 1,000-row limit on every one of these.
  const [{ data: community }, memberRows, eventRows, postRows] = await Promise.all([
    db.from('communities').select('id, name, join_code, seat_limit, kind').eq('id', communityId).single(),
    fetchAll((a, b) => db.from('community_members').select('user_id, joined_at').eq('community_id', communityId).order('user_id').range(a, b)),
    fetchAll((a, b) =>
      db
        .from('events')
        .select('id, title, starts_at, ends_at, max_capacity, is_class, class_series_id, created_by, partner_id, coach_name, cancelled_at, sport:sports(name, emoji)')
        .eq('community_id', communityId)
        .gte('starts_at', since90.toISOString())
        .lte('starts_at', until.toISOString())
        .order('starts_at')
        .order('id')
        .range(a, b),
    ),
    fetchAll((a, b) => db.from('feed_posts').select('id, user_id, created_at').eq('community_id', communityId).gte('created_at', since90.toISOString()).order('id').range(a, b)),
  ]);
  if (!community) return null;

  const members0 = (memberRows || []).filter((m: any) => m.user_id !== partner.id);
  const ids = members0.map((m: any) => m.user_id as string);
  const eventIds = (eventRows || []).map((e: any) => e.id as string);
  const postIds = (postRows || []).map((p: any) => p.id as string);

  const [profiles, rsvps, comments, logs] = await Promise.all([
    Promise.all(chunk(ids).map((c) => db.from('profiles').select('id, full_name, display_name, avatar_url').in('id', c))).then((rs) => rs.flatMap((r) => r.data || [])),
    Promise.all(chunk(eventIds, 60).map((c) => fetchAll((a, b) => db.from('event_rsvps').select('event_id, user_id, status, created_at, attended_at').in('event_id', c).order('id').range(a, b)))).then((rs) => rs.flat()),
    Promise.all(chunk(postIds).map((c) => fetchAll((a, b) => db.from('feed_comments').select('user_id, created_at').in('post_id', c).gte('created_at', since90.toISOString()).order('id').range(a, b)))).then((rs) => rs.flat()),
    Promise.all(chunk(ids).map((c) => fetchAll((a, b) => db.from('workout_logs').select('user_id').in('user_id', c).gte('completed_at', since30.toISOString()).order('id').range(a, b)))).then((rs) => rs.flat()),
  ]);

  const memberSet = new Set(ids);
  const eventById = new Map((eventRows || []).map((e: any) => [e.id, e]));

  // Every club activity moment per member.
  const moments = new Map<string, Date[]>();
  const add = (uid: string, at: Date) => {
    if (!memberSet.has(uid) || at > now) return;
    const xs = moments.get(uid);
    if (xs) xs.push(at);
    else moments.set(uid, [at]);
  };
  const booked30 = new Map<string, number>();
  const attended30 = new Map<string, number>();
  const posts30 = new Map<string, number>();
  const inc = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

  const perEvent = new Map<string, { going: number; waitlist: number; attended: number }>();
  for (const r of rsvps as any[]) {
    const e: any = eventById.get(r.event_id);
    if (!e) continue;
    const pe = perEvent.get(r.event_id) ?? { going: 0, waitlist: 0, attended: 0 };
    if (r.status === 'going') pe.going++;
    if (r.status === 'waitlist') pe.waitlist++;
    if (r.attended_at) pe.attended++;
    perEvent.set(r.event_id, pe);
    if (r.status !== 'going' && r.status !== 'waitlist') continue;
    const bookedAt = new Date(r.created_at);
    const start = new Date(e.starts_at);
    add(r.user_id, bookedAt);
    if (r.status === 'going' && start <= now && !e.cancelled_at) add(r.user_id, start);
    if (bookedAt >= since30) inc(booked30, r.user_id);
    if (r.attended_at && start >= since30) inc(attended30, r.user_id);
  }
  for (const p of (postRows || []) as any[]) {
    add(p.user_id, new Date(p.created_at));
    if (new Date(p.created_at) >= since30) inc(posts30, p.user_id);
  }
  for (const c of comments as any[]) add(c.user_id, new Date(c.created_at));

  const profileById = new Map((profiles as any[]).map((p) => [p.id, p]));
  const members: ClubMember[] = members0.map((m: any) => {
    const ts = moments.get(m.user_id) || [];
    const lastActive = ts.length ? new Date(Math.max(...ts.map((t) => t.getTime()))) : null;
    const joinedAt = new Date(m.joined_at);
    const p: any = profileById.get(m.user_id) || {};
    const ref = lastActive && lastActive > joinedAt ? lastActive : null;
    const daysQuiet = ref ? (now.getTime() - ref.getTime()) / DAY : Infinity;
    const status: MemberStatus =
      now.getTime() - joinedAt.getTime() < 14 * DAY && daysQuiet > 14
        ? 'new'
        : daysQuiet <= 14
          ? 'active'
          : daysQuiet <= 30
            ? 'quiet'
            : 'at_risk';
    return {
      id: m.user_id,
      name: p.display_name || p.full_name || 'Member',
      avatar: p.avatar_url || null,
      joinedAt,
      lastActive,
      booked30: booked30.get(m.user_id) ?? 0,
      attended30: attended30.get(m.user_id) ?? 0,
      posts30: posts30.get(m.user_id) ?? 0,
      status,
    };
  });

  const activeWithin = (days: number) => members.filter((m) => m.lastActive && now.getTime() - m.lastActive.getTime() <= days * DAY).length;

  // Weekly active members and bookings, 12 weeks.
  const first = weekStart(now);
  first.setUTCDate(first.getUTCDate() - 7 * 11);
  const weekly = Array.from({ length: 12 }, (_, i) => ({ start: new Date(first.getTime() + i * 7 * DAY), active: 0, bookings: 0 }));
  const wIdx = (d: Date) => Math.floor((weekStart(d).getTime() - first.getTime()) / (7 * DAY));
  moments.forEach((ts) => {
    const weeks = new Set(ts.map(wIdx).filter((i) => i >= 0 && i < 12));
    weeks.forEach((i) => weekly[i].active++);
  });
  const heat = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
  for (const r of rsvps as any[]) {
    if (r.status !== 'going' && r.status !== 'waitlist') continue;
    const i = wIdx(new Date(r.created_at));
    if (i >= 0 && i < 12) weekly[i].bookings++;
    const e: any = eventById.get(r.event_id);
    if (e) {
      // Riyadh time (UTC+3, no daylight saving).
      const local = new Date(new Date(e.starts_at).getTime() + 3 * 3600000);
      heat[local.getUTCDay()][local.getUTCHours()]++;
    }
  }

  const classes: ClubClass[] = (eventRows || []).map((e: any) => {
    const pe = perEvent.get(e.id) ?? { going: 0, waitlist: 0, attended: 0 };
    return {
      id: e.id,
      title: e.title,
      startsAt: new Date(e.starts_at),
      endsAt: e.ends_at ? new Date(e.ends_at) : null,
      capacity: e.max_capacity,
      going: pe.going,
      waitlist: pe.waitlist,
      attended: pe.attended,
      coach: e.coach_name,
      cancelled: !!e.cancelled_at,
      isClass: !!e.is_class || e.partner_id === partner.partner_id,
      byMember: e.partner_id !== partner.partner_id && memberSet.has(e.created_by),
      sport: e.sport ? `${e.sport.emoji || ''} ${e.sport.name}`.trim() : null,
      seriesId: e.class_series_id,
    };
  });
  const upcoming = classes.filter((c) => c.startsAt > now);
  const past = classes.filter((c) => c.startsAt <= now).reverse();
  const held30 = past.filter((c) => c.startsAt >= since30 && !c.cancelled && c.isClass);
  const withCap = held30.filter((c) => c.capacity);
  const fill = withCap.length ? withCap.reduce((s, c) => s + Math.min(1, c.going / (c.capacity || 1)), 0) / withCap.length : null;

  // Came back: active in the last 30 days after a gap of 30+ days with nothing.
  let reactivated = 0;
  moments.forEach((ts) => {
    const sorted = ts.map((t) => t.getTime()).sort((a, b) => a - b);
    const firstRecent = sorted.findIndex((t) => t >= since30.getTime());
    if (firstRecent > 0 && sorted[firstRecent] - sorted[firstRecent - 1] >= 30 * DAY) reactivated++;
  });

  const soloMembers = new Set((logs as any[]).map((l) => l.user_id)).size;

  return {
    community: community as any,
    members,
    counts: {
      members: members.length,
      active7: activeWithin(7),
      active30: activeWithin(30),
      new30: members.filter((m) => now.getTime() - m.joinedAt.getTime() <= 30 * DAY).length,
      quiet: members.filter((m) => m.status === 'quiet').length,
      atRisk: members.filter((m) => m.status === 'at_risk').length,
    },
    weekly,
    heat,
    upcoming,
    past,
    month: {
      bookings: [...booked30.values()].reduce((a, b) => a + b, 0),
      attended: [...attended30.values()].reduce((a, b) => a + b, 0),
      classesHeld: held30.length,
      classesMarked: held30.filter((c) => c.attended > 0).length,
      fill,
      memberHosted: classes.filter((c) => c.byMember && c.startsAt >= since30 && c.startsAt <= now && !c.cancelled).length,
      posts: (postRows || []).filter((p: any) => new Date(p.created_at) >= since30).length,
      comments: (comments as any[]).filter((c) => new Date(c.created_at) >= since30).length,
      reactivated,
      // Shown only as a club total, and only when enough members train for it to stay anonymous.
      soloSessions: soloMembers >= 5 ? logs.length : 0,
      soloMembers: soloMembers >= 5 ? soloMembers : 0,
    },
  };
});

/** The gym's club community id, or null when it has none yet. */
export async function clubIdOf(partnerId: string): Promise<string | null> {
  const db = createAdminClient();
  const { data } = await db.from('partners').select('community_id').eq('id', partnerId).single();
  return (data as any)?.community_id ?? null;
}

export const fmtDay = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Riyadh' });
export const fmtTime = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' });
export function ago(d: Date | null) {
  if (!d) return 'Never';
  const days = Math.floor((Date.now() - d.getTime()) / DAY);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const m = Math.floor(days / 30);
  return m === 1 ? 'A month ago' : `${m} months ago`;
}
