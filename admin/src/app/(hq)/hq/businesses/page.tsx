import { attachProfiles } from '@/lib/profiles';
import Link from 'next/link';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { Box, Empty, Kpi, PageTop, Pill, Tabs } from '@/components/board/ui';
import { togglePartnerActive, togglePartnerVerification } from './actions';
import { PLAN_STATUS, PLANS, typeLabel } from './BusinessFields';

export const revalidate = 0;

// Every business record: coaches, gyms and venues, healthy restaurants, companies.

const GROUPS: { key: string; label: string; types: string[] | null }[] = [
  { key: 'all', label: 'All', types: null },
  { key: 'coaches', label: 'Coaches', types: ['coach', 'nutritionist', 'leader'] },
  { key: 'places', label: 'Gyms and venues', types: ['gym', 'venue', 'school'] },
  { key: 'food', label: 'Restaurants', types: ['nutrition'] },
  { key: 'companies', label: 'Companies', types: ['company', 'event_company'] },
];
const STATUS_TONE: Record<string, 'good' | 'warn' | 'bad' | 'info' | 'mute'> = { active: 'good', trial: 'info', past_due: 'bad', paused: 'warn', cancelled: 'mute' };

export default async function Businesses({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireRole('admin');
  const { show = 'all' } = await searchParams;
  const { data } = await createAdminClient()
    .from('partners')
    .select('id, business_name, partner_type, city, country, is_active, is_verified, plan, plan_status, user_id')
    .order('created_at', { ascending: false })
    .limit(500);
  // partners.user_id points at sign-ins, not profiles: look the login's name up separately.
  const all = await attachProfiles((data || []) as any[]);
  const group = GROUPS.find((g) => g.key === show) ?? GROUPS[0];
  const list = group.types ? all.filter((b) => group.types!.includes(b.partner_type)) : all;
  const paying = all.filter((b) => b.plan && b.plan_status === 'active').length;
  const trial = all.filter((b) => b.plan && b.plan_status === 'trial').length;
  const unverified = all.filter((b) => !b.is_verified).length;

  return (
    <>
      <PageTop
        title="Businesses"
        sub="Coaches, gyms, venues, restaurants and companies we work with."
        action={
          <span className="flex flex-wrap gap-2">
            <Link href="/hq/communities" className="btn ghost small">Leaders & communities</Link>
            <Link href="/hq/businesses/new" className="btn small"><Plus size={14} weight="bold" /> Add a business</Link>
          </span>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Businesses" value={all.length} />
        <Kpi label="Paying" value={paying} />
        <Kpi label="On free trial" value={trial} />
        <Kpi label="Not verified" value={unverified} note={unverified ? 'Check and verify them' : 'All checked'} />
      </div>
      <Tabs current={group.key} items={GROUPS.map((g) => ({ key: g.key, label: `${g.label} ${g.types ? all.filter((b) => g.types!.includes(b.partner_type)).length : all.length}`, href: g.key === 'all' ? '/hq/businesses' : `/hq/businesses?show=${g.key}` }))} />
      <Box>
        {list.length ? (
          <div className="overflow-x-auto">
            <table className="bt-table">
              <thead><tr><th>Business</th><th>What</th><th>Plan</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {list.map((b) => (
                  <tr key={b.id} style={b.is_active ? undefined : { opacity: 0.6 }}>
                    <td className="strong">
                      <Link href={`/hq/businesses/${b.id}`} className="hover:underline">{b.business_name}</Link>
                      <span className="hint block">{[b.profile?.full_name, b.city].filter(Boolean).join(' · ')}</span>
                    </td>
                    <td>{typeLabel(b.partner_type)}</td>
                    <td>
                      {b.plan ? (
                        <span className="flex flex-wrap items-center gap-1.5">
                          {PLANS.find(([k]) => k === b.plan)?.[1].split(' · ')[0] ?? b.plan}
                          <Pill tone={STATUS_TONE[b.plan_status] ?? 'mute'}>{PLAN_STATUS.find(([k]) => k === b.plan_status)?.[1] ?? b.plan_status}</Pill>
                        </span>
                      ) : <span className="hint">None</span>}
                    </td>
                    <td>
                      <span className="flex flex-wrap gap-1.5">
                        {b.is_verified ? <Pill tone="good">Verified</Pill> : <Pill tone="warn">Not verified</Pill>}
                        {b.is_active ? null : <Pill tone="mute">Hidden</Pill>}
                      </span>
                    </td>
                    <td>
                      <span className="flex flex-wrap justify-end gap-1.5">
                        <form action={togglePartnerVerification.bind(null, b.id, !b.is_verified)}><button className="btn ghost small">{b.is_verified ? 'Unverify' : 'Verify'}</button></form>
                        <form action={togglePartnerActive.bind(null, b.id, !b.is_active)}><button className="btn ghost small">{b.is_active ? 'Hide' : 'Show'}</button></form>
                        <Link href={`/hq/businesses/${b.id}`} className="btn ghost small">Open</Link>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={all.length ? 'None of this kind yet' : 'No businesses yet'}
            body="Add a coach, gym, venue or healthy restaurant. Coaches and gyms get a login for their own dashboard; a restaurant can just have a member offer."
            action={<Link href="/hq/businesses/new" className="btn small"><Plus size={14} weight="bold" /> Add a business</Link>}
          />
        )}
      </Box>
    </>
  );
}
