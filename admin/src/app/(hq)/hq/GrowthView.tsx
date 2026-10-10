import Link from 'next/link';
import { userSupabase } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { Box, Empty, Kpi, Pill } from '@/components/board/ui';
import { HBar } from '@/components/board/charts';
import { change } from '@/lib/leader/overview';

// The command center's Growth view: everything outside the app. Leads, revenue, sign-ups and first
// sessions come from our database; social, website visits and installs need accounts connected
// first, and say so instead of showing made-up numbers.

const STAGES: [string, string][] = [['new', 'New leads'], ['contacted', 'Contacted'], ['demo', 'Demo done'], ['trial', 'Trial'], ['won', 'Paying']];
const REACHED: Record<string, string[]> = { new: ['new', 'contacted', 'demo', 'trial', 'won', 'lost'], contacted: ['contacted', 'demo', 'trial', 'won'], demo: ['demo', 'trial', 'won'], trial: ['trial', 'won'], won: ['won'] };
const STATUS_TONE: Record<string, 'info' | 'warn' | 'good' | 'bad' | 'mute'> = { new: 'warn', contacted: 'info', demo: 'info', trial: 'info', won: 'good', lost: 'mute' };
const SOCIAL = [['Instagram', 'Meta business login'], ['TikTok', 'TikTok business login'], ['Snapchat', 'Snapchat business login'], ['LinkedIn', 'LinkedIn page admin']];
const sar = (n: number) => `${Math.round(n).toLocaleString('en-US')}`;
const ago = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
};

