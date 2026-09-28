// Self-Healing Remediation Agent: incident -> diagnose -> runbook -> (approval) -> fix -> verify -> resolve.

export const meta = {
  id: 'self-heal',
  name: 'Self-Healing Remediation',
  tagline: 'Diagnoses an incident, runs the matching runbook and resolves it.',
  inputs: 'An incident, or a user complaint from the Copilot channel',
};

const VPN_WORDS = /vpn|tunnel|remote access|globalprotect/i;
const DISK_WORDS = /disk|space|drive|storage/i;

function pickCi(store, text) {
  const named = store.ciByName(text);
  if (named) return named;
  if (VPN_WORDS.test(text)) return store.ci('ci-vpngw01');
  if (DISK_WORDS.test(text) && /sap/i.test(text)) return store.ci('ci-sapapp03');
  if (/payment/i.test(text)) return store.ci('app-payapi');
  return null;
}

function matchRunbook(store, ci, text) {
  const words = text.toLowerCase();
  let best = null;
  for (const rb of store.all('runbook')) {
    if (!rb.classes.includes(ci.sys_class_name)) continue;
    const score = rb.match.filter((m) => words.includes(m)).length;
    if (score > 0 && (!best || score > best.score)) best = { rb, score };
  }
  return best?.rb || null;
}

function describeHealth(ci) {
  const m = ci.metrics || {};
  const parts = [];
  if (m.disk != null) parts.push(`disk ${m.disk}%`);
  if (m.cpu != null) parts.push(`CPU ${m.cpu}%`);
  if (m.tunnel_flaps_1h != null) parts.push(`${m.tunnel_flaps_1h} tunnel flaps in the last hour`);
  if (m.error_rate != null) parts.push(`error rate ${m.error_rate}%`);
  if (m.tls_handshake_fail) parts.push(`${m.tls_handshake_fail} TLS handshake failures/min`);
  if (m.service) parts.push(`service ${m.service}`);
  return parts.join(', ') || 'no telemetry';
}

