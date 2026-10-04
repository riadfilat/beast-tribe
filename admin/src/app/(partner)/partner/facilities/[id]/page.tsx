import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requirePartner } from '@/lib/auth';
import { can } from '@/lib/capabilities';
import { createAdminClient } from '@/lib/supabase-server';
import { loadFacilities } from '@/lib/venue';
import { Icon } from '@/components/ui/Icon';
import FacilityForm from '../FacilityForm';
import { createFacility, updateFacility } from '../actions';

export const revalidate = 0;

export default async function FacilityPage(props: { params: Promise<{ id?: string }> }) {
  const params = await props.params;
  const partner = await requirePartner();
  if (!can(partner.partner_type, 'facilities')) redirect('/partner/dashboard');
  const db = createAdminClient();
  const [{ data: sports }, { data: p }, facilities] = await Promise.all([
    db.from('sports').select('name').eq('is_active', true).order('name'),
    db.from('partners').select('city').eq('id', partner.partner_id).single(),
    loadFacilities(partner.partner_id),
  ]);
  const facility = params.id ? facilities.find((f) => f.id === params.id) : undefined;
  if (params.id && !facility) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/partner/facilities" className="text-sm text-[#147070] hover:underline mb-4 inline-flex items-center gap-1">
        <Icon name="back" size="sm" /> Courts and facilities
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">{facility ? facility.name : 'Add a facility'}</h1>
      <p className="text-sm text-gray-500 mb-6">Times are Riyadh time. Changes show in the app right away; bookings already made keep their time and price.</p>
      <FacilityForm
        action={facility ? updateFacility.bind(null, facility.id) : createFacility}
        facility={facility}
        sports={(sports || []) as any[]}
        city={(p as any)?.city || null}
        hasCommunity={!!partner.community_id}
        isSchool={partner.partner_type === 'school'}
        parents={facilities.filter((x) => !x.parent_id).map((x) => ({ id: x.id, name: x.name }))}
      />
    </div>
  );
}
