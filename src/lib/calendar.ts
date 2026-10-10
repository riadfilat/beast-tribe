// Gregorian and Hijri (Umm al-Qura, the official Saudi calendar) dates.
// Dates are stored as Gregorian 'YYYY-MM-DD'; Hijri is only a way of picking and showing them.
// Conversion: hijri-converter (MIT), which uses the Umm al-Qura tables (about 1937–2077).
import { toGregorian, toHijri } from 'hijri-converter';

export type CalendarKind = 'gregorian' | 'hijri';
/** A date in either calendar: year, month (1–12), day. */
export type Ymd = [number, number, number];

export const MONTHS: Record<CalendarKind, { en: string[]; ar: string[] }> = {
  gregorian: {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  },
  hijri: {
    en: ['Muharram', 'Safar', 'Rabi I', 'Rabi II', 'Jumada I', 'Jumada II', 'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'],
    ar: ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'],
  },
};

const pad = (n: number) => String(n).padStart(2, '0');

export function parseIso(iso: string): Ymd | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** Days in a month of either calendar (Hijri months have 29 or 30). */
export function daysInMonth(kind: CalendarKind, year: number, month: number): number {
  if (kind === 'gregorian') return new Date(year, month, 0).getDate();
  const start = toGregorian(year, month, 1);
  const next = month === 12 ? toGregorian(year + 1, 1, 1) : toGregorian(year, month + 1, 1);
  return Math.round((Date.UTC(next.gy, next.gm - 1, next.gd) - Date.UTC(start.gy, start.gm - 1, start.gd)) / 86400000);
}

/** A picked date (day clamped to the month's length) as the stored Gregorian 'YYYY-MM-DD'. */
export function toIso(kind: CalendarKind, [y, m, d]: Ymd): string {
  const day = Math.min(d, daysInMonth(kind, y, m));
  if (kind === 'gregorian') return `${y}-${pad(m)}-${pad(day)}`;
  const g = toGregorian(y, m, day);
  return `${g.gy}-${pad(g.gm)}-${pad(g.gd)}`;
}

/** A stored Gregorian date in the chosen calendar. */
export function fromIso(kind: CalendarKind, iso: string): Ymd | null {
  const g = parseIso(iso);
  if (!g || kind === 'gregorian') return g;
  const h = toHijri(g[0], g[1], g[2]);
  return [h.hy, h.hm, h.hd];
}

/** "21 Mar 1993", or "28 Ramadan 1413 AH" / "28 رمضان 1413 هـ". */
export function formatDate(kind: CalendarKind, iso: string, lang: 'en' | 'ar'): string {
  const ymd = fromIso(kind, iso);
  if (!ymd) return '';
  const [y, m, d] = ymd;
  const era = kind === 'hijri' ? (lang === 'ar' ? ' هـ' : ' AH') : '';
  return `${d} ${MONTHS[kind][lang][m - 1]} ${y}${era}`;
}

/** Years to offer for a birthday, newest first, in the chosen calendar. */
export function birthYears(kind: CalendarKind, youngest: number, span: number): number[] {
  const gYears = Array.from({ length: span }, (_, i) => youngest - i);
  if (kind === 'gregorian') return gYears;
  const newest = toHijri(youngest, 12, 31).hy;
  const oldest = toHijri(youngest - span + 1, 1, 1).hy;
  return Array.from({ length: newest - oldest + 1 }, (_, i) => newest - i);
}
