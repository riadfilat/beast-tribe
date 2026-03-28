'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function createEvent(formData: FormData) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const title = formData.get('title') as string;
  const event_type = formData.get('event_type') as string;
  const sport_id = formData.get('sport_id') as string || null;
  const starts_at = formData.get('starts_at') as string;
  const ends_at = formData.get('ends_at') as string || null;
  const location_name = formData.get('location_name') as string || null;
  const location_city = formData.get('location_city') as string || null;
  const country = formData.get('country') as string || 'SA';
  const coach_name = formData.get('coach_name') as string || null;
  const gym_name = formData.get('gym_name') as string || null;
  const max_capacity = parseInt(formData.get('max_capacity') as string) || null;
  const description = formData.get('description') as string || null;
  const is_women_only = formData.get('is_women_only') === 'on';

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
    created_by: admin.id,
  });

  if (error) throw new Error(error.message);

  // Audit log
  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'create_event',
    target_table: 'events',
    details: { title },
  });

  redirect('/events');
}

export async function updateEvent(eventId: string, formData: FormData) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const updates: Record<string, any> = {};
  const fields = ['title', 'event_type', 'sport_id', 'starts_at', 'ends_at', 'location_name',
    'location_city', 'country', 'coach_name', 'gym_name', 'description'];

  fields.forEach((field) => {
    const value = formData.get(field);
    if (value !== null && value !== '') updates[field] = value;
  });

  const maxCap = formData.get('max_capacity');
  if (maxCap) updates.max_capacity = parseInt(maxCap as string) || null;
  updates.is_women_only = formData.get('is_women_only') === 'on';

  const { error } = await db.from('events').update(updates).eq('id', eventId);
  if (error) throw new Error(error.message);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'update_event',
    target_table: 'events',
    target_id: eventId,
    details: updates,
  });

  redirect('/events');
}

export async function deleteEvent(eventId: string) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const { error } = await db.from('events').delete().eq('id', eventId);
  if (error) throw new Error(error.message);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'delete_event',
    target_table: 'events',
    target_id: eventId,
  });

  redirect('/events');
}
