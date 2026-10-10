'use client';

import { useActionState, useState } from 'react';
import { Globe, LockSimple, PaperPlaneTilt } from '@phosphor-icons/react';
import { createSession, type FormState } from '../actions';
import { SessionPreview } from './SessionPreview';

const QUICK = ['padel', 'football', 'running', 'gym', 'yoga', 'cycling', 'basketball', 'walking'];
const LEVELS: [string, string][] = [['', 'All levels'], ['easy', 'Beginner'], ['medium', 'Intermediate'], ['hard', 'Advanced']];

export interface SessionFormProps {
  sports: { slug: string; name: string }[];
  places: string[];
  community: { name: string; city: string };
  host: string;
  canPrice: boolean;
  canGuests: boolean;
  initial: { sport: string; level: string; date: string; time: string };
}

function Choice({ name, value, checked, onChange, children }: { name: string; value: string; checked: boolean; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="relative">
      <input type="radio" className="sr" name={name} value={value} checked={checked} onChange={() => onChange(value)} />
      <span className="chip">{children}</span>
    </label>
  );
}

export function SessionForm({ sports, places, community, host, canPrice, canGuests, initial }: SessionFormProps) {
  const [state, action, pending] = useActionState<FormState, FormData>(createSession, undefined);
  const quick = QUICK.filter((q) => sports.some((s) => s.slug === q));
  const [f, setF] = useState({ sport: initial.sport || quick[0] || sports[0]?.slug || '', title: '', date: initial.date, time: initial.time, duration: '60', spots: '10', place: '', level: initial.level, price: 'free', fee: '50', who: 'community', gender: 'all', repeat: '1', guests: false, guestSpots: '2', guestFee: '80' });
  const set = (k: keyof typeof f) => (v: any) => setF((x) => ({ ...x, [k]: v }));
  const sportName = sports.find((s) => s.slug === f.sport)?.name ?? 'Session';

  return (
    <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4 items-start">
      <form action={action} className="box grid gap-4">
        <fieldset className="grid gap-2">
          <legend className="label">Sport</legend>
          <div className="flex flex-wrap gap-1.5">
            {quick.map((s) => (
              <Choice key={s} name="sport" value={s} checked={f.sport === s} onChange={set('sport')}>
                {sports.find((x) => x.slug === s)?.name}
              </Choice>
            ))}
            <select aria-label="More sports" className="input w-auto py-1.5" value={quick.includes(f.sport) ? '' : f.sport} onChange={(e) => e.target.value && set('sport')(e.target.value)}>
              <option value="">More sports…</option>
              {sports.filter((s) => !quick.includes(s.slug)).map((s) => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
            </select>
            {!quick.includes(f.sport) ? <input type="hidden" name="sport" value={f.sport} /> : null}
          </div>
        </fieldset>

        <div>
          <label className="label" htmlFor="title">Name</label>
          <input id="title" name="title" className="input" maxLength={120} placeholder={`${sportName} with ${host}`} value={f.title} onChange={(e) => set('title')(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div><label className="label" htmlFor="date">Day</label><input id="date" name="date" type="date" required className="input" value={f.date} onChange={(e) => set('date')(e.target.value)} /></div>
          <div><label className="label" htmlFor="time">Time</label><input id="time" name="time" type="time" required className="input" value={f.time} onChange={(e) => set('time')(e.target.value)} /></div>
          <div>
            <label className="label" htmlFor="duration">Length</label>
            <select id="duration" name="duration" className="input" value={f.duration} onChange={(e) => set('duration')(e.target.value)}>
              {[30, 45, 60, 90, 120, 180].map((m) => <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60} h`}</option>)}
            </select>
          </div>
          <div><label className="label" htmlFor="spots">Spots</label><input id="spots" name="spots" type="number" min={2} max={500} className="input num" value={f.spots} onChange={(e) => set('spots')(e.target.value)} /></div>
        </div>

        <div>
          <label className="label" htmlFor="place">Place</label>
          <input id="place" name="place" list="places" className="input" maxLength={120} placeholder={`e.g. ${places[0] || 'Court 1'}`} value={f.place} onChange={(e) => set('place')(e.target.value)} />
          <datalist id="places">{places.map((p) => <option key={p} value={p} />)}</datalist>
        </div>

        <fieldset className="grid gap-2">
          <legend className="label">Level</legend>
          <div className="flex flex-wrap gap-1.5">
            {LEVELS.map(([v, l]) => <Choice key={v} name="level" value={v} checked={f.level === v} onChange={set('level')}>{l}</Choice>)}
          </div>
        </fieldset>

        <div className="grid sm:grid-cols-2 gap-4">
          {canPrice ? (
            <fieldset className="grid gap-2 content-start">
              <legend className="label">Price</legend>
              <div className="flex flex-wrap gap-1.5">
                <Choice name="price" value="free" checked={f.price === 'free'} onChange={set('price')}>Free</Choice>
                <Choice name="price" value="paid" checked={f.price === 'paid'} onChange={set('price')}>Paid</Choice>
              </div>
              {f.price === 'paid' ? (
                <div>
                  <input aria-label="Price per player in SAR" name="fee" type="number" min={1} max={5000} step="1" className="input num" value={f.fee} onChange={(e) => set('fee')(e.target.value)} />
                  <p className="hint mt-1">SAR per player, paid at the venue. Beast Tribe takes 0%.</p>
                </div>
              ) : null}
            </fieldset>
          ) : null}
          <fieldset className="grid gap-2 content-start">
            <legend className="label">Who sees it</legend>
            <div className="flex flex-wrap gap-1.5">
              <Choice name="who" value="community" checked={f.who === 'community'} onChange={set('who')}><LockSimple size={15} /> My community</Choice>
              <Choice name="who" value="public" checked={f.who === 'public'} onChange={set('who')}><Globe size={15} /> Everyone in {community.city}</Choice>
            </div>
          </fieldset>
        </div>

        <fieldset className="grid gap-2">
          <legend className="label">Open to</legend>
          <div className="flex flex-wrap gap-1.5">
            {[['all', 'Everyone'], ['women', 'Women only'], ['men', 'Men only']].map(([v, l]) => <Choice key={v} name="gender" value={v} checked={f.gender === v} onChange={set('gender')}>{l}</Choice>)}
          </div>
        </fieldset>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="repeat">Repeat</label>
            <select id="repeat" name="repeat" className="input" value={f.repeat} onChange={(e) => set('repeat')(e.target.value)}>
              <option value="1">Just once</option>
              {[4, 8, 12].map((w) => <option key={w} value={w}>Every week for {w} weeks</option>)}
            </select>
          </div>
          {canGuests && f.who === 'community' ? (
            <div className="grid gap-2 content-start">
              <label className="flex items-center gap-2 text-[13px] font-semibold" style={{ fontFamily: 'var(--bt-head)' }}>
                <input type="checkbox" name="guests" checked={f.guests} onChange={(e) => set('guests')(e.target.checked)} /> Guest passes
              </label>
              {f.guests ? (
                <div className="grid grid-cols-2 gap-2">
                  <input aria-label="Guest spots" name="guest_spots" type="number" min={1} className="input num" value={f.guestSpots} onChange={(e) => set('guestSpots')(e.target.value)} />
                  <input aria-label="Guest fee in SAR" name="guest_fee" type="number" min={0} className="input num" value={f.guestFee} onChange={(e) => set('guestFee')(e.target.value)} />
                  <p className="hint col-span-2">Spots for people outside your community, and their fee in SAR.</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div>
          <label className="label" htmlFor="notes">Notes for players (optional)</label>
          <textarea id="notes" name="notes" rows={2} maxLength={1000} className="input" placeholder="What to bring, where to meet" />
        </div>

        {state?.error ? <p role="alert" className="text-[13px]" style={{ color: 'var(--bad)' }}>{state.error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button className="btn" disabled={pending}>
            <PaperPlaneTilt size={16} weight="bold" /> {pending ? 'Posting…' : 'Post session'}
          </button>
        </div>
      </form>
      <SessionPreview f={{ ...f, sportName }} community={community} host={host} />
    </div>
  );
}
