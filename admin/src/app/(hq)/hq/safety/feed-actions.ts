'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/auth';
import { removeStoredFile } from '@/lib/moderation';
import { revalidatePath } from 'next/cache';

// Posts and comments in the feed: hide, restore and delete. Moderators may do all of these.

async function audit(adminId: string, action: string, table: string, id: string, details?: Record<string, unknown>) {
  await createAdminClient().from('admin_audit_log').insert({ admin_user_id: adminId, action, target_table: table, target_id: id, ...(details ? { details } : {}) });
}

async function setPostHidden(postId: string, hidden: boolean) {
  const admin = await requireRole('moderator');
  const { error } = await createAdminClient().from('feed_posts').update({ is_hidden: hidden }).eq('id', postId);
  if (error) throw new Error(`${hidden ? 'Hide' : 'Restore'} post error: ${error.message}`);
  await audit(admin.id, hidden ? 'hide_post' : 'restore_post', 'feed_posts', postId);
  revalidatePath('/hq/safety');
}

export async function hidePost(postId: string) {
  await setPostHidden(postId, true);
}

export async function restorePost(postId: string) {
  await setPostHidden(postId, false);
}

/** Delete a post for good (its comments and Beasts go with it), then its photo. Open reports on it are closed. */
export async function deletePost(postId: string) {
  const admin = await requireRole('moderator');
  const db = createAdminClient();
  const { data: post } = await db.from('feed_posts').select('user_id, content, image_url').eq('id', postId).maybeSingle();
  if (!post) return;
  const { error } = await db.from('feed_posts').delete().eq('id', postId);
  if (error) throw new Error(`Delete post error: ${error.message}`);
  if (post.image_url) await removeStoredFile(post.image_url).catch(() => {});
  await db.from('content_reports')
    .update({ status: 'reviewed', reviewed_by: admin.id, reviewed_at: new Date().toISOString() })
    .eq('target_table', 'feed_posts').eq('target_id', postId).eq('status', 'pending');
  await audit(admin.id, 'delete_post', 'feed_posts', postId, { author: post.user_id, content: String(post.content || '').slice(0, 200) });
  revalidatePath('/hq/safety');
}

async function setCommentStatus(commentId: string, status: 'hidden' | 'active') {
  const admin = await requireRole('moderator');
  const { error } = await createAdminClient().from('feed_comments').update({ status }).eq('id', commentId);
  if (error) throw new Error(`${status === 'hidden' ? 'Hide' : 'Restore'} comment error: ${error.message}`);
  await audit(admin.id, status === 'hidden' ? 'hide_comment' : 'restore_comment', 'feed_comments', commentId);
  revalidatePath('/hq/safety');
}

export async function hideComment(commentId: string) {
  await setCommentStatus(commentId, 'hidden');
}

export async function restoreComment(commentId: string) {
  await setCommentStatus(commentId, 'active');
}
