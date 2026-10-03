import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requirePartner } from '@/lib/auth';
import { can } from '@/lib/capabilities';
import { fmtDay, fmtTime } from '@/lib/club';
import { monthRange } from '@/lib/captains';
import { loadBookings, loadIncome, money, type Booking } from '@/lib/venue';
import SubmitButton from '@/components/SubmitButton';
import { ConfirmButton } from '@/components/ConfirmSubmit';
import { Avatar, Stat, btnPrimary, card } from '@/components/club/ui';
import { cancelBooking, markAllPaid, markPaid } from '../facilities/actions';

export const revalidate = 0;

export default async function BookingsPage() {
  const partner = await requirePartner();
  if (!can(partner.partner_type, 'facilities')) redirect('/partner/dashboard');
  const m = monthRange();
  const [bookings, income] = await Promise.all([loadBookings(partner.partner_id), loadIncome(partner.partner_id, m.from, m.to)]);
  const now = Date.now();
  const live = bookings.filter((b) => !b.cancelled);
  const upcoming = live.filter((b) => b.endsAt.getTime() >= now);
  const past = live.filter((b) => b.endsAt.getTime() < now).reverse();
  const unpaid = past.filter((b) => b.paid < b.price);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-500 max-w-2xl">Every booking with its players and what each one owes. Tick a player when they pay at the desk; they see “Paid” in the app.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Coming up" value={upcoming.length} />
        <Stat label="Bookings this month" value={income.courtBookings} tone="aqua" />
        <Stat label="Booked this month" value={money(income.courtDue)} tone="orange" />
        <Stat label="Marked paid" value={money(income.courtPaid)} hint={unpaid.length ? `${unpaid.length} past booking${unpaid.length === 1 ? '' : 's'} not fully paid` : undefined} tone={unpaid.length ? 'coral' : 'teal'} />
      </div>

      <Section title="Coming up" empty="No bookings coming up. Share your page: players find you in the app under Explore › Book a court." list={upcoming} upcoming />
      {past.length ? <Section title="Last 30 days" empty="" list={past} /> : null}

      {!bookings.length ? (
        <Link href="/partner/facilities" className={btnPrimary}>
          Check your facilities
        </Link>
      ) : null}
    </div>
  );
}

function Section({ title, list, empty, upcoming }: { title: string; list: Booking[]; empty: string; upcoming?: boolean }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-gray-900 mb-3">{title}</h2>
      {list.length ? (
        <div className="space-y-4">
          {list.map((b) => (
            <BookingCard key={b.id} b={b} upcoming={upcoming} />
          ))}
        </div>
      ) : (
        <div className={`${card} p-8 text-center text-sm text-gray-500`}>{empty}</div>
      )}
    </section>
  );
}

function BookingCard({ b, upcoming }: { b: Booking; upcoming?: boolean }) {
  const open = Math.max(0, b.players - b.people.length);
  const allPaid = b.people.length > 0 && b.people.every((p) => p.paid);
  return (
    <div className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4">
        <div>
          <p className="text-xs text-gray-500">
            {fmtDay(b.startsAt)} · <span className="tabular-nums">{fmtTime(b.startsAt)}–{fmtTime(b.endsAt)}</span>
          </p>
          <p className="font-semibold text-gray-900">{b.facility}</p>
          <p className="text-xs text-gray-500">Booked by {b.booker}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900 tabular-nums">{money(b.price)}</p>
          <p className="text-xs text-gray-500 tabular-nums">
            {b.players} players · {money(b.share)} each
          </p>
          <p className={`text-xs font-medium tabular-nums ${b.paid >= b.price ? 'text-[#25704F]' : 'text-[#B86A10]'}`}>{money(b.paid)} paid</p>
        </div>
      </div>

      <ul className="divide-y divide-gray-50 mt-3">
        {b.people.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-5 py-2.5">
            <Avatar name={p.name} src={p.avatar} size={28} />
            <span className="flex-1 text-sm text-gray-900">
              {p.name}
              {p.booker ? <span className="text-xs text-gray-400"> · organiser</span> : null}
            </span>
            <span className="text-sm text-gray-600 tabular-nums">{money(p.amount)}</span>
            {b.eventId ? (
              <form action={markPaid.bind(null, b.eventId, p.id, !p.paid)}>
                <SubmitButton
                  pendingLabel="…"
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${p.paid ? 'bg-[#E8F5EE] text-[#25704F] border-[#CDE9D9]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                >
                  {p.paid ? '✓ Paid' : 'Mark paid'}
                </SubmitButton>
              </form>
            ) : null}
          </li>
        ))}
        {open ? (
          <li className="px-5 py-2.5 text-xs text-gray-500">
            {open} spot{open === 1 ? '' : 's'} not taken yet · {money(open * b.share)} still to be covered. If they stay empty, the organiser covers them.
          </li>
        ) : null}
      </ul>

      {b.eventId ? (
        <div className="flex flex-wrap items-center justify-end gap-4 px-5 py-3 border-t border-gray-50">
          {!allPaid && b.people.length ? (
            <form action={markAllPaid.bind(null, b.eventId)}>
              <SubmitButton pendingLabel="Saving…" className="text-sm text-[#147070] hover:underline">
                Everyone paid
              </SubmitButton>
            </form>
          ) : null}
          {upcoming ? (
            <form action={cancelBooking.bind(null, b.eventId)}>
              <ConfirmButton confirmMessage="Cancel this booking and tell the players?" className="text-sm text-[#9E3A33] hover:underline">
                Cancel booking
              </ConfirmButton>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
