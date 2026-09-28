// Vulnerability-to-Patch Agent: CVE -> affected CIs -> prioritised vulnerable items -> risk-scored, scheduled change.

import { assessChangeRisk } from './changeRisk.js';
import { fmtTime } from '../engine.js';

export const meta = {
  id: 'vuln-patch',
  name: 'Vulnerability-to-Patch',
  tagline: 'Turns a new CVE into ranked vulnerable items and a scheduled, risk-scored patch change.',
  inputs: 'A CVE from the security feed',
};

const cmpVer = (a, b) => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
};

const CRIT = { '1 - most critical': 1.0, '2 - somewhat critical': 0.8, '3 - less critical': 0.6, '4 - not critical': 0.4 };
const ENV = { Production: 1.0, Test: 0.5, Development: 0.4 };

export async function run(ctx, input = {}) {
  const { store } = ctx;
  const feed = store.all('vulnerability_feed');
  const cve = feed.find((v) => v.id === input.cve) || feed[0];
  await ctx.step('tool', `Security feed: ${cve.id}`, `${cve.title}. CVSS ${cve.cvss}${cve.exploited ? ', known exploited' : ''}. Fixed in ${cve.package} ${cve.fixed_in}.`);

  const hits = [];
  for (const ci of store.all('cmdb_ci')) {
    if (ci.operational_status !== 'Operational') continue;
    const sw = (ci.software || []).find((s) => s.name === cve.package);
    if (sw && cmpVer(sw.version, cve.affected[0]) >= 0 && cmpVer(sw.version, cve.affected[1]) <= 0) hits.push({ ci, version: sw.version });
  }
  await ctx.step('tool', `CMDB software scan: ${hits.length} affected CIs`, hits.map((h) => `${h.ci.name} (${cve.package} ${h.version})`).join(', '));

  for (const h of hits) {
    const exposure = h.ci.internet_facing ? 1.5 : 1.0;
    h.score = Math.round(cve.cvss * exposure * (CRIT[h.ci.business_criticality] ?? 0.6) * (ENV[h.ci.environment] ?? 0.5) * 10) / 10;
  }
  hits.sort((a, b) => b.score - a.score);
  await ctx.step('think', 'Ranked by exposure', 'score = CVSS x internet exposure x business criticality x environment', {
    table: hits.map((h) => ({ CI: h.ci.name, Env: h.ci.environment, 'Internet-facing': h.ci.internet_facing ? 'yes' : 'no', Score: h.score })),
  });

  const vits = hits.map((h) =>
    store.insert('sn_vul_vulnerable_item', {
      vulnerability: cve.id,
      cmdb_ci: h.ci.sys_id,
      risk_score: h.score,
      state: 'Open',
      assignment_group: h.ci.support_group || 'grp-secops',
      remediation: `Upgrade ${cve.package} ${h.version} -> ${cve.fixed_in}`,
    }),
  );
  await ctx.step('action', `Created ${vits.length} vulnerable items`, vits.map((v) => v.number).join(', '));
  ctx.audit('create vulnerable items', cve.id, `${vits.length} created`, { minutesSaved: 15 * vits.length });

  // Patch the production, business-critical group first; lower tiers go to a standard change.
  const urgent = hits.filter((h) => h.ci.environment === 'Production' && h.score >= 9);
  const later = hits.filter((h) => !urgent.includes(h));
  const windows = store.all('maintenance_window').slice().sort((a, b) => new Date(a.start) - new Date(b.start));
  const plan = { backoutPlan: `Roll back ${cve.package} with dnf history undo; restart nginx`, testPlan: 'Synthetic payment + TLS handshake test from both regions' };

  let chosen = null;
  let risk = null;
  for (const w of windows) {
    const r = assessChangeRisk(store, { cis: urgent.map((h) => h.ci), window: w, ...plan });
    await ctx.step(r.conflicts.length ? 'warn' : 'tool', `Change Risk Assessment: ${w.name}`, `${fmtTime(w.start)} · score ${r.score} (${r.level})${r.conflicts.length ? ` · conflicts with ${r.conflicts.map((c) => c.number).join(', ')}` : ''}`);
    if (!r.conflicts.length) {
      chosen = w;
      risk = r;
      break;
    }
  }
  if (!chosen) {
    chosen = windows[0];
    risk = assessChangeRisk(store, { cis: urgent.map((h) => h.ci), window: chosen, ...plan });
  }
  await ctx.step('think', `Risk factors (${risk.level}, ${risk.score}/100)`, '', {
    table: risk.factors.map((f) => ({ Factor: f.label, Points: f.points > 0 ? `+${f.points}` : String(f.points), Evidence: f.note })),
  });

  const ok = await ctx.gate({
    action: `Schedule emergency patch for ${urgent.length} CIs`,
    target: urgent.map((h) => h.ci.name).join(', '),
    risk: risk.level === 'Low' ? 'Medium' : risk.level,
    reason: `${cve.id} (CVSS ${cve.cvss}) on internet-facing production servers`,
    details: [
      ['Window', `${chosen.name}, ${fmtTime(chosen.start)}`],
      ['Risk', `${risk.level} (${risk.score}/100)`],
      ['Backout', plan.backoutPlan],
      ['Test', plan.testPlan],
    ],
  });

  const changes = [];
  if (ok && urgent.length) {
    const chg = store.insert('change_request', {
      short_description: `Emergency patch ${cve.package} ${cve.fixed_in} for ${cve.id}`,
      type: 'Emergency',
      state: 'Scheduled',
      cmdb_ci: urgent[0].ci.sys_id,
      affected_cis: urgent.map((h) => h.ci.sys_id),
      assignment_group: urgent[0].ci.support_group,
      risk: risk.level,
      risk_score: risk.score,
      start_date: chosen.start,
      end_date: new Date(new Date(chosen.start).getTime() + 2 * 3600000).toISOString(),
      backout_plan: plan.backoutPlan,
      test_plan: plan.testPlan,
      vulnerable_items: vits.filter((v) => urgent.some((h) => h.ci.sys_id === v.cmdb_ci)).map((v) => v.number),
    });
    changes.push(chg);
    await ctx.step('action', `Created ${chg.number} (Emergency)`, `Scheduled ${fmtTime(chg.start_date)}`, { table: 'change_request', sys_id: chg.sys_id });
    ctx.audit('create change', chg.number, 'scheduled', { minutesSaved: 60 });
  }
  if (later.length) {
    const std = store.insert('change_request', {
      short_description: `Standard patch ${cve.package} ${cve.fixed_in} (non-critical tier)`,
      type: 'Standard',
      state: 'Scheduled',
      cmdb_ci: later[0].ci.sys_id,
      affected_cis: later.map((h) => h.ci.sys_id),
      assignment_group: later[0].ci.support_group || 'grp-linux',
      risk: 'Low',
      start_date: windows[windows.length - 1].start,
      end_date: windows[windows.length - 1].end,
      backout_plan: plan.backoutPlan,
      test_plan: 'Standard change template STD-LNX-PATCH',
    });
    changes.push(std);
    await ctx.step('action', `Created ${std.number} (Standard, pre-approved)`, later.map((h) => h.ci.name).join(', '), { table: 'change_request', sys_id: std.sys_id });
    ctx.audit('create change', std.number, 'scheduled', { approval: 'policy', minutesSaved: 30 });
  }

  return {
    title: `${cve.id}: ${hits.length} CIs affected, ${changes.length} change${changes.length === 1 ? '' : 's'} scheduled`,
    summary: ok
      ? `The top risk is ${urgent.map((h) => h.ci.name).join(' and ')}. Emergency patch is booked for ${chosen.name.toLowerCase()} with ${risk.level.toLowerCase()} risk.`
      : 'The emergency change was not approved. Vulnerable items stay open with Security Operations.',
    links: [...changes],
    change: changes[0],
    urgentCis: urgent.map((h) => h.ci),
  };
}
