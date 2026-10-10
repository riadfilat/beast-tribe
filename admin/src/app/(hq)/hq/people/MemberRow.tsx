import Link from 'next/link';
import { initials } from '@/components/board/Shell';
import { nameOf, shortDate, since } from './shared';

/** One row of the People table; the name opens the person's page. */
export function MemberRow({ p }: { p: any }) {
  const name = nameOf(p);
  const fresh = p.last_active_date && Date.now() - new Date(p.last_active_date).getTime() < 7 * 86400000;
  return (
    <tr>
      <td>
        <Link href={`/hq/people/${p.id}`} className="flex items-center gap-2.5 min-w-0">
          {p.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-none" />
          ) : (
            <span className="w-8 h-8 rounded-full grid place-items-center text-[11px] font-bold flex-none" style={{ background: 'var(--aqua)', color: 'var(--board)' }}>{initials(name)}</span>
          )}
          <span className="min-w-0">
            <b className="block truncate text-[14px]" style={{ fontFamily: 'var(--bt-head)', color: 'var(--ink)' }}>{name}</b>
            {p.display_name && p.full_name && p.display_name !== p.full_name ? <span className="hint block truncate">{p.full_name}</span> : null}
          </span>
        </Link>
      </td>
      <td>{p.city || '—'}</td>
      <td>{p.communities?.length ? p.communities.map((c: any, i: number) => <span key={c.id}>{i ? ', ' : ''}<Link href={`/hq/communities/${c.id}`} className="link">{c.name}</Link></span>) : <span style={{ color: 'var(--ink-faint)' }}>Only Beast Tribe</span>}</td>
      <td style={{ color: fresh ? 'var(--good)' : undefined }}>{since(p.last_active_date)}</td>
      <td>{shortDate(p.created_at)}</td>
    </tr>
  );
}
