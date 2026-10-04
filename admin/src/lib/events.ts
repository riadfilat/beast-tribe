// The event form, shared by the admin and partner event pages.
// Only fields the form sent are returned, so a short form (the partner edit form) leaves the rest
// of the event alone. A sent but empty optional field is cleared (null), so it can be removed.

const REQUIRED = ['title', 'event_type', 'starts_at'] as const;
const OPTIONAL = ['sport_id', 'ends_at', 'location_name', 'location_city', 'coach_name', 'gym_name', 'description'] as const;

const text = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();

export function readEventForm(fd: FormData): Record<string, any> {
  const out: Record<string, any> = {};
  for (const k of REQUIRED) {
    const v = text(fd, k);
    if (v) out[k] = v;
  }
  for (const k of OPTIONAL) if (fd.has(k)) out[k] = text(fd, k) || null;
  if (fd.has('country')) out.country = text(fd, 'country') || 'SA';
  if (fd.has('max_capacity')) out.max_capacity = parseInt(text(fd, 'max_capacity')) || null;
  // A checkbox sends nothing when unticked. Edit forms that show it also send a hidden "off",
  // so a form without the box never changes it.
  const womenOnly = fd.getAll('is_women_only');
  if (womenOnly.length) out.is_women_only = womenOnly.includes('on');
  return out;
}
