import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { supabase, isSupabaseConfigured } from './supabase';
import { i18n } from '../i18n';

// Hardcoded fallback — keep in sync with app.json `extra.eas.projectId`.
const EAS_PROJECT_ID = 'b9a69ad8-8fff-4877-a53b-3c9162c431b7';

// expo-notifications and expo-device were added after the build that is installed on
// testers' phones. Both packages call requireNativeModule at import time, which throws when
// the native side is missing, so they are loaded lazily and only when present. Every export
// here is a quiet no-op on a build without them.
type NotificationsModule = typeof import('expo-notifications');
let cached: NotificationsModule | null | undefined;

export function notificationsAvailable(): boolean {
  return Platform.OS !== 'web' && !!requireOptionalNativeModule('ExpoPushTokenManager');
}

function N(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  cached = null;
  if (!notificationsAvailable()) return null;
  try {
    cached = require('expo-notifications') as NotificationsModule;
    cached.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    cached = null;
  }
  return cached;
}

function isPhysicalDevice(): boolean {
  if (!requireOptionalNativeModule('ExpoDevice')) return true;
  try {
    return !!require('expo-device').isDevice;
  } catch {
    return true;
  }
}

export async function pushPermission(): Promise<'granted' | 'denied' | 'undetermined' | 'unavailable'> {
  const Notifications = N();
  if (!Notifications) return 'unavailable';
  try {
    const r = await Notifications.getPermissionsAsync();
    return (r?.status as any) ?? 'unavailable';
  } catch {
    return 'unavailable';
  }
}

/**
 * Register the device for push notifications and return the Expo push token.
 * Returns null on simulators, without permission, or on builds without notifications.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  const Notifications = N();
  if (!Notifications || !isPhysicalDevice()) return null;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        lightColor: '#E88F24',
      });
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || (Constants as any).easConfig?.projectId || EAS_PROJECT_ID;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (err) {
    console.warn('[notifications] registerForPushNotificationsAsync failed:', err);
    return null;
  }
}

/** Register + persist the device's push token for a user in `push_tokens`. */
export async function savePushToken(userId: string): Promise<void> {
  try {
    const token = await registerForPushNotificationsAsync();
    if (!token || !isSupabaseConfigured) return;
    const { error } = await supabase.from('push_tokens').upsert({ user_id: userId, token, platform: Platform.OS }, { onConflict: 'token' });
    if (error) console.warn('[notifications] savePushToken upsert failed:', error.message);
  } catch (err) {
    console.warn('[notifications] savePushToken failed:', err);
  }
}

const REMINDER_PREFIX = 'evt-';

/**
 * Schedule a local reminder 15 minutes before a session starts, in the member's language.
 * Stable identifier (`evt-<id>`) so it never double-schedules.
 */
export async function scheduleEventReminder(event: { id: string; title: string; starts_at: string }): Promise<void> {
  const Notifications = N();
  if (!Notifications) return;
  try {
    const startsAt = new Date(event.starts_at).getTime();
    if (Number.isNaN(startsAt)) return;
    const triggerTime = new Date(startsAt - 15 * 60 * 1000);
    if (triggerTime.getTime() <= Date.now()) return;
    const identifier = `${REMINDER_PREFIX}${event.id}`;
    await Notifications.cancelScheduledNotificationAsync(identifier);
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: i18n.t('session.reminderTitle'),
        body: i18n.t('session.reminderBody', { title: event.title }),
        sound: true,
        data: { eventId: event.id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerTime },
    });
  } catch (err) {
    console.warn('[notifications] scheduleEventReminder failed:', err);
  }
}

export async function cancelEventReminder(eventId: string): Promise<void> {
  const Notifications = N();
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(`${REMINDER_PREFIX}${eventId}`);
  } catch {}
}

/**
 * Make the scheduled reminders match the sessions you're in: schedule upcoming ones and drop
 * reminders for sessions you left or that were cancelled.
 */
export async function syncEventReminders(events: Array<{ id: string; title: string; starts_at: string }>): Promise<void> {
  const Notifications = N();
  if (!Notifications) return;
  const keep = new Set(events.map((e) => `${REMINDER_PREFIX}${e.id}`));
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.identifier.startsWith(REMINDER_PREFIX) && !keep.has(n.identifier)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch {}
  const now = Date.now();
  for (const event of events) {
    const startsAt = new Date(event.starts_at).getTime();
    if (Number.isNaN(startsAt) || startsAt <= now) continue;
    await scheduleEventReminder(event);
  }
}
