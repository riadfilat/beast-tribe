// Small SVG charts for the board dashboards, drawn to scale from the data they get.

const AQUA = '#56C4C4';
const ORANGE = '#E88F24';
const FAINT = 'rgba(244,241,234,.58)';
const GRID = 'rgba(244,241,234,.10)';

/** Bars with labels; the biggest bar is orange. Values print above each bar. */
export function Bars({ data, height = 150, unit = '' }: { data: { label: string; value: number }[]; height?: number; unit?: string }) {
  const W = 520;
  const H = height;
  const pad = 28;
  const max = Math.max(1, ...data.map((d) => d.value));
  const top = max <= 5 ? 5 : Math.ceil(max / 5) * 5;
  const bw = (W - pad - 8) / Math.max(1, data.length);
  const y = (v: number) => H - 22 - (v / top) * (H - 40);
  const best = data.length ? Math.max(...data.map((d) => d.value)) : 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={data.map((d) => `${d.label}: ${d.value}${unit}`).join(', ')} className="w-full h-auto block">
      {[0, top / 2, top].map((t) => (
        <g key={t}>
          <line x1={pad} x2={W} y1={y(t)} y2={y(t)} stroke={GRID} />
          <text x={pad - 6} y={y(t) + 3} textAnchor="end" fontSize="10" fill={FAINT}>
            {Number.isInteger(t) ? t : t.toFixed(1)}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = pad + 6 + i * bw;
        const w = Math.max(6, bw - 12);
        const hi = d.value > 0 && d.value === best;
        return (
          <g key={i}>
            <rect x={x} y={y(d.value)} width={w} height={Math.max(0, H - 22 - y(d.value))} rx="5" fill={hi ? ORANGE : AQUA} opacity={hi ? 1 : 0.75}>
              <title>{`${d.label}: ${d.value}${unit}`}</title>
            </rect>
            <text x={x + w / 2} y={H - 6} textAnchor="middle" fontSize="10" fill={FAINT}>
              {d.label}
            </text>
            {d.value ? (
              <text x={x + w / 2} y={y(d.value) - 5} textAnchor="middle" fontSize="10" fontWeight="600" fill="#F4F1EA">
                {d.value}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

/** A weekday × hour grid. `cells[day][hour]` from 0; the fullest cells are orange. */
export function Heat({ cells, hours, days }: { cells: number[][]; hours: number[]; days: string[] }) {
  const max = Math.max(1, ...cells.flat());
  const colour = (v: number) => {
    if (!v) return 'rgba(244,241,234,.06)';
    const r = v / max;
    return r > 0.85 ? ORANGE : `rgba(86,196,196,${(0.2 + r * 0.6).toFixed(2)})`;
  };
  const label = (h: number) => (h === 0 ? '12 am' : h < 12 ? `${h} am` : h === 12 ? '12 pm' : `${h - 12} pm`);
  return (
    <div className="grid gap-[3px] text-[10px]" style={{ gridTemplateColumns: `44px repeat(${days.length}, minmax(0, 1fr))`, color: FAINT }}>
      <span />
      {days.map((d) => (
        <span key={d} className="text-center font-semibold">
          {d}
        </span>
      ))}
      {hours.map((h) => (
        <div key={h} className="contents">
          <span className="text-right pe-1 leading-[18px]">{label(h)}</span>
          {days.map((d, di) => (
            <span key={d} className="h-[18px] rounded" style={{ background: colour(cells[di]?.[h] ?? 0) }} title={`${d} ${label(h)}: ${cells[di]?.[h] ?? 0}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** A label, a bar and a value, for ranked lists. */
export function HBar({ label, value, max, text }: { label: React.ReactNode; value: number; max: number; text?: string }) {
  return (
    <div className="grid grid-cols-[minmax(90px,140px)_1fr_48px] gap-2.5 items-center text-[12px]">
      <span className="truncate">{label}</span>
      <span className="h-2.5 rounded-md overflow-hidden" style={{ background: 'rgba(244,241,234,.06)' }}>
        <span className="block h-full rounded-md" style={{ width: `${max ? Math.max(2, (value / max) * 100) : 0}%`, background: AQUA }} />
      </span>
      <span className="text-right num" style={{ color: 'var(--ink-soft)' }}>{text ?? value}</span>
    </div>
  );
}

/** A tiny trend line with its last point in orange. */
export function Spark({ values, width = 70, height = 20, fluid = false }: { values: number[]; width?: number; height?: number; fluid?: boolean }) {
  if (!values.length) return null;
  const m = Math.max(1, ...values);
  const step = values.length > 1 ? (width - 4) / (values.length - 1) : 0;
  const pts = values.map((v, i) => [2 + i * step, height - 2 - (v / m) * (height - 5)]);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={fluid ? '100%' : width} height={height} preserveAspectRatio={fluid ? 'none' : undefined} aria-hidden className="block">
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={AQUA} strokeWidth="1.6" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={ORANGE} />
    </svg>
  );
}
