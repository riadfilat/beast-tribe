import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import LocationForm from '../LocationForm';
import { createLocation } from '../actions';
import Link from 'next/link';

export default async function NewLocationPage() {
  await requireAdmin();
  const db = createAdminClient();

  const { data: communities } = await db
    .from('communities')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true });

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/locations" className="text-xs text-gray-500 hover:text-brand-aqua transition">
          ← Back to locations
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Add Location</h1>
        <p className="text-sm text-gray-500">
          New popular spot for the community to pick when creating activities
        </p>
      </div>

      <LocationForm action={createLocation} communities={communities || []} />
    </div>
  );
}
