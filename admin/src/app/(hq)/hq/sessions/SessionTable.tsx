import Link from 'next/link';
import { Empty, FillBar, Pill } from '@/components/board/ui';
import { fmtDay, fmtTime } from '@/lib/leader/sessions';
import type { ListRow } from './data';

/** How a session is doing, in one pill. */
export function SessionStatus({ s }: { s: Pick<ListRow, 'cancelled' | 'startsAt' | 'capacity' | 'going'> }) {
  const now = Date.now();
  const left = s.capacity != null ? s.capacity - s.going : null;
  if (s.cancelled) return <Pill tone="bad">Cancelled</Pill>;
  if (s.startsAt.getTime() <= now) return <Pill tone="mute">Done</Pill>;
  if (left != null && left <= 0) return <Pill tone="good">Full</Pill>;
  if (s.going === 0 && s.startsAt.getTime() - now < 6 * 3600000) return <Pill tone="bad">No players yet</Pill>;
  if (left != null && left <= 2) return <Pill tone="warn">{left} spot{left === 1 ? '' : 's'} left</Pill>;
  return <Pill tone="info">Open</Pill>;
}

export function SessionTable({ rows, sportName, emptyAction }: { rows: ListRow[]; sportName: (slug: string) => string; emptyAction: React.ReactNode }) {
  if (!rows.length) {
    return <Empty title="No sessions here" body="Nothing matches these filters. Try another day or clear the search, or post a new session." action={emptyAction} />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="bt-table">
        <thead>
          <tr><th>Session</th><th>When</th><th>Where</th><th>Community</th><th>Players</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const who = s.womenOnly ? 'Women only' : s.menOnly ? 'Men only' : null;
            return (
              <tr key={s.id} style={{ opacity: s.cancelled ? 0.6 : 1 }}>
                <td className="strong">
                  <Link href={`/hq/sessions/${s.id}`} className="hover:underline">{s.title}</Link>
                  <span className="hint block">{[sportName(s.sport), s.coach, who].filter(Boolean).join(' · ')}</span>
                </td>
                <td className="num whitespace-nowrap">{fmtDay(s.startsAt)}<span className="hint block">{fmtTime(s.startsAt)}</span></td>
                <td>{s.place || '—'}{s.city ? <span className="hint block">{s.city}</span> : null}</td>
                <td>{s.inGroup ? <Pill tone="mute">A group</Pill> : s.community ?? '—'}</td>
                <td><FillBar going={s.going} capacity={s.capacity} /></td>
                <td><SessionStatus s={s} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
