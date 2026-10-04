import { supabase } from '../lib/supabase';
import { uploadImage } from '../lib/upload';
import { useQuery, invalidate } from './query';
import { personOf, Session, SESSION_SELECT, toSession, PERSON_COLUMNS } from './model';
import { PREVIEW, previewPacks, previewSessionRows, previewPackMembers, PREVIEW_PACK_CODE } from './preview';
import { Emblem, emblemColumns, emblemOf } from '../lib/emblem';
import type { Person } from '../components/board/people';
import { CodedError, codeFrom } from './errors';
import { useMeId } from './me';

const isUuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export const MAX_PACKS = 20;
const PACK_CODES = ['PACK_CREATE_WOMEN', 'PACK_CREATE_MEN', 'PACK_WOMEN_ONLY', 'PACK_MEN_ONLY', 'PACK_GENDER_NEEDED', 'COMMUNITY_ONLY', 'TOO_MANY', 'INVALID', 'FULL', 'LIMIT', 'ALREADY'] as const;
export type PackErrorCode = (typeof PACK_CODES)[number] | 'generic';
export type PackAudience = 'everyone' | 'women' | 'men';

/** The database's reason for refusing a join, when it's one we can explain. */
const packErrorOf = (e: any): PackError => new PackError(codeFrom(e, PACK_CODES));
export class PackError extends CodedError<PackErrorCode> {}

export interface PackMember extends Person {
  role: 'leader' | 'member';
}
export interface PackDetail {
  id: string;
  name: string;
  emblem: Emblem;
  /** Only people who may invite get the code (community admins, or the leader of a personal pack). */
  inviteCode: string | null;
  canInvite: boolean;
  /** Set when the pack belongs to a community: then only its admins add people. */
  communityName: string | null;
  audience: PackAudience;
  isLeader: boolean;
  /** Only the pack's creator can restyle it (packs_update_own). */
  canEdit: boolean;
  members: PackMember[];
  /** Group photo (a small JPEG banner); every upload is checked for content that isn't allowed. */
  photoUrl: string | null;
}

export const PACK_EMBLEM_COLUMNS = 'animal, emblem_kind, emblem_value, emblem_color';

const previewMembers = (packId: string): PackMember[] => previewPackMembers(packId);

export function usePack(packId?: string | null) {
  const me = useMeId();
  return useQuery<PackDetail | null>(packId && me ? `packs:one:${packId}` : null, async () => {
    if (PREVIEW) {
      const pk = previewPacks.find((x) => x.id === packId) ?? previewPacks[0];
      return { id: pk.id, name: pk.name, emblem: pk.emblem, inviteCode: PREVIEW_PACK_CODE(pk.id), canInvite: true, communityName: null, audience: 'everyone', photoUrl: null, isLeader: true, canEdit: true, members: previewMembers(pk.id) };
    }
    const [{ data: pack, error }, { data: rows }, { data: code }] = await Promise.all([
      supabase.from('packs').select(`id, name, created_by, audience, photo_url, community:communities(name), ${PACK_EMBLEM_COLUMNS}`).eq('id', packId!).maybeSingle(),
      supabase.from('pack_members').select(`role, joined_at, profile:profiles(${PERSON_COLUMNS})`).eq('pack_id', packId!).order('joined_at', { ascending: true }),
      supabase.rpc('pack_invite_code', { p_pack: packId! }),
    ]);
    if (error) throw error;
    if (!pack) return null;
    const members: PackMember[] = (rows || [])
      .map((r: any) => {
        const person = personOf(r.profile);
        return person ? { ...person, role: r.role === 'leader' ? 'leader' : 'member' } : null;
      })
      .filter(Boolean) as PackMember[];
    return {
      id: pack.id,
      name: pack.name,
      emblem: emblemOf(pack),
      inviteCode: (code as string | null) ?? null,
      canInvite: !!code,
      communityName: (pack as any).community?.name ?? null,
      audience: ((pack as any).audience as PackAudience) || 'everyone',
      photoUrl: (pack as any).photo_url ?? null,
      isLeader: members.some((m) => m.id === me && m.role === 'leader'),
      canEdit: !!me && pack.created_by === me,
      members,
    };
  });
}

