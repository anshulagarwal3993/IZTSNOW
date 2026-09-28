import { buildSeed } from './seed.js';
import { Store } from './store.js';
import { createContext, settings, POLICIES, AUDIT, fmtTime } from './engine.js';
import { AGENTS, INTENTS, route, checkLlm } from './router.js';

const store = new Store(buildSeed());
window.izts = { store }; // handy in the browser console during a demo

// ---------- tiny DOM helper ----------
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : String(kid));
  return el;
}
const $ = (id) => document.getElementById(id);

// ---------- agent pages ----------
const PAGES = [
  {
    key: 'storyline', view: 'storyline', module: AGENTS.storyline,
    how: ['A critical OpenSSL CVE arrives in the security feed', 'Vulnerability-to-Patch ranks exposure and books an emergency change, scored by Change Risk Assessment', 'The patch goes in and breaks TLS for payments', 'Major Incident Commander declares the P1, opens the war room and finds the change', 'Self-Healing rolls it back, verifies, and the commander writes the post-incident review'],
    touches: ['sn_vul_vulnerable_item', 'change_request', 'incident', 'problem', 'kb_knowledge', 'teams_message'],
    reuses: 'Change Risk Assessment (2025)',
  },
  {
    key: 'selfHeal', module: AGENTS.selfHeal,
    how: ['Read the incident or turn a Copilot complaint into one', 'Find the CI, its services and live telemetry', 'Correlate recent changes on the CI', 'Pick a catalogued runbook and apply the guardrail policy', 'Run, verify health, resolve, and draft a KB article'],
    touches: ['incident', 'cmdb_ci', 'change_request', 'kb_knowledge'],
    reuses: 'Incident Routing & Prioritization (2025)',
    scenarios: [
      { label: 'INC0041187 · SAP disk 97% (low risk, runs by policy)', input: { incidentId: 'inc-1' } },
      { label: 'Copilot: "My VPN keeps dropping" (needs approval)', input: { text: 'My VPN keeps dropping every few minutes' } },
    ],
  },
  {
    key: 'majorIncident', module: AGENTS.majorIncident,
    how: ['Pick up the outage signal and map impact through the CMDB', 'Ask the MIM manager to confirm the P1', 'Open the Teams war room and page on-call engineers', 'Draft executive and status-page updates', 'Find the suspect change and hand the fix to Self-Healing', 'Open a problem record and write the post-incident review'],
    touches: ['incident', 'teams_message', 'change_request', 'problem', 'cmdb_rel_ci'],
    reuses: 'Talk to ITSM (2025) for status questions in the war room',
    scenarios: [{ label: 'Customers cannot pay online', input: { text: 'Customers cannot complete online payments' } }],
  },
  {
    key: 'vulnPatch', module: AGENTS.vulnPatch,
    how: ['Read the CVE from the security feed', 'Scan CMDB software inventory for affected versions', 'Rank by CVSS, internet exposure, criticality and environment', 'Create vulnerable items', 'Score each window with Change Risk Assessment and avoid conflicts', 'Book an emergency change and a standard change'],
    touches: ['vulnerability_feed', 'cmdb_ci', 'sn_vul_vulnerable_item', 'change_request', 'maintenance_window'],
    reuses: 'Change Risk Assessment (2025)',
  },
  {
    key: 'cmdbHealth', module: AGENTS.cmdbHealth,
    how: ['Score completeness, correctness and compliance', 'Find duplicates by serial number', 'Find stale CIs not discovered in 60 days', 'Fill missing owners and support groups', 'Relate orphans to services by naming pattern', 'Apply additive fixes; ask before merging or retiring'],
    touches: ['cmdb_ci', 'cmdb_rel_ci', 'sys_user_group'],
    reuses: 'Feeds every other agent with clean impact data',
  },
  {
    key: 'upgradeReadiness', module: AGENTS.upgradeReadiness,
    how: ['Scan update sets for risky patterns', 'Predict skipped records from modified out-of-box files', 'Score upgrade readiness', 'Generate ATF tests from user stories'],
    touches: ['sys_update_xml', 'rm_story', 'sys_atf_test'],
    reuses: 'ServiceNow AI Code Validators (2025)',
  },
];
const PAGE_BY_KEY = Object.fromEntries(PAGES.map((p) => [p.key, p]));

const agentNav = $('agent-nav');
for (const p of PAGES.filter((p) => p.key !== 'storyline')) {
  agentNav.append(h('button', { class: 'navbtn', 'data-view': `agent:${p.key}` }, h('span', { class: 'dot' }), p.module.meta.name));
}

