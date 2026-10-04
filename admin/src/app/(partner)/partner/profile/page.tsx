import { requirePartner } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import SubmitButton from '@/components/SubmitButton';
import { Icon } from '@/components/ui/Icon';
import { email, httpsUrl, phone, text } from '@/lib/validate';

async function updateProfile(formData: FormData) {
  'use server';
  const partner = await requirePartner();
  const db = createAdminClient();

  // Only fields the form sent; each checked and capped (the app opens website_url, so https only).
  const updates: Record<string, any> = {};
  const has = (k: string) => formData.get(k) !== null;
  if (has('business_name')) {
    const name = text(formData.get('business_name'), 120);
    if (!name || name.length < 2) throw new Error('Add your business name');
    updates.business_name = name;
  }
  if (has('description')) updates.description = text(formData.get('description'), 1000);
  if (has('contact_email')) updates.contact_email = email(formData.get('contact_email'));
  if (has('contact_phone')) updates.contact_phone = phone(formData.get('contact_phone'));
  if (has('website_url')) updates.website_url = httpsUrl(formData.get('website_url'));
  if (has('city')) updates.city = text(formData.get('city'), 80);
  if (has('country')) updates.country = text(formData.get('country'), 2)?.toUpperCase() ?? null;
  updates.updated_at = new Date().toISOString();

  const { error } = await db.from('partners').update(updates).eq('id', partner.partner_id);
  if (error) throw new Error(error.message);

  // admin_audit_log has no actor-type column: the "partner." prefix marks a partner's own change.
  await db.from('admin_audit_log').insert({
    admin_user_id: partner.id,
    action: 'partner.update_profile',
    target_table: 'partners',
    target_id: partner.partner_id,
    details: { actor: 'partner', partner_id: partner.partner_id },
  });

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

  const TYPE_LABELS: Record<string, { label: string; icon: 'coach' | 'gym' | 'eventCompany' }> = {
    coach: { label: 'Coach', icon: 'coach' },
    gym: { label: 'Gym', icon: 'gym' },
    event_company: { label: 'Event Company', icon: 'eventCompany' },
    company: { label: 'Company', icon: 'gym' },
    school: { label: 'School', icon: 'gym' },
    venue: { label: 'Courts and venues', icon: 'gym' },
    leader: { label: 'Club leader', icon: 'coach' },
    nutritionist: { label: 'Nutritionist', icon: 'coach' },
  };
  const type = TYPE_LABELS[partnerData.partner_type];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Partner Profile</h1>
      <p className="text-sm text-gray-500 mb-6 flex items-center gap-1.5 flex-wrap">
        {type ? (
          <>
            <Icon name={type.icon} size="sm" className="text-brand-teal" />
            {type.label} ·
          </>
        ) : null}
        <Icon name={partnerData.is_verified ? 'success' : 'pending'} size="sm" className={partnerData.is_verified ? 'text-brand-aqua' : 'text-gray-400'} />
        {partnerData.is_verified ? 'Verified' : 'Pending verification'}
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
