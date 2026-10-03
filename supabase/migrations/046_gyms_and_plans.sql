-- 046 Gyms and partner plans
-- A gym is a partner (partner_type 'gym') whose own private club community is partners.community_id.
-- Its members are that community's members; its classes are sessions in that community (is_class).
-- Coaches and gyms pay a flat subscription (no commission), tracked here; billing itself is off-app for now.

-- 1) Communities can be gyms.
ALTER TABLE communities DROP CONSTRAINT IF EXISTS communities_kind_chk;
ALTER TABLE communities ADD CONSTRAINT communities_kind_chk
  CHECK (kind IN ('club', 'gym', 'company', 'compound', 'city', 'brand'));

-- 2) Partner subscription.
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS plan TEXT,
  ADD COLUMN IF NOT EXISTS plan_status TEXT NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_renews_at TIMESTAMPTZ;
ALTER TABLE partners DROP CONSTRAINT IF EXISTS partners_plan_chk;
ALTER TABLE partners ADD CONSTRAINT partners_plan_chk
  CHECK (plan IS NULL OR plan IN ('coach', 'studio', 'club', 'multi'));
ALTER TABLE partners DROP CONSTRAINT IF EXISTS partners_plan_status_chk;
ALTER TABLE partners ADD CONSTRAINT partners_plan_status_chk
  CHECK (plan_status IN ('trial', 'active', 'past_due', 'paused', 'cancelled'));
ALTER TABLE partners DROP CONSTRAINT IF EXISTS partners_billing_cycle_chk;
ALTER TABLE partners ADD CONSTRAINT partners_billing_cycle_chk
  CHECK (billing_cycle IN ('monthly', 'yearly'));
UPDATE partners SET trial_ends_at = COALESCE(trial_ends_at, created_at + interval '30 days')
  WHERE plan_status = 'trial';

-- 3) Classes: a gym's scheduled sessions, optionally repeating weekly (same series id).
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_class BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS class_series_id UUID;
CREATE INDEX IF NOT EXISTS idx_events_community_starts ON events (community_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_events_partner_starts ON events (partner_id, starts_at);

-- 4) Attendance: the gym marks who actually came (bookings vs. check-ins, no-show rate).
ALTER TABLE event_rsvps
  ADD COLUMN IF NOT EXISTS attended_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user ON event_rsvps (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_feed_posts_community_created ON feed_posts (community_id, created_at);

-- 5) The Club Portal (server, service role) notifies booked members when a gym cancels a class.
GRANT EXECUTE ON FUNCTION bt_notify(UUID[], TEXT, UUID, JSONB) TO service_role;
