// Serves the Agent Hub and, when an Anthropic credential is set, lets Claude route Copilot messages to agents.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(here, 'public');
const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5';
const llmEnabled = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const client = llmEnabled ? new Anthropic() : null;

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

const Route = z.object({
  intent: z.enum(['self_heal', 'major_incident', 'vuln_patch', 'cmdb_health', 'upgrade_readiness', 'ticket_status', 'storyline', 'help']),
  cve: z.string().nullable(),
  reply: z.string(),
});

const SYSTEM = `You route messages that employees type into Microsoft Copilot to IZTSNOW's ServiceNow AI agents.
Pick exactly one intent:
- self_heal: an employee reports something broken they want fixed (VPN drops, disk full, service not responding, slow app).
- major_incident: a widespread outage or a request to declare a P1 or open a war room.
- vuln_patch: a CVE, vulnerability, exposure question or patching request.
- cmdb_health: CMDB or configuration item data quality.
- upgrade_readiness: ServiceNow upgrade readiness, skipped records or ATF test generation.
- ticket_status: status of the user's own incidents, requests or approvals.
- storyline: the user asks for the full end-to-end demo.
- help: anything else, including greetings and general questions.
Set cve to a CVE id if the message names one, otherwise null.
Set reply to one short, friendly sentence (under 25 words) that Copilot shows before the agent starts. For help, answer the question briefly and say what the agents can do.`;

async function routeMessage(message) {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 2048,
    output_config: { effort: 'low', format: zodOutputFormat(Route) },
    system: SYSTEM,
    messages: [{ role: 'user', content: message }],
  });
  if (response.stop_reason === 'refusal' || !response.parsed_output) return null;
  return response.parsed_output;
}

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 10_000) throw new Error('body too large');
  }
  return JSON.parse(raw || '{}');
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/api/health') return send(res, 200, { ok: true, llm: llmEnabled, model: llmEnabled ? MODEL : null });

    if (url.pathname === '/api/route' && req.method === 'POST') {
      if (!client) return send(res, 503, { error: 'Set ANTHROPIC_API_KEY to enable Claude routing' });
      const { message } = await readJson(req);
      if (typeof message !== 'string' || !message.trim()) return send(res, 400, { error: 'message is required' });
      const out = await routeMessage(message.slice(0, 2000));
      return out ? send(res, 200, out) : send(res, 502, { error: 'No routing decision' });
    }

    // Static files. The page itself is authored without a document skeleton, so add one here.
    const rel = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const file = path.normalize(path.join(PUBLIC, rel));
    if (!file.startsWith(PUBLIC)) return send(res, 403, 'Forbidden', 'text/plain');
    let body = await readFile(file);
    if (rel === 'index.html') body = `<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body>${body}</body></html>`;
    return send(res, 200, body, TYPES[path.extname(file)] || 'application/octet-stream');
  } catch (err) {
    if (err.code === 'ENOENT') return send(res, 404, 'Not found', 'text/plain');
    if (err instanceof Anthropic.APIError) {
      console.error(`Claude API error ${err.status}: ${err.message}`);
      return send(res, 502, { error: 'Claude API error' });
    }
    console.error(err);
    return send(res, 500, { error: 'Server error' });
  }
});

server.listen(PORT, () => {
  console.log(`IZTSNOW Agent Hub running at http://localhost:${PORT}`);
  console.log(llmEnabled ? `Claude routing on (${MODEL})` : 'Claude routing off (set ANTHROPIC_API_KEY to enable); keyword routing is used');
});
