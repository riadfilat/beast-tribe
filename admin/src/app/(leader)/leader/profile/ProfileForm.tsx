'use client';

import { useActionState } from 'react';
import { FloppyDisk, Key, Globe } from '@phosphor-icons/react';
import { saveProfile, type ProfileState } from './actions';

export function ProfileForm({ c, canOpen }: { c: { name: string; description: string | null; city: string | null; visibility: string | null }; canOpen: boolean }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, undefined);
  return (
    <form action={action} className="box grid gap-4">
      <div>
        <label className="label" htmlFor="name">Community name</label>
        <input id="name" name="name" required maxLength={60} className="input" defaultValue={c.name} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="city">City</label>
          <input id="city" name="city" maxLength={80} className="input" defaultValue={c.city || ''} placeholder="e.g. Riyadh" />
          <p className="hint mt-1">Members see communities in the city they are in.</p>
        </div>
        <div>
          <label className="label" htmlFor="logo">Logo</label>
          <input id="logo" name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="input py-2 text-[12px]" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="description">About</label>
        <textarea id="description" name="description" rows={3} maxLength={600} className="input" defaultValue={c.description || ''} placeholder="What you do, when, and who it’s for" />
      </div>
      <fieldset className="grid gap-2">
        <legend className="label">Who can join</legend>
        <div className="flex flex-wrap gap-1.5">
          <label className="relative">
            <input type="radio" className="sr" name="visibility" value="private" defaultChecked={c.visibility !== 'open'} />
            <span className="chip"><Key size={15} /> With our code or invite</span>
          </label>
          {canOpen ? (
            <label className="relative">
              <input type="radio" className="sr" name="visibility" value="open" defaultChecked={c.visibility === 'open'} />
              <span className="chip"><Globe size={15} /> Anyone in {c.city || 'our city'}</span>
            </label>
          ) : null}
        </div>
        {!canOpen ? <p className="hint">Company and school communities are always private.</p> : null}
      </fieldset>
      {state?.ok ? <p className="text-[13px]" style={{ color: 'var(--good)' }}>{state.ok}</p> : null}
      {state?.error ? <p role="alert" className="text-[13px]" style={{ color: 'var(--bad)' }}>{state.error}</p> : null}
      <div>
        <button className="btn" disabled={pending}><FloppyDisk size={16} weight="bold" /> {pending ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}
