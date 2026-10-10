import Link from 'next/link';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { requireTeam } from '@/lib/leader/context';
import { change, insightsFor, loadOverview, loadSports } from '@/lib/leader/overview';
import { loadTeamSessions, sar } from '@/lib/leader/sessions';
import { Box, Empty, Insight, Kpi, PageTop } from '@/components/board/ui';
import { Bars } from '@/components/board/charts';
import { NavIcon } from '@/components/board/icons';
import { SessionRow } from '@/components/board/SessionRow';

const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function greeting() {
  const h = Number(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Riyadh' }));
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default async function LeaderHome() {
  const ctx = await requireTeam();
  const [o, sports, sessions] = await Promise.all([loadOverview(ctx.community.id), loadSports(), loadTeamSessions(ctx.community.id)]);
  const nameOf = (slug: string) => sports.find((s) => s.slug === slug)?.name ?? slug.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  const insights = insightsFor(o, nameOf);
  const fillPct = (f: number | null) => (f == null ? '–' : `${Math.round(f * 100)}%`);
  const fillDelta = o.thisWeek.fill != null && o.lastWeek.fill != null ? Math.round((o.thisWeek.fill - o.lastWeek.fill) * 100) : null;

  return (
    <>
      <PageTop
        title={`${greeting()}, ${ctx.name.split(' ')[0]}`}
        sub={`${o.members} member${o.members === 1 ? '' : 's'} in ${ctx.community.name} · the last 7 days`}
        action={
          <Link href="/leader/sessions/new" className="btn">
            <Plus size={16} weight="bold" /> Post a session
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Players this week" value={o.thisWeek.players} delta={change(o.thisWeek.players, o.lastWeek.players)} />
        <Kpi label="Sessions held" value={o.thisWeek.sessions} delta={change(o.thisWeek.sessions, o.lastWeek.sessions)} />
        <Kpi
          label="Spots filled"
          value={fillPct(o.thisWeek.fill)}
          delta={fillDelta != null ? { text: `${fillDelta > 0 ? '+' : ''}${fillDelta} pts vs last week`, dir: fillDelta > 0 ? 'up' : fillDelta < 0 ? 'down' : 'same' } : undefined}
          note={o.thisWeek.fill == null ? 'Shows once sessions have spots' : undefined}
        />
        {o.money ? (
          <Kpi label="Expected at the venue" value={o.money.expected.toLocaleString('en-US')} unit="SAR" note={o.money.expected ? `${sar(o.money.paid)} ticked as paid · 0% to Beast Tribe` : 'From paid sessions and courts · 0% to Beast Tribe'} />
        ) : (
          <Kpi label="Active members" value={o.active7} note={`of ${o.members} this week`} />
        )}
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
        <Box title="Players by day" icon="chart" sub="Orange is your busiest day.">
          <Bars data={o.days.map((d) => ({ label: SHORT[new Date(`${d.day}T12:00:00+03:00`).getUTCDay()], value: d.players }))} />
        </Box>
        <Box title="Worth knowing" icon="insights">
          <div className="grid gap-2.5">
            {insights.map((i) => (
              <Insight key={i.key} icon={<NavIcon name={i.icon} size={20} />} title={i.title} body={i.body} action={i.action} tone={i.tone} />
            ))}
          </div>
        </Box>
      </div>

      <Box title="Coming up" icon="sessions" action={<Link href="/leader/sessions" className="link text-[13px]">All sessions</Link>}>
        {sessions.upcoming.length ? (
          <div className="grid">
            {sessions.upcoming.slice(0, 6).map((s) => (
              <SessionRow key={s.id} s={s} sportName={nameOf(s.sport)} showMoney={ctx.isLeader} />
            ))}
          </div>
        ) : (
          <Empty title="No sessions coming up" body="Post one and it appears in the app for your members straight away." action={<Link href="/leader/sessions/new" className="btn small">Post a session</Link>} />
        )}
      </Box>
    </>
  );
}
