/* =====================================================================
   admin.js — Admin dashboard router + section initializers
   ===================================================================== */

(function () {
  'use strict';

  let currentUser = null;

  document.addEventListener('DOMContentLoaded', function () {
    currentUser = auth.requireRole(['admin']);
    if (!currentUser) return;
    if (window.seed) seed.run();
    initSidebar();
    initTopbar();
    initLogout();
    paintUserChrome();

    ui.hashRouter({
      '/':            initOverview,
      '/users':       initUsers,
      '/rooms':       initRooms,
      '/rentals':     initRentals,
      '/maintenance': initMaintenance,
      '/settings':    initSettings
    }, '/');
  });

  function initSidebar() {
    const items = document.querySelectorAll('[data-route]');
    function syncActive() {
      const hash = window.location.hash.replace(/^#/, '') || '/';
      items.forEach(it => {
        const isActive = it.dataset.route === hash;
        it.classList.toggle('is-active', isActive);
      });
    }
    window.addEventListener('hashchange', syncActive);
    syncActive();
  }

  function initTopbar() {
    const toggle = document.querySelector('[data-sidebar-toggle]');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      document.body.classList.toggle('is-collapsed');
    });
  }

  function initLogout() {
    document.querySelectorAll('[data-logout]').forEach(btn => {
      btn.addEventListener('click', () => auth.logout());
    });
  }

  function paintUserChrome() {
    const initials = (currentUser.name || '').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
    document.querySelectorAll('[data-user-avatar]').forEach(el => el.textContent = initials);
    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = currentUser.name);
  }

  function setPageTitle(title) {
    const el = document.querySelector('[data-page-title]');
    if (el) el.textContent = title;
  }

  function content() {
    return document.getElementById('app-content');
  }

  /* ===================================================================
     Section: Overview
     =================================================================== */
  function initOverview() {
    setPageTitle('Overview');
    const tenants = auth.listUsers().filter(u => u.role === 'tenant');
    const extras = store.readAll('extra_tenants');
    const tenantCount = tenants.length + extras.length;
    const rooms = store.readAll('rooms');
    const occupied = rooms.filter(r => r.status === 'occupied').length;
    const totalRooms = rooms.length;
    const maintenance = store.readAll('maintenance');
    const openMaint = maintenance.filter(m => m.status !== 'resolved').length;
    const urgent = maintenance.filter(m => m.urgency === 'high' && m.status !== 'resolved').length;
    const pickups = store.readAll('pickups');
    const todayPickups = pickups.length;
    const todayDone = pickups.filter(p => p.status === 'completed').length;

    const recentMaint = [...maintenance].sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt)).slice(0, 5);
    const schedules = store.readAll('schedules');

    const today = new Date();
    const todayStr = today.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

    const html = `
      <div class="section-header">
        <div>
          <div class="section-title">Hello, ${ui.escapeHtml(currentUser.name)} 👋</div>
          <div class="section-subtitle">Today: ${todayStr}</div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-tile">
          <div class="kpi-tile__label">Tenants</div>
          <div class="kpi-tile__value">${tenantCount}</div>
          <div class="kpi-tile__delta kpi-tile__delta--up"><i class="fa-solid fa-arrow-up"></i> +3 this week</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-tile__label">Rooms</div>
          <div class="kpi-tile__value">${occupied} / ${totalRooms}</div>
          <div class="kpi-tile__delta">${Math.round(occupied / totalRooms * 100)}% occupancy</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-tile__label">Open maintenance</div>
          <div class="kpi-tile__value">${openMaint}</div>
          <div class="kpi-tile__delta kpi-tile__delta--down">${urgent} urgent</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-tile__label">Today's pickups</div>
          <div class="kpi-tile__value">${todayPickups}</div>
          <div class="kpi-tile__delta">${todayDone} completed</div>
        </div>
      </div>

      <div class="two-col">
        <div class="card card-pad">
          <h3 class="mb-3">Recent Maintenance Reports</h3>
          <ul class="recent-list">
            ${recentMaint.map(m => `
              <li class="recent-list__item">
                <div class="recent-list__main">
                  <span class="recent-list__title">${ui.escapeHtml(m.roomId)} - ${ui.escapeHtml(m.title)}</span>
                  <span class="recent-list__meta">${ui.escapeHtml(m.reportedBy)}</span>
                </div>
                <span class="recent-list__time">${ui.formatRelative(m.reportedAt)}</span>
              </li>
            `).join('')}
          </ul>
          <div class="mt-3"><a href="#/maintenance" class="btn btn-ghost btn-sm">View all <i class="fa-solid fa-arrow-right"></i></a></div>
        </div>

        <div class="card card-pad">
          <h3 class="mb-3">Upcoming Pickups</h3>
          <ul class="recent-list">
            ${schedules.slice(0, 5).map(s => `
              <li class="recent-list__item">
                <div class="recent-list__main">
                  <span class="recent-list__title">${ui.escapeHtml(s.startTime)} - ${ui.escapeHtml(s.studentId)}</span>
                  <span class="recent-list__meta">${ui.escapeHtml(s.pickupLocation)}</span>
                </div>
                <span class="recent-list__time">${ui.escapeHtml(s.day)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>

      <div class="card card-pad">
        <h3 class="mb-3">Occupancy Trend (last 30 days)</h3>
        <div style="position: relative; height: 240px;">
          <canvas id="occupancy-chart"></canvas>
        </div>
      </div>
    `;
    content().innerHTML = html;

    drawOccupancyChart(occupied, totalRooms);
  }

  function drawOccupancyChart(currentOcc, total) {
    const canvas = document.getElementById('occupancy-chart');
    if (!canvas || !window.Chart) return;
    const days = 30;
    const data = [];
    let val = currentOcc - 5;
    for (let i = 0; i < days; i++) {
      val += (Math.random() - 0.45) * 1.5;
      val = Math.max(0, Math.min(total, val));
      data.push(Math.round(val));
    }
    data[data.length - 1] = currentOcc;
    const labels = Array.from({ length: days }, (_, i) => i + 1);

    new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Occupied rooms',
          data,
          borderColor: '#0EA5E9',
          backgroundColor: 'rgba(14, 165, 233, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94A3B8', font: { size: 11 } } },
          y: { beginAtZero: false, grid: { color: '#F1F5F9' }, ticks: { color: '#94A3B8', font: { size: 11 } } }
        }
      }
    });
  }

  /* ===================================================================
     Section: Users   (populated in Phase 5)
     =================================================================== */
  function initUsers() {
    setPageTitle('Users');
    if (typeof window.adminUsersInit === 'function') return window.adminUsersInit({ content: content(), currentUser });
    content().innerHTML = '<div class="empty-state"><i class="fa-solid fa-users"></i><h3>Users section</h3><p>Loading...</p></div>';
  }

  /* ===================================================================
     Section: Rooms   (populated in Phase 6)
     =================================================================== */
  function initRooms() {
    setPageTitle('Rooms');
    if (typeof window.adminRoomsInit === 'function') return window.adminRoomsInit({ content: content() });
    content().innerHTML = '<div class="empty-state"><i class="fa-solid fa-bed"></i><h3>Rooms section</h3><p>Loading...</p></div>';
  }

  /* ===================================================================
     Section: Rentals  (populated in Phase 7)
     =================================================================== */
  function initRentals() {
    setPageTitle('Rentals');
    if (typeof window.adminRentalsInit === 'function') return window.adminRentalsInit({ content: content() });
    content().innerHTML = '<div class="empty-state"><i class="fa-solid fa-money-bill"></i><h3>Rentals section</h3><p>Loading...</p></div>';
  }

  /* ===================================================================
     Section: Maintenance  (populated in Phase 8)
     =================================================================== */
  function initMaintenance() {
    setPageTitle('Maintenance');
    if (typeof window.adminMaintenanceInit === 'function') return window.adminMaintenanceInit({ content: content() });
    content().innerHTML = '<div class="empty-state"><i class="fa-solid fa-screwdriver-wrench"></i><h3>Maintenance section</h3><p>Loading...</p></div>';
  }

  /* ===================================================================
     Section: Settings  (populated in Phase 9)
     =================================================================== */
  function initSettings() {
    setPageTitle('Settings');
    if (typeof window.adminSettingsInit === 'function') return window.adminSettingsInit({ content: content(), currentUser });
    content().innerHTML = '<div class="empty-state"><i class="fa-solid fa-gear"></i><h3>Settings section</h3><p>Loading...</p></div>';
  }

  // Expose helpers for section modules added in later phases
  window.admin = {
    setPageTitle,
    getCurrentUser: () => currentUser,
    refreshSection: () => {
      const hash = window.location.hash.replace(/^#/, '') || '/';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  };
})();
