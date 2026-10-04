import { TRAIN_ENABLED } from '@/lib/features';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Montserrat, Poppins } from 'next/font/google';
import { Lockup } from '@/components/brand/Logo';
import { PLANS, PROMISES, TRIAL_DAYS } from '@/lib/plans';
import { sar } from '@/lib/format';
import LeadForm from '@/components/LeadForm';

const display = Montserrat({ subsets: ['latin'], weight: ['700', '800', '900'], variable: '--font-display' });
const body = Poppins({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'Beast Tribe for gyms and coaches',
  description: 'Turn your gym into a club members don’t leave. Classes, members and the numbers that matter. A flat subscription, never a commission.',
  openGraph: { images: ['/og-default.png'] },
};

const TRIAL = '#start';

const H = 'font-[family-name:var(--font-display)] tracking-tight';

export default function ForGymsPage() {
  const gymPlans = PLANS.filter((p) => p.audience === 'gym');
  const coach = PLANS.find((p) => p.id === 'coach')!;
  return (
    <main className={`${display.variable} ${body.variable} font-[family-name:var(--font-body)] bg-[#F4F1EA] text-[#0B2626] overflow-x-hidden`}>
      {/* ───────── Hero ───────── */}
      <section className="bg-[#023C3C] text-white relative">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} aria-hidden />
        <nav className="relative mx-auto max-w-6xl px-4 sm:px-6 py-5 flex items-center justify-between">
          <Lockup height={20} ink="#F4F1EA" id="bt-forgyms" />
          <a href={TRIAL} className="hidden sm:inline-flex px-4 py-2 rounded-lg bg-[#E88F24] text-[#023C3C] text-sm font-semibold hover:brightness-95">
            Start a free trial
          </a>
        </nav>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-20 md:pt-16 md:pb-28 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <p className="text-[#56C4C4] text-sm font-semibold uppercase tracking-[0.18em]">Beast Tribe for gyms</p>
            <h1 className={`${H} mt-4 text-[2.6rem] leading-[1.02] sm:text-6xl font-black`}>
              People stay where <span className="text-[#E88F24]">their people</span> are.
            </h1>
            <p className="mt-6 text-lg text-white/75 max-w-xl leading-relaxed">
              Beast Tribe turns your gym into a club. Members book your classes, bring friends, set up their own runs and games, and keep talking between visits. You see who is
              thriving and who is drifting, while there is still time to do something about it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={TRIAL} className="inline-flex px-6 py-3 rounded-xl bg-[#E88F24] text-[#023C3C] font-semibold hover:brightness-95">
                Try it free for {TRIAL_DAYS} days
              </a>
              <a href="#pricing" className="inline-flex px-6 py-3 rounded-xl border border-white/25 text-white font-semibold hover:bg-white/5">
                See pricing
              </a>
            </div>
            <p className="mt-5 text-sm text-white/55">0% commission · members always free · Arabic and English</p>
          </div>

          <ReceiptMock />
        </div>
      </section>

      {/* ───────── Why it matters ───────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 md:py-28">
        <p className="text-[#147070] text-sm font-semibold uppercase tracking-[0.18em]">Why it matters</p>
        <h2 className={`${H} mt-3 text-3xl sm:text-5xl font-extrabold max-w-3xl leading-[1.05]`}>A membership is sold once. It&rsquo;s kept every week.</h2>
        <div className="mt-12 grid md:grid-cols-3 gap-px bg-[#0B2626]/10 rounded-2xl overflow-hidden">
          {[
            {
              t: 'Members rarely quit a crew',
              d: 'They quit training alone. The friend who expects them at the 6:30 class does more for renewals than any discount.',
            },
            {
              t: 'The gym goes quiet between visits',
              d: 'Your members spend six days a week away from the floor. Beast Tribe keeps your club in their week: the next class, the Friday run, the group chat.',
            },
            {
              t: 'You can’t save a member you can’t see',
              d: 'Most gyms find out someone left when the payment stops. The Club Portal shows who has gone quiet, so a coach can reach out first.',
            },
          ].map((x) => (
            <div key={x.t} className="bg-[#F4F1EA] p-7">
              <h3 className={`${H} text-xl font-bold`}>{x.t}</h3>
              <p className="mt-3 text-[#0B2626]/70 leading-relaxed">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── The portal ───────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 md:py-28">
          <p className="text-[#147070] text-sm font-semibold uppercase tracking-[0.18em]">The Club Portal</p>
          <h2 className={`${H} mt-3 text-3xl sm:text-5xl font-extrabold max-w-3xl leading-[1.05]`}>Everything your club does, on one page.</h2>
          <p className="mt-5 text-lg text-[#0B2626]/70 max-w-2xl">Built for the owner who checks in once a morning and the coach who wants to know who to message today.</p>

          <div className="mt-14 grid lg:grid-cols-2 gap-6">
            <Feature title="Know every member’s pulse" text="Active, new, quiet or at risk, based on what they actually do in your club: bookings, check-ins, posts.">
              <MembersMock />
            </Feature>
            <Feature title="Classes that fill themselves" text="Post your timetable once, repeat it weekly. Members book in the app; when a class is full the waitlist takes over and promotes the next person automatically.">
              <ClassMock />
            </Feature>
            <Feature title="See when your gym comes alive" text="Bookings by day and hour across your week. Add a class where it glows, move the one nobody books.">
              <HeatMock />
            </Feature>
            <Feature title="Proof, every month" text="Bookings, check-ins, members who came back, sessions your members ran themselves. The value of the app in numbers your team can see.">
              <ProofMock />
            </Feature>
          </div>
        </div>
      </section>

      {/* ───────── Win-win ───────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 md:py-28">
        <p className="text-[#147070] text-sm font-semibold uppercase tracking-[0.18em]">A win for everyone in the building</p>
        <h2 className={`${H} mt-3 text-3xl sm:text-5xl font-extrabold max-w-3xl leading-[1.05]`}>Your gym, your coaches, your members.</h2>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {[
            {
              who: 'Your gym',
              points: ['Members who stay longer and bring friends', 'A private club with your name and your code', 'Fuller classes and a timetable built on real demand'],
            },
            {
              who: 'Your coaches',
              points: ['Coach tools included in your plan', 'Clients share training and food with them, by consent', ...(TRAIN_ENABLED ? ['Publish workouts and get paid when members use them'] : [])],
            },
            {
              who: 'Your members',
              points: ['Free, always', 'Book, train together and find their crew', TRAIN_ENABLED ? 'A full training library and plans for the days between classes' : 'Courts and sessions in one place, in Arabic and English'],
            },
          ].map((c, i) => (
            <div key={c.who} className={`rounded-2xl p-7 ${i === 1 ? 'bg-[#023C3C] text-white' : 'bg-white'}`}>
              <h3 className={`${H} text-2xl font-extrabold ${i === 1 ? 'text-[#E88F24]' : ''}`}>{c.who}</h3>
              <ul className="mt-5 space-y-3">
                {c.points.map((p) => (
                  <li key={p} className="flex gap-3 leading-snug">
                    <span className={`mt-2 w-1.5 h-1.5 rounded-full flex-none ${i === 1 ? 'bg-[#56C4C4]' : 'bg-[#E88F24]'}`} />
                    <span className={i === 1 ? 'text-white/85' : 'text-[#0B2626]/80'}>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── The deal ───────── */}
      <section id="pricing" className="bg-[#023C3C] text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 md:py-28">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12">
            <div>
              <p className="text-[#56C4C4] text-sm font-semibold uppercase tracking-[0.18em]">The deal</p>
              <h2 className={`${H} mt-3 text-3xl sm:text-5xl font-extrabold leading-[1.05]`}>
                A subscription. <span className="text-[#E88F24]">Never a commission.</span>
              </h2>
              <p className="mt-6 text-white/75 text-lg leading-relaxed">
                We don&rsquo;t take a cut of your memberships, classes or personal training. A flat fee means you can put your whole club in the app without doing maths on
                every booking, and never have a reason to move members to WhatsApp or cash.
              </p>
              <p className="mt-4 text-white/75 text-lg leading-relaxed">And we only keep you if your members keep showing up. That&rsquo;s the whole point.</p>
              <ul className="mt-8 grid grid-cols-2 gap-3">
                {PROMISES.map((p) => (
                  <li key={p} className="rounded-xl border border-white/15 px-4 py-3 text-sm font-medium">
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              {gymPlans.map((p) => (
                <div key={p.id} className={`rounded-2xl p-6 ${p.id === 'club' ? 'bg-[#F4F1EA] text-[#0B2626]' : 'bg-white/[0.06] border border-white/10'}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div>
                      <h3 className={`${H} text-2xl font-extrabold`}>{p.name}</h3>
                      <p className={`text-sm ${p.id === 'club' ? 'text-[#0B2626]/60' : 'text-white/60'}`}>
                        {p.tagline} · {p.limit}
                      </p>
                    </div>
                    <p>
                      {p.monthly ? (
                        <>
                          <span className={`${H} text-3xl font-black tabular-nums`}>{p.monthly.toLocaleString('en-US')}</span>
                          <span className={`text-sm ${p.id === 'club' ? 'text-[#0B2626]/60' : 'text-white/60'}`}> SAR / month</span>
                        </>
                      ) : (
                        <span className={`${H} text-2xl font-black`}>Let&rsquo;s talk</span>
                      )}
                    </p>
                  </div>
                  <ul className={`mt-4 grid sm:grid-cols-2 gap-x-5 gap-y-1.5 text-sm ${p.id === 'club' ? 'text-[#0B2626]/80' : 'text-white/80'}`}>
                    {p.features.map((f) => (
                      <li key={f}>· {f}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="rounded-2xl p-6 border border-dashed border-white/20 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className={`${H} text-xl font-extrabold`}>Independent coach?</h3>
                  <p className="text-sm text-white/60">{coach.features[0]}. Keep 100% of what you charge.</p>
                </div>
                <p>
                  <span className={`${H} text-2xl font-black`}>{coach.monthly}</span>
                  <span className="text-sm text-white/60"> SAR / month</span>
                </p>
              </div>
              <div className="rounded-2xl p-6 border border-[#E88F24]/50 bg-[#E88F24]/10">
                <p className="text-[#F3B565] text-xs font-semibold uppercase tracking-[0.18em]">Included · new customers</p>
                <h3 className={`${H} mt-1 text-xl font-extrabold`}>Sell your empty spots to guests</h3>
                <p className="mt-1 text-sm text-white/70">
                  Open any class to people outside your club for a guest price. They see it on their city&rsquo;s board, join in one tap and pay at your desk. If you have courts or a hall, list them too: players book a time and each one sees their share. All of it is yours; we take nothing from it.
                </p>
              </div>
              <div className="rounded-2xl p-6 border border-dashed border-white/20">
                <p className="text-[#56C4C4] text-xs font-semibold uppercase tracking-[0.18em]">Optional add-on</p>
                <h3 className={`${H} mt-1 text-xl font-extrabold`}>A Beast Captain for your club</h3>
                <p className="mt-1 text-sm text-white/60">
                  A coach we assign who puts three open sessions a week on your board, so there is always something to join. Paid by the hour, only for sessions that were held.
                </p>
              </div>
              <p className="text-xs text-white/45">Prices exclude VAT. Pay yearly and get two months free ({sar(gymPlans[0].monthly! * 10)} a year for Studio).</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── How it starts ───────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 md:py-28">
        <h2 className={`${H} text-3xl sm:text-5xl font-extrabold max-w-3xl leading-[1.05]`}>Live this week.</h2>
        <ol className="mt-12 grid md:grid-cols-3 gap-5">
          {[
            { t: 'We open your club', d: 'Your private club in the app, with your name and a join code. Your coaches get their logins.' },
            { t: 'Members join with your code', d: 'Front desk, WhatsApp group, receipts, the mirror in the changing room. It takes ten seconds.' },
            { t: 'Post your timetable', d: 'Repeat it weekly. From then on the portal tells you how your club is doing every morning.' },
          ].map((s, i) => (
            <li key={s.t} className="rounded-2xl bg-white p-7">
              <span className={`${H} text-5xl font-black text-[#E88F24]`}>{i + 1}</span>
              <h3 className={`${H} mt-3 text-xl font-bold`}>{s.t}</h3>
              <p className="mt-2 text-[#0B2626]/70 leading-relaxed">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-20 md:py-28">
          <h2 className={`${H} text-3xl sm:text-4xl font-extrabold`}>Questions owners ask</h2>
          <div className="mt-8 divide-y divide-[#0B2626]/10">
            {[
              { q: 'Do my members pay anything?', a: 'No. Beast Tribe is free for members. Your gym pays one flat subscription.' },
              {
                q: 'Does it replace our membership or payment system?',
                a: 'No. Keep billing members the way you do today. Beast Tribe is where your club books, trains together and stays in touch, and it runs alongside what you already use.',
              },
              {
                q: 'What can we see about our members?',
                a: 'Activity in your club: bookings, check-ins, posts and sessions. What a member trains on their own, what they eat and their body measurements stay private, unless they choose to share with a coach.',
              },
              {
                q: 'What is a Beast Captain?',
                a: 'An optional extra. We assign a vetted coach to your club who hosts three open sessions a week that any member can drop into, and we follow up every week so they really happen. You pay by the hour, only for sessions that were held, separately from your plan.',
              },
              { q: 'Is it in Arabic?', a: 'Yes. The app is fully Arabic and English, right to left included.' },
              { q: 'What if it doesn’t work for us?', a: `You have ${TRIAL_DAYS} days free with everything open, and you can cancel any time after that.` },
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
            <h2 className={`${H} text-3xl sm:text-5xl font-black leading-[1.02]`}>Give your members a reason to come back tomorrow.</h2>
            <p className="mt-5 text-lg text-[#023C3C]/80 max-w-md">Tell us about your club. We set it up with you, your members join with your code, and you see it working within the week.</p>
            <p className="mt-6 text-sm font-semibold">Running a company? <Link href="/for-companies" className="underline">See Beast Tribe for companies</Link></p>
          </div>
          <LeadForm kind="gym" source="for-gyms" />
        </div>
      </section>

      <footer className="bg-[#011E1E] text-white/50 text-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-wrap items-center justify-between gap-4">
          <Lockup height={16} ink="#F4F1EA" id="bt-forgyms-foot" />
          <div className="flex gap-5">
            <Link href="/legal/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/legal/terms" className="hover:text-white">
              Terms
            </Link>
            <Link href="/support" className="hover:text-white">
              Support
            </Link>
            <Link href="/login" className="hover:text-white">
              Partner login
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ───────── Product mocks (illustrative data, labelled as an example) ───────── */

function Feature({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[#F4F1EA] p-6 sm:p-7 flex flex-col">
      <div className="rounded-xl bg-white shadow-[0_1px_0_rgba(11,38,38,0.06),0_12px_30px_-12px_rgba(11,38,38,0.18)] p-4 min-h-[180px]">{children}</div>
      <h3 className={`${H} mt-6 text-xl font-bold`}>{title}</h3>
      <p className="mt-2 text-[#0B2626]/70 leading-relaxed">{text}</p>
    </div>
  );
}

const Example = () => <p className="text-[10px] uppercase tracking-wider text-[#0B2626]/35 mb-2">Example</p>;

function ReceiptMock() {
  const items = [
    ['412', 'Class bookings'],
    ['356', 'Check-ins'],
    ['23', 'Came back'],
    ['31', 'Member-led runs & games'],
  ];
  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-[#56C4C4]/10 blur-3xl rounded-full" aria-hidden />
      <div className="relative rounded-2xl bg-[#F4F1EA] text-[#0B2626] p-6 shadow-2xl rotate-[0.6deg]">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#147070]">Last 30 days · example club</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#023C3C] text-white">Club Portal</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-5">
          {items.map(([n, l]) => (
            <div key={l}>
              <p className={`${H} text-4xl font-black text-[#023C3C] tabular-nums`}>{n}</p>
              <p className="text-sm text-[#0B2626]/65">{l}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-5 border-t border-[#0B2626]/10">
          <p className="text-xs text-[#0B2626]/50 mb-2">Active members per week</p>
          <div className="flex items-end gap-1.5 h-16">
            {[38, 44, 41, 52, 49, 58, 61, 57, 66, 70, 68, 77].map((v, i, a) => (
              <div key={i} className={`flex-1 rounded-sm ${i === a.length - 1 ? 'bg-[#E88F24]' : 'bg-[#56C4C4]'}`} style={{ height: `${v}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MembersMock() {
  const rows: [string, string, string, string][] = [
    ['Noura A.', 'Active', 'Today', 'bg-[#E8F5EE] text-[#25704F]'],
    ['Faisal K.', 'New', '2 days ago', 'bg-[#E6F6F6] text-[#0F5A5A]'],
    ['Reem S.', 'Quiet', '19 days ago', 'bg-[#FDF2E3] text-[#8A4F0B]'],
    ['Omar H.', 'At risk', '5 weeks ago', 'bg-[#FCEBEA] text-[#9E3A33]'],
  ];
  return (
    <div>
      <Example />
      <ul className="divide-y divide-gray-100">
        {rows.map(([n, s, l, c]) => (
          <li key={n} className="flex items-center gap-3 py-2">
            <span className="w-7 h-7 rounded-full bg-[#023C3C] text-white text-[11px] font-semibold flex items-center justify-center">{n.split(' ').map((w) => w[0]).join('')}</span>
            <span className="flex-1 text-sm font-medium">{n}</span>
            <span className="text-xs text-gray-400 w-24 text-right">{l}</span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full w-16 text-center ${c}`}>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ClassMock() {
  const rows: [string, string, number, number, number][] = [
    ['06:00', 'Hyrox Engine', 16, 16, 4],
    ['18:30', 'Ladies Strength', 11, 14, 0],
    ['20:00', 'Padel Drills', 8, 8, 2],
  ];
  return (
    <div>
      <Example />
      <ul className="space-y-3">
        {rows.map(([t, n, g, c, w]) => (
          <li key={n} className="flex items-center gap-3">
            <span className="text-sm font-semibold tabular-nums w-12">{t}</span>
            <span className="flex-1 text-sm">{n}</span>
            <div className="w-32">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-semibold tabular-nums">
                  {g}
                  <span className="text-gray-400 font-normal"> / {c}</span>
                </span>
                {w ? <span className="text-[#8A4F0B]">+{w} waiting</span> : null}
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className={`h-full rounded-full ${g >= c ? 'bg-[#62B797]' : 'bg-[#56C4C4]'}`} style={{ width: `${(g / c) * 100}%` }} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HeatMock() {
  // A typical Gulf week: dawn and after-sunset peaks, quieter Friday mornings.
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = [5, 6, 7, 8, 9, 16, 17, 18, 19, 20, 21, 22];
  const level = (d: number, h: number) => {
    const base = h <= 6 ? 0.75 : h >= 18 && h <= 21 ? 0.95 : h >= 16 ? 0.45 : 0.2;
    const day = d === 5 ? (h < 12 ? 0.25 : 0.7) : d === 6 ? 0.8 : d === 4 ? 0.85 : 1;
    return Math.min(1, base * day + ((d * 7 + h) % 5) * 0.03);
  };
  return (
    <div>
      <Example />
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `28px repeat(${hours.length}, 1fr)` }}>
        {days.map((d, di) => (
          <div key={d} className="contents">
            <span className="text-[10px] text-gray-400 self-center">{d}</span>
            {hours.map((h) => (
              <span key={h} className="aspect-square rounded-[3px]" style={{ background: `rgba(232,143,36,${(0.12 + 0.88 * level(di, h)).toFixed(2)})` }} />
            ))}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1.5 ps-[31px]">
        <span>5 am</span>
        <span>Afternoon</span>
        <span>10 pm</span>
      </div>
    </div>
  );
}

function ProofMock() {
  return (
    <div>
      <Example />
      <div className="rounded-lg bg-[#023C3C] text-white p-4">
        <p className="text-[10px] uppercase tracking-wider text-[#56C4C4]">What your club did between visits</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {[
            ['412', 'Bookings'],
            ['23', 'Came back'],
            ['188', 'Conversations'],
          ].map(([n, l]) => (
            <div key={l}>
              <p className={`${H} text-2xl font-black text-[#E88F24] tabular-nums`}>{n}</p>
              <p className="text-[11px] text-white/70">{l}</p>
            </div>
          ))}
        </div>
      </div>
      {TRAIN_ENABLED ? <p className="mt-3 text-xs text-gray-500">Plus every workout members log on their own, shown as a club total.</p> : null}
    </div>
  );
}
