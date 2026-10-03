// How many phones installed an update, per platform. Usage: EXPO_TOKEN=… node scripts/release/installs.js <group-id> [...]
// Without group ids it shows the latest 5 update groups on the production branch.
const gql = async (query, variables) =>
  (await (await fetch('https://api.expo.dev/graphql', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.EXPO_TOKEN}` }, body: JSON.stringify({ query, variables }) })).json());

const PROJECT = 'b9a69ad8-8fff-4877-a53b-3c9162c431b7';

(async () => {
  if (!process.env.EXPO_TOKEN) throw new Error('Set EXPO_TOKEN');
  let groups = process.argv.slice(2);
  if (!groups.length) {
    const j = await gql(
      `query($id: String!) { app { byId(appId: $id) { updateBranchByName(name: "production") { updates(offset: 0, limit: 20) { group } } } } }`,
      { id: PROJECT },
    );
    groups = [...new Set((j.data?.app?.byId?.updateBranchByName?.updates || []).map((u) => u.group))].slice(0, 5);
  }
  const s = new Date(Date.now() - 14 * 86400000).toISOString();
  const e = new Date().toISOString();
  for (const g of groups) {
    const j = await gql(
      `query($g: ID!, $s: DateTime!, $e: DateTime!) { updatesByGroup(group: $g) { group platform message runtimeVersion createdAt insights { totalUniqueUsers(timespan: {start: $s, end: $e}) cumulativeMetrics(timespan: {start: $s, end: $e}) { metricsAtLastTimestamp { totalInstalls totalFailedInstalls } } } } }`,
      { g, s, e },
    );
    if (!j.data) {
      console.log(JSON.stringify(j).slice(0, 300));
      continue;
    }
    for (const u of j.data.updatesByGroup) {
      const m = u.insights.cumulativeMetrics.metricsAtLastTimestamp;
      console.log(`${u.group.slice(0, 8)} ${u.platform.padEnd(7)} runtime ${u.runtimeVersion.slice(0, 8)} ${u.createdAt.slice(5, 16)} installs=${m.totalInstalls} failed=${m.totalFailedInstalls} | ${(u.message || '').slice(0, 50)}`);
    }
  }
})();
