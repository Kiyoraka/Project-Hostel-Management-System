/* =====================================================================
   driver-schedule.js — Driver weekly schedule
   (Round 6: trip-driven model. Weekly view shows classes meeting Mon-Fri
   with at least one enrollment.)
   ===================================================================== */

(function () {
  'use strict';

  const PICKUP_WINDOW_MIN = 15;

  window.driverScheduleInit = function ({ content }) {
    render(content);
  };

  function render(content) {
    const now = new Date();
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const allClasses = store.readAll('classes');
    const allEnrollments = store.readAll('enrollments');
    const enrolledClassIds = new Set(allEnrollments.map(e => e.classId));
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayDay = dayNames[now.getDay()];

    const grouped = {};
    days.forEach(d => {
      grouped[d] = allClasses
        .filter(c => c.day === d && enrolledClassIds.has(c.id))
        .sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));
    });

    content.innerHTML = `
      <div class="d-page-h">
        <div class="d-page-h__title">This Week</div>
        <div class="d-page-h__sub">Class pickups Monday through Friday</div>
      </div>

      ${days.map(d => {
        const isToday = d === todayDay;
        const list = grouped[d];
        const dateLabel = isToday ? 'Today, ' + d : d;
        return `
          <div class="dr-day ${isToday ? 'dr-day--today' : ''}">${dateLabel}</div>
          ${list.length === 0
            ? '<div class="dr-row"><div class="dr-row__class text-mute">— no pickups —</div></div>'
            : list.map(c => {
                const isNow = isToday && isWindowActive(c, now);
                const isPast = isToday && timeToMin(c.startTime) < now.getHours() * 60 + now.getMinutes();
                const status = isNow ? '<span class="now-badge">Now</span>' : isPast ? '<span class="badge badge-success">Done</span>' : '';
                const pickup = pickupSummary(c.id, allEnrollments);
                return `
                  <div class="dr-row">
                    <div class="dr-row__time">${ui.escapeHtml(c.startTime)}</div>
                    <div class="dr-row__class">${ui.escapeHtml(c.name)}</div>
                    <div class="dr-row__loc">${ui.escapeHtml(pickup)} ${status}</div>
                  </div>
                `;
              }).join('')}
        `;
      }).join('')}
    `;
  }

  function pickupSummary(classId, allEnrollments) {
    const locs = [...new Set(allEnrollments.filter(e => e.classId === classId).map(e => e.pickupLocation))];
    return locs.join(' / ') || '—';
  }

  function isWindowActive(cls, now) {
    const [h, m] = cls.startTime.split(':').map(Number);
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime();
    const open = start - PICKUP_WINDOW_MIN * 60 * 1000;
    return now.getTime() >= open && now.getTime() < start;
  }

  function timeToMin(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }
})();
