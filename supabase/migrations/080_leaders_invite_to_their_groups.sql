-- 080: the leader of a group can always invite people to it.
-- Since 072 every group sits inside a community, so the old rule ("a group in a community: only that
-- community's admins invite") left leaders without their own group's code. Now the group's creator
-- or leader can invite, as can the community's admins. A community's own default group stays with its
-- admins. Joining still requires being in the community (bt_pack_join_community_guard).
CREATE OR REPLACE FUNCTION public.bt_can_invite_pack(p_pack uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND (
    is_admin(auth.uid()) OR EXISTS (
      SELECT 1 FROM packs pk WHERE pk.id = p_pack AND (
        (NOT coalesce(pk.is_community_default, false) AND NOT coalesce(pk.is_system, false) AND (
          pk.created_by = auth.uid()
          OR EXISTS (SELECT 1 FROM pack_members pm WHERE pm.pack_id = pk.id AND pm.user_id = auth.uid() AND pm.role = 'leader')
        ))
        OR (pk.community_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM community_members m WHERE m.community_id = pk.community_id AND m.user_id = auth.uid() AND m.role = 'admin'
        ))
      )
    )
  )
$$;
