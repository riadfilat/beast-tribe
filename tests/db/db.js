// Shared helper for database tests: every test runs inside a transaction that is rolled back,
// so nothing is ever left in the live database.
// Needs PG_URL (the connection string lives in local memory, never in this repo).
// TEST_APPLY="supabase/migrations/091_x.sql" runs not-yet-applied migrations first, inside the
// same transaction, so a change can be tested before it goes live.
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const ROOT = path.join(__dirname, '..', '..');

async function inRollback(fn) {
  if (!process.env.PG_URL) throw new Error('Set PG_URL to run database tests.');
  const db = new Client({ connectionString: process.env.PG_URL, ssl: { rejectUnauthorized: false } });
  await db.connect();
  try {
    await db.query('BEGIN');
    for (const file of (process.env.TEST_APPLY || '').split(',').filter(Boolean)) {
      await db.query(fs.readFileSync(path.join(ROOT, file.trim()), 'utf8'));
    }
    return await fn(db);
  } finally {
    await db.query('ROLLBACK').catch(() => {});
    await db.end();
  }
}

/** A throwaway member (auth user + profile), gone when the transaction rolls back. */
async function makeMember(db, name, extra = {}) {
  const { rows } = await db.query(
    `INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
     VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
             $1, jsonb_build_object('full_name', $2::text), now(), now())
     RETURNING id`,
    [`test-${name}-${Math.random().toString(36).slice(2)}@example.test`, name],
  );
  const id = rows[0].id;
  await db.query(
    `INSERT INTO profiles (id, full_name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`, [id, name]);
  for (const [col, val] of Object.entries(extra)) {
    await db.query(`UPDATE profiles SET ${col} = $2 WHERE id = $1`, [id, val]);
  }
  return id;
}

/** The app's sports (id → name in the database), read from src/lib/sports.ts. */
function appSports() {
  const src = fs.readFileSync(path.join(ROOT, 'src/lib/sports.ts'), 'utf8');
  return [...src.matchAll(/id: '([a-z_]+)'[^}]*dbName: '([^']+)'/g)].map((m) => ({ id: m[1], dbName: m[2] }));
}

module.exports = { inRollback, makeMember, appSports };
