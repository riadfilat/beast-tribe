'use client';

import { useActionState } from 'react';
import { FloppyDisk, PaperPlaneTilt } from '@phosphor-icons/react';
import { COUNTRIES, type SessionFormValues, type SportOption } from '@/lib/events';
import type { FormState } from './actions';

// One form for posting a session and for editing one (HQ staff). The same fields, the same
// country list, Men only next to Women only, and which community it belongs to.

const QUICK = ['padel', 'football', 'running', 'gym', 'yoga', 'cycling', 'basketball', 'walking'];
const GENDERS: [SessionFormValues['gender'], string][] = [['all', 'Everyone'], ['women', 'Women only'], ['men', 'Men only']];

export interface SessionFormProps {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial: SessionFormValues;
  sports: SportOption[];
  communities: { open: { id: string; name: string } | null; others: { id: string; name: string }[] };
  cities: string[];
  /** False for a session that lives in a group: it stays in its group. */
  showCommunity: boolean;
  mode: 'new' | 'edit';
}

function Chip({ name, value, checked, children }: { name: string; value: string; checked: boolean; children: React.ReactNode }) {
  return (
    <label className="relative">
      <input type="radio" className="sr" name={name} value={value} defaultChecked={checked} />
      <span className="chip">{children}</span>
    </label>
  );
}

export function SessionForm({ action, initial, sports, communities, cities, showCommunity, mode }: SessionFormProps) {
  const [state, run, pending] = useActionState<FormState, FormData>(action, undefined);
  // After a failed save the form shows again what was typed.
  const v = state?.values ?? initial;
  const quick = QUICK.filter((q) => sports.some((s) => s.slug === q));
  const openId = communities.open?.id ?? '';

  return (
    <form action={run} className="grid gap-4" key={state?.values ? JSON.stringify(state.values) : 'initial'}>
      <div>
        <label className="label" htmlFor="title">Name</label>
        <input id="title" name="title" className="input" required maxLength={120} defaultValue={v.title} placeholder="e.g. Friday padel with Coach Ali" />
      </div>

      <fieldset className="grid gap-2">
        <legend className="label">Sport</legend>
        <select name="sport" className="input" required defaultValue={v.sport} aria-label="Sport">
          <option value="" disabled>Pick a sport…</option>
          {quick.length ? (
            <optgroup label="Most used">
              {quick.map((slug) => <option key={slug} value={slug}>{sports.find((s) => s.slug === slug)?.name}</option>)}
            </optgroup>
          ) : null}
          <optgroup label="All sports">
            {sports.filter((s) => !quick.includes(s.slug)).map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </optgroup>
        </select>
      </fieldset>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="starts_at">Starts</label>
          <input id="starts_at" name="starts_at" type="datetime-local" required className="input" defaultValue={v.starts_at} />
        </div>
        <div>
          <label className="label" htmlFor="ends_at">Ends (optional)</label>
          <input id="ends_at" name="ends_at" type="datetime-local" className="input" defaultValue={v.ends_at} />
        </div>
        <p className="hint sm:col-span-2 -mt-1">Local time in the session&apos;s country.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="label" htmlFor="location_name">Place</label>
          <input id="location_name" name="location_name" className="input" maxLength={120} defaultValue={v.location_name} placeholder="King Fahd Park" />
        </div>
        <div>
          <label className="label" htmlFor="location_city">City</label>
          <input id="location_city" name="location_city" list="session-cities" className="input" maxLength={60} defaultValue={v.location_city} placeholder="Riyadh" />
          <datalist id="session-cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <div>
          <label className="label" htmlFor="country">Country</label>
          <select id="country" name="country" className="input" defaultValue={v.country}>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="label" htmlFor="max_capacity">Spots</label>
          <input id="max_capacity" name="max_capacity" type="number" min={1} max={5000} className="input num" defaultValue={v.max_capacity} placeholder="No limit" />
        </div>
        <div>
          <label className="label" htmlFor="coach_name">Coach (optional)</label>
          <input id="coach_name" name="coach_name" className="input" maxLength={120} defaultValue={v.coach_name} placeholder="Coach Ali" />
        </div>
        <div>
          <label className="label" htmlFor="gym_name">Gym or club (optional)</label>
          <input id="gym_name" name="gym_name" className="input" maxLength={120} defaultValue={v.gym_name} placeholder="Leejam Fitness" />
        </div>
      </div>

      <div className={`grid gap-4 ${showCommunity ? 'sm:grid-cols-2' : ''}`}>
        <fieldset className="grid gap-2 content-start">
          <legend className="label">Open to</legend>
          <div className="flex flex-wrap gap-1.5">
            {GENDERS.map(([g, l]) => <Chip key={g} name="gender" value={g} checked={v.gender === g}>{l}</Chip>)}
          </div>
        </fieldset>
        {showCommunity ? (
          <div>
            <label className="label" htmlFor="community">Community</label>
            <select id="community" name="community" className="input" defaultValue={v.community === openId ? '' : v.community}>
              <option value="">{communities.open?.name ?? 'Beast Tribe'} (open to everyone)</option>
              {communities.others.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <p className="hint mt-1">Pick a community to show it only to its members.</p>
          </div>
        ) : null}
      </div>

      <div>
        <label className="label" htmlFor="description">Notes for players (optional)</label>
        <textarea id="description" name="description" rows={3} maxLength={1000} className="input" defaultValue={v.description} placeholder="What to bring, where to meet" />
      </div>

      {state?.error ? <p role="alert" className="text-[13px]" style={{ color: 'var(--bad)' }}>{state.error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button className="btn" disabled={pending}>
          {mode === 'new' ? <PaperPlaneTilt size={16} weight="bold" /> : <FloppyDisk size={16} weight="bold" />}
          {pending ? (mode === 'new' ? 'Posting…' : 'Saving…') : mode === 'new' ? 'Post session' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
