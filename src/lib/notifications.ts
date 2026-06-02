import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from './supabase';

// Hardcoded fallback — keep in sync with app.json `extra.eas.projectId`.
const EAS_PROJECT_ID = 'b9a69ad8-8fff-4877-a53b-3c9162c431b7';

// Show notifications while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Register the device for push notifications and return the Expo push token.
 * Returns null on simulators/emulators or when permission is denied.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  try {
    // Android requires a notification channel.
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

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      (Constants as any).easConfig?.projectId ||
      EAS_PROJECT_ID;

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (err) {
    console.warn('[notifications] registerForPushNotificationsAsync failed:', err);
    return null;
  }
}

/**
 * Register + persist the device's push token for a user in `push_tokens`.
 */
export async function savePushToken(userId: string): Promise<void> {
  try {
    const token = await registerForPushNotificationsAsync();
    if (!token) return;
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        { user_id: userId, token, platform: Platform.OS },
        { onConflict: 'token' }
      );
    if (error) console.warn('[notifications] savePushToken upsert failed:', error.message);
  } catch (err) {
    console.warn('[notifications] savePushToken failed:', err);
  }
}

/**
 * Schedule a local reminder 15 minutes before an event starts.
 * Uses a stable identifier (`evt-<id>`) so it never double-schedules.
 */
export async function scheduleEventReminder(event: {
  id: string;
  title: string;
  starts_at: string;
}): Promise<void> {
  try {
    const startsAt = new Date(event.starts_at).getTime();
    if (Number.isNaN(startsAt)) return;
    const triggerTime = new Date(startsAt - 15 * 60 * 1000);
    // Skip if the reminder time is already in the past.
    if (triggerTime.getTime() <= Date.now()) return;

    const identifier = `evt-${event.id}`;
    // Cancel any existing reminder for this event before re-scheduling.
    await Notifications.cancelScheduledNotificationAsync(identifier);

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: 'Starting soon',
        body: `"${event.title}" starts in 15 minutes`,
        sound: true,
        data: { eventId: event.id },
      },
      trigger: triggerTime as any,
    });
  } catch (err) {
    console.warn('[notifications] scheduleEventReminder failed:', err);
  }
}

/**
 * (Re)schedule reminders for all upcoming joined events.
 */
export async function syncEventReminders(
  events: Array<{ id: string; title: string; starts_at: string }>
): Promise<void> {
  const now = Date.now();
  for (const event of events) {
    const startsAt = new Date(event.starts_at).getTime();
    if (Number.isNaN(startsAt) || startsAt <= now) continue;
    await scheduleEventReminder(event);
  }
}
