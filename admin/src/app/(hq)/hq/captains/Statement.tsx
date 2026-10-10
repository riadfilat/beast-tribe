import Link from 'next/link';
import type { StatementRow } from '@/lib/captains';
import { sar, todayRiyadh } from '@/lib/format';
import { Box, Empty } from '@/components/board/ui';
import { PrintButton } from './PrintButton';

type Month = { ym: string; label: string; prev: string; next: string };
export type Totals = { sessions: number; joined: number; hours: number; billed: number; ours: number; payout: number };

export function totals(rows: StatementRow[]): Totals {
  return rows.reduce((t, r) => ({ sessions: t.sessions + r.sessions, joined: t.joined + r.joined, hours: t.hours + r.hours, billed: t.billed + r.billed, ours: t.ours + r.ourShare, payout: t.payout + r.payout }), {
    sessions: 0,
    joined: 0,
    hours: 0,
    billed: 0,
    ours: 0,
    payout: 0,
  });
}

/** The month's money: what each community owes and what each captain is paid. */
export function Statement({ month, rows, total }: { month: Month; rows: StatementRow[]; total: Totals }) {
  const nav = (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Link href={`/hq/captains?m=${month.prev}`} className="btn ghost small">Earlier</Link>
      {month.ym < todayRiyadh().slice(0, 7) ? <Link href={`/hq/captains?m=${month.next}`} className="btn ghost small">Later</Link> : null}
      <PrintButton label="Print statement" />
    </div>
  );
  return (
    <Box title={`Statement, ${month.label}`} icon="chart" sub="Sessions held this period, counted by their length (15 minutes to 4 hours each). Cancelled sessions don’t count." action={nav}>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="bt-table">
            <thead>
              <tr>
                <th>Community</th>
                <th>Captain</th>
                <th className="!text-right">Sessions</th>
                <th className="!text-right">People joined</th>
                <th className="!text-right">Hours</th>
                <th className="!text-right">Rate</th>
                <th className="!text-right">Community pays</th>
                <th className="!text-right">Our share</th>
                <th className="!text-right">Captain gets</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.communityId}-${r.userId}`}>
                  <td className="strong">{r.community}</td>
                  <td className="strong">{r.name}</td>
                  <td className="num text-right">{r.sessions}</td>
                  <td className="num text-right">{r.joined}</td>
                  <td className="num text-right">{r.hours.toFixed(1)}</td>
                  <td className="num text-right">{r.rate ? sar(r.rate) : <span style={{ color: 'var(--bad)' }}>Not set</span>}</td>
                  <td className="num text-right strong">{sar(r.billed)}</td>
                  <td className="num text-right" style={{ color: 'var(--aqua)' }}>
                    {sar(r.ourShare)} <span className="hint">({r.cutPct}%)</span>
                  </td>
                  <td className="num text-right">{sar(r.payout)}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '1px solid var(--rule-strong)' }}>
                <td className="strong" colSpan={2}>Total</td>
                <td className="num text-right strong">{total.sessions}</td>
                <td className="num text-right strong">{total.joined}</td>
                <td className="num text-right strong">{total.hours.toFixed(1)}</td>
                <td />
                <td className="num text-right strong">{sar(total.billed)}</td>
                <td className="num text-right strong" style={{ color: 'var(--aqua)' }}>{sar(total.ours)}</td>
                <td className="num text-right strong">{sar(total.payout)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="No captain sessions this month" body={`No captain sessions were held in ${month.label}. Use Earlier to look at past months.`} />
      )}
      <p className="hint">Billing and payouts happen outside the app: invoice each community its total and pay each captain theirs.</p>
    </Box>
  );
}
