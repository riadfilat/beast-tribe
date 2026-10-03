import SubmitButton from '@/components/SubmitButton';
import { btnPrimary, card, input, label } from '@/components/club/ui';
import { AUDIENCES, DAYS, FACILITY_KINDS, SLOT_MINUTES, type Facility } from '@/lib/venue';

// One form for a new facility and for editing one. Times are Riyadh time.
export default function FacilityForm({
  action,
  facility,
  sports,
  city,
  hasCommunity,
  isSchool,
}: {
  action: (formData: FormData) => Promise<void>;
  facility?: Facility;
  sports: { name: string }[];
  city: string | null;
  hasCommunity: boolean;
  isSchool: boolean;
}) {
  const f = facility;
  const hours = f?.hours || {};
  return (
    <form action={action} className={`${card} p-6 space-y-6`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label}>Name</label>
          <input name="name" required defaultValue={f?.name || ''} className={input} placeholder="Court 1, Main hall, Football pitch…" />
        </div>
        <div>
          <label className={label}>Name in Arabic</label>
          <input name="name_ar" dir="rtl" defaultValue={f?.name_ar || ''} className={input} placeholder="الملعب 1" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className={label}>Type</label>
          <select name="kind" defaultValue={f?.kind || 'court'} className={input}>
            {Object.entries(FACILITY_KINDS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Sport</label>
          <select name="sport" defaultValue={f?.sport || 'padel'} className={input}>
            {sports.map((s) => (
              <option key={s.name} value={s.name.toLowerCase()}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>City</label>
          <input name="city" defaultValue={f?.city ?? city ?? ''} className={input} placeholder="Riyadh" />
        </div>
        <div>
          <label className={label}>Address or area</label>
          <input name="address" defaultValue={f?.address || ''} className={input} placeholder="Al Malqa" />
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-900">Price and players</p>
        <p className="text-xs text-gray-500 mb-3">The app divides the price by the number of players and shows each person their share. Players pay you at the venue. Beast Tribe takes nothing from it.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={label}>Price per booking (SAR)</label>
            <input name="price_sar" type="number" min={0} step="0.01" required defaultValue={f?.price_sar ?? 200} className={input} />
          </div>
          <div>
            <label className={label}>One booking lasts</label>
            <select name="slot_minutes" defaultValue={f?.slot_minutes || 60} className={input}>
              {SLOT_MINUTES.map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Most players</label>
            <input name="max_players" type="number" min={1} max={40} defaultValue={f?.max_players ?? 4} className={input} />
          </div>
          <div>
            <label className={label}>Who can book</label>
            <select name="audience" defaultValue={f?.audience || 'everyone'} className={input}>
              {Object.entries(AUDIENCES)
                .filter(([k]) => k !== 'community' || hasCommunity)
                .map(([k, v]) => (
                  <option key={k} value={k}>
                    {k === 'community' && isSchool ? 'Our school community only' : v}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-900">When it can be booked</p>
        <p className="text-xs text-gray-500 mb-3">
          {isSchool ? 'Tick the days and hours the facility is free for the community, for example after school and at weekends.' : 'Tick the days you open. An end time earlier than the start means you close after midnight.'}
        </p>
        <div className="space-y-2">
          {DAYS.map((d, i) => {
            const w = hours[String(i)]?.[0];
            return (
              <div key={d} className="flex items-center gap-3">
                <label className="flex items-center gap-2 w-32 text-sm text-gray-700">
                  <input type="checkbox" name={`open_${i}`} defaultChecked={f ? !!w : true} /> {d}
                </label>
                <input type="time" name={`from_${i}`} defaultValue={w?.[0] || (isSchool ? '16:00' : '06:00')} className={`${input} !w-32`} aria-label={`${d} opens`} />
                <span className="text-gray-400 text-sm">to</span>
                <input type="time" name={`to_${i}`} defaultValue={w?.[1] || (isSchool ? '22:00' : '23:00')} className={`${input} !w-32`} aria-label={`${d} closes`} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Book at least … hours ahead</label>
          <input name="notice_hours" type="number" min={0} max={72} defaultValue={f?.notice_hours ?? 1} className={input} />
        </div>
        <div>
          <label className={label}>Free to cancel until … hours before</label>
          <input name="cancel_hours" type="number" min={0} max={168} defaultValue={f?.cancel_hours ?? 6} className={input} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label}>Good to know</label>
          <textarea name="description" maxLength={600} defaultValue={f?.description || ''} className={`${input} resize-none h-20`} placeholder="Indoor, rackets to rent, parking behind the building." />
        </div>
        <div>
          <label className={label}>Good to know in Arabic</label>
          <textarea name="description_ar" dir="rtl" maxLength={600} defaultValue={f?.description_ar || ''} className={`${input} resize-none h-20`} />
        </div>
      </div>

      <div>
        <label className={label}>Photo (JPG, PNG or WebP, up to 5 MB)</label>
        {f?.image_url ? <img src={f.image_url} alt="" className="h-28 rounded-lg object-cover mb-2" /> : null}
        <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="text-sm text-gray-600" />
      </div>

      <SubmitButton pendingLabel="Saving…" className={`${btnPrimary} w-full py-2.5`}>
        {f ? 'Save changes' : 'List it in the app'}
      </SubmitButton>
    </form>
  );
}
