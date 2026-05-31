-- ============================================
-- 028: Bulletproofing — missing RLS policies + FK ON DELETE safety
-- Fixes silent-failure tables (RLS enabled but no policies) and
-- rigid foreign keys that block profile/partner deletion.
-- ============================================

-- ---- C1: feed_comments had RLS enabled but ZERO policies (commenting silently dead) ----
-- Schema uses a `status` column (not is_visible). Comments are public content.
DO $$ BEGIN
  CREATE POLICY feed_comments_select ON feed_comments FOR SELECT
    USING (status IS DISTINCT FROM 'hidden' OR user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY feed_comments_insert ON feed_comments FOR INSERT
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY feed_comments_update_own ON feed_comments FOR UPDATE
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY feed_comments_delete_own ON feed_comments FOR DELETE
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---- C2: content_reports had RLS enabled but ZERO policies (reporting silently dead) ----
DO $$ BEGIN
  CREATE POLICY content_reports_insert ON content_reports FOR INSERT
    WITH CHECK (reporter_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY content_reports_select_own ON content_reports FOR SELECT
    USING (reporter_id = auth.uid() OR EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---- C3: image_moderation_queue — allow owner insert (uploads enqueue) ----
DO $$ BEGIN
  CREATE POLICY img_mod_insert_own ON image_moderation_queue FOR INSERT
    WITH CHECK (uploaded_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY img_mod_select_own ON image_moderation_queue FOR SELECT
    USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---- H3: ensure users can edit/delete their own feed posts (021 may have aborted) ----
DO $$ BEGIN
  CREATE POLICY feed_posts_update_own ON feed_posts FOR UPDATE
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY feed_posts_delete_own ON feed_posts FOR DELETE
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---- H1: events FK ON DELETE — don't block profile/partner deletion ----
DO $$ BEGIN
  ALTER TABLE events DROP CONSTRAINT IF EXISTS events_created_by_fkey;
  ALTER TABLE events ADD CONSTRAINT events_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE events DROP CONSTRAINT IF EXISTS events_partner_id_fkey;
  ALTER TABLE events ADD CONSTRAINT events_partner_id_fkey
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL; END $$;

-- ---- H2: pack_invites FK ON DELETE CASCADE ----
DO $$ BEGIN
  ALTER TABLE pack_invites DROP CONSTRAINT IF EXISTS pack_invites_invited_by_fkey;
  ALTER TABLE pack_invites ADD CONSTRAINT pack_invites_invited_by_fkey
    FOREIGN KEY (invited_by) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE pack_invites DROP CONSTRAINT IF EXISTS pack_invites_invited_user_id_fkey;
  ALTER TABLE pack_invites ADD CONSTRAINT pack_invites_invited_user_id_fkey
    FOREIGN KEY (invited_user_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;

-- ---- Document feed_posts.is_hidden so a fresh rebuild keeps it ----
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

SELECT 'Bulletproof RLS + FK migration applied' AS status;
