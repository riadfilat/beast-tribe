import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useLangStore } from '../i18n';
import { PREVIEW } from './preview';
import { useHereCity } from './me';

// "Seen today": once a day the app tells the database the member opened it, from which city
// (never the exact place), on which phone and in which language. It feeds the command center's
// active members and map (migration 092, bt_seen).

const riyadhDay = () => new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);

export function useSeenToday() {
  const city = useHereCity();
  const lang = useLangStore((s) => s.lang);
  const [day, setDay] = useState(riyadhDay);
  const sent = useRef('');

  // A new day starts while the app stays open in the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => st === 'active' && setDay(riyadhDay()));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const key = `${day}|${city ?? ''}|${lang}`;
    if (PREVIEW || sent.current === key) return;
    sent.current = key;
    const platform = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';
    // Best effort: a missed day only makes the count a little low.
    supabase.rpc('bt_seen', { p_city: city, p_platform: platform, p_locale: lang }).then(() => {}, () => {});
  }, [day, city, lang]);
}
