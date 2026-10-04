import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import SubmitButton from '@/components/SubmitButton';
import { addLead, updateLead } from './actions';

export const revalidate = 0;

const STATUS: { id: string; label: string; hint: string }[] = [
  { id: 'new', label: 'New', hint: 'Reply within one working day' },
  { id: 'contacted', label: 'Contacted', hint: 'Waiting on them' },
  { id: 'demo', label: 'Demo', hint: 'Shown the product' },
  { id: 'trial', label: 'Trial', hint: 'Account created' },
  { id: 'won', label: 'Won', hint: 'Paying' },
  { id: 'lost', label: 'Lost', hint: '' },
];
const KIND: Record<string, string> = {
  gym: 'Gym or club', company: 'Company', coach: 'Coach', venue: 'Restaurant or venue', leader: 'Run club or sports group',
  influencer: 'Sports creator', compound: 'Compound or residence', school: 'School or university', other: 'Other',
};
// Which partner account a lead becomes (requests from the app included, since 2026-10-04).
const KIND_TO_TYPE: Record<string, string> = { gym: 'gym', company: 'company', coach: 'coach', venue: 'nutrition', leader: 'leader', influencer: 'leader', compound: 'venue', school: 'school' };
const input = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm';

function age(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
}

export default async function LeadsPage({ searchParams }: { searchParams: { status?: string } }) {
  await requireAdmin();
  const db = createAdminClient();
  const current = STATUS.some((s) => s.id === searchParams.status) ? searchParams.status! : 'new';
  // One count per stage: a row fetch would stop at the API's 1,000-row cap.
  const [{ data: leads }, ...stageCounts] = await Promise.all([
    db.from('partner_leads').select('*').eq('status', current).order('created_at', { ascending: false }).limit(200),
    ...STATUS.map((s) => db.from('partner_leads').select('id', { count: 'exact', head: true }).eq('status', s.id)),
  ]);
  const counts: Record<string, number> = {};
  STATUS.forEach((s, i) => (counts[s.id] = stageCounts[i].count || 0));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <p className="text-sm text-gray-500">
          Trial requests from <Link href="/for-gyms" className="text-brand-aqua hover:underline">/for-gyms</Link> and{' '}
          <Link href="/for-companies" className="text-brand-aqua hover:underline">/for-companies</Link>, plus the ones you add by hand.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS.map((s) => (
          <Link
            key={s.id}
            href={`/leads?status=${s.id}`}
            title={s.hint}
            className={`px-3 py-1.5 rounded-full text-sm border ${s.id === current ? 'bg-brand-teal text-white border-brand-teal' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
          >
            {s.label} <span className={s.id === current ? 'text-white/70' : 'text-gray-400'}>{counts[s.id] || 0}</span>
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {(leads || []).map((l: any) => {
          const newPartner = `/partners/new?lead=${l.id}`;
          return (
            <div key={l.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 grid lg:grid-cols-[1.2fr_1fr] gap-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-gray-900">{l.business_name}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{KIND[l.kind] || l.kind}</span>
                  {l.size ? <span className="text-xs text-gray-400">{l.size}</span> : null}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {l.contact_name}
                  {l.city ? ` · ${l.city}` : ''} · <span className="text-gray-400">{age(l.created_at)}{l.source ? ` via ${l.source}` : ''}</span>
                </p>
                <p className="text-sm mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {l.email && !l.email.endsWith('@lead.invalid') ? (
                    <a href={`mailto:${l.email}`} className="text-brand-aqua hover:underline">{l.email}</a>
                  ) : null}
                  {l.phone ? (
                    <a href={`https://wa.me/${String(l.phone).replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-brand-aqua hover:underline">
                      WhatsApp {l.phone}
                    </a>
                  ) : null}
                </p>
                {l.message ? <p className="text-sm text-gray-500 mt-2">{l.message}</p> : null}
                {l.source === 'captain request' ? (
                  <Link href="/captains" className="inline-block mt-3 me-4 text-sm font-semibold text-[#B86A10] hover:underline">Assign a Beast Captain</Link>
                ) : null}
                {l.kind === 'leader' && l.community_id ? (
                  <Link href={`/communities/${l.community_id}`} className="inline-block mt-3 me-4 text-sm font-semibold text-[#B86A10] hover:underline">Open the club to verify it</Link>
                ) : null}
                {l.kind === 'leader' && l.community_id ? null : l.partner_id ? (
                  <Link href={`/partners/${l.partner_id}`} className="inline-block mt-3 text-sm text-brand-aqua hover:underline">Open partner account</Link>
                ) : (
                  <Link href={`${newPartner}&type=${KIND_TO_TYPE[l.kind] || 'gym'}`} className="inline-block mt-3 text-sm font-semibold text-[#B86A10] hover:underline">
                    Create their account and start the trial
                  </Link>
                )}
              </div>
              <form action={updateLead.bind(null, l.id)} className="space-y-2">
                <select name="status" defaultValue={l.status} className={input}>
                  {STATUS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
                <textarea name="notes" defaultValue={l.notes || ''} placeholder="Notes: what they said, next step, when" className={`${input} h-20 resize-none`} />
                <SubmitButton pendingLabel="Saving…" className="px-4 py-1.5 bg-brand-teal text-white rounded-lg text-sm font-medium">Save</SubmitButton>
              </form>
            </div>
          );
        })}
        {!(leads || []).length ? <p className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-400">Nothing here.</p> : null}
      </div>

      <details className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <summary className="cursor-pointer font-semibold text-gray-900">Add a lead by hand</summary>
        <form action={addLead} className="mt-4 grid md:grid-cols-3 gap-3">
          <select name="kind" className={input}>
            <option value="gym">Gym or club</option>
            <option value="company">Company</option>
            <option value="coach">Coach</option>
            <option value="venue">Restaurant or venue</option>
          </select>
          <input name="business_name" required placeholder="Business name" className={input} />
          <input name="contact_name" placeholder="Contact name" className={input} />
          <input name="email" type="email" placeholder="Email" className={input} />
          <input name="phone" placeholder="Mobile / WhatsApp" className={input} />
          <input name="city" placeholder="City" className={input} />
          <textarea name="notes" placeholder="Where you met, what they need" className={`${input} md:col-span-2 h-16 resize-none`} />
          <SubmitButton pendingLabel="Adding…" className="px-4 py-2 bg-brand-orange text-brand-teal rounded-lg text-sm font-semibold self-start">Add lead</SubmitButton>
        </form>
      </details>
    </div>
  );
}
