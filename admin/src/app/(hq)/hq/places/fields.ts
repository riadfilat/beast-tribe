// Reading the place form: plain rules with no database or framework, so they can be tested on their own.

/** Sports as lower-case ids, from ticked boxes and/or a comma list ("running, padel"). No repeats. */
export function parseSports(values: string[]): string[] {
  const out: string[] = [];
  for (const v of values) {
    for (const s of v.split(',')) {
      const id = s.trim().toLowerCase();
      if (id && !out.includes(id)) out.push(id);
    }
  }
  return out;
}

/**
 * A map pin pasted as "latitude, longitude" (what Google Maps copies when you click a spot),
 * e.g. "24.62002, 46.70835". Empty means no pin. Anything else is an error message.
 */
export function parsePin(raw: string): { lat: number; lng: number } | null | string {
  const text = raw.trim();
  if (!text) return null;
  const m = text.match(/^(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return 'The map pin should look like 24.62002, 46.70835 (latitude, then longitude).';
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return 'That map pin is off the map. Check the two numbers.';
  return { lat: round7(lat), lng: round7(lng) };
}

const round7 = (n: number) => Math.round(n * 1e7) / 1e7;

/** The pin as the form shows it, or empty. */
export function pinText(lat: number | string | null | undefined, lng: number | string | null | undefined): string {
  if (lat == null || lng == null || lat === '' || lng === '') return '';
  return `${Number(lat)}, ${Number(lng)}`;
}

/** Venue phone: digits, + and spaces only. Booking link: kept only when it is a web address. */
export function venueContact(phoneRaw: string, urlRaw: string) {
  const phone = phoneRaw.replace(/[^0-9+ ]/g, '').trim() || null;
  const url = urlRaw.trim();
  return { phone, booking_url: /^https?:\/\//i.test(url) ? url : null };
}

/** The list order number; anything that isn't a whole number counts as 0. */
export function parseOrder(raw: string): number {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}
