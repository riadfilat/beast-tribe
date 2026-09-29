-- 037: Pack patches replace the neon mascot art.
-- A pack's patch = a symbol (one of Beast Tribe's own glyphs, any emoji, or the pack's
-- letters) on one of six brand colourways. `animal` stays as a legacy mirror of the glyph.
-- Also closes a hole: pack creators could move their pack into any community (or mark it
-- as a community default / system pack), and the SECURITY DEFINER sync trigger would then
-- add every member of that community to their pack.

ALTER TABLE packs
  ADD COLUMN IF NOT EXISTS emblem_kind TEXT NOT NULL DEFAULT 'glyph',
  ADD COLUMN IF NOT EXISTS emblem_value TEXT,
  ADD COLUMN IF NOT EXISTS emblem_color TEXT NOT NULL DEFAULT 'slate';

-- Existing packs keep their animal in the new drawings: eagle -> falcon, tiger -> leopard
-- ("نمر" either way). Anything else (e.g. 'custom') becomes the wolf.
UPDATE packs SET
  emblem_kind = 'glyph',
  emblem_value = CASE lower(coalesce(animal, ''))
    WHEN 'eagle' THEN 'falcon'
    WHEN 'tiger' THEN 'leopard'
    WHEN 'rhino' THEN 'rhino'
    ELSE 'wolf' END,
  emblem_color = CASE lower(coalesce(animal, ''))
    WHEN 'eagle' THEN 'dreamer'
    WHEN 'tiger' THEN 'seeker'
    WHEN 'rhino' THEN 'aqua'
    WHEN 'wolf' THEN 'slate'
    ELSE 'dreamer' END
WHERE emblem_value IS NULL;

UPDATE packs SET animal = emblem_value WHERE emblem_kind = 'glyph' AND animal IS DISTINCT FROM emblem_value;

ALTER TABLE packs DROP CONSTRAINT IF EXISTS packs_emblem_kind_chk;
ALTER TABLE packs ADD CONSTRAINT packs_emblem_kind_chk CHECK (emblem_kind IN ('glyph', 'emoji', 'letters'));
ALTER TABLE packs DROP CONSTRAINT IF EXISTS packs_emblem_color_chk;
ALTER TABLE packs ADD CONSTRAINT packs_emblem_color_chk CHECK (emblem_color IN ('slate', 'dreamer', 'seeker', 'aqua', 'orange', 'chalk'));
ALTER TABLE packs DROP CONSTRAINT IF EXISTS packs_emblem_value_chk;
ALTER TABLE packs ADD CONSTRAINT packs_emblem_value_chk CHECK (
  (emblem_kind = 'glyph' AND emblem_value IS NOT NULL AND emblem_value ~ '^[a-z]{2,16}$')
  OR (emblem_kind = 'emoji' AND emblem_value IS NOT NULL AND char_length(emblem_value) BETWEEN 1 AND 24)
  OR (emblem_kind = 'letters' AND (emblem_value IS NULL OR char_length(emblem_value) BETWEEN 1 AND 3))
);

-- Writers that only know `animal` (older app builds, older admin) still produce a valid
-- patch, and `animal` always mirrors the glyph for anything that still reads it.
CREATE OR REPLACE FUNCTION bt_packs_emblem() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.emblem_kind = 'glyph' THEN
    IF NEW.emblem_value IS NULL OR (TG_OP = 'UPDATE' AND NEW.animal IS DISTINCT FROM OLD.animal AND NEW.emblem_value IS NOT DISTINCT FROM OLD.emblem_value) THEN
      NEW.emblem_value := CASE lower(coalesce(NEW.animal, ''))
        WHEN 'eagle' THEN 'falcon'
        WHEN 'tiger' THEN 'leopard'
        WHEN '' THEN 'wolf'
        ELSE lower(NEW.animal) END;
      IF NEW.emblem_value !~ '^[a-z]{2,16}$' THEN
        NEW.emblem_value := 'wolf';
      END IF;
    END IF;
    NEW.animal := NEW.emblem_value;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_packs_emblem ON packs;
CREATE TRIGGER trg_packs_emblem BEFORE INSERT OR UPDATE ON packs
  FOR EACH ROW EXECUTE FUNCTION bt_packs_emblem();

-- Members may only create ordinary packs, and may not move a pack between communities,
-- turn it into a community default or system pack, or hand it to someone else.
-- Admins (admin_roles) and the service role (no auth.uid()) are not limited.
CREATE OR REPLACE FUNCTION bt_packs_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF coalesce(NEW.is_system, false) OR NEW.is_community_default OR NEW.community_id IS NOT NULL THEN
      RAISE EXCEPTION 'packs: members cannot create community or system packs' USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.community_id IS DISTINCT FROM OLD.community_id
     OR NEW.is_community_default IS DISTINCT FROM OLD.is_community_default
     OR NEW.is_system IS DISTINCT FROM OLD.is_system
     OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'packs: members cannot change community, system or owner fields' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_packs_guard ON packs;
CREATE TRIGGER trg_packs_guard BEFORE INSERT OR UPDATE ON packs
  FOR EACH ROW EXECUTE FUNCTION bt_packs_guard();

-- Duplicates of packs_insert_own / packs_update_own from an earlier migration.
DROP POLICY IF EXISTS "Pack creator can update" ON packs;
DROP POLICY IF EXISTS "Users can create packs" ON packs;
