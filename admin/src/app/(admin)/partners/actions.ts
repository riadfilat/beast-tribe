'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// Partner kinds the app understands. 'nutrition' = a healthy restaurant with a member offer.
const TYPES = ['coach', 'gym', 'company', 'school', 'venue', 'leader', 'nutritionist', 'event_company', 'nutrition'] as const;

function slugify(raw: string) {
  return raw.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'partner';
}

/** Fields shared by create and update, read from the form. */
function readFields(formData: FormData) {
  const str = (k: string) => ((formData.get(k) as string) || '').trim();
  const partner_type = TYPES.includes(str('partner_type') as any) ? str('partner_type') : 'coach';
  const business_name = str('business_name');
  if (!business_name) throw new Error('Business name is required');
  const sports = str('sports')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const offer = str('offer');
  const offer_ar = str('offer_ar');
  const code = str('offer_code').toUpperCase();
  const plan = ['coach', 'studio', 'club', 'multi', 'company', 'venue'].includes(str('plan')) ? str('plan') : null;
  const plan_status = ['trial', 'active', 'past_due', 'paused', 'cancelled'].includes(str('plan_status')) ? str('plan_status') : 'trial';
  const date = (k: string) => (/^\d{4}-\d{2}-\d{2}$/.test(str(k)) ? `${str(k)}T00:00:00+03:00` : null);
  return {
    plan,
    plan_status,
    billing_cycle: str('billing_cycle') === 'yearly' ? 'yearly' : 'monthly',
    trial_ends_at: date('trial_ends_at'),
    plan_renews_at: date('plan_renews_at'),
    partner_type,
    business_name,
    name: business_name,
    type: partner_type,
    description: str('description') || null,
    contact_email: str('contact_email') || null,
    contact_phone: str('contact_phone') || null,
    website_url: str('website_url') || null,
    city: str('city') || null,
    country: str('country') || 'SA',
    sports,
    community_id: str('community_id') || null,
    metadata: partner_type === 'nutrition' ? { offer: offer || null, offer_ar: offer_ar || null, code: code || null } : {},
  };
}

export async function createPartner(formData: FormData) {
  const admin = await requireRole('admin');
  const db = createAdminClient();
  const fields = readFields(formData);

  // A login is needed for coaches, gyms and event companies (Partner Portal); restaurants can skip it.
  const email = ((formData.get('email') as string) || '').trim();
  const password = (formData.get('password') as string) || '';
  const full_name = ((formData.get('full_name') as string) || '').trim() || fields.business_name;
  let userId: string | null = null;
  if (email) {
    if (password.length < 8) throw new Error('Password must be at least 8 characters');
    const { data: authData, error: authError } = await db.auth.admin.createUser({ email, password, email_confirm: true });
    if (authError) throw new Error(`Auth error: ${authError.message}`);
    userId = authData.user!.id;
    await db.from('profiles').upsert({ id: userId, full_name, display_name: fields.business_name });
  } else if (fields.partner_type !== 'nutrition') {
    throw new Error('Coaches, gyms, companies, nutritionists and event companies need a login email');
  }

  const slug = `${slugify(fields.business_name)}-${Math.random().toString(36).slice(2, 6)}`;
  const { data: created, error } = await db.from('partners').insert({
    ...fields,
    user_id: userId,
    slug,
    contact_email: fields.contact_email || email || null,
    trial_ends_at: fields.trial_ends_at || new Date(Date.now() + 30 * 86400000).toISOString(),
    status: 'active',
    is_active: true,
    is_verified: true,
  }).select('id').single();
  if (error) throw new Error(`Partner error: ${error.message}`);

  // Created from a lead: the lead moves to Trial and points at the account.
  const leadId = ((formData.get('lead_id') as string) || '').trim();
  if (leadId && created) {
    await db.from('partner_leads').update({ status: 'trial', partner_id: created.id, updated_at: new Date().toISOString() }).eq('id', leadId);
    revalidatePath('/leads');
  }

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'create_partner',
    target_table: 'partners',
    details: { email: email || null, business_name: fields.business_name, partner_type: fields.partner_type },
  });

  revalidatePath('/partners');
  redirect('/partners');
}

export async function togglePartnerVerification(partnerId: string, verify: boolean) {
  const admin = await requireRole('admin');
  const db = createAdminClient();
  await db.from('partners').update({ is_verified: verify, updated_at: new Date().toISOString() }).eq('id', partnerId);
  await db.from('admin_audit_log').insert({ admin_user_id: admin.id, action: verify ? 'verify_partner' : 'unverify_partner', target_table: 'partners', target_id: partnerId });
  revalidatePath('/partners');
}

export async function togglePartnerActive(partnerId: string, active: boolean) {
  const admin = await requireRole('admin');
  const db = createAdminClient();
  // The app shows partners whose status is active, so keep both in step.
  await db.from('partners').update({ is_active: active, status: active ? 'active' : 'inactive', updated_at: new Date().toISOString() }).eq('id', partnerId);
  await db.from('admin_audit_log').insert({ admin_user_id: admin.id, action: active ? 'activate_partner' : 'deactivate_partner', target_table: 'partners', target_id: partnerId });
  revalidatePath('/partners');
}

export async function updatePartner(partnerId: string, formData: FormData) {
  const admin = await requireRole('admin');
  const db = createAdminClient();
  const fields = readFields(formData);
  const is_verified = formData.get('is_verified') === 'on';
  const is_active = formData.get('is_active') === 'on';
  const updates = { ...fields, is_verified, is_active, status: is_active ? 'active' : 'inactive', updated_at: new Date().toISOString() };

  const { error } = await db.from('partners').update(updates).eq('id', partnerId);
  if (error) throw new Error(`Update partner error: ${error.message}`);

  await db.from('admin_audit_log').insert({ admin_user_id: admin.id, action: 'update_partner', target_table: 'partners', target_id: partnerId, details: updates });
  revalidatePath('/partners');
  redirect('/partners');
}

// ─── Coach availability (weekly slots members can book when hosting) ───────
export async function addCoachSlot(partnerId: string, formData: FormData) {
  await requireRole('admin');
  const db = createAdminClient();
  const days = formData.getAll('day_of_week').map((d) => Number(d)).filter((d) => d >= 0 && d <= 6);
  const start = (formData.get('start_time') as string) || '';
  const end = (formData.get('end_time') as string) || '';
  if (!days.length || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || end <= start) {
    throw new Error('Pick at least one day and an end time after the start time');
  }
  // Split the window into bookable blocks (default one hour each).
  const len = Math.max(15, Math.min(240, Number(formData.get('slot_minutes')) || 60));
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const toHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const rows: { partner_id: string; day_of_week: number; start_time: string; end_time: string; is_active: boolean }[] = [];
  for (const d of days) {
    for (let m = toMin(start); m + len <= toMin(end); m += len) {
      rows.push({ partner_id: partnerId, day_of_week: d, start_time: toHHMM(m), end_time: toHHMM(m + len), is_active: true });
    }
  }
  if (!rows.length) throw new Error('The window is shorter than one slot');
  const { error } = await db.from('coach_slots').insert(rows);
  if (error) throw new Error(error.message);
  revalidatePath(`/partners/${partnerId}`);
}

export async function removeCoachSlot(partnerId: string, slotId: string) {
  await requireRole('admin');
  const db = createAdminClient();
  await db.from('coach_slots').delete().eq('id', slotId).eq('partner_id', partnerId);
  revalidatePath(`/partners/${partnerId}`);
}
