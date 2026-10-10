import Link from 'next/link';
import { health, loadAttention, loadCities, loadCommunities, loadDays, loadDaySessions, loadLive, loadMix } from '@/lib/hq/data';
import { loadSports } from '@/lib/leader/overview';
import { cityPlace } from '@/lib/cities';
import { Box, Empty, Kpi, Pill } from '@/components/board/ui';
import { HBar, Spark } from '@/components/board/charts';
import { Timeline } from '@/components/board/Timeline';
import { CityMap } from '@/components/board/CityMap';
import { change } from '@/lib/leader/overview';

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const riyadhNow = () => new Date(Date.now() + 3 * 3600000);
const time = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Riyadh' }).toLowerCase();

/** The command center's Activity view: what members are doing in the app, today and this week. */
export async function ActivityView({ city, day, link }: { city: string | null; day: string | null; link: (q: Record<string, string | null>) => string }) {
  const [live, days, cities, comms, attention, mix, sports] = await Promise.all([loadLive(city), loadDays(city), loadCities(), loadCommunities(city), loadAttention(), loadMix(city), loadSports()]);
  const today = days[0]?.day;
  const chosen = days.find((d) => d.day === day) ?? days[0];
  const sessions = chosen ? await loadDaySessions(chosen.day, city) : [];
  const nameOf = (s: string) => sports.find((x) => x.slug === s)?.name ?? s.replace(/_/g, ' ');
  const n = riyadhNow();
  const mapCities = cities.flatMap((c) => {
    const p = cityPlace(c.city);
    return p ? [{ key: c.city, name: p.name, lat: p.lat, lng: p.lng, members: c.members, active: c.active, live: c.live }] : [];
  });
  const totalPlatforms = Object.values(mix.platforms).reduce((a, b) => a + b, 0);
  const totalLang = Object.values(mix.languages).reduce((a, b) => a + b, 0);
  const attentionCount = attention.courts_unbooked.length + attention.empty_soon.length + (attention.requests ? 1 : 0) + (attention.reports ? 1 : 0) + (attention.photos ? 1 : 0) + attention.slowing.length;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi label="Active today" value={live.active_today} note={`${live.active_week} this week · of ${live.members}`} />
        <Kpi label="Sessions today" value={live.sessions_today} note={live.live_now ? `${live.live_now} on right now` : 'none on right now'} />
        <Kpi label="Players booked today" value={live.players_today} />
        <Kpi label="New members this week" value={live.new_members_week} delta={change(live.new_members_week, live.new_members_prev_week)} />
        <Kpi label="Communities" value={live.communities} note={live.requests_waiting ? `${live.requests_waiting} request${live.requests_waiting === 1 ? '' : 's'} waiting` : 'no requests waiting'} />
      </div>

      <nav aria-label="Pick a day" className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
        {days.map((d) => {
          const on = d.day === chosen?.day;
          const max = Math.max(1, ...d.blocks);
          return (
            <Link key={d.day} href={link({ day: d.day === today ? null : d.day })} className="rounded-xl px-1.5 py-2 grid gap-1 justify-items-center" style={{ border: `1.5px solid ${on ? 'var(--marker)' : 'var(--rule)'}`, background: on ? 'rgba(232,143,36,.10)' : 'transparent' }}>
              <span className="eyebrow">{d.day === today ? 'Today' : WD[new Date(`${d.day}T12:00:00+03:00`).getUTCDay()]}</span>
              <span className="num text-[18px] font-extrabold" style={{ fontFamily: 'var(--bt-head)' }}>{d.sessions}</span>
              <span className="w-full h-5 flex items-end gap-[2px]" aria-hidden>
                {d.blocks.slice(3).map((b, i) => <i key={i} className="flex-1 rounded-sm" style={{ height: `${(b / max) * 100}%`, minHeight: b ? 2 : 0, background: 'var(--aqua)', opacity: 0.8 }} />)}
              </span>
              <span className="hint num">{d.players} players</span>
            </Link>
          );
        })}
      </nav>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
        <Box title="Where members are" icon="places" sub="Members by city; aqua = active this week, orange = sessions on now. City only, never the exact place. Tap a city to filter.">
          {mapCities.length ? <CityMap cities={mapCities} selected={city} /> : <Empty title="No cities yet" body="Members appear here once they set their city or open the app." />}
        </Box>
        <Box title="Needs attention" icon="safety" sub={attentionCount ? `${attentionCount} thing${attentionCount === 1 ? '' : 's'}` : 'All clear'}>
          <div className="grid gap-2">
            {attention.courts_unbooked.map((e) => <Alert key={e.id} tone="bad" title="Court not booked yet" body={`${e.title} · ${time(e.starts_at)}${e.community ? ` · ${e.community}` : ''}`} />)}
            {attention.empty_soon.map((e) => <Alert key={e.id} tone="warn" title="No players yet, starts soon" body={`${e.title} · ${time(e.starts_at)}${e.community ? ` · ${e.community}` : ''}`} />)}
            {attention.requests ? <Alert tone="warn" title={`${attention.requests} community request${attention.requests === 1 ? '' : 's'} waiting`} body="People asking for a community of their own" href="/leads" action="Review" /> : null}
            {attention.reports ? <Alert tone="bad" title={`${attention.reports} report${attention.reports === 1 ? '' : 's'} to review`} body="Posts or people reported by members" href="/moderation" action="Open" /> : null}
            {attention.photos ? <Alert tone="warn" title={`${attention.photos} photo${attention.photos === 1 ? '' : 's'} to check`} body="Waiting in the photo queue" href="/moderation" action="Open" /> : null}
            {attention.slowing.map((c) => <Alert key={c.id} tone="info" title={`${c.name} is slowing down`} body={`${c.recent} sessions in the last 2 weeks, ${c.before} the 2 before`} href="/hq/communities" action="See" />)}
            {!attentionCount ? <p className="hint">Nothing needs you right now.</p> : null}
          </div>
        </Box>
      </div>

      <Box title={`${chosen?.day === today ? 'Today’s' : `${WD[new Date(`${chosen?.day}T12:00:00+03:00`).getUTCDay()]}’s`} sessions by hour`} icon="sessions" sub="Green full · aqua filling · yellow under half · red no players yet">
        {sessions.length ? <Timeline sessions={sessions} now={chosen?.day === today ? n.getUTCHours() + n.getUTCMinutes() / 60 : null} sportName={nameOf} /> : <Empty title="No sessions this day" body="When leaders and members post sessions, they line up here by hour." />}
      </Box>

      <Box title="Communities" icon="communities" sub="Health compares the last two weeks of sessions with the two before." action={<Link href="/hq/communities" className="link text-[13px]">Manage</Link>}>
        {comms.length ? (
          <div className="overflow-x-auto">
            <table className="bt-table">
              <thead><tr><th>Community</th><th>Leader</th><th>City</th><th>Members</th><th>Sessions / week</th><th>Spots filled</th><th>7 weeks</th><th>Health</th></tr></thead>
              <tbody>
                {[...comms].sort((a, b) => b.sessions_week + b.upcoming_week - (a.sessions_week + a.upcoming_week) || b.members - a.members).map((c) => {
                  const h = health(c);
                  return (
                    <tr key={c.id}>
                      <td className="strong">{c.name}</td>
                      <td>{c.leaders.join(', ') || <span className="pill warn">No leader</span>}</td>
                      <td>{c.city || '—'}</td>
                      <td className="num">{c.members}</td>
                      <td className="num">{c.sessions_week}{c.upcoming_week ? <span className="hint"> · {c.upcoming_week} coming</span> : null}</td>
                      <td className="num">{c.fill == null ? '—' : `${Math.round(c.fill * 100)}%`}</td>
                      <td><Spark values={c.weekly} /></td>
                      <td><Pill tone={h.tone}>{h.label}</Pill></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No communities here yet" body="Add a leader and their community from Leaders & communities." />
        )}
      </Box>

      <div className="grid lg:grid-cols-3 gap-4 items-start">
        <Box title="What people play" icon="gym" sub="Players in the last 30 days">
          {mix.sports.length ? <div className="grid gap-2">{mix.sports.map((s) => <HBar key={s.sport} label={nameOf(s.sport)} value={s.players} max={mix.sports[0].players} />)}</div> : <p className="hint">No sessions in the last 30 days.</p>}
        </Box>
        <Box title="Phones and language" icon="people" sub="People who opened the app in the last 30 days">
          {totalPlatforms ? (
            <div className="grid gap-2">
              <HBar label="iPhone" value={mix.platforms.ios ?? 0} max={totalPlatforms} text={`${Math.round(((mix.platforms.ios ?? 0) / totalPlatforms) * 100)}%`} />
              <HBar label="Android" value={mix.platforms.android ?? 0} max={totalPlatforms} text={`${Math.round(((mix.platforms.android ?? 0) / totalPlatforms) * 100)}%`} />
              {totalLang ? <HBar label="Arabic" value={mix.languages.ar ?? 0} max={totalLang} text={`${Math.round(((mix.languages.ar ?? 0) / totalLang) * 100)}%`} /> : null}
              {totalLang ? <HBar label="English" value={mix.languages.en ?? 0} max={totalLang} text={`${Math.round(((mix.languages.en ?? 0) / totalLang) * 100)}%`} /> : null}
            </div>
          ) : <p className="hint">Fills in as members open the updated app (from 10 October 2026).</p>}
        </Box>
        <Box title="New members per week" icon="chart" sub="Last 8 weeks">
          <Spark values={mix.growth} width={300} height={80} fluid />
          <p className="hint">{mix.growth[mix.growth.length - 1] ?? 0} this week · {mix.growth.reduce((a, b) => a + b, 0)} in 8 weeks</p>
        </Box>
      </div>
    </>
  );
}

function Alert({ tone, title, body, href, action }: { tone: 'bad' | 'warn' | 'info'; title: string; body: string; href?: string; action?: string }) {
  const colour = tone === 'bad' ? 'var(--bad)' : tone === 'warn' ? 'var(--warn)' : 'var(--aqua)';
  return (
    <div className="well grid grid-cols-[4px_1fr_auto] gap-3 items-center pe-3 overflow-hidden">
      <i className="self-stretch" style={{ background: colour }} />
      <span className="py-2.5 min-w-0">
        <b className="block text-[13px]" style={{ fontFamily: 'var(--bt-head)' }}>{title}</b>
        <span className="hint block truncate">{body}</span>
      </span>
      {href ? <Link href={href} className="btn ghost small">{action}</Link> : null}
    </div>
  );
}
