import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requirePartner } from '@/lib/auth';
import { can } from '@/lib/capabilities';
import { AUDIENCES, FACILITY_KINDS, hoursLine, loadBookings, loadFacilities, money } from '@/lib/venue';
import SubmitButton from '@/components/SubmitButton';
import { btnGhost, btnPrimary, card } from '@/components/club/ui';
import { setFacilityActive } from './actions';

export const revalidate = 0;

export default async function FacilitiesPage({ searchParams }: { searchParams: { saved?: string } }) {
  const partner = await requirePartner();
  if (!can(partner.partner_type, 'facilities')) redirect('/partner/dashboard');
  const [facilities, bookings] = await Promise.all([loadFacilities(partner.partner_id), loadBookings(partner.partner_id, new Date())]);
  const upcomingOf = (id: string) => bookings.filter((b) => b.facilityId === id && !b.cancelled).length;
  const isSchool = partner.partner_type === 'school';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courts and facilities</h1>
          <p className="text-sm text-gray-500 max-w-2xl">
            {isSchool
              ? 'List the hall, pitch or pool for the hours the school is not using it. People book a time in the app and each player sees their share.'
              : 'Everything you list here can be booked in the app. Players pick a time, invite their group, and each one sees exactly what they owe you.'}
          </p>
        </div>
        <Link href="/partner/facilities/new" className={btnPrimary}>
          + Add a facility
        </Link>
      </div>

      {searchParams.saved ? <div className="rounded-lg bg-[#E8F5EE] text-[#25704F] text-sm px-4 py-3">Saved. It shows in the app under Explore › Book a court.</div> : null}

      {facilities.length ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {facilities.map((f) => (
            <div key={f.id} className={`${card} p-5 ${f.is_active ? '' : 'opacity-60'}`}>
              <div className="flex gap-4">
                {f.image_url ? <img src={f.image_url} alt="" className="w-24 h-24 rounded-lg object-cover flex-none" /> : <div className="w-24 h-24 rounded-lg bg-gray-100 flex-none" />}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{f.name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {[FACILITY_KINDS[f.kind], f.sport, f.city].filter(Boolean).join(' · ')}
                  </p>
                  <p className="text-sm text-gray-800 mt-2">
                    <span className="font-semibold tabular-nums">{money(f.price_sar)}</span> for {f.slot_minutes} min · up to {f.max_players} players
                    <span className="text-gray-500"> · {money(f.price_sar / f.max_players)} each when full</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{hoursLine(f.hours)}</p>
                  <p className="text-xs text-gray-500">{AUDIENCES[f.audience]}{f.is_active ? '' : ' · Hidden from the app'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-50">
                <span className="text-xs text-gray-500 flex-1">{upcomingOf(f.id)} booking{upcomingOf(f.id) === 1 ? '' : 's'} coming up</span>
                <form action={setFacilityActive.bind(null, f.id, !f.is_active)}>
                  <SubmitButton pendingLabel="…" className="text-sm text-gray-500 hover:underline">
                    {f.is_active ? 'Hide' : 'Show in the app'}
                  </SubmitButton>
                </form>
                <Link href={`/partner/facilities/${f.id}`} className={btnGhost}>
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${card} p-10 text-center`}>
          <p className="text-gray-900 font-semibold">Nothing listed yet</p>
          <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">Add your first {isSchool ? 'facility' : 'court'} with its hours and price. It takes two minutes and it can be booked right away.</p>
          <Link href="/partner/facilities/new" className={`${btnPrimary} mt-4`}>
            Add a facility
          </Link>
        </div>
      )}
    </div>
  );
}
