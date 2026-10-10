import { requireRole } from '@/lib/auth';
import Link from 'next/link';
import { health, loadCommunities } from '@/lib/hq/data';
import { FEATURES } from '@/lib/leader/features';
import { Box, Empty, PageTop, Pill } from '@/components/board/ui';
import { AddLeader } from './AddLeader';

export default async function HqCommunities() {
  await requireRole('admin');
  const comms = await loadCommunities(null);
  const noLeader = comms.filter((c) => !c.leaders.length).length;
  return (
    <>
      <PageTop title="Leaders & communities" sub={`${comms.length} communit${comms.length === 1 ? 'y' : 'ies'}${noLeader ? ` · ${noLeader} without a leader` : ''}`} action={
          <span className="flex flex-wrap gap-2">
            <Link href="/hq/leads" className="btn ghost small">Requests and leads</Link>
            <Link href="/hq/businesses" className="btn ghost small">Businesses</Link>
            <Link href="/hq/communities/new" className="btn small">New community</Link>
          </span>
        }
      />
      <Box title="Add a leader" icon="people" sub="A coach, gym, trainer, company HR or activation lead. They run their community from the leader dashboard and add their own supporters.">
        <AddLeader communities={comms.map((c) => ({ id: c.id, name: c.name }))} />
      </Box>
      <Box title="Communities" icon="communities">
        {comms.length ? (
          <div className="overflow-x-auto">
            <table className="bt-table">
              <thead><tr><th>Community</th><th>Leaders</th><th>Team</th><th>Members</th><th>Features</th><th>Health</th></tr></thead>
              <tbody>
                {comms.map((c) => {
                  const h = health(c);
                  return (
                    <tr key={c.id}>
                      <td className="strong"><Link href={`/hq/communities/${c.id}`} className="hover:underline">{c.name}</Link><span className="hint block">{[c.kind, c.city].filter(Boolean).join(' · ')}</span></td>
                      <td>{c.leaders.length ? c.leaders.join(', ') : <Pill tone="warn">No leader</Pill>}</td>
                      <td className="num">{c.supporters} supporter{c.supporters === 1 ? '' : 's'}</td>
                      <td className="num">{c.members}</td>
                      <td>{c.features.length ? <span className="flex flex-wrap gap-1">{c.features.map((f) => <Pill key={f} tone="info">{FEATURES.find((x) => x.key === f)?.title ?? f}</Pill>)}</span> : <span className="hint">None</span>}</td>
                      <td><Pill tone={h.tone}>{h.label}</Pill></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No communities yet" body="Add your first leader above; their community is created with them." />
        )}
      </Box>
    </>
  );
}
