import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { Icon } from '@/components/ui/Icon';
import { SPORTS, STATUS_LABELS } from '@/lib/workouts';
import { reviewWorkout, setFeatured } from './actions';

export const revalidate = 0;

const TABS: { key: string; label: string }[] = [
  { key: 'pending', label: 'In review' },
  { key: 'published', label: 'Live' },
  { key: 'draft', label: 'Drafts' },
  { key: 'rejected', label: 'Needs changes' },
  { key: 'archived', label: 'Archived' },
];
const sportName = (v: string) => SPORTS.find(([k]) => k === v)?.[1] ?? v;

export default async function WorkoutsPage({ searchParams }: { searchParams: { status?: string } }) {
  await requireAdmin();
  const db = createAdminClient();
  const since = new Date(Date.now() - 30 * 86400000).toISOString();

  const [{ data: all }, { data: logs }] = await Promise.all([
    db
      .from('workouts')
      .select('id, title, title_ar, sport, format, duration_minutes, status, source, featured, community:communities(name), author:partners!workouts_author_partner_id_fkey(business_name, name), updated_at')
      .order('updated_at', { ascending: false }),
    db.from('workout_logs').select('workout_id, counted').gte('completed_at', since).limit(20000),
  ]);

  const counts = new Map<string, { done: number; paid: number }>();
  (logs || []).forEach((l: any) => {
    if (!l.workout_id) return;
    const c = counts.get(l.workout_id) ?? { done: 0, paid: 0 };
    c.done += 1;
    if (l.counted) c.paid += 1;
    counts.set(l.workout_id, c);
  });
  const byStatus = (s: string) => (all || []).filter((w: any) => w.status === s);
  const pending = byStatus('pending').length;
  const status = TABS.some((t) => t.key === searchParams.status) ? searchParams.status! : pending ? 'pending' : 'published';
  const rows = byStatus(status);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workouts</h1>
          <p className="text-sm text-gray-500">The Operation Beast library and coaches&rsquo; workouts in the app&rsquo;s Train tab</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/workouts/payouts" className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <Icon name="payouts" size="sm" className="text-brand-teal" />
            Coach pay
          </Link>
          <Link href="/workouts/new" className="px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:bg-orange-500 transition">
            + New workout
          </Link>
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {TABS.map((t) => {
          const n = byStatus(t.key).length;
          const on = t.key === status;
          return (
            <Link
              key={t.key}
              href={`/workouts?status=${t.key}`}
              className={`px-4 py-2 text-sm -mb-px border-b-2 ${on ? 'border-brand-teal text-brand-teal font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              {t.label}
              {n ? <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${t.key === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500'}`}>{n}</span> : null}
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Workout</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Sport</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">By</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Who sees it</th>
              <th className="text-right px-5 py-3 font-medium text-gray-500">Done (30 days)</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((w: any) => {
              const c = counts.get(w.id);
              const st = STATUS_LABELS[w.status];
              return (
                <tr key={w.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800 flex items-center gap-2">
                      {w.title}
                      {w.featured ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                          <Icon name="star" size="xs" />
                          Today
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-gray-400" dir="rtl">{w.title_ar || '— no Arabic title'}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {sportName(w.sport)} · {w.duration_minutes} min
                  </td>
                  <td className="px-5 py-3 text-gray-600">{w.source === 'coach' ? w.author?.business_name || w.author?.name || 'Coach' : 'Operation Beast'}</td>
                  <td className="px-5 py-3 text-gray-600">{w.community?.name ? `Only ${w.community.name}` : 'Everyone'}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-gray-800 font-medium">{c?.done ?? 0}</span>
                    {w.source === 'coach' ? <span className="block text-xs text-gray-400">{c?.paid ?? 0} paid uses</span> : null}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${st?.className ?? ''}`}>{st?.label ?? w.status}</span>
                      <Link href={`/workouts/${w.id}`} className="text-xs text-brand-aqua hover:underline">
                        {w.status === 'pending' ? 'Review' : 'Edit'}
                      </Link>
                      {w.status === 'published' ? (
                        <form action={setFeatured.bind(null, w.id, !w.featured)}>
                          <button className="text-xs text-gray-500 hover:underline">{w.featured ? 'Unfeature' : 'Make today’s workout'}</button>
                        </form>
                      ) : null}
                      {w.status === 'archived' ? (
                        <form action={reviewWorkout.bind(null, w.id, 'draft')}>
                          <button className="text-xs text-gray-500 hover:underline">Restore to drafts</button>
                        </form>
                      ) : w.status !== 'pending' ? (
                        <form action={reviewWorkout.bind(null, w.id, 'archived')}>
                          <button className="text-xs text-gray-400 hover:underline">Archive</button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">Nothing here.</p> : null}
      </div>
    </div>
  );
}
