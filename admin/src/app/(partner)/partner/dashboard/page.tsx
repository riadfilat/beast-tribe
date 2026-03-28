import { requirePartner } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import Link from 'next/link';

export default async function PartnerDashboardPage() {
  const partner = await requirePartner();
  const db = createAdminClient();

  // Get partner's events with RSVP counts
  const { data: events, count: eventCount } = await db.from('events')
    .select('*, rsvp_count:event_rsvps(count)', { count: 'exact' })
    .or(`partner_id.eq.${partner.partner_id},coach_name.eq.${partner.business_name},gym_name.eq.${partner.business_name}`)
    .order('starts_at', { ascending: false })
    .limit(5);

  const totalRsvps = (events || []).reduce((sum: number, e: any) => sum + (e.rsvp_count?.[0]?.count || 0), 0);
  const upcomingEvents = (events || []).filter((e: any) => new Date(e.starts_at) > new Date());

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {partner.business_name}</h1>
        <p className="text-sm text-gray-500">
          {partner.is_verified ? '✅ Verified partner' : '⏳ Verification pending'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Events</p>
          <p className="text-3xl font-bold text-brand-teal">{eventCount || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total RSVPs</p>
          <p className="text-3xl font-bold text-brand-orange">{totalRsvps}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Upcoming</p>
          <p className="text-3xl font-bold text-brand-aqua">{upcomingEvents.length}</p>
        </div>
      </div>

      {/* Recent Events */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Your Events</h2>
        <Link href="/partner/events/new" className="text-sm text-brand-orange hover:underline">
          + Create Event
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {(events || []).map((event: any) => {
          const rsvps = event.rsvp_count?.[0]?.count || 0;
          const isPast = new Date(event.starts_at) < new Date();
          return (
            <Link key={event.id} href={`/partner/events/${event.id}`}
              className={`block px-5 py-4 hover:bg-gray-50/50 transition ${isPast ? 'opacity-50' : ''}`}>
              <div className="flex justify-between">
                <div>
                  <p className="font-medium text-gray-800">{event.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(event.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {event.location_city ? ` · ${event.location_city}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-brand-teal">{rsvps} RSVPs</p>
                  {event.max_capacity && <p className="text-xs text-gray-400">of {event.max_capacity}</p>}
                </div>
              </div>
            </Link>
          );
        })}
        {(!events || events.length === 0) && (
          <p className="px-5 py-6 text-sm text-gray-400 text-center">No events yet. Create your first one!</p>
        )}
      </div>
    </div>
  );
}
