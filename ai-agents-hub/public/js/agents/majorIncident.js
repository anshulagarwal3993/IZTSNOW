// Autonomous Major Incident Commander: declares the P1, opens the Teams war room, finds the suspect change,
// drives remediation through the Self-Healing agent, then writes the post-incident review and problem record.

import * as selfHeal from './selfHeal.js';

export const meta = {
  id: 'major-incident',
  name: 'Major Incident Commander',
  tagline: 'Runs a P1 end to end: war room, impact, comms, fix and post-incident review.',
  inputs: 'A P1 signal or "declare a major incident" from Copilot',
};

function pickTarget(store, text) {
  const t = text.toLowerCase();
  if (/pay|checkout|card/.test(t)) return store.ci('app-payapi');
  if (/vpn|remote/.test(t)) return store.ci('ci-vpngw01');
  if (/sap|finance/.test(t)) return store.ci('ci-sapapp03');
  if (/mail|outlook|exchange/.test(t)) return store.ci('ci-exch-conn');
  return store.ciByName(t) || store.ci('app-payapi');
}

function post(store, channel, from, text, kind = 'message') {
  return store.insert('teams_message', { channel, from, text, kind, at: new Date().toISOString() });
}

export async function run(ctx, input = {}) {
  const { store } = ctx;
  const text = input.text || 'Customers cannot complete online payments';
  let inc = input.incidentId ? store.get('incident', input.incidentId) : null;
  const ci = inc?.cmdb_ci ? store.ci(inc.cmdb_ci) : pickTarget(store, text);

  // Standalone demo: raise the outage signal the monitoring stack would send.
  if (ci.sys_id === 'app-payapi' && (ci.metrics?.error_rate ?? 0) < 5) {
    store.update('cmdb_ci', ci.sys_id, { metrics: { error_rate: 38.4, latency_ms: 2900, tls_handshake_fail: 412, service: 'degraded' } });
  }
  const m = store.ci(ci.sys_id).metrics || {};
  await ctx.step('tool', `Signal on ${ci.name}`, m.error_rate != null ? `error rate ${m.error_rate}%, p95 latency ${m.latency_ms} ms, ${m.tls_handshake_fail} TLS handshake failures/min` : 'service degraded');

  const services = ci.sys_class_name === 'cmdb_ci_service' ? [ci] : store.upstreamServices(ci.sys_id);
  const users = services.reduce((n, s) => n + (s.users || 0), 0);
  const infra = store.downstream(ci.sys_id);
  await ctx.step('tool', 'Impact analysis (CMDB service map)', `${services.map((s) => `${s.name} (${s.business_criticality})`).join(', ') || ci.name} · ~${users.toLocaleString()} users · depends on ${infra.map((c) => c.name).join(', ') || 'no mapped infrastructure'}`);

  const ok = await ctx.gate({
    action: 'Declare major incident',
    target: services[0]?.name || ci.name,
    risk: 'High',
    reason: text,
    details: [
      ['Service', services.map((s) => s.name).join(', ') || ci.name],
      ['Users affected', `~${users.toLocaleString()}`],
      ['Signal', m.error_rate != null ? `${m.error_rate}% errors` : 'degraded'],
    ],
  });
  if (!ok) return { title: 'Major incident not declared', summary: 'The P1 was not confirmed, so I left the signal with the owning group.', links: [] };

  if (inc) {
    store.update('incident', inc.sys_id, { priority: '1 - Critical', major_incident_state: 'Accepted' });
  } else {
    inc = store.insert('incident', {
      short_description: `P1: ${services[0]?.name || ci.name} degraded - ${text}`,
      description: text,
      caller_id: input.callerId || 'lena.fischer',
      priority: '1 - Critical',
      state: 'In Progress',
      major_incident_state: 'Accepted',
      contact_type: input.fromCopilot ? 'Copilot' : 'Event',
      cmdb_ci: ci.sys_id,
      assignment_group: 'grp-mim',
      assigned_to: 'AI Agent: Major Incident Commander',
      opened_at: new Date().toISOString(),
      work_notes: [],
      timeline: [],
    });
  }
  const tl = (e) => {
    const cur = store.get('incident', inc.sys_id);
    store.update('incident', inc.sys_id, { timeline: [...(cur.timeline || []), { at: new Date().toISOString(), text: e }] });
  };
  tl('Major incident declared');
  await ctx.step('action', `Declared ${inc.number} as major incident`, 'Priority 1 - Critical', { table: 'incident', sys_id: inc.sys_id });
  ctx.audit('declare major incident', inc.number, 'accepted', { minutesSaved: 15 });

  const channel = `mi-${inc.number.toLowerCase()}`;
  const groups = [...new Set([ci.support_group, ...infra.map((c) => c.support_group), 'grp-mim'].filter(Boolean))];
  const people = groups.map((g) => store.group(g)).filter(Boolean);
  post(store, channel, 'Major Incident Commander', `War room open for ${inc.number}: ${inc.short_description}`, 'system');
  for (const g of people) post(store, channel, 'Major Incident Commander', `Paged ${store.userName(g.on_call)} (on call, ${g.name})`, 'page');
  tl(`War room #${channel} opened; paged ${people.map((g) => store.userName(g.on_call)).join(', ')}`);
  await ctx.step('action', `Opened Teams war room #${channel}`, `Paged ${people.map((g) => `${store.userName(g.on_call)} (${g.name})`).join(', ')}`);
  ctx.audit('open war room', channel, 'opened', { minutesSaved: 20 });

  const execNote = `${services[0]?.name || ci.name} is degraded (${m.error_rate ?? '?'}% of requests failing). About ${users.toLocaleString()} users are affected. The war room is working on it; next update in 30 minutes.`;
  const userNote = `We are aware that some ${services[0]?.name || ci.name} requests are failing. Our teams are working on a fix. Please retry in a few minutes. We will post an update by ${new Date(Date.now() + 30 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
  post(store, channel, 'Major Incident Commander', `Draft executive update for ${store.userName('daniel.ortiz')}: ${execNote}`, 'comms');
  post(store, channel, 'Major Incident Commander', `Draft status page notice: ${userNote}`, 'comms');
  store.update('incident', inc.sys_id, { comms: { executive: execNote, end_user: userNote } });
  tl('Executive and customer communications drafted');
  await ctx.step('action', 'Drafted stakeholder communications', 'Executive update and status-page notice posted to the war room for approval');

  // Correlate: most recent change on the service's infrastructure in the last 24 hours.
  const scope = new Set([ci.sys_id, ...infra.map((c) => c.sys_id)]);
  const dayAgo = Date.now() - 24 * 3600000;
  const suspects = store
    .query('change_request', (c) => (scope.has(c.cmdb_ci) || (c.affected_cis || []).some((id) => scope.has(id))) && c.end_date && new Date(c.end_date).getTime() > dayAgo && new Date(c.end_date).getTime() <= Date.now())
    .sort((a, b) => new Date(b.end_date) - new Date(a.end_date));
  const suspect = suspects[0];
  if (suspect) {
    const mins = Math.round((Date.now() - new Date(suspect.end_date).getTime()) / 60000);
    await ctx.step('insight', `Suspect change: ${suspect.number}`, `${suspect.short_description}, finished ${mins < 120 ? `${mins} min` : `${Math.round(mins / 60)} h`} before the error spike. TLS handshake failures point at the web tier.`, { table: 'change_request', sys_id: suspect.sys_id });
    post(store, channel, 'Major Incident Commander', `Likely cause: ${suspect.number} (${suspect.short_description}). Proposing rollback.`);
    tl(`Suspect change identified: ${suspect.number}`);
  } else {
    await ctx.step('think', 'No change in the last 24 h; checking known fixes');
  }

  const fix = await ctx.delegate('Self-Healing Remediation', selfHeal.run, {
    incidentId: inc.sys_id,
    runbookId: 'rb-rollback',
    cause: suspect && { by: 'Major Incident Commander', number: suspect.number, text: suspect.short_description },
  });

  const after = store.get('incident', inc.sys_id);
  if (after.state !== 'Resolved') {
    post(store, channel, 'Major Incident Commander', 'Automated rollback not approved. Engineers own the fix; I will keep posting updates.');
    return { title: `${inc.number} war room running`, summary: 'The war room is open and people are paged. The automated fix was not approved, so engineers are on it.', links: [inc] };
  }

  tl('Service restored by rollback; monitoring');
  if (suspect) store.update('change_request', suspect.sys_id, { close_code: 'Unsuccessful', caused_incident: inc.number });
  post(store, channel, 'Major Incident Commander', `Resolved: ${services[0]?.name || ci.name} is healthy again. Error rate back to ${store.ci(ci.sys_id).metrics?.error_rate ?? 0}%.`, 'system');
  store.update('incident', inc.sys_id, { major_incident_state: 'Completed' });

  const prb = store.insert('problem', {
    short_description: `Root cause: ${suspect ? suspect.short_description : 'under investigation'} broke ${services[0]?.name || ci.name}`,
    state: 'Root Cause Analysis',
    first_reported_by_task: inc.number,
    cmdb_ci: ci.sys_id,
    assignment_group: ci.support_group,
    cause_notes: suspect ? `${suspect.number} changed the TLS stack on the web tier. Clients using session resumption failed the handshake.` : '',
  });
  const pir = [
    `Summary: ${inc.short_description}`,
    `Impact: ~${users.toLocaleString()} users, ${services.map((s) => s.name).join(', ')}`,
    `Detection: monitoring signal, ${m.error_rate}% errors`,
    `Cause: ${suspect ? `${suspect.number} ${suspect.short_description}` : 'unknown'}`,
    'Resolution: automated rollback, verified healthy',
    'Actions: add a TLS session-resumption check to the change test plan; require a canary for web-tier TLS changes',
  ];
  store.update('incident', inc.sys_id, { post_incident_review: pir });
  tl(`Problem ${prb.number} opened; post-incident review drafted`);
  await ctx.step('action', `Opened ${prb.number} and drafted the post-incident review`, pir.join('\n'), { table: 'problem', sys_id: prb.sys_id });
  ctx.audit('open problem', prb.number, 'created', { minutesSaved: 30 });
  ctx.audit('draft post-incident review', inc.number, 'drafted', { minutesSaved: 90 });

  return {
    title: `${inc.number} resolved`,
    summary: `War room opened, ${people.length} teams paged, cause traced to ${suspect?.number || 'an unknown change'}, rolled back and verified. Problem ${prb.number} and the post-incident review are ready.`,
    links: [inc, suspect, prb, ...(fix.links || []).filter((l) => l.number?.startsWith('KB'))].filter(Boolean),
    incident: inc,
    channel,
  };
}
