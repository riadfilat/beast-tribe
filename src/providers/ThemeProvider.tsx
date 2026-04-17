import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setThemeColors, DARK_COLORS, LIGHT_COLORS } from '../lib/constants';
// import * as Updates from 'expo-updates'; // Only needed for production native builds

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof DARK_COLORS;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  toggleTheme: () => {},
  colors: DARK_COLORS,
});

export function useTheme() {
  return useContext(ThemeContext);
}

const THEME_KEY = 'beast_tribe_theme';

// Read theme synchronously at module load so COLORS are set before any StyleSheet.create()
function getInitialTheme(): boolean {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.localStorage.getItem(THEME_KEY) !== 'light';
    }
  } catch {}
  return true; // default dark
}

// Set theme colors BEFORE any component renders
const initialIsDark = getInitialTheme();
setThemeColors(initialIsDark);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(initialIsDark);

  // Load saved theme preference (for native — web already loaded above)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      (async () => {
        try {
          const saved = await AsyncStorage.getItem(THEME_KEY);
          if (saved === 'light') {
            setIsDark(false);
            setThemeColors(false);
          }
        } catch {}
      })();
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const newIsDark = !prev;
      // Save preference
      if (Platform.OS === 'web') {
        try { window.localStorage.setItem(THEME_KEY, newIsDark ? 'dark' : 'light'); } catch {}
      } else {
        AsyncStorage.setItem(THEME_KEY, newIsDark ? 'dark' : 'light').catch(() => {});
      }
      // Reload app to apply theme (StyleSheet.create caches styles at module level)
      if (Platform.OS === 'web') {
        window.location.reload();
      } else {
        setThemeColors(newIsDark);
        // On native, state change + key prop in _layout triggers remount
      }
      return newIsDark;
    });
  }, []);

  const colors = (isDark ? DARK_COLORS : LIGHT_COLORS) as typeof DARK_COLORS;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}
