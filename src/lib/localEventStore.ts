// Local event store — persists in localStorage for web, AsyncStorage for native
// Events created by the user show immediately without waiting for DB sync

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

function saveToStorage(events: LocalEvent[]) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    }
  } catch {}
}

function loadFromStorage(): LocalEvent[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return [];
}

// Initialize from storage
let localEvents: LocalEvent[] = loadFromStorage();

export function addLocalEvent(event: LocalEvent) {
  localEvents.unshift(event);
  saveToStorage(localEvents);
}

export function getLocalEvents(): LocalEvent[] {
  // Re-read from storage in case another tab/navigation wrote to it
  localEvents = loadFromStorage();
  return [...localEvents];
}

export function clearLocalEvents() {
  localEvents = [];
  saveToStorage([]);
}

