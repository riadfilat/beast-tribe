-- ============================================
-- 027: Fix events SELECT policy for pack-exclusive visibility
-- - Public events: visible to everyone (including anonymous)
-- - Pack events: visible only to pack members or creator
-- - Community events (if added later): visible to community members
-- ============================================

DROP POLICY IF EXISTS "Events are public" ON events;
DROP POLICY IF EXISTS events_select ON events;

CREATE POLICY events_select ON events FOR SELECT USING (
  visibility = 'public'
  OR (visibility = 'pack' AND pack_id IN (SELECT pack_id FROM pack_members WHERE user_id = auth.uid()))
  OR auth.uid() = created_by
);

SELECT 'Events SELECT policy updated for visibility filtering' AS status;
