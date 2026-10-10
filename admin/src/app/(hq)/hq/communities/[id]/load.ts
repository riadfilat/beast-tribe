import { createAdminClient } from '@/lib/supabase-server';
import { loadPeople } from '@/lib/leader/people';
import type { DefaultGroup } from './GroupsBox';
import type { Included } from './PerksBox';
import type { Member } from './MembersBox';

// Everything the HQ community page shows, in one round of queries.

export async function loadCommunityPage(id: string) {
  const db = createAdminClient();
  const [{ data: community }, { data: fs }, people, { data: pkg }, { data: candidates }, { data: memberRows }, { data: groups }, { data: locations }, { data: loose }, { count: memberCount }] = await Promise.all([
    db.from('communities').select('*').eq('id', id).maybeSingle(),
    db.from('community_features').select('feature').eq('community_id', id),
    loadPeople(id),
    db.from('community_partners').select('partner_id, role, perk, perk_ar, partner:partners(business_name)').eq('community_id', id),
    db.from('partners').select('id, business_name, partner_type').in('partner_type', ['nutritionist', 'coach', 'gym', 'nutrition']).eq('is_active', true).order('business_name'),
    db.from('community_members').select('joined_at, role, profile:profiles(id, display_name, full_name)').eq('community_id', id).order('joined_at', { ascending: false }).limit(500),
    db.from('packs').select('id, name, animal, emblem_kind, emblem_value, emblem_color, description').eq('community_id', id).eq('is_community_default', true).order('name'),
    db.from('popular_locations').select('id, name, city').eq('community_id', id),
    db.from('packs').select('id, name').is('community_id', null).order('name').limit(100),
    db.from('community_members').select('user_id', { count: 'exact', head: true }).eq('community_id', id),
  ]);
  if (!community) return null;

  const c = community as any;
  const { data: leader } = c.leader_id ? await db.from('profiles').select('display_name, full_name').eq('id', c.leader_id).maybeSingle() : { data: null };

  const members: Member[] = ((memberRows || []) as any[])
    .filter((r) => r.profile?.id)
    .map((r) => ({ id: r.profile.id, name: r.profile.full_name || r.profile.display_name || 'Unnamed', handle: r.profile.display_name || null, role: r.role ?? null, joined_at: r.joined_at ?? null }));

  return {
    c,
    featuresOn: new Set(((fs || []) as any[]).map((f) => f.feature as string)),
    people,
    included: (pkg || []) as unknown as Included[],
    candidates: (candidates || []) as { id: string; business_name: string; partner_type: string }[],
    members,
    memberCount: memberCount ?? members.length,
    groups: (groups || []) as DefaultGroup[],
    locations: (locations || []) as { id: string; name: string; city: string | null }[],
    looseGroups: (loose || []) as { id: string; name: string }[],
    leaderName: (leader as any)?.display_name || (leader as any)?.full_name || null,
  };
}
