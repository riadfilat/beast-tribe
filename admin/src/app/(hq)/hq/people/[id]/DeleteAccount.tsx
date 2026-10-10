'use client';

import { useActionState } from 'react';
import { Trash } from '@phosphor-icons/react';
import { deleteMember, type DeleteState } from '../actions';

/** Delete for good, after typing the member's name. Only rendered for the super admin. */
export function DeleteAccount({ userId, name }: { userId: string; name: string }) {
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteMember.bind(null, userId, name), undefined);
  return (
    <form action={action} className="grid gap-3">
      <ul className="grid gap-1 text-[13px] list-disc ps-5" style={{ color: 'var(--ink-soft)' }}>
        <li>Removed for good: their profile, posts, comments, chats, session and court bookings, payments.</li>
        <li>Sessions and groups they hosted stay for the other players, without their name.</li>
        <li>The staff log records that you deleted them. This can’t be undone; Suspend can.</li>
      </ul>
      <div>
        <label className="label" htmlFor="confirm">Type <b style={{ color: 'var(--ink)' }}>{name}</b> to confirm</label>
        <input id="confirm" name="confirm" autoComplete="off" className="input" />
      </div>
      {state?.error ? <p role="alert" className="text-[13px]" style={{ color: 'var(--bad)' }}>{state.error}</p> : null}
      <div>
        <button className="btn danger" disabled={pending}><Trash size={16} weight="bold" /> {pending ? 'Deleting…' : 'Delete account for good'}</button>
      </div>
    </form>
  );
}
