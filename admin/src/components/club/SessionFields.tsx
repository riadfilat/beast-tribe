import { input, label } from './ui';

// The fields of a class, session or event, shared by the "new" and "edit" forms.

export interface SessionDefaults {
  title?: string;
  sportId?: string | null;
  coach?: string | null;
  date?: string;
  time?: string;
  duration?: number;
  capacity?: number | null;
  difficulty?: string | null;
  locationName?: string | null;
  city?: string | null;
  description?: string | null;
  womenOnly?: boolean;
}

export function SessionFields({
  sports,
  d,
  one,
  placeName,
  showCity,
  showRepeat,
  lockTime,
}: {
  sports: { id: string; name: string; emoji: string | null }[];
  d: SessionDefaults;
  /** "class", "session" or "event" */
  one: string;
  placeName: string;
  /** Sessions outside a club are shown by city, so the city is asked. */
  showCity: boolean;
  showRepeat: boolean;
  /** People are booked: the time can no longer change. */
  lockTime?: boolean;
}) {
  return (
    <>
      <div>
        <label className={label}>Name</label>
        <input name="title" required defaultValue={d.title} className={input} placeholder={one === 'class' ? 'Hyrox Engine, Morning Spin, Ladies Strength…' : 'Sunrise Run Club, Padel Social, Healthy Brunch Ride…'} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Sport</label>
          <select name="sport_id" className={input} defaultValue={d.sportId ?? ''}>
            <option value="">—</option>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>
                {s.emoji} {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Coach</label>
          <input name="coach_name" defaultValue={d.coach ?? ''} className={input} placeholder="Coach Sara" />
        </div>
      </div>

      {lockTime ? (
        <p className="text-xs text-gray-500">People are booked, so the time stays as it is. To move it, cancel (they are notified) and post a new one.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={label}>Date</label>
            <input name="date" type="date" required defaultValue={d.date} className={input} />
          </div>
          <div>
            <label className={label}>Starts</label>
            <input name="time" type="time" required defaultValue={d.time ?? '18:30'} className={input} />
          </div>
          <div>
            <label className={label}>Length</label>
            <select name="duration" defaultValue={String(d.duration ?? 60)} className={input}>
              {Array.from(new Set([30, 45, 50, 60, 75, 90, 120, 180, 240, d.duration ?? 60])).sort((a, b) => a - b).map((m) => (
                <option key={m} value={m}>
                  {m < 120 ? `${m} min` : `${m / 60} h`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={label}>Spots</label>
          <input name="capacity" type="number" min={1} max={500} defaultValue={d.capacity ?? undefined} className={input} placeholder="No limit" />
        </div>
        <div>
          <label className={label}>Level</label>
          <select name="difficulty" defaultValue={d.difficulty ?? ''} className={input}>
            <option value="">All levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        {showRepeat ? (
          <div>
            <label className={label}>Repeat weekly</label>
            <select name="repeat" defaultValue="1" className={input}>
              <option value="1">Just once</option>
              {[4, 8, 12].map((w) => (
                <option key={w} value={w}>
                  For {w} weeks
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div className={showCity ? 'grid grid-cols-2 gap-4' : ''}>
        <div>
          <label className={label}>Where</label>
          <input name="location_name" defaultValue={d.locationName ?? ''} className={input} placeholder={placeName} />
        </div>
        {showCity ? (
          <div>
            <label className={label}>City</label>
            <input name="location_city" required defaultValue={d.city ?? ''} className={input} placeholder="Riyadh" />
          </div>
        ) : null}
      </div>

      <div>
        <label className={label}>What to expect</label>
        <textarea name="description" defaultValue={d.description ?? ''} className={`${input} resize-none h-20`} placeholder="What you'll do, what to bring." />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" name="is_women_only" defaultChecked={!!d.womenOnly} /> Women only
      </label>
    </>
  );
}