// ---------- run plumbing ----------
let busy = false;
function setBusy(v) {
  busy = v;
  document.querySelectorAll('[data-run]').forEach((b) => (b.disabled = v));
  $('prompt').disabled = v;
}

function stepRow(s, showAgent) {
  let table = null;
  if (s.data?.table && Array.isArray(s.data.table) && s.data.table.length) {
    const cols = Object.keys(s.data.table[0]);
    table = h('div', { class: 'tbl' }, h('table', {}, h('thead', {}, h('tr', {}, cols.map((c) => h('th', {}, c)))), h('tbody', {}, s.data.table.map((r) => h('tr', {}, cols.map((c) => h('td', {}, r[c])))))));
  }
  const rec = s.data?.sys_id ? h('button', { class: 'rec', onclick: () => openRecord(s.data.sys_id) }, 'open') : null;
  return h('div', { class: `step ${s.kind}` },
    h('span', { class: `kind ${s.kind}` }, s.kind),
    h('div', {},
      h('div', { class: 't' }, showAgent ? h('small', {}, s.agent) : null, s.title, rec ? ' ' : null, rec),
      s.detail ? h('div', { class: 'd' }, s.detail) : null,
      table));
}

function makeSink(traceEl, scroller) {
  let lastAgent = null;
  const scroll = () => scroller && (scroller.scrollTop = scroller.scrollHeight);
  return {
    step(s) {
      traceEl.append(stepRow(s, s.agent !== lastAgent));
      lastAgent = s.agent;
      scroll();
    },
    approval(req) {
      return new Promise((resolve) => {
        const footer = h('footer', {});
        const card = h('div', { class: 'approval' },
          h('header', {}, `Approval needed: ${req.action}`, h('span', {}, `${req.agent} · ${req.risk} risk`)),
          h('dl', {}, h('dt', {}, 'Target'), h('dd', {}, req.target), h('dt', {}, 'Why'), h('dd', {}, req.reason), (req.details || []).flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v)])),
          footer);
        const decide = (approved) => {
          card.classList.add('done');
          footer.replaceChildren(approved ? '✔ Approved by Lena Fischer (you, as approver)' : '✖ Rejected');
          resolve({ approved, by: 'Lena Fischer' });
        };
        footer.append(h('button', { class: 'btn approve', onclick: () => decide(true) }, 'Approve'), h('button', { class: 'btn reject', onclick: () => decide(false) }, 'Reject'));
        traceEl.append(card);
        scroll();
        footer.querySelector('.approve').focus({ preventScroll: true });
      });
    },
  };
}

function resultCard(r) {
  const card = h('div', { class: 'result' }, h('h3', {}, r.title), h('p', {}, r.summary));
  if (r.table?.length) {
    const cols = Object.keys(r.table[0]);
    card.append(h('div', { class: 'tbl' }, h('table', {}, h('thead', {}, h('tr', {}, cols.map((c) => h('th', {}, c)))), h('tbody', {}, r.table.map((row) => h('tr', {}, cols.map((c) => h('td', {}, row[c]))))))));
  }
  const links = (r.links || []).filter((l) => l && l.number);
  if (links.length) card.append(h('div', { class: 'records' }, links.map((l) => h('button', { class: 'rec', onclick: () => openRecord(l.sys_id) }, l.number))));
  return card;
}

async function runAgent(mod, input, traceEl, scroller) {
  setBusy(true);
  try {
    const ctx = createContext(store, mod.meta.name, makeSink(traceEl, scroller));
    return await mod.run(ctx, input);
  } catch (e) {
    console.error(e);
    return { title: 'The agent stopped', summary: e.message, links: [] };
  } finally {
    setBusy(false);
  }
}

// ---------- Copilot channel ----------
const chat = $('chat');
const CHIPS = [
  'My VPN keeps dropping every few minutes',
  'Disk space alert on the SAP server, can you fix it?',
  "What's the status of my tickets?",
  "Declare a P1: customers can't pay online",
  'A new OpenSSL CVE just dropped. Are we exposed?',
  'Check CMDB health',
  'Are we ready for the upgrade?',
  'Run the full forum storyline',
];

function botMsg(...content) {
  const bubble = h('div', { class: 'bubble' }, h('div', { class: 'who' }, 'Copilot · ServiceNow agents'), ...content);
  chat.append(h('div', { class: 'msg' }, h('div', { class: 'avatar' }, 'Co'), bubble));
  chat.scrollTop = chat.scrollHeight;
  return bubble;
}

function meMsg(text) {
  chat.append(h('div', { class: 'msg me' }, h('div', { class: 'avatar user' }, 'RS'), h('div', { class: 'bubble' }, text)));
  chat.scrollTop = chat.scrollHeight;
}

