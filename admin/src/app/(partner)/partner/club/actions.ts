'use server';

import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase-server';
import { requirePartner, type PartnerUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const SEATS: Record<string, number | null> = { studio: 300, club: 1500, multi: null };

async function requireGym(): Promise<PartnerUser> {
  const partner = await requirePartner();
  if (partner.partner_type !== 'gym') throw new Error('Only gyms can do this');
  return partner;
}

function slugify(raw: string) {
  return raw.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'club';
}

/** Create the gym's private club (members join with its code) and link it to the gym. */
export async function createClub() {
  const partner = await requireGym();
  if (partner.community_id) redirect('/partner/club');
  const db = createAdminClient();
  const { data: p } = await db.from('partners').select('city, country, description, logo_url').eq('id', partner.partner_id).single();

  const base = partner.business_name.trim();
  let community: any = null;
  for (const name of [base, `${base} Club`, `${base} Club ${Math.random().toString(36).slice(2, 5).toUpperCase()}`]) {
    const { data, error } = await db
      .from('communities')
      .insert({
        name,
        slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`,
        description: (p as any)?.description || null,
        logo_url: (p as any)?.logo_url || null,
        city: (p as any)?.city || null,
        country: (p as any)?.country || 'SA',
        kind: 'gym',
        visibility: 'private',
        is_active: true,
        seat_limit: partner.plan ? (SEATS[partner.plan] ?? null) : 300,
      })
      .select('id')
      .single();
    if (!error) {
      community = data;
      break;
    }
    if (!/duplicate|unique/i.test(error.message)) throw new Error(error.message);
  }
  if (!community) throw new Error('Could not create the club, please try again');

  const { error: linkErr } = await db.from('partners').update({ community_id: community.id }).eq('id', partner.partner_id);
  if (linkErr) throw new Error(linkErr.message);
  // The owner sits in the club as its admin (they can post as the club in the app).
  await db.from('community_members').upsert({ community_id: community.id, user_id: partner.id, role: 'admin' }, { onConflict: 'community_id,user_id' });

  revalidatePath('/partner/club');
  redirect('/partner/club');
}

/** New invite code; the old one stops working. The communities trigger fills a fresh code. */
export async function newClubCode() {
  const partner = await requireGym();
  if (!partner.community_id) return;
  const db = createAdminClient();
  const { error } = await db.from('communities').update({ join_code: null }).eq('id', partner.community_id);
  if (error) throw new Error(error.message);
  revalidatePath('/partner/club');
  revalidatePath('/partner/members');
}

/** Schedule a class, optionally repeating weekly. Times are Riyadh time. */
export async function createClass(formData: FormData) {
  const partner = await requireGym();
  if (!partner.community_id) throw new Error('Create your club first');
  const db = createAdminClient();
  const str = (k: string) => ((formData.get(k) as string) || '').trim();

  const title = str('title');
  const date = str('date');
  const time = str('time');
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw new Error('Title, date and time are needed');
  const duration = Math.min(480, Math.max(10, parseInt(str('duration')) || 60));
  const capacity = parseInt(str('capacity')) || null;
  const weeks = Math.min(12, Math.max(1, parseInt(str('repeat')) || 1));
  const first = new Date(`${date}T${time}:00+03:00`);
  if (isNaN(first.getTime())) throw new Error('That date or time is not valid');
  if (first.getTime() < Date.now() - 3600000) throw new Error('Pick a time in the future');

  const { data: p } = await db.from('partners').select('city, country, address').eq('id', partner.partner_id).single();
  const series = weeks > 1 ? randomUUID() : null;
  const rows = Array.from({ length: weeks }, (_, i) => {
    const starts = new Date(first.getTime() + i * 7 * 86400000);
    const ends = new Date(starts.getTime() + duration * 60000);
    return {
      title,
      description: str('description') || null,
      event_type: 'gym_class',
      sport_id: str('sport_id') || null,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      max_capacity: capacity,
      location_name: str('location_name') || partner.business_name,
      location_city: (p as any)?.city || null,
      country: (p as any)?.country || 'SA',
      coach_name: str('coach_name') || null,
      gym_name: partner.business_name,
      difficulty: str('difficulty') || null,
      is_women_only: formData.get('is_women_only') === 'on',
      created_by: partner.id,
      partner_id: partner.partner_id,
      community_id: partner.community_id,
      visibility: 'community',
      is_class: true,
      class_series_id: series,
    };
  });
  const { error } = await db.from('events').insert(rows);
  if (error) throw new Error(error.message);

  revalidatePath('/partner/classes');
  revalidatePath('/partner/club');
  redirect('/partner/classes?created=' + weeks);
}

async function ownedEvent(partner: PartnerUser, eventId: string) {
  const db = createAdminClient();
  const { data: e } = await db.from('events').select('id, title, partner_id, community_id, created_by, class_series_id, starts_at, cancelled_at').eq('id', eventId).single();
  if (!e) throw new Error('Class not found');
  const mine = (e as any).partner_id === partner.partner_id || (partner.community_id && (e as any).community_id === partner.community_id && (e as any).created_by === partner.id);
  if (!mine) throw new Error('Not your class');
  return e as any;
}

/** Cancel one class or every upcoming class in its weekly series; booked members are notified. */
export async function cancelClass(eventId: string, formData: FormData) {
  const partner = await requireGym();
  const e = await ownedEvent(partner, eventId);
  const db = createAdminClient();
  const scope = formData.get('scope') === 'series' && e.class_series_id ? 'series' : 'one';
  const reason = ((formData.get('reason') as string) || '').trim() || null;

  let q = db.from('events').select('id, title').is('cancelled_at', null);
  q = scope === 'series' ? q.eq('class_series_id', e.class_series_id).gte('starts_at', e.starts_at) : q.eq('id', eventId);
  const { data: targets } = await q;
  for (const t of (targets || []) as any[]) {
    await db.from('events').update({ cancelled_at: new Date().toISOString(), cancel_reason: reason }).eq('id', t.id);
    const { data: booked } = await db.from('event_rsvps').select('user_id').eq('event_id', t.id).in('status', ['going', 'waitlist']);
    const ids = (booked || []).map((b: any) => b.user_id);
    if (ids.length) {
      await db.rpc('bt_notify', { p_user_ids: ids, p_type: 'event_cancelled', p_actor: partner.id, p_data: { event_id: t.id, event_title: t.title } });
    }
  }
  revalidatePath('/partner/classes');
  revalidatePath('/partner/club');
  redirect('/partner/classes');
}

/** Mark whether a booked member actually came. */
export async function setAttendance(eventId: string, userId: string, came: boolean) {
  const partner = await requireGym();
  await ownedEvent(partner, eventId);
  const db = createAdminClient();
  const { error } = await db
    .from('event_rsvps')
    .update({ attended_at: came ? new Date().toISOString() : null })
    .eq('event_id', eventId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  revalidatePath(`/partner/classes/${eventId}`);
}

/** Everyone booked came: one tap after a full class. */
export async function markAllAttended(eventId: string) {
  const partner = await requireGym();
  await ownedEvent(partner, eventId);
  const db = createAdminClient();
  const { error } = await db
    .from('event_rsvps')
    .update({ attended_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('status', 'going')
    .is('attended_at', null);
  if (error) throw new Error(error.message);
  revalidatePath(`/partner/classes/${eventId}`);
}

