import Link from 'next/link';
import { requireTeam } from '@/lib/leader/context';
import { ago, loadPeople, STATUS, type MemberStatus } from '@/lib/leader/people';
import { Box, Empty, Kpi, PageTop, Pill } from '@/components/board/ui';
import { initials } from '@/components/board/Shell';
import { InviteForm } from './InviteForm';
import { cancelInvite, removeSupporter } from './actions';

const ORDER: MemberStatus[] = ['active', 'new', 'quiet', 'away'];

export default async function People({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const ctx = await requireTeam();
  const [p, q] = await Promise.all([loadPeople(ctx.community.id), searchParams]);
  const show = ORDER.includes(q.show as MemberStatus) ? (q.show as MemberStatus) : null;
  const count = (s: MemberStatus) => p.members.filter((m) => m.status === s).length;
  const list = show ? p.members.filter((m) => m.status === show) : p.members;

  return (
    <>
      <PageTop title="People" sub={`${p.members.length} member${p.members.length === 1 ? '' : 's'} · ${p.team.length} on the team`} />

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Box title="Your team" icon="people" sub={ctx.isLeader ? 'Supporters post sessions and check players in. They never see money, and can’t change courts, features or the profile.' : 'The people who run this community.'}>
          <div className="grid">
            {p.team.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2.5 rule-top first:border-t-0">
                <span className="w-9 h-9 rounded-full grid place-items-center text-[12px] font-bold flex-none" style={{ background: t.role === 'leader' ? 'var(--marker)' : 'var(--aqua)', color: 'var(--board)' }}>{initials(t.name)}</span>
                <span className="flex-1 min-w-0">
                  <b className="block truncate text-[14px]" style={{ fontFamily: 'var(--bt-head)' }}>{t.name}{t.id === ctx.userId ? ' (you)' : ''}</b>
                  <span className="hint">{t.role === 'leader' ? 'Leader' : 'Supporter'}</span>
                </span>
                {ctx.isLeader && t.role === 'supporter' ? (
                  <form action={removeSupporter.bind(null, t.id)}><button className="btn ghost small">Remove</button></form>
                ) : null}
              </div>
            ))}
            {p.invites.map((i) => (
              <div key={i.id} className="flex items-center gap-3 py-2.5 rule-top">
                <span className="w-9 h-9 rounded-full grid place-items-center flex-none" style={{ border: '1.5px dashed var(--rule-strong)' }} />
                <span className="flex-1 min-w-0">
                  <b className="block truncate text-[14px]" style={{ fontFamily: 'var(--bt-head)' }}>{i.email}</b>
                  <span className="hint">Invited as {i.role} · waiting for them to sign in</span>
                </span>
                {ctx.isLeader && i.role === 'supporter' ? <form action={cancelInvite.bind(null, i.id)}><button className="btn ghost small">Cancel</button></form> : null}
              </div>
            ))}
          </div>
          {ctx.isLeader ? <InviteForm /> : null}
        </Box>

        <Box title="Members" icon="people" sub="Tap a group to see who is in it.">
          <div className="grid grid-cols-2 gap-3">
            {ORDER.map((s) => (
              <Link key={s} href={show === s ? '/leader/people' : `/leader/people?show=${s}`} className="block" style={{ outline: show === s ? '2px solid var(--marker)' : 'none', borderRadius: 14 }}>
                <Kpi label={STATUS[s].label} value={count(s)} note={STATUS[s].hint} />
              </Link>
            ))}
          </div>
          <p className="hint">New members join with your code or link (Profile → Grow).</p>
        </Box>
      </div>

      <Box title={show ? STATUS[show].label : 'Everyone'} icon="people" action={show ? <Link href="/leader/people" className="link text-[13px]">Show everyone</Link> : null}>
        {list.length ? (
          <div className="overflow-x-auto">
            <table className="bt-table">
              <thead><tr><th>Member</th><th>Status</th><th>Last played</th><th>Sessions (30 days)</th><th>Joined</th></tr></thead>
              <tbody>
                {list.slice(0, 300).map((m) => (
                  <tr key={m.id}>
                    <td className="strong">{m.name}</td>
                    <td><Pill tone={STATUS[m.status].tone}>{STATUS[m.status].label}</Pill></td>
                    <td>{ago(m.lastPlayed)}</td>
                    <td className="num">{m.sessions30}</td>
                    <td>{m.joinedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No one here yet" body={show ? 'Nobody is in this group right now.' : 'Share your community code and members appear here as they join.'} />
        )}
      </Box>
    </>
  );
}
