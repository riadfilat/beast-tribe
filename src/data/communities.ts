import { supabase } from '../lib/supabase';
import { useQuery, invalidate } from './query';
import { PREVIEW, PREVIEW_COMPANY, previewCommunities } from './preview';
import { CodedError, codeFrom } from './errors';
import { useHereCity, useMeId } from './me';
import { cityKey, cityKeys } from '../lib/cities';

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
  /** The leader's photo, on the Community leaders list. */
  leaderAvatar?: string | null;
  sport: string | null;
  listing: 'invite' | 'public';
  verified: boolean;
  notice: string | null;
}

const COMMUNITY_CODES = ['INVALID', 'ALREADY', 'FULL', 'EXPIRED', 'TOO_MANY'] as const;
export type CommunityErrorCode = (typeof COMMUNITY_CODES)[number] | 'generic';
export class CommunityError extends CodedError<CommunityErrorCode> {}
const toCommunityError = (e: any) => new CommunityError(codeFrom(e, COMMUNITY_CODES));

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
  const me = useMeId();
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

/**
 * Communities belong where they meet: a member sees the ones in the city they're in now (from the
 * phone, else their profile), plus any without a city. Unknown city: all of them.
 */
function inCity(here: string | null) {
  const keys = cityKeys(here);
  return (c: Community) => !keys.length || !c.city || keys.includes(cityKey(c.city));
}

/** Open communities I haven't joined yet, in the city I'm in. */
export function useOpenCommunities() {
  const me = useMeId();
  const here = useHereCity();
  return useQuery<Community[]>(me ? `communities:open:${me}:${cityKey(here)}` : null, async () => {
    if (PREVIEW) return previewCommunities.filter((c) => c.open && !c.isMember).filter(inCity(here));
    const ids = await myIds(me!);
    const { data, error } = await supabase.from('communities').select(SELECT).eq('visibility', 'open').eq('is_active', true).order('name');
    if (error) throw error;
    return (data || []).map((r) => toCommunity(r, ids)).filter((c) => !c.isMember).filter(inCity(here));
  });
}

export function useCommunity(id?: string | null) {
  const me = useMeId();
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

/**
 * Communities run by a leader (a run club, a riding stable, a creator) that Beast Tribe verified and
 * listed: open to anyone with one tap. Joined ones stay on the list so members see they're in.
 */
export function useLeaderCommunities() {
  const me = useMeId();
  const here = useHereCity();
  return useQuery<Community[]>(me ? `communities:leaders:${me}:${cityKey(here)}` : null, async () => {
    if (PREVIEW) return previewCommunities.filter((c) => c.leaderId && c.open).filter(inCity(here));
    const [ids, { data, error }] = await Promise.all([
      myIds(me!),
      supabase.from('communities').select(SELECT).eq('visibility', 'open').eq('is_active', true).not('leader_id', 'is', null).not('verified_at', 'is', null).limit(200),
    ]);
    if (error) throw error;
    // Clubs I'm in stay wherever I am; others only in my city.
    const near = inCity(here);
    const rows = (data || []).map((r) => toCommunity(r, ids)).filter((c) => c.isMember || near(c));
    const leaderIds = Array.from(new Set(rows.map((c) => c.leaderId!)));
    if (leaderIds.length) {
      const { data: people } = await supabase.from('profiles').select('id, display_name, full_name, avatar_url').in('id', leaderIds);
      const byId = new Map((people || []).map((x: any) => [x.id as string, x]));
      for (const c of rows) {
        const lp: any = byId.get(c.leaderId!);
        c.leaderName = lp?.display_name || lp?.full_name || null;
        c.leaderAvatar = lp?.avatar_url ?? null;
      }
    }
    // Biggest first, so a new member lands on the clubs people actually turn up to.
    return rows.sort((a, b) => b.members - a.members || a.name.localeCompare(b.name));
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
