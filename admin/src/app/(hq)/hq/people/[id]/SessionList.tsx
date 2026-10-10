import { Empty, Pill } from '@/components/board/ui';
import { shortDate } from '../shared';

const DAY = 86400000;

/** Counts from a person's bookings: sessions played (booked, not cancelled, already started), last 30 days, coming up. */
export function summarise(rsvps: any[]) {
  const now = Date.now();
  let played = 0;
  let played30 = 0;
  let upcoming = 0;
  let lastPlayed: number | null = null;
  for (const r of rsvps) {
    const e = r.event;
    if (!e || e.cancelled_at || r.status !== 'going') continue;
    const t = new Date(e.starts_at).getTime();
    if (t > now) {
      upcoming++;
      continue;
    }
    played++;
    if (t > now - 30 * DAY) played30++;
    lastPlayed = Math.max(lastPlayed ?? 0, t);
  }
  return { played, played30, upcoming, lastPlayed: lastPlayed ? new Date(lastPlayed) : null };
}

function state(r: any): { label: string; tone: 'good' | 'warn' | 'bad' | 'info' | 'mute' } {
  if (r.event?.cancelled_at) return { label: 'Cancelled', tone: 'mute' };
  if (r.status !== 'going') return { label: r.status === 'waitlist' ? 'Waiting list' : 'Not going', tone: 'mute' };
  if (new Date(r.event?.starts_at).getTime() > Date.now()) return { label: 'Coming up', tone: 'info' };
  return r.attended_at ? { label: 'Checked in', tone: 'good' } : { label: 'Played', tone: 'good' };
}

/** The person's 10 most recent session bookings. */
export function SessionList({ rsvps }: { rsvps: any[] }) {
  const list = rsvps.filter((r) => r.event).slice(0, 10);
  if (!list.length) return <Empty title="No sessions yet" body="When they book a session in the app, it shows up here." />;
  return (
    <div className="overflow-x-auto">
      <table className="bt-table">
        <thead><tr><th>Session</th><th>Community</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>
          {list.map((r) => {
            const st = state(r);
            return (
              <tr key={r.id}>
                <td className="strong">{r.event.title || 'Session'}</td>
                <td>{r.event.community?.name || '—'}</td>
                <td>{r.event.starts_at ? shortDate(r.event.starts_at) : '—'}</td>
                <td><Pill tone={st.tone}>{st.label}</Pill></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
