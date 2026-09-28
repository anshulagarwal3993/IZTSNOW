// In-memory stand-in for the ServiceNow Table API.

const PREFIX = {
  incident: 'INC',
  change_request: 'CHG',
  problem: 'PRB',
  kb_knowledge: 'KB',
  sn_vul_vulnerable_item: 'VIT',
  sys_atf_test: 'ATF',
};

export class Store extends EventTarget {
  constructor(seed) {
    super();
    this.reset(seed);
  }

  reset(seed) {
    this.tables = structuredClone(seed);
    this.counters = { INC: 41200, CHG: 30400, PRB: 8100, KB: 10400, VIT: 5600, ATF: 900 };
    this.seq = 0;
    this.changed = new Set();
    this.emit(null, null);
  }

  emit(table, record) {
    if (record) this.changed.add(record.sys_id);
    this.dispatchEvent(new CustomEvent('change', { detail: { table, record } }));
  }

  all(table) {
    return this.tables[table] || [];
  }

  query(table, pred = () => true) {
    return this.all(table).filter(pred);
  }

  get(table, sysId) {
    return this.all(table).find((r) => r.sys_id === sysId) || null;
  }

  find(table, pred) {
    return this.all(table).find(pred) || null;
  }

  insert(table, fields) {
    if (!this.tables[table]) this.tables[table] = [];
    const rec = { sys_id: `${table}-${Date.now().toString(36)}-${++this.seq}`, sys_created_on: new Date().toISOString(), ...fields };
    const prefix = PREFIX[table];
    if (prefix && !rec.number) rec.number = `${prefix}${String(++this.counters[prefix]).padStart(7, '0')}`;
    this.tables[table].unshift(rec);
    this.emit(table, rec);
    return rec;
  }

  update(table, sysId, patch) {
    const rec = this.get(table, sysId);
    if (!rec) throw new Error(`${table}/${sysId} not found`);
    Object.assign(rec, patch, { sys_updated_on: new Date().toISOString() });
    this.emit(table, rec);
    return rec;
  }

  addWorkNote(table, sysId, author, text) {
    const rec = this.get(table, sysId);
    rec.work_notes = rec.work_notes || [];
    rec.work_notes.push({ at: new Date().toISOString(), author, text });
    this.emit(table, rec);
  }

  // Helpers used across agents
  user(id) {
    return this.get('sys_user', id);
  }

  userName(id) {
    return this.user(id)?.name || id || '(none)';
  }

  group(id) {
    return this.get('sys_user_group', id);
  }

  ci(id) {
    return this.get('cmdb_ci', id);
  }

  ciByName(text) {
    const t = text.toLowerCase();
    return this.all('cmdb_ci').find((c) => t.includes(c.name.toLowerCase())) || null;
  }

  // Walk "depends on" relationships upward to the business services a CI supports.
  upstreamServices(ciId, seen = new Set()) {
    if (seen.has(ciId)) return [];
    seen.add(ciId);
    const ci = this.ci(ciId);
    const out = ci?.sys_class_name === 'cmdb_ci_service' ? [ci] : [];
    for (const rel of this.query('cmdb_rel_ci', (r) => r.child === ciId)) {
      out.push(...this.upstreamServices(rel.parent, seen));
    }
    return out;
  }

  downstream(ciId, seen = new Set()) {
    if (seen.has(ciId)) return [];
    seen.add(ciId);
    const out = [];
    for (const rel of this.query('cmdb_rel_ci', (r) => r.parent === ciId)) {
      const child = this.ci(rel.child);
      if (child) out.push(child, ...this.downstream(child.sys_id, seen));
    }
    return out;
  }
}
