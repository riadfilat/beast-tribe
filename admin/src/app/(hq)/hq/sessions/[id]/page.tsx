import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import { requireRole } from '@/lib/auth';
import { eventToForm } from '@/lib/events';
import { fmtDay, fmtTime } from '@/lib/leader/sessions';
import { Box, Kpi, Notice, PageTop } from '@/components/board/ui';
import { updateSession } from '../actions';
import { loadCommunityList, loadSession, loadSessionCities, loadSportList } from '../data';
import { SessionForm } from '../SessionForm';
import { SessionStatus } from '../SessionTable';
import { Players } from './Players';
import { CancelBox, DeleteBox, Details } from './SideBoxes';

export const revalidate = 0;

const DONE: Record<string, string> = {
  posted: 'Posted. It shows in the app now.',
  saved: 'Changes saved.',
  cancelled: 'Cancelled. Everyone booked has been told.',
};

export default async function HqSession({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ done?: string }> }) {
  await requireRole('admin');
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [found, sports, communities, cities] = await Promise.all([loadSession(id), loadSportList(), loadCommunityList(), loadSessionCities()]);
  if (!found) notFound();
  const { event: e, community, creator, players } = found;

  const startsAt = new Date(e.starts_at);
  const started = startsAt.getTime() <= Date.now();
  const going = players.filter((p) => p.status === 'going');
  const inGroup = e.visibility === 'pack';
  // A session in a community that is switched off still shows its own community in the picker.
  const others = e.community_id && e.community_id !== communities.open?.id && !communities.others.some((c) => c.id === e.community_id)
    ? [...communities.others, { id: e.community_id, name: community ?? 'Current community' }]
    : communities.others;
  const sport = sports.find((s) => s.id === e.sport_id || s.slug === e.event_type)?.name;

  return (
    <>
      <Link href="/hq/sessions" className="link text-[13px] inline-flex items-center gap-1"><ArrowLeft size={14} /> Sessions</Link>
      <PageTop
        title={e.title}
        sub={[`${fmtDay(startsAt)} · ${fmtTime(startsAt)}`, e.location_name || e.gym_name, e.location_city, sport].filter(Boolean).join(' · ')}
        action={<SessionStatus s={{ cancelled: !!e.cancelled_at, startsAt, capacity: e.max_capacity, going: going.length }} />}
      />
      {sp.done && DONE[sp.done] ? <Notice tone="good">{DONE[sp.done]}</Notice> : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Going" value={going.length} note={e.max_capacity ? `of ${e.max_capacity} spots` : 'no limit on spots'} />
        <Kpi label="Spots left" value={e.max_capacity ? Math.max(0, e.max_capacity - going.length) : '—'} />
        <Kpi label="Waiting list" value={players.filter((p) => p.status === 'waitlist').length} />
        <Kpi label="Came" value={started ? going.filter((p) => p.came).length : '—'} note={started ? 'ticked by the host' : 'after it starts'} />
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
        <div className="grid gap-4">
          <Players players={players} capacity={e.max_capacity} started={started} />
          <Box title="Edit" sub={inGroup ? 'This session lives in a group, so it stays there.' : 'Changes show in the app straight away.'}>
            <SessionForm
              action={updateSession.bind(null, e.id)}
              initial={eventToForm(e, sports)}
              sports={sports}
              communities={{ open: communities.open, others }}
              cities={cities.map((c) => c.name)}
              showCommunity={!inGroup}
              mode="edit"
            />
          </Box>
        </div>
        <div className="grid gap-4">
          <Details e={e} community={community} creator={creator} />
          {!e.cancelled_at && !started ? <CancelBox id={e.id} series={!!e.class_series_id} /> : null}
          <DeleteBox id={e.id} />
        </div>
      </div>
    </>
  );
}
