import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import SearchInput from '@/components/ui/SearchInput';
import TierBadge from '@/components/ui/TierBadge';

export const revalidate = 0;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { q?: string; tier?: string; region?: string; page?: string };
}) {
  await requireAdmin();
  const db = createAdminClient();

  const page = parseInt(searchParams.page || '1');
  const perPage = 25;
  const offset = (page - 1) * perPage;

  let query = db
    .from('profiles')
    .select(
      'id, full_name, display_name, tier, total_xp, level, region, current_streak, is_premium, created_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  if (searchParams.q) {
    query = query.or(
      `full_name.ilike.%${searchParams.q}%,display_name.ilike.%${searchParams.q}%`
    );
  }
  if (searchParams.tier && searchParams.tier !== 'all') {
    query = query.eq('tier', searchParams.tier);
  }
  if (searchParams.region && searchParams.region !== 'all') {
    query = query.eq('region', searchParams.region);
  }

  const { data: users, count } = await query;
  const totalPages = Math.ceil((count || 0) / perPage);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">{(count || 0).toLocaleString()} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <SearchInput
          placeholder="Search by name..."
          defaultValue={searchParams.q || ''}
          className="w-64"
        />
        <form className="contents">
          <input type="hidden" name="q" value={searchParams.q || ''} />
          <select
            name="tier"
            defaultValue={searchParams.tier || 'all'}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua outline-none"
          >
            <option value="all">All tiers</option>
            <option value="raw">Raw</option>
            <option value="forged">Forged</option>
            <option value="untamed">Untamed</option>
          </select>
          <select
            name="region"
            defaultValue={searchParams.region || 'all'}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua outline-none"
          >
            <option value="all">All regions</option>
            <option value="SA">Saudi Arabia</option>
            <option value="AE">UAE</option>
            <option value="KW">Kuwait</option>
            <option value="BH">Bahrain</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-brand-teal text-white rounded-lg text-sm hover:bg-brand-teal/90 transition"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Tier</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">XP</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Lvl</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Streak</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Region</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Joined</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(users || []).map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50/60 transition group">
                <td className="px-5 py-3">
                  <div>
                    <p className="font-medium text-gray-800 group-hover:text-brand-teal transition">
                      {user.display_name || user.full_name}
                    </p>
                    {user.is_premium && (
                      <span className="text-xs text-brand-orange font-medium">★ Premium</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <TierBadge tier={user.tier} />
                </td>
                <td className="px-5 py-3 text-gray-600 tabular-nums">
                  {(user.total_xp || 0).toLocaleString()}
                </td>
                <td className="px-5 py-3 text-gray-600">{user.level}</td>
                <td className="px-5 py-3 text-gray-600">
                  {user.current_streak > 0 ? (
                    <span className="text-brand-orange font-medium">{user.current_streak}🔥</span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-5 py-3 text-gray-500 text-xs">{user.region || '—'}</td>
                <td className="px-5 py-3 text-gray-400 text-xs tabular-nums">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/users/${user.id}`}
                    className="text-brand-aqua text-xs font-medium hover:underline"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
            {(!users || users.length === 0) && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-gray-400 text-sm">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {page > 1 && (
            <Link
              href={`/users?page=${page - 1}&q=${searchParams.q || ''}&tier=${searchParams.tier || ''}&region=${searchParams.region || ''}`}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              ← Prev
            </Link>
          )}
          <span className="px-3 py-1.5 text-sm text-gray-500 font-medium">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/users?page=${page + 1}&q=${searchParams.q || ''}&tier=${searchParams.tier || ''}&region=${searchParams.region || ''}`}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
