-- 079: a group is either open inside its community or invite only.
-- Until now every group was a private circle: people got in with the code or an invite. A leader can
-- now open a group to everyone in its community: members of that community find it on the Groups tab
-- and join with one tap. Invite only stays the default.

ALTER TABLE public.packs ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'invite'
  CHECK (visibility IN ('open', 'invite'));
-- Column grants (see 049/073): new columns need their own.
GRANT SELECT (visibility), INSERT (visibility), UPDATE (visibility) ON public.packs TO authenticated;

-- Whether a member fits a group's audience (women only / men only / everyone).
CREATE OR REPLACE FUNCTION public.bt_fits_audience(p_audience TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(p_audience, 'everyone') = 'everyone'
      OR (p_audience = 'women' AND bt_my_gender() = 'female')
      OR (p_audience = 'men' AND bt_my_gender() = 'male')
$$;
REVOKE ALL ON FUNCTION public.bt_fits_audience(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bt_fits_audience(TEXT) TO authenticated;

-- Open groups are visible to the members of their community who fit the audience.
DROP POLICY IF EXISTS packs_select ON public.packs;
CREATE POLICY packs_select ON public.packs FOR SELECT USING (
  id IN (SELECT bt_my_pack_ids())
  OR created_by = (SELECT auth.uid())
  OR (is_community_default AND community_id IN (SELECT bt_my_community_ids()))
  OR (visibility = 'open' AND NOT is_system AND community_id IN (SELECT bt_my_community_ids()) AND bt_fits_audience(audience))
  OR (SELECT is_admin())
);

-- Open groups in my communities that I'm not in yet, with how many are in each.
CREATE OR REPLACE FUNCTION public.open_packs()
RETURNS TABLE (id UUID, name TEXT, animal TEXT, emblem_kind TEXT, emblem_value TEXT, emblem_color TEXT, photo_url TEXT,
               audience TEXT, community_id UUID, community_name TEXT, members INT, max_members INT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.name, p.animal, p.emblem_kind, p.emblem_value, p.emblem_color, p.photo_url, p.audience,
         p.community_id, c.name, (SELECT count(*)::INT FROM pack_members m WHERE m.pack_id = p.id), coalesce(p.max_members, 20)
  FROM packs p JOIN communities c ON c.id = p.community_id
  WHERE auth.uid() IS NOT NULL
    AND p.visibility = 'open' AND NOT coalesce(p.is_system, false) AND NOT coalesce(p.is_community_default, false)
    AND p.community_id IN (SELECT bt_my_community_ids())
    AND bt_fits_audience(p.audience)
    AND NOT EXISTS (SELECT 1 FROM pack_members m WHERE m.pack_id = p.id AND m.user_id = auth.uid())
  ORDER BY (SELECT count(*) FROM pack_members m WHERE m.pack_id = p.id) DESC, p.created_at DESC
  LIMIT 50
$$;
REVOKE ALL ON FUNCTION public.open_packs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.open_packs() TO authenticated;

-- Join an open group in one of my communities.
CREATE OR REPLACE FUNCTION public.join_open_pack(p_pack UUID)
RETURNS TABLE (id UUID, name TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_p packs%ROWTYPE;
  v_gender TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN'; END IF;
  SELECT * INTO v_p FROM packs pk WHERE pk.id = p_pack;
  IF NOT FOUND OR v_p.visibility <> 'open' OR coalesce(v_p.is_system, false)
     OR v_p.community_id NOT IN (SELECT bt_my_community_ids()) THEN
    RAISE EXCEPTION 'INVALID';
  END IF;
  IF EXISTS (SELECT 1 FROM pack_members m WHERE m.pack_id = v_p.id AND m.user_id = auth.uid()) THEN RAISE EXCEPTION 'ALREADY'; END IF;
  IF v_p.audience <> 'everyone' THEN
    v_gender := bt_my_gender();
    IF v_gender IS NULL THEN RAISE EXCEPTION 'PACK_GENDER_NEEDED'; END IF;
    IF NOT bt_fits_audience(v_p.audience) THEN
      RAISE EXCEPTION '%', CASE v_p.audience WHEN 'women' THEN 'PACK_WOMEN_ONLY' ELSE 'PACK_MEN_ONLY' END;
    END IF;
  END IF;
  IF (SELECT count(*) FROM pack_members m WHERE m.pack_id = v_p.id) >= coalesce(v_p.max_members, 20) THEN RAISE EXCEPTION 'FULL'; END IF;
  IF (SELECT count(*) FROM pack_members m WHERE m.user_id = auth.uid()) >= 20 THEN RAISE EXCEPTION 'LIMIT'; END IF;
  INSERT INTO pack_members (pack_id, user_id, role) VALUES (v_p.id, auth.uid(), 'member');
  RETURN QUERY SELECT v_p.id, v_p.name;
END $$;
REVOKE ALL ON FUNCTION public.join_open_pack(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_open_pack(UUID) TO authenticated;
