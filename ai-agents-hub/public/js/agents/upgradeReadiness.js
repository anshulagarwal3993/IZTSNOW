// Upgrade Readiness & ATF Test Generator: scans customisations for upgrade risk and writes ATF tests from user stories.

export const meta = {
  id: 'upgrade-atf',
  name: 'Upgrade Readiness & ATF',
  tagline: 'Scores customisations for upgrade risk and generates ATF tests from user stories.',
  inputs: 'Update sets and the story backlog',
};

const RULES = [
  { id: 'R1', sev: 'High', re: /document\.getElementById|\$\(|jQuery|gel\(/, text: 'Direct DOM access in a client script breaks with UI changes' },
  { id: 'R2', sev: 'High', re: /Packages\./, text: 'Packages.* calls are blocked on newer releases' },
  { id: 'R3', sev: 'Medium', re: /new GlideRecord\(/, when: (c) => c.type === 'Client Script', text: 'Synchronous GlideRecord in a client script; use GlideAjax' },
  { id: 'R4', sev: 'Medium', re: /current\.update\(\)/, when: (c) => c.when === 'before' || c.type === 'UI Action', text: 'current.update() in a before rule or UI action causes double updates' },
  { id: 'R5', sev: 'Medium', re: /'[0-9a-f]{32}'/, text: 'Hard-coded sys_id; breaks across instances' },
  { id: 'R6', sev: 'Low', re: /setWorkflow\(false\)/, text: 'setWorkflow(false) skips engines and audit' },
];

export function scan(customisations) {
  const findings = [];
  for (const c of customisations) {
    if (c.ootb_modified) findings.push({ record: c.name, rule: 'SKIP', sev: 'High', text: 'Modified out-of-box record; will be a skipped record on upgrade' });
    for (const r of RULES) if (r.re.test(c.script) && (!r.when || r.when(c))) findings.push({ record: c.name, rule: r.id, sev: r.sev, text: r.text });
  }
  return findings;
}

function testsFor(story) {
  if (story.table === 'change_request') {
    return [
      'Impersonate: change.manager test user',
      'Open a New Form: change_request',
      'Set Field Values: short_description = "ATF risk banner", risk = High',
      'UI Action / Field message check: "CAB review required" shown under Risk',
      'Set Field Values: risk = Moderate',
      'Field message check: no CAB message',
    ];
  }
  if (/VIP/i.test(story.title)) {
    return [
      'Create a User: VIP = true',
      'Impersonate: itil test user',
      'Open a New Form: incident',
      'Set Field Values: caller_id = <VIP user>, short_description = "ATF VIP routing"',
      'Submit a Form',
      'Record Validation: incident.assignment_group = VIP Service Desk',
    ];
  }
  return [
    'Create a User: assignee with manager',
    'Record Insert: incident, assigned_to = <assignee>, priority = 3',
    'Record Update: priority = 1 - Critical',
    'Wait for condition: sys_email where instance = <incident>',
    'Record Validation: email recipients contain manager; subject contains incident number',
  ];
}

export async function run(ctx) {
  const { store } = ctx;
  const custom = store.all('sys_update_xml');
  await ctx.step('tool', `Scanned ${custom.length} customisations`, 'Business rules, client scripts, UI actions, script includes, flows, layouts');

  const findings = scan(custom);
  const weight = { High: 8, Medium: 4, Low: 1 };
  const penalty = findings.reduce((n, f) => n + weight[f.sev], 0);
  const readiness = Math.max(0, 100 - penalty);
  const skipped = findings.filter((f) => f.rule === 'SKIP').length;
  await ctx.step('insight', `Readiness ${readiness}/100 · ${skipped} predicted skipped records`, '', {
    table: findings.map((f) => ({ Severity: f.sev, Record: f.record, Rule: f.rule, Why: f.text })),
  });

  const stories = store.all('user_story');
  const created = [];
  for (const s of stories) {
    const steps = testsFor(s);
    const t = store.insert('sys_atf_test', { name: `${s.id}: ${s.title}`, story: s.id, table: s.table, steps, active: true, author: 'AI Agent' });
    created.push(t);
    await ctx.step('action', `Generated ATF test ${t.number}`, `${s.title}\n${steps.map((x, i) => `${i + 1}. ${x}`).join('\n')}`, { table: 'sys_atf_test', sys_id: t.sys_id });
  }
  ctx.audit('scan upgrade readiness', `${custom.length} customisations`, `${findings.length} findings`, { approval: 'policy', minutesSaved: 240 });
  ctx.audit('generate ATF tests', `${created.length} stories`, 'created', { approval: 'policy', minutesSaved: 45 * created.length });

  return {
    title: `Upgrade readiness ${readiness}/100, ${created.length} ATF tests generated`,
    summary: `${findings.filter((f) => f.sev === 'High').length} high-severity items to fix before the upgrade, including ${skipped} modified out-of-box records. ATF tests are ready for the regression suite.`,
    links: created,
  };
}
