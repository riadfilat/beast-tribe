import { Box, Empty, FillBar, Pill } from '@/components/board/ui';
import { initials } from '@/components/board/Shell';
import type { Player } from '../data';

const ORDER: Record<string, number> = { going: 0, waitlist: 1 };

/** Everyone who booked, the ones going first. Read only: leaders tick who came in their dashboard. */
export function Players({ players, capacity, started }: { players: Player[]; capacity: number | null; started: boolean }) {
  const going = players.filter((p) => p.status === 'going');
  const list = [...players].sort((a, b) => (ORDER[a.status] ?? 2) - (ORDER[b.status] ?? 2));
  return (
    <Box
      title={`Players (${going.length}${capacity ? ` of ${capacity}` : ''})`}
      icon="people"
      sub={started ? 'Who booked, and who was ticked as came.' : 'They see this session in the app.'}
      action={<FillBar going={going.length} capacity={capacity} />}
    >
      {list.length ? (
        <div className="grid">
          {list.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 py-2.5 rule-top first:border-t-0">
              <span className="w-9 h-9 rounded-full grid place-items-center text-[12px] font-bold flex-none" style={{ background: 'var(--aqua)', color: 'var(--deep)' }}>{initials(p.name)}</span>
              <span className="flex-1 min-w-[120px]">
                <b className="block text-[14px]" style={{ fontFamily: 'var(--bt-head)' }}>{p.name}</b>
                <span className="hint">Booked {p.joined.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Riyadh' })}</span>
              </span>
              {p.status === 'waitlist' ? <Pill tone="warn">Waiting list</Pill> : p.status !== 'going' ? <Pill tone="mute">{p.status.replace(/_/g, ' ')}</Pill> : null}
              {p.status === 'going' && started ? (p.came ? <Pill tone="good">Came</Pill> : <Pill tone="mute">Not ticked</Pill>) : null}
            </div>
          ))}
        </div>
      ) : (
        <Empty title="No players yet" body="Members join from the Board in the app. Sharing it in a community chat fills it faster." />
      )}
    </Box>
  );
}
