'use client';

import { useState } from 'react';
import SubmitButton from '@/components/SubmitButton';
import { Icon } from '@/components/ui/Icon';
import { EditorBlock, EQUIPMENT, FORMATS, LEVELS, SPORTS, emptyBlock, emptyItem, toEditorBlocks } from '@/lib/workouts';

const input = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-aqua/40';
const label = 'block text-xs font-medium text-gray-600 mb-1';

/**
 * Write a workout the way a coach writes it on the board: blocks (warm-up, the main piece,
 * cool-down), each with a format and its movements. Arabic fields are optional; the app falls
 * back to English for anything left empty.
 */
export default function WorkoutEditor({
  action,
  initial,
  communities,
  communityLabel = 'Who sees it',
  submitLabel,
  pendingLabel = 'Saving…',
  admin,
}: {
  action: (fd: FormData) => Promise<void>;
  initial?: any;
  communities: { id: string; name: string }[];
  communityLabel?: string;
  submitLabel: string;
  pendingLabel?: string;
  /** The admin also sets the status. */
  admin?: boolean;
}) {
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => toEditorBlocks(initial?.blocks));
  const equipment: string[] = initial?.equipment ?? [];

  const setBlock = (i: number, patch: Partial<EditorBlock>) => setBlocks((bs) => bs.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const setItem = (i: number, k: number, patch: Record<string, string>) =>
    setBlocks((bs) => bs.map((b, j) => (j === i ? { ...b, items: b.items.map((it, m) => (m === k ? { ...it, ...patch } : it)) } : b)));
  const move = <T,>(list: T[], from: number, to: number) => {
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    return next;
  };

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="blocks" value={JSON.stringify(blocks)} />

      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Title</label>
            <input name="title" required maxLength={80} defaultValue={initial?.title ?? ''} className={input} placeholder="Engine 20" />
          </div>
          <div>
            <label className={label}>Title in Arabic</label>
            <input name="title_ar" dir="rtl" maxLength={80} defaultValue={initial?.title_ar ?? ''} className={input} placeholder="محرك 20" />
          </div>
          <div>
            <label className={label}>Description</label>
            <textarea name="description" rows={3} maxLength={600} defaultValue={initial?.description ?? ''} className={input} placeholder="What it is and how to pace it" />
          </div>
          <div>
            <label className={label}>Description in Arabic</label>
            <textarea name="description_ar" dir="rtl" rows={3} maxLength={600} defaultValue={initial?.description_ar ?? ''} className={input} />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className={label}>Sport</label>
            <select name="sport" required defaultValue={initial?.sport ?? ''} className={input}>
              <option value="" disabled>Choose…</option>
              {SPORTS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Level</label>
            <select name="difficulty" required defaultValue={initial?.difficulty ?? 'intermediate'} className={input}>
              {LEVELS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Length (minutes)</label>
            <input name="duration_minutes" type="number" min={5} max={240} required defaultValue={initial?.duration_minutes ?? 30} className={input} />
          </div>
          <div>
            <label className={label}>{communityLabel}</label>
            <select name="community_id" defaultValue={initial?.community_id ?? ''} className={input}>
              <option value="">Everyone</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>Only {c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={label}>Equipment (leave empty for none)</label>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT.map(([v, l]) => (
              <label key={v} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 cursor-pointer has-[:checked]:bg-brand-teal has-[:checked]:text-white">
                <input type="checkbox" name="equipment" value={v} defaultChecked={equipment.includes(v)} className="sr-only" />
                {l}
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Photo link (https, optional)</label>
            <input name="image_url" type="url" defaultValue={initial?.image_url ?? ''} className={input} placeholder="https://…" />
            <p className="text-xs text-gray-400 mt-1">People training, fully clothed, no brand logos. Shown under a teal wash.</p>
          </div>
          {admin ? (
            <div>
              <label className={label}>Status</label>
              <select name="status" defaultValue={initial?.status ?? 'draft'} className={input}>
                <option value="draft">Draft (hidden)</option>
                <option value="published">Live in the app</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          ) : null}
        </div>
      </section>

      {blocks.map((b, i) => (
        <section key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Block {i + 1}</h3>
            <div className="flex items-center gap-1 text-gray-400">
              <button type="button" onClick={() => setBlocks((bs) => move(bs, i, i - 1))} className="p-1.5 hover:text-brand-teal" title="Move up"><Icon name="up" size="sm" label="Move up" /></button>
              <button type="button" onClick={() => setBlocks((bs) => move(bs, i, i + 1))} className="p-1.5 hover:text-brand-teal" title="Move down"><Icon name="down" size="sm" label="Move down" /></button>
              {blocks.length > 1 ? (
                <button type="button" onClick={() => setBlocks((bs) => bs.filter((_, j) => j !== i))} className="p-1.5 hover:text-red-600" title="Remove block"><Icon name="close" size="sm" label="Remove block" /></button>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2">
              <label className={label}>Name</label>
              <input value={b.title} onChange={(e) => setBlock(i, { title: e.target.value })} className={input} placeholder="Warm-up" required />
            </div>
            <div>
              <label className={label}>Name in Arabic</label>
              <input value={b.title_ar} dir="rtl" onChange={(e) => setBlock(i, { title_ar: e.target.value })} className={input} placeholder="إحماء" />
            </div>
            <div>
              <label className={label}>Minutes</label>
              <input value={b.minutes} type="number" min={1} max={180} onChange={(e) => setBlock(i, { minutes: e.target.value })} className={input} />
            </div>
            <div>
              <label className={label}>Rounds</label>
              <input value={b.rounds} type="number" min={1} max={50} onChange={(e) => setBlock(i, { rounds: e.target.value })} className={input} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={label}>Format</label>
              <select value={b.format} onChange={(e) => setBlock(i, { format: e.target.value })} className={input}>
                <option value="">None</option>
                {FORMATS.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Note</label>
              <input value={b.note} onChange={(e) => setBlock(i, { note: e.target.value })} className={input} placeholder="Rest 60 s between rounds." />
            </div>
            <div>
              <label className={label}>Note in Arabic</label>
              <input value={b.note_ar} dir="rtl" onChange={(e) => setBlock(i, { note_ar: e.target.value })} className={input} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500">
              <span className="col-span-2">Reps / time</span>
              <span className="col-span-3">Movement</span>
              <span className="col-span-3">Movement in Arabic</span>
              <span className="col-span-2">Reps in Arabic</span>
              <span className="col-span-2" />
            </div>
            {b.items.map((it, k) => (
              <div key={k} className="grid grid-cols-12 gap-2 items-center">
                <input value={it.reps} onChange={(e) => setItem(i, k, { reps: e.target.value })} className={`${input} col-span-2`} placeholder="15 · 400 m · 30 s" />
                <input value={it.name} onChange={(e) => setItem(i, k, { name: e.target.value })} className={`${input} col-span-3`} placeholder="Kettlebell swings" />
                <input value={it.name_ar} dir="rtl" onChange={(e) => setItem(i, k, { name_ar: e.target.value })} className={`${input} col-span-3`} placeholder="أرجحة الكيتل بل" />
                <input value={it.reps_ar} dir="rtl" onChange={(e) => setItem(i, k, { reps_ar: e.target.value })} className={`${input} col-span-2`} placeholder="400 م · 30 ث" />
                <div className="col-span-2 flex items-center gap-1 text-gray-400">
                  <button type="button" onClick={() => setBlock(i, { items: move(b.items, k, k - 1) })} className="p-1 hover:text-brand-teal"><Icon name="up" size="xs" label="Move up" /></button>
                  <button type="button" onClick={() => setBlock(i, { items: move(b.items, k, k + 1) })} className="p-1 hover:text-brand-teal"><Icon name="down" size="xs" label="Move down" /></button>
                  {b.items.length > 1 ? (
                    <button type="button" onClick={() => setBlock(i, { items: b.items.filter((_, m) => m !== k) })} className="p-1 hover:text-red-600"><Icon name="close" size="xs" label="Remove movement" /></button>
                  ) : null}
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setBlock(i, { items: [...b.items, emptyItem()] })} className="text-sm text-brand-aqua hover:underline">
              + Add movement
            </button>
          </div>
        </section>
      ))}

      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setBlocks((bs) => [...bs, emptyBlock()])} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50">
          + Add block
        </button>
        <SubmitButton pendingLabel={pendingLabel} className="px-6 py-2.5 bg-brand-orange text-brand-teal font-semibold rounded-lg hover:bg-orange-500 transition disabled:opacity-60">
          {submitLabel}
        </SubmitButton>
      </div>
      <p className="text-xs text-gray-400">
        Timed steps (&ldquo;3 min&rdquo;, &ldquo;90 s&rdquo;, &ldquo;30 ث&rdquo;) let the app guide each step with a countdown in Intervals and Flow blocks.
      </p>
    </form>
  );
}
