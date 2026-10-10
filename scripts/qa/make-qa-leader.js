// A test leader for checking the leader dashboard on localhost: one QA account and one private
// "QA · Test club" community it leads. The login is written to admin/.env.qa.local (git-ignored),
// never printed. Remove everything with: node scripts/qa/make-qa-leader.js --remove
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('../../admin/node_modules/@supabase/supabase-js');

const envFile = path.join(__dirname, '../../admin/.env.local');
const env = Object.fromEntries(fs.readFileSync(envFile, 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, '')]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const EMAIL = 'qa-leader@beast-tribe.test';
const NAME = 'QA · Test club';
const out = path.join(__dirname, '../../admin/.env.qa.local');

(async () => {
  const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
  const existing = list.users.find((u) => u.email === EMAIL);
  const { data: comm } = await db.from('communities').select('id').eq('name', NAME).maybeSingle();
  if (process.argv.includes('--remove')) {
    if (comm) await db.from('communities').delete().eq('id', comm.id);
    if (existing) await db.auth.admin.deleteUser(existing.id);
    if (fs.existsSync(out)) fs.unlinkSync(out);
    console.log('QA leader and test club removed.');
    return;
  }
  const password = crypto.randomBytes(18).toString('base64url');
  let userId = existing?.id;
  if (userId) await db.auth.admin.updateUserById(userId, { password });
  else {
    const { data, error } = await db.auth.admin.createUser({ email: EMAIL, password, email_confirm: true, user_metadata: { full_name: 'QA Leader' } });
    if (error) throw error;
    userId = data.user.id;
  }
  let communityId = comm?.id;
  if (!communityId) {
    const { data, error } = await db.from('communities').insert({ name: NAME, slug: `qa-test-club-${Date.now()}`, city: 'Riyadh', kind: 'club', visibility: 'private', is_active: true, description: 'Test community for checking the dashboard. Safe to delete.' }).select('id').single();
    if (error) throw error;
    communityId = data.id;
  }
  await db.from('community_members').upsert({ community_id: communityId, user_id: userId, role: 'admin' }, { onConflict: 'community_id,user_id' });
  fs.writeFileSync(out, `QA_EMAIL=${EMAIL}\nQA_PASSWORD=${password}\nQA_COMMUNITY=${communityId}\n`, { mode: 0o600 });
  console.log(`QA leader ready for community ${communityId}. Login saved to admin/.env.qa.local.`);
})().catch((e) => { console.error(e.message); process.exit(1); });
