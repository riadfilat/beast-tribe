-- 083: community leaders you can join, and better partner matching.
-- Partners: show the level you chose yourself (opt-in; teammate ratings stay private), look inside one
-- of your communities, and an optional "about you" (work, why you play, group size) that helps ranking.

ALTER TABLE public.partner_profiles
  ADD COLUMN IF NOT EXISTS show_level BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS work_style TEXT CHECK (work_style IS NULL OR work_style IN ('desk', 'feet', 'shifts', 'student', 'other')),
  ADD COLUMN IF NOT EXISTS goals TEXT[] NOT NULL DEFAULT '{}' CHECK (goals <@ ARRAY['fit', 'compete', 'social', 'fun', 'learn']::TEXT[]),
  ADD COLUMN IF NOT EXISTS group_size TEXT CHECK (group_size IS NULL OR group_size IN ('one', 'small', 'big'));

DROP FUNCTION IF EXISTS public.find_partners(text[], text, integer);
CREATE FUNCTION public.find_partners(p_cities text[], p_sport text DEFAULT NULL::text, p_limit integer DEFAULT 20, p_community uuid DEFAULT NULL)
 RETURNS TABLE(user_id uuid, name text, avatar_url text, sport text, sports text[], times text[], pace_s integer, note text, close_level boolean, club text, together integer, score integer, level text, shared_goals text[])
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  me UUID := auth.uid();
  my partner_profiles%ROWTYPE;
  my_gender TEXT;
  my_sports TEXT[];
  my_times TEXT[];
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN'; END IF;
  SELECT * INTO my FROM partner_profiles pp WHERE pp.user_id = me;
  IF NOT FOUND OR NOT my.open THEN RAISE EXCEPTION 'NOT_OPEN'; END IF;
  -- Looking inside one community: only one I'm in.
  IF p_community IS NOT NULL AND NOT EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = p_community AND m.user_id = me) THEN
    RAISE EXCEPTION 'NOT_THERE';
  END IF;
  SELECT p.gender INTO my_gender FROM profiles p WHERE p.id = me;
  my_sports := bt_member_sports(me);
  my_times := CASE WHEN coalesce(array_length(my.times, 1), 0) > 0 THEN my.times ELSE bt_usual_times(me) END;

  RETURN QUERY
  WITH cand AS (
    SELECT p.id, coalesce(nullif(p.display_name, ''), p.full_name, '') AS nm, p.avatar_url AS av, p.last_active_date AS seen,
           pp.times AS ptimes, pp.run_pace_s AS pace, pp.note AS nt, bt_member_sports(p.id) AS sp,
           pp.show_level AS shows, pp.goals AS pgoals, pp.group_size AS pgroup, pp.work_style AS pwork
    FROM partner_profiles pp
    JOIN profiles p ON p.id = pp.user_id
    WHERE pp.open AND p.id <> me
      AND NOT EXISTS (SELECT 1 FROM blocked_users b WHERE (b.blocker_id = me AND b.blocked_id = p.id) OR (b.blocker_id = p.id AND b.blocked_id = me))
      -- Same gender: if either of the two asks for it, both must have the same gender.
      AND (NOT (my.same_gender OR pp.same_gender) OR (my_gender IS NOT NULL AND lower(p.gender) = lower(my_gender)))
      -- Same community: if either asks for it, they must share a real community (not the default one).
      AND (NOT (my.same_community OR pp.same_community) OR EXISTS (
            SELECT 1 FROM community_members a JOIN community_members b2 ON b2.community_id = a.community_id
            JOIN communities co ON co.id = a.community_id
            WHERE a.user_id = me AND b2.user_id = p.id AND NOT co.is_default AND co.is_active))
      AND (p_community IS NULL OR EXISTS (SELECT 1 FROM community_members x WHERE x.community_id = p_community AND x.user_id = p.id))
      AND (p_community IS NOT NULL OR bt_city_key(p.city) = ANY (coalesce(p_cities, '{}'))
           OR EXISTS (SELECT 1 FROM community_members a JOIN community_members b2 ON b2.community_id = a.community_id
                      JOIN communities co ON co.id = a.community_id
                      WHERE a.user_id = me AND b2.user_id = p.id AND NOT co.is_default AND co.is_active))
    ORDER BY p.last_active_date DESC NULLS LAST
    LIMIT 400
  ), focus AS (
    SELECT c.*,
           CASE WHEN p_sport IS NOT NULL THEN p_sport ELSE (SELECT s FROM unnest(c.sp) s WHERE s = ANY (my_sports) LIMIT 1) END AS fs,
           ARRAY(SELECT s FROM unnest(c.sp) s WHERE s = ANY (my_sports)) AS shared,
           CASE WHEN coalesce(array_length(c.ptimes, 1), 0) > 0 THEN c.ptimes ELSE bt_usual_times(c.id) END AS tm
    FROM cand c
    WHERE (p_sport IS NULL AND c.sp && my_sports) OR (p_sport IS NOT NULL AND p_sport = ANY (c.sp))
  ), lv AS (
    SELECT f.*, abs(bt_level_of(me, f.fs) - bt_level_of(f.id, f.fs)) AS gap,
           (SELECT co.name FROM community_members a JOIN community_members b2 ON b2.community_id = a.community_id
              JOIN communities co ON co.id = a.community_id
             WHERE a.user_id = me AND b2.user_id = f.id AND NOT co.is_default AND co.is_active LIMIT 1) AS shared_club,
           (SELECT count(*)::INT FROM events e
             WHERE e.cancelled_at IS NULL AND coalesce(e.ends_at, e.starts_at) < now()
               AND EXISTS (SELECT 1 FROM bt_session_people(e.id) x WHERE x = me)
               AND EXISTS (SELECT 1 FROM bt_session_people(e.id) x WHERE x = f.id)) AS tog,
           ARRAY(SELECT t FROM unnest(f.tm) t WHERE t = ANY (my_times)) AS both_times,
           ARRAY(SELECT g FROM unnest(coalesce(f.pgoals, '{}')) g WHERE g = ANY (coalesce(my.goals, '{}'))) AS both_goals
    FROM focus f
  )
  SELECT lv.id, lv.nm, lv.av, lv.fs, lv.shared, lv.tm, lv.pace, lv.nt,
         (lv.gap IS NOT NULL AND lv.gap < 1),
         lv.shared_club, lv.tog,
         (least(coalesce(array_length(lv.shared, 1), 0) * 10, 30)
          + CASE WHEN p_sport IS NOT NULL THEN 20 ELSE 0 END
          + CASE WHEN lv.gap IS NULL THEN 0 WHEN lv.gap < 0.75 THEN 25 WHEN lv.gap < 1.5 THEN 12 ELSE -15 END
          + least(coalesce(array_length(lv.both_times, 1), 0) * 8, 24)
          + CASE WHEN lv.shared_club IS NOT NULL THEN 15 ELSE 0 END
          + CASE WHEN lv.fs = 'running' AND my.run_pace_s IS NOT NULL AND lv.pace IS NOT NULL
                 THEN CASE WHEN abs(my.run_pace_s - lv.pace) <= 20 THEN 15 WHEN abs(my.run_pace_s - lv.pace) <= 45 THEN 8 ELSE 0 END
                 ELSE 0 END
          + least(lv.tog * 8, 16)
          + least(coalesce(array_length(lv.both_goals, 1), 0) * 6, 12)
          + CASE WHEN lv.pgroup IS NOT NULL AND lv.pgroup = my.group_size THEN 4 ELSE 0 END
          + CASE WHEN lv.pwork = 'shifts' AND my.work_style = 'shifts' THEN 6 ELSE 0 END
          + CASE WHEN lv.seen >= current_date - 14 THEN 5 WHEN lv.seen >= current_date - 60 THEN 2 ELSE 0 END)::INT AS sc,
         -- The level they chose themselves, only if they asked to show it. Teammate ratings never leave the database.
         CASE WHEN lv.shows THEN (CASE round(bt_self_level(lv.id)) WHEN 1 THEN 'beginner' WHEN 2 THEN 'intermediate' WHEN 3 THEN 'advanced' WHEN 4 THEN 'expert' END) END,
         lv.both_goals
  FROM lv
  -- Far apart in level (a beginner and an advanced player) are not suggested to each other.
  WHERE lv.gap IS NULL OR lv.gap < 1.75
  ORDER BY sc DESC, lv.seen DESC NULLS LAST
  LIMIT greatest(1, least(coalesce(p_limit, 20), 50));
