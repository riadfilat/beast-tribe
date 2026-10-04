import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { PREVIEW, PREVIEW_ME } from './preview';

export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  kind: 'text' | 'status' | 'ping';
  createdAt: Date;
  authorName: string;
  authorAvatar: string | null;
}

const SELECT = 'id, user_id, content, message_type, created_at, author:profiles(display_name, full_name, avatar_url)';

function toMsg(r: any): ChatMessage {
  return {
    id: r.id,
    userId: r.user_id,
    content: r.content || '',
    kind: r.message_type === 'status' || r.message_type === 'ping' ? r.message_type : 'text',
    createdAt: new Date(r.created_at),
    authorName: r.author?.display_name || r.author?.full_name || '',
    authorAvatar: r.author?.avatar_url ?? null,
  };
}

function previewMessages(): ChatMessage[] {
  const ago = (m: number) => new Date(Date.now() - m * 60000);
  const mk = (id: string, userId: string, name: string, content: string, kind: ChatMessage['kind'], min: number): ChatMessage => ({
    id, userId, content, kind, createdAt: ago(min), authorName: name, authorAvatar: null,
  });
  return [
    mk('m1', 'p-sara', 'Sara Al-Qahtani', 'Courts 3 and 4 are ours. Bring an extra ball if you have one.', 'text', 95),
    mk('m2', 'p-majed', 'Majed Al-Otaibi', 'status:onMyWay', 'status', 30),
    mk('m3', PREVIEW_ME, 'Noor', "Leaving now, parking by the north gate.", 'text', 22),
    mk('m4', 'p-lama', 'Lama K', 'status:arrived', 'status', 6),
  ];
}

/**
 * A session or pack chat: finds (or creates) the room, loads history, and
 * stays live through Supabase Realtime.
 */
export function useLiveChat(type: 'event' | 'pack', targetId?: string | null) {
  const { user, profile } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const seen = useRef(new Set<string>());

  const append = useCallback((m: ChatMessage) => {
    if (seen.current.has(m.id)) return;
    seen.current.add(m.id);
    setMessages((prev) => [...prev, m]);
  }, []);

  useEffect(() => {
    if (!targetId) return;
    let alive = true;
    seen.current = new Set();
    if (PREVIEW) {
      const msgs = previewMessages();
      msgs.forEach((m) => seen.current.add(m.id));
      setMessages(msgs);
      setRoomId('preview-room');
      setLoading(false);
      return;
    }
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      setLoading(true);
      setError(null);
      const column = type === 'pack' ? 'pack_id' : 'event_id';
      let { data: room, error: findErr } = await supabase.from('chat_rooms').select('id').eq(column, targetId).maybeSingle();
      if (!room && !findErr) {
        const created = await supabase.from('chat_rooms').insert({ type, [column]: targetId, name: `${type} chat` }).select('id').maybeSingle();
        room = created.data;
        findErr = created.error;
      }
      if (!alive) return;
      if (!room) {
        setError(findErr?.message || 'no room');
        setLoading(false);
        return;
      }
      setRoomId(room.id);
      const { data, error: msgErr } = await supabase
        .from('chat_messages')
        .select(SELECT)
        .eq('room_id', room.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!alive) return;
      if (msgErr) setError(msgErr.message);
      // The newest 100, shown oldest first.
      const msgs = (data || []).reverse().map(toMsg);
      msgs.forEach((m) => seen.current.add(m.id));
      setMessages(msgs);
      setLoading(false);

      channel = supabase
        .channel(`chat:${room.id}:${Math.random().toString(36).slice(2, 8)}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${room.id}` }, async (payload: any) => {
          const row = payload.new;
          if (!row || seen.current.has(row.id)) return;
          const { data: full } = await supabase.from('chat_messages').select(SELECT).eq('id', row.id).maybeSingle();
          if (alive) append(toMsg(full ?? row));
        })
        .subscribe();
    })();
    return () => {
      alive = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [type, targetId]);

  const send = useCallback(
    async (content: string, kind: ChatMessage['kind'] = 'text') => {
      const text = content.trim();
      if (!text || !roomId || !meId) return;
      setSending(true);
      try {
        if (PREVIEW) {
          append({ id: `local-${Date.now()}`, userId: meId, content: text, kind, createdAt: new Date(), authorName: profile?.display_name || '', authorAvatar: null });
          return;
        }
        const { data, error: sendErr } = await supabase
          .from('chat_messages')
          .insert({ room_id: roomId, user_id: meId, content: text, message_type: kind })
          .select(SELECT)
          .single();
        if (sendErr) throw sendErr;
        append(toMsg(data));
      } finally {
        setSending(false);
      }
    },
    [roomId, meId, profile],
  );

  return { roomId, messages, loading, error, sending, send, meId };
}

/** Post one message into a pack's chat (finding or opening the room), e.g. a finished workout. */
export async function postToPackChat(meId: string, packId: string, content: string) {
  if (PREVIEW) return;
  let { data: room } = await supabase.from('chat_rooms').select('id').eq('pack_id', packId).maybeSingle();
  if (!room) {
    const created = await supabase.from('chat_rooms').insert({ type: 'pack', pack_id: packId, name: 'pack chat' }).select('id').maybeSingle();
    if (created.error) throw created.error;
    room = created.data;
  }
  if (!room) throw new Error('no room');
  const { error } = await supabase.from('chat_messages').insert({ room_id: room.id, user_id: meId, content: content.trim(), message_type: 'text' });
  if (error) throw error;
}
