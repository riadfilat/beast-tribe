import Link from 'next/link';
import { requirePartner } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { can, kindOf, navFor, sessionWord } from '@/lib/capabilities';
import { loadClub, loadSessions, fmtDay, fmtTime } from '@/lib/club';
import { monthRange } from '@/lib/format';
import { loadBookings, loadFacilities, loadIncome, money } from '@/lib/venue';
import { Icon, type IconName } from '@/components/ui/Icon';
import { SectionTitle, Stat, btnPrimary, card } from '@/components/club/ui';

export const revalidate = 0;

interface Todo {
  text: string;
  href: string;
  cta: string;
}

interface Next {
  id: string;
  at: Date;
  title: string;
  sub: string;
  href: string;
  tag?: string;
}

// One overview for every kind of partner. Each block appears only if the partner runs that thing:
// a community, sessions (classes or events), guest spots, courts, workouts.
export default async function PartnerOverviewPage() {
  const partner = await requirePartner();
  const type = partner.partner_type;
  const kind = kindOf(type);
  const db = createAdminClient();
  const m = monthRange();
  const now = Date.now();

  const hasCommunity = can(type, 'community');
  const hasFacilities = can(type, 'facilities');
  const hasGuests = can(type, 'guests');
  const hasSessions = can(type, 'classes');
  const hasWorkouts = can(type, 'workouts');

  const [club, facilities, bookings, income, sessions, workoutsRes, usesRes] = await Promise.all([
    hasCommunity && partner.community_id ? loadClub(partner, partner.community_id) : Promise.resolve(null),
    hasFacilities ? loadFacilities(partner.partner_id) : Promise.resolve([]),
    hasFacilities ? loadBookings(partner.partner_id) : Promise.resolve([]),
    hasFacilities || hasGuests ? loadIncome(partner.partner_id, m.from, m.to) : Promise.resolve(null),
    // A club's sessions come from the club (same cached load); everyone else's from their own posts.
    hasSessions && (!hasCommunity || partner.community_id) ? loadSessions(partner) : Promise.resolve(null),
    hasWorkouts ? db.from('workouts').select('id, status').eq('author_partner_id', partner.partner_id) : Promise.resolve({ data: [] as any[] }),
    hasWorkouts
      ? db.from('workout_logs').select('id', { count: 'exact', head: true }).eq('counted', true).eq('coach_partner_id', partner.partner_id).gte('completed_at', `${m.from}T00:00:00+03:00`)
      : Promise.resolve({ count: 0 }),
  ]);
  const workouts = ((workoutsRes as any).data || []) as any[];
  const uses = (usesRes as any).count || 0;

  // Guests who came to a past class and are not marked paid yet.
  let guestsUnpaid = 0;
  if (hasGuests && partner.community_id) {
    const { data: past } = await db.from('events').select('id').eq('community_id', partner.community_id).eq('guest_open', true).is('cancelled_at', null).lt('starts_at', new Date().toISOString()).gte('starts_at', new Date(now - 30 * 86400000).toISOString());
    const ids = (past || []).map((e: any) => e.id);
    if (ids.length) {
      const { count } = await db.from('session_dues').select('user_id', { count: 'exact', head: true }).in('event_id', ids).eq('kind', 'guest').is('paid_at', null);
      guestsUnpaid = count || 0;
    }
  }

  const liveBookings = bookings.filter((b) => !b.cancelled);
  const upcomingBookings = liveBookings.filter((b) => b.endsAt.getTime() >= now);
  const unpaidBookings = liveBookings.filter((b) => b.endsAt.getTime() < now && b.paid < b.price);
  const coming = sessions ? sessions.upcoming.filter((c) => !c.cancelled) : [];
  const one = sessionWord(type);
  const unmarked = sessions ? sessions.past.filter((c) => !c.cancelled && c.isClass && c.going > 0 && c.attended === 0 && now - c.startsAt.getTime() < 30 * 86400000).length : 0;
  const guestClasses = sessions ? sessions.upcoming.filter((c) => c.guestOpen && !c.cancelled).length : 0;

  // ── What needs you today ──
  const todo: Todo[] = [];
  if (hasCommunity && !club) todo.push({ text: `Create your ${kind.community.toLowerCase()} so your ${kind.people.toLowerCase()} can join with a code.`, href: '/partner/club', cta: 'Set it up' });
  if (hasFacilities && !facilities.length) todo.push({ text: 'List your first court or facility with its hours and price. It can be booked right away.', href: '/partner/facilities/new', cta: 'Add it' });
  if (unpaidBookings.length) todo.push({ text: `${unpaidBookings.length} past booking${unpaidBookings.length === 1 ? ' is' : 's are'} not fully marked paid.`, href: '/partner/bookings', cta: 'Open bookings' });
  if (guestsUnpaid) todo.push({ text: `${guestsUnpaid} guest${guestsUnpaid === 1 ? '' : 's'} from recent classes ${guestsUnpaid === 1 ? 'is' : 'are'} not marked paid.`, href: '/partner/classes', cta: 'Open classes' });
  if (unmarked) todo.push({ text: `${unmarked} past ${unmarked === 1 ? `${one} has` : `${kind.sessions.toLowerCase()} have`} no attendance marked.`, href: '/partner/classes', cta: 'Mark who came' });
  if (club && club.counts.atRisk) todo.push({ text: `${club.counts.atRisk} ${kind.people.toLowerCase()} ${club.counts.atRisk === 1 ? 'has' : 'have'} done nothing for over 30 days.`, href: '/partner/members?status=at_risk', cta: 'See who' });
  if (sessions && !coming.length) todo.push({ text: `Nothing is scheduled. Post this week's ${kind.sessions.toLowerCase()}.`, href: '/partner/classes/new', cta: 'Schedule' });
  if (club && hasGuests && coming.length && !guestClasses) todo.push({ text: 'None of your coming classes is open to guests. Open a few spots to people outside your community for a guest price.', href: '/partner/classes/new', cta: 'Open a class' });
  if (hasWorkouts && !hasCommunity && !workouts.length) todo.push({ text: 'Write your first workout for the Train tab. You are paid each time a member finishes one.', href: '/partner/workouts/new', cta: 'Write it' });

  // ── Coming up, across everything this partner runs ──
  const next: Next[] = [
    ...coming.map((c) => ({
      id: `c${c.id}`,
      at: c.startsAt,
      title: c.title,
      sub: `${c.going}${c.capacity ? ` of ${c.capacity}` : ''} booked${c.waitlist ? ` · ${c.waitlist} waiting` : ''}`,
      href: `/partner/classes/${c.id}`,
      tag: c.guestOpen ? (c.guestPrice ? `Guests SAR ${c.guestPrice}` : 'Guests welcome') : undefined,
    })),
    ...upcomingBookings
      .filter((b) => !coming.some((c) => c.id === b.eventId))
      .map((b) => ({ id: `b${b.id}`, at: b.startsAt, title: b.facility, sub: `${b.booker} · ${b.people.length} of ${b.players} players · ${money(b.share)} each`, href: '/partner/bookings', tag: 'Court booking' })),
  ]
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, 8);

  const outside = income ? income.guestDue + income.courtDue : 0;
  const outsidePaid = income ? income.guestPaid + income.courtPaid : 0;
  const links = navFor(type).filter((n) => n.href !== '/partner/dashboard');

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{kind.label}</p>
          <h1 className="text-2xl font-bold text-gray-900">{partner.business_name}</h1>
          <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
            <Icon name={partner.is_verified ? 'success' : 'pending'} size="sm" className={partner.is_verified ? 'text-brand-aqua' : 'text-gray-400'} />
            {partner.is_verified ? 'Verified partner' : 'Verification pending'}
            {club ? ` · ${club.community.name}` : ''}
          </p>
        </div>
        {sessions ? (
          <Link href="/partner/classes/new" className={btnPrimary}>
            + New {one}
          </Link>
        ) : hasFacilities ? (
          <Link href="/partner/facilities/new" className={btnPrimary}>
            + Add a facility
          </Link>
        ) : null}
      </div>

      {/* Today */}
      <section>
        <SectionTitle title="Needs you today" />
        <div className={card}>
          {todo.length ? (
            <ul className="divide-y divide-gray-50">
              {todo.map((t) => (
                <li key={t.text} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-orange flex-none" />
                  <span className="flex-1 min-w-[12rem] text-sm text-gray-800">{t.text}</span>
                  <Link href={t.href} className="text-sm font-medium text-[#147070] hover:underline">
                    {t.cta}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-5 text-sm text-gray-500">Nothing waiting on you. Everything is marked and scheduled.</p>
          )}
        </div>
      </section>

      {/* Numbers, by what this partner runs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {club ? <Stat label={kind.people} value={club.counts.members} hint={`${club.counts.new30} joined in 30 days`} href="/partner/members" /> : null}
        {club ? <Stat label="Active this week" value={club.counts.active7} hint={club.counts.members ? `${Math.round((club.counts.active7 / club.counts.members) * 100)}% of ${kind.people.toLowerCase()}` : undefined} tone="aqua" href="/partner/members" /> : null}
        {sessions && !club ? <Stat label="Coming up" value={coming.length} hint={`Your ${kind.sessions.toLowerCase()}`} href="/partner/classes" /> : null}
        {sessions ? <Stat label="Bookings, 30 days" value={sessions.month.bookings} hint={sessions.month.fill != null ? `${Math.round(sessions.month.fill * 100)}% average fill` : undefined} tone="orange" href="/partner/classes" /> : null}
        {hasGuests && income ? <Stat label="Guests this month" value={income.guestBookings} hint={income.guestBookings ? `${money(income.guestDue)} · ${money(income.guestPaid)} paid` : 'People outside your community'} tone="orange" href="/partner/classes" /> : null}
        {hasFacilities && income ? <Stat label="Court bookings this month" value={income.courtBookings} hint={`${upcomingBookings.length} coming up`} href="/partner/bookings" /> : null}
        {hasFacilities && income ? <Stat label="Booked this month" value={money(income.courtDue)} hint={`${money(income.courtPaid)} marked paid`} tone="aqua" href="/partner/bookings" /> : null}
        {hasWorkouts && !hasCommunity ? <Stat label="Workouts published" value={workouts.filter((w) => w.status === 'published').length} href="/partner/workouts" /> : null}
        {hasWorkouts && !hasCommunity ? <Stat label="Finished this month" value={uses} hint="Times members completed your workouts" tone="aqua" href="/partner/workouts" /> : null}
      </section>

      {/* The new market: people from outside the community */}
      {income && (hasGuests || hasFacilities) ? (
        <section className={`${card} p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="text-base font-semibold text-gray-900">From outside your community · {m.label}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {hasGuests && hasFacilities
                  ? 'Guests who joined your classes and players who booked your facilities. They found you in the app; they pay you directly.'
                  : hasGuests
                    ? 'People who are not your members, joined a class for the guest price, and pay at your desk.'
                    : 'Players who booked your facilities in the app. Each one sees their own share and pays you directly.'}{' '}
                Beast Tribe takes nothing from it.
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold tabular-nums text-brand-teal">{money(outside)}</p>
              <p className="text-xs text-gray-500 tabular-nums">{money(outsidePaid)} marked paid</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            {hasGuests ? (
              <Link href="/partner/classes" className="rounded-lg border border-gray-100 p-4 hover:border-gray-200 transition block">
                <p className="text-xs font-medium text-gray-500">Guest classes</p>
                <p className="text-lg font-semibold text-gray-900 tabular-nums mt-0.5">
                  {income.guestBookings} guest{income.guestBookings === 1 ? '' : 's'} · {money(income.guestDue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{guestClasses ? `${guestClasses} coming class${guestClasses === 1 ? ' is' : 'es are'} open to guests` : 'No coming class is open to guests yet'}</p>
              </Link>
            ) : null}
            {hasFacilities ? (
              <Link href="/partner/bookings" className="rounded-lg border border-gray-100 p-4 hover:border-gray-200 transition block">
                <p className="text-xs font-medium text-gray-500">Courts and facilities</p>
                <p className="text-lg font-semibold text-gray-900 tabular-nums mt-0.5">
                  {income.courtBookings} booking{income.courtBookings === 1 ? '' : 's'} · {money(income.courtDue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {facilities.filter((f) => f.is_active).length} listed · {upcomingBookings.length} coming up
                </p>
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Coming up */}
      <section>
        <SectionTitle title="Coming up" />
        <div className={card}>
          {next.length ? (
            <ul className="divide-y divide-gray-50">
              {next.map((n) => (
                <li key={n.id}>
                  <Link href={n.href} className="flex flex-wrap items-center gap-4 px-5 py-3 hover:bg-gray-50/60">
                    <div className="w-32 flex-none">
                      <p className="text-xs text-gray-400">{fmtDay(n.at)}</p>
                      <p className="text-sm font-semibold text-gray-800 tabular-nums">{fmtTime(n.at)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                      <p className="text-xs text-gray-500 truncate">{n.sub}</p>
                    </div>
                    {n.tag ? <span className="rounded-full bg-[#FFF1DC] text-[#9A5A0B] px-2 py-0.5 text-[11px] font-semibold">{n.tag}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-sm text-gray-500">Nothing scheduled yet.</p>
          )}
        </div>
      </section>

      {/* Everything this partner can open */}
      <section>
        <SectionTitle title="Your tools" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`${card} px-4 py-3 flex items-center gap-3 hover:border-gray-200 transition`}>
              <Icon name={l.icon as IconName} className="text-[#147070]" />
              <span className="text-sm font-medium text-gray-800">{l.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
