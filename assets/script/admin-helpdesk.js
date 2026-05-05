/* =====================================================================
   admin-helpdesk.js — Helpdesk single-view
   Phase 12 (desktop) + Phase MHD (mobile-native render)
   ===================================================================== */

(function () {
  'use strict';

  function isMobile() { return window.innerWidth <= 900; }

  function priorityBadge(p) {
    if (p === 'high')   return '<span class="badge badge--danger">HIGH</span>';
    if (p === 'medium') return '<span class="badge badge--warning">MEDIUM</span>';
    return '<span class="badge">LOW</span>';
  }

  function statusBadge(s) {
    if (s === 'open')        return '<span class="badge badge--danger">OPEN</span>';
    if (s === 'in_progress') return '<span class="badge badge--warning">IN PROGRESS</span>';
    if (s === 'resolved')    return '<span class="badge badge--success">RESOLVED</span>';
    return `<span class="badge">${ui.escapeHtml((s || '').toUpperCase())}</span>`;
  }

  function priorityIcon(p) {
    if (p === 'high')   return 'fa-circle-exclamation';
    if (p === 'medium') return 'fa-circle-dot';
    return 'fa-circle';
  }

  function init({ content, currentUser }) {
    const tickets = store.readAll('helpdesk') || [];
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;

    if (isMobile()) {
      renderMobile(content, tickets, open, inProgress, resolved);
    } else {
      renderDesktop(content, tickets, open, inProgress, resolved);
    }
    wireActions(content, tickets);
  }

  function renderDesktop(content, tickets, open, inProgress, resolved) {
    content.innerHTML = `
      <div class="section-header">
        <div>
          <div class="section-title">Helpdesk</div>
          <div class="section-subtitle">Resident support tickets, response queue, and resolution tracking</div>
        </div>
      </div>

      <div class="kpi-strip" style="grid-template-columns: repeat(4, 1fr); margin-bottom: var(--space-4);">
        <div class="kpi-tile"><div class="kpi-tile__label">Open</div><div class="kpi-tile__value">${open}</div></div>
        <div class="kpi-tile"><div class="kpi-tile__label">In Progress</div><div class="kpi-tile__value">${inProgress}</div></div>
        <div class="kpi-tile"><div class="kpi-tile__label">Resolved</div><div class="kpi-tile__value">${resolved}</div></div>
        <div class="kpi-tile"><div class="kpi-tile__label">Total</div><div class="kpi-tile__value">${tickets.length}</div></div>
      </div>

      <div class="card card-pad">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
          <h3 style="margin: 0;">All Tickets</h3>
          <button class="btn btn-primary btn-sm" type="button" data-new-ticket><i class="fa-solid fa-plus"></i>&nbsp;New Ticket</button>
        </div>
        <table class="table">
          <thead><tr><th>ID</th><th>Subject</th><th>Requester</th><th>Category</th><th>Priority</th><th>Status</th><th>Assigned</th><th>Created</th><th>Action</th></tr></thead>
          <tbody>
            ${tickets.map(t => `
              <tr>
                <td>${ui.escapeHtml(t.id)}</td>
                <td>${ui.escapeHtml(t.subject)}</td>
                <td>${ui.escapeHtml(t.requester)}</td>
                <td>${ui.escapeHtml(t.category)}</td>
                <td>${priorityBadge(t.priority)}</td>
                <td>${statusBadge(t.status)}</td>
                <td>${ui.escapeHtml(t.assignedTo || 'Unassigned')}</td>
                <td>${ui.formatRelative(t.createdAt)}</td>
                <td><button class="btn btn-ghost btn-sm" type="button" data-view="${ui.escapeHtml(t.id)}">View</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderMobile(content, tickets, open, inProgress, resolved) {
    content.innerHTML = `
      <div class="m-greeting" style="padding: var(--space-2) var(--space-2) var(--space-3);">
        <div class="m-greeting__hello">Helpdesk</div>
        <div class="m-greeting__date">${tickets.length} support tickets</div>
      </div>

      <div class="m-hero-card">
        <div class="m-hero-card__label">Open Tickets</div>
        <div class="m-hero-card__value">${open}</div>
        <div class="m-hero-card__bar">
          <div class="m-hero-card__bar-fill" style="width: ${tickets.length ? Math.round(resolved / tickets.length * 100) : 0}%;"></div>
        </div>
        <div class="m-hero-card__summary">
          <span><i class="dot dot--overdue"></i> ${open} open</span>
          <span><i class="dot dot--maintenance"></i> ${inProgress} in progress</span>
          <span><i class="dot dot--paid"></i> ${resolved} resolved</span>
        </div>
      </div>

      <div class="m-stats-row">
        <div class="m-stat-card">
          <div class="m-stat-card__label">In Progress</div>
          <div class="m-stat-card__value">${inProgress}</div>
          <div class="m-stat-card__delta">being handled</div>
        </div>
        <div class="m-stat-card">
          <div class="m-stat-card__label">Resolved</div>
          <div class="m-stat-card__value">${resolved}</div>
          <div class="m-stat-card__delta">closed tickets</div>
        </div>
      </div>

      <button class="btn btn-primary" type="button" data-new-ticket style="width: 100%; padding: 12px; margin-bottom: var(--space-4);">
        <i class="fa-solid fa-plus" aria-hidden="true"></i>&nbsp;New Ticket
      </button>

      <div class="m-section-label">All Tickets <span class="m-carousel-hint">${tickets.length}</span></div>
      <div class="m-list-card">
        ${tickets.map(t => `
          <div class="m-list-card__row m-room-row" data-view="${ui.escapeHtml(t.id)}">
            <i class="fa-solid ${priorityIcon(t.priority)} activity-feed__icon activity-feed__icon--${t.priority === 'high' ? 'maintenance' : 'pickup'}" aria-hidden="true"></i>
            <div class="m-list-card__main">
              <span class="m-list-card__title">${ui.escapeHtml(t.id)} &middot; ${ui.escapeHtml(t.subject)}</span>
              <span class="m-list-card__meta">${ui.escapeHtml(t.requester)} &middot; ${ui.escapeHtml(t.category)}</span>
              <span class="m-list-card__meta" style="font-size: 11px; opacity: 0.7;">${ui.escapeHtml(t.assignedTo || 'Unassigned')}</span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
              ${statusBadge(t.status).replace('class="badge', 'class="badge" style="font-size: 10px;"').replace('class="badge"', 'class="badge"')}
              <span class="m-list-card__time">${ui.formatRelative(t.createdAt)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function wireActions(content, tickets) {
    const newBtn = content.querySelector('[data-new-ticket]');
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        ui.openModal({
          title: 'New Helpdesk Ticket',
          body: `
            <label class="field"><span class="field__label">Subject</span><input class="field__input" type="text" placeholder="Brief summary" /></label>
            <label class="field"><span class="field__label">Category</span><select class="field__input"><option>Account</option><option>Access</option><option>Room</option><option>Billing</option><option>Other</option></select></label>
            <label class="field"><span class="field__label">Priority</span><select class="field__input"><option>Low</option><option>Medium</option><option>High</option></select></label>
            <label class="field"><span class="field__label">Description</span><textarea class="field__input" rows="4" placeholder="Tell us what happened..."></textarea></label>
          `,
          footer: '<button class="btn btn-ghost" data-modal-close>Cancel</button> <button class="btn btn-primary" data-modal-close>Create Ticket</button>'
        });
      });
    }

    content.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.view;
        const t = tickets.find(x => x.id === id);
        if (!t) return;
        ui.openDrawer({
          title: `${t.id} - ${t.subject}`,
          body: `
            <div style="display: grid; gap: var(--space-3); font-size: 14px;">
              <div><strong>Requester:</strong> ${ui.escapeHtml(t.requester)}</div>
              <div><strong>Category:</strong> ${ui.escapeHtml(t.category)}</div>
              <div><strong>Priority:</strong> ${priorityBadge(t.priority)}</div>
              <div><strong>Status:</strong> ${statusBadge(t.status)}</div>
              <div><strong>Assigned to:</strong> ${ui.escapeHtml(t.assignedTo || 'Unassigned')}</div>
              <div><strong>Created:</strong> ${ui.formatRelative(t.createdAt)}</div>
              <div><strong>Last update:</strong> ${ui.formatRelative(t.updatedAt)}</div>
              <div style="padding-top: var(--space-3); border-top: 1px solid var(--ink-300);">
                <strong>Reply</strong>
                <textarea class="field__input" rows="3" placeholder="Type a response..." style="margin-top: 8px;"></textarea>
              </div>
            </div>
          `,
          footer: '<button class="btn btn-ghost" data-drawer-close>Close</button> <button class="btn btn-primary" data-drawer-close>Send Reply</button>'
        });
      });
    });
  }

  window.adminHelpdeskInit = init;
})();
