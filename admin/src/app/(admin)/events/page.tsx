import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import SearchInput from '@/components/ui/SearchInput';

export const revalidate = 0;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; upcoming?: string };
}) {
  await requireAdmin();
  const db = createAdminClient();

  const page = parseInt(searchParams.page || '1');
  const perPage = 20;
  const offset = (page - 1) * perPage;

  let query = db
    .from('events')
    .select('*, sport:sports(name, emoji), rsvp_count:event_rsvps(count)', { count: 'exact' })
    .order('starts_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  if (searchParams.q) {
    query = query.or(
      `title.ilike.%${searchParams.q}%,coach_name.ilike.%${searchParams.q}%,gym_name.ilike.%${searchParams.q}%`
    );
  }
  if (searchParams.upcoming === '1') {
    query = query.gte('starts_at', new Date().toISOString());
  }

  const { data: events, count } = await query;
  const totalPages = Math.ceil((count || 0) / perPage);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500">{(count || 0).toLocaleString()} events</p>
        </div>
        <Link
          href="/events/new"
          className="px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:bg-orange-500 transition"
        >
          + Create Event
        </Link>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <SearchInput placeholder="Search events, coaches, venues..." defaultValue={searchParams.q || ''} className="w-72" />
        <Link
          href={searchParams.upcoming === '1' ? '/events' : '/events?upcoming=1'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
            searchParams.upcoming === '1'
              ? 'bg-brand-teal text-white border-brand-teal'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Upcoming only
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Event</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Sport</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Location</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">RSVPs</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Country</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(events || []).map((event: any) => {
              const rsvps = event.rsvp_count?.[0]?.count || 0;
              const isPast = new Date(event.starts_at) < new Date();
              const isFull =
                event.max_capacity && rsvps >= event.max_capacity;
              return (
                <tr
                  key={event.id}
                  className={`hover:bg-gray-50/60 transition group ${isPast ? 'opacity-50' : ''}`}
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800 group-hover:text-brand-teal transition">
                      {event.title}
                    </p>
                    {event.coach_name && (
                      <p className="text-xs text-gray-400">{event.coach_name}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {event.sport ? `${event.sport.emoji} ${event.sport.name}` : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-600 tabular-nums text-xs">
                    {new Date(event.starts_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {event.location_city || event.gym_name || '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`font-medium ${isFull ? 'text-red-600' : 'text-gray-800'}`}>
                      {rsvps}
                    </span>
                    {event.max_capacity && (
                      <span className="text-gray-400">/{event.max_capacity}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{event.country || '—'}</td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/events/${event.id}`}
                      className="text-brand-aqua text-xs font-medium hover:underline"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(!events || events.length === 0) && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">
                  No events found
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
              href={`/events?page=${page - 1}&q=${searchParams.q || ''}&upcoming=${searchParams.upcoming || ''}`}
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
              href={`/events?page=${page + 1}&q=${searchParams.q || ''}&upcoming=${searchParams.upcoming || ''}`}
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
