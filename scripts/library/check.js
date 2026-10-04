// Validates every sports file: node scripts/library/check.js [sport...]
// Rules: 12 workouts per sport, 4 per level, unique keys and titles, EN + AR everywhere, real exercises,
// formats with what they need, sensible minutes, equipment drawn from the exercises used.
const fs = require('fs');
const path = require('path');
const { lib, FORMATS, LEVELS } = require('./kit');

const SPORTS = ['running', 'padel', 'football', 'gym', 'basketball', 'crossfit', 'hyrox', 'cycling', 'swimming', 'walking', 'yoga', 'pilates', 'tennis', 'pickleball', 'badminton', 'volleyball', 'boxing', 'mma', 'hiking', 'climbing', 'skateboarding', 'meditation', 'horse_riding'];
const AR = /[؀-ۿ]/;
const DIR = path.join(__dirname, 'sports');

function check(sport) {
  const errs = [];
  const file = path.join(DIR, `${sport}.js`);
  if (!fs.existsSync(file)) return [`${sport}: file missing`];
  delete require.cache[require.resolve(file)];
  let list;
  try { list = require(file); } catch (e) { return [`${sport}: ${e.message}`]; }
  if (!Array.isArray(list)) return [`${sport}: must export an array`];
  if (list.length !== 12) errs.push(`${sport}: ${list.length} workouts, need 12`);
  for (const lv of LEVELS) {
    const n = list.filter((w) => w.level === lv).length;
    if (n !== 4) errs.push(`${sport}: ${n} ${lv}, need 4`);
  }
  const keys = new Set(); const titles = new Set();
  list.forEach((w, i) => {
    const at = `${sport}[${i}] ${w.key || ''}`;
    if (!/^[a-z0-9_-]+$/.test(w.key || '') || !w.key.startsWith(sport + '-')) errs.push(`${at}: key must look like "${sport}-…"`);
    if (keys.has(w.key)) errs.push(`${at}: duplicate key`); keys.add(w.key);
    for (const f of ['title', 'desc']) {
      if (!Array.isArray(w[f]) || w[f].length !== 2 || !w[f][0] || !AR.test(w[f][1] || '')) errs.push(`${at}: ${f} must be [en, ar] with Arabic`);
    }
    if (w.title && titles.has(w.title[0])) errs.push(`${at}: duplicate title`); if (w.title) titles.add(w.title[0]);
    if (!LEVELS.includes(w.level)) errs.push(`${at}: level`);
    if (!FORMATS.includes(w.format)) errs.push(`${at}: format`);
    if (!(w.minutes >= 8 && w.minutes <= 90)) errs.push(`${at}: minutes 8–90`);
    if (!Array.isArray(w.equipment)) errs.push(`${at}: equipment array`);
    if (!Array.isArray(w.blocks) || w.blocks.length < 2) errs.push(`${at}: at least 2 blocks (warm-up + main)`);
    (w.blocks || []).forEach((b, bi) => {
      if (!b.title || !AR.test(b.title_ar || '')) errs.push(`${at} block ${bi}: title EN + AR`);
      if (['amrap', 'emom', 'for_time'].includes(b.format) && !b.minutes) errs.push(`${at} block ${bi}: ${b.format} needs minutes`);
      if (b.note && !AR.test(b.note_ar || '')) errs.push(`${at} block ${bi}: note needs Arabic`);
      if (!b.items || !b.items.length) errs.push(`${at} block ${bi}: no items`);
      (b.items || []).forEach((it) => {
        if (!lib[it.ex]) errs.push(`${at}: unknown exercise ${it.ex}`);
        if (!it.reps || !it.reps_ar) errs.push(`${at}: ${it.ex} needs a dose in EN + AR`);
        if (!AR.test(it.name_ar || '')) errs.push(`${at}: ${it.ex} Arabic name`);
        if (/\d\s*(s|min|m|km)\b/.test(it.reps_ar || '') || /side/.test(it.reps_ar || '')) errs.push(`${at}: ${it.ex} Arabic dose has English units: ${it.reps_ar}`);
        if (it.note && !AR.test(it.note_ar || '')) errs.push(`${at}: ${it.ex} note needs Arabic`);
      });
    });
  });
  return errs;
}

if (require.main === module) {
  const which = process.argv.slice(2).length ? process.argv.slice(2) : SPORTS;
  let bad = 0;
  for (const s of which) {
    const e = check(s);
    if (e.length) { bad++; console.log(e.join('\n')); } else console.log(`${s}: ok`);
  }
  process.exit(bad ? 1 : 0);
}
module.exports = { check, SPORTS };
