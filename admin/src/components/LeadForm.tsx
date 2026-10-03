'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { submitLead, type LeadState } from '@/app/lead-actions';

type Kind = 'gym' | 'company' | 'coach' | 'venue';

const SIZE: Record<Kind, { label: string; options: string[] }> = {
  gym: { label: 'Members', options: ['Under 100', '100–300', '300–1,500', 'Over 1,500'] },
  company: { label: 'Employees', options: ['Under 50', '50–250', '250–1,000', 'Over 1,000'] },
  coach: { label: 'Clients', options: ['Under 10', '10–30', 'Over 30'] },
  venue: { label: 'Branches', options: ['1', '2–5', 'Over 5'] },
};
const NAME: Record<Kind, string> = { gym: 'Gym or club name', company: 'Company name', coach: 'Your coaching name', venue: 'Restaurant or venue name' };

const field = 'w-full rounded-xl border border-[#0B2626]/15 bg-white px-4 py-3 text-[15px] text-[#0B2626] placeholder:text-[#0B2626]/35 focus:outline-none focus:ring-2 focus:ring-[#56C4C4]';
const lab = 'block text-sm font-medium text-[#0B2626]/70 mb-1.5';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="w-full rounded-xl bg-[#E88F24] px-6 py-3.5 font-semibold text-[#023C3C] hover:brightness-95 disabled:opacity-60">
      {pending ? 'Sending…' : label}
    </button>
  );
}

/** Trial request form for the public pages. Lands in the admin Leads pipeline. */
export default function LeadForm({ kind: initial, source, cta = 'Start my free trial' }: { kind: Kind; source: string; cta?: string }) {
  const [state, action] = useFormState<LeadState, FormData>(submitLead, { ok: false });
  const [kind, setKind] = useState<Kind>(initial);
  const [started, setStarted] = useState(0);
  useEffect(() => setStarted(Date.now()), []);

  if (state.ok) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center" role="status">
        <p className="text-2xl font-bold text-[#023C3C]">Got it. Thank you.</p>
        <p className="mt-2 text-[#0B2626]/70">We&rsquo;ll be in touch within one working day to set up your trial.</p>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-2xl bg-white p-6 sm:p-8 space-y-4 text-left">
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="started" value={started} />
      {/* Hidden from people; bots fill it in. */}
      <div className="hidden" aria-hidden>
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <span className={lab}>I run a</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['gym', 'company', 'coach', 'venue'] as Kind[]).map((k) => (
            <label key={k} className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-medium ${kind === k ? 'border-[#023C3C] bg-[#023C3C] text-white' : 'border-[#0B2626]/15 text-[#0B2626]/75'}`}>
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
              {{ gym: 'Gym or club', company: 'Company', coach: 'Coach', venue: 'Restaurant or venue' }[k]}
            </label>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={lab} htmlFor="lead-business">{NAME[kind]}</label>
          <input id="lead-business" name="business_name" required minLength={2} maxLength={120} className={field} />
        </div>
        <div>
          <label className={lab} htmlFor="lead-size">{SIZE[kind].label}</label>
          <select id="lead-size" name="size" className={field} defaultValue="">
            <option value="">Choose</option>
            {SIZE[kind].options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={lab} htmlFor="lead-name">Your name</label>
          <input id="lead-name" name="contact_name" required minLength={2} maxLength={120} autoComplete="name" className={field} />
        </div>
        <div>
          <label className={lab} htmlFor="lead-city">City</label>
          <input id="lead-city" name="city" maxLength={80} autoComplete="address-level2" placeholder="Riyadh" className={field} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={lab} htmlFor="lead-email">Work email</label>
          <input id="lead-email" name="email" type="email" required maxLength={200} autoComplete="email" className={field} />
        </div>
        <div>
          <label className={lab} htmlFor="lead-phone">Mobile or WhatsApp</label>
          <input id="lead-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" placeholder="+966" className={field} />
        </div>
      </div>

      {state.error ? (
        <p className="text-sm font-medium text-[#9E3A33]" role="alert">
          {state.error}
        </p>
      ) : null}
      <Submit label={cta} />
      <p className="text-xs text-[#0B2626]/50 text-center">30 days free. No card needed. We only use your details to contact you about Beast Tribe.</p>
    </form>
  );
}
