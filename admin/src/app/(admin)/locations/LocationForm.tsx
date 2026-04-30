'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import SubmitButton from '@/components/SubmitButton';

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

  // File upload state
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setFilePreview(null);
      setFileName('');
      return;
    }
    // Quick client-side validation
    if (file.size > 5 * 1024 * 1024) {
      alert('Image is too large. Max 5MB.');
      e.target.value = '';
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Only JPG, PNG, or WebP images allowed.');
      e.target.value = '';
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => setFilePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function clearFile() {
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFilePreview(null);
    setFileName('');
  }

  // What to show as preview
  const previewSrc = filePreview || location?.image_url || '';

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

      {/* Cover Image — upload OR URL */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium text-gray-700">Cover Image</label>
          <div className="flex gap-1 text-[10px]">
            <button
              type="button"
              onClick={() => setUploadMode('upload')}
              className={`px-2 py-1 rounded transition ${
                uploadMode === 'upload'
                  ? 'bg-brand-aqua text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              📁 Upload
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('url')}
              className={`px-2 py-1 rounded transition ${
                uploadMode === 'url'
                  ? 'bg-brand-aqua text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              🔗 URL
            </button>
          </div>
        </div>

        {uploadMode === 'upload' ? (
          <div>
            {!filePreview && !location?.image_url ? (
              <label className="block w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-aqua hover:bg-gray-50 transition flex flex-col items-center justify-center">
                <span className="text-3xl mb-1">📷</span>
                <span className="text-sm text-gray-600 font-medium">Click to upload image</span>
                <span className="text-xs text-gray-400 mt-1">PNG, JPG, or WebP — max 5MB</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  name="image_file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            ) : (
              <div className="relative">
                <div
                  className="h-40 rounded-lg bg-gray-100 bg-cover bg-center border border-gray-200"
                  style={{ backgroundImage: `url(${previewSrc})` }}
                />
                <div className="mt-2 flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs">📁</span>
                    <span className="text-xs text-gray-600 truncate">
                      {fileName || (location?.image_url ? 'Existing image' : '')}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-none ml-2">
                    <label className="text-xs text-brand-aqua hover:underline cursor-pointer">
                      Change
                      <input
                        ref={fileInputRef}
                        type="file"
                        name="image_file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    {filePreview && (
                      <button
                        type="button"
                        onClick={clearFile}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Hidden field carries the existing image_url unless replaced */}
            <input type="hidden" name="existing_image_url" value={location?.image_url || ''} />
          </div>
        ) : (
          <div>
            <input
              type="url"
              name="image_url"
              defaultValue={location?.image_url || ''}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none"
            />
            {location?.image_url && (
              <div
                className="mt-2 h-32 rounded-lg bg-gray-100 bg-cover bg-center border border-gray-200"
                style={{ backgroundImage: `url(${location.image_url})` }}
              />
            )}
          </div>
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
        <SubmitButton pendingLabel={isEdit ? 'Saving…' : 'Creating…'}>
          {isEdit ? 'Save Changes' : 'Create Location'}
        </SubmitButton>
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
