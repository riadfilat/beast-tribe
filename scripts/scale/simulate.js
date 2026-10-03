// Scale rehearsal: seeds a realistic 20,000-member Beast Tribe inside ONE transaction, times the
// app's main queries as a signed-in member, optionally applies a migration and times them again,
// then ROLLS BACK. Nothing is left in the database.
//
//   PG_URL=postgres://... node scripts/scale/simulate.js [path/to/migration.sql]
//
const fs = require('fs');
const { Client } = require('pg');

const USERS = Number(process.env.SIM_USERS || 20000);
const EVENTS = USERS * 2;
const POSTS = USERS * 3;

(async () => {
  const migration = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') : null;
  const c = new Client({ connectionString: process.env.PG_URL });
  await c.connect();
  const run = (sql, params) => c.query(sql, params);
  const t0 = Date.now();
  await run('begin');
  try {
    await run("set local statement_timeout = '300s'");
    await run('set local session_replication_role = replica'); // bulk load: no triggers
    const def = (await run('select id from communities where is_default limit 1')).rows[0].id;

    await run(`create temp table sim_users on commit drop as select gen_random_uuid() id, g n from generate_series(1, ${USERS}) g`);
    await run(`insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
               select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sim' || n || '@sim.invalid', now(), now() from sim_users`);
    await run(`insert into profiles (id, full_name, display_name, gender, city, region, onboarding_completed)
               select id, 'Sim Member ' || n, 'Sim ' || n, case when n % 2 = 0 then 'female' else 'male' end,
                      (array['Riyadh','Riyadh','Riyadh','Jeddah','Dammam'])[1 + n % 5], 'SA', true from sim_users`);

    await run(`create temp table sim_comms on commit drop as select gen_random_uuid() id, g n from generate_series(1, 300) g`);
    await run(`insert into communities (id, name, slug, visibility, kind, is_active, join_code)
               select id, 'Sim Co ' || n, 'sim-co-' || n, 'private', case when n % 2 = 0 then 'company' else 'gym' end, true, 'S' || lpad(n::text, 5, '0') from sim_comms`);
    await run(`insert into community_members (community_id, user_id) select $1, id from sim_users`, [def]);
    await run(`insert into community_members (community_id, user_id)
               select c.id, u.id from sim_users u join sim_comms c on c.n = 1 + u.n % 300 where u.n % 10 < 6`);

    await run(`create temp table sim_packs on commit drop as select gen_random_uuid() id, g n from generate_series(1, ${USERS / 10}) g`);
    await run(`insert into packs (id, name, created_by, invite_code, is_system, emblem_kind, emblem_value, emblem_color)
               select p.id, 'Sim Pack ' || p.n, u.id, 'P' || lpad(p.n::text, 5, '0'), false, 'glyph', 'wolf', 'slate' from sim_packs p join sim_users u on u.n = p.n`);
    await run(`insert into pack_members (pack_id, user_id, role)
               select p.id, u.id, case when k = 0 then 'leader' else 'member' end
               from sim_packs p cross join generate_series(0, 7) k join sim_users u on u.n = 1 + (p.n * 7 + k * 131) % ${USERS}`);

    await run(`create temp table sim_events on commit drop as select gen_random_uuid() id, g n from generate_series(1, ${EVENTS}) g`);
    await run(`insert into events (id, title, event_type, starts_at, ends_at, country, location_city, location_name, max_capacity, going_count, created_by, visibility, community_id)
               select e.id, 'Sim session ' || e.n, 'community', now() + ((e.n % 90) - 60) * interval '1 day' + (e.n % 16) * interval '1 hour',
                      now() + ((e.n % 90) - 60) * interval '1 day' + (e.n % 16 + 1) * interval '1 hour', 'SA',
                      (array['Riyadh','Riyadh','Riyadh','Jeddah','Dammam'])[1 + e.n % 5], 'Sim venue', 20, 8, u.id, 'community',
                      case when e.n % 10 < 7 then $1::uuid else (select id from sim_comms c where c.n = 1 + e.n % 300) end
               from sim_events e join sim_users u on u.n = 1 + e.n % ${USERS}`, [def]);
    await run(`insert into event_rsvps (event_id, user_id, status, created_at)
               select e.id, u.id, 'going', now() - (k || ' hours')::interval
               from sim_events e cross join generate_series(0, 7) k join sim_users u on u.n = 1 + (e.n * 7 + k * 131) % ${USERS}`);

    await run(`create temp table sim_posts on commit drop as select gen_random_uuid() id, g n from generate_series(1, ${POSTS}) g`);
    await run(`insert into feed_posts (id, user_id, content, community_id, created_at, is_visible, is_hidden)
               select p.id, u.id, 'Sim post ' || p.n, case when p.n % 10 < 7 then $1::uuid else (select id from sim_comms c where c.n = 1 + p.n % 300) end,
                      now() - (p.n % 129600) * interval '1 minute', true, false
               from sim_posts p join sim_users u on u.n = 1 + p.n % ${USERS}`, [def]);
    await run(`insert into beasts (post_id, user_id) select p.id, u.id from sim_posts p cross join generate_series(0, 4) k join sim_users u on u.n = 1 + (p.n * 3 + k * 977) % ${USERS}`);
    await run(`insert into feed_comments (post_id, user_id, content) select p.id, u.id, 'Nice' from sim_posts p join sim_users u on u.n = 1 + (p.n * 11) % ${USERS} where p.n % 2 = 0`);
    await run(`insert into notifications (user_id, type, data) select u.id, 'rsvp', '{}'::jsonb from sim_users u cross join generate_series(1, 10)`);
    await run(`insert into daily_activity (user_id, day, steps) select u.id, current_date - d, 3000 + (u.n * 37 + d * 911) % 9000 from sim_users u cross join generate_series(0, 29) d`);
    await run(`insert into workout_logs (user_id, title, duration_minutes, completed_at) select u.id, 'Sim workout', 40, now() - (k * 3 || ' days')::interval from sim_users u cross join generate_series(0, 9) k`);
    const ch = (await run(`insert into challenges (community_id, title, starts_on, ends_on) values ($1, 'Sim steps', current_date - 14, current_date + 14) returning id`, [def])).rows[0].id;
    await run(`insert into challenge_entries (challenge_id, user_id) select $1, id from sim_users where n % 4 = 0`, [ch]);

    await run('set local session_replication_role = origin');
    await run('analyze');
    console.log(`seeded ${USERS} members, ${EVENTS} sessions, ${EVENTS * 8} bookings, ${POSTS} posts, ${USERS * 30} step-days in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

    const me = (await run('select id from sim_users where n = 7')).rows[0].id; // in the default community and one private one
    const ev = (await run(`select id from sim_events where n = 61`)).rows[0].id;
    const post = (await run(`select id from sim_posts where n = 42`)).rows[0].id;

    const QUERIES = {
      'Board: 8 days of sessions with who is going': `
        select e.id, e.title, e.starts_at, e.going_count,
          (select row_to_json(x) from (select c.id, c.name, c.visibility, c.is_default from communities c where c.id = e.community_id) x) community,
          (select coalesce(json_agg(r1), '[]') from (
             select r.user_id, r.status, (select row_to_json(p1) from (select p.id, p.display_name, p.full_name, p.avatar_url from profiles p where p.id = r.user_id) p1) person
             from event_rsvps r where r.event_id = e.id and r.status = 'going' order by r.created_at limit 8) r1) roster
        from events e
        where e.starts_at >= date_trunc('day', now()) and e.starts_at < date_trunc('day', now()) + interval '8 days' and e.country = 'SA'
        order by e.starts_at limit 1000`,
      'My bookings': `select event_id, status from event_rsvps where user_id = '${me}'`,
      'One session: who is going': `select r.user_id, r.status from event_rsvps r where r.event_id = '${ev}'`,
      'Feed: latest 40 posts': `
        select f.id, f.content, f.created_at,
          (select row_to_json(a) from (select p.id, p.display_name, p.full_name, p.avatar_url from profiles p where p.id = f.user_id) a) author,
          (select count(*) from beasts b where b.post_id = f.id) beasts
        from feed_posts f where f.is_visible and not f.is_hidden and f.image_status is distinct from 'rejected'
        order by f.created_at desc limit 40`,
      'Comments on one post': `select id, content from feed_comments where post_id = '${post}' order by created_at`,
      'Inbox: latest 50': `select id, type, created_at from notifications where user_id = '${me}' order by created_at desc limit 50`,
      'My packs': `select pk.id, pk.name from pack_members pm join packs pk on pk.id = pm.pack_id where pm.user_id = '${me}'`,
      'Invite by name search': `select id, display_name, full_name, avatar_url from profiles where display_name ilike '%sim 1234%' or full_name ilike '%sim 1234%' limit 12`,
      'Challenge ranking (5,000 entrants)': `select * from challenge_board('${ch}')`,
      'Training log: 12 weeks': `select completed_at, duration_minutes from workout_logs where user_id = '${me}' and completed_at >= now() - interval '84 days'`,
    };

    async function measure(title) {
      console.log(`\n── ${title} ──`);
      await run(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: me, role: 'authenticated' })]);
      await run('set local role authenticated');
      const out = {};
      for (const [label, sql] of Object.entries(QUERIES)) {
        await run('savepoint q');
        try {
          let ms = null, rows = 0;
          for (let i = 0; i < 2; i++) {
            const r = await run(`explain (analyze, format json) ${sql}`);
            const plan = r.rows[0]['QUERY PLAN'][0];
            ms = plan['Execution Time'] + plan['Planning Time'];
            rows = plan.Plan['Actual Rows'];
          }
          out[label] = ms;
          console.log(`${ms.toFixed(1).padStart(9)} ms  ${String(rows).padStart(5)} rows  ${label}`);
        } catch (e) {
          await run('rollback to savepoint q');
          console.log(`   FAILED  ${label}: ${e.message}`);
          out[label] = null;
        }
        await run('release savepoint q').catch(() => {});
      }
      await run('reset role');
      return out;
    }

    const before = await measure('BEFORE (current rules)');
    if (migration) {
      await run(migration);
      await run('analyze events');
      const after = await measure('AFTER ' + process.argv[2].split('/').pop());
      console.log('\n── change ──');
      for (const k of Object.keys(QUERIES)) {
        if (before[k] != null && after[k] != null) console.log(`${before[k].toFixed(0).padStart(7)} → ${after[k].toFixed(0).padStart(5)} ms  (${(before[k] / Math.max(after[k], 0.1)).toFixed(1)}×)  ${k}`);
      }
      // Privacy checks as the member
      await run(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: me, role: 'authenticated' })]);
      await run('set local role authenticated');
      const tryq = async (label, sql) => { await run('savepoint s'); try { const r = await run(sql); console.log(`${label}: ${r.rows.length} row(s)`); } catch (e) { console.log(`${label}: blocked (${e.message.slice(0, 50)})`); await run('rollback to savepoint s'); } };
      console.log('\n── privacy, as a signed-in member ──');
      await tryq("read others' date of birth / gender", 'select gender, date_of_birth from profiles limit 3');
      await tryq("read others' name and photo", 'select id, display_name, avatar_url from profiles limit 3');
      await tryq('read my own full profile (my_profile)', 'select * from my_profile()');
      await tryq('list admins', 'select * from admin_roles');
      await run('reset role');
      await run('set local role anon');
      console.log('── privacy, signed out ──');
      await tryq('read profiles', 'select id from profiles limit 1');
      await tryq('read sessions', 'select id from events limit 1');
      await run('reset role');
    }
  } finally {
    await run('rollback');
    await c.end();
    console.log(`\nrolled back; total ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
