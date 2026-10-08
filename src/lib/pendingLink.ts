import AsyncStorage from '@react-native-async-storage/async-storage';

// A link someone opened before they could use it (signed out, or still in onboarding): a session
// or court, with its guest key. It is kept until they finish signing up, then opened for them.

const KEY = 'bt.pendingLink';
const MAX_AGE = 24 * 3600 * 1000;
let memo: string | null = null;

/** Links worth keeping: sessions (with a guest key) and courts. */
export function isKeepableLink(path: string) {
  return /^\/(session|court)\/[^/]+$/.test(path);
}

export function savePendingLink(path: string) {
  memo = path;
  AsyncStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() })).catch(() => {});
}

/** The kept link, once: it is cleared as it is read. */
export async function takePendingLink(): Promise<string | null> {
  let path = memo;
  memo = null;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    await AsyncStorage.removeItem(KEY);
    if (!path && raw) {
      const saved = JSON.parse(raw) as { path?: string; at?: number };
      if (saved.path && saved.at && Date.now() - saved.at < MAX_AGE) path = saved.path;
    }
  } catch {}
  return path && isKeepableLink(path.split('?')[0]) ? path : null;
}
