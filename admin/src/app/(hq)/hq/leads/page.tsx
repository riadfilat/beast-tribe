import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { Box, PageTop } from '@/components/board/ui';
import { AddLeadForm } from './AddLeadForm';
import { LeadCard, type Lead } from './LeadCard';
import { LOST, STAGES, type Stage } from './stages';

export const revalidate = 0;

const PER_STEP = 100;

export default async function HqLeads(props: { searchParams: Promise<{ lost?: string }> }) {
  await requireRole('admin');
  const showLost = (await props.searchParams).lost === '1';
  const db = createAdminClient();
  const steps = showLost ? [...STAGES, LOST] : STAGES;

  // Rows per visible step, plus one count per step (a row fetch stops at the API's 1,000-row cap).
  const [rows, counts] = await Promise.all([
    Promise.all(steps.map((s) => db.from('partner_leads').select('*').eq('status', s.id).order('created_at', { ascending: false }).limit(PER_STEP))),
    Promise.all([...STAGES, LOST].map((s) => db.from('partner_leads').select('id', { count: 'exact', head: true }).eq('status', s.id))),
  ]);
  const err = [...rows, ...counts].find((r) => r.error)?.error;
  if (err) throw new Error(err.message);
  const count: Record<string, number> = {};
  [...STAGES, LOST].forEach((s, i) => (count[s.id] = counts[i].count || 0));
  const open = STAGES.filter((s) => s.id !== 'won').reduce((n, s) => n + count[s.id], 0);

  return (
    <>
      <PageTop
        title="Leads"
        sub={
          <>
            {open} open · {count.won} paying. Trial requests from <Link href="/for-gyms" className="link">/for-gyms</Link> and{' '}
            <Link href="/for-companies" className="link">/for-companies</Link>, requests from the app, and the ones you add by hand.
          </>
        }
        action={
          <Link href={showLost ? '/hq/leads' : '/hq/leads?lost=1'} className="btn ghost small">
            {showLost ? 'Hide lost' : `Show lost (${count.lost})`}
          </Link>
        }
      />

      <div className="overflow-x-auto -mx-1 px-1 pb-2">
        <div className="flex gap-3 items-start">
          {steps.map((s, i) => (
            <Column key={s.id} stage={s} total={count[s.id]} leads={(rows[i].data || []) as Lead[]} />
          ))}
        </div>
      </div>

      <Box title="Add a lead by hand" icon="growth" sub="Someone you met at an event, a referral, a WhatsApp message. It starts in New.">
        <AddLeadForm />
      </Box>
    </>
  );
}

function Column({ stage, total, leads }: { stage: Stage; total: number; leads: Lead[] }) {
  return (
    <section className="box !p-3 grid gap-2.5 content-start flex-1 min-w-[230px]" aria-label={stage.label}>
      <header className="px-1">
        <h2 className="text-[14px] font-semibold flex items-center justify-between gap-2" style={{ fontFamily: 'var(--bt-head)' }}>
          {stage.label}
          <span className="num pill mute">{total}</span>
        </h2>
        <p className="hint">{stage.hint}</p>
      </header>
      {leads.map((l) => <LeadCard key={l.id} lead={l} />)}
      {!leads.length ? (
        <p className="well px-3 py-4 text-center hint">{stage.id === 'new' ? 'No new leads. Add one by hand below.' : 'Nobody at this step.'}</p>
      ) : null}
      {total > leads.length ? <p className="hint px-1">Showing the newest {leads.length} of {total}.</p> : null}
    </section>
  );
}
