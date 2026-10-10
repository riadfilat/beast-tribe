'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/auth';

const STATUSES = ['new', 'contacted', 'demo', 'trial', 'won', 'lost'];

function done() {
  revalidatePath('/hq/leads');
  revalidatePath('/hq');
  revalidatePath('/business');
}

/**
 * Move a lead to another step and/or save its notes. A form that leaves out `notes`
 * (the "move to next step" buttons) keeps the notes as they are.
 */
export async function updateLead(leadId: string, formData: FormData) {
  await requireRole('admin');
  const db = createAdminClient();
  const status = (formData.get('status') as string) || '';
  const patch: Record<string, any> = { updated_at: new Date().toISOString() };
  if (formData.has('notes')) {
    const notes = ((formData.get('notes') as string) || '').trim().slice(0, 4000);
    patch.notes = notes || null;
  }
  if (STATUSES.includes(status)) patch.status = status;
  const { error } = await db.from('partner_leads').update(patch).eq('id', leadId);
  if (error) throw new Error(error.message);
  done();
}

/** Add a lead by hand: someone met at an event, a referral, a WhatsApp message. */
export async function addLead(formData: FormData) {
  await requireRole('admin');
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
  done();
}
