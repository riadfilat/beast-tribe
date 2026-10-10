import Link from 'next/link';
import SearchInput from '@/components/ui/SearchInput';
import { SPORT_NAMES } from '@/lib/workouts';
import { hrefWith, type PlaceFilters } from './list';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid sm:grid-cols-[90px_1fr] gap-2 items-center">
      <span className="eyebrow">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ href, on, children }: { href: string; on: boolean; children: React.ReactNode }) {
  return <Link href={href} aria-current={on ? 'true' : undefined} className={`chip ${on ? 'on' : ''}`}>{children}</Link>;
}

/** Search box and filter chips for the places list. Each choice is a link, so filters survive a reload. */
export function Filters({ f, cities, sports, communities }: { f: PlaceFilters; cities: string[]; sports: string[]; communities: { id: string; name: string }[] }) {
  return (
    <div className="grid gap-3">
      <SearchInput placeholder="Search by name, city or address" defaultValue={f.q || ''} className="input !pl-9 w-full sm:w-[340px]" />
      {cities.length > 1 ? (
        <Row label="City">
          <Chip href={hrefWith(f, { city: '' })} on={!f.city}>All</Chip>
          {cities.map((c) => <Chip key={c} href={hrefWith(f, { city: c })} on={f.city === c}>{c}</Chip>)}
        </Row>
      ) : null}
      {sports.length ? (
        <Row label="Sport">
          <Chip href={hrefWith(f, { sport: '' })} on={!f.sport}>All</Chip>
          {sports.map((s) => <Chip key={s} href={hrefWith(f, { sport: s })} on={f.sport === s}>{SPORT_NAMES[s]?.en ?? s}</Chip>)}
        </Row>
      ) : null}
      <Row label="Show">
        <Chip href={hrefWith(f, { status: '' })} on={!f.status}>All</Chip>
        <Chip href={hrefWith(f, { status: 'shown' })} on={f.status === 'shown'}>In the app</Chip>
        <Chip href={hrefWith(f, { status: 'hidden' })} on={f.status === 'hidden'}>Hidden</Chip>
        <Chip href={hrefWith(f, { status: 'nopin' })} on={f.status === 'nopin'}>No map pin</Chip>
      </Row>
      {communities.length ? (
        <Row label="Seen by">
          <Chip href={hrefWith(f, { community: '' })} on={!f.community}>All</Chip>
          <Chip href={hrefWith(f, { community: 'global' })} on={f.community === 'global'}>Everyone</Chip>
          {communities.map((c) => <Chip key={c.id} href={hrefWith(f, { community: c.id })} on={f.community === c.id}>{c.name} only</Chip>)}
        </Row>
      ) : null}
    </div>
  );
}
