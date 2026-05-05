/* =====================================================================
   admin-helpdesk.js — Helpdesk single-view (Phase 12)
   ===================================================================== */

(function () {
  'use strict';

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

  function init({ content, currentUser }) {
    const tickets = store.readAll('helpdesk') || [];
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;

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
