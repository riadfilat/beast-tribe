import Link from 'next/link';
import { requirePartner } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { Icon } from '@/components/ui/Icon';
import WorkoutEditor from '@/components/workouts/WorkoutEditor';
import { submitWorkout } from '../actions';

export default async function NewCoachWorkoutPage() {
  const partner = await requirePartner();
  const db = createAdminClient();
  const { data: me } = await db.from('partners').select('community:communities(id, name)').eq('id', partner.partner_id).maybeSingle();
  const community = (me as any)?.community;

  return (
    <div className="max-w-5xl">
      <Link href="/partner/workouts" className="text-sm text-brand-aqua hover:underline mb-4 inline-flex items-center gap-1">
        <Icon name="back" size="sm" />
        Back to My workouts
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">New workout</h1>
      <p className="text-sm text-gray-500 mb-6">
        Write it the way you&rsquo;d write it on the board. Operation Beast reviews it before members see it. Add Arabic if you can; members who read Arabic see
        English where it&rsquo;s missing.
      </p>
      <WorkoutEditor action={submitWorkout} communities={community?.id ? [community] : []} submitLabel="Send for review" pendingLabel="Sending…" />
    </div>
  );
}
