// Input checks for server actions. Server actions are public POST endpoints: every value a form
// sends is untrusted, whatever the page shows.

/** Trimmed text capped at `max` characters, or null when empty. */
export function text(v: FormDataEntryValue | null, max: number): string | null {
  const s = String(v ?? '').trim().slice(0, max);
  return s || null;
}

/** A whole number clamped to [min, max], or null when empty or not a number. */
export function int(v: FormDataEntryValue | null, min: number, max: number): number | null {
  const n = parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null;
}

/** An https link (no javascript:, intent:, data: or other schemes), or null when empty. */
export function httpsUrl(v: FormDataEntryValue | null): string | null {
  const s = text(v, 300);
  if (!s) return null;
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    throw new Error('That link is not valid');
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('That link is not valid');
  u.protocol = 'https:';
  return u.toString();
}

export function email(v: FormDataEntryValue | null): string | null {
  const s = text(v, 200)?.toLowerCase() ?? null;
  if (s && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)) throw new Error('That email is not valid');
  return s;
}

export function phone(v: FormDataEntryValue | null): string | null {
  const s = text(v, 40);
  if (s && !/^\+?[0-9 ()-]{6,40}$/.test(s)) throw new Error('That phone number is not valid');
  return s;
}

export const isUuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
