'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requirePartner, type PartnerUser } from '@/lib/auth';
import { can } from '@/lib/capabilities';
import { FACILITY_KINDS, SLOT_MINUTES } from '@/lib/venue';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

async function requireVenue(): Promise<PartnerUser> {
  const partner = await requirePartner();
  if (!can(partner.partner_type, 'facilities')) throw new Error('Listing facilities is not part of this account');
  return partner;
}

async function uploadImage(formData: FormData): Promise<string | null> {
  const file = formData.get('image') as File | null;
  if (!file || typeof file === 'string' || !file.size) return null;
  if (file.size > 5 * 1024 * 1024) throw new Error('The photo is over 5 MB');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Use a JPG, PNG or WebP photo');
  const db = createAdminClient();
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `facilities/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await db.storage.from('location-images').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (error) throw new Error(error.message);
  return db.storage.from('location-images').getPublicUrl(path).data.publicUrl;
}

function read(formData: FormData, partner: PartnerUser) {
  const str = (k: string) => ((formData.get(k) as string) || '').trim();
  const name = str('name');
  if (name.length < 2) throw new Error('Give the facility a name');
  const price = Math.round(parseFloat(str('price_sar') || '0') * 100) / 100;
  if (!(price >= 0) || price > 100000) throw new Error('The price is not valid');
  const slot = parseInt(str('slot_minutes')) || 60;
  const hours: Record<string, [string, string][]> = {};
  for (let d = 0; d < 7; d++) {
    if (formData.get(`open_${d}`) !== 'on') continue;
    const a = str(`from_${d}`);
    const b = str(`to_${d}`);
    if (!/^\d{2}:\d{2}$/.test(a) || !/^\d{2}:\d{2}$/.test(b)) throw new Error('Opening hours need a start and an end');
    hours[String(d)] = [[a, b]];
  }
  let audience = str('audience');
  if (!['everyone', 'women', 'community'].includes(audience)) audience = 'everyone';
  if (audience === 'community' && !partner.community_id) throw new Error('Create your community first to limit a facility to its members');
  return {
    name,
    name_ar: str('name_ar') || null,
    kind: FACILITY_KINDS[str('kind')] ? str('kind') : 'court',
    sport: str('sport') || 'padel',
    city: str('city') || null,
    address: str('address') || null,
    description: str('description').slice(0, 600) || null,
    description_ar: str('description_ar').slice(0, 600) || null,
    price_sar: price,
    slot_minutes: SLOT_MINUTES.includes(slot) ? slot : 60,
    max_players: Math.min(40, Math.max(1, parseInt(str('max_players')) || 4)),
    hours,
    audience,
    community_id: audience === 'community' ? partner.community_id : null,
    notice_hours: Math.min(72, Math.max(0, parseInt(str('notice_hours')) || 0)),
    cancel_hours: Math.min(168, Math.max(0, parseInt(str('cancel_hours')) || 0)),
    is_school: partner.partner_type === 'school',
    // Multi-use: every sport it takes (the main one first); half courts belong to a full court.
    sports: Array.from(new Set([str('sport') || 'padel', ...str('more_sports').toLowerCase().split(/[,،]/).map((x) => x.trim().replace(/\s+/g, '_')).filter(Boolean)])).slice(0, 8),
    parent_id: /^[0-9a-f-]{36}$/.test(str('parent_id')) ? str('parent_id') : null,
    bookable: formData.get('classes_only') !== 'on',
    daily_limit: str('daily_limit') ? Math.min(10, Math.max(1, parseInt(str('daily_limit')) || 1)) : null,
  };
}

/** A half court can only belong to one of the partner's own courts (never itself, never someone else's). */
async function checkParent(row: { parent_id: string | null }, partnerId: string, selfId?: string) {
  if (!row.parent_id) return;
  if (row.parent_id === selfId) throw new Error('A court cannot be half of itself');
  const { data } = await createAdminClient().from('facilities').select('id').eq('id', row.parent_id).eq('partner_id', partnerId).maybeSingle();
  if (!data) throw new Error('That full court is not yours');
}

export async function createFacility(formData: FormData) {
  const partner = await requireVenue();
  const row = read(formData, partner);
  await checkParent(row, partner.partner_id);
  const image_url = await uploadImage(formData);
  const db = createAdminClient();
  const { error } = await db.from('facilities').insert({ ...row, image_url, partner_id: partner.partner_id });
  if (error) throw new Error(error.message);
  revalidatePath('/partner/facilities');
  revalidatePath('/partner/dashboard');
  redirect('/partner/facilities?saved=1');
}

export async function updateFacility(id: string, formData: FormData) {
  const partner = await requireVenue();
  const row: any = read(formData, partner);
  await checkParent(row, partner.partner_id, id);
  const image_url = await uploadImage(formData);
  if (image_url) row.image_url = image_url;
  const db = createAdminClient();
  const { error } = await db.from('facilities').update(row).eq('id', id).eq('partner_id', partner.partner_id);
  if (error) throw new Error(error.message);
  revalidatePath('/partner/facilities');
  redirect('/partner/facilities?saved=1');
}

/** Hide a facility from the app (existing bookings stay) or show it again. */
export async function setFacilityActive(id: string, active: boolean) {
  const partner = await requireVenue();
  const db = createAdminClient();
  const { error } = await db.from('facilities').update({ is_active: active }).eq('id', id).eq('partner_id', partner.partner_id);
  if (error) throw new Error(error.message);
  revalidatePath('/partner/facilities');
}

/** The session behind a due must be a booking on this partner's facility or a class in its community. */
async function ownsSession(partner: PartnerUser, eventId: string) {
  const db = createAdminClient();
  const { data: e } = await db.from('events').select('id, title, community_id, partner_id, facility_id, cancelled_at').eq('id', eventId).single();
  if (!e) throw new Error('Session not found');
  const ev: any = e;
  let mine = ev.partner_id === partner.partner_id || (!!partner.community_id && ev.community_id === partner.community_id);
  if (!mine && ev.facility_id) {
    const { data: f } = await db.from('facilities').select('partner_id').eq('id', ev.facility_id).single();
    mine = (f as any)?.partner_id === partner.partner_id;
  }
  if (!mine) throw new Error('Not your booking');
  return ev;
}

/** A player paid at the venue (or the mark was a mistake). */
export async function markPaid(eventId: string, userId: string, paid: boolean) {
  const partner = await requirePartner();
  await ownsSession(partner, eventId);
  const db = createAdminClient();
  const { error } = await db
    .from('session_dues')
    .update(paid ? { paid_at: new Date().toISOString(), paid_via: 'venue', marked_by: partner.id } : { paid_at: null, paid_via: null, marked_by: null })
    .eq('event_id', eventId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  revalidatePath('/partner/bookings');
  revalidatePath(`/partner/classes/${eventId}`);
  revalidatePath('/partner/dashboard');
}

/** Everyone in the session paid. */
export async function markAllPaid(eventId: string) {
  const partner = await requirePartner();
  await ownsSession(partner, eventId);
  const db = createAdminClient();
  const { error } = await db.from('session_dues').update({ paid_at: new Date().toISOString(), paid_via: 'venue', marked_by: partner.id }).eq('event_id', eventId).is('paid_at', null);
  if (error) throw new Error(error.message);
  revalidatePath('/partner/bookings');
  revalidatePath(`/partner/classes/${eventId}`);
  revalidatePath('/partner/dashboard');
}

/** The venue cancels a booking: the session is cancelled, the time is free again, players are told. */
export async function cancelBooking(eventId: string, formData: FormData) {
  const partner = await requireVenue();
  const ev = await ownsSession(partner, eventId);
  if (ev.cancelled_at) return;
  const db = createAdminClient();
  const reason = ((formData.get('reason') as string) || '').trim() || 'Cancelled by the venue';
  const { error } = await db.from('events').update({ cancelled_at: new Date().toISOString(), cancel_reason: reason }).eq('id', eventId);
  if (error) throw new Error(error.message);
  const { data: booked } = await db.from('event_rsvps').select('user_id').eq('event_id', eventId).in('status', ['going', 'waitlist']);
  const ids = (booked || []).map((b: any) => b.user_id);
  if (ids.length) await db.rpc('bt_notify', { p_user_ids: ids, p_type: 'event_cancelled', p_actor: partner.id, p_data: { event_id: eventId, event_title: ev.title } });
  revalidatePath('/partner/bookings');
  revalidatePath('/partner/dashboard');
}
