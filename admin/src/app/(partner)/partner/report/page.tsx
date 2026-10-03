import { redirect } from 'next/navigation';
import { ownsCommunity, requirePartner } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { loadClub, fmtDay } from '@/lib/club';
import { fetchAll } from '@/lib/fetch-all';
import { METRIC_LABEL, fmtDate, fmtScore, loadBoard, loadChallenges, loadStepsSummary, loadTeamBoard, loadTeams, stateOf } from '@/lib/wellness';
import { Lockup } from '@/components/brand/Logo';
import { WeekBars } from '@/components/club/ui';
import PrintButton from '@/components/club/PrintButton';

export const revalidate = 0;

// A one-page summary of the last 30 days, for the owner or HR to print or save as a PDF.
// Community activity only: nothing a member does on their own is in it.
export default async function ReportPage() {
  const partner = await requirePartner();
  if (!ownsCommunity(partner.partner_type)) redirect('/partner/dashboard');
  if (!partner.community_id) redirect('/partner/club');
  const club = await loadClub(partner, partner.community_id);
  if (!club) redirect('/partner/club');

  const db = createAdminClient();
  const [challenges, teams, teamRows, steps] = await Promise.all([
    loadChallenges(partner.community_id),
    loadTeams(partner.community_id),
    fetchAll<{ user_id: string; team_id: string }>((a, b) => db.from('community_team_members').select('user_id, team_id').eq('community_id', partner.community_id!).order('user_id').range(a, b)),
    loadStepsSummary(club.members.map((m) => m.id)),
  ]);

  const now = Date.now();
  const from = new Date(now - 30 * 86400000);
  const { counts, month } = club;
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
  const isCompany = partner.partner_type === 'company';
  const people = isCompany ? 'people' : 'members';

  // Team participation: who on each team was active in the community in the last 30 days.
  const active30 = new Set(club.members.filter((m) => m.lastActive && now - m.lastActive.getTime() <= 30 * 86400000).map((m) => m.id));
  const byTeam = teams
    .map((t) => {
      const ids = teamRows.filter((r) => r.team_id === t.id).map((r) => r.user_id);
      return { name: t.name, size: ids.length, active: ids.filter((id) => active30.has(id)).length };
    })
    .filter((t) => t.size > 0)
    .sort((a, b) => pct(b.active, b.size) - pct(a.active, a.size));

  // Challenges that ran in the period.
  const cutoff = from.toISOString().slice(0, 10);
  const ran = challenges.filter((c) => !c.cancelled && c.endsOn >= cutoff && stateOf(c) !== 'upcoming').slice(0, 3);
  const results = await Promise.all(
    ran.map(async (c) => {
      const [board, teamBoard] = await Promise.all([loadBoard(c.id), c.byTeam ? loadTeamBoard(c.id) : Promise.resolve([])]);
      return { c, top: board.slice(0, 3), entrants: board[0]?.entrants ?? c.entrants, topTeam: teamBoard[0] || null };
    }),
  );

  const stat = (n: number | string, l: string, d?: string) => (
    <div className="border-t-2 border-[#023C3C] pt-3">
      <p className="text-3xl font-bold tabular-nums text-[#023C3C]">{n}</p>
      <p className="text-sm font-semibold text-gray-900">{l}</p>
      {d ? <p className="text-xs text-gray-500 mt-0.5">{d}</p> : null}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monthly report</h1>
          <p className="text-sm text-gray-500">The last 30 days, on one page. Print it or save it as a PDF for your {isCompany ? 'leadership' : 'team'}.</p>
        </div>
        <PrintButton label="Print or save as PDF" />
      </div>

      <article className="bg-white rounded-2xl print:rounded-none border border-gray-100 print:border-0 shadow-sm print:shadow-none p-8 print:p-0 max-w-4xl mx-auto space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#147070]">Wellness report</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-1">{club.community.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {fmtDay(from)} to {fmtDay(new Date(now))}
            </p>
          </div>
          <Lockup height={18} id="bt-report" />
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stat(counts.members, `${people[0].toUpperCase()}${people.slice(1)} in the community`, `${counts.new30} joined this month`)}
          {stat(`${pct(counts.active30, counts.members)}%`, 'Took part this month', `${counts.active30} of ${counts.members} ${people}`)}
          {stat(month.bookings, isCompany ? 'Session bookings' : 'Class bookings', month.attended ? `${month.attended} check-ins marked` : undefined)}
          {stat(month.classesHeld + month.memberHosted, 'Sessions held', `${month.memberHosted} set up by ${people} themselves`)}
        </section>

        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Active {people} per week, last 12 weeks</h3>
          <WeekBars data={club.weekly.map((w) => ({ start: w.start, value: w.active }))} labelOf={(d) => fmtDay(d)} />
        </section>

        {results.length ? (
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Challenges</h3>
            <div className="space-y-4">
              {results.map(({ c, top, entrants, topTeam }) => (
                <div key={c.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-gray-900">{c.title}</p>
                    <p className="text-xs text-gray-500">
                      {METRIC_LABEL[c.metric]}
                      {c.byTeam ? ' · by team' : ''} · {fmtDate(c.startsOn)} – {fmtDate(c.endsOn)} · {stateOf(c)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {entrants} joined ({pct(entrants, counts.members)}% of {people})
                    {topTeam ? ` · leading team: ${topTeam.name}, ${fmtScore(c.metric, topTeam.average)} each` : ''}
                  </p>
                  {top.length ? (
                    <ol className="mt-2 text-sm text-gray-800 flex flex-wrap gap-x-6 gap-y-1">
                      {top.map((r) => (
                        <li key={r.user_id}>
                          <span className="font-bold text-[#B86A10] me-1">{r.place}</span>
                          {r.name} · {fmtScore(c.metric, r.score)}
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {byTeam.length ? (
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Taking part, by team</h3>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {byTeam.map((t) => (
                  <tr key={t.name}>
                    <td className="py-2 font-medium text-gray-900 w-48">{t.name}</td>
                    <td className="py-2">
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-[#56C4C4]" style={{ width: `${pct(t.active, t.size)}%` }} />
                      </div>
                    </td>
                    <td className="py-2 ps-4 text-right tabular-nums text-gray-700 w-40">
                      {t.active} of {t.size} · {pct(t.active, t.size)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stat(month.posts + month.comments, 'Posts and comments', 'In your community feed')}
          {stat(month.reactivated, 'Came back', 'Active again after a month away')}
          {stat(month.soloMembers ? month.soloSessions : '—', 'Workouts on their own', month.soloMembers ? `Logged by ${month.soloMembers} ${people}` : 'Shown once 5 people log workouts')}
          {stat(steps.avgDaily != null ? steps.avgDaily.toLocaleString() : '—', 'Average steps a day', steps.avgDaily != null ? `${steps.connected} with Apple Health connected` : 'Shown once 5 people connect')}
        </section>

        <p className="text-xs text-gray-400 border-t border-gray-200 pt-4">
          This report covers activity in your community only: bookings, check-ins, posts and the challenges people chose to join. What anyone trains on their own, eats or measures is never
          shown for a person. Totals appear only when at least five people are included.
        </p>
      </article>
    </div>
  );
}
