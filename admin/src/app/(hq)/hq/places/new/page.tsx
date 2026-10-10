import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { PageTop } from '@/components/board/ui';
import { PlaceForm } from '../PlaceForm';

export default async function NewPlace() {
  await requireRole('admin');
  const { data: communities } = await createAdminClient()
    .from('communities')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="grid gap-4 max-w-3xl">
      <Link href="/hq/places" className="link text-[13px] inline-flex items-center gap-1"><ArrowLeft size={14} /> All places</Link>
      <PageTop title="Add a place" sub="A park, track or venue members can pick when they create a session." />
      <PlaceForm v={null} communities={communities || []} />
    </div>
  );
}
