'use client';

import { useState } from 'react';
import { ImageSquare } from '@phosphor-icons/react';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** The place's photo: upload one (or paste a link), see it before saving, or remove it. */
export function PhotoField({ current }: { current: string | null }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const shown = preview || (removed ? null : current);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setProblem(null);
    setPreview(null);
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return reject(e, 'That photo is too big. The limit is 5 MB.');
    if (!TYPES.includes(file.type)) return reject(e, 'Photos must be JPG, PNG or WebP.');
    setRemoved(false);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function reject(e: React.ChangeEvent<HTMLInputElement>, msg: string) {
    e.target.value = '';
    setProblem(msg);
  }

  return (
    <div className="grid gap-2">
      <span className="label">Photo</span>
      <div className="grid sm:grid-cols-[180px_1fr] gap-3 items-start">
        <div className="well aspect-[4/3] overflow-hidden grid place-items-center" style={{ color: 'var(--ink-faint)' }}>
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageSquare size={36} aria-hidden />
          )}
        </div>
        <div className="grid gap-2">
          <input aria-label="Upload a photo" name="image_file" type="file" accept={TYPES.join(',')} onChange={pick} className="input py-2 text-[12px]" />
          <p className="hint">JPG, PNG or WebP, up to 5 MB. A wide photo of the place itself works best.</p>
          {problem ? <p role="alert" className="text-[13px]" style={{ color: 'var(--bad)' }}>{problem}</p> : null}
          {current ? (
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" name="remove_photo" checked={removed} onChange={(e) => setRemoved(e.target.checked)} /> Remove the photo
            </label>
          ) : null}
          <details>
            <summary className="hint cursor-pointer">Or paste a link to a photo</summary>
            <input name="image_url" type="url" className="input mt-2" placeholder="https://" aria-label="Photo link" />
          </details>
        </div>
      </div>
      <input type="hidden" name="existing_image_url" value={current || ''} />
    </div>
  );
}