function welcome() {
  chat.replaceChildren();
  botMsg(
    h('div', {}, 'Hi Riya. I connect Microsoft Copilot to the IZTSNOW agents in ServiceNow. I can fix common IT issues, check your tickets, run a major incident, patch a CVE, clean up the CMDB and check upgrade readiness.'),
    h('div', { class: 'd', style: 'color:var(--muted);font-size:13px' }, 'Pick a suggestion below or type your own question.'),
  );
}

function renderChips() {
  $('chips').replaceChildren(...CHIPS.map((c) => h('button', { class: 'chip', type: 'button', 'data-run': '', onclick: () => ask(c) }, c)));
}

async function ask(text) {
  if (busy || !text.trim()) return;
  meMsg(text);
  setBusy(true);
  const r = await route(text);
  setBusy(false);
  const mod = INTENTS[r.intent];
  if (!mod) {
    botMsg(h('div', {}, r.reply || "I can help with IT issues, ticket status, outages, CVEs, CMDB health and upgrades. Try one of the suggestions."));
    return;
  }
  const trace = h('div', { class: 'trace' });
  const bubble = botMsg(h('div', {}, `Routing to ${mod.meta.name}`, h('span', { style: 'color:var(--muted);font-size:12px' }, `  · ${r.source === 'claude' ? 'intent by Claude' : 'keyword routing'}`)), r.reply ? h('div', {}, r.reply) : null, trace);
  const input = { text, fromCopilot: true, cve: r.cve || undefined };
  const result = await runAgent(mod, input, trace, chat);
  bubble.append(resultCard(result));
  chat.scrollTop = chat.scrollHeight;
}

$('composer').addEventListener('submit', (e) => {
  e.preventDefault();
  const v = $('prompt').value;
  $('prompt').value = '';
  ask(v);
});

// ---------- agent page ----------
const pageCache = new Map();
function agentPage(key) {
  if (pageCache.has(key)) return pageCache.get(key);
  const p = PAGE_BY_KEY[key];
  const m = p.module.meta;
  const consoleEl = h('div', { class: 'console' }, h('div', { class: 'empty' }, 'Press Run to watch the agent work. Every step, approval and record appears here.'));
  const select = p.scenarios ? h('select', { 'aria-label': 'Scenario', id: `scenario-${key}` }, p.scenarios.map((s, i) => h('option', { value: i }, s.label))) : null;
  const runBtn = h('button', { class: 'btn primary', 'data-run': '', onclick: async () => {
    const input = p.scenarios ? p.scenarios[Number(select.value)].input : {};
    const trace = h('div', { class: 'trace' });
    consoleEl.replaceChildren(trace);
    const result = await runAgent(p.module, input, trace, $('view-agent'));
    consoleEl.append(resultCard(result));
  } }, key === 'storyline' ? 'Run the storyline' : 'Run agent');

  const el = h('div', { class: 'wrap' },
    h('div', { class: 'agent-head' },
      h('div', {}, h('h2', {}, m.name), h('p', {}, m.tagline)),
      h('div', { class: 'runbar' }, select, runBtn)),
    h('div', { class: 'cols' },
      h('div', { class: 'card' },
        h('h3', {}, 'How it works'),
        h('ol', { class: 'how' }, p.how.map((x) => h('li', {}, x))),
        h('div', { class: 'touches' }, p.touches.map((t) => h('span', {}, t))),
        h('div', { class: 'reuse' }, 'Builds on ', h('b', {}, p.reuses)),
        h('div', { class: 'reuse' }, 'Trigger: ', h('b', {}, m.inputs))),
      h('div', { class: 'card' }, consoleEl)));
  pageCache.set(key, el);
  return el;
}

