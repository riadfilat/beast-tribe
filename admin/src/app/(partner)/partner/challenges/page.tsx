import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ownsCommunity, requirePartner } from '@/lib/auth';
import { METRIC_HINT, METRIC_LABEL, fmtDate, fmtScore, loadBoard, loadChallenges, loadTeamBoard, loadTeams, stateOf, todayRiyadh, type Metric } from '@/lib/wellness';
import SubmitButton from '@/components/SubmitButton';
import { ConfirmButton } from '@/components/ConfirmSubmit';
import { Avatar, btnGhost, btnPrimary, card, input, label } from '@/components/club/ui';
import { cancelChallenge, createChallenge } from '../club/actions';

export const revalidate = 0;

const STATE_STYLE = {
  live: 'bg-[#E8F5EE] text-[#25704F]',
  upcoming: 'bg-[#E6F6F6] text-[#0F5A5A]',
  ended: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-[#FCEBEA] text-[#9E3A33]',
} as const;
const METRICS: Metric[] = ['active_days', 'workouts', 'minutes', 'sessions', 'steps'];

export default async function ChallengesPage({ searchParams }: { searchParams: { c?: string } }) {
  const partner = await requirePartner();
  if (!ownsCommunity(partner.partner_type)) redirect('/partner/dashboard');
  if (!partner.community_id) redirect('/partner/club');

  const [list, teams] = await Promise.all([loadChallenges(partner.community_id), loadTeams(partner.community_id)]);
  const focus = list.find((c) => c.id === searchParams.c) || list.find((c) => stateOf(c) === 'live') || list[0] || null;
  const [board, teamBoard] = focus ? await Promise.all([loadBoard(focus.id), focus.byTeam ? loadTeamBoard(focus.id) : Promise.resolve([])]) : [[], []];
  const today = todayRiyadh();
  const inTwoWeeks = new Date(Date.now() + 3 * 3600000 + 13 * 86400000).toISOString().slice(0, 10);
  const who = partner.partner_type === 'company' ? 'Your people' : 'Your members';
  const entrants = board[0]?.entrants ?? focus?.entrants ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Challenges</h1>
        <p className="text-sm text-gray-500 max-w-2xl">
          Run a challenge for a set period: active days, workouts, minutes, sessions or steps, by person or by team. {who} join from the app. Only people who join appear on the
          ranking; everyone else stays private.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-4 items-start">
        <section className={`${card} p-5 lg:col-span-3`}>
          {focus ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{focus.title}</h2>
                  <p className="text-sm text-gray-500">
                    {METRIC_LABEL[focus.metric]}
                    {focus.byTeam ? ' · by team' : ''} · {fmtDate(focus.startsOn)} – {fmtDate(focus.endsOn)}
                    {focus.dailyGoal ? ` · goal ${focus.dailyGoal.toLocaleString()} steps a day` : ''} · {entrants} joined
                  </p>
                  {focus.prize ? <p className="text-sm text-[#8A4F0B] mt-1">Prize: {focus.prize}</p> : null}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATE_STYLE[stateOf(focus)]}`}>{stateOf(focus)}</span>
              </div>

              {focus.byTeam ? (
                <div className="mt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Teams, by average per person</h3>
                  <ol className="mt-2 divide-y divide-gray-50">
                    {teamBoard.map((t) => (
                      <li key={t.team_id} className="flex items-center gap-3 py-2.5">
                        <span className={`w-6 text-sm font-bold tabular-nums ${t.place === 1 ? 'text-[#B86A10]' : 'text-gray-400'}`}>{t.place}</span>
                        <span className="flex-1 text-sm font-medium text-gray-900">{t.name}</span>
                        <span className="text-xs text-gray-400 w-24 text-right">{t.people} joined</span>
                        <span className="w-32 text-right text-sm font-semibold tabular-nums text-brand-teal">{fmtScore(focus.metric, t.average)} each</span>
                      </li>
                    ))}
                    {!teamBoard.length ? (
                      <li className="py-6 text-center text-sm text-gray-400">
                        {teams.length ? 'No team has anyone in this challenge yet.' : 'You have no teams yet. '}
                        {!teams.length ? <Link href="/partner/teams" className="text-[#147070] underline">Add your teams</Link> : null}
                      </li>
                    ) : null}
                  </ol>
                </div>
              ) : null}

              <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-gray-400">People{board.length < entrants ? ` · top ${board.length} of ${entrants}` : ''}</h3>
              <ol className="mt-2 divide-y divide-gray-50">
                {board.map((r) => (
                  <li key={r.user_id} className="flex items-center gap-3 py-2.5">
                    <span className={`w-6 text-sm font-bold tabular-nums ${r.place === 1 ? 'text-[#B86A10]' : 'text-gray-400'}`}>{r.place}</span>
                    <Avatar name={r.name} src={r.avatar_url} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-gray-900 truncate">{r.name}</span>
                      {r.team ? <span className="block text-xs text-gray-400">{r.team}</span> : null}
                    </span>
                    <span className="w-32 text-right text-sm font-semibold tabular-nums text-brand-teal">{fmtScore(focus.metric, r.score)}</span>
                  </li>
                ))}
                {!board.length ? <li className="py-8 text-center text-sm text-gray-400">No one has joined yet. Announce it in your WhatsApp group or on the notice on your community page.</li> : null}
              </ol>
              {stateOf(focus) === 'upcoming' || stateOf(focus) === 'live' ? (
                <form action={cancelChallenge.bind(null, focus.id)} className="mt-4">
                  <ConfirmButton confirmMessage="Cancel this challenge?" className="text-xs text-[#9E3A33] hover:underline">
                    Cancel challenge
                  </ConfirmButton>
                </form>
              ) : null}
            </>
          ) : (
            <div className="py-10 text-center">
              <p className="text-gray-500 text-sm">No challenges yet. Start one with the form: a week or a month works best.</p>
            </div>
          )}
        </section>

        <div className="lg:col-span-2 space-y-4">
          <form action={createChallenge} className={`${card} p-5 space-y-4`}>
            <h2 className="font-semibold text-gray-900">New challenge</h2>
            <div>
              <label className={label} htmlFor="ch-title">Name</label>
              <input id="ch-title" name="title" required className={input} placeholder="Move More March, Ramadan Steps…" />
            </div>
            <div>
              <label className={label} htmlFor="ch-title-ar">Name in Arabic (optional)</label>
              <input id="ch-title-ar" name="title_ar" dir="rtl" className={input} placeholder="تحدي الحركة" />
            </div>
            <fieldset>
              <legend className={label}>What counts</legend>
              <div className="space-y-1.5">
                {METRICS.map((m, i) => (
                  <label key={m} className="flex gap-2.5 items-start rounded-lg border border-gray-200 px-3 py-2 text-sm cursor-pointer has-[:checked]:border-brand-teal has-[:checked]:bg-[#F3FAF9]">
                    <input type="radio" name="metric" value={m} defaultChecked={i === 0} className="mt-1" />
                    <span>
                      <span className="font-medium text-gray-900">{METRIC_LABEL[m]}</span>
                      <span className="block text-xs text-gray-500">{METRIC_HINT[m]}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex gap-2.5 items-start text-sm">
              <input type="checkbox" name="by_team" className="mt-1" />
              <span>
                <span className="font-medium text-gray-900">Team challenge</span>
                <span className="block text-xs text-gray-500">
                  Teams are ranked by the average per person. {teams.length ? `You have ${teams.length} team${teams.length === 1 ? '' : 's'}.` : 'Add your teams first.'}{' '}
                  <Link href="/partner/teams" className="text-[#147070] underline">Teams</Link>
                </span>
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="ch-start">Starts</label>
                <input id="ch-start" name="starts_on" type="date" required defaultValue={today} className={input} />
              </div>
              <div>
                <label className={label} htmlFor="ch-end">Ends</label>
                <input id="ch-end" name="ends_on" type="date" required defaultValue={inTwoWeeks} className={input} />
              </div>
            </div>
            <div>
              <label className={label} htmlFor="ch-goal">Daily step goal (steps and active days, optional)</label>
              <input id="ch-goal" name="daily_goal" type="number" min={1000} max={50000} step={500} placeholder="8000" className={input} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="ch-prize">Prize (optional)</label>
                <input id="ch-prize" name="prize" maxLength={160} className={input} placeholder="Operation Beast kit for the top 3" />
              </div>
              <div>
                <label className={label} htmlFor="ch-prize-ar">Prize in Arabic</label>
                <input id="ch-prize-ar" name="prize_ar" dir="rtl" maxLength={160} className={input} />
              </div>
            </div>
            <SubmitButton pendingLabel="Starting…" className={`${btnPrimary} w-full`}>
              Start the challenge
            </SubmitButton>
            <p className="text-[11px] text-gray-400">Up to 3 months. Everyone in your community sees it in the app and can join.</p>
          </form>

          {list.length > 1 ? (
            <div className={`${card} p-2`}>
              {list.map((c) => (
                <Link key={c.id} href={`/partner/challenges?c=${c.id}`} className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 ${focus?.id === c.id ? 'bg-gray-50' : ''}`}>
                  <span className="truncate text-gray-800">{c.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATE_STYLE[stateOf(c)]}`}>{stateOf(c)}</span>
                </Link>
              ))}
            </div>
          ) : null}
          <Link href="/partner/club" className={btnGhost}>
            Back to overview
          </Link>
        </div>
      </div>
    </div>
  );
}
