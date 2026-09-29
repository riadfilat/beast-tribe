-- 036: Coaching with consent + nutrition targets.
--
-- Before: coach notes (private ones included) and every coach/member pair were readable by
-- any signed-in user; a coach "added" whoever first matched a typed name, without asking;
-- anyone could write body measurements onto another member's record; and coaches could never
-- see nutrition even when the member wanted to share it.
--
-- After: a coach sends a request, the member accepts and chooses what to share (nutrition,
-- body measurements), and either side can end it. Notes are visible to the coach, and to the
-- member unless marked private.

-- ---- 1) Per-member nutrition targets (null = app defaults) ----
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nutrition_goals JSONB;

-- ---- 2) Helpers (SECURITY DEFINER so policies don't recurse through partners RLS) ----
CREATE OR REPLACE FUNCTION bt_my_partner_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM partners WHERE user_id = auth.uid()
$$;
REVOKE ALL ON FUNCTION bt_my_partner_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION bt_my_partner_ids() TO authenticated;

-- Is the signed-in user the active coach of p_trainee, and has the member shared p_what?
CREATE OR REPLACE FUNCTION bt_coach_can_see(p_trainee UUID, p_what TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM coach_trainees ct
    JOIN partners pa ON pa.id = ct.coach_id
    LEFT JOIN trainee_privacy tp ON tp.trainee_id = ct.trainee_id AND tp.coach_id = ct.coach_id
    WHERE ct.trainee_id = p_trainee
      AND ct.status = 'active'
      AND pa.user_id = auth.uid()
      AND CASE p_what
            WHEN 'nutrition' THEN coalesce(tp.share_nutrition, false)
            WHEN 'body' THEN coalesce(tp.share_body_metrics, false)
            ELSE true
          END
  )
$$;
REVOKE ALL ON FUNCTION bt_coach_can_see(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION bt_coach_can_see(UUID, TEXT) TO authenticated;

-- A coach can always read their own partner row (even before it is marked active).
DROP POLICY IF EXISTS partners_read_own ON partners;
CREATE POLICY partners_read_own ON partners FOR SELECT USING (user_id = auth.uid());

-- ---- 3) coach_trainees: request → member accepts; either side can end (delete) ----
ALTER TABLE coach_trainees ALTER COLUMN status SET DEFAULT 'pending';

DROP POLICY IF EXISTS coach_trainees_read ON coach_trainees;
DROP POLICY IF EXISTS coach_trainees_insert_restricted ON coach_trainees;
DROP POLICY IF EXISTS coach_trainees_update_restricted ON coach_trainees;
DROP POLICY IF EXISTS coach_trainees_request ON coach_trainees;
DROP POLICY IF EXISTS coach_trainees_update ON coach_trainees;
DROP POLICY IF EXISTS coach_trainees_delete ON coach_trainees;

CREATE POLICY coach_trainees_read ON coach_trainees FOR SELECT
  USING (trainee_id = auth.uid() OR coach_id IN (SELECT bt_my_partner_ids()) OR is_admin(auth.uid()));
CREATE POLICY coach_trainees_request ON coach_trainees FOR INSERT
  WITH CHECK (coach_id IN (SELECT bt_my_partner_ids()) AND status = 'pending' AND trainee_id <> auth.uid());
CREATE POLICY coach_trainees_update ON coach_trainees FOR UPDATE
  USING (trainee_id = auth.uid() OR coach_id IN (SELECT bt_my_partner_ids()));
CREATE POLICY coach_trainees_delete ON coach_trainees FOR DELETE
  USING (trainee_id = auth.uid() OR coach_id IN (SELECT bt_my_partner_ids()));

-- Only the member moves a request to active; the pair itself never changes.
CREATE OR REPLACE FUNCTION bt_coach_trainees_guard()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.coach_id IS DISTINCT FROM OLD.coach_id OR NEW.trainee_id IS DISTINCT FROM OLD.trainee_id THEN
    RAISE EXCEPTION 'COACH_LINK_IMMUTABLE';
  END IF;
  IF auth.uid() IS NULL THEN
    RETURN NEW; -- service role / admin tools
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF auth.uid() <> NEW.trainee_id THEN
      RAISE EXCEPTION 'ONLY_MEMBER_CAN_ACCEPT';
    END IF;
    IF NOT (OLD.status = 'pending' AND NEW.status = 'active')
       AND NOT (OLD.status IN ('active', 'paused') AND NEW.status IN ('active', 'paused')) THEN
      RAISE EXCEPTION 'BAD_TRANSITION';
    END IF;
    IF OLD.status = 'pending' THEN
      NEW.started_at := now();
    END IF;
  END IF;
  IF auth.uid() = NEW.trainee_id
     AND (NEW.goals IS DISTINCT FROM OLD.goals OR NEW.notes IS DISTINCT FROM OLD.notes) THEN
    RAISE EXCEPTION 'COACH_FIELDS';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS coach_trainees_guard ON coach_trainees;
CREATE TRIGGER coach_trainees_guard BEFORE UPDATE ON coach_trainees
  FOR EACH ROW EXECUTE FUNCTION bt_coach_trainees_guard();

-- Ending the relationship removes what the member had shared with that coach.
CREATE OR REPLACE FUNCTION bt_coach_trainees_cleanup()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM trainee_privacy WHERE trainee_id = OLD.trainee_id AND coach_id = OLD.coach_id;
  RETURN OLD;
END $$;
DROP TRIGGER IF EXISTS coach_trainees_cleanup ON coach_trainees;
CREATE TRIGGER coach_trainees_cleanup AFTER DELETE ON coach_trainees
  FOR EACH ROW EXECUTE FUNCTION bt_coach_trainees_cleanup();

-- ---- 4) Notifications: request to the member, acceptance to the coach ----
CREATE OR REPLACE FUNCTION bt_push_body(p_type TEXT, p_lang TEXT, p_actor TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_lang = 'ar' THEN CASE p_type
      WHEN 'rsvp_join'       THEN 'انضمام جديد لتمرينك: ' || coalesce(p_actor, '')
      WHEN 'event_full'      THEN 'اكتمل العدد'
      WHEN 'spot_opened'     THEN 'تحرّر مكان وتم تأكيد مشاركتك'
      WHEN 'event_cancelled' THEN 'تم إلغاء هذا التمرين'
      WHEN 'beast'           THEN 'تفاعل جديد على منشورك من ' || coalesce(p_actor, '')
      WHEN 'comment'         THEN 'تعليق جديد على منشورك من ' || coalesce(p_actor, '')
      WHEN 'coach_request'   THEN 'طلب تدريب من ' || coalesce(p_actor, 'مدرب')
      WHEN 'coach_accepted'  THEN 'تمت الموافقة على طلب التدريب: ' || coalesce(p_actor, '')
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
      ELSE 'Beast Tribe' END
  END
$$;

CREATE OR REPLACE FUNCTION bt_coach_trainees_notify()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_coach_user UUID;
  v_coach_name TEXT;
BEGIN
  SELECT user_id, coalesce(business_name, name) INTO v_coach_user, v_coach_name
  FROM partners WHERE id = NEW.coach_id;
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    PERFORM bt_notify(ARRAY[NEW.trainee_id], 'coach_request', v_coach_user,
      jsonb_build_object('coach_link_id', NEW.id, 'coach_name', v_coach_name));
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'active' AND v_coach_user IS NOT NULL THEN
    PERFORM bt_notify(ARRAY[v_coach_user], 'coach_accepted', NEW.trainee_id,
      jsonb_build_object('coach_link_id', NEW.id, 'trainee_id', NEW.trainee_id));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS coach_trainees_notify ON coach_trainees;
CREATE TRIGGER coach_trainees_notify AFTER INSERT OR UPDATE OF status ON coach_trainees
  FOR EACH ROW EXECUTE FUNCTION bt_coach_trainees_notify();

-- ---- 5) What the member shares (the member owns it; the coach can read it) ----
DROP POLICY IF EXISTS trainee_privacy_coach_restricted ON trainee_privacy;
DROP POLICY IF EXISTS trainee_privacy_coach_read ON trainee_privacy;
CREATE POLICY trainee_privacy_coach_read ON trainee_privacy FOR SELECT
  USING (coach_id IN (SELECT bt_my_partner_ids()));
