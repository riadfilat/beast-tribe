'use client';

import { useState } from 'react';
import { addCommunityDefaultPack } from './actions';

interface PackOption {
  id: string;
  name: string;
  animal: string | null;
}

interface Props {
  communityId: string;
  availablePacks: PackOption[];
}

const ANIMALS = ['Wolf', 'Eagle', 'Tiger', 'Rhino'];

export default function AddDefaultPackForm({ communityId, availablePacks }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'existing' | 'new'>('new');
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    try {
      await addCommunityDefaultPack(communityId, formData);
      setOpen(false);
      setMode('new');
    } catch (e: any) {
      alert(`Error: ${e.message || e}`);
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1.5 bg-brand-orange text-white rounded-lg hover:bg-orange-500 transition"
      >
        + Add Default Pack
      </button>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={() => setMode('new')}
          className={`text-xs px-3 py-1 rounded-full border ${
            mode === 'new'
              ? 'bg-brand-teal text-white border-brand-teal'
              : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          Create new
        </button>
        <button
          type="button"
          onClick={() => setMode('existing')}
          className={`text-xs px-3 py-1 rounded-full border ${
            mode === 'existing'
              ? 'bg-brand-teal text-white border-brand-teal'
              : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          Use existing pack
        </button>
      </div>

      <form action={onSubmit} className="space-y-3">
        {mode === 'new' ? (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Pack Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Riyadh Runners"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Animal</label>
              <select
                name="animal"
                defaultValue="Wolf"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none"
              >
                {ANIMALS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                rows={2}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none resize-none bg-white"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Pack <span className="text-red-500">*</span>
            </label>
            {availablePacks.length === 0 ? (
              <p className="text-xs text-gray-400">
                No global packs available. Switch to &ldquo;Create new&rdquo; instead.
              </p>
            ) : (
              <select
                name="pack_id"
                required
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none"
              >
                <option value="" disabled>
                  Select a pack…
                </option>
                {availablePacks.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.animal ? `(${p.animal})` : ''}
                  </option>
                ))}
              </select>
            )}
            <p className="text-[11px] text-gray-400 mt-1">
              The pack will be moved into this community and marked as default.
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-1.5 bg-brand-orange text-white rounded-lg text-xs font-medium hover:bg-orange-500 transition disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Add Default Pack'}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setMode('new');
            }}
            disabled={pending}
            className="px-4 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
