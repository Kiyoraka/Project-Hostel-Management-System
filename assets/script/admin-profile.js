/* =====================================================================
   admin-profile.js — Profile single-view (Phase 13)
   ===================================================================== */

(function () {
  'use strict';

  function init({ content, currentUser }) {
    const u = currentUser || auth.getCurrentUser() || {};
    const initials = (u.name || '').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase() || 'HA';
    const memberSince = u.createdAt ? ui.formatDate(u.createdAt, 'long') : 'August 2024';

    content.innerHTML = `
      <div class="section-header">
        <div>
          <div class="section-title">Profile</div>
          <div class="section-subtitle">Account info, recent activity, and notification preferences</div>
        </div>
      </div>

      <div class="card card-pad" style="margin-bottom: var(--space-4);">
        <div style="display: flex; align-items: center; gap: var(--space-4);">
          <div style="width: 96px; height: 96px; border-radius: 50%; background: var(--brand-tint); color: var(--brand-primary-dark); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 32px;">${ui.escapeHtml(initials)}</div>
          <div style="flex: 1;">
            <div style="font-size: 22px; font-weight: 700; color: var(--ink-900);">${ui.escapeHtml(u.name || 'Hostel Admin')}</div>
            <div style="margin: 4px 0;"><span class="badge badge--success">${ui.escapeHtml((u.role || 'admin').toUpperCase())}</span></div>
            <div style="color: var(--ink-500); font-size: 14px;">${ui.escapeHtml(u.email || '-')}</div>
          </div>
          <button class="btn btn-primary" type="button" data-edit-profile><i class="fa-solid fa-pen"></i>&nbsp;Edit Profile</button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4);">
        <div class="card card-pad">
          <h3 class="mb-3">Account Info</h3>
          <div style="font-size: 13px; color: var(--ink-700); line-height: 1.9;">
            <div><strong>Name:</strong> ${ui.escapeHtml(u.name || '-')}</div>
            <div><strong>Email:</strong> ${ui.escapeHtml(u.email || '-')}</div>
            <div><strong>Phone:</strong> ${ui.escapeHtml(u.phone || '+60 12-345 6789')}</div>
            <div><strong>Role:</strong> ${ui.escapeHtml(u.role || 'admin')}</div>
            <div><strong>Member since:</strong> ${ui.escapeHtml(memberSince)}</div>
          </div>
        </div>

        <div class="card card-pad">
          <h3 class="mb-3">Activity</h3>
          <div style="font-size: 13px; color: var(--ink-700); line-height: 1.9;">
            <div><strong>Last login:</strong> 5 minutes ago</div>
            <div><strong>Login count:</strong> 142</div>
            <div><strong>Last action:</strong> Updated room R-204</div>
            <div><strong>IP address:</strong> <span style="font-family: var(--font-mono); font-size: 12px;">10.0.0.42</span></div>
            <div><strong>Session:</strong> <span class="badge badge--success">Active</span></div>
          </div>
        </div>

        <div class="card card-pad">
          <h3 class="mb-3">Preferences</h3>
          <div style="font-size: 13px; color: var(--ink-700); display: grid; gap: var(--space-3);">
            <label style="display: flex; justify-content: space-between; align-items: center;">
              <span>Email notifications</span>
              <input type="checkbox" checked />
            </label>
            <label style="display: flex; justify-content: space-between; align-items: center;">
              <span>SMS alerts (urgent only)</span>
              <input type="checkbox" />
            </label>
            <label style="display: flex; justify-content: space-between; align-items: center;">
              <span>Theme</span>
              <select class="field__input" style="max-width: 120px;"><option>Light</option><option>Dark</option><option>System</option></select>
            </label>
            <label style="display: flex; justify-content: space-between; align-items: center;">
              <span>Language</span>
              <select class="field__input" style="max-width: 120px;"><option>English</option><option>Bahasa Malaysia</option></select>
            </label>
          </div>
        </div>
      </div>
    `;

    const editBtn = content.querySelector('[data-edit-profile]');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        ui.openModal({
          title: 'Edit Profile',
          body: `
            <label class="field"><span class="field__label">Name</span><input class="field__input" type="text" value="${ui.escapeHtml(u.name || '')}" /></label>
            <label class="field"><span class="field__label">Email</span><input class="field__input" type="email" value="${ui.escapeHtml(u.email || '')}" /></label>
            <label class="field"><span class="field__label">Phone</span><input class="field__input" type="tel" placeholder="+60 12-345 6789" /></label>
          `,
          footer: '<button class="btn btn-ghost" data-modal-close>Cancel</button> <button class="btn btn-primary" data-modal-close>Save</button>'
        });
      });
    }
  }

  window.adminProfileInit = init;
})();
