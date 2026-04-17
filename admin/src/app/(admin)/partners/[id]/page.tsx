import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { updatePartner } from '../actions';

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

  const social = (partner.social_links || {}) as Record<string, string>;
  const metadata = (partner.metadata || {}) as Record<string, any>;

  // Map schema to task form. Actual schema: name, type, status, email, website_url, address, city, social_links(jsonb).
  const displayName = partner.name || partner.business_name || '';
  const isActive = partner.status
    ? partner.status === 'active'
    : partner.is_active !== false;

  return (
    <div className="max-w-2xl">
      <Link href="/partners" className="text-sm text-brand-aqua hover:underline mb-4 inline-block">← Back to Partners</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit Partner</h1>
      {partner.profile?.full_name && (
        <p className="text-sm text-gray-500 mb-6">Owner: {partner.profile.full_name}</p>
      )}

      <form action={updateWithId} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Display Name</label>
          <input
            name="display_name"
            defaultValue={displayName}
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select
              name="type"
              defaultValue={partner.type || partner.partner_type || 'coach'}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="gym">Gym</option>
              <option value="coach">Coach</option>
              <option value="event_organizer">Event Organizer</option>
              <option value="event_company">Event Company</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tier</label>
            <select
              name="tier"
              defaultValue={metadata.tier || 'basic'}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="featured">Featured</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Contact Email</label>
          <input
            type="email"
            name="contact_email"
            defaultValue={partner.email || partner.contact_email || ''}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp</label>
            <input
              name="whatsapp"
              defaultValue={social.whatsapp || ''}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="+966..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Instagram</label>
            <input
              name="instagram"
              defaultValue={social.instagram || ''}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="@handle"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">TikTok</label>
            <input
              name="tiktok"
              defaultValue={social.tiktok || ''}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="@handle"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
            <input
              type="url"
              name="website"
              defaultValue={partner.website_url || ''}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="https://..."
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
          <input
            name="address"
            defaultValue={partner.address || ''}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
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

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            defaultChecked={isActive}
          />
          <label htmlFor="is_active" className="text-sm text-gray-600">Active</label>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-brand-orange text-white font-semibold rounded-lg hover:bg-orange-500 transition"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
