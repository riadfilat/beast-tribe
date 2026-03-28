import { requirePartner } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function updateProfile(formData: FormData) {
  'use server';
  const partner = await requirePartner();
  const db = createAdminClient();

  const updates: Record<string, any> = {};
  ['business_name', 'description', 'contact_email', 'contact_phone', 'website_url', 'city', 'country'].forEach((field) => {
    const v = formData.get(field);
    if (v !== null) updates[field] = v || null;
  });
  updates.updated_at = new Date().toISOString();

  await db.from('partners').update(updates).eq('id', partner.partner_id);
  revalidatePath('/partner/profile');
  redirect('/partner/profile');
}

export default async function PartnerProfilePage() {
  const partner = await requirePartner();
  const db = createAdminClient();

  const { data: partnerData } = await db.from('partners')
    .select('*')
    .eq('id', partner.partner_id)
    .single();

  if (!partnerData) return null;

  const TYPE_LABELS: Record<string, string> = {
    coach: '🏋️ Coach',
    gym: '🏢 Gym',
    event_company: '🎪 Event Company',
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Partner Profile</h1>
      <p className="text-sm text-gray-500 mb-6">
        {TYPE_LABELS[partnerData.partner_type]} · {partnerData.is_verified ? '✅ Verified' : '⏳ Pending verification'}
      </p>

      <form action={updateProfile} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Business Name</label>
          <input name="business_name" defaultValue={partnerData.business_name} required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea name="description" defaultValue={partnerData.description || ''}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none h-24" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contact Email</label>
            <input name="contact_email" type="email" defaultValue={partnerData.contact_email || ''}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
            <input name="contact_phone" defaultValue={partnerData.contact_phone || ''}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
          <input name="website_url" type="url" defaultValue={partnerData.website_url || ''}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="https://" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
            <input name="city" defaultValue={partnerData.city || ''}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
            <select name="country" defaultValue={partnerData.country || 'SA'}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="SA">Saudi Arabia</option>
              <option value="AE">UAE</option>
              <option value="KW">Kuwait</option>
              <option value="BH">Bahrain</option>
            </select>
          </div>
        </div>

        <button type="submit" className="w-full py-2.5 bg-brand-orange text-white font-semibold rounded-lg hover:bg-orange-500 transition">
          Save Changes
        </button>
      </form>
    </div>
  );
}
