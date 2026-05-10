/* =====================================================================
   admin-staff.js — Staff & Users tabbed wrapper (Phase 11)
   Tabs: Staff List | Activity Logs | University Partners
   ===================================================================== */

(function () {
  'use strict';

  function isMobile() { return window.innerWidth <= 900; }

  const TABS = [
    { id: 'staff',    label: 'Staff List',          icon: 'fa-user-tie' },
    { id: 'logs',     label: 'Activity Logs',       icon: 'fa-list-check' },
    { id: 'partners', label: 'University Partners', icon: 'fa-graduation-cap' }
  ];

  function init({ content, currentUser }) {
    let activeTab = 'staff';

    function render() {
      content.innerHTML = `
        <div class="section-header">
          <div>
            <div class="section-title">Staff &amp; Users</div>
            <div class="section-subtitle">Internal staff, audit logs, and university partnerships</div>
          </div>
        </div>

        <div class="tabs" role="tablist">
          ${TABS.map(t => `
            <button type="button" class="tabs__btn ${t.id === activeTab ? 'is-active' : ''}" data-tab="${t.id}" role="tab" aria-selected="${t.id === activeTab}">
              <i class="fa-solid ${t.icon}" aria-hidden="true"></i>&nbsp;${t.label}
            </button>
          `).join('')}
        </div>

        <div id="staff-tab-panel" class="tabs__panel is-active" role="tabpanel"></div>
      `;
      content.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => { activeTab = btn.dataset.tab; render(); });
      });
      renderPanel();
    }

    function renderPanel() {
      const panel = content.querySelector('#staff-tab-panel');
      if (!panel) return;
      if (activeTab === 'staff')    return renderStaff(panel);
      if (activeTab === 'logs')     return renderLogs(panel);
      if (activeTab === 'partners') return renderPartners(panel);
    }

    function renderStaff(panel) {
      if (isMobile()) return renderMobileStaff(panel);
      const staff = auth.listUsers().filter(u => u.role === 'admin' || u.role === 'driver');
      panel.innerHTML = `
        <div class="card card-pad">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
            <h3 style="margin: 0;">Internal Staff</h3>
            <button class="btn btn-primary btn-sm" type="button"><i class="fa-solid fa-plus"></i>&nbsp;Add Staff</button>
          </div>
          <table class="table">
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${staff.map(s => `
                <tr>
                  <td>${ui.escapeHtml(s.id)}</td>
                  <td>${ui.escapeHtml(s.name)}</td>
                  <td>${ui.escapeHtml(s.email)}</td>
                  <td><span class="badge badge--${s.role === 'admin' ? 'success' : 'info'}">${ui.escapeHtml(s.role)}</span></td>
                  <td><span class="badge badge--success">Active</span></td>
                  <td><button class="btn btn-ghost btn-sm" type="button"><i class="fa-solid fa-pen"></i></button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    function renderMobileStaff(panel) {
      const staff = auth.listUsers().filter(u => u.role === 'admin' || u.role === 'driver');
      const admins = staff.filter(s => s.role === 'admin').length;
      const drivers = staff.filter(s => s.role === 'driver').length;

      panel.innerHTML = `
        <div class="m-greeting" style="padding: var(--space-2) var(--space-2) var(--space-3);">
          <div class="m-greeting__hello">Internal Staff</div>
          <div class="m-greeting__date">${staff.length} active members</div>
        </div>

        <div class="m-stats-row">
          <div class="m-stat-card">
            <div class="m-stat-card__label">Admins</div>
            <div class="m-stat-card__value">${admins}</div>
            <div class="m-stat-card__delta">manage system</div>
          </div>
          <div class="m-stat-card">
            <div class="m-stat-card__label">Drivers</div>
            <div class="m-stat-card__value">${drivers}</div>
            <div class="m-stat-card__delta">on duty</div>
          </div>
        </div>

        <button class="btn btn-primary" type="button" style="width: 100%; padding: 12px; margin-bottom: var(--space-4);">
          <i class="fa-solid fa-plus" aria-hidden="true"></i>&nbsp;Add Staff
        </button>

        <div class="m-section-label">All Staff <span class="m-carousel-hint">${staff.length}</span></div>
        <div class="m-list-card">
          ${staff.map(s => `
            <div class="m-list-card__row" style="align-items: center;">
              <span style="width: 40px; height: 40px; border-radius: 50%; background: var(--brand-tint); color: var(--brand-primary-dark); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; flex-shrink: 0;">${ui.escapeHtml((s.name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase())}</span>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(s.name)}</span>
                <span class="m-list-card__meta">${ui.escapeHtml(s.email)}</span>
                <span class="m-list-card__meta" style="font-size: 11px;">ID: ${ui.escapeHtml(s.id)}</span>
              </div>
              <span class="badge badge--${s.role === 'admin' ? 'success' : 'info'}" style="font-size: 10px;">${ui.escapeHtml((s.role || '').toUpperCase())}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    function renderLogs(panel) {
      if (isMobile()) return renderMobileLogs(panel);
      const logs = [
        { user: 'Hostel Admin',  action: 'Updated room R-204 status to occupied', ip: '10.0.0.42',  at: '5 minutes ago' },
        { user: 'Hostel Admin',  action: 'Sent announcement: Water tank maint',   ip: '10.0.0.42',  at: '6 hours ago' },
        { user: 'Pak Lim',       action: 'Logged in to driver app',               ip: '10.0.0.55',  at: '8 hours ago' },
        { user: 'Hostel Admin',  action: 'Issued compound CP-001 to Lee Wei',     ip: '10.0.0.42',  at: '2 days ago' },
        { user: 'Ahmad Faiz',    action: 'Submitted maintenance M01 (Leaky tap)', ip: '10.0.1.12',  at: '2 days ago' },
        { user: 'Hostel Admin',  action: 'Resolved maintenance M07 (Light bulb)', ip: '10.0.0.42',  at: '5 days ago' },
        { user: 'Siti Aminah',   action: 'Submitted maintenance request M02',     ip: '10.0.1.18',  at: '8 hours ago' },
        { user: 'Hostel Admin',  action: 'Logged in',                              ip: '10.0.0.42',  at: '8 hours ago' }
      ];
      panel.innerHTML = `
        <div class="card card-pad stub-section">
          <div class="stub-section__banner">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; activity log preview. Filter + export + retention policy ship in Phase 2.</span>
          </div>
          <div class="stub-section__layout">
            <div>
              <h4 style="margin-top: 0;">Recent Activity</h4>
              <table class="table">
                <thead><tr><th>User</th><th>Action</th><th>IP</th><th>When</th></tr></thead>
                <tbody>
                  ${logs.map(l => `
                    <tr>
                      <td>${ui.escapeHtml(l.user)}</td>
                      <td>${ui.escapeHtml(l.action)}</td>
                      <td style="font-family: var(--font-mono); font-size: 12px; color: var(--ink-500);">${ui.escapeHtml(l.ip)}</td>
                      <td>${ui.escapeHtml(l.at)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <aside class="stub-section__aside">
              <h4>Coming next</h4>
              <ul>
                <li>Filter by user / action</li>
                <li>Date range picker</li>
                <li>CSV export</li>
                <li>Retention policy</li>
              </ul>
            </aside>
          </div>
        </div>
      `;
    }

    function renderMobileLogs(panel) {
      const logs = [
        { user: 'Hostel Admin',  action: 'Updated room R-204 status to occupied', ip: '10.0.0.42',  at: '5 minutes ago' },
        { user: 'Hostel Admin',  action: 'Sent announcement: Water tank maint',   ip: '10.0.0.42',  at: '6 hours ago' },
        { user: 'Pak Lim',       action: 'Logged in to driver app',               ip: '10.0.0.55',  at: '8 hours ago' },
        { user: 'Hostel Admin',  action: 'Issued compound CP-001 to Lee Wei',     ip: '10.0.0.42',  at: '2 days ago' },
        { user: 'Ahmad Faiz',    action: 'Submitted maintenance M01 (Leaky tap)', ip: '10.0.1.12',  at: '2 days ago' },
        { user: 'Hostel Admin',  action: 'Resolved maintenance M07 (Light bulb)', ip: '10.0.0.42',  at: '5 days ago' },
        { user: 'Siti Aminah',   action: 'Submitted maintenance request M02',     ip: '10.0.1.18',  at: '8 hours ago' },
        { user: 'Hostel Admin',  action: 'Logged in',                              ip: '10.0.0.42',  at: '8 hours ago' }
      ];

      panel.innerHTML = `
        <div class="card card-pad stub-section" style="margin-bottom: var(--space-3);">
          <div class="stub-section__banner" style="margin-bottom: 0;">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; filter + export ship in Phase 2.</span>
          </div>
        </div>

        <div class="m-section-label">Recent Activity <span class="m-carousel-hint">${logs.length}</span></div>
        <div class="m-list-card">
          ${logs.map(l => `
            <div class="m-list-card__row">
              <i class="fa-solid fa-list-check activity-feed__icon activity-feed__icon--pickup" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(l.user)}</span>
                <span class="m-list-card__meta">${ui.escapeHtml(l.action)}</span>
                <span class="m-list-card__meta" style="font-family: var(--font-mono); font-size: 11px; opacity: 0.7;">${ui.escapeHtml(l.ip)}</span>
              </div>
              <span class="m-list-card__time">${ui.escapeHtml(l.at)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    function renderPartners(panel) {
      if (isMobile()) return renderMobilePartners(panel);
      const partners = store.readAll('partners') || [];
      panel.innerHTML = `
        <div class="card card-pad stub-section">
          <div class="stub-section__banner">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; university partner directory. MOU document upload + auto-renewal alerts ship in Phase 2.</span>
          </div>
          <div class="stub-section__layout">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
                <h4 style="margin: 0;">University Partners</h4>
                <button class="btn btn-primary btn-sm" type="button"><i class="fa-solid fa-plus"></i>&nbsp;Add Partner</button>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4);">
                ${partners.map(p => `
                  <div class="card card-pad" style="background: var(--surface-soft);">
                    <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3);">
                      <div style="width: 56px; height: 56px; border-radius: var(--radius-input); background: var(--brand-tint); color: var(--brand-primary-dark); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px;">${ui.escapeHtml(p.shortName)}</div>
                      <div>
                        <div style="font-weight: 600; color: var(--ink-900); font-size: 14px;">${ui.escapeHtml(p.name)}</div>
                        <div style="font-size: 12px; color: var(--ink-500);">${p.studentCount} students</div>
                      </div>
                    </div>
                    <div style="font-size: 13px; color: var(--ink-700); line-height: 1.7;">
                      <div><strong>MOU:</strong> ${ui.escapeHtml(p.mouSigned)}</div>
                      <div><strong>Liaison:</strong> ${ui.escapeHtml(p.contactPerson)}</div>
                      <div><strong>Email:</strong> ${ui.escapeHtml(p.contactEmail)}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <aside class="stub-section__aside">
              <h4>Coming next</h4>
              <ul>
                <li>MOU document upload</li>
                <li>Auto-renewal alerts</li>
                <li>Per-uni reporting</li>
                <li>Bulk student import</li>
              </ul>
            </aside>
          </div>
        </div>
      `;
    }

    function renderMobilePartners(panel) {
      const partners = store.readAll('partners') || [];

      panel.innerHTML = `
        <div class="card card-pad stub-section" style="margin-bottom: var(--space-3);">
          <div class="stub-section__banner" style="margin-bottom: 0;">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; MOU upload ships in Phase 2.</span>
          </div>
        </div>

        <button class="btn btn-primary" type="button" style="width: 100%; padding: 12px; margin-bottom: var(--space-4);">
          <i class="fa-solid fa-plus" aria-hidden="true"></i>&nbsp;Add Partner
        </button>

        <div class="m-section-label">University Partners <span class="m-carousel-hint">${partners.length}</span></div>
        <div class="m-list-card">
          ${partners.map(p => `
            <div class="m-list-card__row" style="align-items: center;">
              <span style="width: 48px; height: 48px; border-radius: var(--radius-input); background: var(--brand-tint); color: var(--brand-primary-dark); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0;">${ui.escapeHtml(p.shortName)}</span>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(p.name)}</span>
                <span class="m-list-card__meta">${p.studentCount} students &middot; MOU ${ui.escapeHtml(p.mouSigned)}</span>
                <span class="m-list-card__meta" style="font-size: 11px; opacity: 0.7;">${ui.escapeHtml(p.contactPerson)} &middot; ${ui.escapeHtml(p.contactEmail)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    render();
  }

  window.adminStaffInit = init;
})();
