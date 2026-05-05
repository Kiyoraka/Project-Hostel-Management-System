/* =====================================================================
   admin.js — Admin dashboard router + section initializers
   ===================================================================== */

(function () {
  'use strict';

  let currentUser = null;

  /* ===================================================================
     Mobile Native Adaptation -- 2-tier bottom nav (Phase M3)
     =================================================================== */

  const ROUTES_TO_GROUP = {
    '/':               'main',
    '/hostel':         'operations',
    '/residents':      'operations',
    '/maintenance':    'operations',
    '/transportation': 'operations',
    '/billing':        'operations',
    '/staff':          'people',
    '/helpdesk':       'people',
    '/profile':        'account',
    '/settings':       'account'
  };

  const GROUPS = {
    main: {
      defaultRoute: '/',
      items: [
        { route: '/', label: 'Dashboard', icon: 'fa-gauge-high' }
      ]
    },
    operations: {
      defaultRoute: '/hostel',
      items: [
        { route: '/hostel',         label: 'Hostel',     icon: 'fa-building' },
        { route: '/residents',      label: 'Residents',  icon: 'fa-users' },
        { route: '/maintenance',    label: 'Maint',      icon: 'fa-screwdriver-wrench' },
        { route: '/transportation', label: 'Transport',  icon: 'fa-van-shuttle' },
        { route: '/billing',        label: 'Billing',    icon: 'fa-money-bill-wave' }
      ]
    },
    people: {
      defaultRoute: '/staff',
      items: [
        { route: '/staff',    label: 'Staff & Users', icon: 'fa-user-tie' },
        { route: '/helpdesk', label: 'Helpdesk',      icon: 'fa-life-ring' }
      ]
    },
    account: {
      defaultRoute: '/profile',
      items: [
        { route: '/profile',  label: 'Profile',  icon: 'fa-id-card' },
        { route: '/settings', label: 'Settings', icon: 'fa-gear' }
      ]
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    currentUser = auth.requireRole(['admin']);
    if (!currentUser) return;
    if (window.seed) seed.run();
    initSidebar();
    initTopbar();
    initLogout();
    initBottomNav();
    paintUserChrome();
    initResponsiveReRender();

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
      const groupId = ROUTES_TO_GROUP[hash] || 'main';
      items.forEach(it => {
        const isActive = it.dataset.route === hash;
        it.classList.toggle('is-active', isActive);
        if (isActive) it.setAttribute('aria-current', 'page');
        else it.removeAttribute('aria-current');
      });
      // Sync bottom nav group tabs
      document.querySelectorAll('[data-group]').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.group === groupId);
      });
      // Re-render sub-row to reflect current group + active item
      renderSubRow(groupId);
    }
    window.addEventListener('hashchange', syncActive);
    syncActive();
  }

  function initBottomNav() {
    document.querySelectorAll('[data-group]').forEach(btn => {
      btn.addEventListener('click', () => {
        const groupId = btn.dataset.group;
        const currentHash = window.location.hash.replace(/^#/, '') || '/';
        const currentGroup = ROUTES_TO_GROUP[currentHash] || 'main';

        if (groupId === currentGroup) {
          // Q2: tapping active group tab -> scroll to top of content
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        // Q1: tapping different group -> navigate to that group's default route
        const target = GROUPS[groupId] && GROUPS[groupId].defaultRoute;
        if (target) window.location.hash = '#' + target;
      });
    });
  }

  function renderSubRow(groupId) {
    const sub = document.getElementById('bottom-nav-sub');
    if (!sub) return;
    const group = GROUPS[groupId];
    if (!group) { sub.innerHTML = ''; return; }
    const currentHash = window.location.hash.replace(/^#/, '') || '/';

    sub.innerHTML = group.items.map(item => `
      <a class="bottom-nav__sub__item ${item.route === currentHash ? 'is-active' : ''}"
         href="#${item.route}"
         data-sub-route="${item.route}"
         role="tab"
         aria-selected="${item.route === currentHash}">
        <i class="fa-solid ${item.icon}" aria-hidden="true"></i><span>${item.label}</span>
      </a>
    `).join('');

    // Auto-scroll active sub-item into view
    const active = sub.querySelector('.is-active');
    if (active && active.scrollIntoView) {
      try {
        active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      } catch (e) { /* older browsers without options support */ }
    }
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

  function isMobile() { return window.innerWidth <= 900; }

  function initResponsiveReRender() {
    let lastIsMobile = isMobile();
    let timer = null;
    window.addEventListener('resize', () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const nowIsMobile = isMobile();
        if (nowIsMobile !== lastIsMobile) {
          lastIsMobile = nowIsMobile;
          // Re-fire current route handler so the active section re-renders
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        }
      }, 150);
    });
  }

  function greetingFor(date) {
    const h = date.getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  /* ===================================================================
     Section: Dashboard — branches by viewport (Phase MD1)
     =================================================================== */
  function initOverview() {
    setPageTitle('Dashboard');
    const rooms = store.readAll('rooms');
    const payments = store.readAll('payments');
    const maintenance = store.readAll('maintenance');
    const pickups = store.readAll('pickups');

    const data = {
      totalBeds: rooms.length,
      occupiedBeds: rooms.filter(r => r.status === 'occupied').length,
      availableBeds: rooms.filter(r => r.status === 'vacant').length,
      maintRooms: rooms.filter(r => r.status === 'maintenance').length,
      paidCount: payments.filter(p => p.status === 'paid').length,
      dueCount: payments.filter(p => p.status === 'due').length,
      overdueCount: payments.filter(p => p.status === 'late' || p.status === 'overdue').length,
      outstanding: payments.filter(p => p.status !== 'paid').reduce((s, p) => s + (p.amount || 0), 0),
      pendingMaint: maintenance.filter(m => m.status !== 'resolved').length,
      rooms: rooms,
      activity: buildRecentActivity(maintenance, payments, pickups, isMobile() ? 6 : 8)
    };
    data.occupancyRate = data.totalBeds ? Math.round(data.occupiedBeds / data.totalBeds * 100) : 0;

    if (isMobile()) {
      renderMobileOverview(data);
      drawOccupancyChart(data.occupiedBeds, data.totalBeds, 'occupancy-chart-mobile');
      drawPaymentStatusChart(data.paidCount, data.dueCount, data.overdueCount, 'payment-status-chart-mobile');
    } else {
      renderDesktopOverview(data);
      drawOccupancyChart(data.occupiedBeds, data.totalBeds);
      drawPaymentStatusChart(data.paidCount, data.dueCount, data.overdueCount);
    }
  }

  function renderDesktopOverview(d) {
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

    content().innerHTML = `
      <div class="section-header">
        <div>
          <div class="section-title">Hello, ${ui.escapeHtml(currentUser.name)}</div>
          <div class="section-subtitle">Today: ${todayStr}</div>
        </div>
      </div>

      <div class="kpi-strip">
        <div class="kpi-tile"><div class="kpi-tile__label">Total Beds</div><div class="kpi-tile__value">${d.totalBeds}</div><div class="kpi-tile__delta">across all blocks</div></div>
        <div class="kpi-tile"><div class="kpi-tile__label">Occupied Beds</div><div class="kpi-tile__value">${d.occupiedBeds}</div><div class="kpi-tile__delta kpi-tile__delta--up">in use now</div></div>
        <div class="kpi-tile"><div class="kpi-tile__label">Available Beds</div><div class="kpi-tile__value">${d.availableBeds}</div><div class="kpi-tile__delta">ready to assign</div></div>
        <div class="kpi-tile"><div class="kpi-tile__label">Occupancy Rate</div><div class="kpi-tile__value">${d.occupancyRate}%</div><div class="kpi-tile__delta">${d.occupiedBeds} of ${d.totalBeds}</div></div>
        <div class="kpi-tile"><div class="kpi-tile__label">Outstanding</div><div class="kpi-tile__value">${ui.formatMoney(d.outstanding)}</div><div class="kpi-tile__delta kpi-tile__delta--down">${d.dueCount + d.overdueCount} unpaid</div></div>
        <div class="kpi-tile"><div class="kpi-tile__label">Pending Maint.</div><div class="kpi-tile__value">${d.pendingMaint}</div><div class="kpi-tile__delta">open reports</div></div>
      </div>

      <div class="two-col">
        <div class="card card-pad">
          <h3 class="mb-3">Room Status</h3>
          <div class="room-status-grid">
            ${d.rooms.map(r => `<span class="room-status-grid__cell room-status-grid__cell--${ui.escapeHtml(r.status)}" title="${ui.escapeHtml(r.id)} - ${ui.escapeHtml(r.status)}"></span>`).join('')}
          </div>
          <div class="room-status-grid__legend">
            <span><i class="dot dot--occupied"></i> Occupied (${d.occupiedBeds})</span>
            <span><i class="dot dot--vacant"></i> Vacant (${d.availableBeds})</span>
            <span><i class="dot dot--maintenance"></i> Maintenance (${d.maintRooms})</span>
          </div>
        </div>

        <div class="card card-pad">
          <h3 class="mb-3">Payment Status</h3>
          <div style="position: relative; height: 200px;">
            <canvas id="payment-status-chart"></canvas>
          </div>
          <div class="payment-status-legend">
            <span><i class="dot dot--paid"></i> Paid (${d.paidCount})</span>
            <span><i class="dot dot--due"></i> Due (${d.dueCount})</span>
            <span><i class="dot dot--overdue"></i> Overdue (${d.overdueCount})</span>
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
            ${d.activity.map(a => `
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
  }

  function renderMobileOverview(d) {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const greeting = greetingFor(today);

    content().innerHTML = `
      <div class="m-greeting">
        <div class="m-greeting__hello">${greeting}, ${ui.escapeHtml(currentUser.name)}</div>
        <div class="m-greeting__date">${dateStr}</div>
      </div>

      <div class="m-hero-card">
        <div class="m-hero-card__label">Occupancy</div>
        <div class="m-hero-card__value">${d.occupancyRate}%</div>
        <div class="m-hero-card__bar">
          <div class="m-hero-card__bar-fill" style="width: ${d.occupancyRate}%;"></div>
        </div>
        <div class="m-hero-card__summary">
          <span><i class="dot dot--occupied"></i> ${d.occupiedBeds} occupied</span>
          <span><i class="dot dot--vacant"></i> ${d.availableBeds} vacant</span>
          <span><i class="dot dot--maintenance"></i> ${d.maintRooms} maint.</span>
        </div>
      </div>

      <div class="m-stats-row">
        <div class="m-stat-card">
          <div class="m-stat-card__label">Outstanding</div>
          <div class="m-stat-card__value">${ui.formatMoney(d.outstanding)}</div>
          <div class="m-stat-card__delta m-stat-card__delta--down">${d.dueCount + d.overdueCount} unpaid</div>
        </div>
        <div class="m-stat-card">
          <div class="m-stat-card__label">Pending Maint.</div>
          <div class="m-stat-card__value">${d.pendingMaint}</div>
          <div class="m-stat-card__delta">open reports</div>
        </div>
      </div>

      <div class="m-section-label">Room Status</div>
      <div class="card card-pad">
        <div class="room-status-grid">
          ${d.rooms.map(r => `<span class="room-status-grid__cell room-status-grid__cell--${ui.escapeHtml(r.status)}" title="${ui.escapeHtml(r.id)} - ${ui.escapeHtml(r.status)}"></span>`).join('')}
        </div>
        <div class="room-status-grid__legend">
          <span><i class="dot dot--occupied"></i> Occupied (${d.occupiedBeds})</span>
          <span><i class="dot dot--vacant"></i> Vacant (${d.availableBeds})</span>
          <span><i class="dot dot--maintenance"></i> Maintenance (${d.maintRooms})</span>
        </div>
      </div>

      <div class="m-section-label">Payment Status</div>
      <div class="card card-pad">
        <div style="position: relative; height: 200px;">
          <canvas id="payment-status-chart-mobile"></canvas>
        </div>
        <div class="payment-status-legend">
          <span><i class="dot dot--paid"></i> Paid (${d.paidCount})</span>
          <span><i class="dot dot--due"></i> Due (${d.dueCount})</span>
          <span><i class="dot dot--overdue"></i> Overdue (${d.overdueCount})</span>
        </div>
      </div>

      <div class="m-section-label">Occupancy Trend</div>
      <div class="card card-pad">
        <div style="position: relative; height: 200px;">
          <canvas id="occupancy-chart-mobile"></canvas>
        </div>
      </div>

      <div class="m-section-label">Recent Activity</div>
      <div class="m-list-card">
        ${d.activity.map((a, i) => `
          <div class="m-list-card__row">
            <i class="fa-solid ${a.icon} activity-feed__icon activity-feed__icon--${a.kind}" aria-hidden="true"></i>
            <div class="m-list-card__main">
              <span class="m-list-card__title">${ui.escapeHtml(a.title)}</span>
              <span class="m-list-card__meta">${ui.escapeHtml(a.meta)}</span>
            </div>
            <span class="m-list-card__time">${ui.escapeHtml(a.time)}</span>
          </div>
        `).join('')}
      </div>
    `;
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

  function drawPaymentStatusChart(paid, due, overdue, canvasId) {
    const canvas = document.getElementById(canvasId || 'payment-status-chart');
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

  function drawOccupancyChart(currentOcc, total, canvasId) {
    const canvas = document.getElementById(canvasId || 'occupancy-chart');
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
