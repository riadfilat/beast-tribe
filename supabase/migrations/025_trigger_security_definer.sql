-- ============================================
-- 025: Fix trigger functions to use SECURITY DEFINER
-- Triggers that insert into RLS-protected tables must
-- bypass RLS, otherwise they fail for authenticated users
-- ============================================

CREATE OR REPLACE FUNCTION create_pack_chat_room()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chat_rooms (type, pack_id, name)
  VALUES ('pack', NEW.id, NEW.name || ' Chat')
  ON CONFLICT (pack_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_event_chat_room()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chat_rooms (type, event_id, name)
  VALUES ('event', NEW.id, NEW.title || ' Chat')
  ON CONFLICT (event_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Trigger functions updated to SECURITY DEFINER!' AS status;
