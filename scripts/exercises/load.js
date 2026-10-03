// Loads the exercise library (scripts/exercises/lib/*.json) into public.exercises and links
// workout items (blocks[].items[].ex) by alias. Media fields (video_url, poster_url) are never
// touched, so videos added later in the admin survive re-runs.
// Usage: PG_URL=... node scripts/exercises/load.js [--check]
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const dir = path.join(__dirname, 'lib');
const list = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
  .flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));

const pairs = (a) => (a || []).map(([en, ar]) => ({ en, ar }));

function check() {
  const slugs = new Set();
  const problems = [];
  for (const x of list) {
    if (slugs.has(x.slug)) problems.push(`duplicate slug ${x.slug}`);
    slugs.add(x.slug);
    for (const k of ['name', 'ar', 'cat', 'pattern', 'mech', 'lvl', 'track']) if (!x[k]) problems.push(`${x.slug}: missing ${k}`);
    if ((x.cues || []).length < 3) problems.push(`${x.slug}: fewer than 3 cues`);
    if (!(x.pm || []).length) problems.push(`${x.slug}: no primary muscle`);
    for (const pair of [...(x.cues || []), ...(x.setup || []), ...(x.mistakes || []), ...(x.safety || [])]) {
      if (!Array.isArray(pair) || !pair[0] || !pair[1]) problems.push(`${x.slug}: incomplete EN/AR pair`);
    }
  }
  for (const x of list) for (const k of ['easier', 'harder']) if (x[k] && !slugs.has(x[k])) problems.push(`${x.slug}.${k} -> ${x[k]} missing`);
  const aliases = list.flatMap((x) => x.aliases || []);
  const dup = aliases.filter((a, i) => aliases.indexOf(a) !== i);
  if (dup.length) problems.push(`duplicate aliases: ${dup.join(', ')}`);
  return problems;
}

(async () => {
  const problems = check();
  if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
  console.log(`${list.length} exercises, checks passed`);
  if (process.argv.includes('--check')) return;

  const c = new Client({ connectionString: process.env.PG_URL });
  await c.connect();
  try {
    await c.query('begin');
    await c.query('set constraints all deferred');
    let i = 0;
    for (const x of list) {
      await c.query(
        `insert into public.exercises (slug, name, name_ar, category, muscles, primary_muscles, secondary_muscles, equipment, level,
           pattern, mechanic, unilateral, tracking, setup, cues, mistakes, safety, breathing, tempo, rest_seconds, sports,
           easier, harder, aliases, sort, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25, now())
         on conflict (slug) do update set name=excluded.name, name_ar=excluded.name_ar, category=excluded.category,
           muscles=excluded.muscles, primary_muscles=excluded.primary_muscles, secondary_muscles=excluded.secondary_muscles,
           equipment=excluded.equipment, level=excluded.level, pattern=excluded.pattern, mechanic=excluded.mechanic,
           unilateral=excluded.unilateral, tracking=excluded.tracking, setup=excluded.setup, cues=excluded.cues,
           mistakes=excluded.mistakes, safety=excluded.safety, breathing=excluded.breathing, tempo=excluded.tempo,
           rest_seconds=excluded.rest_seconds, sports=excluded.sports, easier=excluded.easier, harder=excluded.harder,
           aliases=excluded.aliases, sort=excluded.sort, updated_at=now()`,
        [x.slug, x.name, x.ar, x.cat, [...x.pm, ...(x.sm || [])], x.pm, x.sm || [], x.eq || [], x.lvl,
         x.pattern, x.mech, !!x.uni, x.track, JSON.stringify(pairs(x.setup)), JSON.stringify(pairs(x.cues)),
         JSON.stringify(pairs(x.mistakes)), JSON.stringify(pairs(x.safety)),
         x.breath ? JSON.stringify({ en: x.breath[0], ar: x.breath[1] }) : null, x.tempo || null, x.rest ?? null,
         x.sports || [], x.easier || null, x.harder || null, x.aliases || [], i++],
      );
    }
    // Remove exercises that left the library and nothing logs against.
    const keep = list.map((x) => x.slug);
    const gone = await c.query(
      `delete from public.exercises e where not (e.slug = any($1)) and not exists (select 1 from public.workout_sets s where s.exercise = e.slug) returning slug`,
      [keep],
    );
    // Link workout items by alias.
    const alias = new Map();
    list.forEach((x) => (x.aliases || []).forEach((a) => alias.set(a.toLowerCase(), x.slug)));
    const { rows } = await c.query('select id, blocks from public.workouts');
    let linked = 0;
    for (const w of rows) {
      if (!Array.isArray(w.blocks)) continue;
      let changed = false;
      for (const b of w.blocks) for (const it of b.items || []) {
        const slug = alias.get(String(it.name || '').toLowerCase()) || (keep.includes(it.ex) ? it.ex : null);
        if ((it.ex || null) !== slug) { if (slug) it.ex = slug; else delete it.ex; changed = true; }
        if (slug) linked++;
      }
      if (changed) await c.query('update public.workouts set blocks=$2 where id=$1', [w.id, JSON.stringify(w.blocks)]);
    }
    await c.query('commit');
    console.log(`loaded ${list.length}, removed ${gone.rowCount} (${gone.rows.map((r) => r.slug).join(', ') || 'none'}), ${linked} workout items linked`);
  } catch (e) {
    await c.query('rollback');
    throw e;
  } finally {
    await c.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
