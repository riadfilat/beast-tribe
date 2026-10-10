import { redirect } from 'next/navigation';
import { Plus, X } from '@phosphor-icons/react/dist/ssr';
import { requireTeam } from '@/lib/leader/context';
import { loadCoaches } from '@/lib/leader/coaching';
import { loadPeople } from '@/lib/leader/people';
import { Box, Empty, PageTop, Pill } from '@/components/board/ui';
import { addCoach, addSlot, removeSlot } from './actions';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const t12 = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
};

export default async function Coaching() {
  const ctx = await requireTeam();
  if (!ctx.features.has('coaching')) redirect('/leader/features');
  const [coaches, people] = await Promise.all([loadCoaches(ctx.community.id), loadPeople(ctx.community.id)]);
  const free = people.team.filter((t) => !coaches.some((c) => c.userId === t.id));

  return (
    <>
      <PageTop title="1:1 coaching" sub="Members book these free times in the app: Play → pick a coach." />
      {ctx.isLeader && free.length ? (
        <form action={addCoach} className="box flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <label className="label" htmlFor="user">Add a coach from your team</label>
            <select id="user" name="user" className="input">{free.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          </div>
          <button className="btn"><Plus size={16} weight="bold" /> Add coach</button>
          <p className="hint w-full">Coaches who aren’t on your team yet: add them as supporters first (People).</p>
        </form>
      ) : null}
      {coaches.length ? (
        <div className="grid lg:grid-cols-2 gap-4 items-start">
          {coaches.map((c) => {
            const mine = ctx.isLeader || c.userId === ctx.userId;
            return (
              <Box key={c.id} title={c.name} icon="coaching" sub={`${c.slots.length} free time${c.slots.length === 1 ? '' : 's'} a week · ${c.bookings.length} booked ahead`}>
                <div className="flex flex-wrap gap-1.5">
                  {c.slots.length ? c.slots.map((s) => (
                    <span key={s.id} className="chip">
                      {DAYS[s.day]} {t12(s.start)}–{t12(s.end)}
                      {mine ? <form action={removeSlot.bind(null, c.id, s.id)} className="inline-flex"><button aria-label="Remove this time"><X size={13} weight="bold" /></button></form> : null}
                    </span>
                  )) : <span className="hint">No free times yet.</span>}
                </div>
                {mine ? (
                  <form action={addSlot.bind(null, c.id)} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                    <select name="day" aria-label="Day" className="input py-1.5">{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select>
                    <input name="start" type="time" aria-label="From" defaultValue="06:00" className="input py-1.5" />
                    <input name="end" type="time" aria-label="To" defaultValue="07:00" className="input py-1.5" />
                    <button className="btn ghost small">Add</button>
                  </form>
                ) : null}
                {c.bookings.length ? (
                  <div className="grid">
                    {c.bookings.slice(0, 8).map((b, i) => (
                      <div key={i} className="flex justify-between gap-2 py-2 rule-top first:border-t-0 text-[13px]">
                        <span>{new Date(`${b.date}T12:00:00+03:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {t12(b.start)}</span>
                        <Pill tone="good">{b.who}</Pill>
                      </div>
                    ))}
                  </div>
                ) : null}
              </Box>
            );
          })}
        </div>
      ) : (
        <Empty title="No coaches yet" body={ctx.isLeader ? 'Add someone from your team as a coach, then set their weekly free times.' : 'Your leader adds coaches here.'} />
      )}
    </>
  );
}
