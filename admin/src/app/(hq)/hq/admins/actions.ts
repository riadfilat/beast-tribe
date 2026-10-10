'use server';

import { revalidatePath } from 'next/cache';
import { requireRole, userSupabase } from '@/lib/auth';

// Only the super admin adds or removes admins and moderators; the database checks it again
// (set_admin_role: never yourself, never another super admin).

export type AdminState = { ok?: string; error?: string } | undefined;

const ERRORS: Record<string, string> = {
  NO_ACCOUNT: 'No verified Beast Tribe account uses that email. Ask them to sign up in the app first.',
  NOT_YOURSELF: 'You can’t change your own role.',
  NOT_SUPER_ADMIN: 'That person is a super admin.',
  SUPER_ADMIN_ONLY: 'Only the super admin can change admins.',
};

export async function setAdmin(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireRole('super_admin');
  const email = String(formData.get('email') || '').trim();
  const role = String(formData.get('role') || '');
  const { error } = await (await userSupabase()).rpc('set_admin_role', { p_email: email, p_role: role === 'none' ? null : role });
  if (error) return { error: ERRORS[Object.keys(ERRORS).find((k) => error.message.includes(k)) || ''] || 'Could not change the role.' };
  revalidatePath('/hq/admins');
  return { ok: role === 'none' ? `${email} is no longer an admin.` : `${email} is now ${role === 'admin' ? 'an admin' : 'a moderator'}.` };
}

export async function removeAdmin(email: string) {
  await requireRole('super_admin');
  await (await userSupabase()).rpc('set_admin_role', { p_email: email, p_role: null });
  revalidatePath('/hq/admins');
}
