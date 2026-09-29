import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useQuery, invalidate } from './query';
import { personOf, Session, SESSION_SELECT, toSession } from './model';
import { PREVIEW, PREVIEW_ME, previewPacks, previewSessionRows } from './preview';
import { Emblem, emblemColumns, emblemOf } from '../lib/emblem';
import type { Person } from '../components/board/people';

export const MAX_PACKS = 20;
export type PackErrorCode = 'INVALID' | 'FULL' | 'LIMIT' | 'ALREADY' | 'generic';
export class PackError extends Error {
  code: PackErrorCode;
  constructor(code: PackErrorCode) {
    super(code);
    this.code = code;
  }
}

export interface PackMember extends Person {
  role: 'leader' | 'member';
}
export interface PackDetail {
  id: string;
  name: string;
  emblem: Emblem;
  inviteCode: string | null;
  isLeader: boolean;
  /** Only the pack's creator can restyle it (packs_update_own). */
  canEdit: boolean;
  members: PackMember[];
}

export const PACK_EMBLEM_COLUMNS = 'animal, emblem_kind, emblem_value, emblem_color';

function useMe() {
  const { user } = useAuth();
  return PREVIEW ? PREVIEW_ME : user?.id ?? null;
}

const previewMembers = (packId: string): PackMember[] => {
  const names = ['Noor Al-Harbi', 'Sara Al-Qahtani', 'Majed Al-Otaibi', 'Lama K', 'Omar Haddad', 'Hessa M', 'Khalid Al-Dosari'];
  return names.slice(0, packId === 'pk-dawn' ? 4 : 7).map((name, i) => ({
    id: i === 0 ? PREVIEW_ME : `${packId}-m${i}`,
    name,
    avatarUrl: null,
    role: i === 0 ? 'leader' : 'member',
  }));
};

export function usePack(packId?: string | null) {
  const me = useMe();
  return useQuery<PackDetail | null>(packId && me ? `packs:one:${packId}` : null, async () => {
    if (PREVIEW) {
      const pk = previewPacks.find((x) => x.id === packId) ?? previewPacks[0];
      return { id: pk.id, name: pk.name, emblem: pk.emblem, inviteCode: pk.id === 'pk-dawn' ? 'DAWN77' : 'WEL319', isLeader: true, canEdit: true, members: previewMembers(pk.id) };
    }
    const [{ data: pack, error }, { data: rows }] = await Promise.all([
      supabase.from('packs').select(`id, name, invite_code, created_by, ${PACK_EMBLEM_COLUMNS}`).eq('id', packId!).maybeSingle(),
      supabase.from('pack_members').select('role, joined_at, profile:profiles(id, display_name, full_name, avatar_url)').eq('pack_id', packId!).order('joined_at', { ascending: true }),
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
      inviteCode: pack.invite_code ?? null,
      isLeader: members.some((m) => m.id === me && m.role === 'leader'),
      canEdit: !!me && pack.created_by === me,
      members,
    };
  });
}

/** Where the pack is going: upcoming sessions pack-mates joined, plus pack-only ones. */
export function usePackSessions(packId?: string | null, memberIds: string[] = []) {
  const me = useMe();
  const key = packId && me ? `sessions:pack:${packId}:${memberIds.length}` : null;
  return useQuery<Session[]>(key, async () => {
    if (PREVIEW) {
      return previewSessionRows()
        .filter((r) => ['s-yours', 's-hosting', 's-dawn-tmrw'].includes(r.id))
        .map((r) => toSession(r, me, r.id === 's-yours' || r.id === 's-hosting' ? 'going' : null));
    }
    const nowIso = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    let ids: string[] = [];
    if (memberIds.length) {
      const { data } = await supabase.from('event_rsvps').select('event_id').in('user_id', memberIds).eq('status', 'going');
      ids = Array.from(new Set((data || []).map((r: any) => r.event_id)));
    }
    let q = supabase.from('events').select(SESSION_SELECT).gte('starts_at', nowIso).is('cancelled_at', null).eq('roster.status', 'going');
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

export async function createPack(meId: string, name: string, emblem: Emblem) {
  if (PREVIEW) return { id: 'pk-andoraa' };
  const { count } = await supabase.from('pack_members').select('*', { count: 'exact', head: true }).eq('user_id', meId);
  if ((count ?? 0) >= MAX_PACKS) throw new PackError('LIMIT');
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const { data: pack, error } = await supabase
    .from('packs')
    .insert({ name: name.trim(), created_by: meId, invite_code: code, is_system: false, ...emblemColumns(emblem) })
    .select('id')
    .single();
  if (error) throw new PackError('generic');
  const { error: memberErr } = await supabase.from('pack_members').insert({ pack_id: pack.id, user_id: meId, role: 'leader' });
  if (memberErr) throw new PackError('generic');
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

export async function joinPackByCode(meId: string, code: string) {
  if (PREVIEW) return { id: 'pk-dawn', name: 'Dawn Patrol' };
  const { data: pack, error } = await supabase
    .from('packs')
    .select('id, name, max_members')
    .eq('invite_code', code.toUpperCase().trim())
    .eq('is_system', false)
    .maybeSingle();
  if (error) throw new PackError('generic');
  if (!pack) throw new PackError('INVALID');
  const [{ count: size }, { count: mine }, { data: existing }] = await Promise.all([
    supabase.from('pack_members').select('*', { count: 'exact', head: true }).eq('pack_id', pack.id),
    supabase.from('pack_members').select('*', { count: 'exact', head: true }).eq('user_id', meId),
    supabase.from('pack_members').select('id').eq('pack_id', pack.id).eq('user_id', meId).maybeSingle(),
  ]);
  if (existing) throw new PackError('ALREADY');
  if ((size ?? 0) >= (pack.max_members || 20)) throw new PackError('FULL');
  if ((mine ?? 0) >= MAX_PACKS) throw new PackError('LIMIT');
  const { error: joinErr } = await supabase.from('pack_members').insert({ pack_id: pack.id, user_id: meId, role: 'member' });
  if (joinErr) throw new PackError('generic');
  invalidate('member:packs');
  return pack;
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
  const me = useMe();
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
  if (error) throw new PackError('generic');
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
  const safe = q.replace(/[%_\\]/g, '\\$&');
  const { data } = await supabase.from('profiles').select('id, display_name, full_name, avatar_url').or(`display_name.ilike.%${safe}%,full_name.ilike.%${safe}%`).limit(12);
  return (data || []).map(personOf).filter((x: Person | null): x is Person => !!x && x.id !== excludeId);
}

export async function inviteToPack(meId: string, packId: string, userId: string) {
  if (PREVIEW) return;
  const { error } = await supabase.from('pack_invites').insert({ pack_id: packId, invited_by: meId, invited_user_id: userId, status: 'pending' });
  if (error && (error as any).code !== '23505') throw new PackError('generic');
}
