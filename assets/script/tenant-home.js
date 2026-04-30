/* =====================================================================
   tenant-home.js — Tenant Home overview
   ===================================================================== */

(function () {
  'use strict';

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
