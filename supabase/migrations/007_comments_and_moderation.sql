-- ============================================
-- FEED COMMENTS
-- ============================================

CREATE TABLE feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  hidden_by UUID REFERENCES profiles(id),
  hidden_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read visible comments" ON feed_comments
  FOR SELECT USING (is_visible = true OR user_id = auth.uid() OR is_moderator_or_above());
CREATE POLICY "Users create own comments" ON feed_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON feed_comments
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Moderators can hide comments" ON feed_comments
  FOR UPDATE USING (is_moderator_or_above());

CREATE INDEX idx_feed_comments_post ON feed_comments(post_id, created_at);
CREATE INDEX idx_feed_comments_user ON feed_comments(user_id);

-- ============================================
-- IMAGE MODERATION
-- ============================================

-- Add image support to feed_posts
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS image_status TEXT DEFAULT 'approved'
  CHECK (image_status IN ('pending', 'approved', 'rejected'));

-- Moderation queue for all uploaded images
CREATE TABLE image_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  source_table TEXT NOT NULL,
  source_id UUID NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  auto_scan_result JSONB,
  auto_scan_score NUMERIC(4,3),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'auto_approved', 'auto_rejected', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE image_moderation_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Moderators can read queue" ON image_moderation_queue
  FOR SELECT USING (is_moderator_or_above());
CREATE POLICY "Moderators can update queue" ON image_moderation_queue
  FOR UPDATE USING (is_moderator_or_above());
CREATE POLICY "Uploaders can insert" ON image_moderation_queue
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE INDEX idx_mod_queue_status ON image_moderation_queue(status);
CREATE INDEX idx_mod_queue_created ON image_moderation_queue(created_at DESC);

-- ============================================
-- CONTENT REPORTS (user-submitted flags)
-- ============================================

CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  target_table TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('inappropriate', 'spam', 'harassment', 'nudity', 'other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users create reports" ON content_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Moderators read reports" ON content_reports
  FOR SELECT USING (is_moderator_or_above());
CREATE POLICY "Moderators update reports" ON content_reports
  FOR UPDATE USING (is_moderator_or_above());

CREATE INDEX idx_reports_status ON content_reports(status);
CREATE INDEX idx_reports_target ON content_reports(target_table, target_id);
