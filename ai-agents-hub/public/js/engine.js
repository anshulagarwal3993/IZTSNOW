// Shared runtime for agents: step tracing, approval gates, guardrail policy and the audit trail.

export const AUDIT = 'x_izts_agent_audit';

export const settings = {
  speed: 1, // 1 = presenter pace, 0.25 = fast
  autoApprove: false, // approve every gate without asking (for unattended demos)
};

// Guardrail policy shown in the Control Tower.
export const POLICIES = [
  { id: 'P1', text: 'Low-risk catalogued runbooks may run without a human approval.' },
  { id: 'P2', text: 'Medium and High risk actions on Production need an approval from the owning group.' },
  { id: 'P3', text: 'Retiring or merging CMDB records always needs an approval.' },
  { id: 'P4', text: 'Agents act with the requesting user\'s roles; ACLs still apply.' },
  { id: 'P5', text: 'Every action is written to the agent audit log with its approver.' },
];

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms * settings.speed));

let runSeq = 0;

// sink: { step(step), approval(request) -> Promise<{approved, by}> }
export function createContext(store, agentName, sink, runBy = 'riya.sharma') {
  const runId = `run-${++runSeq}`;

  const ctx = {
    store,
    agent: agentName,
    runId,

    async step(kind, title, detail = '', data = null) {
      sink.step({ kind, title, detail, data, agent: ctx.agent });
      await sleep(kind === 'think' ? 450 : 650);
    },

    audit(action, target, outcome, extra = {}) {
      store.insert(AUDIT, {
        run_id: runId,
        agent: ctx.agent,
        action,
        target,
        outcome,
        approval: extra.approval || 'n/a',
        approver: extra.approver || '',
        minutes_saved: extra.minutesSaved || 0,
        requested_by: runBy,
      });
    },

    // Policy gate. Returns true when the action may proceed.
    async gate({ action, target, risk, environment = 'Production', reason, details = [], alwaysAsk = false }) {
      const autoByPolicy = !alwaysAsk && (risk === 'Low' || environment !== 'Production');
      if (autoByPolicy) {
        await ctx.step('policy', `Guardrail P1: ${risk} risk, runs without approval`, reason);
        ctx.audit(`gate: ${action}`, target, 'allowed', { approval: 'policy' });
        return true;
      }
      await ctx.step('policy', `Guardrail ${alwaysAsk ? 'P3' : 'P2'}: approval needed`, `${risk} risk on ${environment}`);
      const decision = settings.autoApprove
        ? { approved: true, by: 'Demo auto-approve' }
        : await sink.approval({ agent: ctx.agent, action, target, risk, reason, details });
      ctx.audit(`gate: ${action}`, target, decision.approved ? 'approved' : 'rejected', { approval: 'human', approver: decision.by });
      await ctx.step(decision.approved ? 'ok' : 'warn', decision.approved ? `Approved by ${decision.by}` : `Rejected by ${decision.by}`);
      return decision.approved;
    },

    // Run another agent inside this run, keeping the same trace.
    async delegate(name, fn, input) {
      const prev = ctx.agent;
      ctx.agent = name;
      await ctx.step('handoff', `Handing off to ${name}`);
      try {
        return await fn(ctx, input);
      } finally {
        ctx.agent = prev;
      }
    },
  };
  return ctx;
}

export const fmtTime = (isoStr) =>
  new Date(isoStr).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
