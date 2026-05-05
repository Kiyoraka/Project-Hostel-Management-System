/* =====================================================================
   admin-transportation.js — Transportation tabbed wrapper (Phase 8)
   Tabs: Overview | Trip Schedule | Trip Status
   ===================================================================== */

(function () {
  'use strict';

  function isMobile() { return window.innerWidth <= 900; }

  const TABS = [
    { id: 'overview', label: 'Overview',       icon: 'fa-gauge' },
    { id: 'schedule', label: 'Trip Schedule',  icon: 'fa-calendar-days' },
    { id: 'status',   label: 'Trip Status',    icon: 'fa-tower-broadcast' }
  ];

  function init({ content, currentUser }) {
    let activeTab = 'overview';

    function render() {
      content.innerHTML = `
        <div class="section-header">
          <div>
            <div class="section-title">Transportation</div>
            <div class="section-subtitle">Class pickup schedules, live trip status, and driver coordination</div>
          </div>
        </div>

        <div class="tabs" role="tablist">
          ${TABS.map(t => `
            <button type="button" class="tabs__btn ${t.id === activeTab ? 'is-active' : ''}" data-tab="${t.id}" role="tab" aria-selected="${t.id === activeTab}">
              <i class="fa-solid ${t.icon}" aria-hidden="true"></i>&nbsp;${t.label}
            </button>
          `).join('')}
        </div>

        <div id="trans-tab-panel" class="tabs__panel is-active" role="tabpanel"></div>
      `;
      content.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => { activeTab = btn.dataset.tab; render(); });
      });
      renderPanel();
    }

    function renderPanel() {
      const panel = content.querySelector('#trans-tab-panel');
      if (!panel) return;
      if (activeTab === 'overview') return renderOverview(panel);
      if (activeTab === 'schedule') return renderSchedule(panel);
      if (activeTab === 'status')   return renderStatus(panel);
    }

    function renderOverview(panel) {
      if (isMobile()) return renderMobileOverview(panel);
      const pickups = store.readAll('pickups') || [];
      const schedules = store.readAll('schedules') || [];
      const completed = pickups.filter(p => p.status === 'completed').length;
      const pending = Math.max(0, schedules.length - completed);
      const drivers = auth.listUsers().filter(u => u.role === 'driver').length;
      panel.innerHTML = `
        <div class="kpi-strip" style="grid-template-columns: repeat(4, 1fr); margin-bottom: var(--space-4);">
          <div class="kpi-tile"><div class="kpi-tile__label">Trips Today</div><div class="kpi-tile__value">${schedules.length}</div></div>
          <div class="kpi-tile"><div class="kpi-tile__label">Completed</div><div class="kpi-tile__value">${completed}</div></div>
          <div class="kpi-tile"><div class="kpi-tile__label">Pending</div><div class="kpi-tile__value">${pending}</div></div>
          <div class="kpi-tile"><div class="kpi-tile__label">Active Drivers</div><div class="kpi-tile__value">${drivers}</div></div>
        </div>
        <div class="card card-pad">
          <h3 class="mb-3">Today's Activity</h3>
          <ul class="recent-list">
            ${pickups.map(p => `
              <li class="recent-list__item">
                <div class="recent-list__main">
                  <span class="recent-list__title">${ui.escapeHtml(p.classLabel)} pickup</span>
                  <span class="recent-list__meta">${p.studentCount} students &middot; ${ui.escapeHtml(p.status)}</span>
                </div>
                <span class="recent-list__time">${ui.escapeHtml(p.date)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    function renderMobileOverview(panel) {
      const pickups = store.readAll('pickups') || [];
      const schedules = store.readAll('schedules') || [];
      const completed = pickups.filter(p => p.status === 'completed').length;
      const pending = Math.max(0, schedules.length - completed);
      const drivers = auth.listUsers().filter(u => u.role === 'driver').length;
      const total = schedules.length;

      panel.innerHTML = `
        <div class="m-greeting" style="padding: var(--space-2) var(--space-2) var(--space-3);">
          <div class="m-greeting__hello">Transportation</div>
          <div class="m-greeting__date">${total} trips scheduled today</div>
        </div>

        <div class="m-stats-row" style="grid-template-columns: repeat(2, 1fr);">
          <div class="m-stat-card">
            <div class="m-stat-card__label">Trips Today</div>
            <div class="m-stat-card__value">${total}</div>
            <div class="m-stat-card__delta">scheduled</div>
          </div>
          <div class="m-stat-card">
            <div class="m-stat-card__label">Completed</div>
            <div class="m-stat-card__value">${completed}</div>
            <div class="m-stat-card__delta">finished</div>
          </div>
          <div class="m-stat-card">
            <div class="m-stat-card__label">Pending</div>
            <div class="m-stat-card__value">${pending}</div>
            <div class="m-stat-card__delta">remaining</div>
          </div>
          <div class="m-stat-card">
            <div class="m-stat-card__label">Active Drivers</div>
            <div class="m-stat-card__value">${drivers}</div>
            <div class="m-stat-card__delta">on duty</div>
          </div>
        </div>

        <div class="m-section-label">Today's Activity <span class="m-carousel-hint">${pickups.length}</span></div>
        <div class="m-list-card">
          ${pickups.map(p => `
            <div class="m-list-card__row">
              <i class="fa-solid fa-van-shuttle activity-feed__icon activity-feed__icon--pickup" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(p.classLabel)} pickup</span>
                <span class="m-list-card__meta">${p.studentCount} student${p.studentCount === 1 ? '' : 's'} &middot; ${ui.escapeHtml(p.status)}</span>
              </div>
              <span class="m-list-card__time">${ui.escapeHtml(p.date)}</span>
            </div>
          `).join('')}
          ${pickups.length === 0 ? '<div class="m-list-card__row" style="justify-content: center; color: var(--ink-500);">No activity yet today</div>' : ''}
        </div>
      `;
    }

    function renderSchedule(panel) {
      if (isMobile()) return renderMobileSchedule(panel);
      const schedules = store.readAll('schedules') || [];
      const driver = auth.listUsers().find(u => u.role === 'driver') || { name: 'Pak Lim' };
      panel.innerHTML = `
        <div class="card card-pad stub-section">
          <div class="stub-section__banner">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; trip schedule view. Recurring schedule editor + driver rotations ship in Phase 2.</span>
          </div>
          <div class="stub-section__layout">
            <div>
              <table class="table">
                <thead><tr><th>Day</th><th>Time</th><th>Class</th><th>Pickup</th><th>Driver</th><th>Status</th></tr></thead>
                <tbody>
                  ${schedules.map(s => `
                    <tr>
                      <td>${ui.escapeHtml(s.day)}</td>
                      <td>${ui.escapeHtml(s.startTime)}</td>
                      <td>${ui.escapeHtml(s.classLabel || s.classId || '-')}</td>
                      <td>${ui.escapeHtml(s.pickupLocation)}</td>
                      <td>${ui.escapeHtml(driver.name)}</td>
                      <td><span class="badge badge--success">Active</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <aside class="stub-section__aside">
              <h4>Coming next</h4>
              <ul>
                <li>Recurring schedule editor</li>
                <li>Geofence attendance</li>
                <li>Driver rotations</li>
                <li>Capacity planning</li>
              </ul>
            </aside>
          </div>
        </div>
      `;
    }

    function renderMobileSchedule(panel) {
      const schedules = store.readAll('schedules') || [];
      const driver = auth.listUsers().find(u => u.role === 'driver') || { name: 'Pak Lim' };

      panel.innerHTML = `
        <div class="card card-pad stub-section" style="margin-bottom: var(--space-3);">
          <div class="stub-section__banner" style="margin-bottom: 0;">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; recurring schedule editor ships in Phase 2.</span>
          </div>
        </div>

        <div class="m-section-label">Trips This Week <span class="m-carousel-hint">${schedules.length}</span></div>
        <div class="m-list-card">
          ${schedules.map(s => `
            <div class="m-list-card__row">
              <i class="fa-solid fa-clock activity-feed__icon activity-feed__icon--pickup" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(s.day)} &middot; ${ui.escapeHtml(s.startTime)}</span>
                <span class="m-list-card__meta">${ui.escapeHtml(s.classLabel || s.classId || '-')} &middot; ${ui.escapeHtml(s.pickupLocation)}</span>
                <span class="m-list-card__meta" style="font-size: 11px; opacity: 0.7;">${ui.escapeHtml(driver.name)}</span>
              </div>
              <span class="badge badge--success" style="font-size: 10px; flex-shrink: 0;">ACTIVE</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    function renderStatus(panel) {
      if (isMobile()) return renderMobileStatus(panel);
      const pickups = store.readAll('pickups') || [];
      panel.innerHTML = `
        <div class="card card-pad stub-section">
          <div class="stub-section__banner">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; live trip status reports. Real-time GPS + WebSocket telemetry ship in Phase 2.</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
            <h4 style="margin: 0;">Live Reports</h4>
            <button class="btn btn-ghost btn-sm" type="button"><i class="fa-solid fa-arrows-rotate"></i>&nbsp;Refresh</button>
          </div>
          <table class="table">
            <thead><tr><th>Trip</th><th>Class</th><th>Driver</th><th>Students</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              ${pickups.map(p => `
                <tr>
                  <td>${ui.escapeHtml(p.id)}</td>
                  <td>${ui.escapeHtml(p.classLabel)}</td>
                  <td>${ui.escapeHtml(p.driverId)}</td>
                  <td>${p.studentCount}</td>
                  <td><span class="badge badge--success">${ui.escapeHtml(p.status)}</span></td>
                  <td>${ui.escapeHtml(p.date)}</td>
                </tr>
              `).join('')}
              <tr>
                <td>PK-3</td><td>Software Engineering</td><td>U003</td><td>1</td>
                <td><span class="badge badge--warning">In Progress</span></td><td>Today</td>
              </tr>
              <tr>
                <td>PK-4</td><td>Database Systems</td><td>U003</td><td>2</td>
                <td><span class="badge">Pending</span></td><td>Today</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    function renderMobileStatus(panel) {
      const pickups = store.readAll('pickups') || [];
      const extras = [
        { id: 'PK-3', classLabel: 'Software Engineering', driverId: 'U003', studentCount: 1, status: 'in_progress', date: 'Today' },
        { id: 'PK-4', classLabel: 'Database Systems',     driverId: 'U003', studentCount: 2, status: 'pending',     date: 'Today' }
      ];
      const all = [...pickups, ...extras];

      panel.innerHTML = `
        <div class="card card-pad stub-section" style="margin-bottom: var(--space-3);">
          <div class="stub-section__banner" style="margin-bottom: 0;">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; live GPS telemetry ships in Phase 2.</span>
          </div>
        </div>

        <button class="btn btn-ghost" type="button" style="width: 100%; padding: 12px; margin-bottom: var(--space-4);">
          <i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i>&nbsp;Refresh
        </button>

        <div class="m-section-label">Live Trip Reports <span class="m-carousel-hint">${all.length}</span></div>
        <div class="m-list-card">
          ${all.map(p => `
            <div class="m-list-card__row">
              <i class="fa-solid fa-van-shuttle activity-feed__icon activity-feed__icon--pickup" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(p.id)} &middot; ${ui.escapeHtml(p.classLabel)}</span>
                <span class="m-list-card__meta">${ui.escapeHtml(p.driverId)} &middot; ${p.studentCount} student${p.studentCount === 1 ? '' : 's'}</span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
                <span class="badge badge--${p.status === 'completed' ? 'success' : p.status === 'in_progress' ? 'warning' : ''}" style="font-size: 10px;">${ui.escapeHtml((p.status || '').replace('_', ' ').toUpperCase())}</span>
                <span class="m-list-card__time">${ui.escapeHtml(p.date)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    render();
  }

  window.adminTransportationInit = init;
})();
