// Times offered when hosting or editing a session: four parts of the day, one row of times at a time.

export type Period = 'morning' | 'afternoon' | 'evening' | 'night';

export const SLOTS: Record<Period, string[]> = {
  morning: ['04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '09:00', '10:00', '11:00'],
  afternoon: ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
  evening: ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
  night: ['21:00', '21:30', '22:00', '22:30', '23:00'],
};

export const DURATIONS = [30, 45, 60, 90, 120, 180];

/** The part of the day a time (HH:MM) falls in, for the time rows. */
export function periodFor(hhmm: string): Period {
  const h = Number(hhmm.split(':')[0]);
  if (h >= 4 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

export function durationLabel(min: number, lang: string) {
  if (lang === 'ar') {
    if (min === 60) return 'ساعة';
    if (min === 90) return 'ساعة ونصف';
    if (min === 120) return 'ساعتان';
    if (min === 180) return '3 ساعات';
    return `${min} دقيقة`;
  }
  if (min < 60 || min % 30 !== 0) return `${min} min`;
  if (min === 90) return '1.5 h';
  return `${min / 60} h`;
}
