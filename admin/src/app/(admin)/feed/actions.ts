'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function hidePost(postId: string) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const { error } = await db.from('feed_posts')
    .update({ is_hidden: true })
    .eq('id', postId);
  if (error) throw new Error(`Hide post error: ${error.message}`);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'hide_post',
    target_table: 'feed_posts',
    target_id: postId,
  });

  revalidatePath('/feed');
}

export async function hideComment(commentId: string) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  await db.from('feed_comments')
    .update({ is_visible: false, hidden_by: admin.id, hidden_reason: 'admin_removed' })
    .eq('id', commentId);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'hide_comment',
    target_table: 'feed_comments',
    target_id: commentId,
  });

  revalidatePath('/feed/comments');
}

export async function restoreComment(commentId: string) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  await db.from('feed_comments')
    .update({ is_visible: true, hidden_by: null, hidden_reason: null })
    .eq('id', commentId);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'restore_comment',
    target_table: 'feed_comments',
    target_id: commentId,
  });

  revalidatePath('/feed/comments');
}
