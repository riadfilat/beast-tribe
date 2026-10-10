// Deleting a member's account (migration 099): only the super admin, never themself, an admin or a
// leader; everything of theirs goes; what they did for others stays without their name.
const test = require('node:test');
const assert = require('node:assert/strict');
const { inRollback, makeAccount, testEmail, as, errorOf } = require('./db');

async function world(db) {
  const [boss, admin, leader, member, other] = await Promise.all(['boss', 'admin', 'leader', 'member', 'other'].map((w) => makeAccount(db, testEmail(w))));
  await db.query(`INSERT INTO admin_roles (user_id, role) VALUES ($1, 'super_admin'), ($2, 'admin')`, [boss, admin]);
  const { rows: [c] } = await db.query(`INSERT INTO communities (name, slug) VALUES ('Delete test club', 'test-' || gen_random_uuid()) RETURNING id`);
  await db.query(`INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, 'admin'), ($1, $3, 'member'), ($1, $4, 'member')`, [c.id, leader, member, other]);
  return { boss, admin, leader, member, other, c: c.id };
}
const del = (db, uid, target) => as(db, uid, () => db.query('SELECT delete_member($1)', [target]));
const exists = async (db, id) => (await db.query('SELECT count(*)::int AS n FROM auth.users WHERE id = $1', [id])).rows[0].n === 1;

test('only the super admin can delete, and never themself, an admin or a leader', () => inRollback(async (db) => {
  const w = await world(db);
  assert.match(await errorOf(() => del(db, w.admin, w.member)), /SUPER_ADMIN_ONLY/);
  assert.match(await errorOf(() => del(db, w.leader, w.member)), /SUPER_ADMIN_ONLY/);
  assert.match(await errorOf(() => del(db, w.other, w.member)), /SUPER_ADMIN_ONLY/);
  assert.match(await errorOf(() => del(db, w.boss, w.boss)), /NOT_YOURSELF/);
  assert.match(await errorOf(() => del(db, w.boss, w.admin)), /IS_ADMIN/);
  assert.match(await errorOf(() => del(db, w.boss, w.leader)), /IS_LEADER/);
  assert.ok(await exists(db, w.member));
}));

test('a member who reported a post, booked a coach and posted can be deleted; their things go, the log keeps their name', () => inRollback(async (db) => {
  const w = await world(db);
  const { rows: [post] } = await db.query(`INSERT INTO feed_posts (user_id, content) VALUES ($1, 'hello') RETURNING id`, [w.member]);
  await db.query(`INSERT INTO content_reports (reporter_id, target_table, target_id, reason) VALUES ($1, 'feed_posts', $2, 'spam')`, [w.member, post.id]);
  const { rows: [coach] } = await db.query(`INSERT INTO partners (name, slug, type, partner_type, status, created_by) VALUES ('Coach', 'test-coach-' || gen_random_uuid(), 'coach', 'coach', 'active', $1) RETURNING id`, [w.member]);
  await db.query(`INSERT INTO coach_bookings (partner_id, booked_by, booking_date, start_time, end_time) VALUES ($1, $2, current_date + 1, '06:00', '07:00')`, [coach.id, w.member]);

  await db.query(`UPDATE profiles SET full_name = 'Sara Al Test', display_name = 'Sara' WHERE id = $1`, [w.member]);
  await del(db, w.boss, w.member);
  assert.equal(await exists(db, w.member), false);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM feed_posts WHERE id = $1', [post.id])).rows[0].n, 0, 'their post is gone');
  assert.equal((await db.query('SELECT count(*)::int AS n FROM coach_bookings WHERE partner_id = $1', [coach.id])).rows[0].n, 0, 'their booking is gone');
  assert.equal((await db.query('SELECT created_by FROM partners WHERE id = $1', [coach.id])).rows[0].created_by, null, 'the business stays');
  const log = (await db.query(`SELECT admin_user_id, details FROM admin_audit_log WHERE action = 'delete_member' AND target_id = $1`, [w.member])).rows[0];
  assert.equal(log.admin_user_id, w.boss);
  assert.equal(log.details.name, 'Sara Al Test', 'the log keeps the full name');
}));

test('members can still delete their own account after reporting someone', () => inRollback(async (db) => {
  const w = await world(db);
  const { rows: [post] } = await db.query(`INSERT INTO feed_posts (user_id, content) VALUES ($1, 'hi') RETURNING id`, [w.other]);
  await db.query(`INSERT INTO content_reports (reporter_id, target_table, target_id, reason) VALUES ($1, 'feed_posts', $2, 'spam')`, [w.member, post.id]);
  await as(db, w.member, () => db.query('SELECT delete_my_account()'));
  assert.equal(await exists(db, w.member), false);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM content_reports WHERE target_id = $1', [post.id])).rows[0].n, 1, 'the report stays for the moderators');
}));
