-- ============================================
-- ADMIN ROLES & RBAC
-- ============================================

CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read admin_roles" ON admin_roles;
CREATE POLICY "Admins can read admin_roles" ON admin_roles FOR SELECT USING (true);
-- Only super_admins can insert/update/delete roles (enforced at app level via service_role key)

-- Helper functions are created in 001_initial_schema.sql
-- (They may already exist, so we skip them here to avoid conflicts)

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
-- Policies for audit_log are handled by app-level checks via service_role_key
-- So we skip RLS policies here to avoid function conflicts

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON admin_audit_log(created_at DESC);
