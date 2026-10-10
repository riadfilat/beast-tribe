import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Check, CurrencyCircleDollar } from '@phosphor-icons/react/dist/ssr';
import { requireTeam } from '@/lib/leader/context';
import { loadSports } from '@/lib/leader/overview';
import { fmtDay, fmtTime, LEVELS, loadTeamSession, sar } from '@/lib/leader/sessions';
import { Box, Empty, FillBar, PageTop, Pill } from '@/components/board/ui';
import { cancelSession, setCame, setPaid } from '../actions';
import { initials } from '@/components/board/Shell';

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTeam();
  const { id } = await params;
  const [found, sports] = await Promise.all([loadTeamSession(ctx.community.id, id, ctx.isLeader), loadSports()]);
  if (!found) notFound();
  const { session: s, players } = found;
  const started = s.startsAt.getTime() <= Date.now();
  const canCancel = !s.cancelled && !started && (ctx.isLeader || s.createdBy === ctx.userId);
  const going = players.filter((p) => p.status === 'going');
  const waiting = players.filter((p) => p.status === 'waitlist');
  const owed = going.reduce((t, p) => t + (p.due?.amount ?? 0), 0);
  const paid = going.reduce((t, p) => t + (p.due?.paid ? p.due.amount : 0), 0);

  return (
    <>
      <Link href="/leader/sessions" className="link text-[13px] inline-flex items-center gap-1"><ArrowLeft size={14} /> Sessions</Link>
      <PageTop
        title={s.title}
        sub={[`${fmtDay(s.startsAt)} · ${fmtTime(s.startsAt)}`, s.place, sports.find((x) => x.slug === s.sport)?.name, s.level ? LEVELS[s.level] : 'All levels'].filter(Boolean).join(' · ')}
        action={s.cancelled ? <Pill tone="bad">Cancelled</Pill> : s.guestOpen ? <Pill tone="good">Open to {s.guestPrice != null || s.price ? 'guests' : 'everyone'}</Pill> : <Pill tone="info">Community only</Pill>}
      />
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
        <Box title={`Players (${going.length}${s.capacity ? ` of ${s.capacity}` : ''})`} icon="people" sub={started ? 'Tick who came.' : 'They see this session in the app.'} action={<FillBar going={going.length} capacity={s.capacity} />}>
          {going.length ? (
            <div className="grid">
              {going.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-3 py-2.5 rule-top first:border-t-0">
                  <span className="w-9 h-9 rounded-full grid place-items-center text-[12px] font-bold flex-none" style={{ background: 'var(--aqua)', color: 'var(--board)' }}>{initials(p.name)}</span>
                  <b className="flex-1 min-w-[120px] text-[14px]" style={{ fontFamily: 'var(--bt-head)' }}>{p.name}</b>
                  {started ? (
                    <form action={setCame.bind(null, s.id, p.id, !p.came)}>
                      <button className={`chip ${p.came ? 'on' : ''}`}><Check size={14} weight="bold" /> {p.came ? 'Came' : 'Mark came'}</button>
                    </form>
                  ) : null}
                  {p.due ? (
                    <form action={setPaid.bind(null, s.id, p.id, !p.due.paid)}>
                      <button className={`chip ${p.due.paid ? 'on' : ''}`}><CurrencyCircleDollar size={15} /> {p.due.paid ? `Paid ${sar(p.due.amount)}` : `Owes ${sar(p.due.amount)}`}</button>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <Empty title="No players yet" body="Members join from the Board in the app. Share it in your community chat to fill it faster." />
          )}
          {waiting.length ? <p className="hint">Waiting list: {waiting.map((p) => p.name).join(', ')}</p> : null}
        </Box>
        <div className="grid gap-4">
          {ctx.isLeader && (s.price || owed) ? (
            <Box title="Money at the venue" icon="chart" sub="Players pay you directly. Beast Tribe takes 0%.">
              <div className="grid grid-cols-2 gap-3">
                <div className="kpi"><span className="eyebrow">Expected</span><span className="block num text-[22px] font-extrabold">{sar(owed)}</span></div>
                <div className="kpi"><span className="eyebrow">Ticked paid</span><span className="block num text-[22px] font-extrabold">{sar(paid)}</span></div>
              </div>
            </Box>
          ) : null}
          {canCancel ? (
            <Box title="Cancel" sub="Everyone booked gets a notification.">
              <form action={cancelSession.bind(null, s.id)} className="grid gap-2.5">
                <input name="reason" className="input" maxLength={200} placeholder="Reason (optional), e.g. court closed" />
                {s.seriesId ? (
                  <select name="scope" className="input" defaultValue="one">
                    <option value="one">Only this one</option>
                    <option value="series">This and all the next weekly ones</option>
                  </select>
                ) : null}
                <button className="btn danger">Cancel session</button>
              </form>
            </Box>
          ) : null}
        </div>
      </div>
    </>
  );
}
