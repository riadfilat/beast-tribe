'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requirePartner } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function createPartnerEvent(formData: FormData) {
  const partner = await requirePartner();
  const db = createAdminClient();

  const title = formData.get('title') as string;
  const event_type = formData.get('event_type') as string;
  const sport_id = formData.get('sport_id') as string || null;
  const starts_at = formData.get('starts_at') as string;
  const ends_at = formData.get('ends_at') as string || null;
  const location_name = formData.get('location_name') as string || null;
  const location_city = formData.get('location_city') as string || null;
  const country = formData.get('country') as string || 'SA';
  const max_capacity = parseInt(formData.get('max_capacity') as string) || null;
  const description = formData.get('description') as string || null;
  const is_women_only = formData.get('is_women_only') === 'on';

  // Auto-populate coach/gym name based on partner type
  const coach_name = partner.partner_type === 'coach' ? partner.business_name : (formData.get('coach_name') as string || null);
  const gym_name = partner.partner_type === 'gym' ? partner.business_name : (formData.get('gym_name') as string || null);

  const { error } = await db.from('events').insert({
    title,
    event_type,
    sport_id: sport_id || undefined,
    starts_at,
    ends_at: ends_at || undefined,
    location_name,
    location_city,
    country,
    coach_name,
    gym_name,
    max_capacity,
    description,
    is_women_only,
    created_by: partner.id,
    partner_id: partner.partner_id,
  });

  if (error) throw new Error(error.message);

  // Link in partner_events
  // First get the event we just created
  const { data: newEvent } = await db.from('events')
    .select('id')
    .eq('created_by', partner.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (newEvent) {
    const role = partner.partner_type === 'coach' ? 'coach' :
                 partner.partner_type === 'gym' ? 'venue' : 'organizer';
    await db.from('partner_events').insert({
      partner_id: partner.partner_id,
      event_id: newEvent.id,
      role,
    });
  }

  redirect('/partner/events');
}

export async function updatePartnerEvent(eventId: string, formData: FormData) {
  const partner = await requirePartner();
  const db = createAdminClient();

  // Verify the partner owns this event
  const { data: event } = await db.from('events')
    .select('partner_id')
    .eq('id', eventId)
    .single();

  if (!event || event.partner_id !== partner.partner_id) {
    throw new Error('Unauthorized');
  }

  const updates: Record<string, any> = {};
  ['title', 'event_type', 'sport_id', 'starts_at', 'ends_at', 'location_name',
    'location_city', 'country', 'description'].forEach((field) => {
    const v = formData.get(field);
    if (v !== null && v !== '') updates[field] = v;
  });

  const maxCap = formData.get('max_capacity');
  if (maxCap) updates.max_capacity = parseInt(maxCap as string) || null;
  updates.is_women_only = formData.get('is_women_only') === 'on';

  await db.from('events').update(updates).eq('id', eventId);
  redirect('/partner/events');
}
