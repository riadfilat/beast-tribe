import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ToggleLeft, ToggleRight } from '@phosphor-icons/react/dist/ssr';
import { createAdminClient } from '@/lib/supabase-server';
import { loadPeople } from '@/lib/leader/people';
import { FEATURES } from '@/lib/leader/features';
import { Box, PageTop, Pill } from '@/components/board/ui';
import { NavIcon } from '@/components/board/icons';
import { initials } from '@/components/board/Shell';
import { hqCancelInvite, hqRemoveFromTeam, hqToggleFeature } from '../actions';

export default async function HqCommunity({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createAdminClient();
  const [{ data: c }, { data: fs }, people] = await Promise.all([
    db.from('communities').select('id, name, city, kind, visibility, join_code, created_at').eq('id', id).maybeSingle(),
    db.from('community_features').select('feature').eq('community_id', id),
    loadPeople(id),
  ]);
  if (!c) notFound();
  const on = new Set(((fs || []) as any[]).map((f) => f.feature));
  const community = c as any;

  return (
    <>
      <Link href="/hq/communities" className="link text-[13px] inline-flex items-center gap-1"><ArrowLeft size={14} /> Leaders & communities</Link>
      <PageTop title={community.name} sub={[community.kind, community.city, community.visibility === 'open' ? 'open to its city' : 'private', `code ${community.join_code || '—'}`].filter(Boolean).join(' · ')} />
      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Box title="Team" icon="people" sub={`${people.members.length} member${people.members.length === 1 ? '' : 's'}`}>
          <div className="grid">
            {people.team.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2.5 rule-top first:border-t-0">
                <span className="w-9 h-9 rounded-full grid place-items-center text-[12px] font-bold flex-none" style={{ background: t.role === 'leader' ? 'var(--marker)' : 'var(--aqua)', color: 'var(--board)' }}>{initials(t.name)}</span>
                <span className="flex-1 min-w-0"><b className="block truncate text-[14px]" style={{ fontFamily: 'var(--bt-head)' }}>{t.name}</b><span className="hint">{t.role === 'leader' ? 'Leader' : 'Supporter'}</span></span>
                <form action={hqRemoveFromTeam.bind(null, id, t.id)}><button className="btn ghost small">Remove</button></form>
              </div>
            ))}
            {people.invites.map((i) => (
              <div key={i.id} className="flex items-center gap-3 py-2.5 rule-top">
                <span className="w-9 h-9 rounded-full flex-none" style={{ border: '1.5px dashed var(--rule-strong)' }} />
                <span className="flex-1 min-w-0"><b className="block truncate text-[14px]" style={{ fontFamily: 'var(--bt-head)' }}>{i.email}</b><span className="hint">Invited as {i.role} · waiting to sign in</span></span>
                <form action={hqCancelInvite.bind(null, id, i.id)}><button className="btn ghost small">Cancel</button></form>
              </div>
            ))}
            {!people.team.length && !people.invites.length ? <p className="hint">No leader yet. Add one from Leaders & communities.</p> : null}
          </div>
        </Box>
        <Box title="Features" icon="features" sub="Leaders switch these themselves; you can too.">
          <div className="grid gap-2">
            {FEATURES.map((f) => (
              <div key={f.key} className="flex items-center gap-3">
                <span style={{ color: 'var(--aqua)' }}><NavIcon name={f.key} size={18} active /></span>
                <span className="flex-1 text-[14px]">{f.title}</span>
                {on.has(f.key) ? <Pill tone="good">On</Pill> : null}
                <form action={hqToggleFeature.bind(null, id, f.key, !on.has(f.key))}>
                  <button className={`chip ${on.has(f.key) ? 'on' : ''}`}>{on.has(f.key) ? <ToggleRight size={16} weight="fill" /> : <ToggleLeft size={16} />} {on.has(f.key) ? 'Switch off' : 'Switch on'}</button>
                </form>
              </div>
            ))}
          </div>
        </Box>
      </div>
      <p className="hint">Edit the community’s details in the <Link href={`/communities/${id}`} className="link">classic page</Link>.</p>
    </>
  );
}
