import Link from 'next/link';
import { Box, Pill } from '@/components/board/ui';
import { initials } from '@/components/board/Shell';
import { ConfirmButton } from '@/components/ConfirmSubmit';
import { removeUserFromCommunity } from '../admin-actions';

// Everyone in the community (newest first), each removable. Long lists fold away.

export interface Member {
  id: string;
  name: string;
  handle: string | null;
  role: string | null;
  joined_at: string | null;
}

const SHOW = 20;
const ROLE: Record<string, string> = { admin: 'Leader', supporter: 'Supporter' };

function Row({ m, communityId, communityName }: { m: Member; communityId: string; communityName: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 rule-top first:border-t-0">
      <span className="w-8 h-8 rounded-full grid place-items-center text-[11px] font-bold flex-none" style={{ background: 'var(--wash)', color: 'var(--ink-soft)' }}>{initials(m.name)}</span>
      <span className="flex-1 min-w-0">
        <Link href={`/hq/people/${m.id}`} className="block truncate text-[14px] hover:underline">{m.name}</Link>
        <span className="hint">{[m.handle ? `@${m.handle}` : null, m.joined_at ? `joined ${new Date(m.joined_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : null].filter(Boolean).join(' · ')}</span>
      </span>
      {m.role && ROLE[m.role] ? <Pill tone="info">{ROLE[m.role]}</Pill> : null}
      <form action={removeUserFromCommunity.bind(null, m.id, communityId)}>
        <ConfirmButton confirmMessage={`Remove ${m.name} from ${communityName}?`} className="btn ghost small">Remove</ConfirmButton>
      </form>
    </div>
  );
}

export function MembersBox({ communityId, communityName, members, total }: { communityId: string; communityName: string; members: Member[]; total: number }) {
  const first = members.slice(0, SHOW);
  const rest = members.slice(SHOW);
  return (
    <Box title="Members" icon="people" sub={`${total.toLocaleString()} ${total === 1 ? 'person' : 'people'}${total > members.length ? ` (newest ${members.length} shown)` : ''}`}>
      {members.length ? (
        <div className="grid">
          {first.map((m) => <Row key={m.id} m={m} communityId={communityId} communityName={communityName} />)}
          {rest.length ? (
            <details className="rule-top pt-2">
              <summary className="cursor-pointer link text-[13px]">Show {rest.length} more</summary>
              <div className="grid">{rest.map((m) => <Row key={m.id} m={m} communityId={communityId} communityName={communityName} />)}</div>
            </details>
          ) : null}
        </div>
      ) : (
        <p className="hint">Nobody has joined yet. Share the join code or add a leader to get people in.</p>
      )}
    </Box>
  );
}
