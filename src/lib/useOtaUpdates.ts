import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Updates from 'expo-updates';

/**
 * Auto-applies OTA updates without a full force-quit.
 * - On launch AND whenever the app returns to the foreground, it checks for a
 *   new EAS Update. If one is available, it downloads and reloads immediately.
 * - No-op in development / Expo Go (Updates.isEnabled is false there).
 */
export function useOtaUpdates() {
  const checking = useRef(false);

  async function checkAndApply() {
    if (!Updates.isEnabled || checking.current) return;
    checking.current = true;
    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        await Updates.fetchUpdateAsync();
        // Swap in the new bundle right away.
        await Updates.reloadAsync();
      }
    } catch {
      // Offline or transient error — ignore, we'll try again next foreground.
    } finally {
      checking.current = false;
    }
  }

  useEffect(() => {
    // Check once on launch (after the JS has settled).
    checkAndApply();

    // And every time the app comes back to the foreground.
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') checkAndApply();
    });
    return () => sub.remove();
  }, []);
}
