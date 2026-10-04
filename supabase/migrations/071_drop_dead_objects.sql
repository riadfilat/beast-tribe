-- 071 — Remove database objects nothing uses (code review, 2026-10-04).
-- Every table below had no reference in the app, the dashboard, scripts, other functions,
-- policies, views or cron. Their rows were exported to ~/Desktop/OB/db-backups/2026-10-04-cleanup/
-- before this ran (pack_challenges 2 seed rows, goal_templates 58 seed rows, journal_entries 1 row;
-- the rest were empty). No CASCADE: if anything still depended on one of them, this would fail
-- and change nothing.

BEGIN;

-- Gamification leftovers (removed June 2026)
DROP TABLE public.pack_challenges;
DROP TABLE public.beast_roar_votes;
DROP TABLE public.beast_roar_nominations;
DROP TABLE public.goal_templates;
DROP TABLE public.goals;
DROP TABLE public.journal_entries;
DROP TABLE public.baselines;
DROP TABLE public.step_logs;
DROP TABLE public.device_connections;
DROP TABLE public.qr_codes;

-- Replaced by programs / program_enrollments / program_sessions
DROP TABLE public.program_assignments;
DROP TABLE public.workout_programs;

-- Replaced by content_reports
DROP TABLE public.comment_likes;
DROP TABLE public.comment_reports;
DROP TABLE public.post_reports;

-- Replaced by image_moderation_queue
DROP TABLE public.image_moderation;

-- Never read: partners are linked through events.partner_id and partners.user_id
DROP TABLE public.partner_events;
DROP TABLE public.partner_members;

-- The dashboard writes admin_audit_log (singular); this pair was never called
DROP FUNCTION public.log_admin_action(text, text, uuid, jsonb, jsonb);
DROP TABLE public.admin_audit_logs;

-- Replaced by bt_new_code / bt_new_join_code
DROP FUNCTION public.generate_invite_code();

-- The status type of the old image_moderation table, if nothing else uses it
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
             WHERE n.nspname = 'public' AND t.typname = 'moderation_status')
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_type t ON t.oid = a.atttypid
                     WHERE t.typname = 'moderation_status' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_type t ON t.typname = 'moderation_status'
                     WHERE t.oid = p.prorettype OR t.oid = ANY (p.proargtypes)) THEN
    DROP TYPE public.moderation_status;
    RAISE NOTICE 'dropped type moderation_status';
  END IF;
END $$;

-- Indexes that duplicate a unique key or are covered by a longer index on the same columns
DROP INDEX public.idx_admin_roles_user_id;          -- = admin_roles_user_id_key
DROP INDEX public.idx_partners_slug;                -- = partners_slug_key
DROP INDEX public.program_sessions_program_idx;     -- = program_sessions_program_id_week_day_key
DROP INDEX public.idx_pack_members_pack;            -- covered by (pack_id, user_id)
DROP INDEX public.idx_coach_trainees_coach;         -- covered by (coach_id, trainee_id)
DROP INDEX public.idx_blocked_users_blocker;        -- covered by (blocker_id, blocked_id)
DROP INDEX public.idx_coach_slots_partner;          -- covered by (partner_id, day_of_week, start_time)
DROP INDEX public.idx_coach_bookings_partner_date;  -- covered by (partner_id, booking_date, start_time)
DROP INDEX public.idx_events_country;               -- covered by (country, starts_at)
DROP INDEX public.idx_mod_queue_status;             -- covered by (status, created_at)

COMMIT;
