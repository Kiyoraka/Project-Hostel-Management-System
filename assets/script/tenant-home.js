/* =====================================================================
   tenant-home.js — Tenant Home overview
   ===================================================================== */

(function () {
  'use strict';

  function isMobile() { return window.innerWidth <= 900; }

  window.tenantHomeInit = function ({ content, currentUser }) {
    const room = store.findById('rooms', currentUser.roomId);
    const schedules = store.filter('schedules', s => s.userId === currentUser.id);
    const nextSchedule = pickNextSchedule(schedules);
    const nextNice = nextSchedule
      ? `${nextSchedule.day} ${nextSchedule.startTime} · ${classLabel(nextSchedule.classId)}`
      : 'No upcoming pickup';

    const payments = store.filter('payments', p => p.userId === currentUser.id);
    const sortedPayments = [...payments].sort((a, b) => b.period.localeCompare(a.period));
    const latest = sortedPayments[0];

    const myMaint = store.filter('maintenance', m => m.userId === currentUser.id && m.status !== 'resolved');
    const openCount = myMaint.length;
    const latestOpen = myMaint[0];

    if (isMobile()) {
      const today = new Date();
      const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening';
      content.innerHTML = `
        <div class="m-greeting" style="padding: var(--space-2) var(--space-2) var(--space-3);">
          <div class="m-greeting__hello">${greeting}, ${ui.escapeHtml(currentUser.name.split(' ')[0])}</div>
          <div class="m-greeting__date">${todayString()}</div>
        </div>

        <div class="m-hero-card">
          <div class="m-hero-card__label">Next Class Pickup</div>
          <div class="m-hero-card__value" style="font-size: 22px;">${ui.escapeHtml(nextNice)}</div>
          <div class="m-hero-card__summary" style="margin-top: var(--space-3);">
            <span><i class="fa-solid fa-location-dot" style="color: var(--brand-primary);"></i>&nbsp;${nextSchedule ? ui.escapeHtml(nextSchedule.pickupLocation) : 'No pickup yet'}</span>
          </div>
          <a href="#/schedule" class="btn btn-primary" style="width: 100%; padding: 12px; margin-top: var(--space-4); display: inline-flex; align-items: center; justify-content: center;">
            <i class="fa-solid fa-qrcode" aria-hidden="true"></i>&nbsp;Scan to Board
          </a>
        </div>

        <div class="m-stats-row">
          <div class="m-stat-card">
            <div class="m-stat-card__label">My Room</div>
            <div class="m-stat-card__value">${ui.escapeHtml(currentUser.roomId)}</div>
            <div class="m-stat-card__delta">Block ${room?.block || '?'} &middot; ${room?.type === 'twin' ? 'Twin' : 'Single'}</div>
          </div>
          <div class="m-stat-card">
            <div class="m-stat-card__label">Rent</div>
            <div class="m-stat-card__value" style="font-size: 16px;">${latest ? ui.formatMoney(latest.amount) : '—'}</div>
            <div class="m-stat-card__delta ${latest && latest.status !== 'paid' ? 'm-stat-card__delta--down' : ''}">${latest ? (latest.status === 'paid' ? 'Paid' : 'Outstanding') : 'No payments'}</div>
          </div>
        </div>

        <div class="m-section-label">Quick Actions</div>
        <div class="m-list-card">
          <a href="#/room" class="m-list-card__row m-room-row" style="text-decoration: none;">
            <i class="fa-solid fa-bed activity-feed__icon activity-feed__icon--pickup" aria-hidden="true"></i>
            <div class="m-list-card__main">
              <span class="m-list-card__title">My Room</span>
              <span class="m-list-card__meta">${ui.escapeHtml(currentUser.roomId)} &middot; Lease until ${currentUser.leaseEnd ? ui.formatDate(currentUser.leaseEnd) : '—'}</span>
            </div>
            <i class="fa-solid fa-chevron-right" style="color: var(--ink-500); flex-shrink: 0;" aria-hidden="true"></i>
          </a>
          <a href="#/schedule" class="m-list-card__row m-room-row" style="text-decoration: none;">
            <i class="fa-solid fa-calendar-days activity-feed__icon activity-feed__icon--pickup" aria-hidden="true"></i>
            <div class="m-list-card__main">
              <span class="m-list-card__title">Class Schedule</span>
              <span class="m-list-card__meta">${schedules.length} classes &middot; ${nextNice}</span>
            </div>
            <i class="fa-solid fa-chevron-right" style="color: var(--ink-500); flex-shrink: 0;" aria-hidden="true"></i>
          </a>
          <a href="#/maintenance" class="m-list-card__row m-room-row" style="text-decoration: none;">
            <i class="fa-solid fa-screwdriver-wrench activity-feed__icon activity-feed__icon--maintenance" aria-hidden="true"></i>
            <div class="m-list-card__main">
              <span class="m-list-card__title">Maintenance</span>
              <span class="m-list-card__meta">${openCount} open report${openCount === 1 ? '' : 's'} ${latestOpen ? '&middot; ' + ui.escapeHtml(latestOpen.title) : ''}</span>
            </div>
            <i class="fa-solid fa-chevron-right" style="color: var(--ink-500); flex-shrink: 0;" aria-hidden="true"></i>
          </a>
          <a href="#/payments" class="m-list-card__row m-room-row" style="text-decoration: none;">
            <i class="fa-solid fa-credit-card activity-feed__icon activity-feed__icon--payment" aria-hidden="true"></i>
            <div class="m-list-card__main">
              <span class="m-list-card__title">Payments</span>
              <span class="m-list-card__meta">${latest ? ui.formatPeriod(latest.period) + ' &middot; ' + ui.formatMoney(latest.amount) + ' &middot; ' + (latest.status === 'paid' ? 'Paid' : 'Outstanding') : 'No history'}</span>
            </div>
            <i class="fa-solid fa-chevron-right" style="color: var(--ink-500); flex-shrink: 0;" aria-hidden="true"></i>
          </a>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div class="welcome-card">
        <div class="welcome-card__title">Welcome back, ${ui.escapeHtml(currentUser.name.split(' ')[0])} 👋</div>
        <div class="welcome-card__sub">${todayString()} · Hostel keeps you home and on time</div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="dashboard-card">
          <div class="dashboard-card__head">
            <div class="dashboard-card__title">My Room</div>
            <div class="dashboard-card__icon"><i class="fa-solid fa-bed"></i></div>
          </div>
          <div class="dashboard-card__value">${ui.escapeHtml(currentUser.roomId)} · Block ${room?.block || '?'} · ${room?.type === 'twin' ? 'Twin' : 'Single'}</div>
          <div class="dashboard-card__sub">Lease until ${currentUser.leaseEnd ? ui.formatDate(currentUser.leaseEnd) : '—'}</div>
          <div class="dashboard-card__cta">
            <a href="#/room" class="btn btn-secondary btn-sm">View room <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </div>

        <div class="dashboard-card">
          <div class="dashboard-card__head">
            <div class="dashboard-card__title">Next Class Pickup</div>
            <div class="dashboard-card__icon"><i class="fa-solid fa-van-shuttle"></i></div>
          </div>
          <div class="dashboard-card__value">${ui.escapeHtml(nextNice)}</div>
          <div class="dashboard-card__sub">${nextSchedule ? 'Pickup: ' + ui.escapeHtml(nextSchedule.pickupLocation) : 'Add a class to your schedule first'}</div>
          <div class="dashboard-card__cta">
            <a href="#/schedule" class="btn btn-primary btn-sm">Scan to board <i class="fa-solid fa-qrcode"></i></a>
          </div>
        </div>

        <div class="dashboard-card">
          <div class="dashboard-card__head">
            <div class="dashboard-card__title">Rent Status</div>
            <div class="dashboard-card__icon"><i class="fa-solid fa-credit-card"></i></div>
          </div>
          <div class="dashboard-card__value">${latest ? ui.formatPeriod(latest.period) + ' — ' + ui.formatMoney(latest.amount) : '—'}</div>
          <div class="dashboard-card__sub">${latest ? (latest.status === 'paid' ? 'Paid on ' + ui.formatDate(latest.paidOn) : 'Outstanding') : 'No payments yet'}</div>
          <div class="dashboard-card__cta">
            <a href="#/payments" class="btn btn-secondary btn-sm">Pay / history <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </div>

        <div class="dashboard-card">
          <div class="dashboard-card__head">
            <div class="dashboard-card__title">Open Maintenance</div>
            <div class="dashboard-card__icon"><i class="fa-solid fa-screwdriver-wrench"></i></div>
          </div>
          <div class="dashboard-card__value">${openCount} report${openCount === 1 ? '' : 's'}</div>
          <div class="dashboard-card__sub">${latestOpen ? latestOpen.title + ' · ' + (latestOpen.status === 'in_progress' ? 'In progress' : 'New') : 'Nothing pending'}</div>
          <div class="dashboard-card__cta">
            <a href="#/maintenance" class="btn btn-secondary btn-sm">Submit / view <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </div>
      </div>
    `;
  };

  function todayString() {
    return new Date().toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function classLabel(id) {
    const c = store.findById('classes', id);
    return c ? c.name : id;
  }

  function pickNextSchedule(schedules) {
    if (!schedules.length) return null;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const todayDay = days[today.getDay()];
    const todayMin = today.getHours() * 60 + today.getMinutes();
    const sortedToday = schedules.filter(s => s.day === todayDay && timeToMin(s.startTime) >= todayMin);
    if (sortedToday.length) return sortedToday.sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime))[0];
    for (let off = 1; off <= 6; off++) {
      const d = days[(today.getDay() + off) % 7];
      const found = schedules.find(s => s.day === d);
      if (found) return found;
    }
    return schedules[0];
  }

  function timeToMin(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }
})();
