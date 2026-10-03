-- 048 Women-only and men-only packs
-- packs.audience: everyone | women | men. Joining is checked against the member's profile gender.
-- A direct join (code, invite, creating the pack) that doesn't fit raises a clear error; automatic
-- joins (community default packs, synced by triggers) simply skip members it doesn't fit.

ALTER TABLE packs ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'everyone';
ALTER TABLE packs DROP CONSTRAINT IF EXISTS packs_audience_chk;
ALTER TABLE packs ADD CONSTRAINT packs_audience_chk CHECK (audience IN ('everyone', 'women', 'men'));

CREATE OR REPLACE FUNCTION bt_pack_member_audience() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_audience TEXT;
  v_gender TEXT;
BEGIN
  SELECT audience INTO v_audience FROM packs WHERE id = NEW.pack_id;
  IF v_audience IS NULL OR v_audience = 'everyone' THEN RETURN NEW; END IF;
  SELECT lower(gender) INTO v_gender FROM profiles WHERE id = NEW.user_id;
  IF (v_audience = 'women' AND v_gender = 'female') OR (v_audience = 'men' AND v_gender = 'male') THEN
    RETURN NEW;
  END IF;
  -- Inside another trigger (community default packs): skip quietly.
  IF pg_trigger_depth() > 1 THEN RETURN NULL; END IF;
  IF v_gender IS NULL THEN RAISE EXCEPTION 'PACK_GENDER_NEEDED' USING ERRCODE = '42501'; END IF;
  RAISE EXCEPTION '%', CASE v_audience WHEN 'women' THEN 'PACK_WOMEN_ONLY' ELSE 'PACK_MEN_ONLY' END USING ERRCODE = '42501';
END $$;
DROP TRIGGER IF EXISTS trg_pack_member_audience ON pack_members;
CREATE TRIGGER trg_pack_member_audience BEFORE INSERT ON pack_members
  FOR EACH ROW EXECUTE FUNCTION bt_pack_member_audience();

-- Joining by code: same rule, checked before anything else so the message is right.
CREATE OR REPLACE FUNCTION join_pack_by_code(p_code TEXT) RETURNS TABLE (id UUID, name TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_p packs%ROWTYPE;
  v_size INT;
  v_mine INT;
  v_gender TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN'; END IF;
  SELECT * INTO v_p FROM packs pk WHERE upper(pk.invite_code) = upper(trim(p_code)) AND NOT coalesce(pk.is_system, false);
  IF NOT FOUND THEN RAISE EXCEPTION 'INVALID'; END IF;
  IF EXISTS (SELECT 1 FROM pack_members m WHERE m.pack_id = v_p.id AND m.user_id = auth.uid()) THEN RAISE EXCEPTION 'ALREADY'; END IF;
  IF v_p.audience <> 'everyone' THEN
    SELECT lower(gender) INTO v_gender FROM profiles WHERE profiles.id = auth.uid();
    IF v_gender IS NULL THEN RAISE EXCEPTION 'PACK_GENDER_NEEDED'; END IF;
    IF NOT ((v_p.audience = 'women' AND v_gender = 'female') OR (v_p.audience = 'men' AND v_gender = 'male')) THEN
      RAISE EXCEPTION '%', CASE v_p.audience WHEN 'women' THEN 'PACK_WOMEN_ONLY' ELSE 'PACK_MEN_ONLY' END;
    END IF;
  END IF;
  SELECT count(*) INTO v_size FROM pack_members m WHERE m.pack_id = v_p.id;
  IF v_size >= coalesce(v_p.max_members, 20) THEN RAISE EXCEPTION 'FULL'; END IF;
  SELECT count(*) INTO v_mine FROM pack_members m WHERE m.user_id = auth.uid();
  IF v_mine >= 20 THEN RAISE EXCEPTION 'LIMIT'; END IF;
  INSERT INTO pack_members (pack_id, user_id, role) VALUES (v_p.id, auth.uid(), 'member');
  RETURN QUERY SELECT v_p.id, v_p.name;
END $$;
REVOKE ALL ON FUNCTION join_pack_by_code(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION join_pack_by_code(TEXT) TO authenticated;

-- Pink colourways for pack patches.
ALTER TABLE packs DROP CONSTRAINT IF EXISTS packs_emblem_color_chk;
ALTER TABLE packs ADD CONSTRAINT packs_emblem_color_chk CHECK (emblem_color IN ('slate', 'dreamer', 'seeker', 'aqua', 'orange', 'chalk', 'blush', 'rose'));

-- ════ Invite control (049 folded in) ════
-- Community packs: only the community's admins (and app admins) can invite or see the pack code.
-- Personal packs: only the pack's leader (its creator). Private community codes: community admins only.
-- Fixes: any signed-in user could insert a pack invite for any pack.

CREATE OR REPLACE FUNCTION bt_can_invite_pack(p_pack UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND (
    is_admin(auth.uid()) OR EXISTS (
      SELECT 1 FROM packs pk WHERE pk.id = p_pack AND (
        CASE WHEN pk.community_id IS NOT NULL THEN
          EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = pk.community_id AND m.user_id = auth.uid() AND m.role = 'admin')
        ELSE
          pk.created_by = auth.uid() OR EXISTS (SELECT 1 FROM pack_members pm WHERE pm.pack_id = pk.id AND pm.user_id = auth.uid() AND pm.role = 'leader')
        END
      )
    )
  )
$$;
REVOKE ALL ON FUNCTION bt_can_invite_pack(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION bt_can_invite_pack(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION pack_invite_code(p_pack UUID) RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN bt_can_invite_pack(p_pack) THEN (SELECT invite_code FROM packs WHERE id = p_pack) END
$$;
REVOKE ALL ON FUNCTION pack_invite_code(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION pack_invite_code(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION community_invite_code(p_community UUID) RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN auth.uid() IS NOT NULL AND (is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM community_members m WHERE m.community_id = p_community AND m.user_id = auth.uid() AND m.role = 'admin'
  )) THEN (SELECT join_code FROM communities WHERE id = p_community) END
$$;
REVOKE ALL ON FUNCTION community_invite_code(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION community_invite_code(UUID) TO authenticated;

DROP POLICY IF EXISTS "Pack members can invite" ON pack_invites;
DROP POLICY IF EXISTS pack_invites_insert ON pack_invites;
CREATE POLICY pack_invites_insert ON pack_invites FOR INSERT WITH CHECK (invited_by = auth.uid() AND bt_can_invite_pack(pack_id));

-- Joining a community pack by code needs membership of that community.
CREATE OR REPLACE FUNCTION bt_pack_join_community_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_c UUID;
BEGIN
  IF pg_trigger_depth() > 1 OR auth.uid() IS NULL OR is_admin(auth.uid()) THEN RETURN NEW; END IF;
  SELECT community_id INTO v_c FROM packs WHERE id = NEW.pack_id;
  IF v_c IS NOT NULL AND NOT EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = v_c AND m.user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'COMMUNITY_ONLY' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_pack_join_community_guard ON pack_members;
CREATE TRIGGER trg_pack_join_community_guard BEFORE INSERT ON pack_members
  FOR EACH ROW EXECUTE FUNCTION bt_pack_join_community_guard();
