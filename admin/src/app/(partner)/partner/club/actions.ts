'use server';

import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase-server';
import { ownsCommunity, requireCap, requirePartner, type PartnerUser } from '@/lib/auth';
import { can } from '@/lib/capabilities';
import { int, isUuid } from '@/lib/validate';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const SEATS: Record<string, number | null> = { studio: 300, club: 1500, multi: null };

async function requireGym(): Promise<PartnerUser> {
  const partner = await requirePartner();
  if (!ownsCommunity(partner.partner_type)) throw new Error('This account does not run a community');
  return partner;
}

/** Classes, sessions and events: every partner whose sidebar shows them (see navFor). */
const requireSessions = () => requireCap('classes');

/** Where a partner's sessions go: its own club, or the open Beast Tribe community (everyone in the city). */
async function sessionHome(partner: PartnerUser): Promise<string> {
  if (ownsCommunity(partner.partner_type)) {
    if (!partner.community_id) throw new Error('Create your club first');
    return partner.community_id;
  }
  const { data } = await createAdminClient().from('communities').select('id').eq('is_default', true).limit(1).maybeSingle();
  if (!data) throw new Error('The open community is missing');
  return (data as any).id;
}

/** The app reads a session's sport from event_type: use the chosen sport's name, else a gym class. */
async function eventTypeFor(sportId: string | null) {
  if (!sportId) return 'gym_class';
  const { data } = await createAdminClient().from('sports').select('name').eq('id', sportId).maybeSingle();
  return ((data as any)?.name as string | undefined)?.toLowerCase() || 'gym_class';
}

/** Riyadh date + time + length from a session form, or an error message. */
function whenOf(str: (k: string) => string) {
  const date = str('date');
  const time = str('time');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw new Error('Title, date and time are needed');
  const duration = Math.min(480, Math.max(10, parseInt(str('duration')) || 60));
  const first = new Date(`${date}T${time}:00+03:00`);
  if (isNaN(first.getTime())) throw new Error('That date or time is not valid');
  if (first.getTime() < Date.now() - 3600000) throw new Error('Pick a time in the future');
  return { first, duration };
}

/** Teams and challenges: only partners whose sidebar shows them (see navFor). */
async function requireGymWith(cap: 'teams' | 'challenges'): Promise<PartnerUser> {
  const partner = await requireGym();
  if (!can(partner.partner_type, cap)) throw new Error('Not available for this account');
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
        kind: partner.partner_type === 'company' ? 'company' : partner.partner_type === 'school' ? 'school' : partner.partner_type === 'leader' ? 'club' : 'gym',
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
  const partner = await requireSessions();
  const communityId = await sessionHome(partner);
  const inClub = communityId === partner.community_id;
  const db = createAdminClient();
  const str = (k: string) => ((formData.get(k) as string) || '').trim().slice(0, k === 'description' ? 1000 : 120);

  const title = str('title');
  if (!title) throw new Error('Title, date and time are needed');
  const { first, duration } = whenOf(str);
  const capacity = int(formData.get('capacity'), 1, 500);
  const weeks = Math.min(12, Math.max(1, parseInt(str('repeat')) || 1));
  // Guests: people outside the community can join for a guest price and pay at the desk.
  const guestOpen = can(partner.partner_type, 'guests') && formData.get('guest_open') === 'on';
  const guestPrice = guestOpen ? Math.round(parseFloat(str('guest_price_sar') || '0') * 100) / 100 : null;
  if (guestOpen && !(guestPrice! >= 0 && guestPrice! <= 5000)) throw new Error('The guest price is not valid');
  const guestSpots = guestOpen && str('guest_spots') ? int(formData.get('guest_spots'), 0, 500) : null;
  const sportId = isUuid(str('sport_id')) ? str('sport_id') : null;
  const eventType = await eventTypeFor(sportId);

  const { data: p } = await db.from('partners').select('city, country, address').eq('id', partner.partner_id).single();
  const series = weeks > 1 ? randomUUID() : null;
  const rows = Array.from({ length: weeks }, (_, i) => {
    const starts = new Date(first.getTime() + i * 7 * 86400000);
    const ends = new Date(starts.getTime() + duration * 60000);
    return {
      title,
      description: str('description') || null,
      event_type: eventType,
      sport_id: sportId,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      max_capacity: capacity,
      location_name: str('location_name') || partner.business_name,
      location_city: str('location_city') || (p as any)?.city || null,
      country: (p as any)?.country || 'SA',
      coach_name: str('coach_name') || null,
      gym_name: inClub ? partner.business_name : null,
      difficulty: str('difficulty') || null,
      is_women_only: formData.get('is_women_only') === 'on',
      created_by: partner.id,
      partner_id: partner.partner_id,
      community_id: communityId,
      visibility: 'community',
      is_class: true,
      class_series_id: series,
      guest_open: guestOpen,
      guest_price_sar: guestOpen && guestPrice! > 0 ? guestPrice : null,
      guest_spots: guestSpots,
    };
  });
  const { error } = await db.from('events').insert(rows);
  if (error) throw new Error(error.message);

  revalidatePath('/partner/classes');
  revalidatePath('/partner/club');
  redirect('/partner/classes?created=' + weeks);
}

