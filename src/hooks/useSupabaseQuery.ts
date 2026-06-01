import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { isSupabaseConfigured } from '../lib/supabase';

interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Generic hook for Supabase queries with loading/error states.
 * Falls back to `fallback` value when Supabase is not configured (demo mode).
 */
export function useSupabaseQuery<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: any }>,
  deps: any[] = [],
  fallback: T | null = null
): QueryResult<T> {
  const [data, setData] = useState<T | null>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryFnRef = useRef(queryFn);

  // Keep queryFn ref up to date without triggering re-renders
  useEffect(() => {
    queryFnRef.current = queryFn;
  });

  const doFetch = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setData(fallback);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await queryFnRef.current();
      if (result.error) throw result.error;
      setData(result.data);
    } catch (err: any) {
      setError(err.message || 'Query failed');
      setData(fallback);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { doFetch(); }, [doFetch]);

  // Auto-refetch whenever the screen regains focus (e.g. after creating /
  // editing / deleting on another screen and navigating back), so lists are
  // always fresh. Skips the very first focus since the mount effect above
  // already fetched, avoiding a duplicate initial request.
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      doFetch();
    }, [doFetch])
  );

  return { data, loading, error, refetch: doFetch };
}
