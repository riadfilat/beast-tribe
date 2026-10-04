-- 081: connection and background-job hygiene.
-- A session left idle inside an open transaction holds its connection and locks until someone
-- notices. The API role already has an 8 s statement timeout; give it, and our own maintenance
-- role, a cap on idle-in-transaction time too. (Running queries are not affected.)
ALTER ROLE authenticator SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE postgres SET idle_in_transaction_session_timeout = '10min';

-- pg_cron keeps a row per run forever; keep a week of history.
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cron-history-cleanup';
SELECT cron.schedule('cron-history-cleanup', '15 3 * * *', $$DELETE FROM cron.job_run_details WHERE end_time < now() - interval '7 days'$$);
