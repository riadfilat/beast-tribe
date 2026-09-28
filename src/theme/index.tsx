import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PALETTES, BoardAppearance, Palette, legacyColors } from './palette';
import { typeKit, TypeKit } from './type';
import { useI18n, Lang } from '../i18n';
import { setThemeColors } from '../lib/constants';

const STORAGE_KEY = 'beast_tribe_theme'; // legacy values 'dark' | 'light' still honored

function fromStored(v: string | null): BoardAppearance | null {
  if (v === 'slate' || v === 'dark') return 'slate';
  if (v === 'whiteboard' || v === 'light') return 'whiteboard';
  return null;
}

function initialAppearance(): BoardAppearance {
  if (Platform.OS === 'web') {
    try {
      return fromStored(window.localStorage.getItem(STORAGE_KEY)) ?? 'slate';
    } catch {}
  }
  return 'slate';
}

export interface Kit {
  p: Palette;
  f: TypeKit;
  lang: Lang;
  isRTL: boolean;
  appearance: BoardAppearance;
}

interface ThemeContextValue extends Kit {
  setAppearance: (a: BoardAppearance) => void;
  /** @deprecated legacy API */
  isDark: boolean;
  /** @deprecated legacy API */
  toggleTheme: () => void;
  colors: ReturnType<typeof legacyColors>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [appearance, setAppearanceState] = useState<BoardAppearance>(initialAppearance);
  const { lang, isRTL } = useI18n();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        const a = fromStored(v);
        if (a) setAppearanceState(a);
      })
      .catch(() => {});
  }, []);

  // Keep the legacy COLORS object in step for any screen not yet on the kit.
  useEffect(() => {
    setThemeColors(appearance === 'slate');
  }, [appearance]);

  const setAppearance = useCallback((a: BoardAppearance) => {
    setAppearanceState(a);
    AsyncStorage.setItem(STORAGE_KEY, a).catch(() => {});
    if (Platform.OS === 'web') {
      try {
        window.localStorage.setItem(STORAGE_KEY, a);
      } catch {}
    }
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const p = PALETTES[appearance];
    return {
      p,
      f: typeKit(lang),
      lang,
      isRTL,
      appearance,
      setAppearance,
      isDark: p.isDark,
      toggleTheme: () => setAppearance(appearance === 'slate' ? 'whiteboard' : 'slate'),
      colors: legacyColors(p),
    };
  }, [appearance, lang, isRTL, setAppearance]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

/** Palette, type, language, and direction in one call. */
export function useKit(): Kit {
  return useTheme();
}

/**
 * Theme-aware styles, recomputed only when the board appearance or language changes.
 * const useStyles = makeStyles(({ p, f }) => ({ title: { color: p.ink, ...f.title } }));
 */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(factory: (k: Kit) => T) {
  return function useStyles(): T {
    const kit = useTheme();
    return useMemo(
      () => StyleSheet.create(factory(kit)),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [kit.appearance, kit.lang],
    );
  };
}

export type { Palette, BoardAppearance } from './palette';
