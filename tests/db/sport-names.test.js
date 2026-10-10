// Sport names: the database and the app must agree on every sport's id (docs/AUDIT.md, problem 1).
const test = require('node:test');
const assert = require('node:assert/strict');
const { inRollback, makeMember, appSports } = require('./db');

test('every sport in the database maps to an app sport id', () => inRollback(async (db) => {
  const ids = new Set(appSports().map((s) => s.id).concat('community'));
  const { rows } = await db.query('SELECT name, bt_sport_slug(name) AS slug FROM sports');
  const wrong = rows.filter((r) => !ids.has(r.slug)).map((r) => `${r.name} → ${r.slug}`);
  assert.deepEqual(wrong, []);
}));

test('every app sport finds its database row', () => inRollback(async (db) => {
  for (const s of appSports()) {
    const { rows } = await db.query(
      'SELECT count(*)::int AS n FROM sports WHERE bt_sport_slug(name) = bt_sport_slug($1)', [s.id]);
    assert.equal(rows[0].n, 1, `${s.id} (${s.dbName})`);
  }
}));

test('a Table Tennis session calls a table-tennis player in the community', () => inRollback(async (db) => {
  const host = await makeMember(db, 'host');
  const player = await makeMember(db, 'player');
  const { rows: [c] } = await db.query(
    `INSERT INTO communities (name, slug) VALUES ('Test club', 'test-' || gen_random_uuid()) RETURNING id`);
  await db.query('INSERT INTO community_members (community_id, user_id) VALUES ($1, $2), ($1, $3)', [c.id, host, player]);
  await db.query(
    `INSERT INTO user_sports (user_id, sport_id) SELECT $1, id FROM sports WHERE name = 'Table Tennis'`, [player]);
  const { rows: [e] } = await db.query(
    `INSERT INTO events (title, event_type, starts_at, created_by, visibility, community_id, max_capacity)
     VALUES ('Table tennis test', 'table_tennis', now() + interval '1 day', $1, 'community', $2, 4) RETURNING id`,
    [host, c.id]);
  await db.query('SELECT bt_call_players($1)', [e.id]);
  const { rows } = await db.query('SELECT user_id FROM session_calls WHERE event_id = $1', [e.id]);
  assert.ok(rows.some((r) => r.user_id === player), 'the table-tennis player was not called');
}));
