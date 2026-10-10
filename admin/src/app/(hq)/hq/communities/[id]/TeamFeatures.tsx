import { ToggleLeft, ToggleRight } from '@phosphor-icons/react/dist/ssr';
import { FEATURES } from '@/lib/leader/features';
import type { loadPeople } from '@/lib/leader/people';
import { Box, Pill } from '@/components/board/ui';
import { NavIcon } from '@/components/board/icons';
import { initials } from '@/components/board/Shell';
import { hqCancelInvite, hqRemoveFromTeam, hqToggleFeature } from '../actions';

// The people who run the community (leaders and supporters) and the features it has switched on.

type People = Awaited<ReturnType<typeof loadPeople>>;

export function TeamBox({ id, people }: { id: string; people: People }) {
  return (
    <Box title="Team" icon="people" sub="Leaders and the supporters they add. To add a leader, use Add a leader on Leaders & communities.">
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
  );
}

export function FeaturesBox({ id, on }: { id: string; on: Set<string> }) {
  return (
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
  );
}
