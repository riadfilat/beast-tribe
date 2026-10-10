'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { removeStoredFile } from '@/lib/moderation';

export async function approveImage(queueId: string) {
  const admin = await requireRole('moderator');
  const db = createAdminClient();

  const { data: entry } = await db.from('image_moderation_queue')
    .select('*')
    .eq('id', queueId)
    .single();

  if (!entry) return;

  const { error: queueError } = await db.from('image_moderation_queue')
    .update({ status: 'approved', reviewed_by: admin.id, reviewed_at: new Date().toISOString() })
    .eq('id', queueId);
  if (queueError) throw new Error(queueError.message);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'approve_image',
    target_table: 'image_moderation_queue',
    target_id: queueId,
    details: { source_table: entry.source_table, source_id: entry.source_id },
  });

  revalidatePath('/hq/safety');
}

export async function rejectImage(queueId: string) {
  const reason = 'Inappropriate content';
  const admin = await requireRole('moderator');
  const db = createAdminClient();

  const { data: entry } = await db.from('image_moderation_queue')
    .select('*')
    .eq('id', queueId)
    .single();

  if (!entry) return;

  // Off everything that shows it (posts are hidden), then the file itself.
  const { error: downError } = await db.rpc('bt_take_down_image', { p_queue: queueId, p_reason: reason, p_result: null, p_by: admin.id });
  if (downError) throw new Error(downError.message);
  if (entry.image_url) await removeStoredFile(entry.image_url).catch(() => {});

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'reject_image',
    target_table: 'image_moderation_queue',
    target_id: queueId,
    details: { source_table: entry.source_table, source_id: entry.source_id, reason },
  });

  revalidatePath('/hq/safety');
}
