import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export type HapticKind = 'selection' | 'light' | 'medium' | 'success' | 'warning' | 'error';

/** Tactile feedback for committed actions. No-op on web. */
export function haptic(kind: HapticKind = 'light') {
  if (Platform.OS === 'web') return;
  try {
    switch (kind) {
      case 'selection':
        Haptics.selectionAsync();
        break;
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch {}
}
