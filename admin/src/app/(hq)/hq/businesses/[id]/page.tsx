import { attachProfiles } from '@/lib/profiles';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FloppyDisk } from '@phosphor-icons/react/dist/ssr';
import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { Box, PageTop, Pill } from '@/components/board/ui';
import SubmitButton from '@/components/SubmitButton';
import { updatePartner } from '../actions';
import { BusinessFields, typeLabel } from '../BusinessFields';
import { CoachSlots, type Slot } from './CoachSlots';

export const revalidate = 0;

export default async function Business({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin');
  const { id } = await params;
  const db = createAdminClient();
  const [{ data: partner }, { data: communities }, { data: slots }] = await Promise.all([
    db.from('partners').select('*').eq('id', id).maybeSingle(),
    db.from('communities').select('id, name').eq('is_active', true).order('name'),
    db.from('coach_slots').select('id, day_of_week, start_time, end_time').eq('partner_id', id).order('day_of_week').order('start_time'),
  ]);
  if (!partner) notFound();
  const [b] = (await attachProfiles([partner as any])) as any[];
  const isCoach = (b.partner_type || b.type) === 'coach';

  return (
    <>
      <Link href="/hq/businesses" className="link text-[13px] inline-flex items-center gap-1"><ArrowLeft size={14} /> Businesses</Link>
      <PageTop
        title={b.business_name || 'Business'}
        sub={[typeLabel(b.partner_type), b.city, b.profile?.full_name ? `login: ${b.profile.full_name}` : 'no login'].filter(Boolean).join(' · ')}
        action={
          <span className="flex flex-wrap gap-1.5">
            {b.is_verified ? <Pill tone="good">Verified</Pill> : <Pill tone="warn">Not verified</Pill>}
            {b.is_active ? <Pill tone="good">Live</Pill> : <Pill tone="mute">Hidden</Pill>}
          </span>
        }
      />
      <div className={`grid gap-4 items-start ${isCoach ? 'lg:grid-cols-[3fr_2fr]' : 'max-w-3xl'}`}>
        <Box title="Details" icon="profile">
          <form action={updatePartner.bind(null, id)} className="grid gap-4">
            <BusinessFields p={b} communities={(communities || []) as { id: string; name: string }[]} />
            <div className="flex flex-wrap gap-4 rule-top pt-3">
              <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" name="is_verified" defaultChecked={b.is_verified !== false} /> Verified (we’ve checked them)</label>
              <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" name="is_active" defaultChecked={b.is_active !== false} /> Live in the app</label>
            </div>
            <div><SubmitButton className="btn" pendingLabel="Saving…"><FloppyDisk size={16} weight="bold" /> Save changes</SubmitButton></div>
          </form>
        </Box>
        {isCoach ? <CoachSlots partnerId={id} slots={(slots || []) as Slot[]} /> : null}
      </div>
    </>
  );
}
