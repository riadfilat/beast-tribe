import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requirePartner } from '@/lib/auth';
import { loadClub, ago, STATUS_LABEL, STATUS_HINT, type MemberStatus } from '@/lib/club';
import { Avatar, StatusChip, card } from '@/components/club/ui';

export const revalidate = 0;

const FILTERS: (MemberStatus | 'all')[] = ['all', 'active', 'new', 'quiet', 'at_risk'];
const SORTS = { last: 'Last active', joined: 'Joined', booked: 'Bookings' } as const;

export default async function MembersPage({ searchParams }: { searchParams: { status?: string; q?: string; sort?: string } }) {
  const partner = await requirePartner();
  if (partner.partner_type !== 'gym') redirect('/partner/dashboard');
  if (!partner.community_id) redirect('/partner/club');
  const club = await loadClub(partner, partner.community_id);
  if (!club) redirect('/partner/club');

  const status = (FILTERS as string[]).includes(searchParams.status || '') ? (searchParams.status as MemberStatus | 'all') : 'all';
  const q = (searchParams.q || '').trim().toLowerCase();
  const sort = (searchParams.sort && searchParams.sort in SORTS ? searchParams.sort : 'last') as keyof typeof SORTS;

  const count = (s: MemberStatus | 'all') => (s === 'all' ? club.members.length : club.members.filter((m) => m.status === s).length);
  const rows = club.members
    .filter((m) => status === 'all' || m.status === status)
    .filter((m) => !q || m.name.toLowerCase().includes(q))
    .sort((a, b) =>
      sort === 'joined'
        ? b.joinedAt.getTime() - a.joinedAt.getTime()
        : sort === 'booked'
          ? b.booked30 - a.booked30
          : (b.lastActive?.getTime() ?? 0) - (a.lastActive?.getTime() ?? 0),
    );
  const href = (patch: Record<string, string>) => {
    const sp = new URLSearchParams({ ...(status !== 'all' ? { status } : {}), ...(q ? { q } : {}), ...(sort !== 'last' ? { sort } : {}), ...patch });
    for (const [k, v] of [...sp.entries()]) if (!v || v === 'all' || (k === 'sort' && v === 'last')) sp.delete(k);
    const s = sp.toString();
    return `/partner/members${s ? `?${s}` : ''}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500">
            Everyone in {club.community.name}. New members join in the app with code{' '}
            <span className="font-mono font-semibold tracking-widest text-brand-teal">{club.community.join_code}</span>.
          </p>
        </div>
        <form className="flex items-center gap-2" action="/partner/members">
          {status !== 'all' ? <input type="hidden" name="status" value={status} /> : null}
          <input name="q" defaultValue={q} placeholder="Search by name" className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-56" />
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const on = f === status;
          return (
            <Link
              key={f}
              href={href({ status: f })}
              title={f === 'all' ? undefined : STATUS_HINT[f]}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${on ? 'bg-brand-teal text-white border-brand-teal' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
            >
              {f === 'all' ? 'Everyone' : STATUS_LABEL[f]} <span className={on ? 'text-white/70' : 'text-gray-400'}>{count(f)}</span>
            </Link>
          );
        })}
      </div>

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="px-5 py-3 font-medium">Member</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">
                <Link href={href({ sort: 'last' })} className={sort === 'last' ? 'text-gray-900' : 'hover:text-gray-700'}>
                  Last active
                </Link>
              </th>
              <th className="px-3 py-3 font-medium">
                <Link href={href({ sort: 'joined' })} className={sort === 'joined' ? 'text-gray-900' : 'hover:text-gray-700'}>
                  Joined
                </Link>
              </th>
              <th className="px-3 py-3 font-medium text-right">
                <Link href={href({ sort: 'booked' })} className={sort === 'booked' ? 'text-gray-900' : 'hover:text-gray-700'}>
                  Booked
                </Link>
              </th>
              <th className="px-3 py-3 font-medium text-right">Came</th>
              <th className="px-5 py-3 font-medium text-right">Posts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} src={m.avatar} />
                    <span className="font-medium text-gray-900">{m.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <StatusChip status={m.status} />
                </td>
                <td className="px-3 py-3 text-gray-600">{ago(m.lastActive)}</td>
                <td className="px-3 py-3 text-gray-600">{m.joinedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td className="px-3 py-3 text-right tabular-nums">{m.booked30 || <span className="text-gray-300">0</span>}</td>
                <td className="px-3 py-3 text-right tabular-nums">{m.attended30 || <span className="text-gray-300">0</span>}</td>
                <td className="px-5 py-3 text-right tabular-nums">{m.posts30 || <span className="text-gray-300">0</span>}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                  {club.members.length ? 'No members match.' : 'No members yet. Share your join code to bring them in.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 max-w-3xl">
        Counts are for the last 30 days. You see club activity only: bookings and check-ins for your classes and sessions, and posts in your club. What members train on their
        own, what they eat and their body measurements stay private to them.
      </p>
    </div>
  );
}
