'use client';

import { useActionState } from 'react';
import { setAdmin, type AdminState } from './actions';

export function AdminForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(setAdmin, undefined);
  return (
    <form action={action} className="grid gap-3">
      <div className="grid sm:grid-cols-[2fr_1fr_auto] gap-2 items-end">
        <div><label className="label" htmlFor="email">Email of their Beast Tribe account</label><input id="email" name="email" type="email" required className="input" /></div>
        <div>
          <label className="label" htmlFor="role">Role</label>
          <select id="role" name="role" className="input" defaultValue="admin">
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
          </select>
        </div>
        <button className="btn" disabled={pending}>{pending ? 'Saving…' : 'Add'}</button>
      </div>
      <p className="hint">Admins see the command center and add leaders. Moderators only look after the feed and photos. Admins must turn on two-step sign-in.</p>
      {state?.ok ? <p className="text-[13px]" style={{ color: 'var(--good)' }}>{state.ok}</p> : null}
      {state?.error ? <p role="alert" className="text-[13px]" style={{ color: 'var(--bad)' }}>{state.error}</p> : null}
    </form>
  );
}
