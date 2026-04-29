import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';

export const revalidate = 0;

interface CommunityRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  country: string | null;
  city: string | null;
  is_active: boolean;
}

export default async function CommunitiesPage() {
  await requireAdmin();
  const db = createAdminClient();

  const { data: communities } = await db
    .from('communities')
    .select('*')
    .order('country', { ascending: true })
    .order('name', { ascending: true });

  const list = (communities || []) as CommunityRow[];
  const ids = list.map((c) => c.id);

  // Pull aggregate counts in parallel
  const [memberRows, locationRows, defaultPackRows] = await Promise.all([
    ids.length
      ? db.from('profiles').select('community_id').in('community_id', ids)
      : Promise.resolve({ data: [] as { community_id: string | null }[] }),
    ids.length
      ? db.from('popular_locations').select('community_id').in('community_id', ids)
      : Promise.resolve({ data: [] as { community_id: string | null }[] }),
    ids.length
      ? db
          .from('packs')
          .select('community_id, is_community_default')
          .in('community_id', ids)
          .eq('is_community_default', true)
      : Promise.resolve({ data: [] as { community_id: string | null }[] }),
  ]);

  function countBy(rows: { community_id: string | null }[] | null | undefined): Record<string, number> {
    const map: Record<string, number> = {};
    for (const r of rows || []) {
      if (!r.community_id) continue;
      map[r.community_id] = (map[r.community_id] || 0) + 1;
    }
    return map;
  }
  const memberCounts = countBy((memberRows.data as any) || []);
  const locationCounts = countBy((locationRows.data as any) || []);
  const defaultPackCounts = countBy((defaultPackRows.data as any) || []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
          <p className="text-sm text-gray-500">
            Forced-membership tribes (default packs auto-joined) ·{' '}
            {list.length.toLocaleString()} total
          </p>
        </div>
        <Link
          href="/communities/new"
          className="px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:bg-orange-500 transition"
        >
          + New Community
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 px-5 py-16 text-center text-gray-400 text-sm">
          No communities yet. Create the first one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((c) => (
            <Link
              key={c.id}
              href={`/communities/${c.id}`}
              className={`group bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-brand-aqua transition ${
                !c.is_active ? 'opacity-60' : ''
              }`}
            >
              {c.cover_url ? (
                <div
                  className="h-24 bg-gray-100 bg-cover bg-center"
                  style={{ backgroundImage: `url(${c.cover_url})` }}
                />
              ) : (
                <div className="h-24 bg-gradient-to-br from-brand-teal to-brand-aqua" />
              )}
              <div className="p-4">
                <div className="flex items-start gap-3 mb-2">
                  {c.logo_url ? (
                    <div
                      className="w-10 h-10 rounded-lg bg-white border border-gray-200 bg-cover bg-center flex-none -mt-8 shadow-sm"
                      style={{ backgroundImage: `url(${c.logo_url})` }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-brand-orange/10 text-brand-orange flex items-center justify-center flex-none -mt-8 shadow-sm border border-gray-200 text-base">
                      🏘
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800 group-hover:text-brand-aqua transition leading-tight truncate">
                        {c.name}
                      </h3>
                      {!c.is_active && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded font-medium uppercase flex-none">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {[c.city, c.country].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                </div>

                {c.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-3">{c.description}</p>
                )}

                <div className="flex items-center gap-3 text-[11px] text-gray-500 pt-2 border-t border-gray-50">
                  <span>
                    <span className="font-semibold text-gray-700">
                      {(memberCounts[c.id] || 0).toLocaleString()}
                    </span>{' '}
                    members
                  </span>
                  <span>
                    <span className="font-semibold text-gray-700">
                      {defaultPackCounts[c.id] || 0}
                    </span>{' '}
                    default packs
                  </span>
                  <span>
                    <span className="font-semibold text-gray-700">
                      {locationCounts[c.id] || 0}
                    </span>{' '}
                    locations
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
