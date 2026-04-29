import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import LocationForm from '../LocationForm';
import { updateLocation, deleteLocation } from '../actions';
import { ConfirmButton } from '@/components/ConfirmSubmit';

export const revalidate = 0;

export default async function EditLocationPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const db = createAdminClient();

  const [{ data: location }, { data: communities }] = await Promise.all([
    db.from('popular_locations').select('*').eq('id', params.id).maybeSingle(),
    db.from('communities').select('id, name').eq('is_active', true).order('name', { ascending: true }),
  ]);

  if (!location) notFound();

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/locations" className="text-xs text-gray-500 hover:text-brand-aqua transition">
          ← Back to locations
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{location.name}</h1>
        <p className="text-sm text-gray-500">
          {location.city} · {location.country}
        </p>
      </div>

      <LocationForm
        action={async (formData: FormData) => {
          'use server';
          await updateLocation(location.id, formData);
        }}
        location={location}
        communities={communities || []}
      />

      {/* Danger zone */}
      <div className="mt-10 pt-6 border-t border-red-100">
        <h3 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h3>
        <p className="text-xs text-gray-500 mb-3">
          Deleting will permanently remove this location. Existing events that referenced it stay unaffected.
        </p>
        <form
          action={async () => {
            'use server';
            await deleteLocation(location.id);
          }}
        >
          <ConfirmButton
            confirmMessage={`Delete "${location.name}"? This cannot be undone.`}
            className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition"
          >
            Delete Location
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
