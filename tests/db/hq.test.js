// The HQ command center (migration 096): only HQ admins may read it, and its counts add up.
const test = require('node:test');
const assert = require('node:assert/strict');
const { inRollback, makeAccount, testEmail, as, errorOf } = require('./db');

const CITY = `Testcity ${Math.random().toString(36).slice(2, 7)}`;

/** One made-up city with a community, a leader, two players, a session today and an empty one soon. */
async function world(db) {
  const [admin, moderator, leader, p1, p2] = await Promise.all(['admin', 'mod', 'leader', 'p1', 'p2'].map((w) => makeAccount(db, testEmail(w))));
  await db.query(`INSERT INTO admin_roles (user_id, role) VALUES ($1, 'admin'), ($2, 'moderator')`, [admin, moderator]);
  await db.query(`UPDATE profiles SET city = $1 WHERE id = ANY($2)`, [CITY, [leader, p1, p2]]);
  const { rows: [c] } = await db.query(`INSERT INTO communities (name, slug, city) VALUES ('HQ test club', 'test-' || gen_random_uuid(), $1) RETURNING id`, [CITY]);
  await db.query(`INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, 'admin'), ($1, $3, 'member'), ($1, $4, 'member')`, [c.id, leader, p1, p2]);
  const ev = async (title, hoursFromNow) =>
    (await db.query(
      `INSERT INTO events (title, event_type, starts_at, created_by, visibility, community_id, max_capacity, location_city)
       VALUES ($1, 'padel', now() + make_interval(hours => $2), $3, 'community', $4, 4, $5) RETURNING id`,
      [title, hoursFromNow, leader, c.id, CITY],
    )).rows[0].id;
  // Both start within the next 2–3 hours: still "today" in Riyadh unless the test runs just before midnight.
  const full = await ev('Busy padel', 2);
  const empty = await ev('Empty padel', 3);
  for (const p of [p1, p2]) await db.query(`INSERT INTO event_rsvps (event_id, user_id, status) VALUES ($1, $2, 'going')`, [full, p]);
  return { admin, moderator, leader, p1, c: c.id, full, empty };
}
const hq = (db, uid, fn, ...args) => as(db, uid, () => db.query(`SELECT ${fn}(${args.map((_, i) => `$${i + 1}`).join(', ')}) AS r`, args)).then((r) => r.rows[0].r);
const lateNight = () => new Date(Date.now() + 3 * 3600000).getUTCHours() >= 21;

test('only HQ admins can read the command center', () => inRollback(async (db) => {
  const w = await world(db);
  for (const u of [w.moderator, w.leader, w.p1]) {
    for (const fn of ['hq_live', 'hq_cities', 'hq_attention', 'hq_communities', 'hq_mix', 'hq_days']) {
      assert.match(await errorOf(() => hq(db, u, fn)), /HQ_ONLY/, `${fn} refused`);
    }
  }
  assert.ok(await hq(db, w.admin, 'hq_live'));
}));

test("today's sessions and players, for one city", { skip: lateNight() && 'too close to midnight in Riyadh' }, () => inRollback(async (db) => {
  const w = await world(db);
  const live = await hq(db, w.admin, 'hq_live', CITY);
  assert.equal(live.sessions_today, 2);
  assert.equal(live.players_today, 2);
  assert.equal(live.communities, 1);
  assert.equal(live.members, 3);
  const today = (await db.query('SELECT bt_riyadh_today()::text AS d')).rows[0].d; // as text: no time-zone shift
  const day = await hq(db, w.admin, 'hq_day_sessions', today, CITY);
  assert.deepEqual(day.map((s) => [s.title, s.going]), [['Busy padel', 2], ['Empty padel', 0]]);
  const days = await hq(db, w.admin, 'hq_days', CITY);
  assert.equal(days.length, 7);
  assert.equal(days[0].sessions, 2);
}));

test('communities show their leader, members and what is coming', () => inRollback(async (db) => {
  const w = await world(db);
  const list = await hq(db, w.admin, 'hq_communities', CITY);
  assert.equal(list.length, 1);
  assert.equal(list[0].members, 2);
  assert.equal(list[0].leaders.length, 1);
  assert.equal(list[0].upcoming_week, 2);
  assert.equal(list[0].weekly.length, 7);
}));

test('a session starting soon with no players needs attention', () => inRollback(async (db) => {
  const w = await world(db);
  const a = await hq(db, w.admin, 'hq_attention');
  assert.ok(a.empty_soon.some((e) => e.id === w.empty), 'the empty session is listed');
  assert.ok(!a.empty_soon.some((e) => e.id === w.full), 'the full one is not');
}));

test('cities list members and who is active this week', () => inRollback(async (db) => {
  const w = await world(db);
  await as(db, w.p1, () => db.query('SELECT bt_seen($1, $2, $3)', [CITY, 'android', 'en']));
  const cities = await hq(db, w.admin, 'hq_cities');
  const mine = cities.find((c) => c.city === CITY.toLowerCase());
  assert.equal(mine.members, 3);
  assert.ok(mine.active >= 2, 'the two players who booked count as active');
  const mix = await hq(db, w.admin, 'hq_mix', CITY);
  assert.equal(mix.platforms.android, 1);
  assert.equal(mix.sports[0].sport, 'padel');
}));

test('growth: the leads funnel counts each step and only HQ can read it', () => inRollback(async (db) => {
  const w = await world(db);
  const lead = (status, source) =>
    db.query(`INSERT INTO partner_leads (kind, business_name, contact_name, email, source, status) VALUES ('gym', 'Test gym', 'Test person', 'lead@example.test', $1, $2)`, [source, status]);
  await lead('new', 'instagram');
  await lead('demo', 'instagram');
  await lead('won', 'website');
  await lead('lost', 'website');
  assert.match(await errorOf(() => hq(db, w.leader, 'hq_growth', 30)), /HQ_ONLY/);
  const g = await hq(db, w.admin, 'hq_growth', 30);
  const before = await db.query(`SELECT count(*)::int AS n FROM partner_leads WHERE created_at > now() - interval '30 days'`);
  assert.equal(g.funnel.new, before.rows[0].n);
  assert.ok(g.funnel.demo >= 2 && g.funnel.won >= 1 && g.funnel.lost >= 1);
  assert.ok(g.funnel.contacted >= g.funnel.demo && g.funnel.demo >= g.funnel.trial && g.funnel.trial >= g.funnel.won, 'each step is no bigger than the one before');
  assert.ok(g.sources.some((s) => s.source === 'instagram' && s.n >= 2));
}));
