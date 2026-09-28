// Demo data for a mock ServiceNow instance. Names, CIs and CVE ids are fictional.

const now = Date.now();
const DAY = 86400000;
const HOUR = 3600000;
const iso = (ms) => new Date(ms).toISOString();
const daysAgo = (d) => iso(now - d * DAY);
const hoursAgo = (h) => iso(now - h * HOUR);

// Next weekday (0 = Sunday) at the given hour, at least one day out.
function nextWindow(weekday, hour) {
  const d = new Date(now + DAY);
  d.setHours(hour, 0, 0, 0);
  while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  return d.getTime();
}

export const CALLER = 'riya.sharma';

export function buildSeed() {
  const satWindow = nextWindow(6, 1);
  const wedWindow = nextWindow(3, 22);

  return {
    sys_user: [
      { sys_id: 'riya.sharma', name: 'Riya Sharma', title: 'Finance Analyst', department: 'Finance' },
      { sys_id: 'priya.nair', name: 'Priya Nair', title: 'Service Desk Lead', department: 'IT' },
      { sys_id: 'marcus.lee', name: 'Marcus Lee', title: 'Network Engineer', department: 'IT' },
      { sys_id: 'aisha.khan', name: 'Aisha Khan', title: 'Payments App Owner', department: 'Digital' },
      { sys_id: 'tom.becker', name: 'Tom Becker', title: 'Linux Engineer', department: 'IT' },
      { sys_id: 'lena.fischer', name: 'Lena Fischer', title: 'Major Incident Manager', department: 'IT' },
      { sys_id: 'daniel.ortiz', name: 'Daniel Ortiz', title: 'CIO', department: 'IT' },
      { sys_id: 'sam.okafor', name: 'Sam Okafor', title: 'Security Analyst', department: 'Security' },
      { sys_id: 'wei.zhang', name: 'Wei Zhang', title: 'Windows Engineer', department: 'IT' },
    ],

    sys_user_group: [
      { sys_id: 'grp-network', name: 'Network Operations', manager: 'marcus.lee', on_call: 'marcus.lee' },
      { sys_id: 'grp-payments', name: 'Payments App Support', manager: 'aisha.khan', on_call: 'aisha.khan' },
      { sys_id: 'grp-linux', name: 'Linux Operations', manager: 'tom.becker', on_call: 'tom.becker' },
      { sys_id: 'grp-windows', name: 'Windows Server Operations', manager: 'wei.zhang', on_call: 'wei.zhang' },
      { sys_id: 'grp-servicedesk', name: 'Service Desk', manager: 'priya.nair', on_call: 'priya.nair' },
      { sys_id: 'grp-secops', name: 'Security Operations', manager: 'sam.okafor', on_call: 'sam.okafor' },
      { sys_id: 'grp-mim', name: 'Major Incident Management', manager: 'lena.fischer', on_call: 'lena.fischer' },
    ],

    cmdb_ci: [
      // Business services
      { sys_id: 'svc-payments', name: 'Online Payments', sys_class_name: 'cmdb_ci_service', environment: 'Production', business_criticality: '1 - most critical', users: 48000, owned_by: 'aisha.khan', support_group: 'grp-payments', last_discovered: daysAgo(1), operational_status: 'Operational' },
      { sys_id: 'svc-vpn', name: 'Corporate VPN', sys_class_name: 'cmdb_ci_service', environment: 'Production', business_criticality: '2 - somewhat critical', users: 6200, owned_by: 'marcus.lee', support_group: 'grp-network', last_discovered: daysAgo(1), operational_status: 'Operational' },
      { sys_id: 'svc-hr', name: 'HR Portal', sys_class_name: 'cmdb_ci_service', environment: 'Production', business_criticality: '3 - less critical', users: 7400, owned_by: '', support_group: 'grp-servicedesk', last_discovered: daysAgo(2), operational_status: 'Operational' },
      { sys_id: 'svc-sap', name: 'SAP Finance', sys_class_name: 'cmdb_ci_service', environment: 'Production', business_criticality: '1 - most critical', users: 1900, owned_by: 'wei.zhang', support_group: 'grp-windows', last_discovered: daysAgo(1), operational_status: 'Operational' },

      // Applications
      { sys_id: 'app-payapi', name: 'payments-api', sys_class_name: 'cmdb_ci_appl', environment: 'Production', business_criticality: '1 - most critical', owned_by: 'aisha.khan', support_group: 'grp-payments', last_discovered: daysAgo(1), operational_status: 'Operational',
        metrics: { error_rate: 0.3, latency_ms: 180, tls_handshake_fail: 0 } },

      // Servers and devices
      { sys_id: 'ci-payapp01', name: 'lnx-pay-app01', sys_class_name: 'cmdb_ci_linux_server', environment: 'Production', business_criticality: '1 - most critical', internet_facing: true, ip_address: '10.20.4.11', serial_number: 'VMW-42-1A-77-01', os: 'RHEL 9.3', owned_by: 'tom.becker', support_group: 'grp-linux', last_discovered: daysAgo(1), operational_status: 'Operational',
        software: [{ name: 'OpenSSL', version: '3.0.7' }, { name: 'nginx', version: '1.24.0' }], metrics: { cpu: 41, disk: 58, service: 'running' } },
      { sys_id: 'ci-payapp02', name: 'lnx-pay-app02', sys_class_name: 'cmdb_ci_linux_server', environment: 'Production', business_criticality: '1 - most critical', internet_facing: true, ip_address: '10.20.4.12', serial_number: 'VMW-42-1A-77-02', os: 'RHEL 9.3', owned_by: 'tom.becker', support_group: 'grp-linux', last_discovered: daysAgo(1), operational_status: 'Operational',
        software: [{ name: 'OpenSSL', version: '3.0.7' }, { name: 'nginx', version: '1.24.0' }], metrics: { cpu: 38, disk: 61, service: 'running' } },
      { sys_id: 'ci-paydb01', name: 'lnx-pay-db01', sys_class_name: 'cmdb_ci_db_ora_instance', environment: 'Production', business_criticality: '1 - most critical', internet_facing: false, ip_address: '10.20.5.21', serial_number: 'VMW-42-1A-80-11', os: 'Oracle Linux 8', owned_by: 'tom.becker', support_group: 'grp-linux', last_discovered: daysAgo(1), operational_status: 'Operational',
        software: [{ name: 'Oracle Database', version: '19.21' }, { name: 'OpenSSL', version: '1.1.1w' }], metrics: { cpu: 55, disk: 72, service: 'running' } },
      { sys_id: 'ci-vpngw01', name: 'vpn-gw-01', sys_class_name: 'cmdb_ci_ip_firewall', environment: 'Production', business_criticality: '2 - somewhat critical', internet_facing: true, ip_address: '203.0.113.10', serial_number: 'PA-5220-99812', os: 'PAN-OS 11.1.2', owned_by: 'marcus.lee', support_group: 'grp-network', last_discovered: daysAgo(1), operational_status: 'Operational',
        software: [{ name: 'PAN-OS', version: '11.1.2' }], metrics: { cpu: 64, tunnel_flaps_1h: 37, service: 'degraded' } },
      { sys_id: 'ci-sapapp03', name: 'win-sap-app03', sys_class_name: 'cmdb_ci_win_server', environment: 'Production', business_criticality: '1 - most critical', internet_facing: false, ip_address: '10.30.2.33', serial_number: 'DELL-R750-7QX21', os: 'Windows Server 2022', owned_by: 'wei.zhang', support_group: 'grp-windows', last_discovered: daysAgo(1), operational_status: 'Operational',
        software: [{ name: 'SAP NetWeaver', version: '7.5' }], metrics: { cpu: 33, disk: 97, service: 'running' } },
      { sys_id: 'ci-hrweb01', name: 'lnx-hr-web01', sys_class_name: 'cmdb_ci_linux_server', environment: 'Production', business_criticality: '3 - less critical', internet_facing: false, ip_address: '10.40.1.15', serial_number: 'VMW-42-2B-10-15', os: 'Ubuntu 22.04', owned_by: '', support_group: '', last_discovered: daysAgo(3), operational_status: 'Operational',
        software: [{ name: 'OpenSSL', version: '3.0.7' }, { name: 'Apache httpd', version: '2.4.58' }], metrics: { cpu: 12, disk: 40, service: 'running' } },
      { sys_id: 'ci-build07', name: 'lnx-build-07', sys_class_name: 'cmdb_ci_linux_server', environment: 'Development', business_criticality: '4 - not critical', internet_facing: false, ip_address: '10.90.7.7', serial_number: 'VMW-42-9C-07-07', os: 'RHEL 9.2', owned_by: 'tom.becker', support_group: 'grp-linux', last_discovered: daysAgo(4), operational_status: 'Operational',
        software: [{ name: 'OpenSSL', version: '3.0.7' }, { name: 'Jenkins', version: '2.440' }], metrics: { cpu: 71, disk: 66, service: 'running' } },

      // Data-quality problems for the CMDB Health agent
      { sys_id: 'ci-payapp01-dup', name: 'lnx-pay-app01.corp.local', sys_class_name: 'cmdb_ci_linux_server', environment: 'Production', business_criticality: '', internet_facing: true, ip_address: '10.20.4.11', serial_number: 'VMW-42-1A-77-01', os: 'RHEL 9.3', owned_by: '', support_group: '', last_discovered: daysAgo(46), operational_status: 'Operational',
        software: [{ name: 'OpenSSL', version: '3.0.7' }] },
      { sys_id: 'ci-legacyfs02', name: 'win-legacy-fs02', sys_class_name: 'cmdb_ci_win_server', environment: 'Production', business_criticality: '3 - less critical', internet_facing: false, ip_address: '10.30.9.2', serial_number: 'HP-DL380-G9-5521', os: 'Windows Server 2012 R2', owned_by: 'wei.zhang', support_group: 'grp-windows', last_discovered: daysAgo(141), operational_status: 'Operational' },
      { sys_id: 'ci-tmptest09', name: 'lnx-tmp-test09', sys_class_name: 'cmdb_ci_linux_server', environment: 'Test', business_criticality: '', internet_facing: false, ip_address: '10.90.9.9', serial_number: 'VMW-42-9C-09-09', os: 'RHEL 8.8', owned_by: '', support_group: '', last_discovered: daysAgo(97), operational_status: 'Operational' },
      { sys_id: 'ci-exch-conn', name: 'exo-hybrid-conn01', sys_class_name: 'cmdb_ci_win_server', environment: 'Production', business_criticality: '2 - somewhat critical', internet_facing: true, ip_address: '10.30.3.40', serial_number: 'VMW-42-3D-40-01', os: 'Windows Server 2019', owned_by: 'wei.zhang', support_group: '', last_discovered: daysAgo(2), operational_status: 'Operational' },
    ],

    // parent "depends on" child
    cmdb_rel_ci: [
      { sys_id: 'rel-1', parent: 'svc-payments', child: 'app-payapi', type: 'Depends on::Used by' },
      { sys_id: 'rel-2', parent: 'app-payapi', child: 'ci-payapp01', type: 'Runs on::Runs' },
      { sys_id: 'rel-3', parent: 'app-payapi', child: 'ci-payapp02', type: 'Runs on::Runs' },
      { sys_id: 'rel-4', parent: 'app-payapi', child: 'ci-paydb01', type: 'Depends on::Used by' },
      { sys_id: 'rel-5', parent: 'svc-vpn', child: 'ci-vpngw01', type: 'Depends on::Used by' },
      { sys_id: 'rel-6', parent: 'svc-sap', child: 'ci-sapapp03', type: 'Depends on::Used by' },
    ],

    incident: [
      { sys_id: 'inc-1', number: 'INC0041187', short_description: 'Disk space critical on win-sap-app03 (D: 97%)', description: 'Event Management alert: logical disk D: above 95% threshold for 20 minutes.', caller_id: 'event.management', priority: '2 - High', state: 'New', cmdb_ci: 'ci-sapapp03', assignment_group: 'grp-windows', assigned_to: '', opened_at: hoursAgo(1), work_notes: [] },
      { sys_id: 'inc-2', number: 'INC0041160', short_description: 'Outlook asks for password repeatedly', description: 'Since this morning Outlook prompts for credentials every few minutes.', caller_id: 'riya.sharma', priority: '4 - Low', state: 'In Progress', cmdb_ci: '', assignment_group: 'grp-servicedesk', assigned_to: 'priya.nair', opened_at: daysAgo(1), work_notes: [] },
      { sys_id: 'inc-3', number: 'INC0041102', short_description: 'Cannot print to FIN-3F-PRN02', description: 'Printer on 3rd floor shows offline.', caller_id: 'riya.sharma', priority: '4 - Low', state: 'On Hold', cmdb_ci: '', assignment_group: 'grp-servicedesk', assigned_to: 'priya.nair', opened_at: daysAgo(3), work_notes: [] },
    ],

    sc_req_item: [
      { sys_id: 'ritm-1', number: 'RITM0022871', short_description: 'Laptop refresh: ThinkPad T14s Gen 6', requested_for: 'riya.sharma', state: 'Awaiting fulfilment', stage: 'Procurement', opened_at: daysAgo(6), due_date: iso(now + 2 * DAY) },
      { sys_id: 'ritm-2', number: 'RITM0022904', short_description: 'Access: Power BI Pro license', requested_for: 'riya.sharma', state: 'Pending approval', stage: 'Manager approval', opened_at: daysAgo(2), due_date: iso(now + 3 * DAY) },
    ],

    change_request: [
      { sys_id: 'chg-1', number: 'CHG0030312', short_description: 'vpn-gw-01 PAN-OS upgrade 11.1.1 -> 11.1.2', type: 'Normal', state: 'Closed', close_code: 'Successful', cmdb_ci: 'ci-vpngw01', assignment_group: 'grp-network', risk: 'Moderate', start_date: hoursAgo(20), end_date: hoursAgo(18), backout_plan: 'Boot previous PAN-OS image', test_plan: 'Tunnel smoke test' },
      { sys_id: 'chg-2', number: 'CHG0030340', short_description: 'Payments DB quarterly patch', type: 'Normal', state: 'Scheduled', cmdb_ci: 'ci-paydb01', assignment_group: 'grp-linux', risk: 'Moderate', start_date: iso(satWindow), end_date: iso(satWindow + 2 * HOUR), backout_plan: 'Restore from RMAN backup', test_plan: 'Regression suite' },
      { sys_id: 'chg-4', number: 'CHG0030355', short_description: 'nginx TLS cipher-suite hardening on payments web tier', type: 'Standard', state: 'Closed', close_code: 'Successful', cmdb_ci: 'ci-payapp01', assignment_group: 'grp-linux', risk: 'Low', start_date: hoursAgo(6), end_date: hoursAgo(5), backout_plan: 'Restore previous nginx.conf', test_plan: 'TLS scan' },
      { sys_id: 'chg-3', number: 'CHG0029877', short_description: 'payments-api config change (connection pool)', type: 'Normal', state: 'Closed', close_code: 'Unsuccessful', cmdb_ci: 'app-payapi', assignment_group: 'grp-payments', risk: 'Moderate', start_date: daysAgo(40), end_date: daysAgo(40), backout_plan: 'Revert config', test_plan: '' },
    ],

    maintenance_window: [
      { sys_id: 'mw-sat', name: 'Saturday production window', start: iso(satWindow), end: iso(satWindow + 3 * HOUR) },
      { sys_id: 'mw-wed', name: 'Wednesday late window', start: iso(wedWindow), end: iso(wedWindow + 2 * HOUR) },
    ],

    problem: [],
    kb_knowledge: [
      { sys_id: 'kb-1', number: 'KB0010231', short_description: 'VPN client: reset the Global Protect client cache', workflow_state: 'Published', author: 'priya.nair', text: 'Steps to clear the local GlobalProtect cache on Windows and macOS.' },
      { sys_id: 'kb-2', number: 'KB0010377', short_description: 'Windows servers: safe log and temp cleanup', workflow_state: 'Published', author: 'wei.zhang', text: 'Approved paths for automated cleanup on Windows application servers.' },
    ],

    sn_vul_vulnerable_item: [],
    sys_atf_test: [],
    teams_message: [],

    // Automation catalogue the remediation agents can run
    runbook: [
      { sys_id: 'rb-disk', name: 'Windows: clear temp and archive old logs', match: ['disk', 'space', 'log'], classes: ['cmdb_ci_win_server'], risk: 'Low', kb: 'kb-2',
        commands: ['Get-PSDrive D', 'Remove-Item D:\\Temp\\* -Recurse (older than 7 days)', 'Compress-Archive D:\\SAP\\logs\\*.log -> \\\\archive01\\sap-logs', 'Clear-RecycleBin -DriveLetter D'],
        effect: { disk: 61 } },
      { sys_id: 'rb-vpn', name: 'Firewall: restart IPsec tunnel service and clear stale SAs', match: ['vpn', 'tunnel', 'drop', 'disconnect'], classes: ['cmdb_ci_ip_firewall'], risk: 'Medium', kb: null,
        commands: ['show vpn ipsec-sa summary', 'clear vpn ike-sa gateway all-stale', 'request restart software-process ikemgr', 'test vpn ipsec-sa tunnel corp-remote'],
        effect: { tunnel_flaps_1h: 0, service: 'running', cpu: 38 } },
      { sys_id: 'rb-rollback', name: 'Linux: roll back last change package (dnf history undo)', match: ['rollback', 'tls', 'handshake', 'payments', 'openssl'], classes: ['cmdb_ci_linux_server', 'cmdb_ci_appl'], risk: 'High', kb: null,
        commands: ['dnf history list --reverse | tail -1', 'dnf history undo last -y', 'systemctl restart nginx', 'curl -sS https://payments.local/health'],
        effect: { error_rate: 0.3, latency_ms: 180, tls_handshake_fail: 0, service: 'running' } },
      { sys_id: 'rb-restart', name: 'Linux: restart application service', match: ['restart', 'hung', 'service'], classes: ['cmdb_ci_linux_server'], risk: 'Medium', kb: null,
        commands: ['systemctl status app', 'systemctl restart app', 'systemctl is-active app'], effect: { service: 'running' } },
    ],

    vulnerability_feed: [
      { id: 'CVE-2026-0142', title: 'OpenSSL 3.0.x TLS 1.3 session resumption heap overflow (demo CVE)', package: 'OpenSSL', affected: ['3.0.0', '3.0.15'], fixed_in: '3.0.16', cvss: 9.8, exploited: true, published: daysAgo(0) },
    ],

    // Update-set records the upgrade agent scans
    sys_update_xml: [
      { sys_id: 'cust-1', name: 'BR: Incident - auto assign VIP', type: 'Business Rule', table: 'incident', when: 'before', ootb_modified: false, script: "if (current.caller_id.vip) { current.assignment_group = '8a5055c9c61122780043563ef53438e3'; current.update(); }" },
      { sys_id: 'cust-2', name: 'Client Script: Incident onLoad hide fields', type: 'Client Script', table: 'incident', ootb_modified: false, script: "function onLoad() { var gr = new GlideRecord('sys_user'); gr.get(g_user.userID); document.getElementById('incident.u_vip').style.display='none'; }" },
      { sys_id: 'cust-3', name: 'Script Include: TaskUtils (OOTB, modified)', type: 'Script Include', table: '', ootb_modified: true, script: 'var TaskUtils = Class.create(); /* customer edits in OOTB file */' },
      { sys_id: 'cust-4', name: 'UI Action: Resolve Incident (OOTB, modified)', type: 'UI Action', table: 'incident', ootb_modified: true, script: "current.state = 6; current.update(); action.setRedirectURL(current);" },
      { sys_id: 'cust-5', name: 'BR: Change - sync to Jira', type: 'Business Rule', table: 'change_request', when: 'after', ootb_modified: false, script: "var r = new sn_ws.RESTMessageV2('Jira', 'post'); r.setStringParameterNoEscape('summary', current.short_description); r.executeAsync();" },
      { sys_id: 'cust-6', name: 'Scheduled Job: purge old attachments', type: 'Scheduled Script', table: '', ootb_modified: false, script: "var gr = new GlideRecord('sys_attachment'); gr.setWorkflow(false); gr.addQuery('sys_created_on','<', gs.daysAgo(365)); gr.deleteMultiple();" },
      { sys_id: 'cust-7', name: 'UI Page: legacy approval page (Jelly)', type: 'UI Page', table: '', ootb_modified: false, script: "<g:evaluate> var x = Packages.java.lang.System.currentTimeMillis(); </g:evaluate>" },
      { sys_id: 'cust-8', name: 'Client Script: Change risk banner', type: 'Client Script', table: 'change_request', ootb_modified: false, script: "function onChange(control, oldValue, newValue) { if (newValue == 'High') g_form.showFieldMsg('risk', 'CAB review required', 'error'); }" },
      { sys_id: 'cust-9', name: 'Flow: P1 notify manager', type: 'Flow', table: 'incident', ootb_modified: false, script: 'Trigger: incident priority changes to 1 -> Send notification to assigned_to.manager' },
      { sys_id: 'cust-10', name: 'Form layout: Incident default view (OOTB, modified)', type: 'Form Layout', table: 'incident', ootb_modified: true, script: '' },
    ],

    user_story: [
      { id: 'STRY0010441', title: 'P1 incident notifies the assignee\'s manager', table: 'incident', acceptance: ['When priority becomes 1 - Critical, a notification is sent to the manager of the assigned user', 'The notification includes the incident number'] },
      { id: 'STRY0010458', title: 'VIP callers are routed to the VIP desk', table: 'incident', acceptance: ['Incident created for a VIP caller is assigned to the VIP Service Desk group'] },
      { id: 'STRY0010463', title: 'High-risk changes show a CAB banner', table: 'change_request', acceptance: ['Setting Risk to High shows "CAB review required" under the Risk field'] },
    ],
  };
}
