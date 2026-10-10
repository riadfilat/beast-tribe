import { Plus, X } from '@phosphor-icons/react/dist/ssr';
import { Box } from '@/components/board/ui';
import SubmitButton from '@/components/SubmitButton';
import { addCoachSlot, removeCoachSlot } from '../actions';

// A coach's weekly free times. Members hosting a session book these; each block is one booking.

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const hhmm = (t: string) => String(t).slice(0, 5);

export interface Slot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export function CoachSlots({ partnerId, slots }: { partnerId: string; slots: Slot[] }) {
  const byDay = DAY_NAMES.map((d, i) => ({ day: d, slots: slots.filter((s) => s.day_of_week === i) })).filter((d) => d.slots.length);
  return (
    <Box title="Weekly free times" icon="coaching" sub="Members hosting a session can book these times.">
      {byDay.length ? (
        <div className="grid">
          {byDay.map((d) => (
            <div key={d.day} className="flex items-start gap-3 py-2 rule-top first:border-t-0">
              <span className="w-24 flex-none text-[13px] font-semibold pt-1.5" style={{ fontFamily: 'var(--bt-head)' }}>{d.day}</span>
              <div className="flex flex-wrap gap-1.5">
                {d.slots.map((s) => (
                  <span key={s.id} className="chip num">
                    {hhmm(s.start_time)}–{hhmm(s.end_time)}
                    <form action={removeCoachSlot.bind(null, partnerId, s.id)} className="inline-flex"><button aria-label={`Remove ${d.day} ${hhmm(s.start_time)}`}><X size={13} weight="bold" /></button></form>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="hint">No free times yet. Add the hours they coach below.</p>
      )}
      <form action={addCoachSlot.bind(null, partnerId)} className="well p-3 grid gap-3">
        <fieldset>
          <legend className="label">Days</legend>
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map((d, i) => (
              <label key={d} className="relative"><input type="checkbox" className="sr" name="day_of_week" value={i} /><span className="chip">{d}</span></label>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label" htmlFor="s-from">From</label><input id="s-from" name="start_time" type="time" required defaultValue="06:00" className="input" /></div>
          <div><label className="label" htmlFor="s-to">To</label><input id="s-to" name="end_time" type="time" required defaultValue="09:00" className="input" /></div>
          <div>
            <label className="label" htmlFor="s-len">Each booking</label>
            <select id="s-len" name="slot_minutes" defaultValue="60" className="input">
              {[30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
          </div>
        </div>
        <p className="hint">The hours are split into bookings of that length, on every day you picked.</p>
        <div><SubmitButton className="btn small" pendingLabel="Adding…"><Plus size={14} weight="bold" /> Add times</SubmitButton></div>
      </form>
    </Box>
  );
}
