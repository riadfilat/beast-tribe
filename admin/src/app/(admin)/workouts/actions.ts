'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { readWorkoutForm } from '@/lib/workouts';

const STATUSES = ['draft', 'published', 'archived'];

export async function createWorkout(fd: FormData) {
  const admin = await requireRole('admin');
  const db = createAdminClient();
  const values = readWorkoutForm(fd);
  const status = STATUSES.includes(String(fd.get('status'))) ? String(fd.get('status')) : 'draft';
  const { error } = await db.from('workouts').insert({ ...values, source: 'library', status, created_by: admin.id, xp_reward: 0 });
  if (error) throw new Error(error.message);
  revalidatePath('/workouts');
  redirect('/workouts');
}

export async function updateWorkout(id: string, fd: FormData) {
  await requireRole('admin');
  const db = createAdminClient();
  const values = readWorkoutForm(fd);
  const patch: Record<string, any> = { ...values };
  const status = String(fd.get('status') || '');
  if (STATUSES.includes(status)) patch.status = status;
  const { error } = await db.from('workouts').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/workouts');
  redirect('/workouts');
}

/** Review a coach's workout: approve it (live), send it back with a note, or archive it. */
export async function reviewWorkout(id: string, decision: 'published' | 'rejected' | 'archived' | 'draft', fd?: FormData) {
  await requireRole('admin');
  const db = createAdminClient();
  const note = fd ? String(fd.get('review_note') || '').trim().slice(0, 500) : '';
  // The decision arrives from a form post: only these four are accepted.
  if (!['published', 'rejected', 'archived', 'draft'].includes(decision)) throw new Error('Unknown decision');
  const patch: Record<string, any> = { status: decision };
  if (decision === 'rejected') patch.review_note = note || 'Please revise and resubmit.';
  if (decision === 'published') patch.review_note = null;
  const { error } = await db.from('workouts').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/workouts');
}

/** Today's workout in the app: one at a time. */
export async function setFeatured(id: string, featured: boolean) {
  await requireRole('admin');
  const db = createAdminClient();
  if (featured) await db.from('workouts').update({ featured: false }).eq('featured', true);
  const { error } = await db.from('workouts').update({ featured }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/workouts');
}

/** How coaches are paid for counted uses: a rate per use, or a fixed monthly pool shared by uses. */
export async function saveCoachPay(fd: FormData) {
  const admin = await requireRole('admin');
  const db = createAdminClient();
  const mode = fd.get('mode') === 'pool' ? 'pool' : 'rate';
  const n = (v: FormDataEntryValue | null) => Math.max(0, Math.min(1_000_000, Number(v) || 0));
  const value = { mode, rate_sar: n(fd.get('rate_sar')), pool_sar: n(fd.get('pool_sar')) };
  const { error } = await db.from('app_settings').upsert({ key: 'coach_pay', value, updated_at: new Date().toISOString(), updated_by: admin.id });
  if (error) throw new Error(error.message);
  revalidatePath('/workouts/payouts');
}
