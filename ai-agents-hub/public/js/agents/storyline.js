// Forum storyline: one CVE travels through every agent.
// CVE -> patch change -> patch breaks payments -> major incident -> rollback -> post-incident review.

import * as vulnPatch from './vulnPatch.js';
import * as majorIncident from './majorIncident.js';

export const meta = {
  id: 'storyline',
  name: 'Forum Storyline',
  tagline: 'One CVE travels through every agent, from patch to P1 to post-incident review.',
  inputs: 'Nothing; press run',
};

export async function run(ctx) {
  const { store } = ctx;
  await ctx.step('think', 'Act 1: a critical CVE lands in the security feed');
  const patch = await ctx.delegate('Vulnerability-to-Patch', vulnPatch.run, {});
  if (!patch.change) {
    return { title: 'Storyline stopped at Act 1', summary: 'The emergency change was not approved, so nothing was patched.', links: patch.links };
  }

  await ctx.step('think', 'Act 2: the maintenance window arrives', 'Fast-forwarding the clock to implement the change');
  const start = new Date(Date.now() - 40 * 60000).toISOString();
  const end = new Date(Date.now() - 12 * 60000).toISOString();
  store.update('change_request', patch.change.sys_id, { state: 'Implement', start_date: start, end_date: end });
  for (const ci of patch.urgentCis) {
    store.update('cmdb_ci', ci.sys_id, { software: ci.software.map((s) => (s.name === 'OpenSSL' ? { ...s, version: '3.0.16' } : s)) });
  }
  await ctx.step('action', `${patch.change.number} implemented`, 'OpenSSL upgraded on the payments web tier', { table: 'change_request', sys_id: patch.change.sys_id });
  store.update('cmdb_ci', 'app-payapi', { metrics: { error_rate: 41.7, latency_ms: 3100, tls_handshake_fail: 468, service: 'degraded' } });
  await ctx.step('warn', 'Monitoring: payments-api error rate 41.7%', 'TLS handshake failures from mobile clients started 10 minutes after the patch');

  await ctx.step('think', 'Act 3: the P1');
  const mi = await ctx.delegate('Major Incident Commander', majorIncident.run, { text: 'Customers cannot complete card payments after the patch' });

  if (mi.incident && store.get('incident', mi.incident.sys_id).state === 'Resolved') {
    store.update('change_request', patch.change.sys_id, { state: 'Review', close_code: 'Unsuccessful' });
    await ctx.step('ok', 'Act 4: learning', `${patch.change.number} set to Review. The Control Tower has the full audit trail.`);
  }
  return {
    title: 'Storyline complete',
    summary: `${patch.title}. ${mi.summary}`,
    links: [...(patch.links || []), ...(mi.links || [])],
  };
}
