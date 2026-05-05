/* =====================================================================
   admin-maintenance-tabbed.js — Maintenance tabbed wrapper
   Tabs: Overview | Complaints | Work Order | Records
   Phase 10 (desktop) + Phase MM (mobile-native per-tab renders)
   ===================================================================== */

(function () {
  'use strict';

  function isMobile() { return window.innerWidth <= 900; }

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
      if (isMobile()) return renderMobileOverview(panel);
      panel.innerHTML = '<div class="card card-pad" id="maint-overview-mount"></div>';
      const mount = panel.querySelector('#maint-overview-mount');
      if (typeof window.adminMaintenanceInit === 'function') {
        window.adminMaintenanceInit({ content: mount });
      } else {
        mount.innerHTML = '<div class="empty-state"><i class="fa-solid fa-screwdriver-wrench"></i><h3>Maintenance module not loaded</h3></div>';
      }
    }

    function statusBadgeClass(s) {
      if (s === 'resolved' || s === 'completed') return 'success';
      if (s === 'in_progress' || s === 'scheduled') return 'warning';
      return 'danger';
    }

    function priorityBadgeClass(p) {
      if (p === 'high') return 'danger';
      if (p === 'medium') return 'warning';
      return '';
    }

    function renderMobileOverview(panel) {
      const all = store.readAll('maintenance') || [];
      const open = all.filter(m => m.status !== 'resolved');
      const resolved = all.filter(m => m.status === 'resolved');
      const urgent = all.filter(m => m.urgency === 'high' && m.status !== 'resolved').length;
      const sorted = [...all].sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));

      panel.innerHTML = `
        <div class="m-greeting" style="padding: var(--space-2) var(--space-2) var(--space-3);">
          <div class="m-greeting__hello">Maintenance</div>
          <div class="m-greeting__date">${all.length} reports tracked</div>
        </div>

        <div class="m-hero-card">
          <div class="m-hero-card__label">Pending Reports</div>
          <div class="m-hero-card__value">${open.length}</div>
          <div class="m-hero-card__bar">
            <div class="m-hero-card__bar-fill" style="width: ${all.length ? Math.round(resolved.length / all.length * 100) : 0}%;"></div>
          </div>
          <div class="m-hero-card__summary">
            <span><i class="dot dot--occupied"></i> ${resolved.length} resolved</span>
            <span><i class="dot dot--maintenance"></i> ${open.length - urgent} in progress</span>
            <span><i class="dot dot--overdue"></i> ${urgent} urgent</span>
          </div>
        </div>

        <div class="m-stats-row">
          <div class="m-stat-card">
            <div class="m-stat-card__label">Total Reports</div>
            <div class="m-stat-card__value">${all.length}</div>
            <div class="m-stat-card__delta">all time</div>
          </div>
          <div class="m-stat-card">
            <div class="m-stat-card__label">Resolved</div>
            <div class="m-stat-card__value">${resolved.length}</div>
            <div class="m-stat-card__delta">closed reports</div>
          </div>
        </div>

        <div class="m-section-label">Maintenance Reports <span class="m-carousel-hint">${sorted.length}</span></div>
        <div class="m-list-card">
          ${sorted.map(m => `
            <div class="m-list-card__row">
              <i class="fa-solid fa-screwdriver-wrench activity-feed__icon activity-feed__icon--maintenance" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(m.roomId)} &middot; ${ui.escapeHtml(m.title)}</span>
                <span class="m-list-card__meta">By ${ui.escapeHtml(m.reportedBy)} &middot; ${ui.escapeHtml(m.category)}</span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
                <span class="badge badge--${statusBadgeClass(m.status)}" style="font-size: 10px;">${ui.escapeHtml((m.status || '').replace('_', ' ').toUpperCase())}</span>
                <span class="m-list-card__time">${ui.formatRelative(m.reportedAt)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    function renderComplaints(panel) {
      if (isMobile()) return renderMobileComplaints(panel);
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

    function renderMobileComplaints(panel) {
      const helpdesk = (store.readAll('helpdesk') || []).filter(h => h.category === 'room' || h.category === 'access');
      const facility = [
        { id: 'CM-001', resident: 'Ahmad Faiz',   block: 'A', subject: 'Hot water inconsistent in shared bathroom',  reportedAt: '2 days ago', status: 'open' },
        { id: 'CM-002', resident: 'Siti Aminah',  block: 'A', subject: 'Common area lights flickering at night',     reportedAt: '5 days ago', status: 'in_progress' },
        { id: 'CM-003', resident: 'Lee Wei',      block: 'C', subject: 'Cafeteria seating insufficient at lunch',    reportedAt: '1 week ago', status: 'resolved' }
      ];
      const merged = [...facility, ...helpdesk.map(h => ({ id: h.id, resident: h.requester, block: '-', subject: h.subject, reportedAt: ui.formatRelative(h.createdAt), status: h.status }))];

      panel.innerHTML = `
        <div class="card card-pad stub-section" style="margin-bottom: var(--space-3);">
          <div class="stub-section__banner" style="margin-bottom: 0;">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; SLA tracking ships in Phase 2.</span>
          </div>
        </div>

        <div class="m-section-label">Facility Complaints <span class="m-carousel-hint">${merged.length}</span></div>
        <div class="m-list-card">
          ${merged.map(c => `
            <div class="m-list-card__row">
              <i class="fa-solid fa-comment-dots activity-feed__icon activity-feed__icon--maintenance" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(c.id)} &middot; ${ui.escapeHtml(c.resident)}</span>
                <span class="m-list-card__meta">${ui.escapeHtml(c.subject)}</span>
                <span class="m-list-card__meta" style="font-size: 11px; opacity: 0.7;">Block ${ui.escapeHtml(c.block)}</span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
                <span class="badge badge--${statusBadgeClass(c.status)}" style="font-size: 10px;">${ui.escapeHtml((c.status || '').replace('_', ' ').toUpperCase())}</span>
                <span class="m-list-card__time">${ui.escapeHtml(c.reportedAt)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    function renderWorkOrder(panel) {
      if (isMobile()) return renderMobileWorkOrder(panel);
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

    function renderMobileWorkOrder(panel) {
      const orders = [
        { id: 'WO-001', task: 'Replace faulty AC unit (R-118)',     assigned: 'AC Tech Co', priority: 'high',   status: 'in_progress', eta: 'Tomorrow' },
        { id: 'WO-002', task: 'Re-key main entrance Block A',       assigned: 'Locksmith',  priority: 'high',   status: 'open',        eta: 'Today' },
        { id: 'WO-003', task: 'Quarterly fire extinguisher service',assigned: 'SafeMY',     priority: 'medium', status: 'scheduled',   eta: 'May 12' },
        { id: 'WO-004', task: 'Garden landscaping refresh',         assigned: 'GreenLeaf',  priority: 'low',    status: 'completed',   eta: '-' }
      ];

      panel.innerHTML = `
        <div class="card card-pad stub-section" style="margin-bottom: var(--space-3);">
          <div class="stub-section__banner" style="margin-bottom: 0;">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; vendor portal ships in Phase 2.</span>
          </div>
        </div>

        <button class="btn btn-primary" type="button" style="width: 100%; padding: 12px; margin-bottom: var(--space-4);">
          <i class="fa-solid fa-plus" aria-hidden="true"></i>&nbsp;New Work Order
        </button>

        <div class="m-section-label">Active Work Orders <span class="m-carousel-hint">${orders.length}</span></div>
        <div class="m-list-card">
          ${orders.map(o => `
            <div class="m-list-card__row">
              <i class="fa-solid fa-clipboard-list activity-feed__icon activity-feed__icon--${o.priority === 'high' ? 'maintenance' : 'pickup'}" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(o.id)} &middot; ${ui.escapeHtml(o.task)}</span>
                <span class="m-list-card__meta">${ui.escapeHtml(o.assigned)} &middot; ETA ${ui.escapeHtml(o.eta)}</span>
                <span class="m-list-card__meta" style="font-size: 11px; opacity: 0.7;">${ui.escapeHtml((o.status || '').replace('_', ' '))}</span>
              </div>
              <span class="badge badge--${priorityBadgeClass(o.priority)}" style="font-size: 10px; flex-shrink: 0;">${ui.escapeHtml(o.priority.toUpperCase())}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    function renderRecords(panel) {
      if (isMobile()) return renderMobileRecords(panel);
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

    function renderMobileRecords(panel) {
      const resolved = (store.readAll('maintenance') || []).filter(m => m.status === 'resolved');

      panel.innerHTML = `
        <div class="card card-pad stub-section" style="margin-bottom: var(--space-3);">
          <div class="stub-section__banner" style="margin-bottom: 0;">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; cost reporting ships in Phase 2.</span>
          </div>
        </div>

        <div class="m-section-label">Resolved Archive <span class="m-carousel-hint">${resolved.length}</span></div>
        <div class="m-list-card">
          ${resolved.map(r => `
            <div class="m-list-card__row">
              <i class="fa-solid fa-circle-check activity-feed__icon activity-feed__icon--payment" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(r.roomId)} &middot; ${ui.escapeHtml(r.title)}</span>
                <span class="m-list-card__meta">By ${ui.escapeHtml(r.assignedTo || '-')}</span>
                <span class="m-list-card__meta" style="font-size: 11px; opacity: 0.7;">${ui.escapeHtml(r.notes || '-')}</span>
              </div>
              <span class="m-list-card__time">${ui.formatRelative(r.reportedAt)}</span>
            </div>
          `).join('')}
          ${resolved.length === 0 ? '<div class="m-list-card__row" style="justify-content: center; color: var(--ink-500);">No resolved records yet</div>' : ''}
        </div>
      `;
    }

    render();
  }

  window.adminMaintenanceTabbedInit = init;
})();