/** Where the pack is going: upcoming sessions pack-mates joined, plus pack-only ones. */
export function usePackSessions(packId?: string | null, memberIds: string[] = []) {
  const me = useMeId();
  const key = packId && me ? `sessions:pack:${packId}:${[...memberIds].sort().join(',')}` : null;
  return useQuery<Session[]>(key, async () => {
    if (PREVIEW) {
      return previewSessionRows()
        .filter((r) => ['s-yours', 's-hosting', 's-dawn-tmrw'].includes(r.id))
        .map((r) => toSession(r, me, r.id === 's-yours' || r.id === 's-hosting' ? 'going' : null));
    }
    const nowIso = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    let ids: string[] = [];
    if (memberIds.length) {
      // Only upcoming sessions, so the id list stays short however long the group has existed.
      const { data } = await supabase
        .from('event_rsvps')
        .select('event_id, event:events!inner(starts_at)')
        .in('user_id', memberIds)
        .eq('status', 'going')
        .gte('event.starts_at', nowIso)
        .limit(200);
      ids = Array.from(new Set((data || []).map((r: any) => r.event_id)));
    }
    let q = supabase.from('events').select(SESSION_SELECT).gte('starts_at', nowIso).is('cancelled_at', null).eq('roster.status', 'going');
    if (!isUuid(packId)) return [];
    q = ids.length ? q.or(`id.in.(${ids.join(',')}),pack_id.eq.${packId}`) : q.eq('pack_id', packId!);
    const { data, error } = await q.order('starts_at', { ascending: true }).limit(12);
    if (error) throw error;
    const mine = new Set<string>();
    if (me && data?.length) {
      const { data: r } = await supabase.from('event_rsvps').select('event_id').eq('user_id', me).eq('status', 'going').in('event_id', data.map((x: any) => x.id));
      (r || []).forEach((x: any) => mine.add(x.event_id));
    }
    return (data || []).map((row: any) => toSession(row, me, mine.has(row.id) ? 'going' : null)).filter((s) => s.state !== 'finished');
  });
}

/** A group lives in one of the member's communities (the general one when none is given). */
export async function createPack(meId: string, name: string, emblem: Emblem, audience: PackAudience = 'everyone', communityId: string | null = null) {
  if (PREVIEW) return { id: 'pk-andoraa' };
  const { count } = await supabase.from('pack_members').select('*', { count: 'exact', head: true }).eq('user_id', meId);
  if ((count ?? 0) >= MAX_PACKS) throw new PackError('LIMIT');
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const { data: pack, error } = await supabase
    .from('packs')
    .insert({ name: name.trim(), created_by: meId, invite_code: code, is_system: false, audience, ...(communityId ? { community_id: communityId } : {}), ...emblemColumns(emblem) })
    .select('id')
    .single();
  if (error) throw packErrorOf(error);
  const { error: memberErr } = await supabase.from('pack_members').insert({ pack_id: pack.id, user_id: meId, role: 'leader' });
  if (memberErr) {
    // The creator doesn't fit the pack's audience: don't leave an empty pack behind.
    await supabase.from('packs').delete().eq('id', pack.id);
    throw packErrorOf(memberErr);
  }
  invalidate('member:packs');
  return pack;
}

export async function updatePackEmblem(packId: string, emblem: Emblem) {
  if (PREVIEW) return;
  const { data, error } = await supabase.from('packs').update(emblemColumns(emblem)).eq('id', packId).select('id');
  if (error || !data?.length) throw new PackError('generic');
  invalidate('member:packs');
  invalidate(`packs:one:${packId}`);
}

export async function joinPackByCode(meId: string, code: string): Promise<{ id: string; name: string }> {
  if (PREVIEW) return { id: 'pk-dawn', name: 'Dawn Patrol' };
  // Packs are private to their members, so the code is checked on the server.
  const { data, error } = await supabase.rpc('join_pack_by_code', { p_code: code.trim() });
  if (error) throw packErrorOf(error);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) throw new PackError('INVALID'); // a wrong code returns no row
  invalidate('member:packs');
  return { id: row.id, name: row.name };
}

