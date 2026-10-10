import { cache } from 'react';
import { createAdminClient } from '../supabase-server';

// The people of a community for the leader dashboard: its team (leaders, supporters, open invites)
// and its members with how recently they played.

export type MemberStatus = 'new' | 'active' | 'quiet' | 'away';
export const STATUS: Record<MemberStatus, { label: string; tone: 'good' | 'info' | 'warn' | 'bad'; hint: string }> = {
  new: { label: 'New', tone: 'info', hint: 'Joined in the last 14 days' },
  active: { label: 'Active', tone: 'good', hint: 'Played in the last 3 weeks' },
  quiet: { label: 'Quiet', tone: 'warn', hint: 'Played before, nothing for 3+ weeks' },
  away: { label: 'Not played yet', tone: 'bad', hint: 'Joined but hasn’t played' },
};

export interface Person {
  id: string;
  name: string;
  avatar: string | null;
  joinedAt: Date;
  lastPlayed: Date | null;
  sessions30: number;
  status: MemberStatus;
}

export interface TeamPeople {
  team: { id: string; name: string; role: 'leader' | 'supporter' }[];
  invites: { id: string; email: string; role: 'leader' | 'supporter'; createdAt: Date }[];
  members: Person[];
}

const DAY = 86400000;

export const loadPeople = cache(async (communityId: string): Promise<TeamPeople> => {
  const db = createAdminClient();
  const [{ data: ms }, { data: inv }] = await Promise.all([
    db.from('community_members').select('user_id, role, joined_at').eq('community_id', communityId).limit(5000),
    db.from('community_invites').select('id, email, role, created_at').eq('community_id', communityId).is('accepted_at', null).order('created_at'),
  ]);
  const rows = (ms || []) as any[];
  const ids = rows.map((m) => m.user_id);
  const now = Date.now();

  const [profiles, played] = await Promise.all([
    Promise.all(Array.from({ length: Math.ceil(ids.length / 150) }, (_, i) => db.from('profiles').select('id, full_name, display_name, avatar_url').in('id', ids.slice(i * 150, i * 150 + 150)))).then((rs) => rs.flatMap((r) => (r.data || []) as any[])),
    // Who played what in this community's sessions (going, already started), last 120 days.
    db
      .from('events')
      .select('starts_at, rsvps:event_rsvps!inner(user_id, status)')
      .eq('community_id', communityId)
      .is('cancelled_at', null)
      .lte('starts_at', new Date().toISOString())
      .gte('starts_at', new Date(now - 120 * DAY).toISOString())
      .eq('rsvps.status', 'going')
      .limit(2000)
      .then((r) => (r.data || []) as any[]),
  ]);
  const pById = new Map(profiles.map((p) => [p.id, p]));
  const last = new Map<string, number>();
  const count30 = new Map<string, number>();
  for (const e of played) {
    const t = new Date(e.starts_at).getTime();
    for (const r of e.rsvps || []) {
      last.set(r.user_id, Math.max(last.get(r.user_id) ?? 0, t));
      if (t > now - 30 * DAY) count30.set(r.user_id, (count30.get(r.user_id) ?? 0) + 1);
    }
  }
  const nameOf = (id: string) => {
    const p: any = pById.get(id) || {};
    return p.display_name || p.full_name || 'Member';
  };

  const members: Person[] = rows
    .filter((m) => m.role === 'member')
    .map((m) => {
      const joinedAt = new Date(m.joined_at);
      const lp = last.get(m.user_id) ?? null;
      const status: MemberStatus = lp && now - lp <= 21 * DAY ? 'active' : lp ? 'quiet' : now - joinedAt.getTime() <= 14 * DAY ? 'new' : 'away';
      return { id: m.user_id, name: nameOf(m.user_id), avatar: (pById.get(m.user_id) as any)?.avatar_url || null, joinedAt, lastPlayed: lp ? new Date(lp) : null, sessions30: count30.get(m.user_id) ?? 0, status };
    })
    .sort((a, b) => (b.lastPlayed?.getTime() ?? 0) - (a.lastPlayed?.getTime() ?? 0) || b.joinedAt.getTime() - a.joinedAt.getTime());

  return {
    team: rows
      .filter((m) => m.role === 'admin' || m.role === 'supporter')
      .map((m) => ({ id: m.user_id, name: nameOf(m.user_id), role: m.role === 'admin' ? ('leader' as const) : ('supporter' as const) }))
      .sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role === 'leader' ? -1 : 1)),
    invites: ((inv || []) as any[]).map((i) => ({ id: i.id, email: i.email, role: i.role === 'admin' ? 'leader' : 'supporter', createdAt: new Date(i.created_at) })),
    members,
  };
});

export function ago(d: Date | null) {
  if (!d) return 'Never';
  const days = Math.floor((Date.now() - d.getTime()) / DAY);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const m = Math.floor(days / 30);
  return m === 1 ? 'A month ago' : `${m} months ago`;
}
