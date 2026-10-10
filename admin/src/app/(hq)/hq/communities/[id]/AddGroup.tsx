'use client';

import { useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { GLYPH_GROUPS, PackPatch, PATCH_COLOR_NAMES } from '@/components/brand/PackPatch';
import { addCommunityDefaultPack } from '../admin-actions';

// Adds a group every new member joins: a new one with its patch, or an existing group moved in.

const FAMILY: Record<string, string> = { beasts: 'Beasts of Arabia', myths: 'Myths', marks: 'Marks' };
const NAMES: Record<string, string> = { chevrons: 'Rise', spark: 'Star', shoe: 'Running shoe', lift: 'Lift', hermes: 'Hermes (winged foot)', falcon: 'Falcon', claws: 'Claw marks' };
const glyphName = (id: string) => NAMES[id] ?? id.charAt(0).toUpperCase() + id.slice(1);

export function AddGroup({ communityId, existing }: { communityId: string; existing: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [glyph, setGlyph] = useState('wolf');
  const [color, setColor] = useState('slate');
  const [name, setName] = useState('');

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      await addCommunityDefaultPack(communityId, formData);
      setOpen(false);
      setMode('new');
      setName('');
    } catch (e: any) {
      setError(e?.message || 'Could not add the group.');
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return <div><button type="button" className="btn ghost small" onClick={() => setOpen(true)}><Plus size={14} weight="bold" /> Add a group</button></div>;
  }

  return (
    <div className="well p-4 grid gap-3">
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className={`chip ${mode === 'new' ? 'on' : ''}`} aria-pressed={mode === 'new'} onClick={() => setMode('new')}>Make a new group</button>
        <button type="button" className={`chip ${mode === 'existing' ? 'on' : ''}`} aria-pressed={mode === 'existing'} onClick={() => setMode('existing')}>Use a group that exists</button>
      </div>
      <form action={submit} className="grid gap-3">
        {mode === 'new' ? (
          <>
            <div><label className="label" htmlFor="g-name">Group name</label><input id="g-name" name="name" required className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Riyadh Runners" /></div>
            <div className="grid grid-cols-[auto_1fr_1fr] gap-3 items-end">
              <PackPatch pack={{ id: 'preview', name: name || 'Group', emblem_kind: 'glyph', emblem_value: glyph, emblem_color: color }} size={48} />
              <div>
                <label className="label" htmlFor="g-glyph">Patch</label>
                <select id="g-glyph" name="emblem_value" className="input" value={glyph} onChange={(e) => setGlyph(e.target.value)}>
                  {Object.entries(GLYPH_GROUPS).map(([family, ids]) => (
                    <optgroup key={family} label={FAMILY[family] ?? family}>
                      {(ids as string[]).map((id) => <option key={id} value={id}>{glyphName(id)}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="g-color">Colour</label>
                <select id="g-color" name="emblem_color" className="input" value={color} onChange={(e) => setColor(e.target.value)}>
                  {Object.entries(PATCH_COLOR_NAMES).map(([id, n]) => <option key={id} value={id}>{n}</option>)}
                </select>
              </div>
            </div>
            <div><label className="label" htmlFor="g-desc">Description (optional)</label><textarea id="g-desc" name="description" rows={2} className="input" /></div>
          </>
        ) : existing.length ? (
          <div>
            <label className="label" htmlFor="g-pick">Group</label>
            <select id="g-pick" name="pack_id" required className="input" defaultValue="">
              <option value="" disabled>Pick a group…</option>
              {existing.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <p className="hint mt-1">It moves into this community and new members join it.</p>
          </div>
        ) : (
          <p className="hint">There are no groups outside a community to use. Make a new one instead.</p>
        )}
        {error ? <p role="alert" className="text-[13px]" style={{ color: 'var(--bad)' }}>{error}</p> : null}
        <div className="flex gap-2">
          <button className="btn small" disabled={pending}>{pending ? 'Saving…' : 'Add group'}</button>
          <button type="button" className="btn ghost small" disabled={pending} onClick={() => { setOpen(false); setMode('new'); setError(null); }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