export async function GrowthView({ range, stage, link }: { range?: string; stage?: string; link: (q: Record<string, string | null>) => string }) {
  const days = [7, 30, 90].includes(Number(range)) ? Number(range) : 30;
  const pick = STAGES.some(([k]) => k === stage) ? stage! : 'new';
  const [{ data: g, error }, { data: bo }] = await Promise.all([
    (await userSupabase()).rpc('hq_growth', { p_days: days }),
    createAdminClient().rpc('business_overview'),
  ]);
  if (error) throw new Error(error.message);
  const f: Record<string, number> = g.funnel;
  const b: any = bo || {};
  const paying = Object.values((b.paying || {}) as Record<string, number>).reduce((a, n) => a + Number(n), 0);
  const leads = (g.leads as any[]).filter((l) => REACHED[pick].includes(l.status));
  const sources = g.sources as { source: string; n: number }[];
  const mrrBy = Object.entries((b.mrr_by || {}) as Record<string, number>).sort((x, y) => y[1] - x[1]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="eyebrow me-1">Period</span>
        {[7, 30, 90].map((d) => <Link key={d} href={link({ range: d === 30 ? null : String(d) })} className={`chip ${d === days ? 'on' : ''}`}>Last {d} days</Link>)}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi label="Monthly revenue" value={sar(Number(b.mrr || 0))} unit="SAR" note="Flat plans · 0% from members" />
        <Kpi label="Paying leaders" value={paying} note={`${b.trials ?? 0} in trial`} />
        <Kpi label="New leads" value={f.new} note={`last ${days} days`} />
        <Kpi label="Sign-ups" value={g.signups} delta={change(g.signups, g.signups_before)} />
        <Kpi label="Joined a first session" value={g.first_session} note={g.signups ? `${Math.round((g.first_session / Math.max(1, g.signups)) * 100)}% of sign-ups` : `last ${days} days`} />
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4 items-start">
        <Box title="Leads funnel" icon="growth" sub="From the first message to a paying leader. Tap a step to see who is there." action={<Link href="/leads" className="link text-[13px]">Work the leads</Link>}>
          <div className="grid gap-1.5">
            {STAGES.map(([k, label], i) => {
              const n = f[k] ?? 0;
              const prev = i ? f[STAGES[i - 1][0]] ?? 0 : 0;
              return (
                <Link key={k} href={link({ stage: k === 'new' ? null : k })} className="grid grid-cols-[110px_1fr_64px] gap-2.5 items-center" aria-current={pick === k ? 'true' : undefined}>
                  <span className="text-[13px] font-semibold" style={{ fontFamily: 'var(--bt-head)' }}>{label}</span>
                  <span className="h-[30px] flex items-center">
                    <i className="h-full rounded-lg flex items-center ps-2.5 text-[13px] font-bold not-italic" style={{ width: `${Math.max(8, f.new ? (n / f.new) * 100 : 8)}%`, minWidth: 34, background: pick === k ? 'var(--marker)' : 'var(--aqua)', color: 'var(--board)', fontFamily: 'var(--bt-head)' }}>{n}</i>
                  </span>
                  <span className="hint text-right">{i && prev ? `${Math.round((n / prev) * 100)}% next` : ''}</span>
                </Link>
              );
            })}
          </div>
          {f.lost ? <p className="hint">{f.lost} lost in this period.</p> : null}
          {leads.length ? (
            <div className="grid">
              {leads.slice(0, 8).map((l) => (
                <div key={l.id} className="flex items-center gap-3 py-2 rule-top first:border-t-0">
                  <span className="flex-1 min-w-0">
                    <b className="block truncate text-[14px]" style={{ fontFamily: 'var(--bt-head)' }}>{l.name}</b>
                    <span className="hint block truncate">{[l.kind, l.city, l.source ? `from ${l.source}` : null, ago(l.created_at)].filter(Boolean).join(' · ')}</span>
                  </span>
                  <Pill tone={STATUS_TONE[l.status] ?? 'info'}>{l.status}</Pill>
                </div>
              ))}
            </div>
          ) : <Empty title="No leads at this step" body={`Nothing reached this step in the last ${days} days.`} />}
        </Box>
        <div className="grid gap-4">
          <Box title="Where leads come from" icon="places">
            {sources.length ? <div className="grid gap-2">{sources.map((s) => <HBar key={s.source} label={s.source} value={s.n} max={sources[0].n} />)}</div> : <p className="hint">No leads in this period.</p>}
          </Box>
          <Box title="Revenue by plan" icon="chart" sub="Paying leaders today, monthly">
            {mrrBy.length ? <div className="grid gap-2">{mrrBy.map(([k, v]) => <HBar key={k} label={k} value={Number(v)} max={Number(mrrBy[0][1])} text={`${sar(Number(v))}`} />)}</div> : <p className="hint">No paying plans yet. Trials and first plans show here.</p>}
          </Box>
        </div>
      </div>

      <Box title="From post to player" icon="growth" sub="Does marketing turn into people showing up?">
        <div className="grid gap-1.5">
          {[['Saw our posts', null], ['Tapped a link', null], ['Visited the website', null], ['Installed the app', null], ['Signed up', g.signups], ['Joined a first session', g.first_session]].map(([label, n]) => (
            <div key={label as string} className="grid grid-cols-[170px_1fr] gap-2.5 items-center text-[13px]">
              <span>{label}</span>
              {n == null ? <span className="hint">Not connected yet</span> : <span className="h-[26px] flex items-center"><i className="h-full rounded-lg flex items-center ps-2.5 font-bold not-italic" style={{ width: `${Math.max(6, g.signups ? Math.sqrt((n as number) / g.signups) * 100 : 6)}%`, minWidth: 30, background: 'var(--aqua)', color: 'var(--board)' }}>{n as number}</i></span>}
            </div>
          ))}
        </div>
      </Box>

      <Box title="Marketing and social" icon="growth" sub="Followers, posts and reach appear here once each account is connected.">
        <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-2.5">
          {SOCIAL.map(([name, needs]) => (
            <div key={name} className="well p-3.5 grid gap-1.5" style={{ border: '1.5px dashed var(--rule-strong)', borderRadius: 14 }}>
              <b className="text-[14px]" style={{ fontFamily: 'var(--bt-head)' }}>{name}</b>
              <span className="pill mute justify-self-start">Not connected</span>
              <span className="hint">Needs: {needs}</span>
            </div>
          ))}
          <div className="well p-3.5 grid gap-1.5" style={{ border: '1.5px dashed var(--rule-strong)', borderRadius: 14 }}>
            <b className="text-[14px]" style={{ fontFamily: 'var(--bt-head)' }}>Operation Beast store</b>
            <span className="hint">Sales and visitors appear here once the shop is live.</span>
          </div>
        </div>
        <p className="hint">You connect each account once with its business login (Beast Tribe never sees the password). Website visits and app installs connect the same way.</p>
      </Box>
    </>
  );
}
