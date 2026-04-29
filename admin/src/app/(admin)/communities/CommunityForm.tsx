'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Community {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  country?: string | null;
  city?: string | null;
  is_active?: boolean;
}

interface CommunityFormProps {
  action: (formData: FormData) => Promise<void>;
  community?: Community;
}

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CommunityForm({ action, community }: CommunityFormProps) {
  const isEdit = !!community?.id;
  const [name, setName] = useState(community?.name || '');
  const [slug, setSlug] = useState(community?.slug || '');
  const [slugTouched, setSlugTouched] = useState(!!community?.slug);
  const [logoUrl, setLogoUrl] = useState(community?.logo_url || '');
  const [coverUrl, setCoverUrl] = useState(community?.cover_url || '');

  function handleNameBlur() {
    if (!slugTouched && name) {
      setSlug(slugify(name));
    }
  }

  return (
    <form
      action={action}
      className="space-y-5 bg-white rounded-xl border border-gray-100 shadow-sm p-6"
    >
      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Community Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
          placeholder="e.g. Riyadh Tribe, Jeddah Beasts"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Slug <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          placeholder="riyadh-tribe"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none"
        />
        <p className="text-[11px] text-gray-400 mt-1">
          URL-safe identifier. Auto-generated from name; override if needed.
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={community?.description || ''}
          placeholder="Short tagline shown to community members"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none resize-none"
        />
      </div>

      {/* Logo URL */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Logo URL</label>
        <input
          type="url"
          name="logo_url"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none"
        />
        {logoUrl && (
          <div className="mt-2 flex items-center gap-3">
            <div
              className="w-16 h-16 rounded-lg bg-gray-100 bg-cover bg-center border border-gray-200"
              style={{ backgroundImage: `url(${logoUrl})` }}
            />
            <span className="text-[11px] text-gray-400">Logo preview</span>
          </div>
        )}
      </div>

      {/* Cover URL */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Cover Image URL</label>
        <input
          type="url"
          name="cover_url"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none"
        />
        {coverUrl && (
          <div
            className="mt-2 h-32 rounded-lg bg-gray-100 bg-cover bg-center border border-gray-200"
            style={{ backgroundImage: `url(${coverUrl})` }}
          />
        )}
      </div>

      {/* City + Country */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">City</label>
          <input
            type="text"
            name="city"
            defaultValue={community?.city || ''}
            placeholder="Riyadh, Jeddah, Dubai..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Country</label>
          <select
            name="country"
            defaultValue={community?.country || 'SA'}
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

      {/* Active */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={community?.is_active !== false}
            className="w-4 h-4 rounded border-gray-300 text-brand-aqua focus:ring-brand-aqua"
          />
          <span className="text-sm text-gray-700">Active (visible to users)</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-3 border-t border-gray-100">
        <button
          type="submit"
          className="px-5 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:bg-orange-500 transition"
        >
          {isEdit ? 'Save Changes' : 'Create Community'}
        </button>
        <Link
          href="/communities"
          className="px-5 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
