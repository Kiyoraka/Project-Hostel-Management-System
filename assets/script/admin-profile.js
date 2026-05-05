/* =====================================================================
   admin-profile.js — Profile single-view
   Phase 13 (desktop) + Phase MP (mobile-native render)
   ===================================================================== */

(function () {
  'use strict';

  function isMobile() { return window.innerWidth <= 900; }

  function init({ content, currentUser }) {
    const u = currentUser || auth.getCurrentUser() || {};
    const initials = (u.name || '').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase() || 'HA';
    const memberSince = u.createdAt ? ui.formatDate(u.createdAt, 'long') : 'August 2024';

    if (isMobile()) {
      renderMobile(content, u, initials, memberSince);
    } else {
      renderDesktop(content, u, initials, memberSince);
    }
    wireEditProfile(content, u);
  }

  function renderDesktop(content, u, initials, memberSince) {
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
  }

  function renderMobile(content, u, initials, memberSince) {
    content.innerHTML = `
      <div class="m-greeting" style="padding: var(--space-2) var(--space-2) var(--space-3);">
        <div class="m-greeting__hello">Profile</div>
        <div class="m-greeting__date">Account info, activity, and preferences</div>
      </div>

      <div class="m-hero-card" style="text-align: center;">
        <div style="width: 96px; height: 96px; border-radius: 50%; background: var(--brand-tint); color: var(--brand-primary-dark); display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 32px; margin-bottom: var(--space-3);">${ui.escapeHtml(initials)}</div>
        <div style="font-size: 22px; font-weight: 700; color: var(--ink-900); margin-bottom: 4px;">${ui.escapeHtml(u.name || 'Hostel Admin')}</div>
        <div style="margin-bottom: 4px;"><span class="badge badge--success">${ui.escapeHtml((u.role || 'admin').toUpperCase())}</span></div>
        <div style="color: var(--ink-500); font-size: 13px; margin-bottom: var(--space-3);">${ui.escapeHtml(u.email || '-')}</div>
        <button class="btn btn-primary" type="button" data-edit-profile style="width: 100%; padding: 10px;">
          <i class="fa-solid fa-pen" aria-hidden="true"></i>&nbsp;Edit Profile
        </button>
      </div>

      <div class="m-section-label">Account Info</div>
      <div class="m-list-card">
        <div class="m-list-card__row">
          <i class="fa-solid fa-user activity-feed__icon activity-feed__icon--pickup" aria-hidden="true"></i>
          <div class="m-list-card__main"><span class="m-list-card__title">${ui.escapeHtml(u.name || '-')}</span><span class="m-list-card__meta">Name</span></div>
        </div>
        <div class="m-list-card__row">
          <i class="fa-solid fa-envelope activity-feed__icon activity-feed__icon--payment" aria-hidden="true"></i>
          <div class="m-list-card__main"><span class="m-list-card__title">${ui.escapeHtml(u.email || '-')}</span><span class="m-list-card__meta">Email</span></div>
        </div>
        <div class="m-list-card__row">
          <i class="fa-solid fa-phone activity-feed__icon activity-feed__icon--payment" aria-hidden="true"></i>
          <div class="m-list-card__main"><span class="m-list-card__title">${ui.escapeHtml(u.phone || '+60 12-345 6789')}</span><span class="m-list-card__meta">Phone</span></div>
        </div>
        <div class="m-list-card__row">
          <i class="fa-solid fa-shield-halved activity-feed__icon activity-feed__icon--maintenance" aria-hidden="true"></i>
          <div class="m-list-card__main"><span class="m-list-card__title">${ui.escapeHtml(u.role || 'admin')}</span><span class="m-list-card__meta">Role</span></div>
        </div>
        <div class="m-list-card__row">
          <i class="fa-solid fa-calendar-check activity-feed__icon activity-feed__icon--pickup" aria-hidden="true"></i>
          <div class="m-list-card__main"><span class="m-list-card__title">${ui.escapeHtml(memberSince)}</span><span class="m-list-card__meta">Member since</span></div>
        </div>
      </div>

      <div class="m-section-label">Activity</div>
      <div class="m-list-card">
        <div class="m-list-card__row">
          <i class="fa-solid fa-right-to-bracket activity-feed__icon activity-feed__icon--pickup" aria-hidden="true"></i>
          <div class="m-list-card__main"><span class="m-list-card__title">5 minutes ago</span><span class="m-list-card__meta">Last login</span></div>
        </div>
        <div class="m-list-card__row">
          <i class="fa-solid fa-arrows-rotate activity-feed__icon activity-feed__icon--pickup" aria-hidden="true"></i>
          <div class="m-list-card__main"><span class="m-list-card__title">142</span><span class="m-list-card__meta">Login count</span></div>
        </div>
        <div class="m-list-card__row">
          <i class="fa-solid fa-pen activity-feed__icon activity-feed__icon--maintenance" aria-hidden="true"></i>
          <div class="m-list-card__main"><span class="m-list-card__title">Updated room R-204</span><span class="m-list-card__meta">Last action</span></div>
        </div>
        <div class="m-list-card__row">
          <i class="fa-solid fa-network-wired activity-feed__icon activity-feed__icon--payment" aria-hidden="true"></i>
          <div class="m-list-card__main"><span class="m-list-card__title" style="font-family: var(--font-mono); font-size: 13px;">10.0.0.42</span><span class="m-list-card__meta">IP address</span></div>
        </div>
        <div class="m-list-card__row">
          <i class="fa-solid fa-circle-check activity-feed__icon activity-feed__icon--payment" aria-hidden="true"></i>
          <div class="m-list-card__main"><span class="m-list-card__title">Active</span><span class="m-list-card__meta">Session</span></div>
          <span class="badge badge--success" style="font-size: 10px;">ON</span>
        </div>
      </div>

      <div class="m-section-label">Preferences</div>
      <div class="m-list-card">
        <label class="m-list-card__row" style="cursor: pointer; align-items: center;">
          <i class="fa-solid fa-envelope activity-feed__icon activity-feed__icon--payment" aria-hidden="true"></i>
          <div class="m-list-card__main"><span class="m-list-card__title">Email notifications</span><span class="m-list-card__meta">Account alerts</span></div>
          <input type="checkbox" checked style="flex-shrink: 0;" />
        </label>
        <label class="m-list-card__row" style="cursor: pointer; align-items: center;">
          <i class="fa-solid fa-bell activity-feed__icon activity-feed__icon--maintenance" aria-hidden="true"></i>
          <div class="m-list-card__main"><span class="m-list-card__title">SMS alerts</span><span class="m-list-card__meta">Urgent only</span></div>
          <input type="checkbox" style="flex-shrink: 0;" />
        </label>
        <label class="m-list-card__row" style="align-items: center;">
          <i class="fa-solid fa-palette activity-feed__icon activity-feed__icon--pickup" aria-hidden="true"></i>
          <div class="m-list-card__main"><span class="m-list-card__title">Theme</span><span class="m-list-card__meta">Appearance</span></div>
          <select class="field__input" style="max-width: 110px; padding: 6px 8px; flex-shrink: 0;"><option>Light</option><option>Dark</option><option>System</option></select>
        </label>
        <label class="m-list-card__row" style="align-items: center;">
          <i class="fa-solid fa-language activity-feed__icon activity-feed__icon--pickup" aria-hidden="true"></i>
          <div class="m-list-card__main"><span class="m-list-card__title">Language</span><span class="m-list-card__meta">Display</span></div>
          <select class="field__input" style="max-width: 130px; padding: 6px 8px; flex-shrink: 0;"><option>English</option><option>Bahasa Malaysia</option></select>
        </label>
      </div>
    `;
  }

  function wireEditProfile(content, u) {
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
