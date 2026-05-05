/* =====================================================================
   admin-maintenance-tabbed.js — Maintenance tabbed wrapper (Phase 10)
   Tabs: Overview | Complaints | Work Order | Records
   ===================================================================== */

(function () {
  'use strict';

  const TABS = [
    { id: 'overview',   label: 'Overview',   icon: 'fa-screwdriver-wrench' },
    { id: 'complaints', label: 'Complaints', icon: 'fa-comment-dots' },
    { id: 'workorder',  label: 'Work Order', icon: 'fa-clipboard-list' },
    { id: 'records',    label: 'Records',    icon: 'fa-folder-open' }
  ];

  function init({ content, currentUser }) {
    let activeTab = 'overview';

    function render() {
      content.innerHTML = `
        <div class="section-header">
          <div>
            <div class="section-title">Maintenance</div>
            <div class="section-subtitle">Reports overview, resident complaints, technician work orders, and historical records</div>
          </div>
        </div>

        <div class="tabs" role="tablist">
          ${TABS.map(t => `
            <button type="button" class="tabs__btn ${t.id === activeTab ? 'is-active' : ''}" data-tab="${t.id}" role="tab" aria-selected="${t.id === activeTab}">
              <i class="fa-solid ${t.icon}" aria-hidden="true"></i>&nbsp;${t.label}
            </button>
          `).join('')}
        </div>

        <div id="maint-tab-panel" class="tabs__panel is-active" role="tabpanel"></div>
      `;
      content.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => { activeTab = btn.dataset.tab; render(); });
      });
      renderPanel();
    }

    function renderPanel() {
      const panel = content.querySelector('#maint-tab-panel');
      if (!panel) return;
      if (activeTab === 'overview')   return renderOverview(panel);
      if (activeTab === 'complaints') return renderComplaints(panel);
      if (activeTab === 'workorder')  return renderWorkOrder(panel);
      if (activeTab === 'records')    return renderRecords(panel);
    }

    function renderOverview(panel) {
      panel.innerHTML = '<div class="card card-pad" id="maint-overview-mount"></div>';
      const mount = panel.querySelector('#maint-overview-mount');
      if (typeof window.adminMaintenanceInit === 'function') {
        window.adminMaintenanceInit({ content: mount });
      } else {
        mount.innerHTML = '<div class="empty-state"><i class="fa-solid fa-screwdriver-wrench"></i><h3>Maintenance module not loaded</h3></div>';
      }
    }

    function renderComplaints(panel) {
      const helpdesk = (store.readAll('helpdesk') || []).filter(h => h.category === 'room' || h.category === 'access');
      const facilityComplaints = [
        { id: 'CM-001', resident: 'Ahmad Faiz',   block: 'A', subject: 'Hot water inconsistent in shared bathroom',  reportedAt: '2 days ago', status: 'open' },
        { id: 'CM-002', resident: 'Siti Aminah',  block: 'A', subject: 'Common area lights flickering at night',     reportedAt: '5 days ago', status: 'in_progress' },
        { id: 'CM-003', resident: 'Lee Wei',      block: 'C', subject: 'Cafeteria seating insufficient at lunch',    reportedAt: '1 week ago', status: 'resolved' }
      ];
      panel.innerHTML = `
        <div class="card card-pad stub-section">
          <div class="stub-section__banner">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; resident complaints view. Multi-stage resolution flow + SLA tracking ship in Phase 2.</span>
          </div>
          <div class="stub-section__layout">
            <div>
              <h4 style="margin-top: 0;">Facility Complaints</h4>
              <table class="table">
                <thead><tr><th>ID</th><th>Resident</th><th>Block</th><th>Subject</th><th>Status</th><th>Reported</th></tr></thead>
                <tbody>
                  ${[...facilityComplaints, ...helpdesk.map(h => ({ id: h.id, resident: h.requester, block: '-', subject: h.subject, reportedAt: ui.formatRelative(h.createdAt), status: h.status }))].map(c => `
                    <tr>
                      <td>${ui.escapeHtml(c.id)}</td>
                      <td>${ui.escapeHtml(c.resident)}</td>
                      <td>${ui.escapeHtml(c.block)}</td>
                      <td>${ui.escapeHtml(c.subject)}</td>
                      <td><span class="badge badge--${c.status === 'resolved' ? 'success' : c.status === 'in_progress' ? 'warning' : 'danger'}">${ui.escapeHtml((c.status || '').replace('_', ' '))}</span></td>
                      <td>${ui.escapeHtml(c.reportedAt)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <aside class="stub-section__aside">
              <h4>Coming next</h4>
              <ul>
                <li>Multi-stage resolution</li>
                <li>SLA tracking</li>
                <li>Resident feedback loop</li>
                <li>Auto-route by category</li>
              </ul>
            </aside>
          </div>
        </div>
      `;
    }

    function renderWorkOrder(panel) {
      const orders = [
        { id: 'WO-001', task: 'Replace faulty AC unit (R-118)',     assigned: 'AC Tech Co', priority: 'high',   status: 'in_progress', eta: 'Tomorrow' },
        { id: 'WO-002', task: 'Re-key main entrance Block A',       assigned: 'Locksmith',  priority: 'high',   status: 'open',        eta: 'Today' },
        { id: 'WO-003', task: 'Quarterly fire extinguisher service',assigned: 'SafeMY',     priority: 'medium', status: 'scheduled',   eta: 'May 12' },
        { id: 'WO-004', task: 'Garden landscaping refresh',         assigned: 'GreenLeaf',  priority: 'low',    status: 'completed',   eta: '-' }
      ];
      panel.innerHTML = `
        <div class="card card-pad stub-section">
          <div class="stub-section__banner">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; work order tracking. Vendor portal + parts inventory ship in Phase 2.</span>
          </div>
          <div class="stub-section__layout">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
                <h4 style="margin: 0;">Active Work Orders</h4>
                <button class="btn btn-primary btn-sm" type="button"><i class="fa-solid fa-plus"></i>&nbsp;New Work Order</button>
              </div>
              <table class="table">
                <thead><tr><th>ID</th><th>Task</th><th>Assigned</th><th>Priority</th><th>Status</th><th>ETA</th></tr></thead>
                <tbody>
                  ${orders.map(o => `
                    <tr>
                      <td>${ui.escapeHtml(o.id)}</td>
                      <td>${ui.escapeHtml(o.task)}</td>
                      <td>${ui.escapeHtml(o.assigned)}</td>
                      <td><span class="badge badge--${o.priority === 'high' ? 'danger' : o.priority === 'medium' ? 'warning' : ''}">${ui.escapeHtml(o.priority)}</span></td>
                      <td>${ui.escapeHtml(o.status.replace('_', ' '))}</td>
                      <td>${ui.escapeHtml(o.eta)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <aside class="stub-section__aside">
              <h4>Coming next</h4>
              <ul>
                <li>Vendor portal</li>
                <li>Parts inventory</li>
                <li>Cost tracking</li>
                <li>Photo evidence</li>
              </ul>
            </aside>
          </div>
        </div>
      `;
    }

    function renderRecords(panel) {
      const resolved = (store.readAll('maintenance') || []).filter(m => m.status === 'resolved');
      panel.innerHTML = `
        <div class="card card-pad stub-section">
          <div class="stub-section__banner">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; resolved maintenance archive. Searchable filter + cost reporting ship in Phase 2.</span>
          </div>
          <div class="stub-section__layout">
            <div>
              <h4 style="margin-top: 0;">Resolved Records</h4>
              <table class="table">
                <thead><tr><th>ID</th><th>Room</th><th>Issue</th><th>Resolved By</th><th>Resolution</th><th>When</th></tr></thead>
                <tbody>
                  ${resolved.map(r => `
                    <tr>
                      <td>${ui.escapeHtml(r.id)}</td>
                      <td>${ui.escapeHtml(r.roomId)}</td>
                      <td>${ui.escapeHtml(r.title)}</td>
                      <td>${ui.escapeHtml(r.assignedTo || '-')}</td>
                      <td style="font-size: 12px; color: var(--ink-500);">${ui.escapeHtml(r.notes || '-')}</td>
                      <td>${ui.formatRelative(r.reportedAt)}</td>
                    </tr>
                  `).join('')}
                  ${resolved.length === 0 ? '<tr><td colspan="6" style="text-align: center; color: var(--ink-500); padding: var(--space-6);">No resolved records yet</td></tr>' : ''}
                </tbody>
              </table>
            </div>
            <aside class="stub-section__aside">
              <h4>Coming next</h4>
              <ul>
                <li>Searchable filter</li>
                <li>Cost reporting</li>
                <li>Per-room history</li>
                <li>Export to CSV</li>
              </ul>
            </aside>
          </div>
        </div>
      `;
    }

    render();
  }

  window.adminMaintenanceTabbedInit = init;
})();
