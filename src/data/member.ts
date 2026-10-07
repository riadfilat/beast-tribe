import { supabase } from '../lib/supabase';
import { useQuery, invalidate, CATALOGUE } from './query';
import { sportDef, sportIdOf, SportId } from '../lib/sports';
import { removeStoredImage, uploadImage } from '../lib/upload';
import { Emblem, emblemOf } from '../lib/emblem';
import { PREVIEW, previewCoaches, previewLocations, previewMySports, previewPacks, previewStats } from './preview';
import { useMeId } from './me';

// ─── Facts about showing up (not points) ────────────────────────────────────
export interface MemberStats {
  attended: number;
  hosted: number;
  met: number;
}
export function useMyStats() {
  const me = useMeId();
  return useQuery<MemberStats>(me ? `member:stats:${me}` : null, async () => {
    if (PREVIEW) return previewStats;
    const { data, error } = await supabase.rpc('my_stats');
    if (error) throw error;
    return { attended: Number(data?.attended ?? 0), hosted: Number(data?.hosted ?? 0), met: Number(data?.met ?? 0) };
  });
}

// ─── Sports the member picked in onboarding ─────────────────────────────────
export function useMySports() {
  const me = useMeId();
  return useQuery<SportId[]>(me ? `member:sports:${me}` : null, async () => {
    if (PREVIEW) return previewMySports as SportId[];
    const { data, error } = await supabase.from('user_sports').select('sport:sports(name)').eq('user_id', me!);
    if (error) throw error;
    const ids = (data || []).map((r: any) => sportIdOf(r.sport?.name)).filter((s: SportId) => s !== 'other');
    return Array.from(new Set(ids));
  });
}

export async function saveMySports(meId: string, ids: string[]) {
  if (PREVIEW) return invalidate('member:sports');
  const names = Array.from(new Set(ids.map((id) => sportDef(id).dbName).filter(Boolean))) as string[];
  let sportIds: string[] = [];
  if (names.length) {
    const { data, error } = await supabase.from('sports').select('id').in('name', names);
    if (error) throw error;
    sportIds = (data || []).map((r: any) => r.id);
  }
  const { error: delErr } = await supabase.from('user_sports').delete().eq('user_id', meId);
  if (delErr) throw delErr;
  if (sportIds.length) {
    const { error } = await supabase.from('user_sports').insert(sportIds.map((sport_id) => ({ user_id: meId, sport_id })));
    if (error) throw error;
  }
  invalidate('member:sports');
}

// ─── Community (assigned in the admin) ──────────────────────────────────────
// ─── Packs ──────────────────────────────────────────────────────────────────
export interface PackSummary {
  id: string;
  name: string;
  emblem: Emblem;
  members: number;
  community: string | null;
  communityId: string | null;
}
export function useMyPackList() {
  const me = useMeId();
  return useQuery<PackSummary[]>(me ? `member:packs:${me}` : null, async () => {
    if (PREVIEW) return previewPacks;
    const { data, error } = await supabase
      .from('pack_members')
      .select('pack:packs(id, name, animal, emblem_kind, emblem_value, emblem_color, community:communities(id, name), members:pack_members(count))')
      .eq('user_id', me!);
    if (error) throw error;
    return (data || [])
      .map((r: any) => r.pack)
      .filter(Boolean)
      .map((pk: any) => ({
        id: pk.id,
        name: pk.name,
        emblem: emblemOf(pk),
        members: pk.members?.[0]?.count ?? 1,
        community: pk.community?.name ?? null,
        communityId: pk.community?.id ?? null,
      }));
  });
}

// ─── Popular spots curated in the admin ─────────────────────────────────────
export interface Spot {
  id: string;
  name: string;
  city: string;
  sports: string[];
  imageUrl: string | null;
  lat: number | null;
  lng: number | null;
}
export function usePopularSpots(country: string, lang: string = 'en') {
  return useQuery<Spot[]>(`spots:${country}:${lang}`, async () => {
    const rows: any[] = PREVIEW
      ? previewLocations
      : (
          await supabase
            .from('popular_locations')
            .select('id, name, name_ar, city, country, sports, image_url, latitude, longitude, sort_order')
            .eq('is_active', true)
            // A place without a photo isn't shown anywhere.
            .not('image_url', 'is', null)
            .order('sort_order', { ascending: true })
        ).data || [];
    return rows
      .filter((r) => !!r.image_url)
      .sort((a, b) => Number(b.country === country) - Number(a.country === country))
      .map((r) => ({
        id: r.id,
        name: (lang === 'ar' && r.name_ar) || r.name,
        city: r.city,
        sports: (r.sports || []).map((s: string) => sportIdOf(s)),
        imageUrl: r.image_url || null,
        lat: r.latitude != null ? Number(r.latitude) : null,
        lng: r.longitude != null ? Number(r.longitude) : null,
      }));
  }, CATALOGUE);
}

// ─── Coaches (partners) ─────────────────────────────────────────────────────
export function useCoaches() {
  return useQuery<{ id: string; name: string; sports: string[]; userId: string | null }[]>('coaches', async () => {
    if (PREVIEW) return previewCoaches;
    const { data, error } = await supabase.from('partners').select('id, business_name, name, sports, user_id').eq('partner_type', 'coach');
    if (error) throw error;
    return (data || []).map((c: any) => ({
      id: c.id,
      name: c.business_name || c.name || '',
      sports: (c.sports || []).map((s: string) => sportIdOf(s)),
      userId: c.user_id ?? null,
    }));
  }, CATALOGUE);
}

// ─── Profile photo (persisted — it used to live only in screen state) ───────
export async function saveAvatar(meId: string, localUri: string): Promise<string> {
  if (PREVIEW) return localUri;
  const { data: before } = await supabase.from('profiles').select('avatar_url').eq('id', meId).maybeSingle();
  const url = await uploadImage(localUri, 'user-uploads', `${meId}/avatar-${Date.now()}.jpg`, 'avatar');
  const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', meId);
  if (error) {
    removeStoredImage(url);
    throw error;
  }
  // The old photo isn't used any more.
  if (before?.avatar_url && before.avatar_url !== url) removeStoredImage(before.avatar_url);
  invalidate('sessions:');
  return url;
}
