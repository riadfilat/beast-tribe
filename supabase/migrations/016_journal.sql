-- ============================================
-- 016: Journal entries for personal journey tracking
-- ============================================

CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

CREATE INDEX idx_journal_user_date ON journal_entries(user_id, entry_date);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY journal_select ON journal_entries FOR SELECT USING (user_id = auth.uid());
CREATE POLICY journal_insert ON journal_entries FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY journal_update ON journal_entries FOR UPDATE USING (user_id = auth.uid());
