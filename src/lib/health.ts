import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// Daily steps from Apple Health. The member connects once (Apple asks for permission); after that the
// app syncs the last weeks of daily totals into daily_activity whenever it opens. Steps are private to
// the member: they only appear on a company's or gym's ranking when the member joins its challenge.

const KEY = 'health:connected';
const STEPS = 'HKQuantityTypeIdentifierStepCount';

let mod: any;
function hk(): any {
  if (Platform.OS !== 'ios') return null;
  if (mod !== undefined) return mod;
  try {
    mod = require('@kingstinct/react-native-healthkit');
  } catch {
    mod = null;
  }
  return mod;
}

export function healthAvailable(): boolean {
  try {
    return !!hk()?.isHealthDataAvailable?.();
  } catch {
    return false;
  }
}

export async function healthConnected(): Promise<boolean> {
  if (!healthAvailable()) return false;
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    return false;
  }
}

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Ask Apple Health for read access to steps, then sync. Apple never says whether read access was
 *  refused, so "connected" means the member went through the prompt. */
export async function connectHealth(userId: string): Promise<boolean> {
  const h = hk();
  if (!h || !healthAvailable()) return false;
  await h.requestAuthorization({ toRead: [STEPS] });
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {}
  await syncSteps(userId, 35);
  return true;
}

export async function disconnectHealth() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}

/** Daily step totals for the last `days` days, written to daily_activity. Returns today's steps. */
export async function syncSteps(userId: string, days = 8): Promise<number | null> {
  const h = hk();
  if (!h || !(await healthConnected())) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const end = new Date();
  const rows: any[] = await h.queryStatisticsCollectionForQuantity(STEPS, ['cumulativeSum'], start, { day: 1 }, { filter: { date: { startDate: start, endDate: end } }, unit: 'count' });
  const upserts = (rows || [])
    .filter((r) => r.startDate)
    .map((r) => ({
      user_id: userId,
      day: dayKey(new Date(r.startDate)),
      steps: Math.min(200000, Math.max(0, Math.round(r.sumQuantity?.quantity ?? 0))),
      source: 'apple_health',
      updated_at: new Date().toISOString(),
    }));
  if (upserts.length) {
    const { error } = await supabase.from('daily_activity').upsert(upserts, { onConflict: 'user_id,day' });
    if (error) throw error;
  }
  return upserts.find((u) => u.day === dayKey(new Date()))?.steps ?? 0;
}
