// Temporarily make the QA account an HQ admin (with two-step sign-in) to check the command center
// on localhost, then take it away again:
//   node scripts/qa/qa-admin.js on     → admin role + authenticator secret saved in admin/.env.qa.local
//   node scripts/qa/qa-admin.js code   → prints the current 6-digit code (for the local sign-in only)
//   node scripts/qa/qa-admin.js off    → admin role and authenticator removed
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('../../admin/node_modules/@supabase/supabase-js');

const read = (f) => Object.fromEntries(fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, '')]));
const env = read(path.join(__dirname, '../../admin/.env.local'));
const qaFile = path.join(__dirname, '../../admin/.env.qa.local');
const qa = read(qaFile);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function totp(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const ch of secret.replace(/=+$/, '').toUpperCase()) bits += alphabet.indexOf(ch).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = crypto.createHmac('sha1', key).update(counter).digest();
  const o = h[h.length - 1] & 15;
  return String(((h.readUInt32BE(o) & 0x7fffffff) % 1e6)).padStart(6, '0');
}

(async () => {
  const mode = process.argv[2];
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = list.users.find((u) => u.email === qa.QA_EMAIL);
  if (!user) throw new Error('Run make-qa-leader.js first');
  if (mode === 'code') return console.log(totp(qa.QA_TOTP));
  if (mode === 'off') {
    await admin.from('admin_roles').delete().eq('user_id', user.id);
    const { data: f } = await admin.auth.admin.mfa.listFactors({ userId: user.id });
    for (const x of f?.factors || []) await admin.auth.admin.mfa.deleteFactor({ userId: user.id, id: x.id });
    fs.writeFileSync(qaFile, fs.readFileSync(qaFile, 'utf8').replace(/^QA_TOTP=.*\n?/m, ''), { mode: 0o600 });
    return console.log('QA account is no longer an admin.');
  }
  const me = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { error: e1 } = await me.auth.signInWithPassword({ email: qa.QA_EMAIL, password: qa.QA_PASSWORD });
  if (e1) throw e1;
  const { data: en, error: e2 } = await me.auth.mfa.enroll({ factorType: 'totp', friendlyName: `qa-${Date.now()}` });
  if (e2) throw e2;
  const secret = en.totp.secret;
  const { error: e3 } = await me.auth.mfa.challengeAndVerify({ factorId: en.id, code: totp(secret) });
  if (e3) throw e3;
  await admin.from('admin_roles').upsert({ user_id: user.id, role: 'admin' }, { onConflict: 'user_id' });
  fs.writeFileSync(qaFile, fs.readFileSync(qaFile, 'utf8').replace(/^QA_TOTP=.*\n?/m, '') + `QA_TOTP=${secret}\n`, { mode: 0o600 });
  console.log('QA account is an HQ admin with two-step sign-in (secret saved locally).');
})().catch((e) => { console.error(e.message || e); process.exit(1); });
