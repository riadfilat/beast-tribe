import Link from 'next/link';

interface Location {
  id?: string;
  name?: string;
  city?: string;
  country?: string;
  description?: string;
  image_url?: string;
  address?: string;
  sports?: string[];
  sort_order?: number;
  is_active?: boolean;
  community_id?: string | null;
}

interface CommunityOption {
  id: string;
  name: string;
}

interface LocationFormProps {
  action: (formData: FormData) => Promise<void>;
  location?: Location;
  communities?: CommunityOption[];
}

const COMMON_SPORTS = [
  'running', 'gym', 'crossfit', 'yoga', 'cycling', 'swimming', 'football',
  'walking', 'padel', 'tennis', 'hiit', 'boxing', 'volleyball', 'basketball', 'hyrox',
];

export default function LocationForm({ action, location, communities = [] }: LocationFormProps) {
  const isEdit = !!location?.id;
  const sportsValue = (location?.sports || []).join(', ');

  return (
    <form action={action} className="space-y-5 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Location Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          required
          defaultValue={location?.name || ''}
          placeholder="e.g. Wadi Hanifah Path, King Fahd Park, Leejam Olaya"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none"
        />
      </div>

      {/* City + Country */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="city"
            required
            defaultValue={location?.city || ''}
            placeholder="Riyadh, Jeddah, Dubai..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Country</label>
          <select
            name="country"
            defaultValue={location?.country || 'SA'}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none bg-white"
          >
            <option value="SA">Saudi Arabia (SA)</option>
            <option value="AE">UAE (AE)</option>
            <option value="KW">Kuwait (KW)</option>
            <option value="BH">Bahrain (BH)</option>
            <option value="QA">Qatar (QA)</option>
            <option value="OM">Oman (OM)</option>
            <option value="EG">Egypt (EG)</option>
            <option value="JO">Jordan (JO)</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={location?.description || ''}
          placeholder="One-line tagline shown to users — e.g. 8km scenic trail along the valley"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none resize-none"
        />
      </div>

      {/* Image URL */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Cover Image URL</label>
        <input
          type="url"
          name="image_url"
          defaultValue={location?.image_url || ''}
          placeholder="https://images.unsplash.com/..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none"
        />
        {location?.image_url && (
          <div className="mt-2 h-32 rounded-lg bg-gray-100 bg-cover bg-center border border-gray-200" style={{ backgroundImage: `url(${location.image_url})` }} />
        )}
      </div>

      {/* Address */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Address (optional)</label>
        <input
          type="text"
          name="address"
          defaultValue={location?.address || ''}
          placeholder="Street, district, postal code"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none"
        />
      </div>

      {/* Sports */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Supported Sports
        </label>
        <input
          type="text"
          name="sports"
          defaultValue={sportsValue}
          placeholder="running, cycling, yoga"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none"
        />
        <p className="text-[11px] text-gray-400 mt-1">
          Comma-separated. Common: {COMMON_SPORTS.join(', ')}
        </p>
      </div>

      {/* Sort order + Active */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Sort Order</label>
          <input
            type="number"
            name="sort_order"
            defaultValue={location?.sort_order ?? 0}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none"
          />
          <p className="text-[11px] text-gray-400 mt-1">Lower numbers appear first</p>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer mb-1">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={location?.is_active !== false}
              className="w-4 h-4 rounded border-gray-300 text-brand-aqua focus:ring-brand-aqua"
            />
            <span className="text-sm text-gray-700">Visible to users</span>
          </label>
        </div>
      </div>

      {/* Community Scope */}
      <div className="pt-2 border-t border-gray-100">
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Community Scope
        </label>
        <select
          name="community_id"
          defaultValue={location?.community_id || ''}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none bg-white"
        >
          <option value="">🌍 Global (visible to all users)</option>
          {communities.map((c) => (
            <option key={c.id} value={c.id}>
              🏘 {c.name}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-gray-400 mt-1">
          Global locations are visible to everyone. Community-scoped locations only show to members of that community.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-3 border-t border-gray-100">
        <button
          type="submit"
          className="px-5 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:bg-orange-500 transition"
        >
          {isEdit ? 'Save Changes' : 'Create Location'}
        </button>
        <Link
          href="/locations"
          className="px-5 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
