'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FloppyDisk } from '@phosphor-icons/react';
import SubmitButton from '@/components/SubmitButton';

// The community's details, for creating one (no leader yet) and for editing it.

export interface CommunityValues {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  country?: string | null;
  city?: string | null;
  is_active?: boolean;
  visibility?: string | null;
  kind?: string | null;
  seat_limit?: number | null;
  contract_ends_at?: string | null;
}

const KINDS: [string, string][] = [['club', 'Club or coach'], ['gym', 'Gym'], ['company', 'Company'], ['school', 'School'], ['compound', 'Compound'], ['city', 'City'], ['brand', 'Beast Tribe (brand)']];
const COUNTRIES: [string, string][] = [['SA', 'Saudi Arabia'], ['AE', 'UAE'], ['KW', 'Kuwait'], ['BH', 'Bahrain'], ['QA', 'Qatar'], ['OM', 'Oman'], ['EG', 'Egypt'], ['JO', 'Jordan']];

const slugify = (raw: string) => raw.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');

export function CommunityFields({ action, community }: { action: (formData: FormData) => Promise<void>; community?: CommunityValues }) {
  const isEdit = !!community?.id;
  const [name, setName] = useState(community?.name || '');
  const [slug, setSlug] = useState(community?.slug || '');
  const [slugTouched, setSlugTouched] = useState(!!community?.slug);
  const [logo, setLogo] = useState(community?.logo_url || '');
  const [cover, setCover] = useState(community?.cover_url || '');

  return (
    <form action={action} className="grid gap-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="c-name">Name</label>
          <input id="c-name" name="name" required className="input" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => !slugTouched && name && setSlug(slugify(name))} placeholder="Riyadh Runners" />
        </div>
        <div>
          <label className="label" htmlFor="c-kind">Kind</label>
          <select id="c-kind" name="kind" className="input" defaultValue={community?.kind || 'club'}>
            {KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="c-desc">Short description</label>
        <textarea id="c-desc" name="description" rows={2} className="input" defaultValue={community?.description || ''} placeholder="A line members see on the community page" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="label" htmlFor="c-city">City</label><input id="c-city" name="city" className="input" defaultValue={community?.city || ''} placeholder="Riyadh" /></div>
        <div>
          <label className="label" htmlFor="c-country">Country</label>
          <select id="c-country" name="country" className="input" defaultValue={community?.country || 'SA'}>
            {COUNTRIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
      </div>
      <fieldset className="grid gap-2">
        <legend className="label">Who can join</legend>
        <div className="flex flex-wrap gap-1.5">
          <label className="relative"><input type="radio" className="sr" name="visibility" value="private" defaultChecked={(community?.visibility || 'private') === 'private'} /><span className="chip">Private · join with a code</span></label>
          <label className="relative"><input type="radio" className="sr" name="visibility" value="open" defaultChecked={community?.visibility === 'open'} /><span className="chip">Open · anyone can join</span></label>
        </div>
        <p className="hint">Private suits companies, compounds and clubs: only members see its sessions, groups and posts.</p>
      </fieldset>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="label" htmlFor="c-seats">Seats</label><input id="c-seats" name="seat_limit" type="number" min={1} className="input num" defaultValue={community?.seat_limit ?? ''} placeholder="No limit" /></div>
        <div><label className="label" htmlFor="c-ends">Contract ends</label><input id="c-ends" name="contract_ends_at" type="date" className="input" defaultValue={community?.contract_ends_at ? String(community.contract_ends_at).slice(0, 10) : ''} /></div>
      </div>
      <p className="hint -mt-2">When the seats are full or the contract has ended, nobody new can join with the code. Members already in stay.</p>
      <details className="well p-3">
        <summary className="cursor-pointer text-[13px] font-semibold" style={{ fontFamily: 'var(--bt-head)' }}>Pictures and web address</summary>
        <div className="grid gap-3 mt-3">
          <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div><label className="label" htmlFor="c-logo">Logo (image link)</label><input id="c-logo" name="logo_url" type="url" className="input" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://…" /></div>
            {logo ? <span className="w-11 h-11 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${logo})`, border: '1px solid var(--rule-strong)' }} aria-label="Logo preview" /> : null}
          </div>
          <div>
            <label className="label" htmlFor="c-cover">Cover picture (image link)</label>
            <input id="c-cover" name="cover_url" type="url" className="input" value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://…" />
            {cover ? <div className="mt-2 h-24 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${cover})` }} aria-label="Cover preview" /> : null}
          </div>
          <div>
            <label className="label" htmlFor="c-slug">Web name</label>
            <input id="c-slug" name="slug" required className="input" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} placeholder="riyadh-runners" />
            <p className="hint mt-1">Made from the name; only change it if you need to.</p>
          </div>
        </div>
      </details>
      <label className="flex items-center gap-2 text-[14px]">
        <input type="checkbox" name="is_active" defaultChecked={community?.is_active !== false} />
        Live in the app (untick to hide it)
      </label>
      <div className="flex flex-wrap gap-2">
        <SubmitButton className="btn" pendingLabel={isEdit ? 'Saving…' : 'Creating…'}>
          <FloppyDisk size={16} weight="bold" /> {isEdit ? 'Save details' : 'Create community'}
        </SubmitButton>
        {isEdit ? null : <Link href="/hq/communities" className="btn ghost">Cancel</Link>}
      </div>
    </form>
  );
}
