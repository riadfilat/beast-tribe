'use client';

import { useState } from 'react';
import { addCommunityDefaultPack } from './actions';
import { GLYPH_GROUPS, PackPatch, PATCH_COLOR_NAMES } from '@/components/brand/PackPatch';

interface PackOption {
  id: string;
  name: string;
}

const GROUP_LABEL: Record<string, string> = { beasts: 'Beasts of Arabia', myths: 'Myths', marks: 'Marks' };
const NAMES: Record<string, string> = { chevrons: 'Rise', spark: 'Star', shoe: 'Running shoe', lift: 'Lift', hermes: 'Hermes (winged foot)', falcon: 'Falcon', claws: 'Claw marks' };
const label = (id: string) => NAMES[id] ?? id.charAt(0).toUpperCase() + id.slice(1);

interface Props {
  communityId: string;
  availablePacks: PackOption[];
}

export default function AddDefaultPackForm({ communityId, availablePacks }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'existing' | 'new'>('new');
  const [pending, setPending] = useState(false);
  const [glyph, setGlyph] = useState('wolf');
  const [color, setColor] = useState('slate');
  const [name, setName] = useState('');

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
        + Add Default Group
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
          Use existing group
        </button>
      </div>

      <form action={onSubmit} className="space-y-3">
        {mode === 'new' ? (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Riyadh Runners"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none bg-white"
              />
            </div>
            <div className="flex items-end gap-3">
              <PackPatch pack={{ id: 'preview', name: name || 'Group', emblem_kind: 'glyph', emblem_value: glyph, emblem_color: color }} size={52} />
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Patch</label>
                <select
                  name="emblem_value"
                  value={glyph}
                  onChange={(e) => setGlyph(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none"
                >
                  {Object.entries(GLYPH_GROUPS).map(([group, ids]) => (
                    <optgroup key={group} label={GROUP_LABEL[group] ?? group}>
                      {ids.map((id) => (
                        <option key={id} value={id}>
                          {label(id)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Colour</label>
                <select
                  name="emblem_color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none"
                >
                  {Object.entries(PATCH_COLOR_NAMES).map(([id, n]) => (
                    <option key={id} value={id}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
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
              Group <span className="text-red-500">*</span>
            </label>
            {availablePacks.length === 0 ? (
              <p className="text-xs text-gray-400">
                No global groups available. Switch to &ldquo;Create new&rdquo; instead.
              </p>
            ) : (
              <select
                name="pack_id"
                required
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none"
              >
                <option value="" disabled>
                  Select a group…
                </option>
                {availablePacks.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            <p className="text-[11px] text-gray-400 mt-1">
              The group will be moved into this community and marked as default.
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-1.5 bg-brand-orange text-white rounded-lg text-xs font-medium hover:bg-orange-500 transition disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Add Default Group'}
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
