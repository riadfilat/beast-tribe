'use client';

import { useActionState } from 'react';
import { FloppyDisk } from '@phosphor-icons/react';
import { saveCourt, type CourtState } from './actions';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const KINDS: [string, string][] = [['court', 'Court'], ['pitch', 'Pitch'], ['hall', 'Hall'], ['pool', 'Pool'], ['studio', 'Studio'], ['track', 'Track']];

export interface CourtValues {
  name: string;
  kind: string;
  sport: string;
  price_sar: number;
  slot_minutes: number;
  max_players: number;
  audience: string;
  address: string | null;
  description: string | null;
  hours: Record<string, [string, string][]>;
  notice_hours: number;
  cancel_hours: number;
  daily_limit: number | null;
}

export function CourtForm({ id, v, sports }: { id: string | null; v: CourtValues | null; sports: { slug: string; name: string }[] }) {
  const [state, action, pending] = useActionState<CourtState, FormData>(saveCourt.bind(null, id), undefined);
  const hours = v?.hours ?? Object.fromEntries(DAYS.map((_, i) => [String(i), [['06:00', '23:00']]]));
  return (
    <form action={action} className="box grid gap-4">
      <div className="grid sm:grid-cols-[2fr_1fr_1fr] gap-3">
        <div><label className="label" htmlFor="name">Name</label><input id="name" name="name" required maxLength={60} className="input" defaultValue={v?.name} placeholder="Court 1" /></div>
        <div>
          <label className="label" htmlFor="kind">Type</label>
          <select id="kind" name="kind" className="input" defaultValue={v?.kind || 'court'}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </div>
        <div>
          <label className="label" htmlFor="sport">Sport</label>
          <select id="sport" name="sport" className="input" defaultValue={v?.sport || 'padel'}>{sports.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="label" htmlFor="price">Price (SAR)</label><input id="price" name="price_sar" type="number" min={0} step="1" className="input num" defaultValue={v?.price_sar ?? 300} /></div>
        <div>
          <label className="label" htmlFor="slot">Booking length</label>
          <select id="slot" name="slot_minutes" className="input" defaultValue={v?.slot_minutes ?? 90}>{[30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}</select>
        </div>
        <div><label className="label" htmlFor="players">Players</label><input id="players" name="max_players" type="number" min={1} max={40} className="input num" defaultValue={v?.max_players ?? 4} /></div>
      </div>
      <p className="hint -mt-2">The price is split equally between the players who join; each pays their share at the venue.</p>
      <fieldset className="grid gap-2">
        <legend className="label">Who can book</legend>
        <div className="flex flex-wrap gap-1.5">
          {[['everyone', 'Everyone'], ['women', 'Women only'], ['community', 'Our members only']].map(([k, l]) => (
            <label key={k} className="relative"><input type="radio" className="sr" name="audience" value={k} defaultChecked={(v?.audience || 'everyone') === k} /><span className="chip">{l}</span></label>
          ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="label">Opening hours (Riyadh time)</legend>
        <div className="grid gap-1.5">
          {DAYS.map((d, i) => {
            const w = hours[String(i)]?.[0];
            return (
              <div key={d} className="grid grid-cols-[70px_1fr_1fr] gap-2 items-center">
                <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" name={`open_${i}`} defaultChecked={!!w} /> {d}</label>
                <input aria-label={`${d} opens`} name={`from_${i}`} type="time" className="input py-1.5" defaultValue={w?.[0] || '06:00'} />
                <input aria-label={`${d} closes`} name={`to_${i}`} type="time" className="input py-1.5" defaultValue={w?.[1] || '23:00'} />
              </div>
            );
          })}
        </div>
      </fieldset>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="label" htmlFor="address">Address</label><input id="address" name="address" maxLength={160} className="input" defaultValue={v?.address || ''} /></div>
        <div><label className="label" htmlFor="image">Photo</label><input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="input py-2 text-[12px]" /></div>
      </div>
      <details className="well p-3">
        <summary className="cursor-pointer text-[13px] font-semibold" style={{ fontFamily: 'var(--bt-head)' }}>More settings</summary>
        <div className="grid sm:grid-cols-3 gap-3 mt-3">
          <div><label className="label" htmlFor="notice">Book at least (hours ahead)</label><input id="notice" name="notice_hours" type="number" min={0} max={72} className="input num" defaultValue={v?.notice_hours ?? 0} /></div>
          <div><label className="label" htmlFor="cancel">Free cancelling until (hours before)</label><input id="cancel" name="cancel_hours" type="number" min={0} max={168} className="input num" defaultValue={v?.cancel_hours ?? 0} /></div>
          <div><label className="label" htmlFor="limit">Bookings per member a day</label><input id="limit" name="daily_limit" type="number" min={1} max={10} className="input num" defaultValue={v?.daily_limit ?? ''} placeholder="No limit" /></div>
          <div className="sm:col-span-3"><label className="label" htmlFor="description">Notes for players</label><textarea id="description" name="description" rows={2} maxLength={600} className="input" defaultValue={v?.description || ''} /></div>
        </div>
      </details>
      {state?.error ? <p role="alert" className="text-[13px]" style={{ color: 'var(--bad)' }}>{state.error}</p> : null}
      <div><button className="btn" disabled={pending}><FloppyDisk size={16} weight="bold" /> {pending ? 'Saving…' : 'Save court'}</button></div>
    </form>
  );
}
