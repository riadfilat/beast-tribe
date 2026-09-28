import type { Lang } from './index';

// Formatting is done by hand (not Intl) so Arabic output is identical on every
// engine: Gregorian calendar, Latin digits, correct Arabic number agreement.

const MONTHS: Record<Lang, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};
const MONTHS_LONG_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS: Record<Lang, string[]> = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
};
const DAYS_LONG_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

// ─── Local calendar helpers (never toISOString for "which day") ────────────
export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
export function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
export function dayOffset(d: Date, now = new Date()): number {
  const ms = startOfLocalDay(d).getTime() - startOfLocalDay(now).getTime();
  return Math.round(ms / 86400000);
}
/** Build a local Date from YYYY-MM-DD and HH:MM (local time, not UTC). */
export function localDateTime(dateKey: string, hhmm: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [h, min] = hhmm.split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, h || 0, min || 0, 0, 0);
}

// ─── Clock ──────────────────────────────────────────────────────────────────
/** 12-hour clock split for the stencil: { time: '6:30', suffix: 'AM' | 'ص' } */
export function clockParts(d: Date, lang: Lang) {
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = lang === 'ar' ? (h < 12 ? 'ص' : 'م') : h < 12 ? 'AM' : 'PM';
  return { time: `${h12}:${pad(d.getMinutes())}`, suffix };
}
export function fmtClock(d: Date, lang: Lang): string {
  const { time, suffix } = clockParts(d, lang);
  return `${time} ${suffix}`;
}

// ─── Days ───────────────────────────────────────────────────────────────────
export function fmtWeekday(d: Date, lang: Lang): string {
  return DAYS[lang][d.getDay()];
}
/** "Today" / "Tomorrow" / "Sat 3 Oct" — "اليوم" / "غدًا" / "السبت 3 أكتوبر" */
export function fmtDay(d: Date, lang: Lang, now = new Date()): string {
  const off = dayOffset(d, now);
  if (off === 0) return lang === 'ar' ? 'اليوم' : 'Today';
  if (off === 1) return lang === 'ar' ? 'غدًا' : 'Tomorrow';
  if (off === -1) return lang === 'ar' ? 'أمس' : 'Yesterday';
  return `${DAYS[lang][d.getDay()]} ${d.getDate()} ${MONTHS[lang][d.getMonth()]}`;
}
/** Board masthead: "TUE 29 SEP" / "الثلاثاء 29 سبتمبر" */
export function fmtBoardDate(d: Date, lang: Lang): string {
  const s = `${DAYS[lang][d.getDay()]} ${d.getDate()} ${MONTHS[lang][d.getMonth()]}`;
  return lang === 'ar' ? s : s.toUpperCase();
}
/** "Saturday, 3 October" / "السبت، 3 أكتوبر" */
export function fmtDateLong(d: Date, lang: Lang): string {
  if (lang === 'ar') return `${DAYS.ar[d.getDay()]}، ${d.getDate()} ${MONTHS.ar[d.getMonth()]}`;
  return `${DAYS_LONG_EN[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG_EN[d.getMonth()]}`;
}
export function fmtShortDate(d: Date, lang: Lang): string {
  return `${d.getDate()} ${MONTHS[lang][d.getMonth()]}`;
}

// ─── Arabic number agreement ────────────────────────────────────────────────
type Unit = 'minute' | 'hour' | 'day';
const AR_UNITS: Record<Unit, { one: string; dualNom: string; dualGen: string; few: string; many: string }> = {
  minute: { one: 'دقيقة', dualNom: 'دقيقتان', dualGen: 'دقيقتين', few: 'دقائق', many: 'دقيقة' },
  hour: { one: 'ساعة', dualNom: 'ساعتان', dualGen: 'ساعتين', few: 'ساعات', many: 'ساعة' },
  day: { one: 'يوم', dualNom: 'يومان', dualGen: 'يومين', few: 'أيام', many: 'يومًا' },
};
/** Arabic quantity phrase; `genitive` after prepositions like بعد / قبل. */
function arQty(n: number, unit: Unit, genitive: boolean): string {
  const u = AR_UNITS[unit];
  if (n === 1) return u.one;
  if (n === 2) return genitive ? u.dualGen : u.dualNom;
  const m = n % 100;
  if (m >= 3 && m <= 10) return `${n} ${u.few}`;
  return `${n} ${u.many}`;
}
function enQty(n: number, unit: Unit, short = true): string {
  if (short) return `${n}${unit === 'minute' ? 'm' : unit === 'hour' ? 'h' : 'd'}`;
  return `${n} ${unit}${n === 1 ? '' : 's'}`;
}

/** "1h 30m" / "ساعة و30 دقيقة" */
export function fmtDuration(minutes: number, lang: Lang, genitive = false): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (lang === 'ar') {
    const parts: string[] = [];
    if (h > 0) parts.push(arQty(h, 'hour', genitive));
    if (m > 0) parts.push(arQty(m, 'minute', genitive));
    return parts.join(' و') || arQty(0, 'minute', genitive);
  }
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m} min`;
}

/** Time until a moment: "in 12 min" / "in 1h 50m" / "in 3 days" — "بعد 12 دقيقة" … */
export function fmtIn(target: Date, lang: Lang, now = new Date()): string {
  const mins = Math.max(0, Math.round((target.getTime() - now.getTime()) / 60000));
  if (mins >= 48 * 60) {
    const days = Math.round(mins / 1440);
    return lang === 'ar' ? `بعد ${arQty(days, 'day', true)}` : `in ${enQty(days, 'day', false)}`;
  }
  if (lang === 'ar') return `بعد ${fmtDuration(mins, 'ar', true)}`;
  return `in ${fmtDuration(mins, 'en')}`;
}

/** "just now" / "12m ago" / "3h ago" / "2d ago" — "الآن" / "قبل 12 دقيقة" … */
export function fmtAgo(date: Date, lang: Lang, now = new Date()): string {
  const mins = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60000));
  if (mins < 1) return lang === 'ar' ? 'الآن' : 'just now';
  if (mins < 60) return lang === 'ar' ? `قبل ${arQty(mins, 'minute', true)}` : `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return lang === 'ar' ? `قبل ${arQty(hours, 'hour', true)}` : `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return lang === 'ar' ? `قبل ${arQty(days, 'day', true)}` : `${days}d ago`;
  return fmtShortDate(date, lang);
}
