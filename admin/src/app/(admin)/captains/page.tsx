import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { defaultCut, loadCaptains, loadStatement, monthRange, sar, todayRiyadh } from '@/lib/captains';
import SubmitButton from '@/components/SubmitButton';
import { ConfirmButton } from '@/components/ConfirmSubmit';
import PrintButton from '@/components/club/PrintButton';
import { Avatar, Stat, btnGhost, btnPrimary, card, input, label } from '@/components/club/ui';
import { assignCaptain, endCaptain, saveDefaultCut, updateCaptain } from './actions';

export const revalidate = 0;

const day = (d: string | null) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Riyadh' }) : '—');

export default async function CaptainsPage({ searchParams }: { searchParams: { m?: string; community?: string } }) {
  await requireAdmin();
  const db = createAdminClient();
  const month = monthRange(searchParams.m);
  const [all, statement, cut, { data: communities }] = await Promise.all([
    loadCaptains(),
    loadStatement(month.from, month.to),
    defaultCut(),
    db.from('communities').select('id, name').order('name').limit(1000),
  ]);
  const active = all.filter((c) => c.active);
  const ended = all.filter((c) => !c.active);
  const onBoard = active.reduce((s, c) => s + Math.min(c.thisWeek, c.target), 0);
  const wanted = active.reduce((s, c) => s + c.target, 0);
  const short = active.filter((c) => c.thisWeek < c.target);
  const worked = statement.filter((r) => r.sessions > 0);
  const total = worked.reduce((t, r) => ({ sessions: t.sessions + r.sessions, joined: t.joined + r.joined, hours: t.hours + r.hours, billed: t.billed + r.billed, ours: t.ours + r.ourShare, payout: t.payout + r.payout }), {
    sessions: 0,
    joined: 0,
    hours: 0,
    billed: 0,
    ours: 0,
    payout: 0,
  });

  return (
    <div className="space-y-8">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">Beast Captains</h1>
        <p className="text-sm text-gray-500 max-w-3xl">
          A Beast Captain is a coach you assign to a community to keep its board alive: open sessions every week that anyone can drop into, with no pressure if they can&apos;t make it. It is a paid service
          outside the subscription. The community pays the hourly rate for the hours held; the captain is paid that rate less Beast Tribe&apos;s share.
        </p>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <Stat label="Captains" value={active.length} hint={`${new Set(active.map((c) => c.communityId)).size} communities`} />
        <Stat label="On the board this week" value={`${onBoard} of ${wanted}`} hint={short.length ? `${short.length} behind` : 'Everyone is on target'} tone={short.length ? 'coral' : 'aqua'} />
        <Stat label={`Billed, ${month.label}`} value={sar(total.billed)} hint={`${total.hours.toFixed(1)} hours held`} tone="orange" />
        <Stat label="Our share" value={sar(total.ours)} hint={`${sar(total.payout)} to captains`} tone="aqua" />
      </section>

      <section className={`${card} p-6 print:hidden`}>
        <h2 className="font-semibold text-gray-900">This week</h2>
        <p className="text-xs text-gray-500">The week runs Sunday to Saturday. Captains who are behind get a reminder in the app on Sunday, Tuesday and Thursday morning.</p>
        <div className="mt-4 divide-y divide-gray-100">
          {active.map((c) => {
            const behind = c.thisWeek < c.target;
            return (
              <details key={`${c.communityId}-${c.userId}`} className="group py-3">
                <summary className="flex flex-wrap items-center gap-3 cursor-pointer list-none">
                  <Avatar name={c.name} src={c.avatarUrl} size={36} />
                  <span className="flex-1 min-w-[160px]">
                    <span className="block text-sm font-semibold text-gray-900">{c.name}</span>
                    <span className="block text-xs text-gray-500">{c.community}</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${behind ? 'bg-[#FCEBEA] text-[#9E3A33]' : 'bg-[#E8F5EE] text-[#25704F]'}`}>
                    {c.thisWeek} of {c.target} this week
                  </span>
                  <span className="text-xs text-gray-500 w-28">Next week: {c.nextWeek}</span>
                  <span className="text-xs text-gray-500 w-28">Last held: {day(c.lastSession)}</span>
                  <span className="text-sm tabular-nums text-gray-900 w-28 text-right">{c.rate === null ? <span className="text-[#9E3A33]">No rate set</span> : `${sar(c.rate)} / hour`}</span>
                  <span className="text-xs text-[#147070] group-open:hidden">Edit</span>
                </summary>
                <form action={updateCaptain.bind(null, c.communityId, c.userId)} className="mt-4 grid sm:grid-cols-5 gap-3 items-end bg-gray-50 rounded-lg p-4">
                  <div>
                    <label className={label}>Sessions a week</label>
                    <input name="weekly_target" type="number" min={1} max={14} defaultValue={c.target} className={input} />
                  </div>
                  <div>
                    <label className={label}>Hourly rate (SAR)</label>
                    <input name="hourly_rate_sar" type="number" min={0} step="1" defaultValue={c.rate ?? ''} className={input} />
                  </div>
                  <div>
                    <label className={label}>Our share %</label>
                    <input name="cut_pct" type="number" min={0} max={100} step="0.5" defaultValue={c.cutPct ?? ''} placeholder={`${cut} (standard)`} className={input} />
                  </div>
                  <div>
                    <label className={label}>Ends on (optional)</label>
                    <input name="ends_on" type="date" defaultValue={c.endsOn ?? ''} className={input} />
                  </div>
                  <SubmitButton pendingLabel="Saving…" className={btnPrimary}>
                    Save
                  </SubmitButton>
                  <div className="sm:col-span-5">
                    <label className={label}>Notes (only you see these)</label>
                    <input name="notes" defaultValue={c.notes ?? ''} maxLength={1000} className={input} placeholder="Days agreed, sports, who to invoice…" />
                  </div>
                </form>
                <form action={endCaptain.bind(null, c.communityId, c.userId)} className="mt-2">
                  <ConfirmButton confirmMessage={`End ${c.name}'s captaincy of ${c.community} today?`} className="text-xs text-[#9E3A33] hover:underline">
                    End this captaincy
                  </ConfirmButton>
                </form>
              </details>
            );
          })}
          {!active.length ? <p className="py-8 text-center text-sm text-gray-400">No captains yet. Assign the first one below.</p> : null}
        </div>
        {ended.length ? (
          <p className="mt-4 text-xs text-gray-400">
            Ended: {ended.map((c) => `${c.name} (${c.community}, until ${day(c.endsOn)})`).join(' · ')}
          </p>
        ) : null}
      </section>

      <section className="grid lg:grid-cols-3 gap-4 items-start print:hidden">
        <form action={assignCaptain} className={`${card} p-6 lg:col-span-2 space-y-4`}>
          <div>
            <h2 className="font-semibold text-gray-900">Assign a captain</h2>
            <p className="text-xs text-gray-500">The coach needs an account in the app first. They join the community, see their week on the Board and get a message straight away.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="cap-community">Community</label>
              <select id="cap-community" name="community_id" required defaultValue={searchParams.community || ''} className={input}>
                <option value="" disabled>
                  Choose…
                </option>
                {(communities || []).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="cap-email">Coach&apos;s email in the app</label>
              <input id="cap-email" name="email" type="email" required className={input} placeholder="coach@example.com" />
            </div>
            <div>
              <label className={label} htmlFor="cap-target">Sessions a week</label>
              <input id="cap-target" name="weekly_target" type="number" min={1} max={14} defaultValue={3} className={input} />
            </div>
            <div>
              <label className={label} htmlFor="cap-rate">Hourly rate the community pays (SAR)</label>
              <input id="cap-rate" name="hourly_rate_sar" type="number" min={0} step="1" required className={input} placeholder="200" />
            </div>
            <div>
              <label className={label} htmlFor="cap-cut">Our share % (leave empty for the standard {cut}%)</label>
              <input id="cap-cut" name="cut_pct" type="number" min={0} max={100} step="0.5" className={input} />
            </div>
            <div>
              <label className={label} htmlFor="cap-start">Starts</label>
              <input id="cap-start" name="starts_on" type="date" defaultValue={todayRiyadh()} className={input} />
            </div>
          </div>
          <div>
            <label className={label} htmlFor="cap-notes">Notes (only you see these)</label>
            <input id="cap-notes" name="notes" maxLength={1000} className={input} placeholder="Days agreed, sports, who to invoice…" />
          </div>
          <SubmitButton pendingLabel="Assigning…" className={btnPrimary}>
            Assign captain
          </SubmitButton>
        </form>

        <form action={saveDefaultCut} className={`${card} p-6 space-y-3`}>
          <h2 className="font-semibold text-gray-900">Our standard share</h2>
          <p className="text-xs text-gray-500">The part of a captain&apos;s hourly rate Beast Tribe keeps, unless a captain has their own.</p>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className={label} htmlFor="def-cut">Share %</label>
              <input id="def-cut" name="cut_pct" type="number" min={0} max={100} step="0.5" defaultValue={cut} className={input} />
            </div>
            <SubmitButton pendingLabel="Saving…" className={btnGhost}>
              Save
            </SubmitButton>
          </div>
          <p className="text-xs text-gray-400">At SAR 200 an hour and {cut}%: the community pays SAR 200, the captain gets {sar(200 * (1 - cut / 100))}, Beast Tribe keeps {sar((200 * cut) / 100)}.</p>
        </form>
      </section>

      <section className={`${card} p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">Statement, {month.label}</h2>
            <p className="text-xs text-gray-500">Sessions held so far this period, by their length (15 minutes to 4 hours each). Cancelled sessions don&apos;t count.</p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Link href={`/captains?m=${month.prev}`} className={btnGhost}>
              Earlier
            </Link>
            {month.ym < todayRiyadh().slice(0, 7) ? (
              <Link href={`/captains?m=${month.next}`} className={btnGhost}>
                Later
              </Link>
            ) : null}
            <PrintButton label="Print statement" />
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th className="py-2 pr-3 font-semibold">Community</th>
                <th className="py-2 pr-3 font-semibold">Captain</th>
                <th className="py-2 pr-3 font-semibold text-right">Sessions</th>
                <th className="py-2 pr-3 font-semibold text-right">People joined</th>
                <th className="py-2 pr-3 font-semibold text-right">Hours</th>
                <th className="py-2 pr-3 font-semibold text-right">Rate</th>
                <th className="py-2 pr-3 font-semibold text-right">Community pays</th>
                <th className="py-2 pr-3 font-semibold text-right">Our share</th>
                <th className="py-2 font-semibold text-right">Captain gets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {worked.map((r) => (
                <tr key={`${r.communityId}-${r.userId}`}>
                  <td className="py-2.5 pr-3 text-gray-900">{r.community}</td>
                  <td className="py-2.5 pr-3 text-gray-900">{r.name}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{r.sessions}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{r.joined}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{r.hours.toFixed(1)}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{r.rate ? sar(r.rate) : <span className="text-[#9E3A33]">Not set</span>}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums font-semibold">{sar(r.billed)}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-[#147070]">
                    {sar(r.ourShare)} <span className="text-xs text-gray-400">({r.cutPct}%)</span>
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{sar(r.payout)}</td>
                </tr>
              ))}
              {!worked.length ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400">
                    No captain sessions were held in {month.label}.
                  </td>
                </tr>
              ) : null}
            </tbody>
            {worked.length ? (
              <tfoot>
                <tr className="border-t border-gray-200 font-semibold text-gray-900">
                  <td className="py-2.5 pr-3" colSpan={2}>
                    Total
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{total.sessions}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{total.joined}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{total.hours.toFixed(1)}</td>
                  <td />
                  <td className="py-2.5 pr-3 text-right tabular-nums">{sar(total.billed)}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-[#147070]">{sar(total.ours)}</td>
                  <td className="py-2.5 text-right tabular-nums">{sar(total.payout)}</td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-400">Billing and payouts are done outside the app: invoice each community its total and pay each captain theirs.</p>
      </section>
    </div>
  );
}
