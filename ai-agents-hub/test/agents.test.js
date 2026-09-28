// Runs every agent headless against a fresh mock instance and checks the outcomes.
import assert from 'node:assert/strict';
import { buildSeed } from '../public/js/seed.js';
import { Store } from '../public/js/store.js';
import { createContext, settings, AUDIT } from '../public/js/engine.js';
import { AGENTS, keywordRoute } from '../public/js/router.js';

settings.speed = 0;
const verbose = process.argv.includes('-v');

function sink(decisions = []) {
  return {
    step: (s) => verbose && console.log(`  [${s.kind}] ${s.agent}: ${s.title}${s.detail ? ' - ' + s.detail.split('\n')[0] : ''}`),
    approval: async (req) => {
      const approved = decisions.length ? decisions.shift() : true;
      verbose && console.log(`  [approval] ${req.action} -> ${approved}`);
      return { approved, by: 'Test' };
    },
  };
}

async function runAgent(name, input, decisions) {
  const store = new Store(buildSeed());
  const ctx = createContext(store, AGENTS[name].meta.name, sink(decisions));
  const result = await AGENTS[name].run(ctx, input);
  verbose && console.log(`=> ${result.title}\n   ${result.summary}`);
  return { store, result };
}

const tests = {
  async 'self-heal: disk incident resolves without approval'() {
    let asked = 0;
    const store = new Store(buildSeed());
    const ctx = createContext(store, 'Self-Healing', { step() {}, approval: async () => (asked++, { approved: true, by: 'x' }) });
    await AGENTS.selfHeal.run(ctx, { incidentId: 'inc-1' });
    assert.equal(store.get('incident', 'inc-1').state, 'Resolved');
    assert.equal(store.ci('ci-sapapp03').metrics.disk, 61);
    assert.equal(asked, 0);
  },
  async 'self-heal: VPN complaint creates incident and needs approval'() {
    const { store, result } = await runAgent('selfHeal', { text: 'My VPN keeps dropping every few minutes' });
    const inc = store.find('incident', (i) => i.contact_type === 'Copilot');
    assert.equal(inc.state, 'Resolved');
    assert.equal(inc.cmdb_ci, 'ci-vpngw01');
    assert.ok(store.query(AUDIT, (a) => a.approval === 'human').length >= 1);
    assert.ok(result.links.some((l) => l.number?.startsWith('KB')));
  },
  async 'self-heal: rejected fix routes to the support group'() {
    const { store } = await runAgent('selfHeal', { text: 'VPN disconnects' }, [false]);
    const inc = store.find('incident', (i) => i.contact_type === 'Copilot');
    assert.equal(inc.state, 'In Progress');
    assert.equal(inc.assignment_group, 'grp-network');
  },
  async 'vuln-patch: ranks CIs and schedules changes'() {
    const { store, result } = await runAgent('vulnPatch', {});
    assert.equal(store.all('sn_vul_vulnerable_item').length, 5);
    const emergency = store.find('change_request', (c) => c.type === 'Emergency');
    assert.deepEqual(emergency.affected_cis.sort(), ['ci-payapp01', 'ci-payapp02']);
    assert.ok(result.change);
  },
  async 'major incident: resolves payments outage via rollback'() {
    const { store, result } = await runAgent('majorIncident', { text: 'Customers cannot pay online' });
    const inc = store.get('incident', result.incident.sys_id);
    assert.equal(inc.priority, '1 - Critical');
    assert.equal(inc.state, 'Resolved');
    assert.equal(store.all('problem').length, 1);
    assert.ok(store.all('teams_message').length >= 5);
    assert.equal(store.get('change_request', 'chg-4').close_code, 'Unsuccessful');
  },
  async 'cmdb-health: score improves'() {
    const { result } = await runAgent('cmdbHealth', {});
    assert.ok(result.after.overall > result.before.overall, `${result.before.overall} -> ${result.after.overall}`);
  },
  async 'upgrade: finds skipped records and writes ATF tests'() {
    const { store, result } = await runAgent('upgradeReadiness', {});
    assert.equal(store.all('sys_atf_test').length, 3);
    assert.match(result.title, /Upgrade readiness \d+\/100/);
  },
  async 'itsm status lists my items'() {
    const { result } = await runAgent('itsmStatus', {});
    assert.equal(result.table.length, 4);
  },
  async 'storyline: CVE patch breaks payments and the P1 is resolved'() {
    const { store } = await runAgent('storyline', {});
    const emergency = store.find('change_request', (c) => c.type === 'Emergency');
    assert.equal(emergency.state, 'Review');
    assert.equal(emergency.caused_incident?.startsWith('INC'), true);
    const p1 = store.find('incident', (i) => i.priority === '1 - Critical');
    assert.equal(p1.state, 'Resolved');
  },
  async 'keyword router'() {
    assert.equal(keywordRoute('My VPN keeps dropping').intent, 'self_heal');
    assert.equal(keywordRoute("Declare a P1: customers can't pay").intent, 'major_incident');
    assert.equal(keywordRoute('New CVE for OpenSSL').intent, 'vuln_patch');
    assert.equal(keywordRoute('What is the status of my tickets?').intent, 'ticket_status');
    assert.equal(keywordRoute('Are we ready for the upgrade?').intent, 'upgrade_readiness');
    assert.equal(keywordRoute('hello').intent, 'help');
  },
};

let failed = 0;
for (const [name, fn] of Object.entries(tests)) {
  try {
    verbose && console.log(`\n# ${name}`);
    await fn();
    console.log(`ok   ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${name}\n     ${e.stack.split('\n').slice(0, 3).join('\n     ')}`);
  }
}
process.exitCode = failed ? 1 : 0;
