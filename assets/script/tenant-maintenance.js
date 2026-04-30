/* =====================================================================
   tenant-maintenance.js — Tenant maintenance reports
   ===================================================================== */

(function () {
  'use strict';

  window.tenantMaintenanceInit = function ({ content, currentUser }) {
    render(content, currentUser);
  };

  function render(content, currentUser) {
    const reports = [...store.filter('maintenance', m => m.userId === currentUser.id)]
      .sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));

    content.innerHTML = `
      <div class="section-header">
        <div>
          <div class="section-title">My Maintenance Reports</div>
          <div class="section-subtitle">${reports.length} report${reports.length === 1 ? '' : 's'}</div>
        </div>
        <button type="button" class="btn btn-primary" data-submit>
          <i class="fa-solid fa-plus"></i> Submit Report
        </button>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Issue</th>
              <th>Submitted</th>
              <th>Urgency</th>
              <th>Status</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${reports.length === 0
              ? '<tr><td colspan="6" style="text-align:center; padding: 32px; color: var(--ink-500);">No reports yet — click Submit Report when something breaks</td></tr>'
              : reports.map(r => `
                <tr>
                  <td><code>${ui.escapeHtml(r.id)}</code></td>
                  <td>${ui.escapeHtml(r.title)}</td>
                  <td><span class="text-mute">${ui.formatRelative(r.reportedAt)}</span></td>
                  <td>${urgencyBadge(r.urgency)}</td>
                  <td>${statusBadge(r.status)}</td>
                  <td style="text-align:right;">
                    <button class="btn btn-ghost btn-sm" data-view="${r.id}">View</button>
                  </td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    `;

    content.querySelector('[data-submit]').addEventListener('click', () => openSubmitModal(content, currentUser));
    content.querySelectorAll('[data-view]').forEach(b => {
      b.addEventListener('click', () => openViewDrawer(b.dataset.view));
    });
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

  function openSubmitModal(content, currentUser) {
    const body = document.createElement('div');
    body.innerHTML = `
      <form class="maint-form">
        <div class="field">
          <label class="field-label">Room</label>
          <input class="input" value="${ui.escapeHtml(currentUser.roomId)}" readonly>
        </div>
        <div class="field">
          <label class="field-label" for="mf-cat">Category</label>
          <select class="select" id="mf-cat" name="category" required>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="security">Security</option>
            <option value="internet">Internet / WiFi</option>
            <option value="furniture">Furniture</option>
            <option value="cleanliness">Cleanliness</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label" for="mf-title">Title</label>
          <input class="input" id="mf-title" name="title" required maxlength="80" placeholder="Short summary, e.g. Leaky tap">
        </div>
        <div class="field">
          <label class="field-label" for="mf-desc">Description</label>
          <textarea class="textarea" id="mf-desc" name="description" rows="4" required placeholder="Tell us what's happening..."></textarea>
        </div>
        <div class="field">
          <label class="field-label">Urgency</label>
          <div class="flex gap-3">
            <label><input type="radio" name="urgency" value="low"> Low</label>
            <label><input type="radio" name="urgency" value="medium" checked> Medium</label>
            <label><input type="radio" name="urgency" value="high"> High</label>
          </div>
        </div>
        <div class="field">
          <label class="field-label" for="mf-photos">Photos (optional, max 3)</label>
          <input class="input" id="mf-photos" name="photoCount" type="file" accept="image/*" multiple>
        </div>
      </form>
    `;
    const footer = document.createElement('div');
    footer.style.display = 'flex'; footer.style.gap = '12px';
    const cancel = document.createElement('button');
    cancel.className = 'btn btn-secondary';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', () => ui.closeModal());
    const save = document.createElement('button');
    save.className = 'btn btn-primary';
    save.textContent = 'Submit report';
    save.addEventListener('click', () => {
      const form = body.querySelector('.maint-form');
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.title || !data.description) {
        ui.toast('Please fill in title and description.', 'warning');
        return;
      }
      const fileInput = form.querySelector('#mf-photos');
      const photos = Math.min(3, (fileInput.files && fileInput.files.length) || 0);
      const report = {
        id: 'M' + Date.now().toString().slice(-6),
        roomId: currentUser.roomId,
        userId: currentUser.id,
        reportedBy: currentUser.name,
        category: data.category,
        title: data.title,
        description: data.description,
        urgency: data.urgency,
        photos,
        status: 'new',
        assignedTo: null,
        notes: '',
        reportedAt: new Date().toISOString()
      };
      store.insert('maintenance', report);
      ui.toast('Report submitted.', 'success');
      ui.closeModal();
      render(content, currentUser);
    });
    footer.appendChild(cancel); footer.appendChild(save);
    ui.openModal({ title: 'Report an issue', body, footer });
  }

  function openViewDrawer(id) {
    const m = store.findById('maintenance', id);
    if (!m) return;
    const body = document.createElement('div');
    body.innerHTML = `
      <h3 class="mb-2">${ui.escapeHtml(m.title)}</h3>
      <div style="font-size: 13px; color: var(--ink-500); margin-bottom: 16px;">
        ${ui.formatDate(m.reportedAt, 'long')}
      </div>
      <p style="margin-bottom: 16px;">${ui.escapeHtml(m.description)}</p>
      <div class="detail-row"><span class="detail-row__label">Category</span><span class="detail-row__value">${ui.escapeHtml(m.category)}</span></div>
      <div class="detail-row"><span class="detail-row__label">Urgency</span><span class="detail-row__value">${ui.escapeHtml(m.urgency)}</span></div>
      <div class="detail-row"><span class="detail-row__label">Status</span><span class="detail-row__value">${ui.escapeHtml(m.status === 'in_progress' ? 'In progress' : m.status)}</span></div>
      ${m.assignedTo ? `<div class="detail-row"><span class="detail-row__label">Assigned to</span><span class="detail-row__value">${ui.escapeHtml(m.assignedTo)}</span></div>` : ''}
      ${m.notes ? `<div class="detail-row" style="border:0;"><span class="detail-row__label">Admin notes</span></div><p style="font-size:13px;color:var(--ink-700);">${ui.escapeHtml(m.notes)}</p>` : ''}
    `;
    ui.openDrawer({ title: m.id, body });
  }
})();
