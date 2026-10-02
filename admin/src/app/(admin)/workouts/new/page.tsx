import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { Icon } from '@/components/ui/Icon';
import WorkoutEditor from '@/components/workouts/WorkoutEditor';
import { createWorkout } from '../actions';

export default async function NewWorkoutPage() {
  await requireAdmin();
  const db = createAdminClient();
  const { data: communities } = await db.from('communities').select('id, name').eq('is_active', true).order('name');

  return (
    <div className="max-w-5xl">
      <Link href="/workouts" className="text-sm text-brand-aqua hover:underline mb-4 inline-flex items-center gap-1">
        <Icon name="back" size="sm" />
        Back to Workouts
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">New library workout</h1>
      <p className="text-sm text-gray-500 mb-6">Written by Operation Beast. Save as a draft, or put it live in the Train tab.</p>
      <WorkoutEditor action={createWorkout} communities={communities || []} submitLabel="Save workout" admin />
    </div>
  );
}
