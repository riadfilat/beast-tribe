import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

// Stale-while-revalidate: show the last good data instantly (also across screens),
// refresh quietly in the background, and only show a loading state on first load.
// Screens that mount the same key together share one request.

const cache = new Map<string, unknown>();
const fetchedAt = new Map<string, number>();
const pending = new Map<string, Promise<unknown>>();
const listeners = new Map<string, Set<() => void>>();

/** For lists that rarely change (programs, courts, coaches, exercises): no refetch within this window. */
export const CATALOGUE = { staleMs: 10 * 60_000 };

export function invalidate(prefix: string) {
  for (const key of Array.from(cache.keys())) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
      fetchedAt.delete(key);
    }
  }
  for (const key of Array.from(pending.keys())) {
    if (key.startsWith(prefix)) pending.delete(key);
  }
  for (const [key, set] of listeners) {
    if (key.startsWith(prefix)) set.forEach((fn) => fn());
  }
}

function shared<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  let p = pending.get(key) as Promise<T> | undefined;
  if (!p) {
    p = fetcher().finally(() => {
      if (pending.get(key) === p) pending.delete(key);
    });
    pending.set(key, p);
  }
  return p;
}

function isFresh(key: string, staleMs: number) {
  const at = fetchedAt.get(key);
  return staleMs > 0 && at !== undefined && cache.has(key) && Date.now() - at < staleMs;
}

export interface QueryState<T> {
  data: T | undefined;
  /** First load only (no data yet) */
  loading: boolean;
  /** Background refresh or pull-to-refresh */
  refreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setData: (updater: (prev: T | undefined) => T | undefined) => void;
}

export function useQuery<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  opts: { refetchOnFocus?: boolean; staleMs?: number } = {},
): QueryState<T> {
  const { refetchOnFocus = true, staleMs = 0 } = opts;
  const [data, setDataState] = useState<T | undefined>(() => (key ? (cache.get(key) as T | undefined) : undefined));
  const [loading, setLoading] = useState<boolean>(() => !!key && !cache.has(key));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const inflight = useRef(0);

  const run = useCallback(async () => {
    if (!key) return;
    const ticket = ++inflight.current;
    if (cache.has(key)) setRefreshing(true);
    else setLoading(true);
    try {
      const result = await shared(key, () => fetcherRef.current());
      if (ticket !== inflight.current) return;
      cache.set(key, result);
      fetchedAt.set(key, Date.now());
      setDataState(result);
      setError(null);
    } catch (e: any) {
      if (ticket !== inflight.current) return;
      setError(e?.message || 'error');
    } finally {
      if (ticket === inflight.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [key]);

  useEffect(() => {
    if (!key) {
      setDataState(undefined);
      setLoading(false);
      return;
    }
    if (cache.has(key)) setDataState(cache.get(key) as T);
    if (!isFresh(key, staleMs)) run();
    const set = listeners.get(key) ?? new Set();
    set.add(run);
    listeners.set(key, set);
    return () => {
      set.delete(run);
    };
  }, [key, run, staleMs]);

  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      if (refetchOnFocus && !(key && isFresh(key, staleMs))) run();
    }, [run, refetchOnFocus, key, staleMs]),
  );

  const setData = useCallback(
    (updater: (prev: T | undefined) => T | undefined) => {
      setDataState((prev) => {
        const next = updater(prev);
        if (key) {
          if (next === undefined) cache.delete(key);
          else cache.set(key, next);
        }
        return next;
      });
    },
    [key],
  );

  return { data, loading, refreshing, error, refetch: run, setData };
}
