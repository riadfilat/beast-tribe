'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FloppyDisk } from '@phosphor-icons/react';
import { assignUserToCommunity } from '@/app/(hq)/hq/communities/admin-actions';

interface Props {
  userId: string;
  current: { id: string; name: string } | null;
  communities: { id: string; name: string }[];
}

/** Choose the person's home community (or none) and save. */
export function CommunityPicker({ userId, current, communities }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState(current?.id || '');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const changed = (selected || null) !== (current?.id || null);

  function save() {
    setMsg(null);
    startTransition(async () => {
      try {
        await assignUserToCommunity(userId, selected || null);
        const name = communities.find((c) => c.id === selected)?.name;
        setMsg({ ok: true, text: name ? `Moved to ${name}.` : 'Removed from their community.' });
        router.refresh();
      } catch (e: any) {
        setMsg({ ok: false, text: `Couldn’t save: ${e?.message || e}` });
      }
    });
  }

  return (
    <div className="grid gap-2">
      <label className="label" htmlFor="home-community" style={{ marginBottom: 0 }}>Home community</label>
      <div className="flex gap-2">
        <select id="home-community" className="input" value={selected} onChange={(e) => setSelected(e.target.value)} disabled={pending}>
          <option value="">No community</option>
          {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="button" className="btn" onClick={save} disabled={pending || !changed}>
          <FloppyDisk size={16} weight="bold" /> {pending ? 'Saving…' : 'Save'}
        </button>
      </div>
      {msg ? <p role="status" className="text-[13px]" style={{ color: msg.ok ? 'var(--good)' : 'var(--bad)' }}>{msg.text}</p> : null}
    </div>
  );
}
