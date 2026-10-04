import Link from 'next/link';
import { requireCap } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { fetchAll } from '@/lib/fetch-all';
import { Icon } from '@/components/ui/Icon';
import { CoachPay, payoutFor, SPORTS, STATUS_LABELS } from '@/lib/workouts';
import { monthRange, sar } from '@/lib/format';
import { withdrawWorkout } from './actions';

export const revalidate = 0;

const sportName = (v: string) => SPORTS.find(([k]) => k === v)?.[1] ?? v;

export default async function MyWorkoutsPage(props: { searchParams: Promise<{ sent?: string }> }) {
  const searchParams = await props.searchParams;
  const partner = await requireCap('workouts');
  const db = createAdminClient();
  const m = monthRange();

  const [{ data: workouts }, month, { count: allMonthUses }, { data: setting }] = await Promise.all([
    db.from('workouts').select('id, title, sport, duration_minutes, status, review_note, community:communities(name), updated_at').eq('author_partner_id', partner.partner_id).order('updated_at', { ascending: false }),
    fetchAll((a, b) =>
      db.from('workout_logs').select('workout_id, user_id').eq('counted', true).eq('coach_partner_id', partner.partner_id)
        .gte('completed_at', m.start.toISOString()).lt('completed_at', m.end.toISOString()).order('id').range(a, b),
    ),
    // All coaches' counted uses this month: the same total the admin's Coach pay page shares the pool by.
    db.from('workout_logs').select('id', { count: 'exact', head: true }).eq('counted', true).not('coach_partner_id', 'is', null).gte('completed_at', m.start.toISOString()).lt('completed_at', m.end.toISOString()),
    db.from('app_settings').select('value').eq('key', 'coach_pay').maybeSingle(),
  ]);
  const pay: CoachPay = { mode: 'rate', rate_sar: 0, pool_sar: 0, ...((setting?.value as any) ?? {}) };
  const uses = month.length;
  const members = new Set(month.map((l: any) => l.user_id)).size;
  const perWorkout = new Map<string, number>();
  month.forEach((l: any) => perWorkout.set(l.workout_id, (perWorkout.get(l.workout_id) ?? 0) + 1));
  // Pool mode shares the pool by everyone's uses this month.
  const totalUses = pay.mode === 'pool' ? allMonthUses ?? uses : uses;
  const earned = payoutFor(uses, Math.max(totalUses, uses), pay);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My workouts</h1>
          <p className="text-sm text-gray-500">Write workouts for the Train tab. You&rsquo;re paid each time a member finishes one.</p>
        </div>
        <Link href="/partner/workouts/new" className="px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:bg-orange-500 transition">
          + New workout
        </Link>
      </div>

      {searchParams.sent ? (
        <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3">
          <Icon name="success" size="sm" />
          Sent for review. Operation Beast checks every workout before it goes live, usually within a day.
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Paid uses · {m.label}</p>
          <p className="text-3xl font-bold text-brand-teal">{uses}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Members who trained with you</p>
          <p className="text-3xl font-bold text-brand-aqua">{members}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Estimated earnings</p>
          <p className="text-3xl font-bold text-brand-orange">{sar(earned, true)}</p>
          <p className="text-xs text-gray-400 mt-1">{pay.mode === 'pool' ? 'Your share of this month’s coach pool' : `${sar(pay.rate_sar, true)} per use`}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Workout</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Who sees it</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
              <th className="text-right px-5 py-3 font-medium text-gray-500">Uses this month</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(workouts || []).map((w: any) => {
              const st = STATUS_LABELS[w.status];
              return (
                <tr key={w.id} className={w.status === 'archived' ? 'opacity-50' : ''}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{w.title}</p>
                    <p className="text-xs text-gray-400">{sportName(w.sport)} · {w.duration_minutes} min</p>
                    {w.status === 'rejected' && w.review_note ? <p className="text-xs text-red-700 mt-1">Requested changes: {w.review_note}</p> : null}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{w.community?.name ? `Only ${w.community.name}` : 'Everyone'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${st?.className ?? ''}`}>{st?.label ?? w.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-800">{perWorkout.get(w.id) ?? 0}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-3">
                      {w.status !== 'archived' ? (
                        <Link href={`/partner/workouts/${w.id}`} className="text-xs text-brand-aqua hover:underline">Edit</Link>
                      ) : null}
                      {w.status !== 'archived' ? (
                        <form action={withdrawWorkout.bind(null, w.id)}>
                          <button className="text-xs text-gray-400 hover:underline">Withdraw</button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!workouts?.length ? <p className="text-sm text-gray-400 text-center py-8">No workouts yet. Write your first one.</p> : null}
      </div>
    </div>
  );
}
