import { initials } from '@/components/board/Shell';

// Small pieces shared by the Safety tabs.

export const when = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' });

const TONE = { bad: 'var(--bad)', warn: 'var(--warn)', info: 'var(--aqua)', mute: 'var(--rule-strong)' } as const;

/** One item to look at: a coloured edge, who and when, what they wrote, and the buttons. */
export function Item({ tone, name, meta, badges, children, actions, dim }: { tone: keyof typeof TONE; name: string; meta: React.ReactNode; badges?: React.ReactNode; children?: React.ReactNode; actions: React.ReactNode; dim?: boolean }) {
  return (
    <div className="well grid grid-cols-[4px_1fr] overflow-hidden" style={{ opacity: dim ? 0.72 : 1 }}>
      <i className="self-stretch" style={{ background: TONE[tone] }} />
      <div className="p-3 grid gap-2 min-w-0">
        <div className="flex items-start gap-3">
          <span className="w-8 h-8 rounded-full grid place-items-center text-[11px] font-bold flex-none" style={{ background: 'var(--wash)', color: 'var(--ink-soft)' }}>{initials(name)}</span>
          <span className="flex-1 min-w-0">
            <b className="block truncate text-[13px]" style={{ fontFamily: 'var(--bt-head)' }}>{name}</b>
            <span className="hint block">{meta}</span>
          </span>
          {badges ? <span className="flex flex-wrap gap-1 justify-end">{badges}</span> : null}
        </div>
        {children}
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
    </div>
  );
}

/** What someone wrote, in a quiet quote. */
export function Said({ text }: { text: string | null }) {
  if (!text) return null;
  return <p className="text-[13px] whitespace-pre-wrap break-words" style={{ color: 'var(--ink-soft)' }}>{text}</p>;
}

/** A small photo thumbnail. */
export function Thumb({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="w-28 h-28 rounded-lg object-cover" style={{ background: 'var(--deep)' }} />
  );
}
