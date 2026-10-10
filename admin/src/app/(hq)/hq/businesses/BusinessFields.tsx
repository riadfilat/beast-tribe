// The fields of a business record (coach, gym, venue, healthy restaurant…), shared by the
// add and edit pages. Plain inputs, so it works inside a server-rendered form.

export interface BusinessValues {
  business_name?: string | null;
  partner_type?: string | null;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website_url?: string | null;
  city?: string | null;
  country?: string | null;
  sports?: string[] | null;
  community_id?: string | null;
  metadata?: { offer?: string | null; offer_ar?: string | null; code?: string | null } | null;
  plan?: string | null;
  plan_status?: string | null;
  billing_cycle?: string | null;
  trial_ends_at?: string | null;
  plan_renews_at?: string | null;
}

export const BUSINESS_TYPES: [string, string][] = [
  ['coach', 'Coach'],
  ['gym', 'Gym'],
  ['venue', 'Courts and venues'],
  ['nutrition', 'Healthy restaurant'],
  ['nutritionist', 'Nutritionist'],
  ['company', 'Company'],
  ['school', 'School'],
  ['leader', 'Club leader or influencer'],
  ['event_company', 'Event company'],
];
export const typeLabel = (t: string | null | undefined) => BUSINESS_TYPES.find(([k]) => k === t)?.[1] ?? t ?? '—';

export const PLANS: [string, string][] = [
  ['coach', 'Coach · 149 SAR'],
  ['studio', 'Studio · 790 SAR'],
  ['club', 'Club · 1,590 SAR'],
  ['multi', 'Multi-branch · custom'],
  ['company', 'Company · 10 SAR a seat'],
  ['venue', 'Venue · 1,000 SAR'],
];
export const PLAN_STATUS: [string, string][] = [['trial', 'Free trial'], ['active', 'Paying'], ['past_due', 'Payment due'], ['paused', 'Paused'], ['cancelled', 'Cancelled']];

const day = (v?: string | null) => (v ? v.slice(0, 10) : '');

export function BusinessFields({ p = {}, communities }: { p?: BusinessValues; communities: { id: string; name: string }[] }) {
  const m = p.metadata || {};
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="label" htmlFor="b-name">Business name</label><input id="b-name" name="business_name" required className="input" defaultValue={p.business_name || ''} placeholder="Leejam Fitness" /></div>
        <div>
          <label className="label" htmlFor="b-type">What they are</label>
          <select id="b-type" name="partner_type" className="input" defaultValue={p.partner_type || 'coach'}>
            {BUSINESS_TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
      </div>
      <div><label className="label" htmlFor="b-desc">About them</label><textarea id="b-desc" name="description" rows={2} className="input" defaultValue={p.description || ''} /></div>
      <div>
        <label className="label" htmlFor="b-sports">Sports (coaches and gyms)</label>
        <input id="b-sports" name="sports" className="input" defaultValue={(p.sports || []).join(', ')} placeholder="running, padel, crossfit" />
        <p className="hint mt-1">Separate with commas. Members see a coach when they host one of these sports.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="label" htmlFor="b-email">Contact email</label><input id="b-email" name="contact_email" type="email" className="input" defaultValue={p.contact_email || ''} /></div>
        <div><label className="label" htmlFor="b-phone">Phone</label><input id="b-phone" name="contact_phone" className="input" defaultValue={p.contact_phone || ''} placeholder="+966…" /></div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div><label className="label" htmlFor="b-city">City</label><input id="b-city" name="city" className="input" defaultValue={p.city || ''} placeholder="Riyadh" /></div>
        <div>
          <label className="label" htmlFor="b-country">Country</label>
          <select id="b-country" name="country" className="input" defaultValue={p.country || 'SA'}>
            <option value="SA">Saudi Arabia</option>
            <option value="AE">UAE</option>
            <option value="KW">Kuwait</option>
            <option value="BH">Bahrain</option>
          </select>
        </div>
        <div><label className="label" htmlFor="b-web">Website</label><input id="b-web" name="website_url" type="url" className="input" defaultValue={p.website_url || ''} placeholder="https://" /></div>
      </div>
      <div>
        <label className="label" htmlFor="b-community">Who sees them</label>
        <select id="b-community" name="community_id" className="input" defaultValue={p.community_id || ''}>
          <option value="">Everyone</option>
          {communities.map((c) => <option key={c.id} value={c.id}>Only {c.name}</option>)}
        </select>
        <p className="hint mt-1">Pick a community when a gym is only for its own club.</p>
      </div>

      <details className="well p-3" open={!!(m.offer || m.code)}>
        <summary className="cursor-pointer text-[13px] font-semibold" style={{ fontFamily: 'var(--bt-head)' }}>Member offer (healthy restaurants)</summary>
        <div className="grid gap-3 mt-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label" htmlFor="b-offer">Offer</label><input id="b-offer" name="offer" className="input" defaultValue={m.offer || ''} placeholder="15% off bowls for members" /></div>
            <div><label className="label" htmlFor="b-offer-ar">Offer in Arabic</label><input id="b-offer-ar" name="offer_ar" dir="rtl" className="input" defaultValue={m.offer_ar || ''} placeholder="خصم ١٥٪ للأعضاء" /></div>
          </div>
          <div className="sm:w-1/2"><label className="label" htmlFor="b-code">Discount code</label><input id="b-code" name="offer_code" className="input uppercase tracking-widest" defaultValue={m.code || ''} placeholder="BEAST15" /></div>
          <p className="hint">Shown in the app under Nutrition › Eat well. Only saved when the business is a healthy restaurant.</p>
        </div>
      </details>

      <details className="well p-3" open={!!p.plan}>
        <summary className="cursor-pointer text-[13px] font-semibold" style={{ fontFamily: 'var(--bt-head)' }}>Plan and billing (flat fee, no commission)</summary>
        <div className="grid gap-3 mt-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="label" htmlFor="b-plan">Plan</label>
              <select id="b-plan" name="plan" className="input" defaultValue={p.plan || ''}>
                <option value="">None yet</option>
                {PLANS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="b-status">Status</label>
              <select id="b-status" name="plan_status" className="input" defaultValue={p.plan_status || 'trial'}>
                {PLAN_STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="b-cycle">Billing</label>
              <select id="b-cycle" name="billing_cycle" className="input" defaultValue={p.billing_cycle || 'monthly'}>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label" htmlFor="b-trial">Trial ends</label><input id="b-trial" name="trial_ends_at" type="date" className="input" defaultValue={day(p.trial_ends_at)} /></div>
            <div><label className="label" htmlFor="b-renews">Renews on</label><input id="b-renews" name="plan_renews_at" type="date" className="input" defaultValue={day(p.plan_renews_at)} /></div>
          </div>
          <p className="hint">Billing happens outside the app for now; this is what the business sees on its Plan page.</p>
        </div>
      </details>
    </>
  );
}
