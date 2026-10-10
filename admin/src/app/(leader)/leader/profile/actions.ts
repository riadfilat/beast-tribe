'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase-server';
import { requireLeader } from '@/lib/leader/context';
import { uploadPublicImage } from '@/lib/upload';

export type ProfileState = { ok?: string; error?: string } | undefined;

/** Kinds that always stay private (decided 2026-10-04: companies and schools never list openly). */
const ALWAYS_PRIVATE = ['company', 'school'];

/** Name, about, city, logo and who can join. Changes show in the app straight away. */
export async function saveProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const ctx = await requireLeader();
  const str = (k: string, max: number) => String(formData.get(k) ?? '').trim().slice(0, max);
  const name = str('name', 60);
  if (name.length < 2) return { error: 'Give your community a name.' };
  let logo: string | null = null;
  try {
    logo = await uploadPublicImage(formData.get('logo'), 'community-logos');
  } catch (e: any) {
    return { error: e.message };
  }
  const open = formData.get('visibility') === 'open' && !ALWAYS_PRIVATE.includes(ctx.community.kind || '');
  const update: Record<string, any> = {
    name,
    description: str('description', 600) || null,
    city: str('city', 80) || null,
    visibility: open ? 'open' : 'private',
  };
  if (logo) update.logo_url = logo;
  const db = createAdminClient();
  const { error } = await db.from('communities').update(update).eq('id', ctx.community.id);
  if (error) return { error: /duplicate|unique/i.test(error.message) ? 'Another community already uses that name.' : 'Could not save. Please try again.' };
  // The business record shows the same name and city.
  if (ctx.businessId) await db.from('partners').update({ business_name: name, name, city: update.city }).eq('id', ctx.businessId);
  revalidatePath('/leader', 'layout');
  return { ok: 'Saved. The app shows the new profile.' };
}

/** A new join code; the old one stops working (the database makes the new one). */
export async function newJoinCode() {
  const ctx = await requireLeader();
  await createAdminClient().from('communities').update({ join_code: null }).eq('id', ctx.community.id);
  revalidatePath('/leader/profile');
}
