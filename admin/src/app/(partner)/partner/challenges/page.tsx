import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ownsCommunity, requirePartner } from '@/lib/auth';
import { fmtDate, loadBoard, loadChallenges, stateOf, todayRiyadh } from '@/lib/wellness';
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

export default async function ChallengesPage({ searchParams }: { searchParams: { c?: string } }) {
  const partner = await requirePartner();
  if (!ownsCommunity(partner.partner_type)) redirect('/partner/dashboard');
  if (!partner.community_id) redirect('/partner/club');

  const list = await loadChallenges(partner.community_id);
  const focus = list.find((c) => c.id === searchParams.c) || list.find((c) => stateOf(c) === 'live') || list[0] || null;
  const board = focus ? await loadBoard(focus.id) : [];
  const today = todayRiyadh();
  const inTwoWeeks = new Date(Date.now() + 3 * 3600000 + 13 * 86400000).toISOString().slice(0, 10);
  const who = partner.partner_type === 'company' ? 'your people' : 'your members';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Step challenges</h1>
        <p className="text-sm text-gray-500 max-w-2xl">
          Run a challenge for a set period. {who[0].toUpperCase() + who.slice(1)} join from the app and their steps come from Apple Health. Only people who join appear on
          the ranking; everyone else stays private.
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
                    {fmtDate(focus.startsOn)} – {fmtDate(focus.endsOn)}
                    {focus.dailyGoal ? ` · goal ${focus.dailyGoal.toLocaleString()} steps a day` : ''} · {focus.entrants} joined
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATE_STYLE[stateOf(focus)]}`}>{stateOf(focus)}</span>
              </div>
              <ol className="mt-4 divide-y divide-gray-50">
                {board.map((r) => (
                  <li key={r.user_id} className="flex items-center gap-3 py-2.5">
                    <span className={`w-6 text-sm font-bold tabular-nums ${r.place === 1 ? 'text-[#B86A10]' : 'text-gray-400'}`}>{r.place}</span>
                    <Avatar name={r.name} src={r.avatar_url} />
                    <span className="flex-1 text-sm font-medium text-gray-900">{r.name}</span>
                    <span className="text-xs text-gray-400 w-24 text-right">{r.days_active} active days</span>
                    <span className="w-24 text-right text-sm font-semibold tabular-nums text-brand-teal">{r.steps.toLocaleString()}</span>
                  </li>
                ))}
                {!board.length ? <li className="py-8 text-center text-sm text-gray-400">No one has joined yet. Announce it in your WhatsApp group or at the front desk.</li> : null}
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
              <label className={label}>Name</label>
              <input name="title" required className={input} placeholder="Ramadan Steps, 10K October…" />
            </div>
            <div>
              <label className={label}>Name in Arabic (optional)</label>
              <input name="title_ar" dir="rtl" className={input} placeholder="تحدي الخطوات" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Starts</label>
                <input name="starts_on" type="date" required defaultValue={today} className={input} />
              </div>
              <div>
                <label className={label}>Ends</label>
                <input name="ends_on" type="date" required defaultValue={inTwoWeeks} className={input} />
              </div>
            </div>
            <div>
              <label className={label}>Daily goal (optional)</label>
              <input name="daily_goal" type="number" min={1000} max={50000} step={500} placeholder="8000" className={input} />
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
