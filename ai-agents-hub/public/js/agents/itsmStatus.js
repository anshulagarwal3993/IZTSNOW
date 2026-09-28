// Talk to ITSM (last year's agent): answers "what's the status of my tickets" from the Copilot channel.

export const meta = {
  id: 'itsm-status',
  name: 'Talk to ITSM',
  tagline: 'Answers status questions about your incidents, requests and changes.',
  inputs: 'A question in Copilot',
};

export async function run(ctx, input = {}) {
  const { store } = ctx;
  const me = input.callerId || 'riya.sharma';
  const incs = store.query('incident', (i) => i.caller_id === me && i.state !== 'Closed');
  const ritms = store.query('sc_req_item', (r) => r.requested_for === me);
  await ctx.step('tool', `Queried incidents and requests for ${store.userName(me)}`, `${incs.length} incidents, ${ritms.length} requests`);

  const rows = [
    ...incs.map((i) => ({ Record: i.number, What: i.short_description, State: i.state, Who: i.assigned_to || store.group(i.assignment_group)?.name || '' })),
    ...ritms.map((r) => ({ Record: r.number, What: r.short_description, State: `${r.state} (${r.stage})`, Who: r.stage })),
  ];
  const waiting = ritms.find((r) => /approval/i.test(r.state));
  return {
    title: `You have ${rows.length} open items`,
    summary: waiting ? `${waiting.number} is waiting on your manager's approval. Everything else is moving.` : 'Everything is moving.',
    table: rows,
    links: [...incs, ...ritms],
  };
}
