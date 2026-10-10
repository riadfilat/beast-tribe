import { ArrowsClockwise, Globe, SealCheck } from '@phosphor-icons/react/dist/ssr';
import { Box, Pill } from '@/components/board/ui';
import SubmitButton from '@/components/SubmitButton';
import { ConfirmButton } from '@/components/ConfirmSubmit';
import { SPORTS } from '@/lib/workouts';
import { regenerateJoinCode, removeCommunityLeader, setCommunityLeader, verifyClub } from '../admin-actions';

// How people get in: the join code (private) or open joining, verification, and the leader the
// app lists under Community leaders (with their sport).

export interface JoinInfo {
  id: string;
  name: string;
  visibility: string | null;
  kind: string | null;
  join_code: string | null;
  seat_limit: number | null;
  contract_ends_at: string | null;
  is_default: boolean | null;
  verified_at: string | null;
  leader_id: string | null;
  listing: string | null;
  sport: string | null;
}

const date = (v: string) => new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export function JoinBox({ c, memberCount, leaderName }: { c: JoinInfo; memberCount: number; leaderName: string | null }) {
  const sportName = c.sport ? SPORTS.find(([id]) => id === c.sport)?.[1] ?? c.sport : null;
  const usage = [
    c.seat_limit ? `${memberCount} of ${c.seat_limit} seats used` : `${memberCount} member${memberCount === 1 ? '' : 's'}`,
    c.contract_ends_at ? `contract ends ${date(c.contract_ends_at)}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <Box title="Joining and listing" icon="communities" sub={usage}>
      {c.visibility === 'private' ? (
        <div className="well p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="eyebrow">Join code · share it with the {c.kind === 'compound' ? 'residents' : 'members'}</span>
            <p className="num text-[30px] font-extrabold tracking-[0.3em]" style={{ fontFamily: 'var(--bt-head)', color: 'var(--marker)' }}>{c.join_code || '—'}</p>
          </div>
          <form action={regenerateJoinCode.bind(null, c.id)}>
            <ConfirmButton confirmMessage="Make a new code? The old one stops working straight away." className="btn ghost small">
              <ArrowsClockwise size={14} weight="bold" /> New code
            </ConfirmButton>
          </form>
        </div>
      ) : (
        <p className="text-[13px] flex items-center gap-2" style={{ color: 'var(--ink-soft)' }}>
          <Globe size={16} style={{ color: 'var(--aqua)' }} /> Open: anyone can join from the app{c.is_default ? ', and every new member joins it automatically.' : '.'}
        </p>
      )}

      {c.is_default ? null : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rule-top pt-3">
            <span className="text-[14px] flex items-center gap-2">
              <SealCheck size={18} weight={c.verified_at ? 'fill' : 'regular'} style={{ color: c.verified_at ? 'var(--good)' : 'var(--ink-faint)' }} />
              {c.verified_at ? `Verified ${date(c.verified_at)}` : 'Not verified yet'}
            </span>
            <form action={verifyClub.bind(null, c.id, !c.verified_at)}>
              <SubmitButton className={c.verified_at ? 'btn ghost small' : 'btn small'} pendingLabel="Saving…">{c.verified_at ? 'Remove verification' : 'Verify'}</SubmitButton>
            </form>
          </div>

          <div className="grid gap-2 rule-top pt-3">
            {c.leader_id ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="min-w-0">
                  <b className="block text-[14px]" style={{ fontFamily: 'var(--bt-head)' }}>Listed leader: {leaderName || 'a member'}</b>
                  <span className="flex flex-wrap gap-1.5 mt-1">
                    {sportName ? <Pill tone="info">{sportName}</Pill> : null}
                    <Pill tone={c.listing === 'public' ? 'good' : 'mute'}>{c.listing === 'public' ? 'Listed for everyone' : 'Invite only'}</Pill>
                  </span>
                </span>
                <form action={removeCommunityLeader.bind(null, c.id)}>
                  <ConfirmButton confirmMessage="Take them off the Community leaders list? They stay a member." className="btn ghost small">Unlist leader</ConfirmButton>
                </form>
              </div>
            ) : (
              <p className="hint">No leader listed in the app yet. Listing one puts this community under Community leaders, where anyone can join it with one tap.</p>
            )}
            <details className="well p-3">
              <summary className="cursor-pointer text-[13px] font-semibold" style={{ fontFamily: 'var(--bt-head)' }}>{c.leader_id ? 'Change the listed leader' : 'List a leader in the app'}</summary>
              <form action={setCommunityLeader.bind(null, c.id)} className="grid gap-3 mt-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><label className="label" htmlFor="ll-email">Their email in the app</label><input id="ll-email" name="email" type="email" required className="input" placeholder="leader@example.com" /></div>
                  <div>
                    <label className="label" htmlFor="ll-sport">What they lead</label>
                    <select id="ll-sport" name="sport" className="input" defaultValue={c.sport ?? ''}>
                      <option value="">General community</option>
                      {SPORTS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" name="list" defaultChecked /> Verify it and list it for everyone</label>
                <p className="hint">They need a Beast Tribe account first. They also join the Team as leader.</p>
                <div><SubmitButton className="btn small" pendingLabel="Saving…">{c.leader_id ? 'Change leader' : 'List leader'}</SubmitButton></div>
              </form>
            </details>
          </div>
        </>
      )}
    </Box>
  );
}
