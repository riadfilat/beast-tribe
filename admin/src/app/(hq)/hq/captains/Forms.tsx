import { sar, todayRiyadh } from '@/lib/format';
import SubmitButton from '@/components/SubmitButton';
import { assignCaptain, saveDefaultCut } from './actions';

/** Make a member the Beast Captain of a community. */
export function AssignForm({ communities, preselect, cut }: { communities: { id: string; name: string }[]; preselect?: string; cut: number }) {
  return (
    <form action={assignCaptain} className="grid gap-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="cap-community">Community</label>
          <select id="cap-community" name="community_id" required defaultValue={preselect || ''} className="input">
            <option value="" disabled>Choose…</option>
            {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="cap-email">Coach&apos;s email in the app</label>
          <input id="cap-email" name="email" type="email" required className="input" placeholder="coach@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="cap-target">Sessions a week</label>
          <input id="cap-target" name="weekly_target" type="number" min={1} max={14} defaultValue={3} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="cap-rate">Hourly rate the community pays (SAR)</label>
          <input id="cap-rate" name="hourly_rate_sar" type="number" min={0} step="1" required className="input" placeholder="200" />
        </div>
        <div>
          <label className="label" htmlFor="cap-cut">Our share % (empty = standard {cut}%)</label>
          <input id="cap-cut" name="cut_pct" type="number" min={0} max={100} step="0.5" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="cap-start">Starts</label>
          <input id="cap-start" name="starts_on" type="date" defaultValue={todayRiyadh()} className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="cap-notes">Notes (only HQ sees these)</label>
        <input id="cap-notes" name="notes" maxLength={1000} className="input" placeholder="Days agreed, sports, who to invoice…" />
      </div>
      <div>
        <SubmitButton pendingLabel="Assigning…" className="btn">Assign captain</SubmitButton>
      </div>
    </form>
  );
}

/** Beast Tribe's standard share of a captain's hourly rate. */
export function ShareForm({ cut }: { cut: number }) {
  return (
    <form action={saveDefaultCut} className="grid gap-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="label" htmlFor="def-cut">Share %</label>
          <input id="def-cut" name="cut_pct" type="number" min={0} max={100} step="0.5" defaultValue={cut} className="input" />
        </div>
        <SubmitButton pendingLabel="Saving…" className="btn ghost">Save</SubmitButton>
      </div>
      <p className="hint">
        Example at SAR 200 an hour and {cut}%: the community pays SAR 200, the captain gets {sar(200 * (1 - cut / 100))}, Beast Tribe keeps {sar((200 * cut) / 100)}.
      </p>
    </form>
  );
}
