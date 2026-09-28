// CMDB Health & Data Steward Agent: scores completeness, correctness and compliance, then fixes what it can.

export const meta = {
  id: 'cmdb-health',
  name: 'CMDB Health Steward',
  tagline: 'Finds duplicate, stale, ownerless and orphaned CIs and repairs them with approval.',
  inputs: 'Runs on demand or nightly',
};

const STALE_DAYS = 60;

function audit(store) {
  const cis = store.query('cmdb_ci', (c) => c.operational_status === 'Operational');
  const findings = [];
  const bySerial = new Map();
  for (const c of cis) {
    if (!c.serial_number) continue;
    if (bySerial.has(c.serial_number)) {
      const keep = bySerial.get(c.serial_number);
      const [primary, dup] = new Date(keep.last_discovered) >= new Date(c.last_discovered) ? [keep, c] : [c, keep];
      findings.push({ kind: 'Duplicate', ci: dup, fix: `Merge into ${primary.name} (same serial ${c.serial_number})`, apply: () => store.update('cmdb_ci', dup.sys_id, { operational_status: 'Retired', duplicate_of: primary.sys_id }) });
    } else bySerial.set(c.serial_number, c);
  }
  const dupIds = new Set(findings.map((f) => f.ci.sys_id));
  const related = new Set(store.all('cmdb_rel_ci').flatMap((r) => [r.parent, r.child]));

  for (const c of cis) {
    if (dupIds.has(c.sys_id)) continue;
    const age = Math.round((Date.now() - new Date(c.last_discovered).getTime()) / 86400000);
    if (age > STALE_DAYS) {
      findings.push({ kind: 'Stale', ci: c, fix: `Not discovered for ${age} days. Retire`, apply: () => store.update('cmdb_ci', c.sys_id, { operational_status: 'Retired' }) });
      continue;
    }
    if (!c.support_group) {
      const guess = c.sys_class_name.includes('win') ? 'grp-windows' : c.sys_class_name.includes('linux') ? 'grp-linux' : 'grp-servicedesk';
      findings.push({ kind: 'Missing support group', ci: c, fix: `Set to ${store.group(guess).name} (class default)`, apply: () => store.update('cmdb_ci', c.sys_id, { support_group: guess }) });
    }
    if (!c.owned_by) {
      const grp = store.group(c.support_group || (c.sys_class_name.includes('linux') ? 'grp-linux' : 'grp-servicedesk'));
      findings.push({ kind: 'Missing owner', ci: c, fix: `Set to ${store.userName(grp.manager)} (${grp.name} manager)`, apply: () => store.update('cmdb_ci', c.sys_id, { owned_by: grp.manager }) });
    }
    if (c.sys_class_name !== 'cmdb_ci_service' && !related.has(c.sys_id)) {
      // Infer a relationship from naming conventions (lnx-hr-* -> HR Portal).
      const svc = /-hr-/.test(c.name) ? 'svc-hr' : null;
      if (svc) findings.push({ kind: 'Orphan', ci: c, fix: `Relate to ${store.ci(svc).name} (name pattern)`, apply: () => store.insert('cmdb_rel_ci', { parent: svc, child: c.sys_id, type: 'Depends on::Used by' }) });
      else findings.push({ kind: 'Orphan', ci: c, fix: 'No service found. Flag for owner review', apply: () => store.update('cmdb_ci', c.sys_id, { needs_review: true }) });
    }
  }
  return findings;
}

function score(store) {
  const cis = store.query('cmdb_ci', (c) => c.operational_status === 'Operational');
  const related = new Set(store.all('cmdb_rel_ci').flatMap((r) => [r.parent, r.child]));
  const pct = (n) => Math.round((n / cis.length) * 100);
  const completeness = pct(cis.filter((c) => c.owned_by && c.support_group && c.business_criticality).length);
  const serials = cis.map((c) => c.serial_number).filter(Boolean);
  const dupCount = serials.length - new Set(serials).size;
  const correctness = pct(cis.filter((c) => (Date.now() - new Date(c.last_discovered).getTime()) / 86400000 <= STALE_DAYS).length - dupCount);
  const compliance = pct(cis.filter((c) => c.sys_class_name === 'cmdb_ci_service' || related.has(c.sys_id) || c.needs_review).length);
  return { completeness, correctness, compliance, overall: Math.round((completeness + correctness + compliance) / 3) };
}

export async function run(ctx) {
  const { store } = ctx;
  const before = score(store);
  const total = store.query('cmdb_ci', (c) => c.operational_status === 'Operational').length;
  await ctx.step('tool', `Scanned ${total} operational CIs`, `Health ${before.overall}/100 · completeness ${before.completeness} · correctness ${before.correctness} · compliance ${before.compliance}`);

  const findings = audit(store);
  await ctx.step('insight', `${findings.length} issues found`, '', {
    table: findings.map((f) => ({ Issue: f.kind, CI: f.ci.name, 'Proposed fix': f.fix })),
  });
  if (!findings.length) return { title: 'CMDB is healthy', summary: `Health score ${before.overall}/100. Nothing to fix.`, links: [] };

  const retire = findings.filter((f) => f.kind === 'Duplicate' || f.kind === 'Stale');
  const safe = findings.filter((f) => !retire.includes(f));

  let applied = 0;
  if (safe.length) {
    await ctx.gate({ action: `Fill ${safe.length} missing fields and relationships`, target: 'cmdb_ci', risk: 'Low', reason: 'Additive data fixes only' });
    for (const f of safe) {
      f.apply();
      applied++;
    }
    await ctx.step('action', `Applied ${safe.length} additive fixes`, safe.map((f) => `${f.ci.name}: ${f.fix}`).join('\n'));
    ctx.audit('fix CMDB fields', `${safe.length} CIs`, 'applied', { approval: 'policy', minutesSaved: 5 * safe.length });
  }
  if (retire.length) {
    const ok = await ctx.gate({
      action: `Merge or retire ${retire.length} CIs`,
      target: retire.map((f) => f.ci.name).join(', '),
      risk: 'Medium',
      alwaysAsk: true,
      reason: 'Duplicate and stale records skew impact analysis and patch scope',
      details: retire.map((f) => [f.ci.name, f.fix]),
    });
    if (ok) {
      for (const f of retire) f.apply();
      applied += retire.length;
      await ctx.step('action', `Merged or retired ${retire.length} CIs`, retire.map((f) => f.ci.name).join(', '));
      ctx.audit('retire CIs', retire.map((f) => f.ci.name).join(', '), 'retired', { minutesSaved: 15 * retire.length });
    }
  }

  const after = score(store);
  await ctx.step('ok', `Health ${before.overall} -> ${after.overall}`, `completeness ${before.completeness}->${after.completeness} · correctness ${before.correctness}->${after.correctness} · compliance ${before.compliance}->${after.compliance}`);
  return {
    title: `CMDB health ${before.overall} -> ${after.overall}`,
    summary: `I fixed ${applied} of ${findings.length} issues. Impact analysis and patch targeting now use cleaner data.`,
    links: [],
    before,
    after,
  };
}
