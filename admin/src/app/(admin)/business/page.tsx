import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { TARGETS, TARGET_DATE, YEAR_END_2027 } from '@/lib/targets';
import { loadCaptains, loadStatement, monthRange } from '@/lib/captains';
import SubmitButton from '@/components/SubmitButton';

export const revalidate = 0;

const card = 'bg-white rounded-xl border border-gray-100 shadow-sm';
const sar = (n: number) => `SAR ${Math.round(n).toLocaleString('en-US')}`;

async function saveAppLinks(formData: FormData) {
  'use server';
  const admin = await requireAdmin();
  const db = createAdminClient();
  const clean = (k: string) => {
    const v = ((formData.get(k) as string) || '').trim();
    return /^https:\/\//.test(v) ? v.slice(0, 300) : null;
  };
  await db.from('app_settings').upsert({ key: 'app_links', value: { ios: clean('ios'), android: clean('android') }, updated_at: new Date().toISOString(), updated_by: admin.id }, { onConflict: 'key' });
  revalidatePath('/business');
  revalidatePath('/get');
}

function Progress({ label, value, target, fmt = (n: number) => n.toLocaleString('en-US') }: { label: string; value: number; target: number; fmt?: (n: number) => string }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="tabular-nums">
          <span className="font-semibold text-gray-900">{fmt(value)}</span>
          <span className="text-gray-400"> / {fmt(target)}</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${pct >= 100 ? 'bg-brand-green' : 'bg-brand-orange'}`} style={{ width: `${Math.max(pct, value ? 2 : 0)}%` }} />
      </div>
    </div>
  );
}

export default async function BusinessPage() {
  await requireAdmin();
  const db = createAdminClient();
  const [{ data: o }, { data: links }] = await Promise.all([db.rpc('business_overview'), db.from('app_settings').select('value').eq('key', 'app_links').maybeSingle()]);
  const b: any = o || {};
  const capMonth = monthRange();
  const [capRows, capStatement] = await Promise.all([loadCaptains(), loadStatement(capMonth.from, capMonth.to)]);
  const cap = capStatement.reduce((t, r) => ({ hours: t.hours + r.hours, billed: t.billed + r.billed, ours: t.ours + r.ourShare }), { hours: 0, billed: 0, ours: 0 });
  const capActive = capRows.filter((c) => c.active);
  const capBehind = capActive.filter((c) => c.thisWeek < c.target).length;
  const paying = b.paying || {};
  const leads = b.leads || {};
  const open = (leads.new || 0) + (leads.contacted || 0) + (leads.demo || 0);
  const daysLeft = Math.max(0, Math.ceil((new Date(`${TARGET_DATE}T23:59:59+03:00`).getTime() - Date.now()) / 86400000));
  const appLinks: any = links?.value || {};
  const activation = b.members ? Math.round((b.active_30d / b.members) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Business</h1>
        <p className="text-sm text-gray-500">Revenue, pipeline and progress against the plan. Billing is done outside the app: a partner counts as paying when their plan status is Active.</p>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${card} p-5`}>
          <p className="text-xs text-gray-500">Monthly recurring revenue</p>
          <p className="mt-1 text-3xl font-bold text-brand-teal tabular-nums">{sar(b.mrr || 0)}</p>
          <p className="mt-1 text-xs text-gray-400">{sar((b.mrr || 0) * 12)} a year at this rate</p>
        </div>
        <div className={`${card} p-5`}>
          <p className="text-xs text-gray-500">Paying partners</p>
          <p className="mt-1 text-3xl font-bold text-brand-teal tabular-nums">{Object.values(paying).reduce((a: number, n: any) => a + Number(n), 0)}</p>
          <p className="mt-1 text-xs text-gray-400">
            {paying.gym || 0} gyms · {paying.company || 0} companies · {paying.coach || 0} coaches · {paying.venue || 0} venues
          </p>
        </div>
        <Link href="/partners" className={`${card} p-5 block hover:border-gray-200`}>
          <p className="text-xs text-gray-500">On free trial</p>
          <p className="mt-1 text-3xl font-bold text-[#B86A10] tabular-nums">{b.trials || 0}</p>
          <p className="mt-1 text-xs text-gray-400">{(b.trials_ending || []).length} ending within 14 days{b.past_due ? ` · ${b.past_due} payment due` : ''}</p>
        </Link>
        <Link href="/leads" className={`${card} p-5 block hover:border-gray-200`}>
          <p className="text-xs text-gray-500">Open leads</p>
          <p className="mt-1 text-3xl font-bold text-[#147070] tabular-nums">{open}</p>
          <p className="mt-1 text-xs text-gray-400">{leads.new || 0} new, waiting for a reply · {b.leads_30d || 0} in 30 days</p>
        </Link>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className={`${card} p-6 space-y-4`}>
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold text-gray-900">Plan targets for 31 March 2027</h2>
            <span className="text-xs text-gray-400">{daysLeft} days left</span>
          </div>
          <Progress label="Monthly recurring revenue" value={b.mrr || 0} target={TARGETS.mrr} fmt={sar} />
          <Progress label="Paying gyms and clubs" value={paying.gym || 0} target={TARGETS.gym} />
          <Progress label="Paying companies" value={paying.company || 0} target={TARGETS.company} />
          <Progress label="Company seats" value={Math.round(b.company_seats || 0)} target={TARGETS.company_seats} />
          <Progress label="Paying coaches" value={paying.coach || 0} target={TARGETS.coach} />
          <Progress label="Paying venues and kitchens" value={paying.venue || 0} target={TARGETS.venue} />
          <Progress label="Members" value={b.members || 0} target={TARGETS.members} />
          <Progress label="Active members this week" value={b.active_7d || 0} target={TARGETS.active_7d} />
          <p className="text-xs text-gray-400">
            December 2027 goal: {sar(YEAR_END_2027.mrr)} a month from {YEAR_END_2027.company} companies, {YEAR_END_2027.gym} gyms, {YEAR_END_2027.coach} coaches and{' '}
            {YEAR_END_2027.venue} venues, with {YEAR_END_2027.members.toLocaleString('en-US')} members.
          </p>
        </div>

        <div className="space-y-4">
          <div className={`${card} p-6`}>
            <h2 className="font-semibold text-gray-900">Members, last 30 days</h2>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              {[
                [b.members_new_30d || 0, 'new members'],
                [b.active_30d || 0, `active (${activation}% of all)`],
                [b.active_7d || 0, 'active this week'],
                [b.sessions_30d || 0, 'sessions held'],
                [b.bookings_30d || 0, 'bookings'],
                [b.workouts_30d || 0, 'workouts logged'],
              ].map(([n, l]) => (
                <div key={l as string}>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">{Number(n).toLocaleString('en-US')}</p>
                  <p className="text-xs text-gray-500">{l}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Active = booked a session, logged a workout or posted. {b.health_connected || 0} members synced steps this week · {b.challenges_live || 0} challenges running.
            </p>
          </div>

          <div className={`${card} p-6`}>
            <h2 className="font-semibold text-gray-900">Trials ending soon</h2>
            {(b.trials_ending || []).length ? (
              <ul className="mt-3 divide-y divide-gray-50">
                {(b.trials_ending as any[]).map((t) => {
                  const d = Math.ceil((new Date(t.ends).getTime() - Date.now()) / 86400000);
                  return (
                    <li key={t.id} className="py-2 flex items-center justify-between text-sm">
                      <Link href={`/partners/${t.id}`} className="text-gray-900 hover:underline">{t.name}</Link>
                      <span className={d < 0 ? 'text-[#9E3A33] font-medium' : 'text-gray-500'}>{d < 0 ? `ended ${-d} days ago` : d === 0 ? 'ends today' : `${d} days left`}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-gray-400">None in the next 14 days.</p>
            )}
            <p className="mt-3 text-xs text-gray-400">Call before the trial ends. When they pay, set their plan status to Active on the partner page.</p>
          </div>
        </div>
      </section>

      <Link href="/captains" className={`${card} p-6 block hover:border-gray-200`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-gray-900">Beast Captains, {capMonth.label}</h2>
          <p className="text-xs text-gray-400">Paid by the hour, on top of subscriptions. Not counted in monthly recurring revenue.</p>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{capActive.length}</p>
            <p className="text-xs text-gray-500">Captains{capBehind ? ` · ${capBehind} behind this week` : ''}</p>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{cap.hours.toFixed(1)}</p>
            <p className="text-xs text-gray-500">Hours held</p>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{sar(cap.billed)}</p>
            <p className="text-xs text-gray-500">Billed to communities</p>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-2xl font-bold text-[#147070] tabular-nums">{sar(cap.ours)}</p>
            <p className="text-xs text-gray-500">Our share</p>
          </div>
        </div>
      </Link>

      <section className={`${card} p-6`}>
        <h2 className="font-semibold text-gray-900">Pipeline</h2>
        <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-3">
          {['new', 'contacted', 'demo', 'trial', 'won', 'lost'].map((s) => (
            <Link key={s} href={`/leads?status=${s}`} className="rounded-lg bg-gray-50 px-4 py-3 hover:bg-gray-100">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{leads[s] || 0}</p>
              <p className="text-xs capitalize text-gray-500">{s}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className={`${card} p-6`}>
        <h2 className="font-semibold text-gray-900">App download links</h2>
        <p className="text-xs text-gray-500 mt-1">
          Used by <Link href="/get" className="text-brand-aqua hover:underline">/get</Link>, the page partner posters and QR codes point to. Paste the TestFlight public link now and the App Store link once the app is public.
        </p>
        <form action={saveAppLinks} className="mt-4 grid md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">iPhone (App Store or TestFlight)</label>
            <input name="ios" type="url" defaultValue={appLinks.ios || ''} placeholder="https://apps.apple.com/…" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Android (Google Play)</label>
            <input name="android" type="url" defaultValue={appLinks.android || ''} placeholder="https://play.google.com/…" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <SubmitButton pendingLabel="Saving…" className="px-4 py-2 bg-brand-teal text-white rounded-lg text-sm font-medium">Save</SubmitButton>
        </form>
      </section>
    </div>
  );
}
