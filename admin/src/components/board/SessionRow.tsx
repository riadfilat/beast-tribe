import Link from 'next/link';
import { LockSimple, Globe } from '@phosphor-icons/react/dist/ssr';
import { FillBar, Pill } from './ui';
import { fmtDay, fmtTime, LEVELS, sar, type TeamSession } from '@/lib/leader/sessions';

/** One session in a list: what, when, where, and how full. Money only when `showMoney`. */
export function SessionRow({ s, sportName, showMoney }: { s: TeamSession; sportName: string; showMoney: boolean }) {
  const full = s.capacity != null && s.going >= s.capacity;
  const left = s.capacity != null ? s.capacity - s.going : null;
  const status = s.cancelled
    ? <Pill tone="bad">Cancelled</Pill>
    : full
      ? <Pill tone="good">Full{s.waitlist ? ` · ${s.waitlist} waiting` : ''}</Pill>
      : left != null && left <= 2
        ? <Pill tone="warn">{left} spot{left === 1 ? '' : 's'} left</Pill>
        : s.going === 0 && s.startsAt.getTime() - Date.now() < 6 * 3600000 && s.startsAt.getTime() > Date.now()
          ? <Pill tone="bad">No players yet</Pill>
          : <Pill tone="info">{left != null ? `${left} spots left` : 'Open'}</Pill>;
  const bits = [`${fmtDay(s.startsAt)} · ${fmtTime(s.startsAt)}`, s.place, s.level ? LEVELS[s.level] : null, s.womenOnly ? 'Women only' : s.menOnly ? 'Men only' : null].filter(Boolean);
  return (
    <Link href={`/leader/sessions/${s.id}`} className="grid grid-cols-[44px_1fr] sm:grid-cols-[44px_1fr_auto] gap-3 items-center py-2.5 rule-top first:border-t-0 hover:opacity-90">
      <span className="w-11 h-11 rounded-xl grid place-items-center text-[11px] font-bold text-center leading-tight" style={{ background: 'var(--deep)', color: 'var(--aqua)', fontFamily: 'var(--bt-head)' }}>
        {sportName.slice(0, 5)}
      </span>
      <span className="min-w-0">
        <b className="flex items-center gap-1.5 text-[14px] truncate" style={{ fontFamily: 'var(--bt-head)', opacity: s.cancelled ? 0.6 : 1 }}>
          {s.guestOpen ? <Globe size={14} aria-label="Open to everyone" /> : <LockSimple size={14} aria-label="Community only" />}
          <span className="truncate">{s.title}</span>
        </b>
        <span className="hint block truncate">
          {bits.join(' · ')}
          {showMoney && s.price ? ` · ${sar(s.price)} each` : ''}
        </span>
      </span>
      <span className="col-start-2 sm:col-start-auto grid gap-1 justify-items-start sm:justify-items-end">
        {status}
        <FillBar going={s.going} capacity={s.capacity} />
      </span>
    </Link>
  );
}
