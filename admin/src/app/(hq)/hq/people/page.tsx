import Link from 'next/link';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr';
import { createAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/auth';
import { searchTerm } from '@/lib/search';
import { Notice, Box, Empty, Kpi, PageTop } from '@/components/board/ui';
import { MemberRow } from './MemberRow';
import { REGIONS, SHOWS, daysAgo, type Show } from './shared';

export const revalidate = 0;

const PER_PAGE = 25;

type Params = { q?: string; region?: string; show?: string; page?: string; deleted?: string };

export default async function HqPeople(props: { searchParams: Promise<Params> }) {
  await requireRole('admin');
  const sp = await props.searchParams;
  const db = createAdminClient();

  const page = Math.max(1, parseInt(sp.page || '1') || 1);
  const offset = (page - 1) * PER_PAGE;
  const q = searchTerm(sp.q);
  const region = sp.region && sp.region !== 'all' ? sp.region : null;
  const show: Show = SHOWS.some((s) => s.key === sp.show) ? (sp.show as Show) : 'all';

  // "Last in the app" comes from the daily activity the app records (member_days, migration 092).
  const activeIds = [...new Set(((await db.from('member_days').select('user_id').gte('day', daysAgo(7).slice(0, 10)).limit(10000)).data || []).map((d: any) => d.user_id as string))];
  // Real memberships (community_members), not counting the Beast Tribe community everyone is in.
  const { data: memberRows } = await db.from('community_members').select('user_id, community:communities!inner(id, name, is_default)').eq('community.is_default', false).limit(20000);
  const placed = new Set(((memberRows || []) as any[]).map((m) => m.user_id as string));
  let query = db
    .from('profiles')
    .select('id, full_name, display_name, avatar_url, city, region, last_active_date, created_at, community:communities!profiles_community_id_fkey(id, name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PER_PAGE - 1);
  if (q) query = query.or(`full_name.ilike.%${q}%,display_name.ilike.%${q}%`);
  if (region) query = query.eq('region', region);
  if (show === 'active') query = query.in('id', activeIds.length ? activeIds : ['00000000-0000-0000-0000-000000000000']);
  if (show === 'new') query = query.gte('created_at', daysAgo(30));
  if (show === 'none' && placed.size) query = query.not('id', 'in', `(${[...placed].join(',')})`);

  const head = () => db.from('profiles').select('id', { count: 'exact', head: true });
  const [{ data: rows, count }, total, active, fresh, loose] = await Promise.all([
    query,
    head(),
    Promise.resolve({ count: activeIds.length }),
    head().gte('created_at', daysAgo(30)),
    head().then((x) => ({ count: Math.max(0, (x.count || 0) - placed.size) })),
  ]);
  const people = (rows || []) as any[];
  if (people.length) {
    const { data: seen } = await db.from('member_days').select('user_id, day').in('user_id', people.map((p) => p.id)).order('day', { ascending: false }).limit(2000);
    const last = new Map<string, string>();
    for (const d of (seen || []) as any[]) if (!last.has(d.user_id)) last.set(d.user_id, d.day);
    for (const p of people) p.last_active_date = last.get(p.id) ?? p.last_active_date ?? null;
    for (const p of people) p.communities = ((memberRows || []) as any[]).filter((m) => m.user_id === p.id).map((m) => m.community);
  }
  const pages = Math.max(1, Math.ceil((count || 0) / PER_PAGE));

  const href = (next: Partial<Params>) => {
    const p: Record<string, string> = {};
    const merged = { q: sp.q, region: sp.region, show: sp.show, ...next };
    for (const [k, v] of Object.entries(merged)) if (v && v !== 'all' && !(k === 'page' && v === '1')) p[k] = v;
    const s = new URLSearchParams(p).toString();
    return s ? `/hq/people?${s}` : '/hq/people';
  };
  const filtered = !!(q || region || show !== 'all');

  return (
    <>
      <PageTop title="People" sub="Everyone who has signed up to Beast Tribe. Open a person to change their community, send a password reset, or suspend them." />
      {sp.deleted ? <Notice tone="good">{sp.deleted}’s account was deleted. The staff log records it.</Notice> : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Members" value={(total.count || 0).toLocaleString()} note="signed up in total" />
        <Kpi label="Active this week" value={(active.count || 0).toLocaleString()} note="opened the app in 7 days" />
        <Kpi label="New this month" value={(fresh.count || 0).toLocaleString()} note="joined in the last 30 days" />
        <Kpi label="Only in Beast Tribe" value={(loose.count || 0).toLocaleString()} note="not in a club, gym or company yet" />
      </div>

      <Box title={filtered ? `${(count || 0).toLocaleString()} found` : 'Everyone'} icon="people">
        <form action="/hq/people" className="grid sm:grid-cols-[1fr_200px_auto] gap-2 items-end">
          {show !== 'all' ? <input type="hidden" name="show" value={show} /> : null}
          <div>
            <label className="label" htmlFor="q">Search by name</label>
            <input id="q" name="q" className="input" defaultValue={sp.q || ''} placeholder="e.g. Sara" autoComplete="off" />
          </div>
          <div>
            <label className="label" htmlFor="region">Country</label>
            <select id="region" name="region" className="input" defaultValue={region || 'all'}>
              <option value="all">All countries</option>
              {REGIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <button className="btn"><MagnifyingGlass size={16} weight="bold" /> Search</button>
        </form>

        <nav className="flex flex-wrap gap-1.5" aria-label="Show">
          {SHOWS.map((s) => (
            <Link key={s.key} href={href({ show: s.key, page: undefined })} aria-current={show === s.key ? 'page' : undefined} className={`chip ${show === s.key ? 'on' : ''}`}>
              {s.label}
            </Link>
          ))}
          {filtered ? <Link href="/hq/people" className="link text-[13px] self-center ms-2">Clear</Link> : null}
        </nav>

        {people.length ? (
          <div className="overflow-x-auto">
            <table className="bt-table">
              <thead><tr><th>Member</th><th>City</th><th>Community</th><th>Last active</th><th>Joined</th></tr></thead>
              <tbody>{people.map((p) => <MemberRow key={p.id} p={p} />)}</tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={filtered ? 'No one matches' : 'No members yet'}
            body={filtered ? 'Try a shorter name, another country, or clear the filters.' : 'People appear here as soon as they sign up in the app.'}
            action={filtered ? <Link href="/hq/people" className="btn ghost small">Clear filters</Link> : undefined}
          />
        )}

        {pages > 1 ? (
          <div className="flex items-center justify-center gap-2">
            {page > 1 ? <Link href={href({ page: String(page - 1) })} className="btn ghost small">Previous</Link> : null}
            <span className="hint num">Page {page} of {pages}</span>
            {page < pages ? <Link href={href({ page: String(page + 1) })} className="btn ghost small">Next</Link> : null}
          </div>
        ) : null}
      </Box>
    </>
  );
}
