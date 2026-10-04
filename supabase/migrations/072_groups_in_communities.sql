-- 072 — Groups live inside communities; communities are set up by Beast Tribe on request.
-- User, 2026-10-04: communities are run by companies, clubs, sport influencers and paying partners,
-- not created by members. Members create groups inside the general community or a private one
-- they belong to, and ask for their own community through the app.

BEGIN;

-- 1. Every group belongs to a community: groups without one go to the general (default) community.
UPDATE packs SET community_id = (SELECT id FROM communities WHERE is_default LIMIT 1) WHERE community_id IS NULL;
ALTER TABLE packs ALTER COLUMN community_id SET NOT NULL;

-- Members create groups in a community they belong to (the general one joins them automatically).
-- Older app builds send no community: theirs go to the general community.
CREATE OR REPLACE FUNCTION public.bt_packs_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_default BOOLEAN;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.community_id IS NULL THEN
    NEW.community_id := (SELECT id FROM communities WHERE is_default LIMIT 1);
  END IF;
  IF auth.uid() IS NULL OR is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF coalesce(NEW.is_system, false) OR coalesce(NEW.is_community_default, false) THEN
      RAISE EXCEPTION 'packs: members cannot create community or system packs' USING ERRCODE = '42501';
    END IF;
    SELECT c.is_default INTO v_default FROM communities c WHERE c.id = NEW.community_id AND c.is_active;
    IF v_default IS NULL THEN
      RAISE EXCEPTION 'COMMUNITY_ONLY' USING ERRCODE = '42501';
    ELSIF v_default THEN
      INSERT INTO community_members (community_id, user_id) VALUES (NEW.community_id, auth.uid()) ON CONFLICT DO NOTHING;
    ELSIF NOT EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = NEW.community_id AND m.user_id = auth.uid()) THEN
      RAISE EXCEPTION 'COMMUNITY_ONLY' USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.community_id IS DISTINCT FROM OLD.community_id
     OR NEW.is_community_default IS DISTINCT FROM OLD.is_community_default
     OR NEW.is_system IS DISTINCT FROM OLD.is_system
     OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'packs: members cannot change community, system or owner fields' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

-- Joining a group: its community's members only; the general community lets anyone in (and joins them).
CREATE OR REPLACE FUNCTION public.bt_pack_join_community_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_c UUID; v_default BOOLEAN;
BEGIN
  IF pg_trigger_depth() > 1 OR auth.uid() IS NULL OR is_admin(auth.uid()) THEN RETURN NEW; END IF;
  SELECT p.community_id, c.is_default INTO v_c, v_default FROM packs p JOIN communities c ON c.id = p.community_id WHERE p.id = NEW.pack_id;
  IF v_c IS NULL THEN RETURN NEW; END IF;
  IF v_default THEN
    INSERT INTO community_members (community_id, user_id) VALUES (v_c, NEW.user_id) ON CONFLICT DO NOTHING;
  ELSIF NOT EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = v_c AND m.user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'COMMUNITY_ONLY' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

