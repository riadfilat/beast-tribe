'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { echoForm, readSessionForm, type SessionFormValues } from '@/lib/events';
import { loadCommunityList, loadSportList } from './data';

// HQ staff posting and running sessions. Same table as the app and the leader dashboard,
// so a session shows in the app straight away. Every change goes in the admin audit log.

export type FormState = { error?: string; values?: SessionFormValues } | undefined;

const FRIENDLY: [RegExp, string][] = [
  [/events_one_gender_only/, 'A session can be women only or men only, not both.'],
  [/COURT|FACILITY/i, 'That court time is taken or closed. Pick another time.'],
];
const friendly = (m: string) => FRIENDLY.find(([re]) => re.test(m))?.[1] ?? 'Something went wrong saving the session. Please try again.';

async function readForm(formData: FormData) {
  const [sports, comms] = await Promise.all([loadSportList(), loadCommunityList()]);
  return readSessionForm(formData, sports, comms.open?.id ?? null);
}

export async function createSession(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole('admin');
  const read = await readForm(formData);
  if ('error' in read) return { error: read.error, values: echoForm(formData) };
  const db = createAdminClient();

  const { data, error } = await db
    .from('events')
    .insert({ visibility: 'community', ...read.values, created_by: admin.id })
    .select('id')
    .single();
  if (error || !data) {
    console.error('createSession', error?.message);
    return { error: friendly(error?.message || ''), values: echoForm(formData) };
  }

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'create_event',
    target_table: 'events',
    target_id: data.id,
    details: { title: read.values.title },
  });

  revalidatePath('/hq/sessions');
  redirect(`/hq/sessions/${data.id}?done=posted`);
}

export async function updateSession(eventId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole('admin');
  const read = await readForm(formData);
  if ('error' in read) return { error: read.error, values: echoForm(formData) };
  const db = createAdminClient();

  const { error } = await db.from('events').update(read.values).eq('id', eventId);
  if (error) {
    console.error('updateSession', error.message);
    return { error: friendly(error.message), values: echoForm(formData) };
  }

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'update_event',
    target_table: 'events',
    target_id: eventId,
    details: read.values,
  });

  revalidatePath('/hq/sessions');
  revalidatePath(`/hq/sessions/${eventId}`);
  redirect(`/hq/sessions/${eventId}?done=saved`);
}

/** Cancel one session, or it and the rest of its weekly series. Everyone booked gets a notification. */
export async function cancelSession(eventId: string, formData: FormData) {
  const admin = await requireRole('admin');
  const db = createAdminClient();
  const { data: e } = await db.from('events').select('id, class_series_id, starts_at').eq('id', eventId).maybeSingle();
  if (!e) throw new Error('Session not found');

  let q = db.from('events').select('id, title').is('cancelled_at', null);
  q = formData.get('scope') === 'series' && (e as any).class_series_id
    ? q.eq('class_series_id', (e as any).class_series_id).gte('starts_at', (e as any).starts_at)
    : q.eq('id', eventId);
  const list = ((await q).data || []) as { id: string; title: string }[];
  const reason = String(formData.get('reason') || '').trim().slice(0, 200) || null;

  if (list.length) {
    const ids = list.map((x) => x.id);
    const { error } = await db.from('events').update({ cancelled_at: new Date().toISOString(), cancel_reason: reason }).in('id', ids);
    if (error) throw new Error(error.message);
    const { data: booked } = await db.from('event_rsvps').select('event_id, user_id').in('event_id', ids).in('status', ['going', 'waitlist']);
    const by = new Map<string, string[]>();
    for (const b of (booked || []) as any[]) by.set(b.event_id, [...(by.get(b.event_id) ?? []), b.user_id]);
    await Promise.all(
      list.filter((x) => by.has(x.id)).map((x) =>
        db.rpc('bt_notify', { p_user_ids: by.get(x.id), p_type: 'event_cancelled', p_actor: admin.id, p_data: { event_id: x.id, event_title: x.title } }),
      ),
    );
    await db.from('admin_audit_log').insert({
      admin_user_id: admin.id,
      action: 'cancel_event',
      target_table: 'events',
      target_id: eventId,
      details: { ids, reason },
    });
  }

  revalidatePath('/hq/sessions');
  revalidatePath(`/hq/sessions/${eventId}`);
  redirect(`/hq/sessions/${eventId}?done=cancelled`);
}

/** Remove a session for good (players are not told; cancel is the gentle way). */
export async function deleteSession(eventId: string) {
  const admin = await requireRole('admin');
  const db = createAdminClient();

  const { error } = await db.from('events').delete().eq('id', eventId);
  if (error) throw new Error(error.message);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'delete_event',
    target_table: 'events',
    target_id: eventId,
  });

  revalidatePath('/hq/sessions');
  redirect('/hq/sessions?done=deleted');
}
