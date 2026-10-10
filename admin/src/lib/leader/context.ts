import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createAdminClient } from '../supabase-server';
import { getSessionUser, getTwoStep, userSupabase } from '../auth';
import type { Feature, TeamRole } from './features';

// Who is using the leader dashboard, for which community, with which features on.
// The database decides roles (bt_team_role, my_teams); this only reads them.

export const COMMUNITY_COOKIE = 'bt_community';

export interface TeamCommunity {
  id: string;
  name: string;
  role: TeamRole;
}

export interface LeaderCtx {
  userId: string;
  email: string;
  name: string;
  role: TeamRole;
  isLeader: boolean;
  /** Every community this person leads or supports, for the switcher. */
  teams: TeamCommunity[];
  community: {
    id: string;
    name: string;
    city: string | null;
    kind: string | null;
    description: string | null;
    logo_url: string | null;
    join_code: string | null;
    visibility: string | null;
  };
  features: Set<Feature>;
  /** The community's business record (courts, coaching, plan), when it has one. */
  businessId: string | null;
}

/** The communities this person leads or supports (empty for everyone else). */
export const myTeams = cache(async (): Promise<TeamCommunity[]> => {
  const { data } = await (await userSupabase()).rpc('my_teams');
  return ((data || []) as any[]).map((t) => ({ id: t.community_id, name: t.name, role: t.role }));
});

export const requireTeam = cache(async (): Promise<LeaderCtx> => {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const step = await getTwoStep();
  if (step.enrolled && !step.verified) redirect('/login/verify');

  const teams = await myTeams();
  if (!teams.length) redirect('/login?error=no_community');
  const chosen = (await cookies()).get(COMMUNITY_COOKIE)?.value;
  const team = teams.find((t) => t.id === chosen) ?? teams[0];

  const db = createAdminClient();
  const [{ data: c }, { data: fs }, { data: biz }, { data: p }] = await Promise.all([
    db.from('communities').select('id, name, city, kind, description, logo_url, join_code, visibility').eq('id', team.id).single(),
    db.from('community_features').select('feature').eq('community_id', team.id),
    db.from('partners').select('id').eq('community_id', team.id).neq('partner_type', 'coach').eq('is_active', true).order('created_at').limit(1).maybeSingle(),
    db.from('profiles').select('full_name, display_name').eq('id', user.id).maybeSingle(),
  ]);
  if (!c) redirect('/login?error=no_community');

  return {
    userId: user.id,
    email: user.email || '',
    name: (p as any)?.display_name || (p as any)?.full_name || 'Leader',
    role: team.role,
    isLeader: team.role === 'leader',
    teams,
    community: c as LeaderCtx['community'],
    features: new Set(((fs || []) as any[]).map((f) => f.feature as Feature)),
    businessId: (biz as any)?.id ?? null,
  };
});

/** Leader-only actions and pages (prices, courts, features, supporters). */
export async function requireLeader(): Promise<LeaderCtx> {
  const ctx = await requireTeam();
  if (!ctx.isLeader) redirect('/leader');
  return ctx;
}
