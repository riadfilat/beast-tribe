import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { updateEvent, deleteEvent } from '../actions';
import { notFound } from 'next/navigation';

export default async function EditEventPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const db = createAdminClient();

  const [eventRes, sportsRes, rsvpsRes] = await Promise.all([
    db.from('events').select('*').eq('id', params.id).single(),
    db.from('sports').select('id, name, emoji').order('name'),
    db.from('event_rsvps')
      .select('*, profile:profiles(full_name, display_name, tier, total_xp)')
      .eq('event_id', params.id)
      .order('created_at', { ascending: false }),
  ]);

  if (!eventRes.data) notFound();
  const event = eventRes.data;
  const sports = sportsRes.data || [];
  const rsvps = rsvpsRes.data || [];

  const updateWithId = updateEvent.bind(null, params.id);
  const deleteWithId = deleteEvent.bind(null, params.id);

  return (
    <div className="max-w-3xl">
      <Link href="/events" className="text-sm text-brand-aqua hover:underline mb-4 inline-block">← Back to Events</Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
        <form action={deleteWithId}>
          <button type="submit" className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
            onClick={(e) => { if (!confirm('Delete this event?')) e.preventDefault(); }}>
            Delete Event
          </button>
        </form>
      </div>

      {/* Edit Form */}
      <form action={updateWithId} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5 mb-8">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
          <input name="title" defaultValue={event.title} required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea name="description" defaultValue={event.description || ''}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none h-20" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Event Type</label>
            <select name="event_type" defaultValue={event.event_type} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="community">Community</option>
              <option value="gym_class">Gym Class</option>
              <option value="competition">Competition</option>
              <option value="workshop">Workshop</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sport</label>
            <select name="sport_id" defaultValue={event.sport_id || ''} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">None</option>
              {sports.map((s: any) => (
                <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start</label>
            <input name="starts_at" type="datetime-local" required
              defaultValue={event.starts_at?.slice(0, 16)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End</label>
            <input name="ends_at" type="datetime-local"
              defaultValue={event.ends_at?.slice(0, 16) || ''}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
            <input name="location_name" defaultValue={event.location_name || ''}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
            <input name="location_city" defaultValue={event.location_city || ''}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
            <select name="country" defaultValue={event.country || 'SA'} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="SA">Saudi Arabia</option>
              <option value="AE">UAE</option>
              <option value="KW">Kuwait</option>
              <option value="BH">Bahrain</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Coach</label>
            <input name="coach_name" defaultValue={event.coach_name || ''}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Gym</label>
            <input name="gym_name" defaultValue={event.gym_name || ''}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Capacity</label>
            <input name="max_capacity" type="number" defaultValue={event.max_capacity || ''}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="is_women_only" id="is_women_only" defaultChecked={event.is_women_only} />
          <label htmlFor="is_women_only" className="text-sm text-gray-600">Women only</label>
        </div>

        <button type="submit" className="w-full py-2.5 bg-brand-orange text-white font-semibold rounded-lg hover:bg-orange-500 transition">
          Save Changes
        </button>
      </form>

      {/* RSVPs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">RSVPs ({rsvps.length})</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {rsvps.map((rsvp: any) => (
            <div key={rsvp.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{rsvp.profile?.display_name || rsvp.profile?.full_name || 'User'}</p>
                <p className="text-xs text-gray-400">{(rsvp.profile?.total_xp || 0).toLocaleString()} XP · {rsvp.profile?.tier}</p>
              </div>
              <span className="text-xs text-gray-400">{new Date(rsvp.created_at).toLocaleDateString()}</span>
            </div>
          ))}
          {rsvps.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">No RSVPs yet</p>}
        </div>
      </div>
    </div>
  );
}
