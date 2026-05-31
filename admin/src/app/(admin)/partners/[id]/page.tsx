import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { updatePartner } from '../actions';
import SubmitButton from '@/components/SubmitButton';

export const revalidate = 0;

export default async function EditPartnerPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const db = createAdminClient();

  const { data: partner } = await db
    .from('partners')
    .select('*, profile:profiles!user_id(full_name)')
    .eq('id', params.id)
    .single();

  if (!partner) notFound();

  const updateWithId = updatePartner.bind(null, params.id);

  return (
    <div className="max-w-2xl">
      <Link href="/partners" className="text-sm text-brand-aqua hover:underline mb-4 inline-block">← Back to Partners</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit Partner</h1>
      {partner.profile?.full_name && (
        <p className="text-sm text-gray-500 mb-6">Owner: {partner.profile.full_name}</p>
      )}

      <form action={updateWithId} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Business Name</label>
          <input
            name="business_name"
            defaultValue={partner.business_name || ''}
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
          <select
            name="partner_type"
            defaultValue={partner.partner_type || 'coach'}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="gym">Gym</option>
            <option value="coach">Coach</option>
            <option value="event_organizer">Event Organizer</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Contact Email</label>
          <input
            type="email"
            name="contact_email"
            defaultValue={partner.contact_email || ''}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
          <input
            type="url"
            name="website_url"
            defaultValue={partner.website_url || ''}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
          <input
            name="city"
            defaultValue={partner.city || ''}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea
            name="description"
            defaultValue={partner.description || ''}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none h-24"
          />
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_verified"
              name="is_verified"
              defaultChecked={partner.is_verified !== false}
            />
            <label htmlFor="is_verified" className="text-sm text-gray-600">Verified</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              defaultChecked={partner.is_active !== false}
            />
            <label htmlFor="is_active" className="text-sm text-gray-600">Active</label>
          </div>
        </div>

        <SubmitButton
          pendingLabel="Saving…"
          className="w-full py-2.5 bg-brand-orange text-white font-semibold rounded-lg hover:bg-orange-500 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
        >
          Save Changes
        </SubmitButton>
      </form>
    </div>
  );
}
