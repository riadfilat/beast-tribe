// Shared helpers for event timing so "passed" events behave consistently
// across the Home screen, Events tab, and My Events.

// If an event has no explicit end time, assume it lasts this long.
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

/** Effective end time (ms epoch) of an event — uses ends_at, else start + 2h. */
export function eventEndMs(evt: { starts_at?: string | null; ends_at?: string | null }): number {
  if (evt?.ends_at) return new Date(evt.ends_at).getTime();
  if (evt?.starts_at) return new Date(evt.starts_at).getTime() + DEFAULT_DURATION_MS;
  return 0;
}

/** True once the event has finished (now is past its effective end). */
export function isEventOver(evt: { starts_at?: string | null; ends_at?: string | null }, now: number = Date.now()): boolean {
  const end = eventEndMs(evt);
  return end > 0 && end < now;
}

/** True if the event is currently happening (started but not yet ended). */
export function isEventLive(evt: { starts_at?: string | null; ends_at?: string | null }, now: number = Date.now()): boolean {
  if (!evt?.starts_at) return false;
  const start = new Date(evt.starts_at).getTime();
  return start <= now && eventEndMs(evt) >= now;
}
