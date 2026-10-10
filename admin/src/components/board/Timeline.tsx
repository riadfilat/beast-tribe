import type { DaySession } from '@/lib/hq/data';

// One day's sessions by hour (Riyadh time), one lane per sport, coloured by how full they are.

const FILL = (s: DaySession) => {
  if (!s.going) return '#FF7A70';
  if (!s.capacity) return '#56C4C4';
  const r = s.going / s.capacity;
  return r >= 1 ? '#7BD88F' : r >= 0.5 ? '#56C4C4' : '#F2C14E';
};
const hourLabel = (h: number) => (h === 0 || h === 24 ? '12 am' : h < 12 ? `${h} am` : h === 12 ? '12 pm' : `${h - 12} pm`);

export function Timeline({ sessions, now, sportName }: { sessions: DaySession[]; now: number | null; sportName: (s: string) => string }) {
  const lanes = [...new Set(sessions.map((s) => s.sport))].slice(0, 8);
  const W = 760;
  const left = 78;
  const laneH = 26;
  const H = Math.max(1, lanes.length) * laneH + 26;
  const x = (h: number) => left + ((Math.min(24, Math.max(5, h)) - 5) / 19) * (W - left - 10);
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="block min-w-[640px] w-full h-auto" role="img" aria-label={`${sessions.length} sessions by hour`}>
        {[6, 9, 12, 15, 18, 21, 24].map((h) => (
          <g key={h}>
            <line x1={x(h)} x2={x(h)} y1={0} y2={H - 18} stroke="rgba(244,241,234,.10)" />
            <text x={x(h)} y={H - 4} textAnchor="middle" fontSize="10" fill="rgba(244,241,234,.58)">{hourLabel(h)}</text>
          </g>
        ))}
        {lanes.map((sport, i) => (
          <text key={sport} x={0} y={i * laneH + 16} fontSize="10" fill="rgba(244,241,234,.74)">{sportName(sport).slice(0, 12)}</text>
        ))}
        {sessions.filter((s) => lanes.includes(s.sport)).map((s) => {
          const i = lanes.indexOf(s.sport);
          const w = Math.max(8, x(s.hour + s.minutes / 60) - x(s.hour));
          return (
            <rect key={s.id} x={x(s.hour)} y={i * laneH + 4} width={w} height={18} rx={5} fill={FILL(s)} fillOpacity={0.88}>
              <title>{`${s.title}${s.community ? ` · ${s.community}` : ''} · ${s.going}${s.capacity ? ` of ${s.capacity}` : ''} players`}</title>
            </rect>
          );
        })}
        {now != null && now >= 5 && now <= 24 ? (
          <g>
            <line x1={x(now)} x2={x(now)} y1={0} y2={H - 18} stroke="#E88F24" strokeWidth={2} />
            <text x={x(now) + 4} y={10} fontSize="10" fontWeight="600" fill="#E88F24">now</text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}
