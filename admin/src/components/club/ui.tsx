import Link from 'next/link';

// Building blocks for the classic staff pages.

export const card = 'bg-white rounded-xl border border-gray-100 shadow-sm';
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-orange text-brand-teal text-sm font-semibold hover:brightness-95 transition disabled:opacity-60';
export const btnGhost =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition';
export const input = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-aqua/40';
export const label = 'block text-xs font-medium text-gray-600 mb-1';

export function Stat({ label, value, hint, tone = 'teal', href }: { label: string; value: string | number; hint?: string; tone?: 'teal' | 'orange' | 'aqua' | 'coral'; href?: string }) {
  const color = { teal: 'text-brand-teal', orange: 'text-[#B86A10]', aqua: 'text-[#147070]', coral: 'text-[#B5463F]' }[tone];
  const body = (
    <>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${color}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-gray-400">{hint}</p> : null}
    </>
  );
  return href ? (
    <Link href={href} className={`${card} p-5 block hover:border-gray-200 transition`}>
      {body}
    </Link>
  ) : (
    <div className={`${card} p-5`}>{body}</div>
  );
}

export function Avatar({ name, src, size = 32 }: { name: string; src: string | null; size?: number }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={size} height={size} className="rounded-full object-cover flex-none bg-gray-100" style={{ width: size, height: size }} />
  ) : (
    <span className="rounded-full flex-none bg-brand-teal text-white font-semibold flex items-center justify-center" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials || '•'}
    </span>
  );
}

/** Capacity bar: booked of capacity, with the waitlist called out. */
export function FillBar({ going, capacity, waitlist = 0 }: { going: number; capacity: number | null; waitlist?: number }) {
  const pct = capacity ? Math.min(100, Math.round((going / capacity) * 100)) : null;
  const full = capacity != null && going >= capacity;
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between text-xs mb-1">
        <span className="font-semibold text-gray-800 tabular-nums">
          {going}
          {capacity ? <span className="text-gray-400 font-normal"> / {capacity}</span> : <span className="text-gray-400 font-normal"> booked</span>}
        </span>
        {waitlist ? <span className="text-[#8A4F0B] font-medium">+{waitlist} waiting</span> : full ? <span className="text-[#25704F] font-medium">Full</span> : null}
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${full ? 'bg-brand-green' : 'bg-brand-aqua'}`} style={{ width: `${pct ?? Math.min(100, going * 5)}%` }} />
      </div>
    </div>
  );
}

/** Weekly bars with the current week highlighted. */
export function WeekBars({ data, labelOf }: { data: { start: Date; value: number }[]; labelOf: (d: Date) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="h-36 flex items-end gap-1.5">
        {data.map((d, i) => {
          const last = i === data.length - 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
              <span className={`text-[10px] tabular-nums ${last ? 'text-brand-teal font-semibold' : 'text-gray-400'}`}>{d.value || ''}</span>
              <div className={`w-full rounded-md ${last ? 'bg-brand-orange' : d.value ? 'bg-brand-aqua' : 'bg-gray-100'}`} style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }} />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[11px] text-gray-400">
        <span>{labelOf(data[0].start)}</span>
        <span>This week</span>
      </div>
    </div>
  );
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Bookings by weekday × hour (Riyadh time). Hours shown: 5 am to 11 pm. */
export function HeatMap({ heat }: { heat: number[][] }) {
  const hours = Array.from({ length: 19 }, (_, i) => i + 5);
  const max = Math.max(1, ...heat.flat());
  const hourLabel = (h: number) => (h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`);
  return (
    <div className="overflow-x-auto">
      <table className="border-separate" style={{ borderSpacing: 3 }}>
        <thead>
          <tr>
            <th />
            {hours.map((h) => (
              <th key={h} className="text-[10px] font-normal text-gray-400 w-6">
                {h % 3 === 0 ? hourLabel(h) : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((d, di) => (
            <tr key={d}>
              <td className="text-[11px] text-gray-500 pe-2">{d}</td>
              {hours.map((h) => {
                const v = heat[di][h];
                const a = v ? 0.18 + 0.82 * (v / max) : 0;
                return (
                  <td key={h} title={`${d} ${hourLabel(h)}: ${v} booking${v === 1 ? '' : 's'}`} className="w-6 h-6 rounded" style={{ background: v ? `rgba(232,143,36,${a.toFixed(2)})` : '#F3F4F6' }} />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {action}
    </div>
  );
}
