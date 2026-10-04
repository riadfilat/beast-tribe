-- 066 Group photos, and every uploaded photo checked for content that isn't allowed.
--
-- Groups (packs) get photo_url (the app uploads a 512 px JPEG).
--
-- Image checks: whenever a photo from our storage is attached to a post, profile, session, group,
-- place or facility, a row lands in image_moderation_queue and the database asks the admin site
-- (/api/moderate, shared secret) to check it. The site classifies it (Claude vision when
-- ANTHROPIC_API_KEY is set) and takes blocked photos down at once; unclear ones stay "pending" for
-- an admin. Without a key every photo waits in the queue for a person. Done in the database, so it
-- catches uploads from every app build and every path.

ALTER TABLE packs ADD COLUMN IF NOT EXISTS photo_url TEXT CHECK (photo_url IS NULL OR length(photo_url) <= 600);
GRANT SELECT (photo_url), INSERT (photo_url), UPDATE (photo_url) ON packs TO authenticated;

-- Shared secret between the database and the admin site (read by the site with the service role).
INSERT INTO app_settings (key, value)
VALUES ('moderation', jsonb_build_object('secret', encode(gen_random_bytes(24), 'hex'), 'endpoint', 'https://beast-tribe.vercel.app/api/moderate'))
ON CONFLICT (key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_image_queue_url ON image_moderation_queue (image_url);
CREATE INDEX IF NOT EXISTS idx_image_queue_status ON image_moderation_queue (status, created_at DESC);

CREATE OR REPLACE FUNCTION bt_check_image() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  col TEXT := TG_ARGV[0];
  owner_col TEXT := TG_ARGV[1];
  new_url TEXT;
  old_url TEXT;
  owner UUID;
  prior RECORD;
  qid UUID;
  cfg JSONB;
BEGIN
  new_url := to_jsonb(NEW) ->> col;
  IF TG_OP = 'UPDATE' THEN old_url := to_jsonb(OLD) ->> col; END IF;
  IF new_url IS NULL OR new_url = coalesce(old_url, '') THEN RETURN NULL; END IF;
  -- Only our own uploads (stock photos like the Unsplash place pictures are not checked).
  IF position('/storage/v1/object/public/' IN new_url) = 0 THEN RETURN NULL; END IF;
  owner := nullif(to_jsonb(NEW) ->> owner_col, '')::UUID;

  -- The same picture again (a weekly series reuses its cover): reuse the earlier verdict.
  SELECT id, status INTO prior FROM image_moderation_queue WHERE image_url = new_url ORDER BY created_at DESC LIMIT 1;
  IF FOUND THEN
    IF prior.status IN ('rejected', 'auto_rejected') THEN
      EXECUTE format('UPDATE %I SET %I = NULL WHERE id = $1', TG_TABLE_NAME, col) USING NEW.id;
    END IF;
    RETURN NULL;
  END IF;

  INSERT INTO image_moderation_queue (image_url, source_table, source_id, uploaded_by, status)
  VALUES (new_url, TG_TABLE_NAME, NEW.id, owner, 'pending')
  RETURNING id INTO qid;

  SELECT value INTO cfg FROM app_settings WHERE key = 'moderation';
  IF cfg IS NOT NULL THEN
    PERFORM net.http_post(
      url := cfg ->> 'endpoint',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-bt-secret', cfg ->> 'secret'),
      body := jsonb_build_object('id', qid)
    );
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_check_image_posts ON feed_posts;
CREATE TRIGGER trg_check_image_posts AFTER INSERT OR UPDATE OF image_url ON feed_posts FOR EACH ROW EXECUTE FUNCTION bt_check_image('image_url', 'user_id');
DROP TRIGGER IF EXISTS trg_check_image_profiles ON profiles;
CREATE TRIGGER trg_check_image_profiles AFTER INSERT OR UPDATE OF avatar_url ON profiles FOR EACH ROW EXECUTE FUNCTION bt_check_image('avatar_url', 'id');
DROP TRIGGER IF EXISTS trg_check_image_events ON events;
CREATE TRIGGER trg_check_image_events AFTER INSERT OR UPDATE OF image_url ON events FOR EACH ROW EXECUTE FUNCTION bt_check_image('image_url', 'created_by');
DROP TRIGGER IF EXISTS trg_check_image_packs ON packs;
CREATE TRIGGER trg_check_image_packs AFTER INSERT OR UPDATE OF photo_url ON packs FOR EACH ROW EXECUTE FUNCTION bt_check_image('photo_url', 'created_by');
DROP TRIGGER IF EXISTS trg_check_image_locations ON popular_locations;
CREATE TRIGGER trg_check_image_locations AFTER INSERT OR UPDATE OF image_url ON popular_locations FOR EACH ROW EXECUTE FUNCTION bt_check_image('image_url', 'none');
DROP TRIGGER IF EXISTS trg_check_image_facilities ON facilities;
CREATE TRIGGER trg_check_image_facilities AFTER INSERT OR UPDATE OF image_url ON facilities FOR EACH ROW EXECUTE FUNCTION bt_check_image('image_url', 'none');

-- Take a blocked photo off what shows it (service role: the admin site calls this).
CREATE OR REPLACE FUNCTION bt_take_down_image(p_queue UUID, p_reason TEXT, p_result JSONB DEFAULT NULL, p_by UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  q image_moderation_queue%ROWTYPE;
BEGIN
  SELECT * INTO q FROM image_moderation_queue WHERE id = p_queue;
  IF NOT FOUND THEN RETURN NULL; END IF;
  UPDATE image_moderation_queue
     SET status = CASE WHEN p_by IS NULL THEN 'auto_rejected' ELSE 'rejected' END, rejection_reason = p_reason, auto_scan_result = coalesce(p_result, auto_scan_result),
         reviewed_by = p_by, reviewed_at = now()
   WHERE id = p_queue;
  -- Everywhere this picture is used.
  UPDATE feed_posts SET image_url = NULL, is_hidden = true WHERE image_url = q.image_url;
  UPDATE profiles SET avatar_url = NULL WHERE avatar_url = q.image_url;
  UPDATE events SET image_url = NULL WHERE image_url = q.image_url;
  UPDATE packs SET photo_url = NULL WHERE photo_url = q.image_url;
  UPDATE popular_locations SET image_url = NULL WHERE image_url = q.image_url;
  UPDATE facilities SET image_url = NULL WHERE image_url = q.image_url;
  RETURN q.image_url;
END $$;
REVOKE ALL ON FUNCTION bt_take_down_image(UUID, TEXT, JSONB, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION bt_take_down_image(UUID, TEXT, JSONB, UUID) TO service_role;
