/* =====================================================================
   admin-transportation.js — Transportation tabbed wrapper (Phase 8)
   Tabs: Overview | Trip Schedule | Trip Status
   ===================================================================== */

(function () {
  'use strict';

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

    function renderSchedule(panel) {
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

    function renderStatus(panel) {
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

    render();
  }

  window.adminTransportationInit = init;
})();
