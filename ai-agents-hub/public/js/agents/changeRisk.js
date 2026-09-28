// Change Risk Assessment (last year's agent), reused as a tool by the new agents.

const CRIT_WEIGHT = { '1 - most critical': 30, '2 - somewhat critical': 20, '3 - less critical': 10, '4 - not critical': 0 };

export function assessChangeRisk(store, { cis, window, backoutPlan, testPlan }) {
  const factors = [];
  const add = (label, points, note) => factors.push({ label, points, note });

  const topCrit = Math.max(0, ...cis.map((c) => CRIT_WEIGHT[c.business_criticality] ?? 10));
  add('CI business criticality', topCrit, cis.map((c) => c.name).join(', '));

  const users = new Set();
  for (const c of cis) for (const s of store.upstreamServices(c.sys_id)) users.add(s);
  const affectedUsers = [...users].reduce((n, s) => n + (s.users || 0), 0);
  add('Users on impacted services', affectedUsers > 10000 ? 20 : affectedUsers > 1000 ? 10 : 0, `${affectedUsers.toLocaleString()} users (${[...users].map((s) => s.name).join(', ') || 'none mapped'})`);

  // The CIs themselves plus anything that directly runs on or uses them.
  const nearby = new Set(cis.flatMap((c) => [c.sys_id, ...store.query('cmdb_rel_ci', (r) => r.child === c.sys_id).map((r) => r.parent)]));
  const failed = store.query('change_request', (c) => c.close_code === 'Unsuccessful' && nearby.has(c.cmdb_ci));
  add('Failed changes on these CIs (90 days)', failed.length * 10, failed.map((c) => c.number).join(', ') || 'none');

  const start = new Date(window.start).getTime();
  const end = new Date(window.end).getTime();
  const related = new Set(cis.flatMap((c) => [c.sys_id, ...store.upstreamServices(c.sys_id).flatMap((s) => store.downstream(s.sys_id).map((d) => d.sys_id))]));
  const conflicts = store.query('change_request', (c) => c.state === 'Scheduled' && related.has(c.cmdb_ci) && new Date(c.start_date).getTime() < end && new Date(c.end_date).getTime() > start);
  add('Schedule conflicts', conflicts.length * 15, conflicts.map((c) => `${c.number} ${c.short_description}`).join('; ') || 'none');

  add('Backout plan', backoutPlan ? -5 : 15, backoutPlan ? 'present' : 'missing');
  add('Test plan', testPlan ? -5 : 10, testPlan ? 'present' : 'missing');

  const score = Math.max(0, Math.min(100, factors.reduce((n, f) => n + f.points, 0)));
  const level = score >= 60 ? 'High' : score >= 30 ? 'Moderate' : 'Low';
  return { score, level, factors, conflicts };
}
