// Writes the Operation Beast workout library (scripts/library/sports/*.js) to the database.
// Every workout is checked first (check.js). Re-running updates workouts in place by library_key.
// Usage: PG_URL=... node scripts/library/build.js [--dry] [sport...]
const { Client } = require('pg');
const { check, SPORTS } = require('./check');

const DIFF = { beginner: 'beginner', intermediate: 'intermediate', advanced: 'advanced' };

(async () => {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const which = args.length ? args : SPORTS;
  const errors = which.flatMap((s) => check(s));
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  const rows = which.flatMap((sport) => require(`./sports/${sport}.js`).map((w) => ({ sport, ...w })));
  console.log(`${rows.length} workouts in ${which.length} sports`);
  if (process.argv.includes('--dry')) return;

  const c = new Client({ connectionString: process.env.PG_URL });
  await c.connect();
  try {
    await c.query('begin');
    let added = 0, updated = 0;
    for (const w of rows) {
      const vals = [w.title[0], w.title[1], w.desc[0], w.desc[1], w.sport, w.format, DIFF[w.level], w.minutes, w.equipment, JSON.stringify(w.blocks), w.key];
      const r = await c.query(
        `update public.workouts set title=$1, title_ar=$2, description=$3, description_ar=$4, sport=$5, format=$6, difficulty=$7,
           duration_minutes=$8, equipment=$9, blocks=$10, status='published', updated_at=now() where library_key=$11`,
        vals,
      );
      if (r.rowCount) { updated++; continue; }
      await c.query(
        `insert into public.workouts (title, title_ar, description, description_ar, sport, format, difficulty, duration_minutes, equipment, blocks,
           library_key, source, status, program_only, xp_reward, published_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'library','published',false,0,now())`,
        vals,
      );
      added++;
    }
    await c.query('commit');
    console.log(`added ${added}, updated ${updated}`);
  } catch (e) {
    await c.query('rollback');
    throw e;
  } finally {
    await c.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