// ---------- Control Tower ----------
function renderTower() {
  const log = store.all(AUDIT);
  const actions = log.filter((a) => !a.action.startsWith('gate:'));
  const gates = log.filter((a) => a.action.startsWith('gate:'));
  const human = gates.filter((g) => g.approval === 'human');
  const approved = human.filter((g) => g.outcome === 'approved').length;
  const auto = store.query('incident', (i) => i.close_code === 'Solved (Automated)').length;
  const minutes = log.reduce((n, a) => n + (a.minutes_saved || 0), 0);

  const byAgent = {};
  for (const a of actions) byAgent[a.agent] = (byAgent[a.agent] || 0) + 1;
  const max = Math.max(1, ...Object.values(byAgent));

  const kpi = (label, value, note) => h('div', { class: 'kpi' }, h('label', {}, label), h('b', {}, value), h('small', {}, note));
  const el = h('div', { class: 'wrap' },
    h('div', { class: 'kpis' },
      kpi('Agent actions', actions.length, `${Object.keys(byAgent).length} agents active`),
      kpi('Incidents resolved by agents', auto, 'close code Solved (Automated)'),
      kpi('Human approvals', `${approved}/${human.length}`, `${gates.length - human.length} allowed by policy`),
      kpi('Engineer time saved', `${(minutes / 60).toFixed(1)} h`, 'estimated from action type')),
    h('div', { class: 'split' },
      h('div', { class: 'card' }, h('h3', {}, 'Actions by agent'),
        Object.keys(byAgent).length
          ? h('div', { class: 'bars' }, Object.entries(byAgent).sort((a, b) => b[1] - a[1]).map(([k, v]) => h('div', { class: 'bar' }, h('span', {}, k), h('div', { class: 'track' }, h('div', { class: 'fill', style: `width:${(v / max) * 100}%` })), h('em', {}, v))))
          : h('div', { class: 'empty' }, 'No agent has run yet. Try the Copilot channel or the storyline.')),
      h('div', { class: 'card' }, h('h3', {}, 'Guardrail policy'), h('ul', { class: 'policies' }, POLICIES.map((p) => h('li', {}, h('b', {}, p.id), p.text))))),
    h('div', { class: 'card' }, h('h3', {}, `Audit log (${log.length})`),
      log.length
        ? h('div', { class: 'tbl' }, h('table', {},
            h('thead', {}, h('tr', {}, ['Time', 'Agent', 'Action', 'Target', 'Outcome', 'Approved by'].map((c) => h('th', {}, c)))),
            h('tbody', {}, log.slice(0, 200).map((a) => h('tr', {},
              h('td', { class: 'mono' }, new Date(a.sys_created_on).toLocaleTimeString()),
              h('td', {}, a.agent), h('td', {}, a.action), h('td', {}, a.target),
              h('td', {}, h('span', { class: `outcome ${a.outcome}` }, a.outcome)),
              h('td', {}, a.approval === 'human' ? a.approver : a.approval === 'policy' ? 'policy' : '—'))))))
        : h('div', { class: 'empty' }, 'Empty until an agent acts.')));
  $('view-tower').replaceChildren(el);
}

// ---------- Instance data ----------
const TABLES = {
  incident: ['number', 'short_description', 'priority', 'state', 'cmdb_ci', 'assigned_to'],
  change_request: ['number', 'short_description', 'type', 'state', 'risk', 'start_date'],
  problem: ['number', 'short_description', 'state', 'first_reported_by_task'],
  sn_vul_vulnerable_item: ['number', 'vulnerability', 'cmdb_ci', 'risk_score', 'state'],
  kb_knowledge: ['number', 'short_description', 'workflow_state', 'author'],
  sys_atf_test: ['number', 'name', 'table'],
  teams_message: ['at', 'channel', 'kind', 'text'],
  cmdb_ci: ['name', 'sys_class_name', 'environment', 'operational_status', 'owned_by', 'support_group'],
  sc_req_item: ['number', 'short_description', 'state', 'stage'],
};
let currentTable = 'incident';

function display(field, value) {
  if (value == null || value === '') return '';
  if (field === 'cmdb_ci') return store.ci(value)?.name || value;
  if (field === 'owned_by') return store.userName(value);
  if (field === 'support_group') return store.group(value)?.name || value;
  if (field === 'start_date' || field === 'at') return fmtTime(value);
  if (field === 'state' || field === 'operational_status' || field === 'workflow_state') {
    const cls = /Resolved|Closed|Operational|Published|Review/.test(value) ? 'good' : /Retired|Open/.test(value) ? 'bad' : 'mid';
    return h('span', { class: `state ${cls}` }, value);
  }
  if (field === 'priority' && value.startsWith('1')) return h('span', { class: 'state bad' }, value);
  return String(value);
}

function renderInstance() {
  const tabs = h('div', { class: 'tabs', role: 'tablist' }, Object.keys(TABLES).map((t) =>
    h('button', { class: 'tab', role: 'tab', 'aria-selected': String(t === currentTable), onclick: () => { currentTable = t; renderInstance(); } }, t, h('i', {}, store.all(t).length))));
  const cols = TABLES[currentTable];
  const rows = store.all(currentTable);
  const table = rows.length
    ? h('div', { class: 'tbl' }, h('table', {}, h('thead', {}, h('tr', {}, cols.map((c) => h('th', {}, c)))),
        h('tbody', {}, rows.map((r) => h('tr', { class: `clickable${store.changed.has(r.sys_id) ? ' fresh' : ''}`, onclick: () => openRecord(r.sys_id) }, cols.map((c) => h('td', {}, display(c, r[c]))))))))
    : h('div', { class: 'empty' }, 'No records yet. Run an agent to create some.');
  $('view-instance').replaceChildren(h('div', { class: 'wrap' },
    h('p', { style: 'margin:0;color:var(--muted)' }, 'Mock ServiceNow instance. Highlighted rows were created or changed by agents in this session. Click a row to open it.'),
    tabs, h('div', { class: 'card' }, table)));
}

