import { cache } from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from './supabase-server';
import { redirect } from 'next/navigation';

export type AdminRole = 'super_admin' | 'admin' | 'moderator';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
}

/**
 * Cached per-request session lookup.
 * React.cache() ensures this runs only once per server render,
 * even if called from both layout and page.
 */
const getServerSupabase = cache(async () => {
  const cookieStore = await cookies();
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

/**
 * The database as the signed-in person (their own token): the database's rules and checks apply,
 * so leader and HQ functions decide for themselves who may do what.
 */
export const userSupabase = getServerSupabase;

export const getSessionUser = cache(async () => {
  const {
    data: { user },
  } = await (await getServerSupabase()).auth.getUser();
  return user;
});

/**
 * Two-step sign-in (authenticator app). `enrolled`: the account has a verified code app.
 * `verified`: this session entered a code (AAL2). The user was verified with getUser() first,
 * so the level read from the same session token is trustworthy.
 */
export const getTwoStep = cache(async (): Promise<{ enrolled: boolean; verified: boolean }> => {
  const { data } = await (await getServerSupabase()).auth.mfa.getAuthenticatorAssuranceLevel();
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
  // Admin accounts must use two-step sign-in: a stolen password alone never opens the dashboard.
  if (!(await getTwoStep()).enrolled) redirect('/security?required=1');

  return {
    id: user.id,
    email: user.email || '',
    full_name: profileResult.data?.full_name || 'Admin',
    role: roleResult.data.role as AdminRole,
  };
});

const RANK: Record<AdminRole, number> = { moderator: 1, admin: 2, super_admin: 3 };
/** Moderators look after Feed and Moderation; everything else needs an admin (or a super admin). */
export const isAtLeast = (role: AdminRole, min: AdminRole) => RANK[role] >= RANK[min];
export async function requireRole(min: AdminRole): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (!isAtLeast(admin.role, min)) redirect('/moderation');
  return admin;
}

/**
 * Where the signed-in person goes after login: HQ (staff), the leader dashboard, or nowhere.
 */
export async function getAccessType(): Promise<'admin' | 'leader' | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const db = createAdminClient();

  const [adminResult, teamResult] = await Promise.all([
    db.from('admin_roles').select('role').eq('user_id', user.id).maybeSingle(),
    // Leaders and supporters of a community (migration 092) use the leader dashboard.
    db.from('community_members').select('community_id').eq('user_id', user.id).in('role', ['admin', 'supporter']).limit(1),
  ]);

  if (adminResult.data) return 'admin';
  if (teamResult.data?.length) return 'leader';
  return null;
}