-- trainee_privacy_own (ALL where trainee_id = auth.uid()) stays as is.

-- ---- 6) Coach notes: the coach, and the member unless private ----
DROP POLICY IF EXISTS coach_notes_read ON coach_notes;
DROP POLICY IF EXISTS coach_notes_insert_restricted ON coach_notes;
DROP POLICY IF EXISTS coach_notes_write ON coach_notes;
DROP POLICY IF EXISTS coach_notes_delete ON coach_notes;
CREATE POLICY coach_notes_read ON coach_notes FOR SELECT
  USING (
    coach_id IN (SELECT bt_my_partner_ids())
    OR (trainee_id = auth.uid() AND NOT coalesce(is_private, false))
    OR is_admin(auth.uid())
  );
CREATE POLICY coach_notes_write ON coach_notes FOR INSERT
  WITH CHECK (
    coach_id IN (SELECT bt_my_partner_ids())
    AND EXISTS (
      SELECT 1 FROM coach_trainees ct
      WHERE ct.coach_id = coach_notes.coach_id AND ct.trainee_id = coach_notes.trainee_id AND ct.status = 'active'
    )
  );
CREATE POLICY coach_notes_delete ON coach_notes FOR DELETE
  USING (coach_id IN (SELECT bt_my_partner_ids()));

-- ---- 7) Body measurements: yours, or your active coach's when you share them ----
DROP POLICY IF EXISTS body_metrics_coach ON body_metrics;
DROP POLICY IF EXISTS body_metrics_own ON body_metrics;
DROP POLICY IF EXISTS body_metrics_read ON body_metrics;
DROP POLICY IF EXISTS body_metrics_insert ON body_metrics;
DROP POLICY IF EXISTS body_metrics_update ON body_metrics;
DROP POLICY IF EXISTS body_metrics_delete ON body_metrics;
CREATE POLICY body_metrics_read ON body_metrics FOR SELECT
  USING (user_id = auth.uid() OR bt_coach_can_see(user_id, 'body'));
CREATE POLICY body_metrics_insert ON body_metrics FOR INSERT
  WITH CHECK (recorded_by = auth.uid() AND (user_id = auth.uid() OR bt_coach_can_see(user_id, 'body')));
CREATE POLICY body_metrics_update ON body_metrics FOR UPDATE
  USING (user_id = auth.uid() OR (recorded_by = auth.uid() AND bt_coach_can_see(user_id, 'body')));
CREATE POLICY body_metrics_delete ON body_metrics FOR DELETE
  USING (user_id = auth.uid() OR (recorded_by = auth.uid() AND bt_coach_can_see(user_id, 'body')));

-- ---- 8) Nutrition: a coach reads it only when the member shares it ----
DROP POLICY IF EXISTS nutrition_coach_read ON nutrition_logs;
CREATE POLICY nutrition_coach_read ON nutrition_logs FOR SELECT
  USING (bt_coach_can_see(user_id, 'nutrition'));

