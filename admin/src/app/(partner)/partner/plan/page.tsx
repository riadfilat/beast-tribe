import Link from 'next/link';
import { requirePartner } from '@/lib/auth';
import { PLANS, PLAN_STATUS_LABEL, PROMISES, SALES_EMAIL, planOf } from '@/lib/plans';
import { sar } from '@/lib/format';
import { Icon } from '@/components/ui/Icon';
import { card } from '@/components/club/ui';

export const revalidate = 0;

export default async function PlanPage() {
  const partner = await requirePartner();
  const t = partner.partner_type;
  const audience = t === 'gym' || t === 'school' ? 'gym' : t === 'company' ? 'company' : t === 'venue' ? 'venue' : 'coach';
  const current = planOf(partner.plan);
  const options = PLANS.filter((p) => p.audience === audience);
  const trialDays =
    partner.plan_status === 'trial' && partner.trial_ends_at ? Math.max(0, Math.ceil((new Date(partner.trial_ends_at).getTime() - Date.now()) / 86400000)) : null;
  const mail = (subject: string) => `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(subject)}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your plan</h1>
        <p className="text-sm text-gray-500">One flat monthly fee. We never take a cut of what you earn.</p>
      </div>

      {t === 'leader' ? (
        <div className="rounded-lg bg-[#E6F6F6] text-[#0F5A5A] text-sm px-4 py-3">
          Running a free club costs nothing: your dashboard, members and sessions stay free. A plan is only needed if you start charging for coaching.
        </div>
      ) : null}

      <section className={`${card} p-6 flex flex-wrap items-center justify-between gap-4`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Current plan</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {current ? current.name : partner.plan_status === 'trial' ? 'Free trial' : 'No plan'}
            <span className="ms-2 align-middle inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E6F6F6] text-[#0F5A5A]">
              {PLAN_STATUS_LABEL[partner.plan_status] || partner.plan_status}
            </span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {trialDays != null
              ? `${trialDays} day${trialDays === 1 ? '' : 's'} left in your trial. Everything is open while you try it.`
              : current && current.monthly
                ? `${sar(partner.billing_cycle === 'yearly' ? current.monthly * 10 : current.monthly)} ${current.unit ? current.unit : `/ ${partner.billing_cycle === 'yearly' ? 'year' : 'month'}`}${partner.plan_renews_at ? ` · renews ${new Date(partner.plan_renews_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`
                : 'Talk to us to set up billing.'}
          </p>
        </div>
        <a href={mail(`${partner.business_name}: plan`)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-teal text-white text-sm font-semibold hover:opacity-90">
          Talk to us about your plan
        </a>
      </section>

      <ul className="flex flex-wrap gap-2">
        {PROMISES.map((p) => (
          <li key={p} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-700">
            <Icon name="check" size="sm" className="text-[#147070]" />
            {p}
          </li>
        ))}
      </ul>

      <section className={`grid gap-4 ${options.length >= 3 ? 'lg:grid-cols-3' : 'md:grid-cols-2'}`}>
        {options.map((p) => {
          const on = p.id === partner.plan;
          return (
            <div key={p.id} className={`${card} p-6 flex flex-col ${on ? 'ring-2 ring-brand-orange' : ''}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{p.tagline}</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{p.name}</p>
              <p className="mt-3">
                {p.monthly ? (
                  <>
                    <span className="text-3xl font-bold text-brand-teal tabular-nums">{p.monthly.toLocaleString('en-US')}</span>
                    <span className="text-sm text-gray-500"> SAR {p.unit || '/ month'}</span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-brand-teal">Let&rsquo;s talk</span>
                )}
              </p>
              {p.monthly && !p.unit ? <p className="text-xs text-gray-400 mt-0.5">or {sar(p.monthly * 10)} a year, two months free · excl. VAT</p> : p.unit ? <p className="text-xs text-gray-400 mt-0.5">excl. VAT</p> : null}
              <p className="text-sm font-medium text-gray-700 mt-3">{p.limit}</p>
              <ul className="mt-3 space-y-2 text-sm text-gray-600 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Icon name="check" size="sm" className="text-[#147070] mt-0.5 flex-none" />
                    {f}
                  </li>
                ))}
              </ul>
              {on ? (
                <p className="mt-5 text-sm font-semibold text-[#B86A10]">Your plan</p>
              ) : (
                <a href={mail(`${partner.business_name}: ${p.name} plan`)} className="mt-5 inline-flex justify-center px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-800 hover:bg-gray-50">
                  {p.monthly ? `Choose ${p.name}` : 'Contact us'}
                </a>
              )}
            </div>
          );
        })}
      </section>

      <section className={`${card} p-6`}>
        <h2 className="font-semibold text-gray-900">Why a subscription, not a commission</h2>
        <div className="mt-3 grid md:grid-cols-3 gap-5 text-sm text-gray-600">
          <p>
            <span className="font-semibold text-gray-900">Put everything in the app.</span> With no cut on bookings, classes or personal training, there&rsquo;s never a
            reason to move a member to WhatsApp or cash to save a fee.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Know your cost.</span> The same fee whether you run 10 classes or 100. Growth is yours, not shared with us.
          </p>
          <p>
            <span className="font-semibold text-gray-900">We win when you do.</span> We only keep you as a customer if your members keep showing up. That&rsquo;s the
            whole job of the app.
          </p>
        </div>
        {audience === 'gym' ? (
          <p className="mt-4 text-sm text-gray-500">Coaches who work at your gym get the coach tools as part of your plan.</p>
        ) : null}
        <Link href="/for-gyms" className="mt-4 inline-block text-sm text-[#147070] hover:underline">
          Share the overview with your team →
        </Link>
      </section>
    </div>
  );
}
