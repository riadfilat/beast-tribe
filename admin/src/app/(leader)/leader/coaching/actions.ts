'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase-server';
import { requireLeader, requireTeam } from '@/lib/leader/context';
import { loadPeople } from '@/lib/leader/people';

// Coaches are people on the community's team. Leaders add them; a coach (or a leader) sets free times.

const slugify = (raw: string) => raw.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '') || 'coach';

export async function addCoach(formData: FormData) {
  const ctx = await requireLeader();
  const userId = String(formData.get('user') || '');
  const person = (await loadPeople(ctx.community.id)).team.find((t) => t.id === userId);
  if (!person) throw new Error('Pick someone from your team');
  const db = createAdminClient();
  const { data: has } = await db.from('partners').select('id').eq('community_id', ctx.community.id).eq('partner_type', 'coach').eq('user_id', userId).maybeSingle();
  if (!has) {
    const { error } = await db.from('partners').insert({
      name: person.name,
      business_name: person.name,
      slug: `${slugify(person.name)}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'coach',
      partner_type: 'coach',
      status: 'active',
      is_active: true,
      is_verified: true,
      user_id: userId,
      city: ctx.community.city,
      community_id: ctx.community.id,
      created_by: ctx.userId,
    });
    if (error) throw new Error('Could not add the coach');
  }
  revalidatePath('/leader/coaching');
}

/** The coach must be in this community; supporters may only change their own times. */
async function ownCoach(coachId: string) {
  const ctx = await requireTeam();
  const { data } = await createAdminClient().from('partners').select('id, user_id, community_id').eq('id', coachId).eq('partner_type', 'coach').maybeSingle();
  const c: any = data;
  if (!c || c.community_id !== ctx.community.id || (!ctx.isLeader && c.user_id !== ctx.userId)) throw new Error('Not your coach');
  return c;
}

export async function addSlot(coachId: string, formData: FormData) {
  await ownCoach(coachId);
  const day = parseInt(String(formData.get('day')));
  const start = String(formData.get('start') || '');
  const end = String(formData.get('end') || '');
  if (!(day >= 0 && day <= 6) || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || end <= start) throw new Error('Pick a day, a start and a later end');
  await createAdminClient().from('coach_slots').upsert({ partner_id: coachId, day_of_week: day, start_time: start, end_time: end, is_active: true }, { onConflict: 'partner_id,day_of_week,start_time' });
  revalidatePath('/leader/coaching');
}

export async function removeSlot(coachId: string, slotId: string) {
  await ownCoach(coachId);
  await createAdminClient().from('coach_slots').update({ is_active: false }).eq('id', slotId).eq('partner_id', coachId);
  revalidatePath('/leader/coaching');
}
