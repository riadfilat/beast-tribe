// The leader dashboard's numbers (migration 093): who may see them, money only for leaders, ticking who paid.
const test = require('node:test');
const assert = require('node:assert/strict');
const { inRollback, makeAccount, testEmail, as, errorOf } = require('./db');

/** A community with a leader, a supporter, two players, an outsider and one paid session held yesterday. */
async function world(db) {
  const [leader, supporter, p1, p2, outsider] = await Promise.all(['leader', 'supporter', 'p1', 'p2', 'outsider'].map((w) => makeAccount(db, testEmail(w))));
  const { rows: [c] } = await db.query(`INSERT INTO communities (name, slug) VALUES ('Test club', 'test-' || gen_random_uuid()) RETURNING id`);
  await db.query(
    `INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, 'admin'), ($1, $3, 'supporter'), ($1, $4, 'member'), ($1, $5, 'member')`,
    [c.id, leader, supporter, p1, p2],
  );
  const { rows: [e] } = await db.query(
    `INSERT INTO events (title, event_type, starts_at, created_by, visibility, community_id, max_capacity, price_sar)
     VALUES ('Paid padel', 'padel', now() + interval '1 day', $1, 'community', $2, 4, 60) RETURNING id`,
    [leader, c.id],
  );
  for (const p of [p1, p2]) await db.query(`INSERT INTO event_rsvps (event_id, user_id, status) VALUES ($1, $2, 'going')`, [e.id, p]);
  // Move it to yesterday, as if it had been played.
  // Triggers off for this connection only (no table lock, so the live app is never blocked).
  await db.query(`SET LOCAL session_replication_role = replica`);
  await db.query(`UPDATE events SET starts_at = now() - interval '1 day', ends_at = now() - interval '23 hours' WHERE id = $1`, [e.id]);
  await db.query(`SET LOCAL session_replication_role = origin`);
  return { c: c.id, e: e.id, leader, supporter, p1, p2, outsider };
}
const overview = (db, uid, c) => as(db, uid, () => db.query('SELECT community_overview($1) AS o', [c])).then((r) => r.rows[0].o);

test("the leader sees this week's players, sessions, spots filled and money", () => inRollback(async (db) => {
  const w = await world(db);
  const o = await overview(db, w.leader, w.c);
  assert.equal(o.members, 2, 'the leader and supporter are not counted as members');
  assert.equal(o.this_week.players, 2);
  assert.equal(o.this_week.sessions, 1);
  assert.equal(Number(o.this_week.fill), 0.5);
  assert.equal(o.days.length, 7);
  assert.equal(o.days.reduce((t, d) => t + Number(d.players), 0), 2);
  assert.equal(Number(o.money.expected), 120);
  assert.equal(Number(o.money.paid), 0);
  assert.equal(o.role, 'leader');
}));

test('supporters see the numbers but never money', () => inRollback(async (db) => {
  const w = await world(db);
  const o = await overview(db, w.supporter, w.c);
  assert.equal(o.this_week.players, 2);
  assert.equal(o.money, null);
}));

test('members and outsiders cannot read a community\'s numbers', () => inRollback(async (db) => {
  const w = await world(db);
  assert.match(await errorOf(() => overview(db, w.p1, w.c)), /NOT_ALLOWED/);
  assert.match(await errorOf(() => overview(db, w.outsider, w.c)), /NOT_ALLOWED/);
}));

test('the leader ticks who paid; money follows; supporters and players cannot tick', () => inRollback(async (db) => {
  const w = await world(db);
  const tick = (uid, player, paid) => as(db, uid, () => db.query('SELECT set_player_paid($1, $2, $3)', [w.e, player, paid]));
  assert.match(await errorOf(() => tick(w.supporter, w.p1, true)), /NOT_LEADER/);
  assert.match(await errorOf(() => tick(w.p1, w.p1, true)), /NOT_LEADER/);
  assert.match(await errorOf(() => tick(w.leader, w.outsider, true)), /NOT_PLAYING/);
  await tick(w.leader, w.p1, true);
  let o = await overview(db, w.leader, w.c);
  assert.equal(Number(o.money.paid), 60);
  await tick(w.leader, w.p1, false);
  o = await overview(db, w.leader, w.c);
  assert.equal(Number(o.money.paid), 0);
}));

test('a free session has nothing to pay', () => inRollback(async (db) => {
  const w = await world(db);
  await db.query('UPDATE events SET price_sar = NULL WHERE id = $1', [w.e]);
  assert.match(await errorOf(() => as(db, w.leader, () => db.query('SELECT set_player_paid($1, $2, $3)', [w.e, w.p1, true]))), /FREE_SESSION/);
}));
