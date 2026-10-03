import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useQuery, invalidate } from './query';
import { PREVIEW, PREVIEW_ME, previewNotifications } from './preview';

export interface InboxItem {
  id: string;
  type: string;
  actorId: string | null;
  actorName: string | null;
  eventId: string | null;
  eventTitle: string | null;
  postId: string | null;
  communityId: string | null;
  read: boolean;
  createdAt: Date;
}

function toItem(r: any): InboxItem {
  const d = r.data || {};
  return {
    id: r.id,
    type: r.type,
    actorId: r.actor_id ?? null,
    actorName: d.actor_name ?? null,
    eventId: d.event_id ?? null,
    eventTitle: d.event_title ?? null,
    postId: d.post_id ?? null,
    communityId: d.community_id ?? null,
    read: !!r.read_at,
    createdAt: new Date(r.created_at),
  };
}

export function useInbox() {
  const { user } = useAuth();
  const me = PREVIEW ? PREVIEW_ME : user?.id;
  return useQuery<InboxItem[]>(me ? `inbox:list:${me}` : null, async () => {
    if (PREVIEW) return previewNotifications().map(toItem);
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, actor_id, data, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(60);
    if (error) throw error;
    return (data || []).map(toItem);
  });
}

export function useUnreadCount() {
  const { user } = useAuth();
  const me = PREVIEW ? PREVIEW_ME : user?.id;
  const q = useQuery<number>(me ? `inbox:unread:${me}` : null, async () => {
    if (PREVIEW) return previewNotifications().filter((n) => !n.read_at).length;
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null);
    if (error) throw error;
    return count ?? 0;
  });
  return q.data ?? 0;
}

/** Keep the bell's unread dot live: refresh the inbox the moment a notification lands. */
export function useInboxLive() {
  const { user } = useAuth();
  const me = user?.id;
  useEffect(() => {
    if (PREVIEW || !me) return;
    const channel = supabase
      .channel(`inbox:${me}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${me}` }, () => invalidate('inbox:'))
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [me]);
}

export async function markAllRead(meId?: string | null) {
  if (PREVIEW || !meId) return;
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', meId).is('read_at', null);
  invalidate('inbox:');
}
