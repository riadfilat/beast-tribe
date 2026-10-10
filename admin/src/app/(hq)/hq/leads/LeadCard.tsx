import Link from 'next/link';
import { ArrowRight, WhatsappLogo } from '@phosphor-icons/react/dist/ssr';
import SubmitButton from '@/components/SubmitButton';
import { Pill } from '@/components/board/ui';
import { updateLead } from './actions';
import { ALL_STAGES, CAPTAIN_REQUEST, KIND, KIND_TO_TYPE, LEADER_KINDS, age, nextStage, realEmail } from './stages';

export type Lead = {
  id: string;
  kind: string;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  size: string | null;
  message: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  partner_id: string | null;
  community_id: string | null;
  created_at: string;
};

/** One lead on the pipeline board: who they are, how to reach them, and what to do next. */
export function LeadCard({ lead: l }: { lead: Lead }) {
  const next = nextStage(l.status);
  const captain = l.source === CAPTAIN_REQUEST;
  const email = realEmail(l.email);
  const save = updateLead.bind(null, l.id);

  return (
    <article className="well p-3 grid gap-2 text-[13px]" style={captain ? { borderLeft: '3px solid var(--marker)' } : undefined}>
      <div className="grid gap-1">
        {captain ? <span><Pill tone="warn">Captain request</Pill></span> : null}
        <b className="text-[14px] leading-snug break-words" style={{ fontFamily: 'var(--bt-head)' }}>{l.business_name}</b>
        <span className="flex flex-wrap gap-1">
          <Pill tone="info">{KIND[l.kind] || l.kind}</Pill>
          {l.size ? <Pill tone="mute">{l.size}</Pill> : null}
        </span>
        <span className="hint">
          {[l.city, age(l.created_at), l.source && !captain ? `via ${l.source}` : null].filter(Boolean).join(' · ')}
        </span>
      </div>

      <div className="grid gap-0.5" style={{ color: 'var(--ink-soft)' }}>
        {l.contact_name && l.contact_name !== l.business_name ? <span style={{ color: 'var(--ink)' }}>{l.contact_name}</span> : null}
        {email ? <span className="select-all break-all">{email}</span> : null}
        {l.phone ? (
          <span className="flex items-center gap-2 flex-wrap">
            <span className="select-all num">{l.phone}</span>
            <a href={`https://wa.me/${String(l.phone).replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-1 text-[12px]">
              <WhatsappLogo size={14} /> WhatsApp
            </a>
          </span>
        ) : null}
        {!email && !l.phone ? <span className="hint">No contact details</span> : null}
      </div>

      {l.message ? <p className="line-clamp-3" title={l.message} style={{ color: 'var(--ink-soft)' }}>&ldquo;{l.message}&rdquo;</p> : null}
      {l.notes ? (
        <p className="rounded-lg px-2.5 py-2 whitespace-pre-line" style={{ background: 'var(--wash)', color: 'var(--ink)' }}>
          <span className="eyebrow block mb-0.5">Notes</span>
          {l.notes}
        </p>
      ) : null}

      <NextLinks lead={l} captain={captain} />

      <div className="flex flex-wrap gap-1.5 pt-1 rule-top">
        {next ? (
          <form action={save} className="mt-2">
            <input type="hidden" name="status" value={next.id} />
            <SubmitButton pendingLabel="Moving…" className="btn small">Move to {next.label}</SubmitButton>
          </form>
        ) : null}
        {l.status === 'lost' ? (
          <form action={save} className="mt-2">
            <input type="hidden" name="status" value="new" />
            <SubmitButton pendingLabel="Moving…" className="btn ghost small">Reopen</SubmitButton>
          </form>
        ) : (
          <form action={save} className="mt-2">
            <input type="hidden" name="status" value="lost" />
            <SubmitButton pendingLabel="Saving…" className="btn danger small">Mark lost</SubmitButton>
          </form>
        )}
      </div>

      <details className="group">
        <summary className="link cursor-pointer list-none text-[12px] font-semibold" style={{ color: 'var(--aqua)' }}>
          <span className="group-open:hidden">Edit notes or step</span>
          <span className="hidden group-open:inline">Close</span>
        </summary>
        <form action={save} className="grid gap-2 mt-2">
          <label className="label" htmlFor={`st-${l.id}`}>Step</label>
          <select id={`st-${l.id}`} name="status" defaultValue={l.status} className="input">
            {ALL_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <label className="label" htmlFor={`nt-${l.id}`}>Notes</label>
          <textarea id={`nt-${l.id}`} name="notes" defaultValue={l.notes || ''} rows={4} maxLength={4000} placeholder="What they said, next step, when" className="input resize-y" />
          <SubmitButton pendingLabel="Saving…" className="btn small">Save</SubmitButton>
        </form>
      </details>
    </article>
  );
}

/** Where a lead goes next in the dashboard: their club, their business record, or a new one. */
function NextLinks({ lead: l, captain }: { lead: Lead; captain: boolean }) {
  const links: { href: string; label: string }[] = [];
  if (captain) links.push({ href: l.community_id ? `/hq/captains?community=${l.community_id}` : '/hq/captains', label: 'Assign a Beast Captain' });
  if (l.kind === 'leader' && l.community_id) {
    links.push({ href: `/hq/communities/${l.community_id}`, label: 'Open the club to check it' });
  } else if (l.partner_id) {
    links.push({ href: `/hq/businesses/${l.partner_id}`, label: 'Open their business record' });
  } else {
    const leader = { href: '/hq/communities', label: 'Make them a leader' };
    const business = { href: `/hq/businesses/new?lead=${l.id}&type=${KIND_TO_TYPE[l.kind] || 'gym'}`, label: 'Create business record' };
    links.push(...(LEADER_KINDS.includes(l.kind) ? [leader, business] : [business, leader]));
  }
  return (
    <div className="grid gap-1">
      {links.map((x) => (
        <Link key={x.label} href={x.href} className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: 'var(--marker)', fontFamily: 'var(--bt-head)' }}>
          {x.label}
          <ArrowRight size={12} weight="bold" />
        </Link>
      ))}
    </div>
  );
}