export async function leavePack(meId: string, packId: string) {
  if (PREVIEW) return;
  const { error } = await supabase.from('pack_members').delete().eq('pack_id', packId).eq('user_id', meId);
  if (error) throw new PackError('generic');
  const { count } = await supabase.from('pack_members').select('*', { count: 'exact', head: true }).eq('pack_id', packId);
  if (count === 0) await supabase.from('packs').delete().eq('id', packId).eq('is_system', false);
  invalidate('member:packs');
  invalidate('packs:');
}

export interface PackInvite {
  id: string;
  packId: string;
  packName: string;
  emblem: Emblem;
  from: string;
}
export function usePackInvites() {
  const me = useMeId();
  return useQuery<PackInvite[]>(me ? `packs:invites:${me}` : null, async () => {
    if (PREVIEW) return [];
    const { data, error } = await supabase
      .from('pack_invites')
      .select(`id, pack_id, pack:packs(name, ${PACK_EMBLEM_COLUMNS}), inviter:profiles!invited_by(display_name, full_name)`)
      .eq('invited_user_id', me!)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id,
      packId: r.pack_id,
      packName: r.pack?.name || '',
      emblem: emblemOf(r.pack),
      from: r.inviter?.display_name || r.inviter?.full_name || '',
    }));
  });
}

export async function respondToInvite(meId: string, inv: PackInvite, accept: boolean) {
  if (PREVIEW) return;
  if (!accept) {
    await supabase.from('pack_invites').update({ status: 'declined' }).eq('id', inv.id);
    invalidate('packs:invites');
    return;
  }
  const { count } = await supabase.from('pack_members').select('*', { count: 'exact', head: true }).eq('user_id', meId);
  if ((count ?? 0) >= MAX_PACKS) throw new PackError('LIMIT');
  const { error } = await supabase.from('pack_members').insert({ pack_id: inv.packId, user_id: meId, role: 'member' });
  if (error) throw packErrorOf(error);
  await supabase.from('pack_invites').update({ status: 'accepted' }).eq('id', inv.id);
  invalidate('packs:invites');
  invalidate('member:packs');
}

export async function searchMembers(query: string, excludeId?: string | null): Promise<Person[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  if (PREVIEW) {
    return [{ id: 'p-reem', name: 'Reem A' }, { id: 'p-turki', name: 'Turki B' }].filter((x) => x.name.toLowerCase().includes(q.toLowerCase()));
  }
  // Strip what PostgREST reads as filter syntax, then escape LIKE wildcards.
  const safe = q.replace(/[,()"'.:*]/g, ' ').trim().replace(/[%_\\]/g, '\\$&');
  if (safe.length < 2) return [];
  const { data } = await supabase.from('profiles').select(`${PERSON_COLUMNS}`).or(`display_name.ilike.%${safe}%,full_name.ilike.%${safe}%`).limit(12);
  return (data || []).map(personOf).filter((x: Person | null): x is Person => !!x && x.id !== excludeId);
}

export async function inviteToPack(meId: string, packId: string, userId: string) {
  if (PREVIEW) return;
  const { error } = await supabase.from('pack_invites').insert({ pack_id: packId, invited_by: meId, invited_user_id: userId, status: 'pending' });
  if (error && (error as any).code !== '23505') throw new PackError('generic');
}


/** Set or remove the group's photo. Resized to a small JPEG before upload. */
export async function setPackPhoto(meId: string, packId: string, localUri: string | null) {
  if (PREVIEW) return;
  let url: string | null = null;
  if (localUri) url = await uploadImage(localUri, 'user-uploads', `${meId}/groups/${packId}-${Date.now()}.jpg`, 'group');
  const { data, error } = await supabase.from('packs').update({ photo_url: url }).eq('id', packId).select('id');
  if (error || !data?.length) throw new PackError('generic');
  invalidate(`packs:one:${packId}`);
  invalidate('member:packs');
}
