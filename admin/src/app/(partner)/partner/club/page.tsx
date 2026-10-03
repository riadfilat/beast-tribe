import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ownsCommunity, requirePartner } from '@/lib/auth';
import { loadClub, fmtDay, fmtTime, ago } from '@/lib/club';
import { PLAN_STATUS_LABEL, planOf } from '@/lib/plans';
import { Icon } from '@/components/ui/Icon';
import SubmitButton from '@/components/SubmitButton';
import { Avatar, FillBar, HeatMap, SectionTitle, Stat, StatusChip, WeekBars, btnGhost, btnPrimary, card } from '@/components/club/ui';
import { createClub, newClubCode } from './actions';
import { loadBoard, loadChallenges, loadStepsSummary, stateOf, fmtDate } from '@/lib/wellness';

export const revalidate = 0;

export default async function ClubPage() {
  const partner = await requirePartner();
  if (!ownsCommunity(partner.partner_type)) redirect('/partner/dashboard');

  if (!partner.community_id) return <ClubSetup name={partner.business_name} />;

  const club = await loadClub(partner, partner.community_id);
  if (!club) return <ClubSetup name={partner.business_name} />;
  const [challenges, steps] = await Promise.all([loadChallenges(partner.community_id), loadStepsSummary(club.members.map((m) => m.id))]);
  const live = challenges.find((c) => stateOf(c) === 'live') || challenges.find((c) => stateOf(c) === 'upcoming') || null;
  const top = live ? (await loadBoard(live.id)).slice(0, 5) : [];

  const { counts, month } = club;
  const isCompany = partner.partner_type === 'company';
  const pct = (n: number) => (counts.members ? Math.round((n / counts.members) * 100) : 0);
  const nudge = club.members
    .filter((m) => m.status === 'at_risk' || m.status === 'quiet')
    .sort((a, b) => (b.lastActive?.getTime() ?? 0) - (a.lastActive?.getTime() ?? 0))
    .slice(0, 6);
  const plan = planOf(partner.plan);
  const trialDays = partner.plan_status === 'trial' && partner.trial_ends_at ? Math.max(0, Math.ceil((new Date(partner.trial_ends_at).getTime() - Date.now()) / 86400000)) : null;
  const seats = club.community.seat_limit;

  const receipt = [
    { n: month.bookings, l: 'Class bookings', d: 'Made in the app by your members' },
    { n: month.attended, l: 'Check-ins', d: month.classesMarked ? `Marked across ${month.classesMarked} classes` : 'Mark attendance on a class to track this' },
    { n: month.reactivated, l: 'Came back', d: 'Members active again after a month away' },
    { n: month.memberHosted, l: 'Member-led sessions', d: 'Runs and games members set up themselves' },
    { n: month.posts + month.comments, l: 'Club conversations', d: 'Posts and comments in your club feed' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{isCompany ? "Your community" : "Your club"}</p>
          <h1 className="text-2xl font-bold text-gray-900">{club.community.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {counts.members} member{counts.members === 1 ? '' : 's'}
            {seats ? ` of ${seats.toLocaleString()} seats` : ''} ·{' '}
            <Link href="/partner/plan" className="text-[#147070] hover:underline">
              {plan ? plan.name : 'No plan yet'} · {PLAN_STATUS_LABEL[partner.plan_status] || partner.plan_status}
              {trialDays != null ? ` (${trialDays} days left)` : ''}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`${card} px-4 py-2 flex items-center gap-3`}>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">Join code</p>
              <p className="font-mono text-lg font-bold tracking-[0.2em] text-brand-teal">{club.community.join_code || '—'}</p>
            </div>
            <form action={newClubCode}>
              <SubmitButton pendingLabel="…" className="text-xs text-gray-400 hover:text-gray-700 underline">
                New code
              </SubmitButton>
            </form>
          </div>
          <Link href="/partner/classes/new" className={btnPrimary}>
            {isCompany ? '+ New session' : '+ New class'}
          </Link>
        </div>
      </div>

      {/* What Beast Tribe did for you */}
      <section className="rounded-2xl bg-brand-teal text-white p-6 md:p-7 overflow-hidden relative">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-brand-aqua/10" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-aqua">Last 30 days with Beast Tribe</p>
        <h2 className="mt-1 text-xl font-bold max-w-xl">{isCompany ? "What your people did together" : "What your club did between visits"}</h2>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-5">
          {receipt.map((r) => (
            <div key={r.l}>
              <p className="text-3xl font-bold tabular-nums text-brand-orange">{r.n}</p>
              <p className="text-sm font-semibold mt-1">{r.l}</p>
              <p className="text-xs text-white/60 mt-0.5 leading-snug">{r.d}</p>
            </div>
          ))}
        </div>
        {month.soloMembers ? (
          <p className="mt-5 text-sm text-white/80 border-t border-white/10 pt-4">
            <span className="font-semibold text-white">{month.soloSessions} workouts</span> logged by {month.soloMembers} members training on their own with the app, on top of your classes.
          </p>
        ) : null}
      </section>

      {/* Health */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Members" value={counts.members} hint={`${counts.new30} joined in 30 days`} href="/partner/members" />
        <Stat label="Active this week" value={counts.active7} hint={`${pct(counts.active7)}% of members`} tone="aqua" href="/partner/members?status=active" />
        <Stat label="Active this month" value={counts.active30} hint={`${pct(counts.active30)}% of members`} tone="aqua" />
        <Stat label="Need a nudge" value={counts.atRisk + counts.quiet} hint={`${counts.atRisk} at risk · ${counts.quiet} quiet`} tone="coral" href="/partner/members?status=at_risk" />
      </section>

      <section className="grid lg:grid-cols-5 gap-4">
        <div className={`${card} p-5 lg:col-span-3`}>
          <SectionTitle title="Active members per week" />
          <WeekBars data={club.weekly.map((w) => ({ start: w.start, value: w.active }))} labelOf={(d) => fmtDay(d)} />
          <p className="mt-3 text-xs text-gray-400">A member counts once per week when they book, come to a class or session, or post in your club.</p>
        </div>
        <div className={`${card} p-5 lg:col-span-2`}>
          <SectionTitle title="Busiest times" />
          <HeatMap heat={club.heat} />
          <p className="mt-3 text-xs text-gray-400">Bookings by class start time, last 90 days (Riyadh time). Add classes where it glows.</p>
        </div>
      </section>


      {/* Wellness */}
      <section className={`${card} p-5`}>
        <SectionTitle
          title="Wellness"
          action={
            <Link href="/partner/challenges" className="text-sm text-[#147070] hover:underline">
              {live ? 'Challenges' : 'Start a challenge'}
            </Link>
          }
        />
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-gray-500">Average steps a day, last 7 days</p>
            <p className="text-3xl font-bold tabular-nums text-brand-teal mt-1">{steps.avgDaily != null ? steps.avgDaily.toLocaleString() : '—'}</p>
            <p className="text-xs text-gray-400 mt-1">
              {steps.avgDaily != null ? `Across ${steps.connected} members with Apple Health connected` : `Shown once 5 members connect Apple Health (${steps.connected} so far)`}
            </p>
          </div>
          <div className="md:col-span-2">
            {live ? (
              <>
                <p className="text-sm font-semibold text-gray-900">
                  {live.title} <span className="font-normal text-gray-400">· {fmtDate(live.startsOn)} – {fmtDate(live.endsOn)} · {live.entrants} joined</span>
                </p>
                <ol className="mt-2 space-y-1.5">
                  {top.map((r) => (
                    <li key={r.user_id} className="flex items-center gap-3 text-sm">
                      <span className={`w-5 font-bold tabular-nums ${r.place === 1 ? 'text-[#B86A10]' : 'text-gray-400'}`}>{r.place}</span>
                      <Avatar name={r.name} src={r.avatar_url} size={26} />
                      <span className="flex-1 text-gray-800">{r.name}</span>
                      <span className="tabular-nums font-semibold text-brand-teal">{r.steps.toLocaleString()}</span>
                    </li>
                  ))}
                  {!top.length ? <li className="text-sm text-gray-400">No one has joined yet.</li> : null}
                </ol>
              </>
            ) : (
              <p className="text-sm text-gray-500">Run a step challenge for a week or a month. People join from the app; only those who join appear on the ranking.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className={`${card} p-5`}>
          <SectionTitle
            title="Coming up"
            action={
              <Link href="/partner/classes" className="text-sm text-[#147070] hover:underline">
                All classes
              </Link>
            }
          />
          {club.upcoming.length ? (
            <ul className="divide-y divide-gray-50">
              {club.upcoming.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link href={`/partner/classes/${c.id}`} className="flex items-center gap-4 py-3 hover:bg-gray-50/60 -mx-2 px-2 rounded-lg">
                    <div className="w-20 flex-none">
                      <p className="text-xs text-gray-400">{fmtDay(c.startsAt)}</p>
                      <p className="text-sm font-semibold text-gray-800 tabular-nums">{fmtTime(c.startsAt)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${c.cancelled ? 'line-through text-gray-400' : 'text-gray-900'}`}>{c.title}</p>
                      <p className="text-xs text-gray-400 truncate">{c.byMember ? 'Set up by a member' : c.coach || c.sport || 'Class'}</p>
                    </div>
                    <div className="w-32 flex-none">
                      <FillBar going={c.going} capacity={c.capacity} waitlist={c.waitlist} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint text="No classes scheduled. Members can only book what you post." cta={{ href: '/partner/classes/new', label: 'Schedule a class' }} />
          )}
        </div>

        <div className={`${card} p-5`}>
          <SectionTitle
            title="Members to nudge"
            action={
              <Link href="/partner/members?status=at_risk" className="text-sm text-[#147070] hover:underline">
                See all
              </Link>
            }
          />
          {nudge.length ? (
            <ul className="divide-y divide-gray-50">
              {nudge.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-2.5">
                  <Avatar name={m.name} src={m.avatar} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                    <p className="text-xs text-gray-400">Last seen {ago(m.lastActive).toLowerCase()}</p>
                  </div>
                  <StatusChip status={m.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint text={counts.members ? 'Everyone has been active lately. Nice.' : 'Share your join code at the front desk to bring members in.'} />
          )}
          <p className="mt-3 text-xs text-gray-400">Quiet means nothing in 14–30 days; at risk means over 30. A short personal message from a coach is the easiest way to bring someone back.</p>
        </div>
      </section>
    </div>
  );
}

function EmptyHint({ text, cta }: { text: string; cta?: { href: string; label: string } }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-gray-500">{text}</p>
      {cta ? (
        <Link href={cta.href} className={`${btnGhost} mt-3`}>
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}

function ClubSetup({ name }: { name: string }) {
  const steps = [
    { t: 'We create your private club', d: `“${name}” gets its own space in the Beast Tribe app and a join code.` },
    { t: 'Members join with your code', d: 'Put it on the front desk, in your WhatsApp group, on receipts. Joining takes ten seconds.' },
    { t: 'Post classes, watch the club come alive', d: 'Members book, bring friends, set up their own runs and games, and talk between visits.' },
  ];
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Club Portal</p>
      <h1 className="text-2xl font-bold text-gray-900 mt-1">Open your club on Beast Tribe</h1>
      <p className="text-sm text-gray-500 mt-2">Your members already have their phones in the gym. Give them a place to book, train together and come back.</p>
      <ol className={`${card} mt-6 divide-y divide-gray-50`}>
        {steps.map((s, i) => (
          <li key={s.t} className="flex gap-4 p-5">
            <span className="w-7 h-7 rounded-full bg-brand-teal text-white text-sm font-bold flex items-center justify-center flex-none">{i + 1}</span>
            <div>
              <p className="font-semibold text-gray-900">{s.t}</p>
              <p className="text-sm text-gray-500 mt-0.5">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
      <form action={createClub} className="mt-6 flex items-center gap-3">
        <SubmitButton pendingLabel="Creating your club…" className={btnPrimary}>
          <Icon name="gym" size="sm" />
          Create my club
        </SubmitButton>
        <Link href="/for-gyms" className="text-sm text-[#147070] hover:underline">
          Why gyms use Beast Tribe
        </Link>
      </form>
    </div>
  );
}
