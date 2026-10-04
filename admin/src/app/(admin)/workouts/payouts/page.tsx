import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { fetchAll } from '@/lib/fetch-all';
import { Icon } from '@/components/ui/Icon';
import SubmitButton from '@/components/SubmitButton';
import { CoachPay, payoutFor } from '@/lib/workouts';
import { monthRange, sar } from '@/lib/format';
import { saveCoachPay } from '../actions';

export const revalidate = 0;


export default async function CoachPayPage({ searchParams }: { searchParams: { month?: string } }) {
  await requireAdmin();
  const db = createAdminClient();
  const m = monthRange(searchParams.month);

  const [{ data: setting }, logs, { data: partners }] = await Promise.all([
    db.from('app_settings').select('value, updated_at').eq('key', 'coach_pay').maybeSingle(),
    // Every counted use of a coach's workout this month (the coach's own page counts the same set).
    fetchAll((a, b) =>
      db.from('workout_logs').select('coach_partner_id, user_id, workout_id').eq('counted', true).not('coach_partner_id', 'is', null)
        .gte('completed_at', m.start.toISOString()).lt('completed_at', m.end.toISOString()).order('id').range(a, b),
    ),
    db.from('partners').select('id, business_name, name, contact_email').eq('partner_type', 'coach'),
  ]);
  const pay: CoachPay = { mode: 'rate', rate_sar: 0, pool_sar: 0, ...((setting?.value as any) ?? {}) };

  const per = new Map<string, { uses: number; members: Set<string>; workouts: Set<string> }>();
  logs.forEach((l: any) => {
    const r = per.get(l.coach_partner_id) ?? { uses: 0, members: new Set(), workouts: new Set() };
    r.uses += 1;
    r.members.add(l.user_id);
    if (l.workout_id) r.workouts.add(l.workout_id);
    per.set(l.coach_partner_id, r);
  });
  const total = Array.from(per.values()).reduce((a, r) => a + r.uses, 0);
  const rows = Array.from(per.entries())
    .map(([id, r]) => ({ id, partner: (partners || []).find((p: any) => p.id === id), ...r, amount: payoutFor(r.uses, total, pay) }))
    .sort((a, b) => b.uses - a.uses);
  const totalAmount = rows.reduce((a, r) => a + r.amount, 0);

  return (
    <div className="max-w-5xl">
      <Link href="/workouts" className="text-sm text-brand-aqua hover:underline mb-4 inline-flex items-center gap-1">
        <Icon name="back" size="sm" />
        Back to Workouts
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Coach pay</h1>
      <p className="text-sm text-gray-500 mb-6">
        Coaches are paid by use. A use is counted when a member finishes a coach&rsquo;s live workout, trains for at least 40% of its length (5 minutes minimum), and
        hasn&rsquo;t already finished it that day. A coach&rsquo;s own sessions never count. Pay coaches outside the app until payments are switched on.
      </p>

      <form action={saveCoachPay} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">How coaches are paid</label>
          <select name="mode" defaultValue={pay.mode} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="rate">A rate per counted use</option>
            <option value="pool">A monthly pool, shared by uses</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Rate per use (SAR)</label>
          <input name="rate_sar" type="number" min={0} step="0.5" defaultValue={pay.rate_sar} className="w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Monthly pool (SAR)</label>
          <input name="pool_sar" type="number" min={0} step="100" defaultValue={pay.pool_sar} className="w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <SubmitButton pendingLabel="Saving…" className="px-4 py-2 bg-brand-teal text-white text-sm font-medium rounded-lg hover:opacity-90">
          Save
        </SubmitButton>
        {setting?.updated_at ? <p className="text-xs text-gray-400 w-full">Last changed {new Date(setting.updated_at).toLocaleString('en-GB')}</p> : null}
      </form>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">{m.label}</h2>
        <div className="flex gap-3 text-sm">
          <Link href={`/workouts/payouts?month=${m.prev}`} className="text-brand-aqua hover:underline">← Previous</Link>
          <Link href={`/workouts/payouts?month=${m.next}`} className="text-brand-aqua hover:underline">Next →</Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Coach</th>
              <th className="text-right px-5 py-3 font-medium text-gray-500">Counted uses</th>
              <th className="text-right px-5 py-3 font-medium text-gray-500">Members</th>
              <th className="text-right px-5 py-3 font-medium text-gray-500">Workouts used</th>
              <th className="text-right px-5 py-3 font-medium text-gray-500">Owed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-800">{r.partner?.business_name || r.partner?.name || 'Coach'}</p>
                  {r.partner?.contact_email ? <p className="text-xs text-gray-400">{r.partner.contact_email}</p> : null}
                </td>
                <td className="px-5 py-3 text-right text-gray-800">{r.uses}</td>
                <td className="px-5 py-3 text-right text-gray-600">{r.members.size}</td>
                <td className="px-5 py-3 text-right text-gray-600">{r.workouts.size}</td>
                <td className="px-5 py-3 text-right font-medium text-brand-teal">{sar(r.amount, true)}</td>
              </tr>
            ))}
          </tbody>
          {rows.length ? (
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-5 py-3 font-medium text-gray-700">Total</td>
                <td className="px-5 py-3 text-right font-medium text-gray-700">{total}</td>
                <td colSpan={2} />
                <td className="px-5 py-3 text-right font-semibold text-brand-teal">{sar(totalAmount, true)}</td>
              </tr>
            </tfoot>
          ) : null}
        </table>
        {rows.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No counted uses this month.</p> : null}
      </div>
      {pay.mode === 'rate' && pay.rate_sar === 0 ? (
        <p className="text-xs text-gray-500 mt-3">The rate is SAR 0, so nothing is owed yet. Set a rate or switch to a pool above.</p>
      ) : null}
    </div>
  );
}
