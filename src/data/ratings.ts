import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useQuery, invalidate } from './query';
import { PREVIEW } from './preview';

// Private level ratings (migration 059). After a session, the people who were there rate each
// other's level in that sport. Nobody can read ratings, including the person rated; they only
// feed the level used for matching. A member can see the ratings they gave, to change them.

export type Level = 1 | 2 | 3 | 4;
export const LEVELS: Level[] = [1, 2, 3, 4];

export interface ToRate {
  eventId: string;
  title: string;
  sport: string;
  endedAt: Date;
  people: number;
}

/** Sessions from the last three days with people I haven't rated yet. */
export function useSessionsToRate() {
  const { user } = useAuth();
  return useQuery<ToRate[]>(!PREVIEW && user ? `ratings:todo:${user.id}` : null, async () => {
    const { data, error } = await supabase.rpc('sessions_to_rate');
    if (error) throw error;
    return ((data as any[]) || []).map((r) => ({ eventId: r.event_id, title: r.title, sport: r.sport, endedAt: new Date(r.ended_at), people: r.people }));
  });
}

/** The ratings I gave in one session, by person. */
export function useMyGivenRatings(eventId: string | null) {
  const { user } = useAuth();
  return useQuery<Record<string, Level>>(!PREVIEW && user && eventId ? `ratings:given:${eventId}` : null, async () => {
    const { data, error } = await supabase.rpc('my_level_ratings', { p_event: eventId });
    if (error) throw error;
    const out: Record<string, Level> = {};
    ((data as any[]) || []).forEach((r) => (out[r.user_id] = r.level as Level));
    return out;
  });
}

export async function ratePlayers(eventId: string, ratings: Record<string, Level>) {
  if (PREVIEW) return;
  const list = Object.entries(ratings).map(([user_id, level]) => ({ user_id, level }));
  const { error } = await supabase.rpc('rate_players', { p_event: eventId, p_ratings: list });
  if (error) throw error;
  invalidate('ratings:');
}

/** Sessions where a level means something (not a social meet-up). */
export const rateable = (sport: string) => !!sport && sport !== 'community' && sport !== 'other';
