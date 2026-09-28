-- ============================================
-- 035: Live chat + live inbox.
-- The realtime publication had no tables, so session/pack chats only showed
-- new messages after reopening. Row-level security still applies to realtime.
-- ============================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

SELECT string_agg(tablename, ', ') AS realtime_tables
FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
