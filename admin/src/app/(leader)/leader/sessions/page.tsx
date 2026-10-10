import Link from 'next/link';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { requireTeam } from '@/lib/leader/context';
import { loadSports } from '@/lib/leader/overview';
import { loadTeamSessions } from '@/lib/leader/sessions';
import { Box, Empty, Notice, PageTop } from '@/components/board/ui';
import { SessionRow } from '@/components/board/SessionRow';

export default async function Sessions({ searchParams }: { searchParams: Promise<{ posted?: string }> }) {
  const ctx = await requireTeam();
  const [{ upcoming, past }, sports, q] = await Promise.all([loadTeamSessions(ctx.community.id), loadSports(), searchParams]);
  const nameOf = (slug: string) => sports.find((s) => s.slug === slug)?.name ?? slug;
  const posted = parseInt(q.posted || '');

  return (
    <>
      <PageTop
        title="Sessions"
        sub={`${upcoming.filter((s) => !s.cancelled).length} coming up · everything here shows in the app`}
        action={
          <Link href="/leader/sessions/new" className="btn">
            <Plus size={16} weight="bold" /> Post a session
          </Link>
        }
      />
      {posted > 0 ? <Notice tone="good">{posted > 1 ? `Posted ${posted} weekly sessions.` : 'Posted.'} Your members can join now.</Notice> : null}
      <Box title="Coming up" icon="sessions">
        {upcoming.length ? (
          <div className="grid">{upcoming.map((s) => <SessionRow key={s.id} s={s} sportName={nameOf(s.sport)} showMoney={ctx.isLeader} />)}</div>
        ) : (
          <Empty title="Nothing coming up" body="Post a session and it appears on the Board in the app straight away." action={<Link href="/leader/sessions/new" className="btn small">Post a session</Link>} />
        )}
      </Box>
      {past.length ? (
        <Box title="Last 30 days" icon="chart" sub="Open one to tick who came.">
          <div className="grid">{past.map((s) => <SessionRow key={s.id} s={s} sportName={nameOf(s.sport)} showMoney={ctx.isLeader} />)}</div>
        </Box>
      ) : null}
    </>
  );
}
