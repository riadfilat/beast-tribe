import Link from 'next/link';
import { requirePartner } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { updatePartnerEvent } from '../actions';
import SubmitButton from '@/components/SubmitButton';
import { notFound } from 'next/navigation';

export default async function PartnerEventDetailPage({ params }: { params: { id: string } }) {
  const partner = await requirePartner();
  const db = createAdminClient();

  const { data: event } = await db.from('events')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!event) notFound();

  // Get RSVPs with user details
  const { data: rsvps } = await db.from('event_rsvps')
    .select('*, profile:profiles(full_name, display_name, tier, total_xp, region)')
    .eq('event_id', params.id)
    .order('created_at', { ascending: false });

  const updateWithId = updatePartnerEvent.bind(null, params.id);
  const isPast = new Date(event.starts_at) < new Date();

  return (
    <div className="max-w-3xl">
      <Link href="/partner/events" className="text-sm text-brand-aqua hover:underline mb-4 inline-block">← Back</Link>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
        {isPast && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Past</span>}
      </div>

      {/* Edit Form */}
      <form action={updateWithId} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
            <input name="title" defaultValue={event.title} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select name="event_type" defaultValue={event.event_type} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="community">Community</option>
              <option value="gym_class">Gym Class</option>
              <option value="competition">Competition</option>
              <option value="workshop">Workshop</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start</label>
            <input name="starts_at" type="datetime-local" defaultValue={event.starts_at?.slice(0, 16)} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Capacity</label>
            <input name="max_capacity" type="number" defaultValue={event.max_capacity || ''} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
            <input name="location_name" defaultValue={event.location_name || ''} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
            <input name="location_city" defaultValue={event.location_city || ''} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
        </div>

        <SubmitButton
          pendingLabel="Saving…"
          className="px-6 py-2 bg-brand-orange text-white font-medium rounded-lg text-sm hover:bg-orange-500 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center"
        >
          Save Changes
        </SubmitButton>
      </form>

      {/* Attendees */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Attendees ({(rsvps || []).length})</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {(rsvps || []).map((rsvp: any) => (
            <div key={rsvp.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {rsvp.profile?.display_name || rsvp.profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-400">
                  {rsvp.profile?.tier} · {(rsvp.profile?.total_xp || 0).toLocaleString()} XP · {rsvp.profile?.region || 'SA'}
                </p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                rsvp.status === 'going' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {rsvp.status}
              </span>
            </div>
          ))}
          {(!rsvps || rsvps.length === 0) && (
            <p className="px-5 py-6 text-sm text-gray-400 text-center">No attendees yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
