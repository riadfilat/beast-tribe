import { requireRole } from '@/lib/auth';
import Link from 'next/link';
import { X } from '@phosphor-icons/react/dist/ssr';
import { cityPlace } from '@/lib/cities';
import { PageTop } from '@/components/board/ui';
import { NavIcon } from '@/components/board/icons';
import { ActivityView } from './ActivityView';
import { GrowthView } from './GrowthView';

type Q = { view?: string; day?: string; city?: string; range?: string; stage?: string };

export default async function CommandCenter({ searchParams }: { searchParams: Promise<Q> }) {
  await requireRole('admin');
  const q = await searchParams;
  const view = q.view === 'growth' ? 'growth' : 'activity';
  const city = q.city && q.city.length <= 80 ? q.city.toLowerCase() : null;
  const day = q.day && /^\d{4}-\d{2}-\d{2}$/.test(q.day) ? q.day : null;
  // Links keep the other choices (view, city, day) and change one.
  const link = (change: Record<string, string | null>) => {
    const next = new URLSearchParams(Object.entries({ ...q, ...change }).filter(([, v]) => v != null && v !== '') as [string, string][]);
    const s = next.toString();
    return s ? `/hq?${s}` : '/hq';
  };
  const today = new Date(Date.now() + 3 * 3600000).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

  return (
    <>
      <PageTop
        title="Command center"
        sub={
          <span className="inline-flex items-center gap-2">
            <span className="dot" aria-hidden /> Live · {today}
            {view === 'activity' ? ` · ${city ? cityPlace(city)?.name ?? city : 'all cities'}` : ''}
          </span>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            {view === 'activity' && city ? (
              <Link href={link({ city: null })} className="chip"><X size={14} weight="bold" /> All cities</Link>
            ) : null}
            <div className="inline-flex rounded-full p-[3px] gap-0.5" style={{ border: '1.5px solid var(--rule-strong)' }} role="group" aria-label="View">
              {[['activity', 'Activity', 'command'], ['growth', 'Growth', 'growth']].map(([k, label, icon]) => (
                <Link key={k} href={link({ view: k === 'activity' ? null : k, day: null, stage: null })} aria-current={view === k ? 'page' : undefined} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold" style={{ fontFamily: 'var(--bt-head)', background: view === k ? 'var(--ink)' : 'transparent', color: view === k ? 'var(--board)' : 'var(--ink-soft)' }}>
                  <NavIcon name={icon} size={16} active={view === k} /> {label}
                </Link>
              ))}
            </div>
          </div>
        }
      />
      {view === 'growth' ? <GrowthView range={q.range} stage={q.stage} link={link} /> : <ActivityView city={city} day={day} link={link} />}
    </>
  );
}
