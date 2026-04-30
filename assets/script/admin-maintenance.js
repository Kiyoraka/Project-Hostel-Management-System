/* =====================================================================
   admin-maintenance.js — Admin Maintenance section
   ===================================================================== */

(function () {
  'use strict';

  let state = { status: 'all' };

  function render(content) {
    const all = store.readAll('maintenance');
    let rows = state.status === 'all' ? all : all.filter(m => m.status === state.status);
    rows = [...rows].sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));

    content.innerHTML = `
      <div class="section-header">
        <div>
          <div class="section-title">Maintenance Reports</div>
          <div class="section-subtitle">${rows.length} report${rows.length === 1 ? '' : 's'}</div>
        </div>
        <button type="button" class="btn btn-secondary" data-export>
          <i class="fa-solid fa-file-export"></i> Export CSV
        </button>
      </div>

      <div class="filter-bar">
        <div class="filter-bar__pills">
          ${[['all', 'All'], ['new', 'New'], ['in_progress', 'In Progress'], ['resolved', 'Resolved']].map(([k, label]) => `
            <button class="filter-bar__pill ${state.status === k ? 'is-active' : ''}" data-status="${k}">${label}</button>
          `).join('')}
        </div>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Room</th>
              <th>Issue</th>
              <th>Reporter</th>
              <th>Reported</th>
              <th>Urgency</th>
              <th>Status</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length === 0
              ? '<tr><td colspan="8" style="text-align:center; padding: 32px; color: var(--ink-500);">No reports match this filter</td></tr>'
              : rows.map(m => `
                <tr data-row="${m.id}" style="cursor: pointer;">
                  <td><code>${ui.escapeHtml(m.id)}</code></td>
                  <td><code>${ui.escapeHtml(m.roomId)}</code></td>
                  <td>${ui.escapeHtml(m.title)} ${m.photos ? `<i class="fa-solid fa-camera" style="color: var(--ink-400); margin-left: 4px;" title="${m.photos} photo(s)"></i>` : ''}</td>
                  <td>${ui.escapeHtml(m.reportedBy)}</td>
                  <td><span class="text-mute">${ui.formatRelative(m.reportedAt)}</span></td>
                  <td>${urgencyBadge(m.urgency)}</td>
                  <td>${statusBadge(m.status)}</td>
                  <td style="text-align:right;">
                    <button class="btn btn-ghost btn-sm" data-view="${m.id}">View</button>
                  </td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    `;

    content.querySelectorAll('[data-status]').forEach(b => {
      b.addEventListener('click', () => { state.status = b.dataset.status; render(content); });
    });
    content.querySelectorAll('[data-row], [data-view]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = el.dataset.row || el.dataset.view;
        openMaintenanceDrawer(id, content);
      });
    });
    content.querySelector('[data-export]').addEventListener('click', () => exportCsv(rows));
  }

  function urgencyBadge(u) {
    if (u === 'high') return '<span class="badge badge-danger">High</span>';
    if (u === 'medium') return '<span class="badge badge-warning">Medium</span>';
    return '<span class="badge badge-neutral">Low</span>';
  }
  function statusBadge(s) {
    if (s === 'new') return '<span class="badge badge-info">New</span>';
    if (s === 'in_progress') return '<span class="badge badge-warning">In Progress</span>';
    if (s === 'resolved') return '<span class="badge badge-success">Resolved</span>';
    return '<span class="badge badge-neutral">' + s + '</span>';
  }

  function openMaintenanceDrawer(id, content) {
    const m = store.findById('maintenance', id);
    if (!m) return;
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="card-pad-sm" style="background: var(--brand-tint); border-radius: var(--radius-input); margin-bottom: 16px;">
        <div style="font-size: 13px; color: var(--brand-ink); font-weight: 600;">${ui.escapeHtml(m.id)} · Room ${ui.escapeHtml(m.roomId)}</div>
      </div>
      <h3 class="mb-2">${ui.escapeHtml(m.title)}</h3>
      <div style="font-size: 13px; color: var(--ink-500); margin-bottom: 16px;">
        Reported by ${ui.escapeHtml(m.reportedBy)} · ${ui.formatDate(m.reportedAt, 'long')}
      </div>
      <p style="margin-bottom: 16px;">${ui.escapeHtml(m.description)}</p>
      ${m.photos ? `
        <div class="field-label">Photos (${m.photos})</div>
        <div class="photo-grid mb-4">
          ${Array.from({ length: m.photos }, () => '<div class="photo-thumb"><i class="fa-solid fa-image"></i></div>').join('')}
        </div>
      ` : ''}
      <form class="maint-form">
        <div class="field">
          <label class="field-label" for="mf-status">Status</label>
          <select class="select" id="mf-status" name="status">
            <option value="new" ${m.status === 'new' ? 'selected' : ''}>New</option>
            <option value="in_progress" ${m.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
            <option value="resolved" ${m.status === 'resolved' ? 'selected' : ''}>Resolved</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label" for="mf-assigned">Assigned to</label>
          <input class="input" id="mf-assigned" name="assignedTo" value="${ui.escapeHtml(m.assignedTo || '')}" placeholder="e.g. Maintenance Team">
        </div>
        <div class="field">
          <label class="field-label" for="mf-notes">Internal notes</label>
          <textarea class="textarea" id="mf-notes" name="notes" rows="3">${ui.escapeHtml(m.notes || '')}</textarea>
        </div>
      </form>
    `;
    const footer = document.createElement('div');
    footer.style.display = 'flex'; footer.style.gap = '12px';
    const cancel = document.createElement('button');
    cancel.className = 'btn btn-secondary';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', () => ui.closeDrawer());
    const save = document.createElement('button');
    save.className = 'btn btn-primary';
    save.textContent = 'Save changes';
    save.addEventListener('click', () => {
      const form = body.querySelector('.maint-form');
      const data = Object.fromEntries(new FormData(form).entries());
      store.update('maintenance', m.id, data);
      ui.toast('Report updated.', 'success');
      ui.closeDrawer();
      render(content);
    });
    footer.appendChild(cancel); footer.appendChild(save);
    ui.openDrawer({ title: m.id + ': ' + m.title, body, footer });
  }

  function exportCsv(rows) {
    const headers = ['ID', 'Room', 'Title', 'Reporter', 'Urgency', 'Status', 'Reported At'];
    const lines = [headers.join(',')];
    rows.forEach(r => {
      lines.push([r.id, r.roomId, '"' + (r.title || '').replace(/"/g, '""') + '"', r.reportedBy, r.urgency, r.status, r.reportedAt].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'maintenance-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    ui.toast('CSV exported.', 'success');
  }

  window.adminMaintenanceInit = function ({ content }) {
    render(content);
  };
})();
