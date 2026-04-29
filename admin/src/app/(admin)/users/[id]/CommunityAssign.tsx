'use client';

import { useState, useTransition } from 'react';
import { assignUserToCommunity } from '../../communities/actions';

interface CommunityOption {
  id: string;
  name: string;
}

interface Props {
  userId: string;
  currentCommunityId: string | null;
  currentCommunityName: string | null;
  communities: CommunityOption[];
}

export default function CommunityAssign({
  userId,
  currentCommunityId,
  currentCommunityName,
  communities,
}: Props) {
  const [selected, setSelected] = useState<string>(currentCommunityId || '');
  const [pending, startTransition] = useTransition();

  const isDirty = (selected || null) !== (currentCommunityId || null);

  function handleSave() {
    startTransition(async () => {
      try {
        await assignUserToCommunity(userId, selected || null);
        // server action revalidates the page
      } catch (e: any) {
        alert(`Error: ${e.message || e}`);
      }
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold text-gray-900">Community</h2>
          <p className="text-xs text-gray-500">
            {currentCommunityName ? (
              <>
                Currently in{' '}
                <span className="font-medium text-brand-orange">
                  🏘 {currentCommunityName}
                </span>
              </>
            ) : (
              'Not in any community'
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={pending}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-aqua focus:border-brand-aqua outline-none disabled:opacity-50"
        >
          <option value="">— None —</option>
          {communities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending || !isDirty}
          className="px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:bg-orange-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </div>
      <p className="text-[11px] text-gray-400 mt-2">
        Assigning to a community auto-joins the user to that community&apos;s default packs.
      </p>
    </div>
  );
}
