-- ============================================
-- 034: Partners — make admin partner creation work.
-- The live `partners` table came from an older definition (name, slug, type
-- enum, status enum), so 006_partners.sql was skipped by IF NOT EXISTS. The admin
-- dashboard writes business_name / partner_type / contact_email / is_verified, so
-- every "add partner" insert failed and no coach ever appeared in the app.
-- Additive fix: add the admin's columns and keep both naming schemes in sync.
-- ============================================

ALTER TABLE partners ADD COLUMN IF NOT EXISTS partner_type TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS sports TEXT[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION partners_sync_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.business_name := coalesce(nullif(NEW.business_name, ''), NEW.name);
  NEW.name := coalesce(nullif(NEW.name, ''), NEW.business_name);

  IF NEW.partner_type IS NULL AND NEW.type IS NOT NULL THEN
    NEW.partner_type := NEW.type::text;
  END IF;
  IF NEW.partner_type IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.partner_type IS DISTINCT FROM OLD.partner_type) THEN
    NEW.type := CASE
      WHEN NEW.partner_type IN ('coach', 'gym', 'event_company', 'nutrition', 'equipment', 'other')
        THEN NEW.partner_type::partner_type
      ELSE 'other'::partner_type
    END;
  END IF;

  NEW.contact_email := coalesce(NEW.contact_email, NEW.email);
  NEW.email := coalesce(NEW.email, NEW.contact_email);
  NEW.contact_phone := coalesce(NEW.contact_phone, NEW.phone);
  NEW.phone := coalesce(NEW.phone, NEW.contact_phone);
  NEW.verified := NEW.is_verified OR coalesce(NEW.verified, false);

  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := trim(BOTH '-' FROM regexp_replace(lower(coalesce(NEW.name, 'partner')), '[^a-z0-9]+', '-', 'g'))
      || '-' || substr(replace(NEW.id::text, '-', ''), 1, 6);
  END IF;

  -- Visibility in the app follows the admin's flags (public read = status 'active').
  IF NOT NEW.is_active THEN
    NEW.status := 'inactive';
  ELSIF NEW.is_verified AND NEW.status IN ('pending', 'inactive') THEN
    NEW.status := 'active';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_partners_sync_columns ON partners;
CREATE TRIGGER trg_partners_sync_columns
  BEFORE INSERT OR UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION partners_sync_columns();

SELECT 'Partners: admin columns added and synced' AS status;
