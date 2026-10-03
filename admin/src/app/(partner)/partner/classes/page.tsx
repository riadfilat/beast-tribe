import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requirePartner } from '@/lib/auth';
import { loadClub, fmtDay, fmtTime, type ClubClass } from '@/lib/club';
import { FillBar, Stat, btnPrimary, card } from '@/components/club/ui';

export const revalidate = 0;

function byDay(list: ClubClass[]) {
  const groups = new Map<string, ClubClass[]>();
  for (const c of list) {
    const k = fmtDay(c.startsAt);
    groups.set(k, [...(groups.get(k) || []), c]);
  }
  return [...groups.entries()];
}

export default async function ClassesPage({ searchParams }: { searchParams: { created?: string } }) {
  const partner = await requirePartner();
  if (partner.partner_type !== 'gym') redirect('/partner/dashboard');
  if (!partner.community_id) redirect('/partner/club');
  const club = await loadClub(partner, partner.community_id);
  if (!club) redirect('/partner/club');

  const upcoming = club.upcoming.filter((c) => c.startsAt.getTime() - Date.now() < 14 * 86400000);
  const later = club.upcoming.length - upcoming.length;
  const recent = club.past.filter((c) => !c.cancelled && Date.now() - c.startsAt.getTime() < 30 * 86400000);
  const unmarked = recent.filter((c) => c.isClass && c.going > 0 && c.attended === 0).length;
  const created = parseInt(searchParams.created || '') || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-sm text-gray-500">Members see these in the app under your club and book with one tap. Full classes fill the waitlist; a freed spot goes to the next in line.</p>
        </div>
        <Link href="/partner/classes/new" className={btnPrimary}>
          + New class
        </Link>
      </div>

      {created ? (
        <div className="rounded-lg bg-[#E8F5EE] text-[#25704F] text-sm px-4 py-3">
          {created === 1 ? 'Class scheduled.' : `${created} weekly classes scheduled.`} Your members can book now.
        </div>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Bookings, 30 days" value={club.month.bookings} />
        <Stat label="Average fill" value={club.month.fill != null ? `${Math.round(club.month.fill * 100)}%` : '—'} hint="Classes with a capacity" tone="aqua" />
        <Stat label="Classes held, 30 days" value={club.month.classesHeld} tone="orange" />
        <Stat label="Attendance to mark" value={unmarked} hint="Past classes with bookings" tone="coral" />
      </div>

      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Next two weeks</h2>
        {upcoming.length ? (
          <div className="space-y-4">
            {byDay(upcoming).map(([day, list]) => (
              <div key={day} className={card}>
                <p className="px-5 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{day}</p>
                <ul className="divide-y divide-gray-50">
                  {list.map((c) => (
                    <ClassRow key={c.id} c={c} />
                  ))}
                </ul>
              </div>
            ))}
            {later ? <p className="text-xs text-gray-400">+ {later} more scheduled after that.</p> : null}
          </div>
        ) : (
          <div className={`${card} p-10 text-center`}>
            <p className="text-gray-500 text-sm">Nothing scheduled. Post your weekly timetable once and repeat it for up to 12 weeks.</p>
            <Link href="/partner/classes/new" className={`${btnPrimary} mt-4`}>
              Schedule a class
            </Link>
          </div>
        )}
      </section>

      {recent.length ? (
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Last 30 days</h2>
          <div className={card}>
            <ul className="divide-y divide-gray-50">
              {recent.map((c) => (
                <ClassRow key={c.id} c={c} past />
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ClassRow({ c, past }: { c: ClubClass; past?: boolean }) {
  return (
    <li>
      <Link href={`/partner/classes/${c.id}`} className="flex flex-wrap md:flex-nowrap items-center gap-4 px-5 py-3 hover:bg-gray-50/60">
        <div className="w-24 flex-none">
          {past ? <p className="text-xs text-gray-400">{fmtDay(c.startsAt)}</p> : null}
          <p className="text-sm font-semibold text-gray-800 tabular-nums">
            {fmtTime(c.startsAt)}
            {c.endsAt ? <span className="text-gray-400 font-normal">–{fmtTime(c.endsAt)}</span> : null}
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${c.cancelled ? 'line-through text-gray-400' : 'text-gray-900'}`}>{c.title}</p>
          <p className="text-xs text-gray-400 truncate">
            {[c.byMember ? 'Set up by a member' : c.coach, c.sport, c.seriesId ? 'Weekly' : null].filter(Boolean).join(' · ') || 'Class'}
          </p>
        </div>
        {c.cancelled ? (
          <span className="text-xs font-medium text-[#9E3A33]">Cancelled</span>
        ) : past ? (
          <div className="w-40 text-right text-xs">
            {c.attended ? (
              <span className="text-gray-700">
                <span className="font-semibold tabular-nums">{c.attended}</span> of {c.going} came
              </span>
            ) : c.going ? (
              <span className="text-[#B86A10] font-medium">Mark attendance</span>
            ) : (
              <span className="text-gray-400">No bookings</span>
            )}
          </div>
        ) : (
          <div className="w-40 flex-none">
            <FillBar going={c.going} capacity={c.capacity} waitlist={c.waitlist} />
          </div>
        )}
      </Link>
    </li>
  );
}
