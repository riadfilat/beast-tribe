import { CurrencyCircleDollar } from '@phosphor-icons/react/dist/ssr';
import type { Booking } from '@/lib/venue';
import { fmtDay, fmtTime, sar } from '@/lib/leader/sessions';
import { Empty, Pill } from '@/components/board/ui';
import { tickCourtPaid } from './actions';

/** Court bookings from yesterday on: who booked, who is playing, and who paid at the venue. */
export function Bookings({ bookings }: { bookings: Booking[] }) {
  if (!bookings.length) return <Empty title="No bookings yet" body="When members book your courts in the app, they show here with each player’s share." />;
  return (
    <div className="grid">
      {bookings.map((b) => (
        <div key={b.id} className="grid gap-2 py-3 rule-top first:border-t-0" style={{ opacity: b.cancelled ? 0.55 : 1 }}>
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-[14px]" style={{ fontFamily: 'var(--bt-head)' }}>{b.facility}</b>
            <span className="hint">{fmtDay(b.startsAt)} · {fmtTime(b.startsAt)} · booked by {b.booker}</span>
            <span className="ms-auto">{b.cancelled ? <Pill tone="bad">Cancelled</Pill> : <Pill tone={b.paid >= b.price && b.price > 0 ? 'good' : 'info'}>{sar(b.paid)} of {sar(b.price)} paid</Pill>}</span>
          </div>
          {!b.cancelled && b.eventId ? (
            <div className="flex flex-wrap gap-1.5">
              {b.people.map((p) => (
                <form key={p.id} action={tickCourtPaid.bind(null, b.eventId!, p.id, !p.paid)}>
                  <button className={`chip ${p.paid ? 'on' : ''}`}><CurrencyCircleDollar size={15} /> {p.name} · {p.paid ? `paid ${sar(p.amount)}` : `owes ${sar(p.amount)}`}</button>
                </form>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