// ---------- record drawer ----------
function findRecord(sysId) {
  for (const [t, rows] of Object.entries(store.tables)) {
    if (!Array.isArray(rows)) continue;
    const r = rows.find((x) => x.sys_id === sysId);
    if (r) return [t, r];
  }
  return [null, null];
}

function fmtValue(k, v) {
  if (Array.isArray(v)) {
    return v.map((x) => (typeof x === 'object' && x ? (x.at ? `${new Date(x.at).toLocaleTimeString()}  ${x.author ? x.author + ': ' : ''}${x.text}` : JSON.stringify(x)) : String(x))).join('\n');
  }
  if (v && typeof v === 'object') return Object.entries(v).map(([a, b]) => `${a}: ${b}`).join('\n');
  const shown = display(k, v);
  return shown instanceof Node ? shown : String(shown);
}

function openRecord(sysId) {
  const [table, r] = findRecord(sysId);
  if (!r) return;
  $('drawer-table').textContent = table;
  $('drawer-title').textContent = r.number || r.name || r.sys_id;
  $('drawer-body').replaceChildren(...Object.entries(r).filter(([k, v]) => k !== 'sys_id' && v !== '' && v != null && !(Array.isArray(v) && !v.length)).flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, fmtValue(k, v))]));
  $('drawer').hidden = false;
  $('drawer-close').focus();
}
$('drawer-close').addEventListener('click', () => ($('drawer').hidden = true));
$('drawer').addEventListener('click', (e) => { if (e.target.id === 'drawer') $('drawer').hidden = true; });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('drawer').hidden = true; });

// ---------- navigation ----------
let currentView = 'copilot';
const TITLES = { copilot: 'Copilot in Teams', storyline: 'Forum storyline', tower: 'Control Tower', instance: 'Instance data' };

function show(view) {
  currentView = view;
  document.querySelectorAll('.navbtn').forEach((b) => (b.dataset.view === view ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
  const agentKey = view === 'storyline' ? 'storyline' : view.startsWith('agent:') ? view.slice(6) : null;
  $('view-copilot').hidden = view !== 'copilot';
  $('view-agent').hidden = !agentKey;
  $('view-tower').hidden = view !== 'tower';
  $('view-instance').hidden = view !== 'instance';
  if (agentKey) {
    $('view-agent').replaceChildren(agentPage(agentKey));
    $('view-title').textContent = agentKey === 'storyline' ? TITLES.storyline : PAGE_BY_KEY[agentKey].module.meta.name;
  } else $('view-title').textContent = TITLES[view];
  if (view === 'tower') renderTower();
  if (view === 'instance') renderInstance();
  try { history.replaceState(null, '', `#${view.replace(':', '-')}`); } catch { /* sandboxed */ }
}
document.querySelector('nav.rail').addEventListener('click', (e) => {
  const b = e.target.closest('.navbtn');
  if (b) show(b.dataset.view);
});

let pending = false;
store.addEventListener('change', () => {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => {
    pending = false;
    if (currentView === 'tower') renderTower();
    if (currentView === 'instance') renderInstance();
  });
});

// ---------- controls ----------
$('speed').addEventListener('change', (e) => (settings.speed = Number(e.target.value)));
$('auto-approve').addEventListener('change', (e) => (settings.autoApprove = e.target.checked));
$('reset').addEventListener('click', () => {
  if (busy) return;
  store.reset(buildSeed());
  store.changed.clear();
  pageCache.clear();
  welcome();
  show(currentView);
});

(async () => {
  const s = await checkLlm();
  const pill = $('ai-status');
  pill.classList.toggle('on', s.llm);
  pill.lastChild.textContent = s.llm ? `Claude connected · ${s.model}` : 'Offline mode · keyword routing';
})();

welcome();
renderChips();
const hash = location.hash.slice(1);
const initial = hash.startsWith('agent-') ? `agent:${hash.slice(6)}` : ['storyline', 'tower', 'instance'].includes(hash) ? hash : 'copilot';
show(initial);
