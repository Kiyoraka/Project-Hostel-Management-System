/* =====================================================================
   driver-today.js — Driver Today tab
   (Round 6: trip-driven model. Today's trips = classes that meet today
   AND have at least one enrollment.)
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

    const allEnrollments = store.readAll('enrollments');
    const enrolledClassIds = new Set(allEnrollments.map(e => e.classId));

    const todayClasses = store.filter('classes', c => c.day === todayDay && enrolledClassIds.has(c.id))
      .sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));

    const nowClass = todayClasses.find(c => isWindowActive(c, now));
    const upcoming = todayClasses.filter(c => !isWindowActive(c, now) && timeToMin(c.startTime) > now.getHours() * 60 + now.getMinutes());
    const past = todayClasses.filter(c => timeToMin(c.startTime) <= now.getHours() * 60 + now.getMinutes() && c !== nowClass);

    content.innerHTML = `
      <div class="d-page-h">
        <div class="d-page-h__title">Today, ${ui.formatDate(now)}</div>
        <div class="d-page-h__sub">${todayClasses.length} pickup${todayClasses.length === 1 ? '' : 's'} scheduled</div>
      </div>

      ${nowClass ? `
        <div class="section-divider">Now</div>
        ${pickupCardHtml(nowClass, true, allEnrollments)}
      ` : ''}

      ${upcoming.length > 0 ? `
        <div class="section-divider">Upcoming</div>
        ${upcoming.map(c => pickupCardHtml(c, false, allEnrollments)).join('')}
      ` : ''}

      ${past.length > 0 ? `
        <div class="section-divider">Completed today</div>
        ${past.map(c => `
          <div class="pickup-card">
            <div class="pickup-card__time"><i class="fa-solid fa-check" style="color: var(--success);"></i> ${ui.escapeHtml(c.startTime)}</div>
            <div class="pickup-card__class">${ui.escapeHtml(c.name)}</div>
            <div class="pickup-card__loc">${ui.escapeHtml(pickupSummary(c.id, allEnrollments))} - ${countStudents(c.id, allEnrollments)} student${countStudents(c.id, allEnrollments) === 1 ? '' : 's'}</div>
          </div>
        `).join('')}
      ` : ''}

      ${todayClasses.length === 0 ? `
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

  function pickupCardHtml(cls, isNow, allEnrollments) {
    const expected = allEnrollments.filter(e => e.classId === cls.id);
    return `
      <div class="pickup-card ${isNow ? 'pickup-card--now' : ''}">
        <div class="pickup-card__time">${isNow ? 'Pickup window open' : 'Upcoming'} · ${ui.escapeHtml(cls.startTime)}</div>
        <div class="pickup-card__class">${ui.escapeHtml(cls.name)}</div>
        <div class="pickup-card__loc"><i class="fa-solid fa-location-dot"></i> ${ui.escapeHtml(pickupSummary(cls.id, allEnrollments))} - ${expected.length} student${expected.length === 1 ? '' : 's'} expected</div>
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

  function pickupSummary(classId, allEnrollments) {
    const locs = [...new Set(allEnrollments.filter(e => e.classId === classId).map(e => e.pickupLocation))];
    return locs.join(' / ') || '—';
  }

  function isWindowActive(cls, now) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (cls.day !== days[now.getDay()]) return false;
    const [h, m] = cls.startTime.split(':').map(Number);
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime();
    const open = start - PICKUP_WINDOW_MIN * 60 * 1000;
    return now.getTime() >= open && now.getTime() < start;
  }

  function timeToMin(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  function countStudents(classId, allEnrollments) {
    return allEnrollments.filter(e => e.classId === classId).length;
  }
})();
