'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function approveImage(queueId: string) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  // Get the queue entry
  const { data: entry } = await db.from('image_moderation_queue')
    .select('*')
    .eq('id', queueId)
    .single();

  if (!entry) return;

  // Update queue status
  await db.from('image_moderation_queue')
    .update({ status: 'approved', reviewed_by: admin.id, reviewed_at: new Date().toISOString() })
    .eq('id', queueId);

  // Update the source record
  if (entry.source_table === 'feed_posts') {
    await db.from('feed_posts')
      .update({ image_status: 'approved' })
      .eq('id', entry.source_id);
  }

  // Audit
  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'approve_image',
    target_table: 'image_moderation_queue',
    target_id: queueId,
    details: { source_table: entry.source_table, source_id: entry.source_id },
  });

  revalidatePath('/moderation');
}

export async function rejectImage(queueId: string) {
  const reason = 'Inappropriate content';
  const admin = await requireAdmin();
  const db = createAdminClient();

  const { data: entry } = await db.from('image_moderation_queue')
    .select('*')
    .eq('id', queueId)
    .single();

  if (!entry) return;

  // Update queue status
  await db.from('image_moderation_queue')
    .update({
      status: 'rejected',
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason || 'Inappropriate content',
    })
    .eq('id', queueId);

  // Update the source record
  if (entry.source_table === 'feed_posts') {
    await db.from('feed_posts')
      .update({ image_status: 'rejected' })
      .eq('id', entry.source_id);
  }

  // Delete from storage
  if (entry.image_url) {
    const path = entry.image_url.split('/user-uploads/')[1];
    if (path) {
      await db.storage.from('user-uploads').remove([path]);
    }
  }

  // Audit
  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'reject_image',
    target_table: 'image_moderation_queue',
    target_id: queueId,
    details: { source_table: entry.source_table, source_id: entry.source_id, reason },
  });

  revalidatePath('/moderation');
}
