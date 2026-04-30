import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createPartner } from '../actions';
import SubmitButton from '@/components/SubmitButton';

export default async function NewPartnerPage() {
  await requireAdmin();

  return (
    <div className="max-w-2xl">
      <Link href="/partners" className="text-sm text-brand-aqua hover:underline mb-4 inline-block">← Back to Partners</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Partner</h1>

      <form action={createPartner} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-2">
          <p className="text-xs text-blue-700">This will create a new user account for the partner and grant them access to the Partner Portal.</p>
        </div>

        <h3 className="font-semibold text-gray-700 text-sm">Login Credentials</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input name="email" type="email" required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="coach@gym.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
            <input name="password" type="text" required minLength={8}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="min 8 characters" />
          </div>
        </div>

        <h3 className="font-semibold text-gray-700 text-sm pt-2">Partner Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contact Name</label>
            <input name="full_name" required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Ali Mohammed" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Partner Type</label>
            <select name="partner_type" required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="coach">Coach</option>
              <option value="gym">Gym</option>
              <option value="event_company">Event Company</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Business Name</label>
          <input name="business_name" required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Leejam Fitness" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea name="description"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none h-20" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contact Email</label>
            <input name="contact_email" type="email"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
            <input name="contact_phone"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="+966..." />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
            <input name="city" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Riyadh" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
            <select name="country" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="SA">Saudi Arabia</option>
              <option value="AE">UAE</option>
              <option value="KW">Kuwait</option>
              <option value="BH">Bahrain</option>
            </select>
          </div>
        </div>

        <SubmitButton
          pendingLabel="Creating account…"
          className="w-full py-2.5 bg-brand-orange text-white font-semibold rounded-lg hover:bg-orange-500 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
        >
          Create Partner Account
        </SubmitButton>
      </form>
    </div>
  );
}
