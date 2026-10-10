import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Trash } from '@phosphor-icons/react/dist/ssr';
import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { ConfirmButton } from '@/components/ConfirmSubmit';
import { Box, PageTop, Pill } from '@/components/board/ui';
import { PlaceForm, type PlaceValues } from '../PlaceForm';
import { deletePlace } from '../actions';

export const revalidate = 0;

export default async function EditPlace({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin');
  const { id } = await params;
  const db = createAdminClient();
  const [{ data: place }, { data: comms }] = await Promise.all([
    db.from('popular_locations').select('*').eq('id', id).maybeSingle(),
    db.from('communities').select('id, name, is_active').order('name'),
  ]);
  if (!place) notFound();
  const v = place as PlaceValues;
  const shown = v.is_active !== false;
  // Active communities, plus the one this place belongs to even if it was switched off.
  const communities = (comms || []).filter((c) => c.is_active !== false || c.id === v.community_id).map(({ id, name }) => ({ id, name }));

  return (
    <div className="grid gap-4 max-w-3xl">
      <Link href="/hq/places" className="link text-[13px] inline-flex items-center gap-1"><ArrowLeft size={14} /> All places</Link>
      <PageTop
        title={v.name}
        sub={[v.name_ar, v.city].filter(Boolean).join(' · ')}
        action={shown ? <Pill tone="good">In the app</Pill> : <Pill tone="mute">Hidden</Pill>}
      />
      <PlaceForm v={v} communities={communities} />
      <Box title="Delete this place" sub="It disappears for good. Sessions that already used it keep their details. To take it out of the app for a while, untick “Show this place in the app” above instead.">
        <form action={deletePlace.bind(null, v.id)}>
          <ConfirmButton confirmMessage={`Delete "${v.name}"? This can't be undone.`} className="btn danger small">
            <Trash size={14} weight="bold" /> Delete place
          </ConfirmButton>
        </form>
      </Box>
    </div>
  );
}
