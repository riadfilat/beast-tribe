'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createPartner(formData: FormData) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const full_name = formData.get('full_name') as string;
  const partner_type = formData.get('partner_type') as string;
  const business_name = formData.get('business_name') as string;
  const description = formData.get('description') as string || null;
  const contact_email = formData.get('contact_email') as string || email;
  const contact_phone = formData.get('contact_phone') as string || null;
  const city = formData.get('city') as string || null;
  const country = formData.get('country') as string || 'SA';

  // Create auth user
  const { data: authData, error: authError } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) throw new Error(`Auth error: ${authError.message}`);
  if (!authData.user) throw new Error('Failed to create user');

  // Create profile
  await db.from('profiles').insert({
    id: authData.user.id,
    full_name,
    display_name: business_name,
  });

  // Create partner record
  const { error: partnerError } = await db.from('partners').insert({
    user_id: authData.user.id,
    partner_type,
    business_name,
    description,
    contact_email,
    contact_phone,
    city,
    country,
    is_verified: true,
  });

  if (partnerError) throw new Error(`Partner error: ${partnerError.message}`);

  // Audit
  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'create_partner',
    target_table: 'partners',
    details: { email, business_name, partner_type },
  });

  redirect('/partners');
}

export async function togglePartnerVerification(partnerId: string, verify: boolean) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  await db.from('partners')
    .update({ is_verified: verify, updated_at: new Date().toISOString() })
    .eq('id', partnerId);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: verify ? 'verify_partner' : 'unverify_partner',
    target_table: 'partners',
    target_id: partnerId,
  });

  revalidatePath('/partners');
}

export async function togglePartnerActive(partnerId: string, active: boolean) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  await db.from('partners')
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq('id', partnerId);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: active ? 'activate_partner' : 'deactivate_partner',
    target_table: 'partners',
    target_id: partnerId,
  });

  revalidatePath('/partners');
}
