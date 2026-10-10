// Gregorian ↔ Hijri (Umm al-Qura) for the date-of-birth picker. Pairs checked against the official calendar.
import test from 'node:test';
import assert from 'node:assert/strict';
import { birthYears, daysInMonth, formatDate, fromIso, toIso } from '../src/lib/calendar.ts';

const PAIRS = [
  ['2025-06-26', [1447, 1, 1]],   // Islamic new year 1447
  ['2025-03-01', [1446, 9, 1]],   // 1 Ramadan 1446
  ['2024-06-16', [1445, 12, 10]], // Eid al-Adha 1445
  ['1993-03-21', [1413, 9, 28]],
  ['1970-01-01', [1389, 10, 23]],
];

test('Gregorian → Hijri', () => {
  for (const [iso, h] of PAIRS) assert.deepEqual(fromIso('hijri', iso), h, iso);
});

test('Hijri → Gregorian (what gets saved)', () => {
  for (const [iso, h] of PAIRS) assert.equal(toIso('hijri', h), iso, h.join('-'));
});

test('every day of the last 80 years survives a round trip', () => {
  const day = 86400000;
  for (let t = Date.UTC(1946, 0, 1); t <= Date.UTC(2026, 11, 31); t += day) {
    const iso = new Date(t).toISOString().slice(0, 10);
    assert.equal(toIso('hijri', fromIso('hijri', iso)), iso);
  }
});

test('Hijri months have 29 or 30 days; a 30th in a 29-day month becomes the 29th', () => {
  for (let m = 1; m <= 12; m++) assert.ok([29, 30].includes(daysInMonth('hijri', 1446, m)));
  assert.equal(daysInMonth('hijri', 1446, 9), 29); // Ramadan 1446 had 29 days
  assert.equal(toIso('hijri', [1446, 9, 30]), toIso('hijri', [1446, 9, 29]));
  assert.equal(toIso('gregorian', [2023, 2, 31]), '2023-02-28');
});

test('labels and year lists', () => {
  assert.equal(formatDate('gregorian', '1993-03-21', 'en'), '21 Mar 1993');
  assert.equal(formatDate('hijri', '1993-03-21', 'en'), '28 Ramadan 1413 AH');
  assert.equal(formatDate('hijri', '1993-03-21', 'ar'), '28 رمضان 1413 هـ');
  const years = birthYears('hijri', 2016, 71);
  assert.equal(years[0], 1438);
  assert.equal(years[years.length - 1], toIsoYear(1946));
});
const toIsoYear = (gy) => fromIso('hijri', `${gy}-01-01`)[0];
