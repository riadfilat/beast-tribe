'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { readEventForm } from '@/lib/events';

export async function createEvent(formData: FormData) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const values = readEventForm(formData);
  const { error } = await db.from('events').insert({
    country: 'SA',
    is_women_only: false,
    ...values,
    created_by: admin.id,
  });

  if (error) throw new Error(error.message);

  // Audit log
  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'create_event',
    target_table: 'events',
    details: { title: values.title },
  });

  revalidatePath('/events');
  redirect('/events');
}

export async function updateEvent(eventId: string, formData: FormData) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const updates = readEventForm(formData);

  const { error } = await db.from('events').update(updates).eq('id', eventId);
  if (error) throw new Error(error.message);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'update_event',
    target_table: 'events',
    target_id: eventId,
    details: updates,
  });

  revalidatePath('/events');
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

  revalidatePath('/events');
  redirect('/events');
}