-- 2. Communities: only Beast Tribe creates them now.
CREATE OR REPLACE FUNCTION public.create_club(p_name text, p_sport text, p_city text, p_description text, p_listing text)
 RETURNS TABLE(id uuid, join_code text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  me UUID := auth.uid();
  v_name TEXT := trim(coalesce(p_name, ''));
  v_id UUID;
  v_code TEXT;
  v_slug TEXT;
  v_me profiles%ROWTYPE;
  v_email TEXT;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN'; END IF;
  -- Communities are set up by Beast Tribe for companies, clubs, coaches and other partners (2026-10-04);
  -- members ask through the app (request_community) instead.
  IF NOT is_admin(me) THEN RAISE EXCEPTION 'BY_REQUEST'; END IF;
  IF length(v_name) < 3 OR length(v_name) > 60 THEN RAISE EXCEPTION 'NAME'; END IF;
  IF EXISTS (SELECT 1 FROM communities c WHERE c.leader_id = me AND c.is_active) THEN RAISE EXCEPTION 'ALREADY_LEADER'; END IF;
  SELECT * INTO v_me FROM profiles WHERE profiles.id = me;
  v_code := bt_new_join_code();
  v_slug := trim(BOTH '-' FROM regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'));
  v_slug := coalesce(nullif(v_slug, ''), 'club') || '-' || lower(v_code);

  INSERT INTO communities (name, slug, description, city, visibility, kind, join_code, leader_id, sport, listing, is_active, is_default)
  VALUES (v_name, v_slug, nullif(trim(coalesce(p_description, '')), ''), nullif(trim(coalesce(p_city, v_me.city, '')), ''),
          'private', 'club', v_code, me, nullif(trim(coalesce(p_sport, '')), ''),
          CASE WHEN p_listing = 'public' THEN 'public' ELSE 'invite' END, true, false)
  RETURNING communities.id INTO v_id;
  INSERT INTO community_members (community_id, user_id, role) VALUES (v_id, me, 'admin')
  ON CONFLICT (community_id, user_id) DO UPDATE SET role = 'admin';

  -- Beast Tribe sees every new club in the Leads pipeline (to verify it and say hello).
  BEGIN
    SELECT u.email INTO v_email FROM auth.users u WHERE u.id = me;
    INSERT INTO partner_leads (kind, business_name, contact_name, email, city, source, message, community_id)
    VALUES ('leader', v_name, coalesce(nullif(v_me.full_name, ''), nullif(v_me.display_name, ''), 'Club leader'),
            coalesce(v_email, 'unknown@lead.invalid'), nullif(trim(coalesce(p_city, v_me.city, '')), ''),
            'club created in the app',
            concat_ws(' · ', nullif(p_sport, ''), CASE WHEN p_listing = 'public' THEN 'wants to be listed' ELSE 'invite only' END, nullif(trim(coalesce(p_description, '')), '')),
            v_id);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN QUERY SELECT v_id, v_code;
END $function$;

-- 3. "Your own community": a request from the app lands in Leads and pings the admins.
ALTER TABLE partner_leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE partner_leads DROP CONSTRAINT IF EXISTS partner_leads_kind_check;
ALTER TABLE partner_leads ADD CONSTRAINT partner_leads_kind_check
  CHECK (kind IN ('gym', 'company', 'coach', 'venue', 'leader', 'influencer', 'compound', 'school', 'other'));

CREATE OR REPLACE FUNCTION public.request_community(
  p_kind TEXT, p_org TEXT, p_name TEXT, p_role TEXT, p_contact TEXT, p_city TEXT, p_size TEXT, p_message TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := auth.uid();
  v_kind TEXT := lower(trim(coalesce(p_kind, '')));
  v_org TEXT := trim(coalesce(p_org, ''));
  v_name TEXT := trim(coalesce(p_name, ''));
  v_contact TEXT := trim(coalesce(p_contact, ''));
  v_email TEXT;
  v_phone TEXT;
  v_id UUID;
  v_admins UUID[];
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN'; END IF;
  IF v_kind NOT IN ('company', 'gym', 'coach', 'influencer', 'compound', 'school', 'leader', 'other') THEN v_kind := 'other'; END IF;
  IF length(v_org) < 2 OR length(v_org) > 120 THEN RAISE EXCEPTION 'ORG'; END IF;
  IF length(v_name) < 2 OR length(v_name) > 120 THEN RAISE EXCEPTION 'NAME'; END IF;
  IF (SELECT count(*) FROM partner_leads l WHERE l.user_id = me AND l.created_at > now() - interval '1 day') >= 3 THEN
    RAISE EXCEPTION 'TOO_MANY';
  END IF;
  -- One contact field: an email, or a phone number (then the account's email is kept too).
  IF v_contact ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    v_email := lower(v_contact);
  ELSE
    IF length(regexp_replace(v_contact, '[^0-9]', '', 'g')) < 7 THEN RAISE EXCEPTION 'CONTACT'; END IF;
    v_phone := left(v_contact, 40);
    SELECT lower(u.email) INTO v_email FROM auth.users u WHERE u.id = me;
  END IF;
  IF v_email IS NULL OR v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'CONTACT'; END IF;

  INSERT INTO partner_leads (kind, business_name, contact_name, email, phone, city, size, message, source, user_id)
  VALUES (v_kind, v_org, v_name, left(v_email, 200), v_phone, nullif(left(trim(coalesce(p_city, '')), 80), ''),
          nullif(left(trim(coalesce(p_size, '')), 40), ''),
          nullif(left(concat_ws(E'\n', CASE WHEN trim(coalesce(p_role, '')) <> '' THEN 'Role: ' || trim(p_role) END, nullif(trim(coalesce(p_message, '')), '')), 2000), ''),
          'app', me)
  RETURNING id INTO v_id;

  SELECT array_agg(user_id) INTO v_admins FROM admin_roles;
  PERFORM bt_notify(v_admins, 'community_request', me, jsonb_build_object('lead_id', v_id, 'kind', v_kind, 'org', v_org));
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.request_community(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_community(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.bt_push_body(p_type text, p_lang text, p_actor text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT CASE
    WHEN p_lang = 'ar' THEN CASE p_type
      WHEN 'rsvp_join'       THEN 'انضمام جديد لجلستك: ' || coalesce(p_actor, '')
      WHEN 'event_full'      THEN 'اكتمل العدد'
      WHEN 'spot_opened'     THEN 'تحرّر مكان وتم تأكيد مشاركتك'
      WHEN 'event_cancelled' THEN 'تم إلغاء هذه الجلسة'
      WHEN 'beast'           THEN 'تفاعل جديد على منشورك من ' || coalesce(p_actor, '')
      WHEN 'comment'         THEN 'تعليق جديد على منشورك من ' || coalesce(p_actor, '')
      WHEN 'coach_request'   THEN 'طلب تدريب من ' || coalesce(p_actor, 'مدرب')
      WHEN 'coach_accepted'  THEN 'تمت الموافقة على طلب التدريب: ' || coalesce(p_actor, '')
      WHEN 'captain_assigned' THEN 'أنت الآن كابتن هذا المجتمع. أضف أول جلسة.'
      WHEN 'captain_nudge'   THEN 'جلسات هذا الأسبوع لم تكتمل بعد. أضف الجلسة التالية.'
      WHEN 'partner_invite'  THEN coalesce(p_actor, 'أحدهم') || ' يدعوك للتمرن معًا'
      WHEN 'club_verified'   THEN 'تم توثيق ناديك وأصبح ظاهرًا للجميع'
      WHEN 'photo_review'    THEN 'صور بانتظار المراجعة'
      WHEN 'photo_overdue'   THEN 'صور تنتظر المراجعة منذ أكثر من 48 ساعة'
      WHEN 'community_request' THEN 'طلب مجتمع جديد من ' || coalesce(p_actor, 'عضو')
      ELSE 'بيست ترايب' END
    ELSE CASE p_type
      WHEN 'rsvp_join'       THEN coalesce(p_actor, 'Someone') || ' joined your session'
      WHEN 'event_full'      THEN 'The session is full'
      WHEN 'spot_opened'     THEN 'A spot opened up. You''re in.'
      WHEN 'event_cancelled' THEN 'This session was cancelled'
      WHEN 'beast'           THEN coalesce(p_actor, 'Someone') || ' beasted your post'
      WHEN 'comment'         THEN coalesce(p_actor, 'Someone') || ' commented on your post'
      WHEN 'coach_request'   THEN coalesce(p_actor, 'A coach') || ' wants to coach you'
      WHEN 'coach_accepted'  THEN coalesce(p_actor, 'Someone') || ' accepted your coaching request'
      WHEN 'captain_assigned' THEN 'You''re now the Beast Captain here. Put the first session on the board.'
      WHEN 'captain_nudge'   THEN 'This week''s sessions aren''t all on the board yet. Add the next one.'
      WHEN 'partner_invite'  THEN coalesce(p_actor, 'Someone') || ' invited you to train together'
      WHEN 'club_verified'   THEN 'Your club is verified and now listed for everyone'
      WHEN 'photo_review'    THEN 'Photos are waiting for review'
      WHEN 'photo_overdue'   THEN 'Photos have waited over 48 hours for review'
      WHEN 'community_request' THEN 'New community request from ' || coalesce(p_actor, 'a member')
      ELSE 'Beast Tribe' END
  END
$function$;

COMMIT;
