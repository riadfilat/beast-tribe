// Local event store — DISABLED for production go-live.
// All events must persist to Supabase. Local-only fallbacks are removed
// to prevent silent data loss and confusing UX.
// Functions kept as no-ops for backwards compatibility with existing callers.

export interface LocalEvent {
  id: string;
  title: string;
  event_type: string;
  starts_at: string;
  location_name?: string;
  location_city?: string;
  coach_name?: string;
  description?: string;
  difficulty?: string;
  is_women_only?: boolean;
  country?: string;
  image_url?: string;
  joined?: boolean;
  sport?: { name: string };
  rsvp_count?: [{ count: number }];
  gym_name?: string;
}

const STORAGE_KEY = 'beast_tribe_local_events';

// Clear any leftover local events from previous versions on first load
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
} catch {}

export function addLocalEvent(_event: LocalEvent) {
  // No-op — production app uses Supabase as source of truth
}

export function getLocalEvents(): LocalEvent[] {
  return [];
}

export function clearLocalEvents() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}

