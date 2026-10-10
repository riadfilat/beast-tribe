'use client';

import { Globe, LockSimple } from '@phosphor-icons/react';

const LEVEL: Record<string, string> = { '': 'All levels', easy: 'Beginner', medium: 'Intermediate', hard: 'Advanced' };

function when(date: string, time: string) {
  if (!date || !time) return '';
  const d = new Date(`${date}T${time}:00+03:00`);
  if (isNaN(d.getTime())) return '';
  const day = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Riyadh' });
  const t = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Riyadh' }).toLowerCase();
  return `${day} · ${t}`;
}

/** How members will see the session on the app's Board, updated as the form changes. */
export function SessionPreview({ f, community, host }: { f: Record<string, any>; community: { name: string; city: string }; host: string }) {
  const title = f.title || `${f.sportName} with ${host}`;
  const bits = [LEVEL[f.level] ?? 'All levels', f.gender === 'women' ? 'Women only' : f.gender === 'men' ? 'Men only' : null, Number(f.repeat) > 1 ? 'Every week' : null, f.guests && f.who === 'community' ? `${f.guestSpots} guest spots` : null].filter(Boolean);
  return (
    <aside className="box grid gap-3 lg:sticky lg:top-5" aria-label="Preview">
      <h2 className="text-[15px] font-semibold">How members see it</h2>
      <div className="mx-auto w-full max-w-[290px] rounded-[38px] p-3 pt-5 grid gap-3" style={{ border: '8px solid #000', background: 'var(--board)' }}>
        <div className="flex justify-between px-1.5 text-[10px] font-semibold" style={{ color: 'var(--ink-faint)', fontFamily: 'var(--bt-head)' }}>
          <span>9:41</span>
          <span>Board</span>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--sheet)' }}>
          <div className="h-[92px] relative grid place-items-center" style={{ background: 'linear-gradient(135deg,#034E4E,#023C3C 60%,#012A2A)' }}>
            <span className="display text-[26px]" style={{ color: 'var(--aqua)' }}>{String(f.sportName).toUpperCase()}</span>
            <span className={`pill ${f.who === 'public' ? 'good' : 'info'} absolute top-2 left-2`}>
              {f.who === 'public' ? <><Globe size={11} /> Open to all</> : <><LockSimple size={11} /> {community.name}</>}
            </span>
          </div>
          <div className="px-3 pt-2.5 grid gap-1">
            <b className="text-[14px] leading-tight" style={{ fontFamily: 'var(--bt-head)' }}>{title}</b>
            <span className="text-[11px]" style={{ color: 'var(--ink-soft)' }}>{[when(f.date, f.time), f.place].filter(Boolean).join(' · ')}</span>
            <span className="text-[11px]" style={{ color: 'var(--ink-soft)' }}>{bits.join(' · ')}</span>
          </div>
          <div className="flex justify-between items-center px-3 pt-2 pb-3">
            <span className="text-[11px]" style={{ color: 'var(--ink-faint)' }}>
              {f.price === 'paid' && Number(f.fee) > 0 ? <><b style={{ color: 'var(--ink)' }}>{f.fee} SAR</b> at the venue</> : 'Free'} · 0 of {f.spots || '–'}
            </span>
            <span className="rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase" style={{ background: 'var(--marker)', color: 'var(--board)', fontFamily: 'var(--bt-head)' }}>I’m in</span>
          </div>
        </div>
        <p className="hint text-center">{f.who === 'public' ? `Shows on the Board for everyone in ${community.city}` : `Only ${community.name} members see it`}</p>
      </div>
    </aside>
  );
}
