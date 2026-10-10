import { requireTeam } from '@/lib/leader/context';
import { createAdminClient } from '@/lib/supabase-server';
import { planOf } from '@/lib/plans';
import { Box, PageTop, Pill } from '@/components/board/ui';
import { ProfileForm } from './ProfileForm';
import { newJoinCode } from './actions';

const STATUS: Record<string, string> = { trial: 'Free trial', active: 'Active', past_due: 'Payment due', paused: 'Paused', cancelled: 'Cancelled' };

export default async function Profile() {
  const ctx = await requireTeam();
  const { data: biz } = ctx.businessId
    ? await createAdminClient().from('partners').select('plan, plan_status, trial_ends_at, plan_renews_at').eq('id', ctx.businessId).maybeSingle()
    : { data: null };
  const b: any = biz;
  const plan = planOf(b?.plan);
  const code = ctx.community.join_code;

  return (
    <>
      <PageTop title="Profile" sub={ctx.isLeader ? 'Changes show in the app straight away.' : 'Only leaders can change the profile.'} />
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 items-start">
        {ctx.isLeader ? (
          <ProfileForm c={ctx.community} canOpen={!['company', 'school'].includes(ctx.community.kind || '')} />
        ) : (
          <Box title={ctx.community.name} sub={ctx.community.city || undefined}>
            <p className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>{ctx.community.description || 'No description yet.'}</p>
          </Box>
        )}
        <div className="grid gap-4">
          <Box title="Grow" icon="people" sub="New members join with your code in the app: Tribe → Have a code?">
            <div className="kpi">
              <span className="eyebrow">Community code</span>
              <span className="block display text-[32px] tracking-[0.08em] select-all">{code || '—'}</span>
            </div>
            {ctx.isLeader ? (
              <form action={newJoinCode}>
                <button className="btn ghost small">Make a new code</button>
                <p className="hint mt-1">The old code stops working.</p>
              </form>
            ) : null}
          </Box>
          {ctx.isLeader ? (
            <Box title="Your plan" icon="chart">
              {b ? (
                <div className="grid gap-1.5">
                  <div className="flex items-center gap-2">
                    <b className="text-[16px]" style={{ fontFamily: 'var(--bt-head)' }}>{plan?.name || 'No plan yet'}</b>
                    <Pill tone={b.plan_status === 'active' ? 'good' : b.plan_status === 'past_due' ? 'bad' : 'info'}>{STATUS[b.plan_status] || b.plan_status}</Pill>
                  </div>
                  {b.plan_status === 'trial' && b.trial_ends_at ? <p className="hint">Trial ends {new Date(b.trial_ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}.</p> : null}
                  {b.plan_renews_at ? <p className="hint">Renews {new Date(b.plan_renews_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}.</p> : null}
                </div>
              ) : (
                <p className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>Free for now. Beast Tribe will talk to you before anything changes.</p>
              )}
              <p className="hint">Questions about your plan? Contact Beast Tribe. Members never pay, and we take 0% of what they pay you.</p>
            </Box>
          ) : null}
        </div>
      </div>
    </>
  );
}
