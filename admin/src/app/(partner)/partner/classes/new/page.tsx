import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ownsCommunity, requirePartner } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import SubmitButton from '@/components/SubmitButton';
import { Icon } from '@/components/ui/Icon';
import { btnPrimary, card, input, label } from '@/components/club/ui';
import { can } from '@/lib/capabilities';
import { createClass } from '../../club/actions';

export default async function NewClassPage() {
  const partner = await requirePartner();
  if (!ownsCommunity(partner.partner_type)) redirect('/partner/dashboard');
  if (!partner.community_id) redirect('/partner/club');
  const db = createAdminClient();
  const { data: sports } = await db.from('sports').select('id, name, emoji').eq('is_active', true).order('name');

  // Tomorrow in Riyadh, as the default date.
  const tomorrow = new Date(Date.now() + 3 * 3600000 + 86400000).toISOString().slice(0, 10);

  return (
    <div className="max-w-2xl">
      <Link href="/partner/classes" className="text-sm text-[#147070] hover:underline mb-4 inline-flex items-center gap-1">
        <Icon name="back" size="sm" /> Classes
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">New class</h1>
      <p className="text-sm text-gray-500 mb-6">It shows up for your members in the app right away. Times are Riyadh time.</p>

      <form action={createClass} className={`${card} p-6 space-y-5`}>
        <div>
          <label className={label}>Class name</label>
          <input name="title" required className={input} placeholder="Hyrox Engine, Morning Spin, Ladies Strength…" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Sport</label>
            <select name="sport_id" className={input} defaultValue="">
              <option value="">—</option>
              {(sports || []).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.emoji} {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Coach</label>
            <input name="coach_name" className={input} placeholder="Coach Sara" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={label}>Date</label>
            <input name="date" type="date" required defaultValue={tomorrow} className={input} />
          </div>
          <div>
            <label className={label}>Starts</label>
            <input name="time" type="time" required defaultValue="18:30" className={input} />
          </div>
          <div>
            <label className={label}>Length</label>
            <select name="duration" defaultValue="60" className={input}>
              {[30, 45, 50, 60, 75, 90, 120].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={label}>Spots</label>
            <input name="capacity" type="number" min={1} max={500} defaultValue={16} className={input} />
          </div>
          <div>
            <label className={label}>Level</label>
            <select name="difficulty" defaultValue="" className={input}>
              <option value="">All levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className={label}>Repeat weekly</label>
            <select name="repeat" defaultValue="1" className={input}>
              <option value="1">Just once</option>
              {[4, 8, 12].map((w) => (
                <option key={w} value={w}>
                  For {w} weeks
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={label}>Where in the gym</label>
          <input name="location_name" className={input} placeholder={`${partner.business_name} · Studio 2`} />
        </div>

        <div>
          <label className={label}>What to expect</label>
          <textarea name="description" className={`${input} resize-none h-20`} placeholder="What you'll do, what to bring." />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" name="is_women_only" /> Women only
        </label>

        {can(partner.partner_type, 'guests') ? (
          <div className="rounded-lg border border-[#F3DDBD] bg-[#FFF8EC] p-4 space-y-3">
            <label className="flex items-start gap-2 text-sm text-gray-900 font-medium">
              <input type="checkbox" name="guest_open" className="mt-1" />
              <span>
                Open to guests
                <span className="block text-xs font-normal text-gray-600">
                  People in your city who are not your members see this class on their Board and can join for the guest price. They pay at your front desk; you tick them as paid. All of it is yours, Beast Tribe takes nothing.
                </span>
              </span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Guest price (SAR)</label>
                <input name="guest_price_sar" type="number" min={0} step="0.01" defaultValue={60} className={input} />
              </div>
              <div>
                <label className={label}>Guest spots (empty = any free spot)</label>
                <input name="guest_spots" type="number" min={0} max={500} placeholder="4" className={input} />
              </div>
            </div>
            <p className="text-xs text-gray-600">Your members always book free and are counted first in the total spots.</p>
          </div>
        ) : null}

        <SubmitButton pendingLabel="Scheduling…" className={`${btnPrimary} w-full py-2.5`}>
          Schedule class
        </SubmitButton>
      </form>
    </div>
  );
}
