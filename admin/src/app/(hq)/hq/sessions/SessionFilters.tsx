import Link from 'next/link';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr';
import { Tabs } from '@/components/board/ui';
import type { SportOption } from '@/lib/events';
import { WHENS, type Filters } from './data';

/** Builds a /hq/sessions address from the current filters plus changes (null removes one). */
export function sessionsHref(f: Filters, change: Partial<Record<keyof Filters, string | number | null>>) {
  const all: Record<string, string | number | null> = { q: f.q || null, when: f.when === 'upcoming' ? null : f.when, day: f.day, city: f.city, sport: f.sport, community: f.community, page: null, ...change };
  if (all.when === 'upcoming') all.when = null;
  if (all.page === 1) all.page = null;
  const qs = new URLSearchParams(Object.entries(all).filter(([, v]) => v != null && v !== '').map(([k, v]) => [k, String(v)])).toString();
  return `/hq/sessions${qs ? `?${qs}` : ''}`;
}

export function SessionFilters({ f, sports, cities, communities }: {
  f: Filters;
  sports: SportOption[];
  cities: { key: string; name: string }[];
  communities: { id: string; name: string }[];
}) {
  const filtered = !!(f.q || f.day || f.city || f.sport || f.community);
  return (
    <div className="grid gap-3">
      <Tabs current={f.day ? '' : f.when} items={WHENS.map((w) => ({ key: w.key, label: w.label, href: sessionsHref(f, { when: w.key, day: null }) }))} />
      <form method="get" action="/hq/sessions" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_auto] items-end">
        {f.when !== 'upcoming' ? <input type="hidden" name="when" value={f.when} /> : null}
        <div>
          <label className="label" htmlFor="q">Search</label>
          <input id="q" name="q" className="input" defaultValue={f.q} placeholder="Name, coach, gym or place" />
        </div>
        <div>
          <label className="label" htmlFor="day">Day</label>
          <input id="day" name="day" type="date" className="input" defaultValue={f.day ?? ''} />
        </div>
        <div>
          <label className="label" htmlFor="city">City</label>
          <select id="city" name="city" className="input" defaultValue={f.city ?? ''}>
            <option value="">All cities</option>
            {cities.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="sport">Sport</label>
          <select id="sport" name="sport" className="input" defaultValue={f.sport ?? ''}>
            <option value="">All sports</option>
            {sports.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="community">Community</label>
          <select id="community" name="community" className="input" defaultValue={f.community ?? ''}>
            <option value="">All communities</option>
            {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <button className="btn small"><MagnifyingGlass size={14} weight="bold" /> Show</button>
          {filtered ? <Link href={sessionsHref(f, { q: null, day: null, city: null, sport: null, community: null })} className="link text-[13px]">Clear</Link> : null}
        </div>
      </form>
    </div>
  );
}
