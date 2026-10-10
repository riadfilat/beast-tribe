'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireRole, userSupabase } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function suspendUser(userId: string, reason: string) {
  const admin = await requireRole('admin');
  const db = createAdminClient();

  const { error } = await db.auth.admin.updateUserById(userId, {
    ban_duration: '876000h',
  });
  if (error) throw new Error(`Suspend user error: ${error.message}`);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'suspend_user',
    target_table: 'auth.users',
    target_id: userId,
    details: { reason },
  });

  revalidatePath(`/hq/people/${userId}`);
}

export async function unsuspendUser(userId: string) {
  const admin = await requireRole('admin');
  const db = createAdminClient();

  const { error } = await db.auth.admin.updateUserById(userId, {
    ban_duration: 'none',
  });
  if (error) throw new Error(`Unsuspend user error: ${error.message}`);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'unsuspend_user',
    target_table: 'auth.users',
    target_id: userId,
  });

  revalidatePath(`/hq/people/${userId}`);
}

export async function resetUserPassword(userId: string) {
  const admin = await requireRole('admin');
  const db = createAdminClient();

  const { data: userRes, error: fetchErr } = await db.auth.admin.getUserById(userId);
  if (fetchErr || !userRes?.user?.email) {
    throw new Error(`Fetch user error: ${fetchErr?.message || 'no email'}`);
  }

  const { error } = await db.auth.resetPasswordForEmail(userRes.user.email);
  if (error) throw new Error(`Reset password error: ${error.message}`);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'reset_user_password',
    target_table: 'auth.users',
    target_id: userId,
    details: { email: userRes.user.email },
  });

  revalidatePath(`/hq/people/${userId}`);
}

export type DeleteState = { error?: string } | undefined;

const DELETE_ERRORS: Record<string, string> = {
  SUPER_ADMIN_ONLY: 'Only the super admin can delete accounts.',
  NOT_YOURSELF: 'You can’t delete your own account here.',
  IS_ADMIN: 'This person is on the HQ team. Remove their admin role first (Admins).',
  IS_LEADER: 'This person leads a community. Hand it over or remove them from its team first.',
  NO_ACCOUNT: 'This account no longer exists.',
};

/**
 * Delete a member's account for good (super admin only). The database checks the rules again
 * (delete_member, migration 099) and writes the staff log; the name typed must match.
 */
export async function deleteMember(userId: string, expected: string, _prev: DeleteState, formData: FormData): Promise<DeleteState> {
  await requireRole('super_admin');
  const typed = String(formData.get('confirm') || '').trim().toLowerCase();
  if (!typed || typed !== expected.trim().toLowerCase()) return { error: 'Type their name exactly as shown to confirm.' };
  const { error } = await (await userSupabase()).rpc('delete_member', { p_user: userId });
  if (error) return { error: DELETE_ERRORS[Object.keys(DELETE_ERRORS).find((k) => error.message.includes(k)) || ''] || 'Could not delete the account. Please try again.' };
  revalidatePath('/hq/people');
  redirect(`/hq/people?deleted=${encodeURIComponent(expected)}`);
}
