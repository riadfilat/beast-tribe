import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ownsCommunity, requireCap } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import SubmitButton from '@/components/SubmitButton';
import { Icon } from '@/components/ui/Icon';
import { btnPrimary, card, input, label } from '@/components/club/ui';
import { SessionFields } from '@/components/club/SessionFields';
import { can, kindOf, sessionWord } from '@/lib/capabilities';
import { createClass } from '../../club/actions';

export default async function NewClassPage() {
  const partner = await requireCap('classes');
  const inClub = ownsCommunity(partner.partner_type);
  if (inClub && !partner.community_id) redirect('/partner/club');
  const db = createAdminClient();
  const [{ data: sports }, { data: p }] = await Promise.all([
    db.from('sports').select('id, name, emoji').eq('is_active', true).order('name'),
    db.from('partners').select('city').eq('id', partner.partner_id).maybeSingle(),
  ]);
  const plural = kindOf(partner.partner_type).sessions;
  const one = sessionWord(partner.partner_type);

  // Tomorrow in Riyadh, as the default date.
  const tomorrow = new Date(Date.now() + 3 * 3600000 + 86400000).toISOString().slice(0, 10);

  return (
    <div className="max-w-2xl">
      <Link href="/partner/classes" className="text-sm text-[#147070] hover:underline mb-4 inline-flex items-center gap-1">
        <Icon name="back" size="sm" /> {plural}
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">New {one}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {inClub ? 'It shows up for your members in the app right away.' : 'It shows up on the Board for people in that city right away.'} Times are Riyadh time.
      </p>

      <form action={createClass} className={`${card} p-6 space-y-5`}>
        <SessionFields
          sports={(sports || []) as any}
          d={{ date: tomorrow, city: (p as any)?.city ?? null, capacity: 16 }}
          one={one}
          placeName={inClub ? `${partner.business_name} · Studio 2` : 'Wadi Hanifah, gate 3'}
          showCity={!inClub}
          showRepeat
        />

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
          Schedule {one}
        </SubmitButton>
      </form>
    </div>
  );
}
