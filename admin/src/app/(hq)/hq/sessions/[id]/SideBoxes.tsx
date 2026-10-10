import { Prohibit, Trash } from '@phosphor-icons/react/dist/ssr';
import { Box } from '@/components/board/ui';
import { ConfirmButton } from '@/components/ConfirmSubmit';
import SubmitButton from '@/components/SubmitButton';
import { COUNTRIES } from '@/lib/events';
import { cancelSession, deleteSession } from '../actions';

/** The facts staff look up: who it is for, who posted it, where it lives. */
export function Details({ e, community, creator }: { e: any; community: string | null; creator: string | null }) {
  const rows: [string, string | null][] = [
    ['Community', e.visibility === 'pack' ? 'A group (only its members see it)' : community],
    ['Open to', e.is_women_only ? 'Women only' : e.is_men_only ? 'Men only' : 'Everyone'],
    ['Coach', e.coach_name],
    ['Gym or club', e.gym_name],
    ['Country', COUNTRIES.find((c) => c.code === e.country)?.name ?? e.country],
    ['Price', Number(e.price_sar) > 0 ? `${Number(e.price_sar)} SAR per player` : 'Free'],
    ['Posted by', creator],
    ['Posted on', e.created_at ? new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Riyadh' }) : null],
  ];
  return (
    <Box title="Details" icon="sessions">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="contents">
            <dt style={{ color: 'var(--ink-faint)' }}>{k}</dt>
            <dd style={{ color: 'var(--ink)' }}>{v}</dd>
          </div>
        ))}
      </dl>
      {e.cancelled_at ? (
        <p className="hint">Cancelled {new Date(e.cancelled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Riyadh' })}{e.cancel_reason ? `: ${e.cancel_reason}` : ''}</p>
      ) : null}
    </Box>
  );
}

export function CancelBox({ id, series }: { id: string; series: boolean }) {
  return (
    <Box title="Cancel" sub="Everyone booked gets a notification. The session stays here, marked cancelled.">
      <form action={cancelSession.bind(null, id)} className="grid gap-2.5">
        <input name="reason" className="input" maxLength={200} placeholder="Reason (optional), e.g. court closed" aria-label="Reason" />
        {series ? (
          <select name="scope" className="input" defaultValue="one" aria-label="Which sessions">
            <option value="one">Only this one</option>
            <option value="series">This and all the next weekly ones</option>
          </select>
        ) : null}
        <SubmitButton className="btn danger" pendingLabel="Cancelling…">
          <span className="inline-flex items-center gap-2"><Prohibit size={15} weight="bold" /> Cancel session</span>
        </SubmitButton>
      </form>
    </Box>
  );
}

export function DeleteBox({ id }: { id: string }) {
  return (
    <Box title="Delete for good" sub="Removes the session with its bookings and chat. Players are not told, so cancel first if anyone booked.">
      <form action={deleteSession.bind(null, id)}>
        <ConfirmButton confirmMessage="Delete this session for good? This can't be undone." className="btn danger small">
          <span className="inline-flex items-center gap-2"><Trash size={14} weight="bold" /> Delete</span>
        </ConfirmButton>
      </form>
    </Box>
  );
}
