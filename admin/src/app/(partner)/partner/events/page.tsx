import Link from 'next/link';
import { requirePartner } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';

export default async function PartnerEventsPage() {
  const partner = await requirePartner();
  const db = createAdminClient();

  const { data: events } = await db.from('events')
    .select('*, sport:sports(name, emoji), rsvp_count:event_rsvps(count)')
    .or(`partner_id.eq.${partner.partner_id},coach_name.eq.${partner.business_name},gym_name.eq.${partner.business_name}`)
    .order('starts_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
        <Link href="/partner/events/new" className="px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:bg-orange-500 transition">
          + Create Event
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Event</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Location</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">RSVPs</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(events || []).map((event: any) => {
              const rsvps = event.rsvp_count?.[0]?.count || 0;
              const isPast = new Date(event.starts_at) < new Date();
              return (
                <tr key={event.id} className={`hover:bg-gray-50/50 ${isPast ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{event.sport?.emoji} {event.title}</p>
                    <p className="text-xs text-gray-400">{event.event_type}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {new Date(event.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{event.location_city || '—'}</td>
                  <td className="px-5 py-3">
                    <span className="font-medium text-gray-800">{rsvps}</span>
                    {event.max_capacity && <span className="text-gray-400">/{event.max_capacity}</span>}
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/partner/events/${event.id}`} className="text-brand-aqua text-xs hover:underline">
                      Manage
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!events || events.length === 0) && (
          <p className="text-sm text-gray-400 text-center py-8">No events yet</p>
        )}
      </div>
    </div>
  );
}
