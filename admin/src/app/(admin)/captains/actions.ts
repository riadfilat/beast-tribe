'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';

const str = (f: FormData, k: string) => ((f.get(k) as string) || '').trim();
const num = (f: FormData, k: string) => {
  const v = str(f, k);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

function terms(f: FormData) {
  const target = Math.round(num(f, 'weekly_target') ?? 3);
  if (target < 1 || target > 14) throw new Error('Sessions a week must be between 1 and 14');
  const rate = num(f, 'hourly_rate_sar');
  if (rate !== null && (rate < 0 || rate > 5000)) throw new Error('Check the hourly rate');
  const cut = num(f, 'cut_pct');
  if (cut !== null && (cut < 0 || cut > 100)) throw new Error('Our share must be between 0 and 100');
  return { weekly_target: target, hourly_rate_sar: rate, cut_pct: cut, notes: str(f, 'notes').slice(0, 1000) || null };
}

function done() {
  revalidatePath('/captains');
  revalidatePath('/business');
}

/** Make a member the Beast Captain of a community. They are added to the community and told in the app. */
export async function assignCaptain(formData: FormData) {
  const admin = await requireAdmin();
  const db = createAdminClient();
  const communityId = str(formData, 'community_id');
  const email = str(formData, 'email').toLowerCase();
  if (!communityId) throw new Error('Choose a community');
  if (!email) throw new Error("Add the coach's email");

  const { data: userId, error: findErr } = await db.rpc('bt_user_id_by_email', { p_email: email });
  if (findErr) throw new Error(findErr.message);
  if (!userId) throw new Error(`No member has signed up with ${email}. Ask the coach to create their account in the app first.`);

  const starts = str(formData, 'starts_on');
  const { error } = await db.from('community_captains').upsert(
    { community_id: communityId, user_id: userId, ...terms(formData), starts_on: isDate(starts) ? starts : undefined, ends_on: null, assigned_by: admin.id },
    { onConflict: 'community_id,user_id' },
  );
  if (error) throw new Error(error.message);

  const { error: memberErr } = await db.from('community_members').upsert({ community_id: communityId, user_id: userId }, { onConflict: 'community_id,user_id', ignoreDuplicates: true });
  if (memberErr) throw new Error(memberErr.message);

  const { data: community } = await db.from('communities').select('name').eq('id', communityId).maybeSingle();
  await db.rpc('bt_notify', { p_user_ids: [userId], p_type: 'captain_assigned', p_actor: null, p_data: { event_title: community?.name || '', community_id: communityId } });
  done();
}

export async function updateCaptain(communityId: string, userId: string, formData: FormData) {
  await requireAdmin();
  const db = createAdminClient();
  const ends = str(formData, 'ends_on');
  const { error } = await db
    .from('community_captains')
    .update({ ...terms(formData), ends_on: isDate(ends) ? ends : null })
    .eq('community_id', communityId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  done();
}

/** Stop a captaincy from today. The row stays so past months still appear on statements. */
export async function endCaptain(communityId: string, userId: string) {
  await requireAdmin();
  const db = createAdminClient();
  const today = new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
  const { error } = await db.from('community_captains').update({ ends_on: today }).eq('community_id', communityId).eq('user_id', userId);
  if (error) throw new Error(error.message);
  done();
}

/** Beast Tribe's share of a captain's hourly rate, used wherever a captain has no share of their own. */
export async function saveDefaultCut(formData: FormData) {
  await requireAdmin();
  const db = createAdminClient();
  const cut = num(formData, 'cut_pct');
  if (cut === null || cut < 0 || cut > 100) throw new Error('Our share must be between 0 and 100');
  const { error } = await db.from('app_settings').upsert({ key: 'captain', value: { cut_pct: cut } }, { onConflict: 'key' });
  if (error) throw new Error(error.message);
  done();
}
