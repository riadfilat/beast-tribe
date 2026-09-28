import { create } from 'zustand';
import { I18nManager, NativeModules, Platform, DevSettings } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { en } from './strings/en';
import { ar } from './strings/ar';

export type Lang = 'en' | 'ar';
type Vars = Record<string, string | number | undefined | null>;
type PluralEntry = { zero?: string; one?: string; two?: string; few?: string; many?: string; other: string };

const STORAGE_KEY = 'beast_tribe_lang';
const DICTS: Record<Lang, any> = { en, ar };

// ─── Language state ─────────────────────────────────────────────────────────
// On native the layout direction is fixed at launch (I18nManager), so the
// starting language follows it; the saved preference is reconciled in bootLanguage().
function initialLang(): Lang {
  if (Platform.OS === 'web') {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'ar' || saved === 'en') return saved;
    } catch {}
    return detectDeviceLang();
  }
  return I18nManager.isRTL ? 'ar' : 'en';
}

interface LangState {
  lang: Lang;
  ready: boolean;
  setLangState: (lang: Lang) => void;
}

export const useLangStore = create<LangState>((set) => ({
  lang: initialLang(),
  ready: Platform.OS === 'web',
  setLangState: (lang) => set({ lang, ready: true }),
}));

export function detectDeviceLang(): Lang {
  try {
    const loc = Intl.DateTimeFormat().resolvedOptions().locale || '';
    if (loc.toLowerCase().startsWith('ar')) return 'ar';
  } catch {}
  try {
    const s = NativeModules.SettingsManager?.settings;
    const l: string = s?.AppleLanguages?.[0] || s?.AppleLocale || NativeModules.I18nManager?.localeIdentifier || '';
    if (l.toLowerCase().startsWith('ar')) return 'ar';
  } catch {}
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ar')) return 'ar';
  } catch {}
  return 'en';
}

async function reloadApp() {
  try {
    await Updates.reloadAsync();
  } catch {
    if (__DEV__) DevSettings.reload();
  }
}

function applyWebDirection(lang: Lang) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}

/**
 * Called once at startup (before the splash hides). Reconciles the saved or
 * detected language with the native layout direction; reloads once if the
 * direction has to flip. Returns true when a reload was triggered.
 */
export async function bootLanguage(): Promise<boolean> {
  let lang: Lang;
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    lang = saved === 'ar' || saved === 'en' ? saved : detectDeviceLang();
    if (!saved) await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch {
    lang = useLangStore.getState().lang;
  }
  if (Platform.OS === 'web') {
    applyWebDirection(lang);
    useLangStore.getState().setLangState(lang);
    return false;
  }
  const wantRTL = lang === 'ar';
  if (I18nManager.isRTL !== wantRTL) {
    I18nManager.allowRTL(wantRTL);
    I18nManager.forceRTL(wantRTL);
    await reloadApp();
    return true;
  }
  useLangStore.getState().setLangState(lang);
  return false;
}

/** Switch language from Settings or the welcome screen. */
export async function setLanguage(lang: Lang) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
    if (Platform.OS === 'web') window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {}
  onLanguageChange?.(lang);
  if (Platform.OS === 'web') {
    applyWebDirection(lang);
    useLangStore.getState().setLangState(lang);
    return;
  }
  const wantRTL = lang === 'ar';
  if (I18nManager.isRTL !== wantRTL) {
    I18nManager.allowRTL(wantRTL);
    I18nManager.forceRTL(wantRTL);
    await reloadApp();
    return;
  }
  useLangStore.getState().setLangState(lang);
}

/** Lets the auth layer persist the language on the member's profile (push copy). */
let onLanguageChange: ((lang: Lang) => void) | null = null;
export function registerLanguageListener(fn: (lang: Lang) => void) {
  onLanguageChange = fn;
}

// ─── Lookup ─────────────────────────────────────────────────────────────────
function lookup(dict: any, key: string): any {
  let node = dict;
  for (const part of key.split('.')) {
    if (node == null) return undefined;
    node = node[part];
  }
  return node;
}

function interpolate(s: string, vars?: Vars) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined || v === null ? '' : String(v);
  });
}

export function pluralCategory(lang: Lang, n: number): keyof PluralEntry {
  if (lang === 'ar') {
    const m = Math.abs(n) % 100;
    if (n === 0) return 'zero';
    if (n === 1) return 'one';
    if (n === 2) return 'two';
    if (m >= 3 && m <= 10) return 'few';
    if (m >= 11 && m <= 99) return 'many';
    return 'other';
  }
  return n === 1 ? 'one' : 'other';
}

export function translate(lang: Lang, key: string, vars?: Vars): string {
  const value = lookup(DICTS[lang], key) ?? lookup(DICTS.en, key);
  if (typeof value === 'string') return interpolate(value, vars);
  if (__DEV__) console.warn(`[i18n] missing string: ${key}`);
  return key;
}

export function translatePlural(lang: Lang, key: string, n: number, vars?: Vars): string {
  const entry: PluralEntry | undefined = lookup(DICTS[lang], key) ?? lookup(DICTS.en, key);
  if (!entry || typeof entry !== 'object') {
    if (__DEV__) console.warn(`[i18n] missing plural: ${key}`);
    return String(n);
  }
  const cat = pluralCategory(lang, n);
  const s = entry[cat] ?? entry.other;
  return interpolate(s, { n, ...vars });
}

/** Non-hook access (alerts, notifications, helpers outside components). */
export const i18n = {
  get lang() {
    return useLangStore.getState().lang;
  },
  get isRTL() {
    return useLangStore.getState().lang === 'ar';
  },
  t: (key: string, vars?: Vars) => translate(useLangStore.getState().lang, key, vars),
  tn: (key: string, n: number, vars?: Vars) => translatePlural(useLangStore.getState().lang, key, n, vars),
};

export function useI18n() {
  const lang = useLangStore((s) => s.lang);
  return {
    lang,
    isRTL: lang === 'ar',
    t: (key: string, vars?: Vars) => translate(lang, key, vars),
    tn: (key: string, n: number, vars?: Vars) => translatePlural(lang, key, n, vars),
    setLanguage,
  };
}
