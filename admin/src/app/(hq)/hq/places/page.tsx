import Link from 'next/link';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { Box, Empty, Kpi, Notice, PageTop } from '@/components/board/ui';
import { byCount, filterPlaces, hasPin, type PlaceFilters, type PlaceRow } from './list';
import { Filters } from './Filters';
import { PlaceRows } from './PlaceRows';

export const revalidate = 0;

const COLUMNS = 'id, name, name_ar, city, country, description, address, image_url, sports, latitude, longitude, phone, booking_url, is_active, community_id';

export default async function Places({ searchParams }: { searchParams: Promise<PlaceFilters & { saved?: string; deleted?: string }> }) {
  await requireRole('admin');
  const db = createAdminClient();
  const [sp, { data }, { data: comms }] = await Promise.all([
    searchParams,
    db.from('popular_locations').select(COLUMNS).order('country').order('sort_order').order('name'),
    db.from('communities').select('id, name').order('name'),
  ]);
  const all = (data || []) as PlaceRow[];
  const f: PlaceFilters = { q: sp.q, city: sp.city, sport: sp.sport, status: sp.status, community: sp.community };
  const rows = filterPlaces(all, f);
  const names: Record<string, string> = Object.fromEntries((comms || []).map((c) => [c.id, c.name]));
  const usedComms = (comms || []).filter((c) => all.some((p) => p.community_id === c.id));
  const filtering = Object.values(f).some(Boolean);
  const add = <Link href="/hq/places/new" className="btn"><Plus size={16} weight="bold" /> Add a place</Link>;

  return (
    <>
      <PageTop title="Places & courts" sub="Parks, tracks and venues members pick when they create a session." action={add} />
      {sp.saved ? <Notice tone="good">Saved. The app shows it straight away.</Notice> : null}
      {sp.deleted ? <Notice tone="good">The place was deleted. Sessions that used it keep their details.</Notice> : null}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Places" value={all.length} note={`${byCount(all.map((p) => p.city)).length} cities`} />
        <Kpi label="In the app" value={all.filter((p) => p.is_active !== false).length} note="Members can pick these" />
        <Kpi label="No map pin" value={all.filter((p) => !hasPin(p)).length} note="Won't show on the map" />
        <Kpi label="No photo" value={all.filter((p) => !p.image_url).length} note="Show a plain card" />
      </div>
      <Box title="Find a place" icon="places">
        <Filters f={f} cities={byCount(all.map((p) => p.city))} sports={byCount(all.flatMap((p) => p.sports || []))} communities={usedComms} />
      </Box>
      <Box title={filtering ? `${rows.length} of ${all.length} places` : 'All places'} icon="places" action={filtering ? <Link href="/hq/places" className="btn ghost small">Clear filters</Link> : undefined}>
        {rows.length ? (
          <PlaceRows rows={rows} communities={names} />
        ) : all.length ? (
          <Empty title="Nothing matches" body="No place fits this search and these filters. Try a different word or clear the filters." action={<Link href="/hq/places" className="btn ghost small">Clear filters</Link>} />
        ) : (
          <Empty title="No places yet" body="Add the parks, tracks and courts your members play at. They can then pick them when they create a session." action={<Link href="/hq/places/new" className="btn small">Add the first place</Link>} />
        )}
      </Box>
    </>
  );
}
