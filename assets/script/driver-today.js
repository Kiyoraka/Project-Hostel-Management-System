/* =====================================================================
   driver-today.js — Driver Today tab
   ===================================================================== */

(function () {
  'use strict';

  const PICKUP_WINDOW_MIN = 15;

  window.driverTodayInit = function ({ content }) {
    render(content);
  };

  function render(content) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const todayDay = days[now.getDay()];

    const allSchedules = store.readAll('schedules');
    const todaySchedules = allSchedules.filter(s => s.day === todayDay)
      .sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));

    const completed = store.filter('pickups', p => p.status === 'completed');

    const nowSch = todaySchedules.find(s => isWindowActive(s, now));
    const upcoming = todaySchedules.filter(s => !isWindowActive(s, now) && timeToMin(s.startTime) > now.getHours() * 60 + now.getMinutes());
    const past = todaySchedules.filter(s => timeToMin(s.startTime) <= now.getHours() * 60 + now.getMinutes() && s !== nowSch);

    content.innerHTML = `
      <div class="d-page-h">
        <div class="d-page-h__title">Today, ${ui.formatDate(now)}</div>
        <div class="d-page-h__sub">${todaySchedules.length} pickup${todaySchedules.length === 1 ? '' : 's'} scheduled</div>
      </div>

      ${nowSch ? `
        <div class="section-divider">Now</div>
        ${pickupCardHtml(nowSch, true)}
      ` : ''}

      ${upcoming.length > 0 ? `
        <div class="section-divider">Upcoming</div>
        ${upcoming.map(s => pickupCardHtml(s, false)).join('')}
      ` : ''}

      ${past.length > 0 ? `
        <div class="section-divider">Completed today</div>
        ${past.map(s => `
          <div class="pickup-card">
            <div class="pickup-card__time"><i class="fa-solid fa-check" style="color: var(--success);"></i> ${ui.escapeHtml(s.startTime)}</div>
            <div class="pickup-card__class">${ui.escapeHtml(classLabel(s.classId))}</div>
            <div class="pickup-card__loc">${ui.escapeHtml(s.pickupLocation)} - ${countStudents(s.id, allSchedules)} student${countStudents(s.id, allSchedules) === 1 ? '' : 's'}</div>
          </div>
        `).join('')}
      ` : ''}

      ${todaySchedules.length === 0 ? `
        <div class="empty-state">
          <i class="fa-solid fa-calendar-xmark"></i>
          <h3>No pickups today</h3>
          <p>Enjoy your day off, Pak.</p>
        </div>
      ` : ''}
    `;

    content.querySelectorAll('[data-scan-now]').forEach(b => {
      b.addEventListener('click', () => { window.location.hash = '#/scan'; });
    });
  }

  function pickupCardHtml(s, isNow) {
    const allSchedules = store.readAll('schedules');
    const expected = allSchedules.filter(x => x.id === s.id || (x.day === s.day && x.startTime === s.startTime));
    return `
      <div class="pickup-card ${isNow ? 'pickup-card--now' : ''}">
        <div class="pickup-card__time">${isNow ? 'Pickup window open' : 'Upcoming'} · ${ui.escapeHtml(s.startTime)}</div>
        <div class="pickup-card__class">${ui.escapeHtml(classLabel(s.classId))}</div>
        <div class="pickup-card__loc"><i class="fa-solid fa-location-dot"></i> ${ui.escapeHtml(s.pickupLocation)} - ${expected.length} student${expected.length === 1 ? '' : 's'} expected</div>
        <ul class="pickup-card__students">
          ${expected.map(e => `
            <li><i class="fa-solid fa-user-graduate"></i> ${ui.escapeHtml(e.studentId)}</li>
          `).join('')}
        </ul>
        ${isNow
          ? '<button class="btn btn-primary btn-block" data-scan-now><i class="fa-solid fa-qrcode"></i> Scan QR Now</button>'
          : ''}
      </div>
    `;
  }

  function isWindowActive(s, now) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (s.day !== days[now.getDay()]) return false;
    const [h, m] = s.startTime.split(':').map(Number);
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime();
    const open = start - PICKUP_WINDOW_MIN * 60 * 1000;
    return now.getTime() >= open && now.getTime() < start;
  }

  function timeToMin(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  function classLabel(id) {
    const c = store.findById('classes', id);
    return c ? c.name : id;
  }

  function countStudents(scheduleId, all) {
    return all.filter(s => s.id === scheduleId).length;
  }
})();
