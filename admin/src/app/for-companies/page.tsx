import type { Metadata } from 'next';
import Link from 'next/link';
import { Montserrat, Poppins } from 'next/font/google';
import { Lockup } from '@/components/brand/Logo';
import { TRIAL_DAYS } from '@/lib/plans';
import LeadForm from '@/components/LeadForm';

const display = Montserrat({ subsets: ['latin'], weight: ['700', '800', '900'], variable: '--font-display' });
const body = Poppins({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'Beast Tribe for companies',
  description: 'A private wellness community for your people: teams that train together, step challenges, and a nutritionist and gyms in the package. SAR 10 per seat a month.',
  openGraph: { images: ['/og-default.png'] },
};

const H = 'font-[family-name:var(--font-display)] tracking-tight';

export default function ForCompaniesPage() {
  return (
    <main className={`${display.variable} ${body.variable} font-[family-name:var(--font-body)] bg-[#F4F1EA] text-[#0B2626] overflow-x-hidden`}>
      {/* ───────── Hero ───────── */}
      <section className="bg-[#023C3C] text-white relative">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} aria-hidden />
        <nav className="relative mx-auto max-w-6xl px-4 sm:px-6 py-5 flex items-center justify-between">
          <Lockup height={20} ink="#F4F1EA" id="bt-forco" />
          <a href="#start" className="hidden sm:inline-flex px-4 py-2 rounded-lg bg-[#E88F24] text-[#023C3C] text-sm font-semibold hover:brightness-95">
            Start a free challenge
          </a>
        </nav>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-20 md:pt-16 md:pb-28 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <p className="text-[#56C4C4] text-sm font-semibold uppercase tracking-[0.18em]">Beast Tribe for companies</p>
            <h1 className={`${H} mt-4 text-[2.5rem] leading-[1.03] sm:text-6xl font-black`}>
              Wellness your people <span className="text-[#E88F24]">actually show up for.</span>
            </h1>
            <p className="mt-6 text-lg text-white/75 max-w-xl leading-relaxed">
              Give your company a private community in the Beast Tribe app. Departments compete in challenges, colleagues train together, and everyone gets a plan, a
              nutritionist and gyms in their package. You get a report every month. Their health data stays theirs.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#start" className="inline-flex px-6 py-3 rounded-xl bg-[#E88F24] text-[#023C3C] font-semibold hover:brightness-95">
                Start a free 4-week challenge
              </a>
              <a href="#how" className="inline-flex px-6 py-3 rounded-xl border border-white/25 text-white font-semibold hover:bg-white/5">
                How it works
              </a>
            </div>
            <p className="mt-5 text-sm text-white/55">SAR 10 per seat a month · free for employees · Arabic and English</p>
          </div>
          <ChallengeMock />
        </div>
      </section>

      {/* ───────── Why ───────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 md:py-28">
        <p className="text-[#147070] text-sm font-semibold uppercase tracking-[0.18em]">Why it matters</p>
        <h2 className={`${H} mt-3 text-3xl sm:text-5xl font-extrabold max-w-3xl leading-[1.05]`}>A gym subsidy reaches the people who already train.</h2>
        <div className="mt-12 grid md:grid-cols-3 gap-px bg-[#0B2626]/10 rounded-2xl overflow-hidden">
          {[
            { t: 'People move for people', d: 'The colleague waiting at the 6 pm run does more than any reminder email. Beast Tribe makes that easy to set up, every week.' },
            { t: 'A challenge ends. A habit needs a crowd.', d: 'Step challenges start the energy. Sessions, packs and a shared feed keep it going after the last day.' },
            { t: 'You can’t report what you can’t see', d: 'Most wellness spend has no numbers behind it. Your dashboard shows who took part, how often, and what they joined.' },
          ].map((x) => (
            <div key={x.t} className="bg-[#F4F1EA] p-7">
              <h3 className={`${H} text-xl font-bold`}>{x.t}</h3>
              <p className="mt-3 text-[#0B2626]/70 leading-relaxed">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── How ───────── */}
      <section id="how" className="bg-white scroll-mt-4">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 md:py-28">
          <p className="text-[#147070] text-sm font-semibold uppercase tracking-[0.18em]">What your people get</p>
          <h2 className={`${H} mt-3 text-3xl sm:text-5xl font-extrabold max-w-3xl leading-[1.05]`}>One community. A whole wellness programme.</h2>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { n: '01', t: 'Challenges for everyone', d: 'Active days, workouts, minutes trained, sessions joined or steps. People choose to join, and only those who joined appear on the ranking.' },
              { n: '02', t: 'Department against department', d: 'Add your teams and run a team challenge. Teams are ranked by the average per person, so a small team can beat a big one.' },
              { n: '03', t: 'Train together', d: 'Anyone can put a session on the board: a lunch walk, padel after work, a Friday run. Colleagues tap I’M IN and show up.' },
              { n: '04', t: 'A plan of the month', d: 'Recommend one training plan to everyone, from a 20-minute plan for busy weeks to a first 5K, with a full exercise library behind it.' },
              { n: '05', t: 'Experts in the package', d: 'Add a nutritionist, gyms and coaches. Employees connect themselves and decide what to share.' },
              { n: '06', t: 'Prizes and notices', d: 'Put a prize on a challenge and a notice at the top of your community: wellness day, a new challenge, the winners.' },
            ].map((x) => (
              <div key={x.n} className="rounded-2xl bg-[#F4F1EA] p-7">
                <span className={`${H} text-4xl font-black text-[#E88F24]`}>{x.n}</span>
                <h3 className={`${H} mt-3 text-xl font-bold`}>{x.t}</h3>
                <p className="mt-2 text-[#0B2626]/70 leading-relaxed">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Privacy ───────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 md:py-28">
        <p className="text-[#147070] text-sm font-semibold uppercase tracking-[0.18em]">Privacy your employees can trust</p>
        <h2 className={`${H} mt-3 text-3xl sm:text-5xl font-extrabold max-w-3xl leading-[1.05]`}>You see participation. Never health data.</h2>
        <div className="mt-12 grid md:grid-cols-2 gap-5">
          <div className="rounded-2xl bg-[#023C3C] text-white p-7">
            <h3 className={`${H} text-xl font-bold text-[#56C4C4]`}>What your dashboard shows</h3>
            <ul className="mt-4 space-y-3 text-white/85">
              {['Who has joined, and how many took part each week', 'Participation by team', 'Challenge rankings of the people who chose to join', 'A one-page report every month, ready for leadership'].map((p) => (
                <li key={p} className="flex gap-3">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#56C4C4] flex-none" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-white p-7">
            <h3 className={`${H} text-xl font-bold`}>What it never shows</h3>
            <ul className="mt-4 space-y-3 text-[#0B2626]/80">
              {['What anyone trains on their own', 'Food logs or body measurements', 'Steps of anyone who did not join a challenge', 'Any single person’s numbers inside a community total'].map((p) => (
                <li key={p} className="flex gap-3">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#E88F24] flex-none" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────── Price ───────── */}
      <section className="bg-[#023C3C] text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 md:py-24 grid lg:grid-cols-[1fr_1fr] gap-12 items-center">
          <div>
            <p className="text-[#56C4C4] text-sm font-semibold uppercase tracking-[0.18em]">The price</p>
            <h2 className={`${H} mt-3 text-3xl sm:text-5xl font-extrabold leading-[1.05]`}>
              <span className="text-[#E88F24]">SAR 10</span> per seat a month.
            </h2>
            <p className="mt-6 text-white/75 text-lg leading-relaxed">Pay for the people who join, not your whole headcount. Free for employees. Prices exclude VAT.</p>
          </div>
          <ul className="grid grid-cols-2 gap-3">
            {[`${TRIAL_DAYS} days free`, 'No setup fee', 'Cancel any time', 'Nutritionist and gyms can be added'].map((p) => (
              <li key={p} className="rounded-xl border border-white/15 px-4 py-4 text-sm font-medium">
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-20 md:py-24">
          <h2 className={`${H} text-3xl sm:text-4xl font-extrabold`}>Questions HR asks</h2>
          <div className="mt-8 divide-y divide-[#0B2626]/10">
            {[
              { q: 'How do employees join?', a: 'They download the app and enter your company code. Only your admins can share the code or invite people.' },
              { q: 'Is taking part optional?', a: 'Yes. Joining the community, each session and each challenge is the employee’s choice. Nothing is tracked until they opt in.' },
              { q: 'Which phones does it work on?', a: 'iPhone first; Android is next. Step counts come from Apple Health. Every other challenge counts what people do in the app, so it needs no health data at all.' },
              { q: 'Can we have women-only groups?', a: 'Yes. Packs and sessions can be women only or men only.' },
              { q: 'How do we start?', a: 'Most companies start with one four-week team challenge. It fits inside the free trial, and you see the numbers before you pay anything.' },
            ].map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-lg">
                  {f.q}
                  <span className="text-[#147070] text-2xl leading-none transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-[#0B2626]/70 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Start ───────── */}
      <section id="start" className="bg-[#E88F24] text-[#023C3C] scroll-mt-4">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-20 grid lg:grid-cols-[1fr_1.1fr] gap-10 items-start">
          <div>
            <h2 className={`${H} text-3xl sm:text-5xl font-black leading-[1.02]`}>Start with one challenge.</h2>
            <p className="mt-5 text-lg text-[#023C3C]/80 max-w-md">Four weeks, free. We set up your community and your teams, you share the code, and your people start moving together.</p>
            <p className="mt-6 text-sm font-semibold">
              Running a gym? <Link href="/for-gyms" className="underline">See Beast Tribe for gyms</Link>
            </p>
          </div>
          <LeadForm kind="company" source="for-companies" cta="Start a free challenge" />
        </div>
      </section>

      <footer className="bg-[#011E1E] text-white/50 text-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-wrap items-center justify-between gap-4">
          <Lockup height={16} ink="#F4F1EA" id="bt-forco-foot" />
          <div className="flex gap-5">
            <Link href="/legal/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-white">Terms</Link>
            <Link href="/support" className="hover:text-white">Support</Link>
            <Link href="/login" className="hover:text-white">Partner login</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ChallengeMock() {
  const rows: [string, string, number][] = [
    ['Finance', '18.4', 100],
    ['Engineering', '16.9', 92],
    ['Sales', '15.2', 83],
    ['Operations', '13.6', 74],
    ['People team', '12.8', 70],
  ];
  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-[#56C4C4]/10 blur-3xl rounded-full" aria-hidden />
      <div className="relative rounded-2xl bg-[#F4F1EA] text-[#0B2626] p-6 shadow-2xl -rotate-[0.6deg]">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#147070]">Team challenge · example</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#023C3C] text-white">214 joined</span>
        </div>
        <p className={`${H} mt-3 text-2xl font-extrabold`}>Active days in March</p>
        <ol className="mt-4 space-y-3">
          {rows.map(([n, s, w], i) => (
            <li key={n} className="flex items-center gap-3">
              <span className={`w-5 text-sm font-bold ${i === 0 ? 'text-[#B86A10]' : 'text-[#0B2626]/40'}`}>{i + 1}</span>
              <span className="w-24 text-sm font-medium">{n}</span>
              <div className="flex-1 h-2 rounded-full bg-[#0B2626]/10 overflow-hidden">
                <div className={`h-full rounded-full ${i === 0 ? 'bg-[#E88F24]' : 'bg-[#56C4C4]'}`} style={{ width: `${w}%` }} />
              </div>
              <span className="w-20 text-right text-sm font-semibold tabular-nums">{s} days</span>
            </li>
          ))}
        </ol>
        <p className="mt-5 pt-4 border-t border-[#0B2626]/10 text-xs text-[#0B2626]/55">Average active days per person. Prize: kit for the winning team.</p>
      </div>
    </div>
  );
}
