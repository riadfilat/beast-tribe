import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useQuery } from './query';
import { PREVIEW } from './preview';

// What each person owes for a session (migration 060): a guest price for a class outside your own
// community, or your share of a booked court. Members can only read these. Today the venue marks
// a payment when it is made at the desk; online payment will mark it the same way.

export interface Due {
  userId: string;
  kind: 'guest' | 'share';
  amount: number;
  paid: boolean;
}

/** "60" or "62.50": whole amounts without decimals. */
export const money = (n: number) => (Math.round(n * 100) % 100 === 0 ? String(Math.round(n)) : n.toFixed(2));

/** My own due, and everyone's when I organised the session. */
export function useSessionDues(eventId?: string | null) {
  const { user } = useAuth();
  return useQuery<Due[]>(!PREVIEW && user && eventId ? `sessions:dues:${eventId}` : null, async () => {
    const { data, error } = await supabase.from('session_dues').select('user_id, kind, amount_sar, paid_at').eq('event_id', eventId!);
    if (error) throw error;
    return (data || []).map((r: any) => ({ userId: r.user_id, kind: r.kind, amount: Number(r.amount_sar), paid: !!r.paid_at }));
  });
}
