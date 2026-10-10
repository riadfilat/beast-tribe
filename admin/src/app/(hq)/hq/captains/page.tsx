import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { defaultCut, loadCaptains, loadStatement } from '@/lib/captains';
import { monthRange, sar } from '@/lib/format';
import { Box, Empty, Kpi, PageTop } from '@/components/board/ui';
import { CaptainItem, day } from './CaptainItem';
import { AssignForm, ShareForm } from './Forms';
import { Statement, totals } from './Statement';

export const revalidate = 0;

export default async function HqCaptains(props: { searchParams: Promise<{ m?: string; community?: string }> }) {
  await requireRole('admin');
  const searchParams = await props.searchParams;
  const db = createAdminClient();
  const month = monthRange(searchParams.m);
  const [all, statement, cut, { data: communities }] = await Promise.all([
    loadCaptains(),
    loadStatement(month.from, month.to),
    defaultCut(),
    db.from('communities').select('id, name').order('name').limit(1000),
  ]);
  const active = all.filter((c) => c.active);
  const ended = all.filter((c) => !c.active);
  const onBoard = active.reduce((s, c) => s + Math.min(c.thisWeek, c.target), 0);
  const wanted = active.reduce((s, c) => s + c.target, 0);
  const behind = active.filter((c) => c.thisWeek < c.target).length;
  const worked = statement.filter((r) => r.sessions > 0);
  const total = totals(worked);

  return (
    <>
      <div className="print:hidden grid gap-5">
        <PageTop
          title="Beast Captains"
          sub="Coaches HQ assigns to a community to keep its board busy with open sessions every week. A paid service outside the subscription: the community pays the hourly rate, the captain gets that rate less our share."
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi label="Captains" value={active.length} note={`${new Set(active.map((c) => c.communityId)).size} communities`} />
          <Kpi label="Sessions this week" value={`${onBoard} of ${wanted}`} note={behind ? `${behind} captain${behind === 1 ? '' : 's'} behind` : 'Everyone is on target'} />
          <Kpi label={`Billed, ${month.label}`} value={sar(total.billed)} note={`${total.hours.toFixed(1)} hours held`} />
          <Kpi label="Our share" value={sar(total.ours)} note={`${sar(total.payout)} to captains`} />
        </div>

        <Box title="This week" icon="coaching" sub="The week runs Sunday to Saturday. Captains who are behind get a reminder in the app on Sunday, Tuesday and Thursday morning. Tap a captain to change their terms or end it.">
          {active.length ? (
            <div className="grid">
              {active.map((c) => <CaptainItem key={`${c.communityId}-${c.userId}`} c={c} cut={cut} />)}
            </div>
          ) : (
            <Empty title="No captains yet" body="Assign your first Beast Captain below. They need an account in the app first." />
          )}
          {ended.length ? (
            <p className="hint">Ended: {ended.map((c) => `${c.name} (${c.community}, until ${day(c.endsOn)})`).join(' · ')}</p>
          ) : null}
        </Box>

        <div className="grid lg:grid-cols-3 gap-4 items-start">
          <Box title="Assign a captain" icon="people" sub="The coach needs an account in the app first. They join the community, see their week on the Board and get a message straight away." className="lg:col-span-2">
            <AssignForm communities={(communities || []) as { id: string; name: string }[]} preselect={searchParams.community} cut={cut} />
          </Box>
          <Box title="Our standard share" icon="chart" sub="The part of a captain’s hourly rate Beast Tribe keeps, unless a captain has their own.">
            <ShareForm cut={cut} />
          </Box>
        </div>
      </div>

      <Statement month={month} rows={worked} total={total} />
    </>
  );
}
