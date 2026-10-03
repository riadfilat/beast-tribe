import type { Metadata } from 'next';
import Link from 'next/link';
import { Montserrat, Poppins } from 'next/font/google';
import { Lockup } from '@/components/brand/Logo';

const display = Montserrat({ subsets: ['latin'], weight: ['700', '800', '900'], variable: '--font-display' });
const body = Poppins({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'Beast Tribe for club leaders',
  description: 'Run your run club, padel group or training crew on Beast Tribe. Free for club leaders, free for your members.',
  openGraph: { images: ['/og-default.png'] },
};

const H = 'font-[family-name:var(--font-display)] tracking-tight';

const STEPS = [
  { t: 'Start your club in the app', d: 'Tribe › Communities › Start your club. Name, sport, city and a line about when you meet. Two minutes.' },
  { t: 'Share your code', d: 'Drop the join code in your WhatsApp group. Your people join in ten seconds.' },
  { t: 'Put your sessions on the board', d: 'Weekly runs repeat on their own. Members tap I’m in, get a reminder, and chat in the session.' },
];

const GETS = [
  { t: 'One place for your sessions', d: 'No more “who’s coming?” threads. Everyone sees the time, the place and who is in.' },
  { t: 'A notice at the top of your club', d: '“This week: Tuesday 9 pm, 8 km easy.” Edit it from your phone.' },
  { t: 'People at the right level', d: 'Members can find training partners who run at their pace. Newcomers find your club when it is verified.' },
  { t: 'A verified badge', d: 'We check every club that asks to be listed, so people know it is real.' },
  { t: 'Arabic and English', d: 'The whole app, right to left included.' },
  { t: 'Free. For you and for them', d: 'No fees for leaders and none for members. You only pay if you start charging for sessions, on the Coach plan.' },
];

export default function ForLeadersPage() {
  return (
    <main className={`${display.variable} ${body.variable} font-[family-name:var(--font-body)] bg-[#F4F1EA] text-[#0B2626] overflow-x-hidden`}>
      <section className="bg-[#023C3C] text-white relative">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} aria-hidden />
        <nav className="relative mx-auto max-w-6xl px-4 sm:px-6 py-5 flex items-center justify-between">
          <Lockup height={20} ink="#F4F1EA" id="bt-forleaders" />
          <Link href="/get" className="hidden sm:inline-flex px-4 py-2 rounded-lg bg-[#E88F24] text-[#023C3C] text-sm font-semibold hover:brightness-95">
            Get the app
          </Link>
        </nav>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-20 md:pt-16 md:pb-28 max-w-3xl">
          <p className="text-[#56C4C4] text-sm font-semibold uppercase tracking-[0.18em]">Beast Tribe for club leaders</p>
          <h1 className={`${H} mt-4 text-[2.6rem] leading-[1.02] sm:text-6xl font-black`}>
            You bring the people. <span className="text-[#E88F24]">We bring the tools.</span>
          </h1>
          <p className="mt-6 text-lg text-white/75 max-w-xl leading-relaxed">
            Run clubs, padel groups, hiking crews: if you get people moving together every week, run it on Beast Tribe. It is free for club leaders and for every member.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/get" className="inline-flex px-6 py-3 rounded-xl bg-[#E88F24] text-[#023C3C] font-semibold hover:brightness-95">
              Get the app and start your club
            </Link>
          </div>
          <p className="mt-5 text-sm text-white/55">Free · one club per leader · Arabic and English</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 md:py-24">
        <h2 className={`${H} text-3xl sm:text-5xl font-extrabold max-w-3xl leading-[1.05]`}>Live this week.</h2>
        <ol className="mt-12 grid md:grid-cols-3 gap-5">
          {STEPS.map((s, i) => (
            <li key={s.t} className="rounded-2xl bg-white p-7">
              <span className={`${H} text-5xl font-black text-[#E88F24]`}>{i + 1}</span>
              <h3 className={`${H} mt-3 text-xl font-bold`}>{s.t}</h3>
              <p className="mt-2 text-[#0B2626]/70 leading-relaxed">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 md:py-24">
          <h2 className={`${H} text-3xl sm:text-5xl font-extrabold max-w-3xl leading-[1.05]`}>What you get.</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
            {GETS.map((g) => (
              <div key={g.t} className="py-5 border-t-2 border-[#0B2626]/15">
                <h3 className={`${H} text-lg font-bold`}>{g.t}</h3>
                <p className="mt-1.5 text-[#0B2626]/70 leading-relaxed">{g.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#E88F24] text-[#023C3C]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 flex flex-wrap items-center justify-between gap-6">
          <h2 className={`${H} text-3xl sm:text-4xl font-black max-w-xl leading-[1.05]`}>Your club, everyone’s board.</h2>
          <Link href="/get" className="inline-flex px-6 py-3 rounded-xl bg-[#023C3C] text-white font-semibold hover:brightness-110">
            Get Beast Tribe
          </Link>
        </div>
      </section>
    </main>
  );
}
