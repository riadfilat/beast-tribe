import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import SearchInput from '@/components/ui/SearchInput';

export const revalidate = 0;

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: { q?: string; country?: string; status?: string; community?: string };
}) {
  await requireAdmin();
  const db = createAdminClient();

  let query = db
    .from('popular_locations')
    .select('*')
    .order('country', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (searchParams.q) {
    query = query.or(
      `name.ilike.%${searchParams.q}%,city.ilike.%${searchParams.q}%,description.ilike.%${searchParams.q}%`
    );
  }
  if (searchParams.country) {
    query = query.eq('country', searchParams.country);
  }
  if (searchParams.status === 'active') {
    query = query.eq('is_active', true);
  } else if (searchParams.status === 'inactive') {
    query = query.eq('is_active', false);
  }
  if (searchParams.community === 'global') {
    query = query.is('community_id', null);
  } else if (searchParams.community) {
    query = query.eq('community_id', searchParams.community);
  }

  const [{ data: locations }, { data: allCommunities }] = await Promise.all([
    query,
    db
      .from('communities')
      .select('id, name')
      .order('name', { ascending: true }),
  ]);

  const communitiesById: Record<string, { id: string; name: string }> = {};
  for (const c of allCommunities || []) {
    communitiesById[c.id] = c;
  }

  const countries = Array.from(
    new Set((locations || []).map((l: any) => l.country).filter(Boolean))
  );

  function buildHref(overrides: Partial<typeof searchParams>): string {
    const next: Record<string, string> = {};
    if (searchParams.q) next.q = searchParams.q;
    if (searchParams.country) next.country = searchParams.country;
    if (searchParams.status) next.status = searchParams.status;
    if (searchParams.community) next.community = searchParams.community;
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined || v === null || v === '') delete next[k];
      else next[k] = v as string;
    }
    const qs = new URLSearchParams(next).toString();
    return `/locations${qs ? `?${qs}` : ''}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Popular Locations</h1>
          <p className="text-sm text-gray-500">
            Pre-selected spots the community can pick when creating activities ·{' '}
            {(locations || []).length.toLocaleString()} total
          </p>
        </div>
        <Link
          href="/locations/new"
          className="px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:bg-orange-500 transition"
        >
          + Add Location
        </Link>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <SearchInput
          placeholder="Search by name, city, description..."
          defaultValue={searchParams.q || ''}
          className="w-72"
        />

        {/* Country filter */}
        <div className="flex gap-1.5">
          <Link
            href={buildHref({ country: '' })}
            className={`px-3 py-1.5 text-xs rounded-full border ${
              !searchParams.country
                ? 'bg-brand-teal text-white border-brand-teal'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            All
          </Link>
          {countries.map((c) => (
            <Link
              key={c}
              href={buildHref({ country: c as string })}
              className={`px-3 py-1.5 text-xs rounded-full border ${
                searchParams.country === c
                  ? 'bg-brand-teal text-white border-brand-teal'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {c}
            </Link>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1.5">
          <Link
            href={buildHref({ status: '' })}
            className={`px-3 py-1.5 text-xs rounded-full border ${
              !searchParams.status
                ? 'bg-gray-700 text-white border-gray-700'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            All
          </Link>
          <Link
            href={buildHref({ status: 'active' })}
            className={`px-3 py-1.5 text-xs rounded-full border ${
              searchParams.status === 'active'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Active
          </Link>
          <Link
            href={buildHref({ status: 'inactive' })}
            className={`px-3 py-1.5 text-xs rounded-full border ${
              searchParams.status === 'inactive'
                ? 'bg-gray-500 text-white border-gray-500'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Inactive
          </Link>
        </div>
      </div>

      {/* Community filter chips */}
      {(allCommunities || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6 items-center">
          <span className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold mr-1">
            Scope:
          </span>
          <Link
            href={buildHref({ community: '' })}
            className={`px-3 py-1.5 text-xs rounded-full border ${
              !searchParams.community
                ? 'bg-brand-orange text-white border-brand-orange'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            All
          </Link>
          <Link
            href={buildHref({ community: 'global' })}
            className={`px-3 py-1.5 text-xs rounded-full border ${
              searchParams.community === 'global'
                ? 'bg-brand-orange text-white border-brand-orange'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            🌍 Global only
          </Link>
          {(allCommunities || []).map((c: any) => (
            <Link
              key={c.id}
              href={buildHref({ community: c.id })}
              className={`px-3 py-1.5 text-xs rounded-full border ${
                searchParams.community === c.id
                  ? 'bg-brand-orange text-white border-brand-orange'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              🏘 {c.name}
            </Link>
          ))}
        </div>
      )}

      {/* Grid of cards */}
      {!locations || locations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 px-5 py-16 text-center text-gray-400 text-sm">
          No locations found. Add the first one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc: any) => {
            const community = loc.community_id ? communitiesById[loc.community_id] : null;
            return (
              <Link
                key={loc.id}
                href={`/locations/${loc.id}`}
                className={`group bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-brand-aqua transition ${
                  !loc.is_active ? 'opacity-60' : ''
                }`}
              >
                {loc.image_url ? (
                  <div
                    className="h-32 bg-gray-100 bg-cover bg-center"
                    style={{ backgroundImage: `url(${loc.image_url})` }}
                  />
                ) : (
                  <div className="h-32 bg-gradient-to-br from-brand-teal to-brand-aqua flex items-center justify-center text-3xl">
                    📍
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800 group-hover:text-brand-aqua transition leading-tight">
                      {loc.name}
                    </h3>
                    {!loc.is_active && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded font-medium uppercase flex-none">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {loc.city} · {loc.country}
                  </p>
                  {community && (
                    <span className="inline-block text-[10px] px-1.5 py-0.5 bg-brand-orange/10 text-brand-orange rounded font-medium mb-2">
                      🏘 {community.name}
                    </span>
                  )}
                  {loc.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-3">{loc.description}</p>
                  )}
                  {Array.isArray(loc.sports) && loc.sports.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {loc.sports.slice(0, 4).map((sport: string) => (
                        <span
                          key={sport}
                          className="text-[10px] px-1.5 py-0.5 bg-brand-aqua/10 text-brand-aqua rounded font-medium"
                        >
                          {sport}
                        </span>
                      ))}
                      {loc.sports.length > 4 && (
                        <span className="text-[10px] text-gray-400 px-1">
                          +{loc.sports.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
