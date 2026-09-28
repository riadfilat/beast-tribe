import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useQuery, invalidate } from './query';
import { sportIdOf, SportId } from '../lib/sports';
import { uploadImage } from '../lib/upload';
import { PREVIEW, PREVIEW_ME, previewLocations, previewMySports, previewPacks, previewStats } from './preview';

function useMeId() {
  const { user } = useAuth();
  return PREVIEW ? PREVIEW_ME : user?.id ?? null;
}

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

// ─── Packs ──────────────────────────────────────────────────────────────────
export interface PackSummary {
  id: string;
  name: string;
  animal: string | null;
  members: number;
  community: string | null;
}
export function useMyPackList() {
  const me = useMeId();
  return useQuery<PackSummary[]>(me ? `member:packs:${me}` : null, async () => {
    if (PREVIEW) return previewPacks;
    const { data, error } = await supabase
      .from('pack_members')
      .select('pack:packs(id, name, animal, community:communities(name), members:pack_members(count))')
      .eq('user_id', me!);
    if (error) throw error;
    return (data || [])
      .map((r: any) => r.pack)
      .filter(Boolean)
      .map((pk: any) => ({
        id: pk.id,
        name: pk.name,
        animal: pk.animal ?? null,
        members: pk.members?.[0]?.count ?? 1,
        community: pk.community?.name ?? null,
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
export function usePopularSpots(country: string) {
  return useQuery<Spot[]>(`spots:${country}`, async () => {
    const rows: any[] = PREVIEW
      ? previewLocations
      : (
          await supabase
            .from('popular_locations')
            .select('id, name, city, country, sports, image_url, latitude, longitude, sort_order')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
        ).data || [];
    return rows
      .sort((a, b) => Number(b.country === country) - Number(a.country === country))
      .map((r) => ({
        id: r.id,
        name: r.name,
        city: r.city,
        sports: (r.sports || []).map((s: string) => sportIdOf(s)),
        imageUrl: r.image_url || null,
        lat: r.latitude != null ? Number(r.latitude) : null,
        lng: r.longitude != null ? Number(r.longitude) : null,
      }));
  });
}

// ─── Coaches (partners) ─────────────────────────────────────────────────────
export function useCoaches() {
  return useQuery<{ id: string; name: string; sports: string[]; userId: string | null }[]>('coaches', async () => {
    if (PREVIEW) return [{ id: 'c-reem', name: 'Coach Reem', sports: ['hyrox', 'crossfit', 'gym'], userId: 'p-reem' }];
    const { data, error } = await supabase.from('partners').select('id, business_name, name, sports, user_id').eq('partner_type', 'coach');
    if (error) throw error;
    return (data || []).map((c: any) => ({
      id: c.id,
      name: c.business_name || c.name || '',
      sports: (c.sports || []).map((s: string) => sportIdOf(s)),
      userId: c.user_id ?? null,
    }));
  });
}

// ─── Profile photo (persisted — it used to live only in screen state) ───────
export async function saveAvatar(meId: string, localUri: string): Promise<string> {
  if (PREVIEW) return localUri;
  const url = await uploadImage(localUri, 'user-uploads', `${meId}/avatar-${Date.now()}.jpg`, 'avatar');
  const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', meId);
  if (error) throw error;
  invalidate('sessions:');
  return url;
}
