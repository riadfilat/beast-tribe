-- 073 — Security hardening (audit, 2026-10-04). Every item was reproduced as a member or as anon in a
-- rolled-back transaction before this was written; see CLAUDE.md for the list.

BEGIN;

-- Column limits only work without a table-wide grant: drop the table-wide privilege, then grant
-- every column except the protected ones (new columns must be granted explicitly from now on).
CREATE FUNCTION pg_temp.bt_columns_except(p_table regclass, p_priv text, p_except text[]) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE v_cols text;
BEGIN
  SELECT string_agg(quote_ident(attname), ', ' ORDER BY attnum) INTO v_cols
  FROM pg_attribute WHERE attrelid = p_table AND attnum > 0 AND NOT attisdropped AND NOT (attname = ANY (p_except));
  EXECUTE format('REVOKE %s ON %s FROM authenticated', p_priv, p_table);
  EXECUTE format('GRANT %s (%s) ON %s TO authenticated', p_priv, v_cols, p_table);
END $$;

-- ── Critical: joining a private community by editing your own profile ─────────────────────────────
-- profiles.community_id fed a trigger that added the member to that community. Members can no
-- longer write it (nor the old single-group and premium fields); joining goes through the join code.
SELECT pg_temp.bt_columns_except('public.profiles', 'UPDATE', ARRAY['id', 'community_id', 'pack_id', 'is_premium', 'premium_expires_at', 'created_at']);
SELECT pg_temp.bt_columns_except('public.profiles', 'INSERT', ARRAY['community_id', 'pack_id', 'is_premium', 'premium_expires_at']);

