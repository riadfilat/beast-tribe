'use server';

import { createHash } from 'crypto';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase-server';

export interface LeadState {
  ok: boolean;
  error?: string;
}

const KINDS = ['gym', 'company', 'coach', 'venue'];

/** A trial or demo request from a public page. Stored as a lead; a person follows up. */
export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const str = (k: string, max: number) => ((formData.get(k) as string) || '').trim().slice(0, max);

  // Bots fill every field and submit at once: a hidden field and a minimum time catch most.
  if (str('website', 200)) return { ok: true };
  const started = Number(formData.get('started') || 0);
  if (!started || Date.now() - started < 2500) return { ok: false, error: 'Please try again.' };

  const kind = KINDS.includes(str('kind', 20)) ? str('kind', 20) : 'gym';
  const business_name = str('business_name', 120);
  const contact_name = str('contact_name', 120);
  const email = str('email', 200).toLowerCase();
  if (business_name.length < 2 || contact_name.length < 2) return { ok: false, error: 'Add your name and your business name.' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: 'That email does not look right.' };

  const h = await headers();
  const ip = (h.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  const ip_hash = createHash('sha256').update(`${ip}:${new Date().toISOString().slice(0, 10)}`).digest('hex').slice(0, 32);

  const db = createAdminClient();
  const dayAgo = new Date(Date.now() - 86400000).toISOString();
  const [sameEmail, sameIp, all] = await Promise.all([
    db.from('partner_leads').select('id', { count: 'exact', head: true }).eq('email', email).gte('created_at', dayAgo),
    db.from('partner_leads').select('id', { count: 'exact', head: true }).eq('ip_hash', ip_hash).gte('created_at', dayAgo),
    db.from('partner_leads').select('id', { count: 'exact', head: true }).gte('created_at', dayAgo),
  ]);
  if ((sameEmail.count ?? 0) >= 1) return { ok: true }; // already have it: thank them again
  if ((sameIp.count ?? 0) >= 5 || (all.count ?? 0) >= 300) return { ok: false, error: 'Too many requests right now. Please email us instead.' };

  const { error } = await db.from('partner_leads').insert({
    kind,
    business_name,
    contact_name,
    email,
    phone: str('phone', 40) || null,
    city: str('city', 80) || null,
    size: str('size', 40) || null,
    message: str('message', 2000) || null,
    source: str('source', 60) || null,
    ip_hash,
  });
  if (error) return { ok: false, error: 'Something went wrong. Please try again.' };
  return { ok: true };
}