/** Edit one session. The time can change only while nobody is booked (they would not be told). */
export async function updateClass(eventId: string, formData: FormData) {
  const partner = await requireSessions();
  const e = await ownedEvent(partner, eventId);
  if (e.cancelled_at) throw new Error('This one is cancelled');
  const db = createAdminClient();
  const str = (k: string) => ((formData.get(k) as string) || '').trim().slice(0, k === 'description' ? 1000 : 120);
  const title = str('title');
  if (!title) throw new Error('A title is needed');

  const sportId = isUuid(str('sport_id')) ? str('sport_id') : null;
  const updates: Record<string, any> = {
    title,
    description: str('description') || null,
    sport_id: sportId,
    event_type: await eventTypeFor(sportId),
    coach_name: str('coach_name') || null,
    location_name: str('location_name') || null,
    max_capacity: int(formData.get('capacity'), 1, 500),
    difficulty: str('difficulty') || null,
    is_women_only: formData.get('is_women_only') === 'on',
  };
  if (formData.has('location_city')) updates.location_city = str('location_city') || null;

  if (str('date') && str('time')) {
    const { first, duration } = whenOf(str);
    const moved = first.getTime() !== new Date(e.starts_at).getTime() || duration !== Math.round((new Date(e.ends_at ?? e.starts_at).getTime() - new Date(e.starts_at).getTime()) / 60000);
    if (moved) {
      const { count } = await db.from('event_rsvps').select('user_id', { count: 'exact', head: true }).eq('event_id', eventId).in('status', ['going', 'waitlist']);
      if (count) throw new Error('People are booked, so the time can no longer change. Cancel it (they are notified) and post a new one.');
      updates.starts_at = first.toISOString();
      updates.ends_at = new Date(first.getTime() + duration * 60000).toISOString();
    }
  }

  const { error } = await db.from('events').update(updates).eq('id', eventId);
  if (error) throw new Error(error.message);
  revalidatePath('/partner/classes');
  revalidatePath(`/partner/classes/${eventId}`);
  redirect(`/partner/classes/${eventId}`);
}

async function ownedEvent(partner: PartnerUser, eventId: string) {
  const db = createAdminClient();
  const { data: e } = await db.from('events').select('id, title, partner_id, community_id, created_by, class_series_id, starts_at, ends_at, cancelled_at').eq('id', eventId).single();
  if (!e) throw new Error('Class not found');
  const mine = (e as any).partner_id === partner.partner_id || (partner.community_id && (e as any).community_id === partner.community_id && (e as any).created_by === partner.id);
  if (!mine) throw new Error('Not your class');
  return e as any;
}

/** Cancel one class or every upcoming class in its weekly series; booked members are notified. */
export async function cancelClass(eventId: string, formData: FormData) {
  const partner = await requireSessions();
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
  const partner = await requireSessions();
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
  const partner = await requireSessions();
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
  const partner = await requireGymWith('challenges');
  if (!partner.community_id) throw new Error('Create your community first');
  const str = (k: string) => ((formData.get(k) as string) || '').trim().slice(0, k === 'description' ? 1000 : 120);
  const title = str('title');
  const starts = str('starts_on');
  const ends = str('ends_on');
  if (title.length < 2 || !/^\d{4}-\d{2}-\d{2}$/.test(starts) || !/^\d{4}-\d{2}-\d{2}$/.test(ends)) throw new Error('A name and dates are needed');
  if (ends < starts) throw new Error('The end date is before the start');
  const goal = int(formData.get('daily_goal'), 1, 1000000);
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
  const partner = await requireGymWith('challenges');
  const db = createAdminClient();
  const { error } = await db.from('challenges').update({ cancelled_at: new Date().toISOString() }).eq('id', challengeId).eq('community_id', partner.community_id);
  if (error) throw new Error(error.message);
  revalidatePath('/partner/challenges');
  revalidatePath('/partner/club');
}

// ─── Teams, the community page, challenge options ──────────────────────────
export async function addTeam(formData: FormData) {
  const partner = await requireGymWith('teams');
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
  const partner = await requireGymWith('teams');
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
  const planId = str('featured_program_id', 40);
  const db = createAdminClient();
  // Only a plan that exists can be featured.
  const plan = planId && isUuid(planId) ? ((await db.from('programs').select('id').eq('id', planId).maybeSingle()).data as any)?.id ?? null : null;
  const { error } = await db
    .from('communities')
    .update({
      notice: str('notice', 280),
      notice_ar: str('notice_ar', 280),
      notice_until: until && /^\d{4}-\d{2}-\d{2}$/.test(until) ? until : null,
      featured_program_id: plan,
      allow_guests: formData.get('allow_guests') === 'on',
    })
    .eq('id', partner.community_id);
  if (error) throw new Error(error.message);
  revalidatePath('/partner/club');
}

/** Ask Beast Tribe for a Beast Captain: lands in the admin Leads pipeline. One open request at a time. */
export async function requestCaptain(formData: FormData) {
  const partner = await requirePartner();
  if (!ownsCommunity(partner.partner_type)) throw new Error('Not available for this account');
  const db = createAdminClient();
  const { data: open } = await db.from('partner_leads').select('id').eq('partner_id', partner.partner_id).eq('source', 'captain request').in('status', ['new', 'contacted', 'demo']).limit(1);
  if (!open?.length) {
    const wish = ((formData.get('wish') as string) || '').trim().slice(0, 1500);
    const { error } = await db.from('partner_leads').insert({
      kind: partner.partner_type === 'company' ? 'company' : 'gym',
      business_name: partner.business_name || 'Partner',
      contact_name: partner.full_name || partner.business_name || 'Partner',
      email: partner.email,
      source: 'captain request',
      message: wish || 'Asked for a Beast Captain from the portal.',
      partner_id: partner.partner_id,
    });
    if (error) throw new Error(error.message);
  }
  revalidatePath('/partner/club');
  revalidatePath('/leads');
}
