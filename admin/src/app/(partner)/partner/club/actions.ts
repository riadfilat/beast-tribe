'use server';

import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase-server';
import { ownsCommunity, requirePartner, type PartnerUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const SEATS: Record<string, number | null> = { studio: 300, club: 1500, multi: null };

async function requireGym(): Promise<PartnerUser> {
  const partner = await requirePartner();
  if (!ownsCommunity(partner.partner_type)) throw new Error('Only gyms and companies can do this');
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
        kind: partner.partner_type === 'company' ? 'company' : 'gym',
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


/** Start a step challenge in the community (up to 3 months). Members opt in from the app. */
export async function createChallenge(formData: FormData) {
  const partner = await requireGym();
  if (!partner.community_id) throw new Error('Create your community first');
  const str = (k: string) => ((formData.get(k) as string) || '').trim();
  const title = str('title');
  const starts = str('starts_on');
  const ends = str('ends_on');
  if (title.length < 2 || !/^\d{4}-\d{2}-\d{2}$/.test(starts) || !/^\d{4}-\d{2}-\d{2}$/.test(ends)) throw new Error('A name and dates are needed');
  if (ends < starts) throw new Error('The end date is before the start');
  const goal = parseInt(str('daily_goal')) || null;
  const metric = ['steps', 'active_days', 'workouts', 'minutes', 'sessions'].includes(str('metric')) ? str('metric') : 'steps';
  const db = createAdminClient();
  const { data, error } = await db
    .from('challenges')
    .insert({
      community_id: partner.community_id,
      title,
      title_ar: str('title_ar') || null,
      starts_on: starts,
      ends_on: ends,
      metric,
      by_team: formData.get('by_team') === 'on',
      prize: str('prize').slice(0, 160) || null,
      prize_ar: str('prize_ar').slice(0, 160) || null,
      daily_goal: goal && (metric === 'steps' || metric === 'active_days') ? Math.min(50000, Math.max(1000, goal)) : null,
      partner_id: partner.partner_id,
      created_by: partner.id,
    })
    .select('id')
    .single();
  if (error) throw new Error(/challenges_dates_chk/.test(error.message) ? 'A challenge can run for up to 3 months' : error.message);
  revalidatePath('/partner/challenges');
  revalidatePath('/partner/club');
  redirect(`/partner/challenges?c=${(data as any).id}`);
}

export async function cancelChallenge(challengeId: string) {
  const partner = await requireGym();
  const db = createAdminClient();
  const { error } = await db.from('challenges').update({ cancelled_at: new Date().toISOString() }).eq('id', challengeId).eq('community_id', partner.community_id);
  if (error) throw new Error(error.message);
  revalidatePath('/partner/challenges');
  revalidatePath('/partner/club');
}

// ─── Teams, the community page, challenge options ──────────────────────────
export async function addTeam(formData: FormData) {
  const partner = await requireGym();
  if (!partner.community_id) throw new Error('Create your community first');
  const name = ((formData.get('name') as string) || '').trim();
  const name_ar = ((formData.get('name_ar') as string) || '').trim() || null;
  if (name.length < 2 || name.length > 40) throw new Error('Give the team a name of 2 to 40 characters');
  const db = createAdminClient();
  const { count } = await db.from('community_teams').select('id', { count: 'exact', head: true }).eq('community_id', partner.community_id);
  if ((count ?? 0) >= 100) throw new Error('A community can have up to 100 teams');
  const { error } = await db.from('community_teams').insert({ community_id: partner.community_id, name, name_ar });
  if (error) throw new Error(error.message);
  revalidatePath('/partner/teams');
}

export async function removeTeam(teamId: string) {
  const partner = await requireGym();
  const db = createAdminClient();
  const { error } = await db.from('community_teams').delete().eq('id', teamId).eq('community_id', partner.community_id);
  if (error) throw new Error(error.message);
  revalidatePath('/partner/teams');
}

/** The notice and plan of the month members see on the community's page in the app. */
export async function saveCommunityPage(formData: FormData) {
  const partner = await requireGym();
  if (!partner.community_id) throw new Error('Create your community first');
  const str = (k: string, max: number) => ((formData.get(k) as string) || '').trim().slice(0, max) || null;
  const until = str('notice_until', 10);
  const plan = str('featured_program_id', 40);
  const db = createAdminClient();
  const { error } = await db
    .from('communities')
    .update({
      notice: str('notice', 280),
      notice_ar: str('notice_ar', 280),
      notice_until: until && /^\d{4}-\d{2}-\d{2}$/.test(until) ? until : null,
      featured_program_id: plan && /^[0-9a-f-]{36}$/.test(plan) ? plan : null,
    })
    .eq('id', partner.community_id);
  if (error) throw new Error(error.message);
  revalidatePath('/partner/club');
}