export async function run(ctx, input = {}) {
  const { store } = ctx;
  let inc = input.incidentId ? store.get('incident', input.incidentId) : null;
  const text = inc ? `${inc.short_description} ${inc.description || ''}` : input.text || '';

  if (inc) {
    await ctx.step('tool', `Read ${inc.number}`, inc.short_description, { table: 'incident', sys_id: inc.sys_id });
  } else {
    await ctx.step('think', 'Understanding the request', `"${input.text}"`);
    const ci = pickCi(store, text);
    inc = ci && store.find('incident', (i) => i.cmdb_ci === ci.sys_id && !['Resolved', 'Closed'].includes(i.state));
    if (inc) {
      await ctx.step('tool', `Found open ${inc.number} for ${ci.name}`, inc.short_description, { table: 'incident', sys_id: inc.sys_id });
    } else {
      inc = store.insert('incident', {
        short_description: input.text.length > 80 ? input.text.slice(0, 77) + '...' : input.text,
        description: `Raised from Microsoft Copilot by ${store.userName(input.callerId || 'riya.sharma')}.`,
        caller_id: input.callerId || 'riya.sharma',
        priority: '3 - Moderate',
        state: 'New',
        contact_type: 'Copilot',
        cmdb_ci: ci?.sys_id || '',
        assignment_group: ci?.support_group || 'grp-servicedesk',
        opened_at: new Date().toISOString(),
        work_notes: [],
      });
      await ctx.step('action', `Created ${inc.number}`, inc.short_description, { table: 'incident', sys_id: inc.sys_id });
    }
  }

  store.update('incident', inc.sys_id, { state: 'In Progress', assigned_to: 'AI Agent: Self-Healing' });

  let ci = inc.cmdb_ci ? store.ci(inc.cmdb_ci) : pickCi(store, text);
  if (!ci) {
    await ctx.step('warn', 'No configuration item identified', 'Routing to the Service Desk with a summary.');
    store.update('incident', inc.sys_id, { assignment_group: 'grp-servicedesk', assigned_to: '' });
    store.addWorkNote('incident', inc.sys_id, 'AI Agent', 'Could not map this issue to a CI. Routed to Service Desk.');
    ctx.audit('route to human', inc.number, 'routed');
    return { title: `${inc.number} routed to Service Desk`, summary: 'I could not match this to a system I can fix, so a person will pick it up.', links: [inc] };
  }
  if (!inc.cmdb_ci) store.update('incident', inc.sys_id, { cmdb_ci: ci.sys_id });

  const services = store.upstreamServices(ci.sys_id);
  await ctx.step('tool', `CMDB: ${ci.name}`, `${ci.sys_class_name} · ${ci.environment} · supports ${services.map((s) => s.name).join(', ') || 'no mapped service'}`);
  await ctx.step('tool', 'Telemetry', describeHealth(ci));

  const since = Date.now() - 72 * 3600000;
  const recent = store.query('change_request', (c) => c.cmdb_ci === ci.sys_id && new Date(c.end_date || c.start_date).getTime() > since && new Date(c.start_date).getTime() < Date.now());
  if (input.cause) {
    await ctx.step('insight', `Cause from ${input.cause.by}: ${input.cause.number}`, input.cause.text);
  } else if (recent.length) {
    await ctx.step('insight', `Correlated with ${recent[0].number}`, `${recent[0].short_description} finished ${Math.round((Date.now() - new Date(recent[0].end_date).getTime()) / 3600000)}h before symptoms began.`);
  } else {
    await ctx.step('think', 'No recent changes on this CI');
  }

  const rb = input.runbookId ? store.get('runbook', input.runbookId) : matchRunbook(store, ci, text + ' ' + (input.hint || ''));
  if (!rb) {
    await ctx.step('warn', 'No catalogued runbook matches', `Assigning to ${store.group(ci.support_group)?.name}`);
    store.update('incident', inc.sys_id, { assigned_to: '', assignment_group: ci.support_group });
    store.addWorkNote('incident', inc.sys_id, 'AI Agent', `Diagnosis: ${describeHealth(ci)}. No automated fix available.`);
    ctx.audit('route to human', inc.number, 'routed');
    return { title: `${inc.number} assigned to ${store.group(ci.support_group)?.name}`, summary: 'No safe automated fix exists for this. I added my diagnosis to the ticket.', links: [inc] };
  }
  await ctx.step('think', `Selected runbook: ${rb.name}`, `Risk ${rb.risk}. ${rb.commands.length} steps.`);

  const ok = await ctx.gate({
    action: rb.name,
    target: ci.name,
    risk: rb.risk,
    environment: ci.environment,
    reason: `Fix ${inc.number}: ${inc.short_description}`,
    details: [
      ['Incident', inc.number],
      ['Configuration item', `${ci.name} (${ci.environment})`],
      ['Diagnosis', describeHealth(ci)],
      recent.length ? ['Related change', `${recent[0].number} ${recent[0].short_description}`] : null,
      ['Commands', rb.commands.join('\n')],
    ].filter(Boolean),
  });

  if (!ok) {
    store.update('incident', inc.sys_id, { assigned_to: '', assignment_group: ci.support_group });
    store.addWorkNote('incident', inc.sys_id, 'AI Agent', `Fix "${rb.name}" was proposed and rejected. Diagnosis: ${describeHealth(ci)}.`);
    return { title: `${inc.number} handed to ${store.group(ci.support_group)?.name}`, summary: 'The fix was not approved, so the incident went to the support group with my diagnosis attached.', links: [inc] };
  }

  for (const cmd of rb.commands) await ctx.step('exec', cmd, '', null);
  const newMetrics = { ...(ci.metrics || {}), ...rb.effect };
  store.update('cmdb_ci', ci.sys_id, { metrics: newMetrics });
  if (input.afterFix) await input.afterFix(ctx, ci);
  const fresh = store.ci(ci.sys_id);
  await ctx.step('ok', 'Verified healthy', describeHealth(fresh));

  store.addWorkNote('incident', inc.sys_id, 'AI Agent', `Ran "${rb.name}" on ${ci.name}. Before: ${describeHealth(ci)}. After: ${describeHealth(fresh)}.`);
  store.update('incident', inc.sys_id, {
    state: 'Resolved',
    close_code: 'Solved (Automated)',
    close_notes: `Resolved by the Self-Healing agent using "${rb.name}".`,
    resolved_at: new Date().toISOString(),
  });
  await ctx.step('action', `Resolved ${inc.number}`, 'Close code: Solved (Automated)', { table: 'incident', sys_id: inc.sys_id });
  ctx.audit(`run runbook: ${rb.name}`, ci.name, 'success', { minutesSaved: 45 });
  ctx.audit('resolve incident', inc.number, 'resolved', { minutesSaved: 10 });

  let kb = null;
  if (!rb.kb) {
    kb = store.insert('kb_knowledge', {
      short_description: `${ci.sys_class_name === 'cmdb_ci_ip_firewall' ? 'VPN drops' : 'Automated fix'}: ${rb.name}`,
      workflow_state: 'Draft',
      author: 'AI Agent',
      text: `Symptoms: ${inc.short_description}. Cause indicators: ${describeHealth(ci)}. Fix: ${rb.commands.join('; ')}.`,
    });
    await ctx.step('action', `Drafted ${kb.number} for review`, kb.short_description, { table: 'kb_knowledge', sys_id: kb.sys_id });
    ctx.audit('draft knowledge', kb.number, 'draft', { minutesSaved: 20 });
  }

  return {
    title: `${inc.number} resolved automatically`,
    summary: `I found ${describeHealth(ci)} on ${ci.name}, ran "${rb.name}" and confirmed it is healthy again.`,
    links: [inc, kb].filter(Boolean),
    incident: inc,
  };
}
