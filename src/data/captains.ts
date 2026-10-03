import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useQuery } from './query';
import { PREVIEW } from './preview';
import { personOf } from './model';
import type { Person } from '../components/board/people';

// Beast Captains: a coach assigned to a community to keep its board alive with open sessions
// every week (migration 053). Members see who their captains are; a captain sees their own week.

export interface Captaincy {
  communityId: string;
  name: string;
  target: number;
  thisWeek: number;
  nextWeek: number;
}

/** Communities where the signed-in member is the captain, with this week against the target. */
export function useMyCaptaincies() {
  const { user } = useAuth();
  return useQuery<Captaincy[]>(!PREVIEW && user ? `sessions:captain:${user.id}` : null, async () => {
    const { data, error } = await supabase.rpc('my_captaincies');
    if (error) throw error;
    return (data || []).map((r: any) => ({ communityId: r.community_id, name: r.name, target: r.weekly_target, thisWeek: r.this_week, nextWeek: r.next_week }));
  });
}

/** The captains of one community. */
export function useCaptains(communityId?: string | null) {
  const { user } = useAuth();
  return useQuery<Person[]>(!PREVIEW && user && communityId ? `communities:captains:${communityId}` : null, async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase.from('community_captains').select('user_id, starts_on, ends_on').eq('community_id', communityId!);
    if (error) throw error;
    const ids = (data || []).filter((c: any) => c.starts_on <= today && (!c.ends_on || c.ends_on >= today)).map((c: any) => c.user_id);
    if (!ids.length) return [];
    const { data: people } = await supabase.from('profiles').select('id, display_name, full_name, avatar_url').in('id', ids);
    return (people || []).map(personOf).filter(Boolean) as Person[];
  });
}
