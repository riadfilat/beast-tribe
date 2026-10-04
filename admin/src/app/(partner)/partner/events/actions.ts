'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireCap } from '@/lib/auth';
import { readEventForm } from '@/lib/events';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createPartnerEvent(formData: FormData) {
  const partner = await requireCap('events');
  const db = createAdminClient();

  const values = readEventForm(formData);

  // Auto-populate coach/gym name based on partner type
  if (partner.partner_type === 'coach') values.coach_name = partner.business_name;
  if (partner.partner_type === 'gym') values.gym_name = partner.business_name;

  // events.partner_id is the link to the partner.
  const { error } = await db.from('events').insert({
    country: 'SA',
    is_women_only: false,
    ...values,
    created_by: partner.id,
    partner_id: partner.partner_id,
  });

  if (error) throw new Error(error.message);

  revalidatePath('/partner/events');
  redirect('/partner/events');
}

export async function updatePartnerEvent(eventId: string, formData: FormData) {
  const partner = await requireCap('events');
  const db = createAdminClient();

  // Verify the partner owns this event
  const { data: event } = await db.from('events')
    .select('partner_id')
    .eq('id', eventId)
    .single();

  if (!event || event.partner_id !== partner.partner_id) {
    throw new Error('Unauthorized');
  }

  const updates = readEventForm(formData);
  // The names are set from the partner when the event is created.
  delete updates.coach_name;
  delete updates.gym_name;

  const { error } = await db.from('events').update(updates).eq('id', eventId);
  if (error) throw new Error(error.message);

  // admin_audit_log has no actor-type column: the "partner." prefix marks a partner's own change.
  await db.from('admin_audit_log').insert({
    admin_user_id: partner.id,
    action: 'partner.update_event',
    target_table: 'events',
    target_id: eventId,
    details: { actor: 'partner', partner_id: partner.partner_id },
  });

  revalidatePath('/partner/events');
  redirect('/partner/events');
}
