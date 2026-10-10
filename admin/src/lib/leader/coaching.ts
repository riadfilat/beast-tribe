import { createAdminClient } from '../supabase-server';

// 1:1 coaching for a community: its coaches (partner records of type coach, linked to the community),
// their weekly free times (coach_slots) and what members booked (coach_bookings). The app lists every
// coach and books their free times from Play.

export interface Coach {
  id: string;
  userId: string | null;
  name: string;
  slots: { id: string; day: number; start: string; end: string }[];
  bookings: { date: string; start: string; who: string }[];
}

const hhmm = (t: string) => String(t || '').slice(0, 5);

export async function loadCoaches(communityId: string): Promise<Coach[]> {
  const db = createAdminClient();
  const { data: cs } = await db.from('partners').select('id, user_id, business_name, name').eq('community_id', communityId).eq('partner_type', 'coach').eq('is_active', true).order('created_at');
  const coaches = (cs || []) as any[];
  if (!coaches.length) return [];
  const ids = coaches.map((c) => c.id);
  const today = new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
  const [{ data: slots }, { data: books }] = await Promise.all([
    db.from('coach_slots').select('id, partner_id, day_of_week, start_time, end_time').in('partner_id', ids).eq('is_active', true).order('day_of_week').order('start_time'),
    db.from('coach_bookings').select('partner_id, booking_date, start_time, booked_by').in('partner_id', ids).eq('status', 'confirmed').gte('booking_date', today).order('booking_date').order('start_time').limit(200),
  ]);
  const who = [...new Set(((books || []) as any[]).map((b) => b.booked_by))];
  const { data: ps } = who.length ? await db.from('profiles').select('id, display_name, full_name').in('id', who) : { data: [] as any[] };
  const nameOf = new Map(((ps || []) as any[]).map((p) => [p.id, p.display_name || p.full_name || 'Member']));
  return coaches.map((c) => ({
    id: c.id,
    userId: c.user_id,
    name: c.business_name || c.name,
    slots: ((slots || []) as any[]).filter((s) => s.partner_id === c.id).map((s) => ({ id: s.id, day: s.day_of_week, start: hhmm(s.start_time), end: hhmm(s.end_time) })),
    bookings: ((books || []) as any[]).filter((b) => b.partner_id === c.id).map((b) => ({ date: b.booking_date, start: hhmm(b.start_time), who: nameOf.get(b.booked_by) || 'Member' })),
  }));
}
