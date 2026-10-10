import Link from 'next/link';
import { ImageSquare, Phone, LinkSimple } from '@phosphor-icons/react/dist/ssr';
import { SPORT_NAMES } from '@/lib/workouts';
import { Pill } from '@/components/board/ui';
import { hasPin, type PlaceRow } from './list';
import { setPlaceShown } from './actions';

function Thumb({ src }: { src: string | null }) {
  return (
    <span className="well w-14 h-11 flex-none overflow-hidden grid place-items-center" style={{ color: 'var(--ink-faint)' }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
      ) : (
        <ImageSquare size={20} aria-hidden />
      )}
    </span>
  );
}

/** The places as a table: photo and name, sports, map pin, how to book, and show/hide. */
export function PlaceRows({ rows, communities }: { rows: PlaceRow[]; communities: Record<string, string> }) {
  return (
    <div className="overflow-x-auto">
      <table className="bt-table">
        <thead><tr><th>Place</th><th>Sports</th><th>Map</th><th>Booking</th><th>In the app</th></tr></thead>
        <tbody>
          {rows.map((p) => {
            const sports = p.sports || [];
            const shown = p.is_active !== false;
            return (
              <tr key={p.id} style={{ opacity: shown ? 1 : 0.6 }}>
                <td className="strong">
                  <Link href={`/hq/places/${p.id}`} className="flex items-center gap-3 min-w-[220px] group">
                    <Thumb src={p.image_url} />
                    <span className="min-w-0">
                      <span className="block group-hover:underline">{p.name}</span>
                      <span className="hint block">
                        {p.city}
                        {p.community_id ? ` · ${communities[p.community_id] ?? 'one community'} only` : ''}
                      </span>
                    </span>
                  </Link>
                </td>
                <td>
                  {sports.length ? (
                    <span className="flex flex-wrap gap-1">
                      {sports.slice(0, 3).map((s) => <Pill key={s} tone="info">{SPORT_NAMES[s]?.en ?? s}</Pill>)}
                      {sports.length > 3 ? <span className="hint">+{sports.length - 3}</span> : null}
                    </span>
                  ) : <span className="hint">None set</span>}
                </td>
                <td>{hasPin(p) ? <Pill tone="good">Pinned</Pill> : <Pill tone="warn">No pin</Pill>}</td>
                <td>
                  {p.phone || p.booking_url ? (
                    <span className="flex items-center gap-2" style={{ color: 'var(--ink-soft)' }}>
                      {p.phone ? <Phone size={16} aria-label="Has a phone number" /> : null}
                      {p.booking_url ? <LinkSimple size={16} aria-label="Has a booking link" /> : null}
                    </span>
                  ) : <span className="hint">—</span>}
                </td>
                <td>
                  <form action={setPlaceShown.bind(null, p.id, !shown)} className="flex items-center gap-2">
                    {shown ? <Pill tone="good">Shown</Pill> : <Pill tone="mute">Hidden</Pill>}
                    <button className="btn ghost small">{shown ? 'Hide' : 'Show'}</button>
                  </form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
