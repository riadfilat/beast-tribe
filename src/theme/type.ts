import { Platform, TextStyle } from 'react-native';
import type { Lang } from '../i18n';

/**
 * Board typography.
 * - stencil: the wordmark's octagonal face (SlamDunk) — times, counts, board headings.
 *   Digits stay Latin in both languages, so the stencil numerals work everywhere.
 * - heading: board headings (TODAY / اليوم).
 * - title: session and screen titles.
 * - ui*: the platform face (SF Pro / SF Arabic) for everything a member reads or taps.
 */
export interface TypeKit {
  stencil: TextStyle;
  heading: TextStyle;
  title: TextStyle;
  ui: TextStyle;
  uiMedium: TextStyle;
  uiSemibold: TextStyle;
  uiBold: TextStyle;
  /** Multiplier for line heights (Arabic needs more room) */
  leading: number;
  /** Latin titles are set in caps on the board; Arabic has no case */
  caps: TextStyle;
}

export const FONT_FILES = {
  SlamDunk: require('../../assets/fonts/SlamDunk.ttf'),
  'Montserrat-ExtraBold': require('../../assets/fonts/Montserrat-ExtraBold.ttf'),
  'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
  'NotoKufiArabic-Bold': require('../../assets/fonts/NotoKufiArabic-Bold.ttf'),
  'NotoKufiArabic-Black': require('../../assets/fonts/NotoKufiArabic-Black.ttf'),
};

// Noto Kufi has no Latin letters. iOS and Android fall back to the system face for Latin words
// inside Arabic titles (place and member names); the web needs the fallback spelled out.
const withLatin = (arabic: string, latin: string) => (Platform.OS === 'web' ? `${arabic}, ${latin}, system-ui, sans-serif` : arabic);

export function typeKit(lang: Lang): TypeKit {
  const ar = lang === 'ar';
  return {
    stencil: { fontFamily: 'SlamDunk' },
    heading: ar ? { fontFamily: withLatin('NotoKufiArabic-Black', 'SlamDunk') } : { fontFamily: 'SlamDunk' },
    title: ar ? { fontFamily: withLatin('NotoKufiArabic-Bold', 'Montserrat-ExtraBold') } : { fontFamily: 'Montserrat-ExtraBold' },
    ui: { fontWeight: '400' },
    uiMedium: { fontWeight: '500' },
    uiSemibold: { fontWeight: '600' },
    uiBold: { fontWeight: '700' },
    leading: ar ? 1.55 : 1.3,
    caps: ar ? {} : { textTransform: 'uppercase' },
  };
}

/** Line height for a font size in the current language. */
export function lh(size: number, leading: number) {
  return Math.round(size * leading);
}
