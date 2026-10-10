import Link from 'next/link';
import { ArrowLeft, Plus } from '@phosphor-icons/react/dist/ssr';
import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { Box, Notice, PageTop } from '@/components/board/ui';
import SubmitButton from '@/components/SubmitButton';
import { createPartner } from '../actions';
import { BusinessFields } from '../BusinessFields';

// Add a business. Coming from a lead (?lead=<id>), its details are filled in and the trial starts today.

const LEAD_TYPE: Record<string, string> = { gym: 'gym', company: 'company', coach: 'coach', venue: 'nutrition' };
const LEAD_PLAN: Record<string, string> = { gym: 'studio', company: 'company', coach: 'coach', venue: 'venue' };

export default async function NewBusiness({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  await requireRole('admin');
  const { lead: leadId } = await searchParams;
  const db = createAdminClient();
  const [{ data: communities }, { data: lead }] = await Promise.all([
    db.from('communities').select('id, name').eq('is_active', true).order('name'),
    leadId ? db.from('partner_leads').select('*').eq('id', leadId).maybeSingle() : Promise.resolve({ data: null as any }),
  ]);
  const p = lead
    ? { business_name: lead.business_name, partner_type: LEAD_TYPE[lead.kind] || 'gym', contact_email: lead.email, contact_phone: lead.phone, city: lead.city, plan: LEAD_PLAN[lead.kind] || null, plan_status: 'trial' }
    : undefined;
  const loginEmail = lead?.email && !String(lead.email).endsWith('@lead.invalid') ? lead.email : '';

  return (
    <>
      <Link href="/hq/businesses" className="link text-[13px] inline-flex items-center gap-1"><ArrowLeft size={14} /> Businesses</Link>
      <PageTop title="Add a business" sub="A coach, gym, venue, healthy restaurant or company." />
      {lead ? <Notice>Filled in from the request by {lead.business_name || lead.contact_name || 'a lead'}. Saving it moves the request to Trial.</Notice> : null}
      <form action={createPartner} className="box grid gap-4 max-w-3xl">
        {lead ? <input type="hidden" name="lead_id" value={lead.id} /> : null}
        <BusinessFields p={p} communities={(communities || []) as { id: string; name: string }[]} />
        <fieldset className="grid gap-3 rule-top pt-4">
          <legend className="sr-only">Login</legend>
          <div>
            <b className="block text-[14px]" style={{ fontFamily: 'var(--bt-head)' }}>Their login</b>
            <p className="hint">Needed for everyone except a restaurant that only has an offer. Share the password with them yourself.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div><label className="label" htmlFor="b-contact">Contact name</label><input id="b-contact" name="full_name" className="input" defaultValue={lead?.contact_name || ''} placeholder="Ali Mohammed" /></div>
            <div><label className="label" htmlFor="b-login">Login email</label><input id="b-login" name="email" type="email" className="input" defaultValue={loginEmail} placeholder="coach@gym.com" /></div>
            <div><label className="label" htmlFor="b-pass">Password</label><input id="b-pass" name="password" type="text" minLength={8} autoComplete="off" className="input" placeholder="At least 8 characters" /></div>
          </div>
        </fieldset>
        <div><SubmitButton className="btn" pendingLabel="Adding…"><Plus size={16} weight="bold" /> Add business</SubmitButton></div>
      </form>
    </>
  );
}
