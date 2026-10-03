-- 061 Schools run a community of their own (facilities, classes, access for their people).
ALTER TABLE communities DROP CONSTRAINT IF EXISTS communities_kind_chk;
ALTER TABLE communities ADD CONSTRAINT communities_kind_chk CHECK (kind IN ('club', 'gym', 'company', 'compound', 'city', 'brand', 'school'));
