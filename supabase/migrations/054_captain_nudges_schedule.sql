-- 054 Schedule the captain reminders: Sunday, Tuesday and Thursday at 9:00 Riyadh time (06:00 UTC).
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'captain-nudges';
SELECT cron.schedule('captain-nudges', '0 6 * * 0,2,4', $$SELECT public.bt_captain_nudges()$$);
