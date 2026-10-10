'use server';

import { randomUUID } from 'crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase-server';
import { userSupabase } from '@/lib/auth';
import { requireTeam } from '@/lib/leader/context';
import { loadSports } from '@/lib/leader/overview';

// Posting and running sessions from the leader dashboard. A session lands in the same table the
// app uses, with the same rules (women-only hosts, court bookings…), so it shows in the app at once.

export type FormState = { error?: string } | undefined;

const FRIENDLY: [RegExp, string][] = [
  [/WOMEN_ONLY_HOST/, 'A women-only session has to be posted by a woman. Ask a female leader or supporter to post it.'],
  [/MEN_ONLY_HOST/, 'A men-only session has to be posted by a man.'],
  [/COURT|FACILITY/i, 'That court time is taken or closed. Pick another time.'],
];
const friendly = (m: string) => FRIENDLY.find(([re]) => re.test(m))?.[1] ?? 'Something went wrong saving the session. Please try again.';

export async function createSession(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireTeam();
  const str = (k: string, max = 120) => String(formData.get(k) ?? '').trim().slice(0, max);
  const sports = await loadSports();
  const sport = sports.find((s) => s.slug === str('sport'));
  if (!sport) return { error: 'Pick a sport.' };
  const title = str('title') || `${sport.name} with ${ctx.name.split(' ')[0]}`;

  const date = str('date');
  const time = str('time');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return { error: 'Pick a day and a time.' };
  const first = new Date(`${date}T${time}:00+03:00`);
  if (isNaN(first.getTime()) || first.getTime() < Date.now() + 5 * 60000) return { error: 'Pick a time in the future.' };
  const minutes = Math.min(480, Math.max(15, parseInt(str('duration')) || 60));
  const spots = Math.min(500, Math.max(2, parseInt(str('spots')) || 10));
  const weeks = Math.min(12, Math.max(1, parseInt(str('repeat')) || 1));
  const level = ['easy', 'medium', 'hard'].includes(str('level')) ? str('level') : null;
  const open = str('who') === 'public';
  const gender = str('gender');

  // Money is set by leaders only (supporters never see prices).
  const paid = ctx.isLeader && str('price') === 'paid';
  const price = paid ? Math.round(parseFloat(str('fee')) * 100) / 100 : null;
  if (paid && !(price! > 0 && price! <= 5000)) return { error: 'Enter a price per player between 1 and 5,000 SAR.' };
  const guests = ctx.isLeader && !open && ctx.features.has('guests') && formData.get('guests') === 'on';
  const guestSpots = guests ? Math.min(spots, Math.max(1, parseInt(str('guest_spots')) || 2)) : null;
  const guestPrice = guests ? Math.round(parseFloat(str('guest_fee') || '0') * 100) / 100 : null;
  if (guests && !(guestPrice! >= 0 && guestPrice! <= 5000)) return { error: 'The guest fee is not valid.' };

  const series = weeks > 1 ? randomUUID() : null;
  const rows = Array.from({ length: weeks }, (_, i) => {
    const starts = new Date(first.getTime() + i * 7 * 86400000);
    return {
      title,
      description: str('notes', 1000) || null,
      event_type: sport.slug,
      sport_id: sport.id,
      starts_at: starts.toISOString(),
      ends_at: new Date(starts.getTime() + minutes * 60000).toISOString(),
      max_capacity: spots,
      location_name: str('place') || ctx.community.name,
      location_city: ctx.community.city,
      difficulty: level,
      is_women_only: gender === 'women',
      is_men_only: gender === 'men',
      created_by: ctx.userId,
      partner_id: ctx.businessId,
      community_id: ctx.community.id,
      visibility: 'community',
      is_class: true,
      class_series_id: series,
      price_sar: price,
      // "Everyone in the city": open to all, each pays the same price. Guest passes: a few outside spots.
      guest_open: open || guests,
      guest_spots: open ? null : guestSpots,
      guest_price_sar: open ? price : guestPrice && guestPrice > 0 ? guestPrice : null,
    };
  });
  const { error } = await createAdminClient().from('events').insert(rows);
  if (error) return { error: friendly(error.message) };

  revalidatePath('/leader');
  revalidatePath('/leader/sessions');
  redirect(`/leader/sessions?posted=${weeks}`);
}

async function teamEvent(eventId: string) {
  const ctx = await requireTeam();
  const { data: e } = await createAdminClient().from('events').select('id, title, community_id, created_by, class_series_id, starts_at, cancelled_at').eq('id', eventId).maybeSingle();
  if (!e || (e as any).community_id !== ctx.community.id) throw new Error('This session is not in your community');
  return { ctx, e: e as any };
}

/** Cancel one session or the rest of its weekly series; everyone booked is told. Supporters cancel their own. */
export async function cancelSession(eventId: string, formData: FormData) {
  const { ctx, e } = await teamEvent(eventId);
  if (!ctx.isLeader && e.created_by !== ctx.userId) throw new Error('Only leaders can cancel sessions posted by someone else');
  const db = createAdminClient();
  let q = db.from('events').select('id, title').is('cancelled_at', null);
  q = formData.get('scope') === 'series' && e.class_series_id ? q.eq('class_series_id', e.class_series_id).gte('starts_at', e.starts_at) : q.eq('id', eventId);
  const list = ((await q).data || []) as { id: string; title: string }[];
  if (list.length) {
    const ids = list.map((x) => x.id);
    await db.from('events').update({ cancelled_at: new Date().toISOString(), cancel_reason: String(formData.get('reason') || '').trim().slice(0, 200) || null }).in('id', ids);
    const { data: booked } = await db.from('event_rsvps').select('event_id, user_id').in('event_id', ids).in('status', ['going', 'waitlist']);
    const by = new Map<string, string[]>();
    for (const b of (booked || []) as any[]) by.set(b.event_id, [...(by.get(b.event_id) ?? []), b.user_id]);
    await Promise.all(list.filter((x) => by.has(x.id)).map((x) => db.rpc('bt_notify', { p_user_ids: by.get(x.id), p_type: 'event_cancelled', p_actor: ctx.userId, p_data: { event_id: x.id, event_title: x.title } })));
  }
  revalidatePath('/leader');
  revalidatePath('/leader/sessions');
  redirect('/leader/sessions');
}

/** Tick whether a player came (leaders and supporters). */
export async function setCame(eventId: string, userId: string, came: boolean) {
  await teamEvent(eventId);
  await createAdminClient().from('event_rsvps').update({ attended_at: came ? new Date().toISOString() : null }).eq('event_id', eventId).eq('user_id', userId);
  revalidatePath(`/leader/sessions/${eventId}`);
}

/** Tick that a player paid at the venue. The database allows leaders only (set_player_paid). */
export async function setPaid(eventId: string, userId: string, paid: boolean) {
  await teamEvent(eventId);
  const { error } = await (await userSupabase()).rpc('set_player_paid', { p_event: eventId, p_user: userId, p_paid: paid });
  if (error) throw new Error(error.message);
  revalidatePath(`/leader/sessions/${eventId}`);
  revalidatePath('/leader');
}
