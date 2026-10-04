import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useQuery, invalidate } from './query';
import { PREVIEW, PREVIEW_COMPANY, PREVIEW_ME, previewCommunities } from './preview';

// Communities are where Beast Tribe lives. OPEN ones anyone can join from Explore; PRIVATE ones
// (companies, compounds, clubs) are joined with their invite code. Members can be in several.
// The database decides what each member sees (migration 039); these hooks only shape it.

export type CommunityKind = 'club' | 'gym' | 'company' | 'compound' | 'city' | 'brand';
export interface Community {
  id: string;
  name: string;
  description: string | null;
  kind: CommunityKind;
  open: boolean;
  isDefault: boolean;
  /** Hosts may let guests join their sessions with the session's link. */
  allowGuests?: boolean;
  city: string | null;
  logoUrl: string | null;
  members: number;
  /** Only members of a private community see its code (to invite colleagues). */
  joinCode: string | null;
  isMember: boolean;
  /** A member-run club (run club, padel group): its leader. */
  leaderId: string | null;
  leaderName: string | null;
  sport: string | null;
  listing: 'invite' | 'public';
  verified: boolean;
  notice: string | null;
}

export type CommunityErrorCode = 'INVALID' | 'ALREADY' | 'FULL' | 'EXPIRED' | 'TOO_MANY' | 'generic';
export class CommunityError extends Error {
  code: CommunityErrorCode;
  constructor(code: CommunityErrorCode) {
    super(code);
    this.code = code;
  }
}
const toCommunityError = (e: any) => {
  const hit = String(e?.message || '').match(/INVALID|ALREADY|FULL|EXPIRED|TOO_MANY/);
  return new CommunityError((hit?.[0] as CommunityErrorCode) || 'generic');
};

function useMe() {
  const { user } = useAuth();
  return PREVIEW ? PREVIEW_ME : user?.id ?? null;
}

const SELECT = 'id, name, description, kind, visibility, is_default, city, logo_url, leader_id, sport, listing, verified_at, notice, allow_guests, members:community_members(count)';

function toCommunity(r: any, mine: Set<string>): Community {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    kind: (r.kind || 'club') as CommunityKind,
    open: r.visibility === 'open',
    isDefault: !!r.is_default,
    allowGuests: r.allow_guests !== false,
    city: r.city ?? null,
    logoUrl: r.logo_url ?? null,
    members: r.members?.[0]?.count ?? 0,
    // Only community admins get the code (community_invite_code); members ask an admin to invite.
    joinCode: null,
    isMember: mine.has(r.id),
    leaderId: r.leader_id ?? null,
    leaderName: null,
    sport: r.sport ?? null,
    listing: r.listing === 'public' ? 'public' : 'invite',
    verified: !!r.verified_at,
    notice: r.notice ?? null,
  };
}

async function myIds(me: string) {
  const { data, error } = await supabase.from('community_members').select('community_id').eq('user_id', me);
  if (error) throw error;
  return new Set((data || []).map((r: any) => r.community_id as string));
}

/** Every community I'm in: private ones first, then open ones, the default last. */
export function useMyCommunities() {
  const me = useMe();
  return useQuery<Community[]>(me ? `communities:mine:${me}` : null, async () => {
    if (PREVIEW) return previewCommunities.filter((c) => c.isMember);
    const ids = await myIds(me!);
    if (!ids.size) return [];
    const { data, error } = await supabase.from('communities').select(SELECT).in('id', Array.from(ids));
    if (error) throw error;
    return (data || [])
      .map((r) => toCommunity(r, ids))
      .sort((a, b) => Number(a.open) - Number(b.open) || Number(a.isDefault) - Number(b.isDefault) || a.name.localeCompare(b.name));
  });
}

/** Open communities I haven't joined yet. */
export function useOpenCommunities() {
  const me = useMe();
  return useQuery<Community[]>(me ? `communities:open:${me}` : null, async () => {
    if (PREVIEW) return previewCommunities.filter((c) => c.open && !c.isMember);
    const ids = await myIds(me!);
    const { data, error } = await supabase.from('communities').select(SELECT).eq('visibility', 'open').eq('is_active', true).order('name');
    if (error) throw error;
    return (data || []).map((r) => toCommunity(r, ids)).filter((c) => !c.isMember);
  });
}

export function useCommunity(id?: string | null) {
  const me = useMe();
  return useQuery<Community | null>(id && me ? `communities:one:${id}` : null, async () => {
    if (PREVIEW) return previewCommunities.find((c) => c.id === id) ?? null;
    const ids = await myIds(me!);
    const [{ data, error }, { data: code }] = await Promise.all([
      supabase.from('communities').select(SELECT).eq('id', id!).maybeSingle(),
      supabase.rpc('community_invite_code', { p_community: id! }),
    ]);
    if (error) throw error;
    if (!data) return null;
    let leaderName: string | null = null;
    if (data.leader_id) {
      const { data: lp } = await supabase.from('profiles').select('display_name, full_name').eq('id', data.leader_id).maybeSingle();
      leaderName = lp?.display_name || lp?.full_name || null;
    }
    return { ...toCommunity(data, ids), joinCode: (code as string | null) ?? null, leaderName };
  });
}

function refresh() {
  invalidate('communities:');
  invalidate('sessions:');
  invalidate('feed');
  invalidate('member:packs');
  invalidate('spots:');
}

export async function joinCommunityByCode(code: string): Promise<{ id: string; name: string }> {
  if (PREVIEW) return PREVIEW_COMPANY;
  const { data, error } = await supabase.rpc('join_community_by_code', { p_code: code.trim() });
  if (error) throw toCommunityError(error);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) throw new CommunityError('INVALID'); // a wrong code returns no row
  refresh();
  return { id: row.id, name: row.name };
}

export async function joinOpenCommunity(id: string) {
  if (PREVIEW) return;
  const { error } = await supabase.rpc('join_open_community', { p_id: id });
  if (error) throw toCommunityError(error);
  refresh();
}

export async function leaveCommunity(meId: string, id: string) {
  if (PREVIEW) return;
  const { error } = await supabase.from('community_members').delete().eq('community_id', id).eq('user_id', meId);
  if (error) throw toCommunityError(error);
  refresh();
}
