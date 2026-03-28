import { cache } from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from './supabase-server';
import { redirect } from 'next/navigation';

export type AdminRole = 'super_admin' | 'admin' | 'moderator';
export type PartnerType = 'coach' | 'gym' | 'event_company';

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
}

/**
 * Cached per-request session lookup.
 * React.cache() ensures this runs only once per server render,
 * even if called from both layout and page.
 */
const getSessionUser = cache(async () => {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Read-only in server components
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Require admin access — cached per-request, redirects to /login if not authorized.
 * Uses parallel DB queries for maximum speed.
 */
export const requireAdmin = cache(async (): Promise<AdminUser> => {
  const user = await getSessionUser();
  if (!user) redirect('/login');

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

  const db = createAdminClient();

  const [profileResult, partnerResult] = await Promise.all([
    db.from('profiles').select('full_name').eq('id', user.id).single(),
    db
      .from('partners')
      .select('id, partner_type, business_name, is_verified')
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
  };
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
