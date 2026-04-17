'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function suspendUser(userId: string, reason: string) {
  const admin = await requireAdmin();
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

  revalidatePath(`/users/${userId}`);
}

export async function unsuspendUser(userId: string) {
  const admin = await requireAdmin();
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

  revalidatePath(`/users/${userId}`);
}

export async function resetUserPassword(userId: string) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const { data: userRes, error: fetchErr } = await db.auth.admin.getUserById(userId);
  if (fetchErr || !userRes?.user?.email) {
    throw new Error(`Fetch user error: ${fetchErr?.message || 'no email'}`);
  }

  const { error } = await db.auth.admin.generateLink({
    type: 'recovery',
    email: userRes.user.email,
  });
  if (error) throw new Error(`Reset password error: ${error.message}`);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'reset_user_password',
    target_table: 'auth.users',
    target_id: userId,
    details: { email: userRes.user.email },
  });

  revalidatePath(`/users/${userId}`);
}
