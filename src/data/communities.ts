import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useQuery, invalidate } from './query';
import { PREVIEW, PREVIEW_ME, previewCommunities } from './preview';

// Communities are where Beast Tribe lives. OPEN ones anyone can join from Explore; PRIVATE ones
// (companies, compounds, clubs) are joined with their invite code. Members can be in several.
// The database decides what each member sees (migration 039); these hooks only shape it.

export type CommunityKind = 'club' | 'company' | 'compound' | 'city' | 'brand';
export interface Community {
  id: string;
  name: string;
  description: string | null;
  kind: CommunityKind;
  open: boolean;
  isDefault: boolean;
  city: string | null;
  logoUrl: string | null;
  members: number;
  /** Only members of a private community see its code (to invite colleagues). */
  joinCode: string | null;
  isMember: boolean;
}

export type CommunityErrorCode = 'INVALID' | 'ALREADY' | 'FULL' | 'EXPIRED' | 'generic';
export class CommunityError extends Error {
  code: CommunityErrorCode;
  constructor(code: CommunityErrorCode) {
    super(code);
    this.code = code;
  }
}
const toCommunityError = (e: any) => {
  const hit = String(e?.message || '').match(/INVALID|ALREADY|FULL|EXPIRED/);
  return new CommunityError((hit?.[0] as CommunityErrorCode) || 'generic');
};

function useMe() {
  const { user } = useAuth();
  return PREVIEW ? PREVIEW_ME : user?.id ?? null;
}

const SELECT = 'id, name, description, kind, visibility, is_default, city, logo_url, join_code, members:community_members(count)';

function toCommunity(r: any, mine: Set<string>): Community {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    kind: (r.kind || 'club') as CommunityKind,
    open: r.visibility === 'open',
    isDefault: !!r.is_default,
    city: r.city ?? null,
    logoUrl: r.logo_url ?? null,
    members: r.members?.[0]?.count ?? 0,
    joinCode: r.visibility === 'private' && mine.has(r.id) ? r.join_code ?? null : null,
    isMember: mine.has(r.id),
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
    const { data, error } = await supabase.from('communities').select(SELECT).eq('id', id!).maybeSingle();
    if (error) throw error;
    return data ? toCommunity(data, ids) : null;
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
  if (PREVIEW) return { id: 'c-andorra', name: 'Andorra Sports Tribe' };
  const { data, error } = await supabase.rpc('join_community_by_code', { p_code: code.trim() });
  if (error) throw toCommunityError(error);
  refresh();
  const row = Array.isArray(data) ? data[0] : data;
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
