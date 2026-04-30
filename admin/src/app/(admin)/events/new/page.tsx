import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { createEvent } from '../actions';
import Link from 'next/link';
import SubmitButton from '@/components/SubmitButton';

export default async function NewEventPage() {
  await requireAdmin();
  const db = createAdminClient();

  const { data: sports } = await db.from('sports').select('id, name, emoji').order('name');

  return (
    <div className="max-w-2xl">
      <Link href="/events" className="text-sm text-brand-aqua hover:underline mb-4 inline-block">← Back to Events</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Event</h1>

      <form action={createEvent} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <Field label="Title" name="title" required />
        <Field label="Description" name="description" type="textarea" />

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
          <Field label="Start Date/Time" name="starts_at" type="datetime-local" required />
          <Field label="End Date/Time" name="ends_at" type="datetime-local" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Location Name" name="location_name" placeholder="King Fahd Park" />
          <Field label="City" name="location_city" placeholder="Riyadh" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
            <select name="country" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="SA">Saudi Arabia</option>
              <option value="AE">UAE</option>
              <option value="KW">Kuwait</option>
              <option value="BH">Bahrain</option>
              <option value="QA">Qatar</option>
              <option value="OM">Oman</option>
            </select>
          </div>
          <Field label="Max Capacity" name="max_capacity" type="number" placeholder="50" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Coach Name" name="coach_name" placeholder="Coach Ali" />
          <Field label="Gym Name" name="gym_name" placeholder="Leejam Fitness" />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="is_women_only" id="is_women_only" className="rounded" />
          <label htmlFor="is_women_only" className="text-sm text-gray-600">Women only event</label>
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

function Field({ label, name, type = 'text', required = false, placeholder = '' }: {
  label: string; name: string; type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea
          name={name}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none h-20 focus:ring-2 focus:ring-brand-aqua outline-none"
        />
      ) : (
        <input
          type={type}
          name={name}
          required={required}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua outline-none"
        />
      )}
    </div>
  );
}