CREATE OR REPLACE FUNCTION public.sync_user_community_packs()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Only Beast Tribe (admins, the dashboard, server jobs) assigns a community this way.
  IF auth.uid() IS NOT NULL AND NOT is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF NEW.community_id IS NOT NULL AND NEW.community_id IS DISTINCT FROM OLD.community_id THEN
    INSERT INTO community_members (community_id, user_id) VALUES (NEW.community_id, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

-- ── Critical: anyone could push a notification to every user ──────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.bt_notify(uuid[], text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bt_notify(uuid[], text, uuid, jsonb) TO service_role;

-- "Trusted" means Beast Tribe itself: the dashboard (service role), server jobs, or an admin.
-- A signed-out (anon) request is not trusted.
CREATE OR REPLACE FUNCTION public.bt_trusted_caller()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(current_setting('bt.trusted', true), '') = '1'
      OR coalesce(auth.role(), '') = 'service_role'
      OR (auth.uid() IS NULL AND coalesce(auth.role(), '') NOT IN ('anon', 'authenticated'))
      OR is_admin(auth.uid())
$$;

-- ── High: joining any group without an invite (and as its leader) ─────────────────────────────────
-- A member adds themselves only as the leader of a group they just created, or as a member when
-- they hold a pending invite. Joining by code goes through join_pack_by_code (security definer).
DROP POLICY IF EXISTS "Users can join packs" ON public.pack_members;
DROP POLICY IF EXISTS pack_members_insert_own ON public.pack_members;
CREATE POLICY pack_members_insert_own ON public.pack_members FOR INSERT TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND (
    (role = 'leader' AND EXISTS (SELECT 1 FROM packs p WHERE p.id = pack_id AND p.created_by = (SELECT auth.uid())))
    OR (role = 'member' AND EXISTS (
      SELECT 1 FROM pack_invites i WHERE i.pack_id = pack_members.pack_id AND i.invited_user_id = (SELECT auth.uid()) AND i.status = 'pending'
    ))
  )
);
-- A leader can change a member's role, never swap the person or the group.
SELECT pg_temp.bt_columns_except('public.pack_members', 'UPDATE', ARRAY['id', 'user_id', 'pack_id']);

-- A full group takes nobody else, whichever way they join.
CREATE OR REPLACE FUNCTION public.bt_pack_join_community_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_c UUID; v_default BOOLEAN; v_max INT;
BEGIN
  IF pg_trigger_depth() > 1 OR auth.uid() IS NULL OR is_admin(auth.uid()) THEN RETURN NEW; END IF;
  SELECT p.community_id, c.is_default, coalesce(p.max_members, 20) INTO v_c, v_default, v_max
  FROM packs p JOIN communities c ON c.id = p.community_id WHERE p.id = NEW.pack_id;
  IF (SELECT count(*) FROM pack_members m WHERE m.pack_id = NEW.pack_id) >= v_max THEN
    RAISE EXCEPTION 'FULL' USING ERRCODE = '42501';
  END IF;
  IF v_c IS NULL THEN RETURN NEW; END IF;
  IF v_default THEN
    INSERT INTO community_members (community_id, user_id) VALUES (v_c, NEW.user_id) ON CONFLICT DO NOTHING;
  ELSIF NOT EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = v_c AND m.user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'COMMUNITY_ONLY' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

-- ── High: moving a booking onto a restricted session; self check-in ───────────────────────────────
-- Members change only the status of their own RSVP (join, waitlist, leave). Which session, whose
-- RSVP and attendance are not theirs to set; the join rules run on every insert and on any change
-- of status, session or person.
REVOKE UPDATE ON public.event_rsvps FROM authenticated;
-- event_id and user_id stay grantable only because the app's upsert names them; the guard below
-- refuses any actual change to them.
GRANT UPDATE (status, event_id, user_id) ON public.event_rsvps TO authenticated;
-- Attendance is marked by the organiser (dashboard), never by the member on their own RSVP.
SELECT pg_temp.bt_columns_except('public.event_rsvps', 'INSERT', ARRAY['attended_at']);
DROP TRIGGER IF EXISTS trg_bt_rsvp_before ON public.event_rsvps;
CREATE TRIGGER trg_bt_rsvp_before BEFORE INSERT OR UPDATE OF status, event_id, user_id ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.bt_rsvp_before();

-- An RSVP never moves to another session or person, and "interested" (which skipped every join
-- rule) is not a member's choice: members only go, wait or leave.
CREATE OR REPLACE FUNCTION public.bt_rsvp_status_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF bt_trusted_caller() THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND (NEW.event_id IS DISTINCT FROM OLD.event_id OR NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
    RAISE EXCEPTION 'MOVE' USING ERRCODE = '42501';
  END IF;
  IF NEW.status NOT IN ('going', 'waitlist', 'cancelled') THEN
    RAISE EXCEPTION 'STATUS' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_rsvp_status_guard ON public.event_rsvps;
CREATE TRIGGER trg_rsvp_status_guard BEFORE INSERT OR UPDATE OF status, event_id, user_id ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.bt_rsvp_status_guard();

-- Guest-link sessions a member can see: ones they actually joined or wait for.
CREATE OR REPLACE FUNCTION public.bt_my_guest_event_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.event_id FROM event_rsvps r JOIN events e ON e.id = r.event_id
  WHERE r.user_id = auth.uid() AND e.guest_invite AND r.status IN ('going', 'waitlist')
$$;

-- ── High: undoing moderation ──────────────────────────────────────────────────────────────────────
-- Only the photo check (security definer) writes the moderation queue.
REVOKE INSERT, UPDATE, DELETE ON public.image_moderation_queue FROM authenticated;
-- Authors edit what they wrote; hiding, approval and the community a post lives in are not theirs.
SELECT pg_temp.bt_columns_except('public.feed_posts', 'UPDATE', ARRAY['id', 'user_id', 'is_hidden', 'is_visible', 'image_status', 'community_id', 'created_at']);
SELECT pg_temp.bt_columns_except('public.feed_posts', 'INSERT', ARRAY['is_hidden', 'image_status']);
SELECT pg_temp.bt_columns_except('public.feed_comments', 'UPDATE', ARRAY['id', 'user_id', 'post_id', 'status', 'created_at']);

-- ── Medium: hosts editing fields only Beast Tribe sets ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bt_events_money()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Beast Tribe itself, or the database's own triggers (e.g. the going count after an RSVP), may set
  -- these; a member's own insert or edit may not.
  IF bt_trusted_caller() OR pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.guest_open := false;
    NEW.guest_price_sar := NULL;
    NEW.guest_spots := NULL;
    NEW.share_sar := NULL;
    NEW.facility_id := NULL;
    NEW.partner_id := NULL;
    NEW.partner_name := NULL;
    NEW.is_class := false;
    NEW.going_count := 0;
    NEW.price_sar := NULL;
    NEW.created_by := auth.uid();
  ELSE
    NEW.guest_open := OLD.guest_open;
    NEW.guest_price_sar := OLD.guest_price_sar;
    NEW.guest_spots := OLD.guest_spots;
    NEW.share_sar := OLD.share_sar;
    NEW.facility_id := OLD.facility_id;
    NEW.partner_id := OLD.partner_id;
    NEW.partner_name := OLD.partner_name;
    NEW.gym_name := OLD.gym_name;
    NEW.is_class := OLD.is_class;
    NEW.captain_hosted := OLD.captain_hosted;
    NEW.going_count := OLD.going_count;
    NEW.price_sar := OLD.price_sar;
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END $$;

-- The guest link's key goes to the session's host only (not to everyone who can see the session).
SELECT pg_temp.bt_columns_except('public.events', 'SELECT', ARRAY['guest_token']);
CREATE OR REPLACE FUNCTION public.session_guest_token(p_event UUID)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.guest_token FROM events e
  WHERE e.id = p_event AND e.guest_invite AND (e.created_by = auth.uid() OR is_admin(auth.uid()))
$$;
REVOKE ALL ON FUNCTION public.session_guest_token(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.session_guest_token(UUID) TO authenticated;

-- ── Medium: privileges RLS doesn't cover ──────────────────────────────────────────────────────────
-- TRUNCATE ignores row-level security; nobody but Beast Tribe needs TRUNCATE, TRIGGER or REFERENCES.
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA storage FROM anon, authenticated;

-- Signed-out callers run no database functions at all (sign-in and sign-up go through Auth).
-- Functions were executable by PUBLIC (everyone): take that away, give members and the server back
-- exactly what they could run before, and anon nothing.
DO $$
DECLARE f record; v_auth boolean; v_service boolean;
BEGIN
  FOR f IN
    SELECT p.oid, p.oid::regprocedure AS sig FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace AND p.prokind = 'f' AND p.prorettype <> 'trigger'::regtype
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
  LOOP
    v_auth := has_function_privilege('authenticated', f.oid, 'EXECUTE');
    v_service := has_function_privilege('service_role', f.oid, 'EXECUTE');
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f.sig);
    IF v_auth THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f.sig); END IF;
    IF v_service THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig); END IF;
  END LOOP;
END $$;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, PUBLIC;
-- Outbound HTTP (pg_net) is for the database's own jobs, never for API callers. Its functions belong
-- to the extension owner; where we may not change them, say so and carry on (the net schema is not
-- exposed through the API).
DO $$
BEGIN
  EXECUTE 'REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA net FROM PUBLIC, anon, authenticated';
  EXECUTE 'GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA net TO postgres, service_role';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'pg_net functions: not ours to change (%)', SQLERRM;
END $$;

ALTER FUNCTION public.create_event_chat_room() SET search_path = public;
ALTER FUNCTION public.create_pack_chat_room() SET search_path = public;

-- ── Medium: storage ───────────────────────────────────────────────────────────────────────────────
-- Photos only, 5 MB at most; an uploaded file is never overwritten in place (a checked photo stays
-- the photo that was checked).
UPDATE storage.buckets SET file_size_limit = 5242880, allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'user-uploads';
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
-- Session covers: members upload into their own folder (this policy was missing, so covers failed).
DROP POLICY IF EXISTS "Members upload session covers" ON storage.objects;
CREATE POLICY "Members upload session covers" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'event-images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS "Members delete own session covers" ON storage.objects;
CREATE POLICY "Members delete own session covers" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'event-images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

COMMIT;
