import Link from 'next/link';
import { requirePartner } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { createPartnerEvent } from '../actions';
import SubmitButton from '@/components/SubmitButton';

export default async function NewPartnerEventPage() {
  const partner = await requirePartner();
  const db = createAdminClient();

  const { data: sports } = await db.from('sports').select('id, name, emoji').order('name');

  return (
    <div className="max-w-2xl">
      <Link href="/partner/events" className="text-sm text-brand-aqua hover:underline mb-4 inline-block">← Back</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Event</h1>

      <form action={createPartnerEvent} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
          <input name="title" required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea name="description" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none h-20" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Event Type</label>
            <select name="event_type" required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="community">Community</option>
              <option value="gym_class">Gym Class</option>
              <option value="competition">Competition</option>
              <option value="workshop">Workshop</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sport</label>
            <select name="sport_id" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">None</option>
              {(sports || []).map((s: any) => (
                <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start</label>
            <input name="starts_at" type="datetime-local" required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End</label>
            <input name="ends_at" type="datetime-local" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
            <input name="location_name" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
            <input name="location_city" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
            <select name="country" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="SA">Saudi Arabia</option>
              <option value="AE">UAE</option>
              <option value="KW">Kuwait</option>
              <option value="BH">Bahrain</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Capacity</label>
            <input name="max_capacity" type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
        </div>

        {/* Show coach/gym name only if partner type doesn't auto-fill */}
        {partner.partner_type !== 'coach' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Coach Name</label>
            <input name="coach_name" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
        )}
        {partner.partner_type !== 'gym' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Gym / Venue</label>
            <input name="gym_name" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
        )}

        {partner.partner_type === 'coach' && (
          <p className="text-xs text-gray-400">Coach name will be auto-filled as &quot;{partner.business_name}&quot;</p>
        )}
        {partner.partner_type === 'gym' && (
          <p className="text-xs text-gray-400">Gym name will be auto-filled as &quot;{partner.business_name}&quot;</p>
        )}

        <div className="flex items-center gap-2">
          <input type="checkbox" name="is_women_only" id="is_women_only" />
          <label htmlFor="is_women_only" className="text-sm text-gray-600">Women only</label>
        </div>

        <SubmitButton
          pendingLabel="Creating…"
          className="w-full py-2.5 bg-brand-orange text-white font-semibold rounded-lg hover:bg-orange-500 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
        >
          Create Event
        </SubmitButton>
      </form>
    </div>
  );
}
