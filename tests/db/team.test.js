// Leaders, supporters, features, invites and HQ admins (migration 092): who may do what.
const test = require('node:test');
const assert = require('node:assert/strict');
const { inRollback, makeAccount, testEmail, as, errorOf } = require('./db');

/** A community with an HQ admin, a leader, a supporter and a plain member. */
async function world(db) {
  const hq = await makeAccount(db, testEmail('hq'));
  const leader = await makeAccount(db, testEmail('leader'));
  const supporter = await makeAccount(db, testEmail('supporter'));
  const member = await makeAccount(db, testEmail('member'));
  await db.query(`INSERT INTO admin_roles (user_id, role) VALUES ($1, 'admin')`, [hq]);
  const { rows: [c] } = await db.query(`INSERT INTO communities (name, slug) VALUES ('Test club', 'test-' || gen_random_uuid()) RETURNING id`);
  await db.query(
    `INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, 'admin'), ($1, $3, 'supporter'), ($1, $4, 'member')`,
    [c.id, leader, supporter, member],
  );
  return { c: c.id, hq, leader, supporter, member };
}
const roleOf = async (db, c, u) => (await db.query('SELECT bt_team_role($1, $2) AS r', [c, u])).rows[0].r;
const call = (db, sql, params) => db.query(sql, params).then((r) => r.rows[0] && Object.values(r.rows[0])[0]);

test('HQ invites a leader before they have an account; the role applies when they verify their email', () => inRollback(async (db) => {
  const w = await world(db);
  const email = testEmail('new-leader');
  assert.equal(await as(db, w.hq, () => call(db, 'SELECT invite_to_team($1, $2, $3)', [w.c, email, 'admin'])), 'invited');
  const u = await makeAccount(db, email.toUpperCase(), { confirmed: false });
  assert.equal(await roleOf(db, w.c, u), null, 'no role before the email is verified');
  await db.query('UPDATE auth.users SET email_confirmed_at = now() WHERE id = $1', [u]);
  assert.equal(await roleOf(db, w.c, u), 'leader');
}));

test('a leader adds a supporter who already has an account', () => inRollback(async (db) => {
  const w = await world(db);
  const email = testEmail('helper');
  const u = await makeAccount(db, email);
  assert.equal(await as(db, w.leader, () => call(db, 'SELECT invite_to_team($1, $2, $3)', [w.c, email, 'supporter'])), 'added');
  assert.equal(await roleOf(db, w.c, u), 'supporter');
}));

test('only HQ adds leaders; supporters and members add nobody', () => inRollback(async (db) => {
  const w = await world(db);
  const sql = 'SELECT invite_to_team($1, $2, $3)';
  assert.match(await errorOf(() => as(db, w.leader, () => db.query(sql, [w.c, testEmail('x'), 'admin']))), /HQ_ONLY/);
  assert.match(await errorOf(() => as(db, w.supporter, () => db.query(sql, [w.c, testEmail('x'), 'supporter']))), /NOT_LEADER/);
  assert.match(await errorOf(() => as(db, w.member, () => db.query(sql, [w.c, testEmail('x'), 'supporter']))), /NOT_LEADER/);
}));

test('an invite never turns a leader into a supporter', () => inRollback(async (db) => {
  const w = await world(db);
  const email = (await db.query('SELECT email FROM auth.users WHERE id = $1', [w.leader])).rows[0].email;
  await as(db, w.hq, () => db.query('SELECT invite_to_team($1, $2, $3)', [w.c, email, 'supporter']));
  assert.equal(await roleOf(db, w.c, w.leader), 'leader');
}));

test('a leader removes supporters but not leaders; removed people stay members', () => inRollback(async (db) => {
  const w = await world(db);
  const other = await makeAccount(db, testEmail('co-leader'));
  await db.query(`INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, 'admin')`, [w.c, other]);
  assert.match(await errorOf(() => as(db, w.leader, () => db.query('SELECT remove_from_team($1, $2)', [w.c, other]))), /NOT_ALLOWED/);
  assert.match(await errorOf(() => as(db, w.supporter, () => db.query('SELECT remove_from_team($1, $2)', [w.c, w.supporter]))), /NOT_ALLOWED/);
  assert.match(await errorOf(() => as(db, w.member, () => db.query('SELECT remove_from_team($1, $2)', [w.c, w.supporter]))), /NOT_ALLOWED/);
  await as(db, w.leader, () => db.query('SELECT remove_from_team($1, $2)', [w.c, w.supporter]));
  assert.equal(await roleOf(db, w.c, w.supporter), null);
  const { rows } = await db.query('SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2', [w.c, w.supporter]);
  assert.equal(rows[0].role, 'member');
}));

test('leaders and HQ switch features; supporters and members cannot; everyone can see them', () => inRollback(async (db) => {
  const w = await world(db);
  const sql = 'SELECT set_community_feature($1, $2, $3)';
  assert.match(await errorOf(() => as(db, w.supporter, () => db.query(sql, [w.c, 'courts', true]))), /NOT_LEADER/);
  assert.match(await errorOf(() => as(db, w.member, () => db.query(sql, [w.c, 'courts', true]))), /NOT_LEADER/);
  assert.match(await errorOf(() => as(db, w.leader, () => db.query(sql, [w.c, 'rockets', true]))), /BAD_FEATURE/);
  await as(db, w.leader, () => db.query(sql, [w.c, 'courts', true]));
  await as(db, w.hq, () => db.query(sql, [w.c, 'nutrition', true]));
  const seen = await as(db, w.member, () => db.query('SELECT feature FROM community_features WHERE community_id = $1 ORDER BY 1', [w.c]));
  assert.deepEqual(seen.rows.map((r) => r.feature), ['courts', 'nutrition']);
  assert.match(await errorOf(() => as(db, w.member, () => db.query(`INSERT INTO community_features (community_id, feature) VALUES ($1, 'teams')`, [w.c]))), /permission denied/);
}));

