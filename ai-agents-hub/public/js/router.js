// Copilot channel intent router. Uses Claude through the local server when it is available,
// and falls back to keyword rules so the demo also runs offline.

import * as selfHeal from './agents/selfHeal.js';
import * as majorIncident from './agents/majorIncident.js';
import * as cmdbHealth from './agents/cmdbHealth.js';
import * as vulnPatch from './agents/vulnPatch.js';
import * as upgradeReadiness from './agents/upgradeReadiness.js';
import * as itsmStatus from './agents/itsmStatus.js';
import * as storyline from './agents/storyline.js';

export const AGENTS = { selfHeal, majorIncident, cmdbHealth, vulnPatch, upgradeReadiness, itsmStatus, storyline };

export const INTENTS = {
  self_heal: selfHeal,
  major_incident: majorIncident,
  cmdb_health: cmdbHealth,
  vuln_patch: vulnPatch,
  upgrade_readiness: upgradeReadiness,
  ticket_status: itsmStatus,
  storyline,
};

const RULES = [
  ['storyline', /storyline|full demo|end.to.end|whole story/i],
  ['major_incident', /\bp1\b|major incident|outage|customers can'?t|cannot (pay|complete)|is down|war room/i],
  ['vuln_patch', /cve|vulnerab|patch|openssl|exploit/i],
  ['cmdb_health', /cmdb|duplicate|stale|configuration item|data quality/i],
  ['upgrade_readiness', /upgrade|atf|test case|skipped record|readiness/i],
  ['ticket_status', /status|my (tickets|requests|incidents)|open items|where is my/i],
  ['self_heal', /vpn|disk|space|slow|drop|disconnect|not working|broken|fix|error|crash|restart/i],
];

export function keywordRoute(message) {
  for (const [intent, re] of RULES) if (re.test(message)) return { intent, source: 'rules' };
  return { intent: 'help', source: 'rules' };
}

let llmAvailable = null;

export async function checkLlm() {
  try {
    const r = await fetch('api/health', { cache: 'no-store' });
    if (!r.ok) throw new Error();
    const j = await r.json();
    llmAvailable = !!j.llm;
    return { llm: llmAvailable, model: j.model };
  } catch {
    llmAvailable = false;
    return { llm: false };
  }
}

export async function route(message) {
  if (llmAvailable) {
    try {
      const r = await fetch('api/route', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (r.ok) {
        const j = await r.json();
        if (j.intent) return { ...j, source: 'claude' };
      }
    } catch {
      /* fall through to rules */
    }
  }
  return keywordRoute(message);
}
