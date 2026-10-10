import Link from 'next/link';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { requireRole } from '@/lib/auth';
import { Box, Kpi, Notice, PageTop } from '@/components/board/ui';
import { loadCommunityList, loadSessionCities, loadSessionCounts, loadSessionList, loadSportList, PER_PAGE, WHENS, type Filters, type When } from './data';
import { SessionFilters, sessionsHref } from './SessionFilters';
import { SessionTable } from './SessionTable';

export const revalidate = 0;

type Search = { q?: string; when?: string; day?: string; city?: string; sport?: string; community?: string; page?: string; done?: string };

export default async function HqSessions({ searchParams }: { searchParams: Promise<Search> }) {
  await requireRole('admin');
  const sp = await searchParams;
  const f: Filters = {
    q: (sp.q || '').slice(0, 80),
    when: WHENS.some((w) => w.key === sp.when) ? (sp.when as When) : 'upcoming',
    day: /^\d{4}-\d{2}-\d{2}$/.test(sp.day || '') ? sp.day! : null,
    city: sp.city || null,
    sport: sp.sport || null,
    community: /^[0-9a-f-]{36}$/i.test(sp.community || '') ? sp.community! : null,
    page: Math.max(1, parseInt(sp.page || '1') || 1),
  };

  const [{ rows, count }, counts, sports, communities, cities] = await Promise.all([
    loadSessionList(f), loadSessionCounts(), loadSportList(), loadCommunityList(), loadSessionCities(),
  ]);
  const allCommunities = [...(communities.open ? [{ id: communities.open.id, name: communities.open.name }] : []), ...communities.others];
  const sportName = (slug: string) => sports.find((s) => s.slug === slug)?.name ?? slug.replace(/_/g, ' ');
  const pages = Math.max(1, Math.ceil(count / PER_PAGE));
  const post = <Link href="/hq/sessions/new" className="btn small"><Plus size={14} weight="bold" /> Post a session</Link>;
  const heading = f.day
    ? new Date(`${f.day}T12:00:00+03:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Riyadh' })
    : WHENS.find((w) => w.key === f.when)!.label;

  return (
    <>
      <PageTop
        title="Sessions"
        sub="Every session in the app, from every community. Open one to see who's coming."
        action={<Link href="/hq/sessions/new" className="btn"><Plus size={16} weight="bold" /> Post a session</Link>}
      />
      {sp.done === 'deleted' ? <Notice tone="good">Session deleted.</Notice> : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Today" value={counts.today} note="sessions on today" />
        <Kpi label="Next 7 days" value={counts.week} note={`${counts.playersWeek} players booked`} />
        <Kpi label="No players yet" value={counts.emptyWeek} note="in the next 7 days" />
        <Kpi label="Cancelled" value={counts.cancelled30} note="in the last 30 days" />
      </div>

      <Box>
        <SessionFilters f={f} sports={sports} cities={cities} communities={allCommunities} />
      </Box>

      <Box title={heading} icon="sessions" sub={`${count.toLocaleString()} session${count === 1 ? '' : 's'}`}>
        <SessionTable rows={rows} sportName={sportName} emptyAction={post} />
        {pages > 1 ? (
          <nav className="flex items-center justify-center gap-3" aria-label="Pages">
            {f.page > 1 ? <Link href={sessionsHref(f, { page: f.page - 1 })} className="btn ghost small">Previous</Link> : null}
            <span className="hint num">Page {f.page} of {pages}</span>
            {f.page < pages ? <Link href={sessionsHref(f, { page: f.page + 1 })} className="btn ghost small">Next</Link> : null}
          </nav>
        ) : null}
      </Box>
    </>
  );
}
