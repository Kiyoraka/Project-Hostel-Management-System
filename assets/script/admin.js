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
      '/':               initOverview,
      '/hostel':         initHostel,
      '/residents':      initResidents,
      '/maintenance':    initMaintenance,
      '/transportation': initTransportation,
      '/billing':        initBilling,
      '/staff':          initStaff,
      '/helpdesk':       initHelpdesk,
      '/profile':        initProfile,
      '/settings':       initSettings
    }, '/');
  });

  function initSidebar() {
    const items = document.querySelectorAll('[data-route]');
    function syncActive() {
      const hash = window.location.hash.replace(/^#/, '') || '/';
      items.forEach(it => {
        const isActive = it.dataset.route === hash;
        it.classList.toggle('is-active', isActive);
        if (isActive) it.setAttribute('aria-current', 'page');
        else it.removeAttribute('aria-current');
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
     Section: Dashboard (10 widgets across 3 rows)
     =================================================================== */
  function initOverview() {
    setPageTitle('Dashboard');
    const rooms = store.readAll('rooms');
    const totalBeds = rooms.length;
    const occupiedBeds = rooms.filter(r => r.status === 'occupied').length;
    const availableBeds = rooms.filter(r => r.status === 'vacant').length;
    const maintRooms = rooms.filter(r => r.status === 'maintenance').length;
    const occupancyRate = totalBeds ? Math.round(occupiedBeds / totalBeds * 100) : 0;

    const payments = store.readAll('payments');
    const paidCount = payments.filter(p => p.status === 'paid').length;
    const dueCount = payments.filter(p => p.status === 'due').length;
    const overdueCount = payments.filter(p => p.status === 'late' || p.status === 'overdue').length;
    const outstanding = payments
      .filter(p => p.status !== 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const maintenance = store.readAll('maintenance');
    const pendingMaint = maintenance.filter(m => m.status !== 'resolved').length;

    const pickups = store.readAll('pickups');

    const today = new Date();
    const todayStr = today.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

    const activity = buildRecentActivity(maintenance, payments, pickups, 8);

    const html = `
      <div class="section-header">
        <div>
          <div class="section-title">Hello, ${ui.escapeHtml(currentUser.name)}</div>
          <div class="section-subtitle">Today: ${todayStr}</div>
        </div>
      </div>

      <div class="kpi-strip">
        <div class="kpi-tile">
          <div class="kpi-tile__label">Total Beds</div>
          <div class="kpi-tile__value">${totalBeds}</div>
          <div class="kpi-tile__delta">across all blocks</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-tile__label">Occupied Beds</div>
          <div class="kpi-tile__value">${occupiedBeds}</div>
          <div class="kpi-tile__delta kpi-tile__delta--up">in use now</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-tile__label">Available Beds</div>
          <div class="kpi-tile__value">${availableBeds}</div>
          <div class="kpi-tile__delta">ready to assign</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-tile__label">Occupancy Rate</div>
          <div class="kpi-tile__value">${occupancyRate}%</div>
          <div class="kpi-tile__delta">${occupiedBeds} of ${totalBeds}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-tile__label">Outstanding</div>
          <div class="kpi-tile__value">${ui.formatMoney(outstanding)}</div>
          <div class="kpi-tile__delta kpi-tile__delta--down">${dueCount + overdueCount} unpaid</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-tile__label">Pending Maint.</div>
          <div class="kpi-tile__value">${pendingMaint}</div>
          <div class="kpi-tile__delta">open reports</div>
        </div>
      </div>

      <div class="two-col">
        <div class="card card-pad">
          <h3 class="mb-3">Room Status</h3>
          <div class="room-status-grid">
            ${rooms.map(r => `<span class="room-status-grid__cell room-status-grid__cell--${ui.escapeHtml(r.status)}" title="${ui.escapeHtml(r.id)} - ${ui.escapeHtml(r.status)}"></span>`).join('')}
          </div>
          <div class="room-status-grid__legend">
            <span><i class="dot dot--occupied"></i> Occupied (${occupiedBeds})</span>
            <span><i class="dot dot--vacant"></i> Vacant (${availableBeds})</span>
            <span><i class="dot dot--maintenance"></i> Maintenance (${maintRooms})</span>
          </div>
        </div>

        <div class="card card-pad">
          <h3 class="mb-3">Payment Status</h3>
          <div style="position: relative; height: 200px;">
            <canvas id="payment-status-chart"></canvas>
          </div>
          <div class="payment-status-legend">
            <span><i class="dot dot--paid"></i> Paid (${paidCount})</span>
            <span><i class="dot dot--due"></i> Due (${dueCount})</span>
            <span><i class="dot dot--overdue"></i> Overdue (${overdueCount})</span>
          </div>
        </div>
      </div>

      <div class="two-col two-col--wide-left">
        <div class="card card-pad">
          <h3 class="mb-3">Occupancy Summary (last 30 days)</h3>
          <div style="position: relative; height: 240px;">
            <canvas id="occupancy-chart"></canvas>
          </div>
        </div>

        <div class="card card-pad">
          <h3 class="mb-3">Recent Activity</h3>
          <ul class="activity-feed">
            ${activity.map(a => `
              <li class="activity-feed__item">
                <i class="fa-solid ${a.icon} activity-feed__icon activity-feed__icon--${a.kind}" aria-hidden="true"></i>
                <div class="activity-feed__main">
                  <span class="activity-feed__title">${ui.escapeHtml(a.title)}</span>
                  <span class="activity-feed__meta">${ui.escapeHtml(a.meta)}</span>
                </div>
                <span class="activity-feed__time">${ui.escapeHtml(a.time)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
    content().innerHTML = html;

    drawOccupancyChart(occupiedBeds, totalBeds);
    drawPaymentStatusChart(paidCount, dueCount, overdueCount);
  }

  function buildRecentActivity(maintenance, payments, pickups, limit) {
    const items = [];
    maintenance.forEach(m => {
      items.push({
        kind: 'maintenance',
        icon: 'fa-screwdriver-wrench',
        title: `${m.roomId} - ${m.title}`,
        meta: `Reported by ${m.reportedBy}`,
        ts: new Date(m.reportedAt).getTime(),
        time: ui.formatRelative(m.reportedAt)
      });
    });
    payments.filter(p => p.status === 'paid' && p.paidOn).forEach(p => {
      items.push({
        kind: 'payment',
        icon: 'fa-money-bill-wave',
        title: `${ui.formatMoney(p.amount)} - ${p.tenantName}`,
        meta: `${p.method} payment for ${ui.formatPeriod(p.period)}`,
        ts: new Date(p.paidOn).getTime(),
        time: ui.formatRelative(p.paidOn)
      });
    });
    pickups.forEach(p => {
      items.push({
        kind: 'pickup',
        icon: 'fa-van-shuttle',
        title: `Pickup - ${p.classLabel}`,
        meta: `${p.studentCount} student${p.studentCount === 1 ? '' : 's'} - ${p.status}`,
        ts: new Date(p.date).getTime(),
        time: ui.formatRelative(p.date)
      });
    });
    return items.sort((a, b) => b.ts - a.ts).slice(0, limit);
  }

  function drawPaymentStatusChart(paid, due, overdue) {
    const canvas = document.getElementById('payment-status-chart');
    if (!canvas || !window.Chart) return;
    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Paid', 'Due', 'Overdue'],
        datasets: [{
          data: [paid, due, overdue],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: { legend: { display: false } }
      }
    });
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
     Section: Maintenance  (tabbed wrapper, falls back to flat)
     =================================================================== */
  function initMaintenance() {
    setPageTitle('Maintenance');
    if (typeof window.adminMaintenanceTabbedInit === 'function') return window.adminMaintenanceTabbedInit({ content: content(), currentUser });
    if (typeof window.adminMaintenanceInit === 'function') return window.adminMaintenanceInit({ content: content() });
    content().innerHTML = '<div class="empty-state"><i class="fa-solid fa-screwdriver-wrench"></i><h3>Maintenance section</h3><p>Loading...</p></div>';
  }

  /* ===================================================================
     Section: Settings
     =================================================================== */
  function initSettings() {
    setPageTitle('Settings');
    if (typeof window.adminSettingsInit === 'function') return window.adminSettingsInit({ content: content(), currentUser });
    content().innerHTML = '<div class="empty-state"><i class="fa-solid fa-gear"></i><h3>Settings section</h3><p>Loading...</p></div>';
  }

  /* ===================================================================
     Section: Hostel Management  (tabbed - Phase 6)
     =================================================================== */
  function initHostel() {
    setPageTitle('Hostel Management');
    if (typeof window.adminHostelInit === 'function') return window.adminHostelInit({ content: content(), currentUser });
    content().innerHTML = '<div class="empty-state"><i class="fa-solid fa-building"></i><h3>Hostel Management</h3><p>Loading...</p></div>';
  }

  /* ===================================================================
     Section: Resident Management  (tabbed - Phase 7)
     =================================================================== */
  function initResidents() {
    setPageTitle('Resident Management');
    if (typeof window.adminResidentsInit === 'function') return window.adminResidentsInit({ content: content(), currentUser });
    content().innerHTML = '<div class="empty-state"><i class="fa-solid fa-users"></i><h3>Resident Management</h3><p>Loading...</p></div>';
  }

  /* ===================================================================
     Section: Transportation  (tabbed - Phase 8)
     =================================================================== */
  function initTransportation() {
    setPageTitle('Transportation');
    if (typeof window.adminTransportationInit === 'function') return window.adminTransportationInit({ content: content(), currentUser });
    content().innerHTML = '<div class="empty-state"><i class="fa-solid fa-van-shuttle"></i><h3>Transportation</h3><p>Loading...</p></div>';
  }

  /* ===================================================================
     Section: Billings & Payment  (tabbed - Phase 9)
     =================================================================== */
  function initBilling() {
    setPageTitle('Billings & Payment');
    if (typeof window.adminBillingInit === 'function') return window.adminBillingInit({ content: content(), currentUser });
    content().innerHTML = '<div class="empty-state"><i class="fa-solid fa-money-bill-wave"></i><h3>Billings & Payment</h3><p>Loading...</p></div>';
  }

  /* ===================================================================
     Section: Staff & Users  (tabbed - Phase 11)
     =================================================================== */
  function initStaff() {
    setPageTitle('Staff & Users');
    if (typeof window.adminStaffInit === 'function') return window.adminStaffInit({ content: content(), currentUser });
    content().innerHTML = '<div class="empty-state"><i class="fa-solid fa-user-tie"></i><h3>Staff & Users</h3><p>Loading...</p></div>';
  }

  /* ===================================================================
     Section: Helpdesk  (Phase 12)
     =================================================================== */
  function initHelpdesk() {
    setPageTitle('Helpdesk');
    if (typeof window.adminHelpdeskInit === 'function') return window.adminHelpdeskInit({ content: content(), currentUser });
    content().innerHTML = '<div class="empty-state"><i class="fa-solid fa-life-ring"></i><h3>Helpdesk</h3><p>Loading...</p></div>';
  }

  /* ===================================================================
     Section: Profile  (Phase 13)
     =================================================================== */
  function initProfile() {
    setPageTitle('Profile');
    if (typeof window.adminProfileInit === 'function') return window.adminProfileInit({ content: content(), currentUser });
    content().innerHTML = '<div class="empty-state"><i class="fa-solid fa-id-card"></i><h3>Profile</h3><p>Loading...</p></div>';
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