test("a leader has no say in another community", () => inRollback(async (db) => {
  const w = await world(db);
  const { rows: [other] } = await db.query(`INSERT INTO communities (name, slug) VALUES ('Other club', 'test-' || gen_random_uuid()) RETURNING id`);
  assert.match(await errorOf(() => as(db, w.leader, () => db.query('SELECT set_community_feature($1, $2, $3)', [other.id, 'courts', true]))), /NOT_LEADER/);
  assert.match(await errorOf(() => as(db, w.leader, () => db.query('SELECT invite_to_team($1, $2, $3)', [other.id, testEmail('x'), 'supporter']))), /NOT_LEADER/);
}));

test('invites are only visible to HQ and the community leader', () => inRollback(async (db) => {
  const w = await world(db);
  await as(db, w.leader, () => db.query('SELECT invite_to_team($1, $2, $3)', [w.c, testEmail('pending'), 'supporter']));
  const count = (u) => as(db, u, () => db.query('SELECT count(*)::int AS n FROM community_invites WHERE community_id = $1', [w.c])).then((r) => r.rows[0].n);
  assert.equal(await count(w.leader), 1);
  assert.equal(await count(w.hq), 1);
  assert.equal(await count(w.supporter), 0);
  assert.equal(await count(w.member), 0);
}));

test('the app records one row a day with the city, phone and language; members cannot read it', () => inRollback(async (db) => {
  const w = await world(db);
  await as(db, w.member, () => db.query('SELECT bt_seen($1, $2, $3)', ['  Riyadh ', 'ios', 'ar']));
  await as(db, w.member, () => db.query('SELECT bt_seen($1, $2, $3)', [null, 'ios', 'xx']));
  const { rows } = await db.query('SELECT city_key, platform, locale FROM member_days WHERE user_id = $1', [w.member]);
  assert.deepEqual(rows, [{ city_key: 'riyadh', platform: 'ios', locale: 'ar' }]);
  assert.match(await errorOf(() => as(db, w.member, () => db.query('SELECT * FROM member_days'))), /permission denied/);
}));

test('only the super admin adds admins, never themself or another super admin', () => inRollback(async (db) => {
  const w = await world(db);
  const boss = await makeAccount(db, testEmail('boss'));
  await db.query(`INSERT INTO admin_roles (user_id, role) VALUES ($1, 'super_admin')`, [boss]);
  const email = (await db.query('SELECT email FROM auth.users WHERE id = $1', [w.member])).rows[0].email;
  const bossEmail = (await db.query('SELECT email FROM auth.users WHERE id = $1', [boss])).rows[0].email;
  assert.match(await errorOf(() => as(db, w.hq, () => db.query('SELECT set_admin_role($1, $2)', [email, 'admin']))), /SUPER_ADMIN_ONLY/);
  assert.match(await errorOf(() => as(db, boss, () => db.query('SELECT set_admin_role($1, $2)', [bossEmail, null]))), /NOT_YOURSELF/);
  assert.match(await errorOf(() => as(db, boss, () => db.query('SELECT set_admin_role($1, $2)', [email, 'super_admin']))), /BAD_ROLE/);
  await as(db, boss, () => db.query('SELECT set_admin_role($1, $2)', [email, 'admin']));
  assert.equal((await db.query('SELECT bt_is_hq($1) AS x', [w.member])).rows[0].x, true);
  await as(db, boss, () => db.query('SELECT set_admin_role($1, $2)', [email, null]));
  assert.equal((await db.query('SELECT bt_is_hq($1) AS x', [w.member])).rows[0].x, false);
}));

test('people with no role are refused everywhere (no role must never count as allowed)', () => inRollback(async (db) => {
  const w = await world(db);
  const outsider = await makeAccount(db, testEmail('outsider'));
  const invite = await as(db, w.leader, () => db.query('SELECT invite_to_team($1, $2, $3)', [w.c, testEmail('pending'), 'supporter']));
  const { rows: [i] } = await db.query('SELECT id FROM community_invites WHERE community_id = $1 AND accepted_at IS NULL', [w.c]);
  for (const u of [w.member, outsider]) {
    assert.match(await errorOf(() => as(db, u, () => db.query('SELECT cancel_team_invite($1)', [i.id]))), /NOT_ALLOWED/);
    assert.match(await errorOf(() => as(db, u, () => db.query('SELECT set_community_feature($1, $2, $3)', [w.c, 'teams', true]))), /NOT_LEADER/);
    assert.match(await errorOf(() => as(db, u, () => db.query('SELECT invite_to_team($1, $2, $3)', [w.c, testEmail('y'), 'supporter']))), /NOT_LEADER/);
    assert.match(await errorOf(() => as(db, u, () => db.query('SELECT remove_from_team($1, $2)', [w.c, w.supporter]))), /NOT_ALLOWED/);
  }
  assert.ok(invite);
}));