END $function$;
REVOKE ALL ON FUNCTION public.find_partners(text[], text, integer, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_partners(text[], text, integer, uuid) TO authenticated;

-- Community leaders: verified, listed, member-run communities anyone can join with one tap.
CREATE OR REPLACE FUNCTION public.community_leaders(p_sport TEXT DEFAULT NULL)
RETURNS TABLE (id UUID, name TEXT, sport TEXT, city TEXT, logo_url TEXT, kind TEXT, members INT, leader_name TEXT, leader_avatar TEXT, joined BOOLEAN)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.name, c.sport, c.city, c.logo_url, c.kind, k.n,
         coalesce(nullif(pr.display_name, ''), pr.full_name, ''), pr.avatar_url,
         EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = c.id AND m.user_id = auth.uid())
  FROM communities c
  JOIN profiles pr ON pr.id = c.leader_id
  CROSS JOIN LATERAL (SELECT count(*)::INT AS n FROM community_members m WHERE m.community_id = c.id) k
  WHERE auth.uid() IS NOT NULL AND c.is_active AND NOT c.is_default
    AND c.visibility = 'open' AND c.listing = 'public' AND c.verified_at IS NOT NULL
    AND (p_sport IS NULL OR c.sport = p_sport)
  ORDER BY k.n DESC, c.name
  LIMIT 60
$$;
REVOKE ALL ON FUNCTION public.community_leaders(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_leaders(TEXT) TO authenticated;
