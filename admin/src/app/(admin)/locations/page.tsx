import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import SearchInput from '@/components/ui/SearchInput';

export const revalidate = 0;

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: { q?: string; country?: string; status?: string };
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

  const { data: locations } = await query;

  // Distinct countries for filter chips
  const countries = Array.from(
    new Set((locations || []).map((l: any) => l.country).filter(Boolean))
  );

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
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <SearchInput
          placeholder="Search by name, city, description..."
          defaultValue={searchParams.q || ''}
          className="w-72"
        />

        {/* Country filter */}
        <div className="flex gap-1.5">
          <Link
            href={`/locations?${new URLSearchParams({ ...(searchParams.q ? { q: searchParams.q } : {}), ...(searchParams.status ? { status: searchParams.status } : {}) }).toString()}`}
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
              href={`/locations?${new URLSearchParams({ country: c, ...(searchParams.q ? { q: searchParams.q } : {}), ...(searchParams.status ? { status: searchParams.status } : {}) }).toString()}`}
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
            href={`/locations?${new URLSearchParams({ ...(searchParams.q ? { q: searchParams.q } : {}), ...(searchParams.country ? { country: searchParams.country } : {}) }).toString()}`}
            className={`px-3 py-1.5 text-xs rounded-full border ${
              !searchParams.status
                ? 'bg-gray-700 text-white border-gray-700'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            All
          </Link>
          <Link
            href={`/locations?${new URLSearchParams({ status: 'active', ...(searchParams.q ? { q: searchParams.q } : {}), ...(searchParams.country ? { country: searchParams.country } : {}) }).toString()}`}
            className={`px-3 py-1.5 text-xs rounded-full border ${
              searchParams.status === 'active'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Active
          </Link>
          <Link
            href={`/locations?${new URLSearchParams({ status: 'inactive', ...(searchParams.q ? { q: searchParams.q } : {}), ...(searchParams.country ? { country: searchParams.country } : {}) }).toString()}`}
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

      {/* Grid of cards */}
      {(!locations || locations.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-100 px-5 py-16 text-center text-gray-400 text-sm">
          No locations found. Add the first one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc: any) => (
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
          ))}
        </div>
      )}
    </div>
  );
}
