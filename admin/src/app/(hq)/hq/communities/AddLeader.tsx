'use client';

import { useActionState, useState } from 'react';
import { UserPlus } from '@phosphor-icons/react';
import { addLeader, type AddLeaderState } from './actions';

export function AddLeader({ communities }: { communities: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<AddLeaderState, FormData>(addLeader, undefined);
  const [which, setWhich] = useState(communities.length ? communities[0].id : 'new');
  return (
    <form action={action} className="grid gap-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="email">Leader’s email</label>
          <input id="email" name="email" type="email" required className="input" placeholder="coach@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="community">Community</label>
          <select id="community" name="community" className="input" value={which} onChange={(e) => setWhich(e.target.value)}>
            <option value="new">+ A new community</option>
            {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      {which === 'new' ? (
        <div className="grid sm:grid-cols-3 gap-3">
          <div><label className="label" htmlFor="name">Community name</label><input id="name" name="name" maxLength={60} required className="input" placeholder="Falcon Padel Club" /></div>
          <div><label className="label" htmlFor="city">City</label><input id="city" name="city" maxLength={80} className="input" placeholder="Riyadh" /></div>
          <div>
            <label className="label" htmlFor="kind">Kind</label>
            <select id="kind" name="kind" className="input" defaultValue="club">
              <option value="club">Club or coach</option>
              <option value="gym">Gym</option>
              <option value="company">Company</option>
              <option value="school">School</option>
              <option value="compound">Compound</option>
            </select>
          </div>
        </div>
      ) : null}
      {state?.ok ? <p className="text-[13px]" style={{ color: 'var(--good)' }}>{state.ok}</p> : null}
      {state?.error ? <p role="alert" className="text-[13px]" style={{ color: 'var(--bad)' }}>{state.error}</p> : null}
      <div><button className="btn" disabled={pending}><UserPlus size={16} weight="bold" /> {pending ? 'Adding…' : 'Add leader'}</button></div>
    </form>
  );
}
