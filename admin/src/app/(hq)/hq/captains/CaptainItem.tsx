import type { CaptainRow } from '@/lib/captains';
import { sar } from '@/lib/format';
import SubmitButton from '@/components/SubmitButton';
import { ConfirmButton } from '@/components/ConfirmSubmit';
import { Pill } from '@/components/board/ui';
import { initials } from '@/components/board/Shell';
import { endCaptain, updateCaptain } from './actions';

export const day = (d: string | null) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Riyadh' }) : '—');

export function Face({ name, src }: { name: string; src: string | null }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={36} height={36} className="w-9 h-9 rounded-full object-cover flex-none" />
  ) : (
    <span className="w-9 h-9 rounded-full grid place-items-center text-[12px] font-bold flex-none" style={{ background: 'var(--aqua)', color: 'var(--board)' }}>
      {initials(name)}
    </span>
  );
}

/** One active captain: how their week is going, and (opened) their terms to edit or end. */
export function CaptainItem({ c, cut }: { c: CaptainRow; cut: number }) {
  const behind = c.thisWeek < c.target;
  const id = `${c.communityId}-${c.userId}`;
  return (
    <details className="group py-2.5 rule-top first:border-t-0">
      <summary className="flex flex-wrap items-center gap-3 cursor-pointer list-none">
        <Face name={c.name} src={c.avatarUrl} />
        <span className="flex-1 min-w-[160px]">
          <b className="block truncate text-[14px]" style={{ fontFamily: 'var(--bt-head)' }}>{c.name}</b>
          <span className="hint block truncate">{c.community}</span>
        </span>
        <Pill tone={behind ? 'bad' : 'good'}>{c.thisWeek} of {c.target} this week</Pill>
        <span className="hint w-24">Next week: <span className="num">{c.nextWeek}</span></span>
        <span className="hint w-28">Last held: {day(c.lastSession)}</span>
        <span className="num text-[13px] w-28 text-right">{c.rate === null ? <Pill tone="warn">No rate set</Pill> : `${sar(c.rate)} / hour`}</span>
        <span className="link text-[12px] font-semibold w-10 text-right" style={{ color: 'var(--aqua)' }}>
          <span className="group-open:hidden">Edit</span>
          <span className="hidden group-open:inline">Close</span>
        </span>
      </summary>

      <div className="well p-4 mt-3 grid gap-3">
        <form action={updateCaptain.bind(null, c.communityId, c.userId)} className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="label" htmlFor={`t-${id}`}>Sessions a week</label>
            <input id={`t-${id}`} name="weekly_target" type="number" min={1} max={14} defaultValue={c.target} className="input" />
          </div>
          <div>
            <label className="label" htmlFor={`r-${id}`}>Hourly rate (SAR)</label>
            <input id={`r-${id}`} name="hourly_rate_sar" type="number" min={0} step="1" defaultValue={c.rate ?? ''} className="input" />
          </div>
          <div>
            <label className="label" htmlFor={`c-${id}`}>Our share %</label>
            <input id={`c-${id}`} name="cut_pct" type="number" min={0} max={100} step="0.5" defaultValue={c.cutPct ?? ''} placeholder={`${cut} (standard)`} className="input" />
          </div>
          <div>
            <label className="label" htmlFor={`e-${id}`}>Ends on (optional)</label>
            <input id={`e-${id}`} name="ends_on" type="date" defaultValue={c.endsOn ?? ''} className="input" />
          </div>
          <SubmitButton pendingLabel="Saving…" className="btn">Save</SubmitButton>
          <div className="sm:col-span-2 lg:col-span-5">
            <label className="label" htmlFor={`n-${id}`}>Notes (only HQ sees these)</label>
            <input id={`n-${id}`} name="notes" defaultValue={c.notes ?? ''} maxLength={1000} className="input" placeholder="Days agreed, sports, who to invoice…" />
          </div>
        </form>
        <form action={endCaptain.bind(null, c.communityId, c.userId)}>
          <ConfirmButton confirmMessage={`End ${c.name}'s captaincy of ${c.community} today?`} className="btn danger small">
            End this captaincy today
          </ConfirmButton>
        </form>
      </div>
    </details>
  );
}
