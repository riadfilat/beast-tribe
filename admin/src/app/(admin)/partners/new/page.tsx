import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { createPartner } from '../actions';
import SubmitButton from '@/components/SubmitButton';
import { Icon } from '@/components/ui/Icon';
import PartnerFields from '../PartnerFields';

export default async function NewPartnerPage() {
  await requireAdmin();
  const db = createAdminClient();
  const { data: communities } = await db.from('communities').select('id, name').eq('is_active', true).order('name');

  return (
    <div className="max-w-2xl">
      <Link href="/partners" className="text-sm text-brand-aqua hover:underline mb-4 inline-flex items-center gap-1">
        <Icon name="back" size="sm" />
        Back to Partners
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Partner</h1>

      <form action={createPartner} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <PartnerFields communities={communities || []} />

        <h3 className="font-semibold text-gray-700 text-sm pt-2">Partner Portal login</h3>
        <p className="text-xs text-gray-500 -mt-3">Required for coaches, gyms and event companies. Leave empty for a restaurant that only has an offer.</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contact name</label>
            <input name="full_name" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Ali Mohammed" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Login email</label>
            <input name="email" type="email" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="coach@gym.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
            <input name="password" type="text" minLength={8} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="min 8 characters" />
          </div>
        </div>

        <SubmitButton
          pendingLabel="Creating…"
          className="w-full py-2.5 bg-brand-orange text-brand-teal font-semibold rounded-lg hover:bg-orange-500 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
        >
          Create Partner
        </SubmitButton>
      </form>
    </div>
  );
}
