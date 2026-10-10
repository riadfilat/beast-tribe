import Link from 'next/link';
import { ArrowRight, ArrowUp, ArrowDown } from '@phosphor-icons/react/dist/ssr';
import { NavIcon } from './icons';

// Building blocks of the board dashboards. Server components; no client state.

export function PageTop({ title, sub, action }: { title: string; sub?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[24px] font-bold leading-tight">{title}</h1>
        {sub ? <p className="text-[13px] mt-0.5" style={{ color: 'var(--ink-faint)' }}>{sub}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Box({ title, icon, sub, action, children, className = '' }: { title?: string; icon?: string; sub?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`box grid gap-3.5 content-start ${className}`}>
      {title ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold flex items-center gap-2">
              {icon ? <span style={{ color: 'var(--aqua)' }}><NavIcon name={icon} size={18} /></span> : null}
              {title}
            </h2>
            {sub ? <p className="hint mt-0.5">{sub}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** A number card. `delta` compares with last week: shown green when up, red when down. */
export function Kpi({ label, value, unit, note, delta }: { label: string; value: string | number; unit?: string; note?: string; delta?: { text: string; dir: 'up' | 'down' | 'same' } }) {
  return (
    <div className="kpi grid gap-1">
      <span className="eyebrow">{label}</span>
      <span className="num text-[28px] font-extrabold leading-tight" style={{ fontFamily: 'var(--bt-head)' }}>
        {value}
        {unit ? <small className="text-[13px] font-semibold ms-1" style={{ color: 'var(--ink-faint)' }}>{unit}</small> : null}
      </span>
      {delta ? (
        <span className="text-[12px] flex items-center gap-1" style={{ color: delta.dir === 'up' ? 'var(--good)' : delta.dir === 'down' ? 'var(--bad)' : 'var(--ink-faint)' }}>
          {delta.dir === 'up' ? <ArrowUp size={12} weight="bold" /> : delta.dir === 'down' ? <ArrowDown size={12} weight="bold" /> : null}
          {delta.text}
        </span>
      ) : note ? (
        <span className="hint">{note}</span>
      ) : null}
    </div>
  );
}

export function Pill({ tone = 'info', children }: { tone?: 'good' | 'warn' | 'bad' | 'info' | 'mute'; children: React.ReactNode }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

/** One insight: a plain sentence about the community and the one thing to do about it. */
export function Insight({ icon, title, body, action, tone = 'aqua' }: { icon: React.ReactNode; title: string; body: string; action?: { label: string; href: string }; tone?: 'aqua' | 'orange' }) {
  const c = tone === 'orange' ? { bg: 'rgba(232,143,36,.16)', fg: 'var(--marker)' } : { bg: 'rgba(86,196,196,.14)', fg: 'var(--aqua)' };
  return (
    <div className="well grid grid-cols-[40px_1fr] gap-3 p-3 items-start">
      <span className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: c.bg, color: c.fg }}>{icon}</span>
      <div className="min-w-0">
        <b className="block text-[14px]" style={{ fontFamily: 'var(--bt-head)' }}>{title}</b>
        <p className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>{body}</p>
        {action ? (
          <Link href={action.href} className="inline-flex items-center gap-1 mt-1.5 text-[12px] font-semibold" style={{ color: 'var(--marker)', fontFamily: 'var(--bt-head)' }}>
            {action.label}
            <ArrowRight size={12} weight="bold" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/** A friendly empty state: what will appear here and how to get the first one. */
export function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="well p-5 grid gap-2 justify-items-start">
      <b className="text-[14px]" style={{ fontFamily: 'var(--bt-head)' }}>{title}</b>
      <p className="text-[13px] max-w-[60ch]" style={{ color: 'var(--ink-soft)' }}>{body}</p>
      {action}
    </div>
  );
}

/** Booked of capacity, as a small bar. */
export function FillBar({ going, capacity }: { going: number; capacity: number | null }) {
  const pct = capacity ? Math.min(100, Math.round((going / capacity) * 100)) : Math.min(100, going * 5);
  const full = capacity != null && going >= capacity;
  return (
    <div className="w-[120px] grid gap-1 justify-items-end">
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--wash)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: full ? 'var(--good)' : 'var(--aqua)' }} />
      </div>
      <span className="hint num">
        {going}
        {capacity ? ` of ${capacity}` : ''} players
      </span>
    </div>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'good' | 'bad'; children: React.ReactNode }) {
  const color = tone === 'good' ? 'var(--good)' : tone === 'bad' ? 'var(--bad)' : 'var(--aqua)';
  return (
    <div className="rounded-xl px-4 py-3 text-[13px]" style={{ background: 'var(--wash)', borderLeft: `3px solid ${color}` }}>
      {children}
    </div>
  );
}

/** Tabs as links (the page reads the choice from the address, so it can be shared and reloaded). */
export function Tabs({ items, current }: { items: { href: string; label: string; count?: number; key: string }[]; current: string }) {
  return (
    <nav className="flex flex-wrap gap-1.5" aria-label="Sections">
      {items.map((t) => (
        <Link key={t.key} href={t.href} aria-current={t.key === current ? 'page' : undefined} className={`chip ${t.key === current ? 'on' : ''}`}>
          {t.label}
          {t.count ? <span className="pill bad num ms-1">{t.count > 99 ? '99+' : t.count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
