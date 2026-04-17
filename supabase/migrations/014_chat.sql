-- ============================================
-- 014: Chat rooms & messages
-- Pack group chat + event/activity chat threads
-- ============================================

-- Chat rooms — one per pack, one per event
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('pack', 'event')),
  pack_id UUID REFERENCES packs(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pack_id),
  UNIQUE(event_id)
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'status', 'ping')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_messages_room ON chat_messages(room_id, created_at DESC);
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);

-- RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat rooms: readable by members (pack members or event RSVPs)
CREATE POLICY chat_rooms_select ON chat_rooms FOR SELECT USING (
  (type = 'pack' AND pack_id IN (SELECT pack_id FROM pack_members WHERE user_id = auth.uid()))
  OR
  (type = 'event' AND event_id IN (SELECT event_id FROM event_rsvps WHERE user_id = auth.uid() AND status = 'going'))
);

-- Chat messages: readable if user can access the room
CREATE POLICY chat_messages_select ON chat_messages FOR SELECT USING (
  room_id IN (SELECT id FROM chat_rooms WHERE
    (type = 'pack' AND pack_id IN (SELECT pack_id FROM pack_members WHERE user_id = auth.uid()))
    OR
    (type = 'event' AND event_id IN (SELECT event_id FROM event_rsvps WHERE user_id = auth.uid() AND status = 'going'))
  )
);

-- Chat messages: users can insert in rooms they belong to
CREATE POLICY chat_messages_insert ON chat_messages FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND room_id IN (SELECT id FROM chat_rooms WHERE
    (type = 'pack' AND pack_id IN (SELECT pack_id FROM pack_members WHERE user_id = auth.uid()))
    OR
    (type = 'event' AND event_id IN (SELECT event_id FROM event_rsvps WHERE user_id = auth.uid() AND status = 'going'))
  )
);

-- Auto-create chat room when a pack is created
CREATE OR REPLACE FUNCTION create_pack_chat_room()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chat_rooms (type, pack_id, name)
  VALUES ('pack', NEW.id, NEW.name || ' Chat')
  ON CONFLICT (pack_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pack_chat_room
  AFTER INSERT ON packs
  FOR EACH ROW
  EXECUTE FUNCTION create_pack_chat_room();

-- Auto-create chat room when an event is created
CREATE OR REPLACE FUNCTION create_event_chat_room()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chat_rooms (type, event_id, name)
  VALUES ('event', NEW.id, NEW.title || ' Chat')
  ON CONFLICT (event_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_event_chat_room
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION create_event_chat_room();
