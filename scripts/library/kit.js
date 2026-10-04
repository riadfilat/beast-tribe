// Shared helpers for writing library workouts (EN + AR side by side). Same block format as
// scripts/programs/build.js, read by the app's workout player (src/data/guide.ts).
const fs = require('fs');
const path = require('path');

const LIB_DIR = path.join(__dirname, '../exercises/lib');
const lib = Object.fromEntries(
  fs.readdirSync(LIB_DIR).filter((f) => f.endsWith('.json'))
    .flatMap((f) => JSON.parse(fs.readFileSync(path.join(LIB_DIR, f), 'utf8')))
    .map((x) => [x.slug, x]),
);

// Units inside a dose carry over to Arabic ("30 s" → "30 ث", "10 / side" → "10 لكل جهة").
const arUnits = (r) => {
  let s = String(r);
  const side = s.endsWith(' / side');
  if (side) s = s.slice(0, -' / side'.length);
  s = s.replace(/ min$/, ' د').replace(/ s$/, ' ث').replace(/ km$/, ' كم').replace(/ m$/, ' م');
  return side ? `${s} لكل جهة` : s;
};
/** A plain dose: reps('10') → ['10','10']; reps('30 s') → ['30 s','30 ث']. */
const reps = (r) => [String(r), arUnits(r)];
/** n sets of r: sets(3, 10) → ['3 × 10','3 × 10']; sets(3, '30 s'). */
const sets = (n, r) => [`${n} × ${r}`, `${n} × ${arUnits(r)}`];
const secs = (n) => [`${n} s`, `${n} ث`];
const mins = (n) => [`${n} min`, `${n} د`];
const meters = (n) => (n >= 1000 && n % 1000 === 0 ? [`${n / 1000} km`, `${n / 1000} كم`] : [`${n} m`, `${n} م`]);
const perSide = ([en, ar]) => [`${en} / side`, `${ar} لكل جهة`];

/** One exercise. `name` overrides the display name, e.g. ['Shadow boxing (fast feet)', '…']. */
function item(slug, dose, note, name) {
  const x = lib[slug];
  if (!x) throw new Error(`unknown exercise "${slug}"`);
  if (!Array.isArray(dose) || dose.length !== 2) throw new Error(`dose for ${slug} must be [en, ar]`);
  const it = { ex: slug, name: name ? name[0] : x.name, name_ar: name ? name[1] : x.ar, reps: dose[0], reps_ar: dose[1] };
  if (note) { it.note = note[0]; it.note_ar = note[1]; }
  return it;
}

const FORMATS = ['amrap', 'emom', 'for_time', 'rounds', 'intervals', 'steady', 'flow', 'strength'];
/** A block. opts: { minutes, rounds, note: [en, ar] }. amrap/emom/for_time need minutes; rounds/intervals take rounds. */
function block(title, format, opts, items) {
  if (!FORMATS.includes(format)) throw new Error(`bad format ${format}`);
  const b = { title: title[0], title_ar: title[1], format, items };
  if (opts.minutes) b.minutes = opts.minutes;
  if (opts.rounds) b.rounds = opts.rounds;
  if (opts.note) { b.note = opts.note[0]; b.note_ar = opts.note[1]; }
  return b;
}

const WARM = ['Warm-up', 'إحماء'];
const MAIN = ['Main', 'الأساسي'];
const COOL = ['Cool-down', 'تهدئة'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];

module.exports = { lib, item, block, reps, sets, secs, mins, meters, perSide, WARM, MAIN, COOL, FORMATS, LEVELS };
