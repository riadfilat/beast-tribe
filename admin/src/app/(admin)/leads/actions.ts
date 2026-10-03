'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';

const STATUSES = ['new', 'contacted', 'demo', 'trial', 'won', 'lost'];

export async function updateLead(leadId: string, formData: FormData) {
  await requireAdmin();
  const db = createAdminClient();
  const status = (formData.get('status') as string) || '';
  const notes = ((formData.get('notes') as string) || '').trim().slice(0, 4000);
  const patch: Record<string, any> = { notes: notes || null, updated_at: new Date().toISOString() };
  if (STATUSES.includes(status)) patch.status = status;
  const { error } = await db.from('partner_leads').update(patch).eq('id', leadId);
  if (error) throw new Error(error.message);
  revalidatePath('/leads');
  revalidatePath('/business');
}

/** Add a lead by hand: someone met at an event, a referral, a WhatsApp message. */
export async function addLead(formData: FormData) {
  await requireAdmin();
  const db = createAdminClient();
  const str = (k: string) => ((formData.get(k) as string) || '').trim();
  const kind = ['gym', 'company', 'coach', 'venue'].includes(str('kind')) ? str('kind') : 'gym';
  if (str('business_name').length < 2) throw new Error('Add the business name');
  const { error } = await db.from('partner_leads').insert({
    kind,
    business_name: str('business_name'),
    contact_name: str('contact_name') || str('business_name'),
    email: str('email') || `unknown+${Date.now()}@lead.invalid`,
    phone: str('phone') || null,
    city: str('city') || null,
    source: 'added by hand',
    notes: str('notes') || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/leads');
}
