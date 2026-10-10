'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Closing member reports. The table allows 'pending', 'reviewed' and 'dismissed' (migration 007):
// Resolve = 'reviewed' (we dealt with it), Dismiss = 'dismissed' (nothing wrong).

async function close(reportId: string, status: 'reviewed' | 'dismissed') {
  const admin = await requireRole('moderator');
  const db = createAdminClient();
  const { error } = await db.from('content_reports')
    .update({ status, reviewed_by: admin.id, reviewed_at: new Date().toISOString() })
    .eq('id', reportId);
  if (error) throw new Error(`Report error: ${error.message}`);
  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: status === 'reviewed' ? 'resolve_report' : 'dismiss_report',
    target_table: 'content_reports',
    target_id: reportId,
  });
  revalidatePath('/hq/safety');
}

export async function resolveReport(reportId: string) {
  await close(reportId, 'reviewed');
}

export async function dismissReport(reportId: string) {
  await close(reportId, 'dismissed');
}

/** Hide the reported post or comment and close every open report about it, in one step. */
export async function hideAndResolve(reportId: string) {
  const admin = await requireRole('moderator');
  const db = createAdminClient();
  const { data: r } = await db.from('content_reports').select('target_table, target_id').eq('id', reportId).maybeSingle();
  if (!r) return;
  const { error } = r.target_table === 'feed_posts'
    ? await db.from('feed_posts').update({ is_hidden: true }).eq('id', r.target_id)
    : r.target_table === 'feed_comments'
      ? await db.from('feed_comments').update({ status: 'hidden' }).eq('id', r.target_id)
      : { error: { message: 'Only posts and comments can be hidden from here.' } };
  if (error) throw new Error(`Hide error: ${error.message}`);
  await db.from('content_reports')
    .update({ status: 'reviewed', reviewed_by: admin.id, reviewed_at: new Date().toISOString() })
    .eq('target_table', r.target_table).eq('target_id', r.target_id).eq('status', 'pending');
  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: r.target_table === 'feed_posts' ? 'hide_post' : 'hide_comment',
    target_table: r.target_table,
    target_id: r.target_id,
    details: { report_id: reportId },
  });
  revalidatePath('/hq/safety');
}
