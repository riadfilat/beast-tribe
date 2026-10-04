import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { Icon } from '@/components/ui/Icon';
import SubmitButton from '@/components/SubmitButton';
import WorkoutEditor from '@/components/workouts/WorkoutEditor';
import { STATUS_LABELS } from '@/lib/workouts';
import { reviewWorkout, updateWorkout } from '../actions';

export const revalidate = 0;

export default async function EditWorkoutPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  await requireRole('admin');
  const db = createAdminClient();
  const [{ data: w }, { data: communities }] = await Promise.all([
    db.from('workouts').select('*, author:partners!workouts_author_partner_id_fkey(business_name, name, contact_email)').eq('id', params.id).maybeSingle(),
    db.from('communities').select('id, name').eq('is_active', true).order('name'),
  ]);
  if (!w) notFound();

  const coach = w.source === 'coach';
  const st = STATUS_LABELS[w.status];

  return (
    <div className="max-w-5xl">
      <Link href="/workouts" className="text-sm text-brand-aqua hover:underline mb-4 inline-flex items-center gap-1">
        <Icon name="back" size="sm" />
        Back to Workouts
      </Link>
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-bold text-gray-900">{w.title}</h1>
        <span className={`text-xs px-2 py-0.5 rounded-full ${st?.className ?? ''}`}>{st?.label ?? w.status}</span>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        {coach ? `By ${w.author?.business_name || w.author?.name || 'a coach'}${w.author?.contact_email ? ` · ${w.author.contact_email}` : ''}` : 'Operation Beast library'}
      </p>

      {coach && w.status !== 'published' && w.status !== 'archived' ? (
        <section className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-5 space-y-3">
          <div>
            <h2 className="font-semibold text-gray-900">Review</h2>
            <p className="text-xs text-gray-600">
              Check the movements are safe and clear, the Arabic reads well, and any photo is people training, fully clothed, with no brand logos. Once live, every
              member&rsquo;s finished workout counts as a paid use for this coach.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <form action={reviewWorkout.bind(null, w.id, 'published')}>
              <SubmitButton pendingLabel="Approving…" className="px-4 py-2 bg-brand-teal text-white text-sm font-medium rounded-lg hover:opacity-90">
                Approve and put live
              </SubmitButton>
            </form>
            <form action={reviewWorkout.bind(null, w.id, 'rejected')} className="flex-1 flex gap-2">
              <input name="review_note" defaultValue={w.review_note ?? ''} placeholder="What to change (the coach sees this)" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
              <SubmitButton pendingLabel="Sending…" className="px-4 py-2 border border-red-200 text-red-700 bg-white text-sm rounded-lg hover:bg-red-50">
                Send back
              </SubmitButton>
            </form>
          </div>
        </section>
      ) : null}

      <WorkoutEditor action={updateWorkout.bind(null, w.id)} initial={w} communities={communities || []} submitLabel="Save changes" admin={!coach || w.status === 'published' || w.status === 'archived'} />
    </div>
  );
}
