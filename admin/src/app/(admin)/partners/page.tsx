import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { togglePartnerVerification, togglePartnerActive } from './actions';

export const revalidate = 0;

const TYPE_LABELS: Record<string, string> = {
  coach: '🏋️ Coach',
  gym: '🏢 Gym',
  event_company: '🎪 Event Company',
};

export default async function PartnersPage() {
  await requireAdmin();
  const db = createAdminClient();

  const { data: partners } = await db.from('partners')
    .select('*, profile:profiles!user_id(full_name, email:id)')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partners</h1>
          <p className="text-sm text-gray-500">Coaches, gyms, and event companies</p>
        </div>
        <Link href="/partners/new" className="px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:bg-orange-500 transition">
          + Add Partner
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Business</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Type</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Contact</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Location</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(partners || []).map((partner: any) => {
              const verifyAction = togglePartnerVerification.bind(null, partner.id, !partner.is_verified);
              const activeAction = togglePartnerActive.bind(null, partner.id, !partner.is_active);

              return (
                <tr key={partner.id} className={`hover:bg-gray-50/50 ${!partner.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{partner.business_name}</p>
                    <p className="text-xs text-gray-400">{partner.profile?.full_name}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{TYPE_LABELS[partner.partner_type] || partner.partner_type}</td>
                  <td className="px-5 py-3">
                    <p className="text-gray-600 text-xs">{partner.contact_email}</p>
                    {partner.contact_phone && <p className="text-gray-400 text-xs">{partner.contact_phone}</p>}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{[partner.city, partner.country].filter(Boolean).join(', ')}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      {partner.is_verified ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Verified</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Unverified</span>
                      )}
                      {!partner.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Inactive</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <form action={verifyAction}>
                        <button type="submit" className="text-xs text-brand-aqua hover:underline">
                          {partner.is_verified ? 'Unverify' : 'Verify'}
                        </button>
                      </form>
                      <form action={activeAction}>
                        <button type="submit" className="text-xs text-gray-500 hover:underline">
                          {partner.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </form>
                      <Link href={`/partners/${partner.id}`} className="text-xs text-brand-aqua hover:underline">
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {(!partners || partners.length === 0) && (
          <p className="text-sm text-gray-400 text-center py-8">No partners yet</p>
        )}
      </div>
    </div>
  );
}
