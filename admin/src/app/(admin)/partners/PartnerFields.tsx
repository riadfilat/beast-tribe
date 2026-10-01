// Shared fields for creating and editing a partner (coach, gym, event company, healthy restaurant).
const input = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm';
const label = 'block text-xs font-medium text-gray-600 mb-1';

export interface PartnerValues {
  business_name?: string | null;
  partner_type?: string | null;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website_url?: string | null;
  city?: string | null;
  country?: string | null;
  sports?: string[] | null;
  community_id?: string | null;
  metadata?: { offer?: string | null; offer_ar?: string | null; code?: string | null } | null;
}

export default function PartnerFields({ p = {}, communities }: { p?: PartnerValues; communities: { id: string; name: string }[] }) {
  const m = p.metadata || {};
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Partner type</label>
          <select name="partner_type" defaultValue={p.partner_type || 'coach'} className={input}>
            <option value="coach">Coach</option>
            <option value="gym">Gym</option>
            <option value="event_company">Event company</option>
            <option value="nutrition">Healthy restaurant</option>
          </select>
        </div>
        <div>
          <label className={label}>Business name</label>
          <input name="business_name" required defaultValue={p.business_name || ''} className={input} placeholder="Leejam Fitness" />
        </div>
      </div>

      <div>
        <label className={label}>Description</label>
        <textarea name="description" defaultValue={p.description || ''} className={`${input} resize-none h-20`} />
      </div>

      <div>
        <label className={label}>Sports (coaches and gyms, comma separated)</label>
        <input name="sports" defaultValue={(p.sports || []).join(', ')} className={input} placeholder="running, padel, crossfit" />
        <p className="text-[11px] text-gray-400 mt-1">Members see a coach when hosting these sports.</p>
      </div>

      <div className="rounded-lg border border-dashed border-gray-200 p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-700">Member offer (healthy restaurants)</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Offer (English)</label>
            <input name="offer" defaultValue={m.offer || ''} className={input} placeholder="15% off bowls for members" />
          </div>
          <div>
            <label className={label}>Offer (Arabic)</label>
            <input name="offer_ar" dir="rtl" defaultValue={m.offer_ar || ''} className={input} placeholder="خصم ١٥٪ للأعضاء" />
          </div>
        </div>
        <div className="w-1/2 pe-2">
          <label className={label}>Discount code</label>
          <input name="offer_code" defaultValue={m.code || ''} className={`${input} uppercase tracking-widest`} placeholder="BEAST15" />
        </div>
        <p className="text-[11px] text-gray-400">Shown in the app under Nutrition › Eat well.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Contact email</label>
          <input name="contact_email" type="email" defaultValue={p.contact_email || ''} className={input} />
        </div>
        <div>
          <label className={label}>Phone</label>
          <input name="contact_phone" defaultValue={p.contact_phone || ''} className={input} placeholder="+966..." />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={label}>City</label>
          <input name="city" defaultValue={p.city || ''} className={input} placeholder="Riyadh" />
        </div>
        <div>
          <label className={label}>Country</label>
          <select name="country" defaultValue={p.country || 'SA'} className={input}>
            <option value="SA">Saudi Arabia</option>
            <option value="AE">UAE</option>
            <option value="KW">Kuwait</option>
            <option value="BH">Bahrain</option>
          </select>
        </div>
        <div>
          <label className={label}>Website</label>
          <input name="website_url" type="url" defaultValue={p.website_url || ''} className={input} placeholder="https://" />
        </div>
      </div>

      <div>
        <label className={label}>Visible to</label>
        <select name="community_id" defaultValue={p.community_id || ''} className={input}>
          <option value="">Everyone</option>
          {communities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} only
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
