'use client';

import { useActionState } from 'react';
import { UserPlus } from '@phosphor-icons/react';
import { inviteSupporter, type InviteState } from './actions';

export function InviteForm() {
  const [state, action, pending] = useActionState<InviteState, FormData>(inviteSupporter, undefined);
  return (
    <form action={action} className="grid gap-2">
      <label className="label" htmlFor="invite-email">Add a supporter by email</label>
      <div className="flex flex-wrap gap-2">
        <input id="invite-email" name="email" type="email" required className="input flex-1 min-w-[200px]" placeholder="name@example.com" />
        <button className="btn" disabled={pending}>
          <UserPlus size={16} weight="bold" /> {pending ? 'Adding…' : 'Add'}
        </button>
      </div>
      {state?.ok ? <p className="text-[13px]" style={{ color: 'var(--good)' }}>{state.ok}</p> : null}
      {state?.error ? <p role="alert" className="text-[13px]" style={{ color: 'var(--bad)' }}>{state.error}</p> : null}
    </form>
  );
}
