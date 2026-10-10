// The staff session form (HQ → Sessions), shared by "Post a session" and "Edit".
// Pure: reads and checks what the form sent and returns the database columns, or a plain error.
// The form's day and time are the country's local time (Riyadh, Dubai…), never the server's.

export interface SportOption { id: string; name: string; slug: string }

export const COUNTRIES: { code: string; name: string; offset: string }[] = [
  { code: 'SA', name: 'Saudi Arabia', offset: '+03:00' },
  { code: 'AE', name: 'UAE', offset: '+04:00' },
  { code: 'KW', name: 'Kuwait', offset: '+03:00' },
  { code: 'BH', name: 'Bahrain', offset: '+03:00' },
  { code: 'QA', name: 'Qatar', offset: '+03:00' },
  { code: 'OM', name: 'Oman', offset: '+04:00' },
];

/** What the form shows; every field is a string so a failed save can put back what was typed. */
export interface SessionFormValues {
  title: string;
  description: string;
  sport: string;
  starts_at: string;
  ends_at: string;
  location_name: string;
  location_city: string;
  country: string;
  max_capacity: string;
  coach_name: string;
  gym_name: string;
  gender: 'all' | 'women' | 'men';
  community: string;
}

export const EMPTY_FORM: SessionFormValues = {
  title: '', description: '', sport: '', starts_at: '', ends_at: '', location_name: '', location_city: '',
  country: 'SA', max_capacity: '', coach_name: '', gym_name: '', gender: 'all', community: '',
};

const offsetOf = (country: string) => COUNTRIES.find((c) => c.code === country)?.offset ?? '+03:00';
const offsetMs = (country: string) => {
  const [h, m] = offsetOf(country).slice(1).split(':').map(Number);
  return (offsetOf(country).startsWith('-') ? -1 : 1) * (h * 60 + m) * 60000;
};

/** "2026-10-12T18:30" in the country's time → ISO, or null if it isn't a date and time. */
export function toIso(local: string, country: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const d = new Date(`${local}:00${offsetOf(country)}`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/** ISO → "2026-10-12T18:30" in the country's time, for a datetime-local field. */
export function toLocalInput(iso: string | null | undefined, country: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : new Date(d.getTime() + offsetMs(country)).toISOString().slice(0, 16);
}

/** The form's fields as typed, to show them again after a failed save. */
export function echoForm(fd: FormData): SessionFormValues {
  const out = { ...EMPTY_FORM };
  for (const k of Object.keys(EMPTY_FORM) as (keyof SessionFormValues)[]) {
    const v = fd.get(k);
    if (typeof v === 'string') (out as any)[k] = v;
  }
  return out;
}

/** An existing session (a row of `events`) as form values. */
export function eventToForm(e: any, sports: SportOption[]): SessionFormValues {
  const country = COUNTRIES.some((c) => c.code === e.country) ? e.country : 'SA';
  const sport = sports.find((s) => s.id === e.sport_id) ?? sports.find((s) => s.slug === e.event_type);
  return {
    title: e.title ?? '',
    description: e.description ?? '',
    sport: sport?.slug ?? '',
    starts_at: toLocalInput(e.starts_at, country),
    ends_at: toLocalInput(e.ends_at, country),
    location_name: e.location_name ?? '',
    location_city: e.location_city ?? '',
    country,
    max_capacity: e.max_capacity ? String(e.max_capacity) : '',
    coach_name: e.coach_name ?? '',
    gym_name: e.gym_name ?? '',
    gender: e.is_women_only ? 'women' : e.is_men_only ? 'men' : 'all',
    community: e.community_id ?? '',
  };
}

/**
 * The columns to save, or the first problem in plain words.
 * `community` is only read when the form sent it (a session in a group keeps its group).
 * An empty community means the open Beast Tribe community (the database fills it in).
 */
export function readSessionForm(fd: FormData, sports: SportOption[], openCommunityId: string | null): { values: Record<string, any> } | { error: string } {
  const text = (k: string, max = 120) => String(fd.get(k) ?? '').trim().slice(0, max);
  const title = text('title');
  if (!title) return { error: 'Give the session a name.' };
  const sport = sports.find((s) => s.slug === text('sport'));
  if (!sport) return { error: 'Pick a sport.' };
  const country = COUNTRIES.some((c) => c.code === text('country')) ? text('country') : 'SA';
  const starts = toIso(text('starts_at'), country);
  if (!starts) return { error: 'Pick the day and time it starts.' };
  const endsRaw = text('ends_at');
  const ends = endsRaw ? toIso(endsRaw, country) : null;
  if (endsRaw && !ends) return { error: 'The end time is not valid.' };
  if (ends && ends <= starts) return { error: 'The end has to be after the start.' };
  const capRaw = text('max_capacity');
  const cap = capRaw ? parseInt(capRaw) : null;
  if (capRaw && !(cap! >= 1 && cap! <= 5000)) return { error: 'Spots must be a number between 1 and 5,000 (or empty for no limit).' };
  const gender = text('gender');

  const values: Record<string, any> = {
    title,
    description: text('description', 1000) || null,
    event_type: sport.slug,
    sport_id: sport.id,
    starts_at: starts,
    ends_at: ends,
    location_name: text('location_name') || null,
    location_city: text('location_city', 60) || null,
    country,
    max_capacity: cap,
    coach_name: text('coach_name') || null,
    gym_name: text('gym_name') || null,
    // One or the other, never both (the database refuses both too).
    is_women_only: gender === 'women',
    is_men_only: gender === 'men',
  };
  if (fd.has('community')) {
    const c = text('community', 40);
    if (c && !/^[0-9a-f-]{36}$/i.test(c)) return { error: 'Pick a community from the list.' };
    values.community_id = c || openCommunityId;
    values.visibility = 'community';
  }
  return { values };
}
