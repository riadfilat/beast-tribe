import Link from 'next/link';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { Box, Pill } from '@/components/board/ui';
import SubmitButton from '@/components/SubmitButton';
import { ConfirmButton } from '@/components/ConfirmSubmit';
import { addCommunityPartner, removeCommunityPartner } from '../admin-actions';

// Businesses included for this community's members (a nutritionist, coach, gym or healthy
// kitchen), each with an optional perk. Members see them on the community page.

const ROLE_LABEL: Record<string, string> = { nutritionist: 'Nutritionist', coach: 'Coach', gym: 'Gym', kitchen: 'Healthy kitchen' };

export interface Included {
  partner_id: string;
  role: string;
  perk: string | null;
  perk_ar: string | null;
  partner: { business_name: string | null } | null;
}

export function PerksBox({ communityId, included, candidates }: { communityId: string; included: Included[]; candidates: { id: string; business_name: string; partner_type: string }[] }) {
  return (
    <Box title="Included businesses" icon="profile" sub="Experts and places members get with this community. They connect to them in the app and choose what to share.">
      {included.length ? (
        <div className="grid">
          {included.map((x) => (
            <div key={x.partner_id} className="flex items-center gap-3 py-2.5 rule-top first:border-t-0">
              <Pill tone="info">{ROLE_LABEL[x.role] || x.role}</Pill>
              <span className="flex-1 min-w-0">
                <Link href={`/hq/businesses/${x.partner_id}`} className="block truncate text-[14px] font-semibold hover:underline" style={{ fontFamily: 'var(--bt-head)' }}>{x.partner?.business_name || 'A business'}</Link>
                {x.perk ? <span className="hint block truncate">{x.perk}</span> : null}
              </span>
              <form action={removeCommunityPartner.bind(null, communityId, x.partner_id)}>
                <ConfirmButton confirmMessage="Take this business off the community?" className="btn ghost small">Remove</ConfirmButton>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <p className="hint">Nothing included yet.</p>
      )}
      {candidates.length ? (
        <form action={addCommunityPartner.bind(null, communityId)} className="well p-3 grid gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="pk-partner">Business</label>
              <select id="pk-partner" name="partner_id" required className="input">
                {candidates.map((c) => <option key={c.id} value={c.id}>{c.business_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="pk-role">Included as</label>
              <select id="pk-role" name="role" className="input">
                {Object.entries(ROLE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label" htmlFor="pk-perk">Perk (optional)</label><input id="pk-perk" name="perk" className="input" placeholder="Free monthly check-in" /></div>
            <div><label className="label" htmlFor="pk-perk-ar">Perk in Arabic</label><input id="pk-perk-ar" name="perk_ar" dir="rtl" className="input" placeholder="بالعربية" /></div>
          </div>
          <div><SubmitButton className="btn small" pendingLabel="Adding…"><Plus size={14} weight="bold" /> Include</SubmitButton></div>
        </form>
      ) : null}
      <p className="hint">Not in the list? <Link href="/hq/businesses/new" className="link">Add the business</Link> first as a nutritionist, coach, gym or healthy restaurant.</p>
    </Box>
  );
}
