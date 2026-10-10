'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { FloppyDisk, MapPin } from '@phosphor-icons/react';
import { SPORT_NAMES } from '@/lib/workouts';
import { savePlace, type PlaceState } from './actions';
import { pinText } from './fields';
import { PhotoField } from './PhotoField';

export interface PlaceValues {
  id: string;
  name: string;
  name_ar: string | null;
  city: string;
  country: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  booking_url: string | null;
  image_url: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  sports: string[] | null;
  sort_order: number | null;
  is_active: boolean | null;
  community_id: string | null;
}

const COUNTRIES: [string, string][] = [
  ['SA', 'Saudi Arabia'], ['AE', 'UAE'], ['KW', 'Kuwait'], ['BH', 'Bahrain'],
  ['QA', 'Qatar'], ['OM', 'Oman'], ['EG', 'Egypt'], ['JO', 'Jordan'],
];

export function PlaceForm({ v, communities }: { v: PlaceValues | null; communities: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<PlaceState, FormData>(savePlace.bind(null, v?.id ?? null), undefined);
  const chosen = v?.sports ?? [];
  // Sports the app knows, plus any older ones this place already has, so saving never drops them.
  const sports: [string, string][] = [
    ...Object.entries(SPORT_NAMES).map(([id, n]) => [id, n.en] as [string, string]),
    ...chosen.filter((s) => !SPORT_NAMES[s]).map((s) => [s, s] as [string, string]),
  ];

  return (
    <form action={action} className="box grid gap-5">
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="label" htmlFor="name">Name</label><input id="name" name="name" required maxLength={120} className="input" defaultValue={v?.name} placeholder="e.g. Wadi Hanifah Path" /></div>
        <div>
          <label className="label" htmlFor="name_ar">Name in Arabic</label>
          <input id="name_ar" name="name_ar" dir="rtl" maxLength={160} className="input" defaultValue={v?.name_ar || ''} placeholder="ممشى وادي حنيفة" />
          <p className="hint mt-1">Without it, Arabic users see the English name.</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="label" htmlFor="city">City</label><input id="city" name="city" required maxLength={80} className="input" defaultValue={v?.city} placeholder="e.g. Riyadh" /></div>
        <div>
          <label className="label" htmlFor="country">Country</label>
          <select id="country" name="country" className="input" defaultValue={v?.country || 'SA'}>{COUNTRIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="description">Short description</label>
        <textarea id="description" name="description" rows={2} maxLength={300} className="input" defaultValue={v?.description || ''} placeholder="e.g. 8 km shaded trail along the valley" />
      </div>
      <PhotoField current={v?.image_url || null} />
      <fieldset className="grid gap-2">
        <legend className="label">Sports played here</legend>
        <div className="flex flex-wrap gap-1.5">
          {sports.map(([id, label]) => (
            <label key={id} className="relative"><input type="checkbox" className="sr" name="sports" value={id} defaultChecked={chosen.includes(id)} /><span className="chip">{label}</span></label>
          ))}
        </div>
      </fieldset>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="label" htmlFor="address">Address</label><input id="address" name="address" maxLength={200} className="input" defaultValue={v?.address || ''} placeholder="Street and district" /></div>
        <div>
          <label className="label" htmlFor="pin">Map pin</label>
          <input id="pin" name="pin" className="input num" defaultValue={pinText(v?.latitude, v?.longitude)} placeholder="24.62002, 46.70835" />
          <p className="hint mt-1">In Google Maps, right-click the spot and click the numbers to copy them, then paste here.</p>
        </div>
      </div>
      {v?.latitude != null && v?.longitude != null ? (
        <a className="link text-[13px] inline-flex items-center gap-1 -mt-3" href={`https://www.google.com/maps?q=${v.latitude},${v.longitude}`} target="_blank" rel="noreferrer"><MapPin size={14} /> Check the pin on Google Maps</a>
      ) : null}
      <fieldset className="well p-3 grid gap-3">
        <legend className="sr-only">Booking with the venue</legend>
        <p className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>For courts members book with the venue, not in the app: they see Call and Booking page buttons.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="label" htmlFor="phone">Venue phone</label><input id="phone" name="phone" type="tel" className="input num" defaultValue={v?.phone || ''} placeholder="+966 5x xxx xxxx" /></div>
          <div><label className="label" htmlFor="booking_url">Booking page link</label><input id="booking_url" name="booking_url" type="url" className="input" defaultValue={v?.booking_url || ''} placeholder="https://" /></div>
        </div>
      </fieldset>
      <div className="grid sm:grid-cols-[2fr_1fr] gap-3">
        <div>
          <label className="label" htmlFor="community_id">Who sees it</label>
          <select id="community_id" name="community_id" className="input" defaultValue={v?.community_id || ''}>
            <option value="">Everyone in the app</option>
            {communities.map((c) => <option key={c.id} value={c.id}>Only members of {c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="sort_order">Position in the list</label>
          <input id="sort_order" name="sort_order" type="number" className="input num" defaultValue={v?.sort_order ?? 0} />
          <p className="hint mt-1">Lower numbers come first.</p>
        </div>
      </div>
      <label className="flex items-center gap-2 text-[14px]">
        <input type="checkbox" name="is_active" defaultChecked={v?.is_active !== false} /> Show this place in the app
      </label>
      {state?.error ? <p role="alert" className="text-[13px]" style={{ color: 'var(--bad)' }}>{state.error}</p> : null}
      <div className="flex flex-wrap gap-2 rule-top pt-4">
        <button className="btn" disabled={pending}><FloppyDisk size={16} weight="bold" /> {pending ? 'Saving…' : v ? 'Save changes' : 'Add place'}</button>
        <Link href="/hq/places" className="btn ghost">Cancel</Link>
      </div>
    </form>
  );
}
