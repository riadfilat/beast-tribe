'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase-server';
import { requireLeader } from '@/lib/leader/context';

// Company teams: employees pick their team in the app. Leaders add and remove teams.

export async function addTeam(formData: FormData) {
  const ctx = await requireLeader();
  const name = String(formData.get('name') || '').trim();
  const nameAr = String(formData.get('name_ar') || '').trim() || null;
  if (name.length < 2 || name.length > 40) throw new Error('Give the team a name of 2 to 40 letters');
  const db = createAdminClient();
  const { count } = await db.from('community_teams').select('id', { count: 'exact', head: true }).eq('community_id', ctx.community.id);
  if ((count ?? 0) >= 100) throw new Error('A community can have up to 100 teams');
  await db.from('community_teams').insert({ community_id: ctx.community.id, name, name_ar: nameAr });
  revalidatePath('/leader/teams');
}

export async function removeTeam(teamId: string) {
  const ctx = await requireLeader();
  await createAdminClient().from('community_teams').delete().eq('id', teamId).eq('community_id', ctx.community.id);
  revalidatePath('/leader/teams');
}
