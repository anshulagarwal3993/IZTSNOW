# IZTSNOW Agent Hub

Runnable demo of the IZTSNOW AI agents for the World Forum, with a **Microsoft Copilot (Teams) channel** as the front door.

| Agent | What it does | Builds on (last event) |
|---|---|---|
| Copilot channel | Routes what employees type in Copilot to the right agent, shows approvals as adaptive cards | Talk to ITSM, Helpdesk IVA |
| Self-Healing Remediation | Incident → CI + telemetry → recent changes → runbook → guardrail → fix → verify → resolve → KB draft | Incident Routing |
| Major Incident Commander | P1 → impact via CMDB → Teams war room + paging → exec/status comms → suspect change → rollback → problem + post-incident review | Incident Routing |
| Vulnerability-to-Patch | CVE → affected CIs → exposure ranking → vulnerable items → risk-scored, conflict-free change | Change Risk Assessment |
| CMDB Health Steward | Completeness / correctness / compliance score → duplicates, stale, ownerless, orphan CIs → fixes with approval | – |
| Upgrade Readiness & ATF | Scans customisations, predicts skipped records, generates ATF tests from stories | AI Code Validators |
| Forum storyline | One CVE through every agent: patch → patch breaks payments → P1 → rollback → PIR | all of the above |
| Control Tower | KPIs, guardrail policy, full audit trail of every agent action and approver | – |

All ServiceNow data is a fictional in-memory instance (`public/js/seed.js`), so the demo runs anywhere with no instance or licences.

## Run it

```bash
cd ai-agents-hub
npm install
npm start            # http://localhost:3000
```

Optional: let Claude understand free-text Copilot messages (otherwise keyword routing is used):

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm start
```

The status pill in the top bar shows which mode is active. `CLAUDE_MODEL` and `PORT` can be overridden.

Tests (runs every agent headless against a fresh instance):

```bash
npm test
```

## Demo script (about 8 minutes)

1. **Copilot in Teams**: click *"My VPN keeps dropping"*. The agent creates the incident, finds the firewall, links yesterday's PAN-OS change, and asks for approval in an adaptive card. Approve it. The incident is resolved and a KB draft is written.
2. Click *"Disk space alert on the SAP server"*. This one is low risk, so guardrail P1 lets it run with no approval.
3. Click *"What's the status of my tickets?"* (Talk to ITSM).
4. **Forum storyline**: press *Run the storyline* and approve the three gates (or tick *Auto-approve*).
5. **Control Tower**: show actions, approvals, time saved and the audit log.
6. **Instance data**: open `teams_message` for the war room transcript, then the P1 incident for its timeline and post-incident review.

Use *Pace → Fast* when time is short and *Reset demo* between sessions.

## Layout

```
server.js                 static server + /api/route (Claude intent routing)
public/index.html         UI shell and styles
public/js/main.js         Copilot channel, agent pages, Control Tower, instance browser
public/js/engine.js       step tracing, approval gates, guardrail policy, audit log
public/js/store.js        mock ServiceNow Table API
public/js/router.js       Copilot intent routing (Claude, with keyword fallback)
public/js/agents/*.js     one file per agent
test/agents.test.js       headless agent tests
```

## Going live on a real instance

- **ServiceNow**: replace `Store` with a thin client for the Table API (`/api/now/table/{table}`) using OAuth; the agents only call `query`, `get`, `insert`, `update` and a few CMDB helpers. Runbook execution maps to Flow Designer actions or Orchestration.
- **Copilot**: publish the router as a Copilot Studio agent (or an M365 Copilot plugin) that calls `/api/route` and the agents, with Entra ID SSO passed through so ServiceNow ACLs apply. Approvals become Teams adaptive cards.
