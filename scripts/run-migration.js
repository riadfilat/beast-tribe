// Direct Postgres migration runner — bypasses the flaky Supabase PAT.
// Usage: node scripts/run-migration.js <sqlFile1> [sqlFile2 ...]
const fs = require('fs');
const { Client } = require('pg');

// Connection string MUST be supplied via the PG_URL env var — never hardcode the
// password in the repo. See ~/.claude memory for the working connection string.
if (!process.env.PG_URL) {
  console.error('Set PG_URL env var to the Postgres connection string (see local memory).');
  process.exit(1);
}
const CANDIDATES = [process.env.PG_URL];
const PASSWORD = (process.env.PG_URL.match(/:([^:@]+)@/) || [])[1] || '';

async function tryConnect(url) {
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
  await client.connect();
  return client;
}

(async () => {
  const files = process.argv.slice(2);
  let client = null;
  let usedUrl = null;
  for (const url of CANDIDATES) {
    try {
      client = await tryConnect(url);
      usedUrl = url;
      break;
    } catch (e) {
      console.error(`  ✗ ${url.replace(PASSWORD, '****').slice(0, 70)}... -> ${e.message}`);
    }
  }
  if (!client) {
    console.error('\nCOULD_NOT_CONNECT: none of the candidate hosts worked. Need the exact pooler host/region.');
    process.exit(2);
  }
  console.log(`\nCONNECTED via: ${usedUrl.replace(PASSWORD, '****')}\n`);

  if (files.length === 0) {
    // Just a connectivity test
    const r = await client.query('select current_database() db, now() ts');
    console.log('PING OK:', JSON.stringify(r.rows[0]));
    await client.end();
    return;
  }

  for (const f of files) {
    const sql = fs.readFileSync(f, 'utf8');
    console.log(`--- Applying ${f} ---`);
    try {
      await client.query(sql);
      console.log(`    ✓ ${f} applied`);
    } catch (e) {
      console.error(`    ✗ ${f} FAILED: ${e.message}`);
    }
  }
  await client.end();
  console.log('\nDONE');
})();
