import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { requireLeader } from '@/lib/leader/context';
import { courtHeat, loadCourts } from '@/lib/leader/courts';
import { hoursLine } from '@/lib/venue';
import { sar } from '@/lib/leader/sessions';
import { Box, Empty, Notice, PageTop, Pill } from '@/components/board/ui';
import { Heat } from '@/components/board/charts';
import { setCourtActive } from './actions';

const AUDIENCE: Record<string, string> = { everyone: 'Everyone', women: 'Women only', community: 'Members only' };
const HOURS = [6, 8, 10, 12, 14, 16, 18, 19, 20, 21, 22, 23];

export default async function Courts({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const ctx = await requireLeader();
  if (!ctx.features.has('courts')) redirect('/leader/features');
  const courts = await loadCourts(ctx.businessId);
  const [{ cells, total }, q] = await Promise.all([courtHeat(courts.map((c) => c.id)), searchParams]);
  const morning = cells.reduce((t, d) => t + d.slice(6, 14).reduce((a, b) => a + b, 0), 0);

  return (
    <>
      <PageTop
        title="Courts"
        sub="Members book these in the app. The price is split between the players who join."
        action={<Link href="/leader/courts/new" className="btn"><Plus size={16} weight="bold" /> Add a court</Link>}
      />
      {q.saved ? <Notice tone="good">Saved. The app shows it straight away.</Notice> : null}
      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Box title="Your courts" icon="courts">
          {courts.length ? (
            <div className="grid gap-2">
              {courts.map((c) => (
                <div key={c.id} className="well p-3 grid grid-cols-[1fr_auto] gap-2 items-start" style={{ opacity: c.is_active ? 1 : 0.6 }}>
                  <div className="min-w-0">
                    <Link href={`/leader/courts/${c.id}`} className="block font-semibold text-[14px] truncate hover:underline" style={{ fontFamily: 'var(--bt-head)' }}>{c.name}</Link>
                    <span className="hint block">{hoursLine(c.hours)} · {c.slot_minutes} min · {AUDIENCE[c.audience] || 'Everyone'}</span>
                  </div>
                  <div className="text-right">
                    <b className="num" style={{ color: 'var(--marker)', fontFamily: 'var(--bt-head)' }}>{sar(c.price_sar)}</b>
                    <span className="hint block">{c.max_players > 1 ? `${sar(c.price_sar / c.max_players)} each for ${c.max_players}` : 'per booking'}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    {c.is_active ? <Pill tone="good">In the app</Pill> : <Pill tone="mute">Hidden</Pill>}
                    <form action={setCourtActive.bind(null, c.id, !c.is_active)}><button className="btn ghost small">{c.is_active ? 'Hide' : 'Show'}</button></form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="No courts yet" body="Add your first court with its price and opening hours. Members can book it in the app right away." action={<Link href="/leader/courts/new" className="btn small">Add a court</Link>} />
          )}
        </Box>
        <Box title="When courts are busy" icon="chart" sub={`${total} booking${total === 1 ? '' : 's'} in the last 4 weeks, all courts. Orange is always full.`}>
          <Heat cells={cells} hours={HOURS} days={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']} />
          {total >= 10 && morning / total < 0.2 ? (
            <Notice>Mornings are your quietest time ({Math.round((morning / total) * 100)}% of bookings). A lower morning price is the quickest way to fill them.</Notice>
          ) : null}
        </Box>
      </div>
    </>
  );
}
