'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requirePartner } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { readWorkoutForm } from '@/lib/workouts';

/** A coach may only scope a workout to the community they belong to (or to everyone). */
async function allowedCommunity(partnerId: string, wanted: string | null) {
  if (!wanted) return null;
  const db = createAdminClient();
  const { data } = await db.from('partners').select('community_id').eq('id', partnerId).maybeSingle();
  return data?.community_id === wanted ? wanted : null;
}

export async function submitWorkout(fd: FormData) {
  const partner = await requirePartner();
  const db = createAdminClient();
  const values = readWorkoutForm(fd);
  values.community_id = await allowedCommunity(partner.partner_id, values.community_id);
  const { error } = await db.from('workouts').insert({
    ...values,
    source: 'coach',
    status: 'pending',
    author_partner_id: partner.partner_id,
    created_by: partner.id,
    xp_reward: 0,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/partner/workouts');
  redirect('/partner/workouts?sent=1');
}

/** Any change goes back to review before members see it again. */
export async function resubmitWorkout(id: string, fd: FormData) {
  const partner = await requirePartner();
  const db = createAdminClient();
  const { data: w } = await db.from('workouts').select('author_partner_id').eq('id', id).maybeSingle();
  if (!w || w.author_partner_id !== partner.partner_id) throw new Error('Not your workout.');
  const values = readWorkoutForm(fd);
  values.community_id = await allowedCommunity(partner.partner_id, values.community_id);
  const { error } = await db.from('workouts').update({ ...values, status: 'pending', review_note: null }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/partner/workouts');
  redirect('/partner/workouts?sent=1');
}

export async function withdrawWorkout(id: string) {
  const partner = await requirePartner();
  const db = createAdminClient();
  const { error } = await db.from('workouts').update({ status: 'archived' }).eq('id', id).eq('author_partner_id', partner.partner_id);
  if (error) throw new Error(error.message);
  revalidatePath('/partner/workouts');
}
