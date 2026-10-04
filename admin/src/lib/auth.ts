import { cache } from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from './supabase-server';
import { redirect } from 'next/navigation';
import { can, type Cap } from './capabilities';

export type AdminRole = 'super_admin' | 'admin' | 'moderator';
export type PartnerType = 'coach' | 'gym' | 'event_company' | 'company' | 'nutritionist' | 'venue' | 'school' | 'leader' | 'nutrition';

/** Gyms, companies, schools and club leaders run a community of their own from the dashboard. */
export const ownsCommunity = (t: string) => t === 'gym' || t === 'company' || t === 'school' || t === 'leader';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
}

export interface PartnerUser {
  id: string;
  email: string;
  full_name: string;
  partner_id: string;
  partner_type: PartnerType;
  business_name: string;
  is_verified: boolean;
  /** A gym's own club community. */
  community_id: string | null;
  plan: string | null;
  plan_status: string;
  billing_cycle: string;
  trial_ends_at: string | null;
  plan_renews_at: string | null;
}

/**
 * Cached per-request session lookup.
 * React.cache() ensures this runs only once per server render,
 * even if called from both layout and page.
 */
const getServerSupabase = cache(() => {
  const cookieStore = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Read-only in server components
      },
    },
  });
});

const getSessionUser = cache(async () => {
  const {
    data: { user },
  } = await getServerSupabase().auth.getUser();
  return user;
});

/**
 * Two-step sign-in (authenticator app). `enrolled`: the account has a verified code app.
 * `verified`: this session entered a code (AAL2). The user was verified with getUser() first,
 * so the level read from the same session token is trustworthy.
 */
export const getTwoStep = cache(async (): Promise<{ enrolled: boolean; verified: boolean }> => {
  const { data } = await getServerSupabase().auth.mfa.getAuthenticatorAssuranceLevel();
  return { enrolled: data?.nextLevel === 'aal2', verified: data?.currentLevel === 'aal2' };
});

/** Accounts with two-step sign-in on must enter their code before any dashboard page. */
async function requireCodeIfEnrolled() {
  const step = await getTwoStep();
  if (step.enrolled && !step.verified) redirect('/login/verify');
}

/**
 * Require admin access — cached per-request, redirects to /login if not authorized.
 * Uses parallel DB queries for maximum speed.
 */
export const requireAdmin = cache(async (): Promise<AdminUser> => {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  await requireCodeIfEnrolled();

  const db = createAdminClient();

  // Run both queries in parallel — 2x faster than sequential
  const [profileResult, roleResult] = await Promise.all([
    db.from('profiles').select('full_name').eq('id', user.id).single(),
    db.from('admin_roles').select('role').eq('user_id', user.id).single(),
  ]);

  if (!roleResult.data) redirect('/login?error=unauthorized');

  return {
    id: user.id,
    email: user.email || '',
    full_name: profileResult.data?.full_name || 'Admin',
    role: roleResult.data.role as AdminRole,
  };
});

/**
 * Require partner access — cached per-request, redirects if not a partner.
 */
export const requirePartner = cache(async (): Promise<PartnerUser> => {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  await requireCodeIfEnrolled();

  const db = createAdminClient();

  const [profileResult, partnerResult] = await Promise.all([
    db.from('profiles').select('full_name').eq('id', user.id).single(),
    db
      .from('partners')
      .select('id, partner_type, business_name, is_verified, community_id, plan, plan_status, billing_cycle, trial_ends_at, plan_renews_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single(),
  ]);

  if (!partnerResult.data) redirect('/login?error=not_partner');

  return {
    id: user.id,
    email: user.email || '',
    full_name: profileResult.data?.full_name || 'Partner',
    partner_id: partnerResult.data.id,
    partner_type: partnerResult.data.partner_type as PartnerType,
    business_name: partnerResult.data.business_name,
    is_verified: partnerResult.data.is_verified,
    community_id: partnerResult.data.community_id ?? null,
    plan: partnerResult.data.plan ?? null,
    plan_status: partnerResult.data.plan_status || 'trial',
    billing_cycle: partnerResult.data.billing_cycle || 'monthly',
    trial_ends_at: partnerResult.data.trial_ends_at ?? null,
    plan_renews_at: partnerResult.data.plan_renews_at ?? null,
  };
});

/**
 * Require a partner whose kind runs this part of the dashboard: the same rule the sidebar uses
 * (navFor), so a page opens by URL exactly when its menu item shows. Others go to the overview.
 */
export const requireCap = cache(async (cap: Cap): Promise<PartnerUser> => {
  const partner = await requirePartner();
  if (!can(partner.partner_type, cap)) redirect('/partner/dashboard');
  return partner;
});

/**
 * Check if current user is admin OR partner.
 * Used for routing on the root page after login.
 */
export async function getAccessType(): Promise<'admin' | 'partner' | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const db = createAdminClient();

  const [adminResult, partnerResult] = await Promise.all([
    db.from('admin_roles').select('role').eq('user_id', user.id).single(),
    db.from('partners').select('id').eq('user_id', user.id).eq('is_active', true).single(),
  ]);

  if (adminResult.data) return 'admin';
  if (partnerResult.data) return 'partner';
  return null;
}
