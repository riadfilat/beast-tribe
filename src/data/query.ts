import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

// Stale-while-revalidate: show the last good data instantly (also across screens),
// refresh quietly in the background, and only show a loading state on first load.

const cache = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();

export function invalidate(prefix: string) {
  for (const key of Array.from(cache.keys())) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
  for (const [key, set] of listeners) {
    if (key.startsWith(prefix)) set.forEach((fn) => fn());
  }
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

export function useQuery<T>(key: string | null, fetcher: () => Promise<T>, opts: { refetchOnFocus?: boolean } = {}): QueryState<T> {
  const { refetchOnFocus = true } = opts;
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
      const result = await fetcherRef.current();
      if (ticket !== inflight.current) return;
      cache.set(key, result);
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
    run();
    const set = listeners.get(key) ?? new Set();
    set.add(run);
    listeners.set(key, set);
    return () => {
      set.delete(run);
    };
  }, [key, run]);

  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      if (refetchOnFocus) run();
    }, [run, refetchOnFocus]),
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
