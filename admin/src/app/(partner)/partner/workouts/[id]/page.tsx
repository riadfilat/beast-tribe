import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireCap } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { Icon } from '@/components/ui/Icon';
import WorkoutEditor from '@/components/workouts/WorkoutEditor';
import { STATUS_LABELS } from '@/lib/workouts';
import { resubmitWorkout } from '../actions';

export const revalidate = 0;

export default async function EditCoachWorkoutPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const partner = await requireCap('workouts');
  const db = createAdminClient();
  const [{ data: w }, { data: me }] = await Promise.all([
    db.from('workouts').select('*').eq('id', params.id).eq('author_partner_id', partner.partner_id).maybeSingle(),
    db.from('partners').select('community:communities(id, name)').eq('id', partner.partner_id).maybeSingle(),
  ]);
  if (!w) notFound();
  const community = (me as any)?.community;
  const st = STATUS_LABELS[w.status];

  return (
    <div className="max-w-5xl">
      <Link href="/partner/workouts" className="text-sm text-brand-aqua hover:underline mb-4 inline-flex items-center gap-1">
        <Icon name="back" size="sm" />
        Back to My workouts
      </Link>
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-bold text-gray-900">{w.title}</h1>
        <span className={`text-xs px-2 py-0.5 rounded-full ${st?.className ?? ''}`}>{st?.label ?? w.status}</span>
      </div>
      {w.status === 'rejected' && w.review_note ? (
        <p className="text-sm text-red-700 mb-2">Requested changes: {w.review_note}</p>
      ) : null}
      <p className="text-sm text-gray-500 mb-6">
        {w.status === 'published'
          ? 'This workout is live. Saving changes sends it back to review, and members won’t see it until it’s approved again.'
          : 'Saving sends it to Operation Beast for review.'}
      </p>
      <WorkoutEditor
        action={resubmitWorkout.bind(null, w.id)}
        initial={w}
        communities={community?.id ? [community] : []}
        submitLabel="Send for review"
        pendingLabel="Sending…"
      />
    </div>
  );
}
