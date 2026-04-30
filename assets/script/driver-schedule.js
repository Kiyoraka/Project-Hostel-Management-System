/* =====================================================================
   driver-schedule.js — Driver weekly schedule
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
    const allSchedules = store.readAll('schedules');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayDay = dayNames[now.getDay()];

    const grouped = {};
    days.forEach(d => grouped[d] = allSchedules.filter(s => s.day === d).sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime)));

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
            : list.map(s => {
                const isNow = isToday && isWindowActive(s, now);
                const isPast = isToday && timeToMin(s.startTime) < now.getHours() * 60 + now.getMinutes();
                const status = isNow ? '<span class="now-badge">Now</span>' : isPast ? '<span class="badge badge-success">Done</span>' : '';
                return `
                  <div class="dr-row">
                    <div class="dr-row__time">${ui.escapeHtml(s.startTime)}</div>
                    <div class="dr-row__class">${ui.escapeHtml(classLabel(s.classId))}</div>
                    <div class="dr-row__loc">${ui.escapeHtml(s.pickupLocation)} ${status}</div>
                  </div>
                `;
              }).join('')}
        `;
      }).join('')}
    `;
  }

  function isWindowActive(s, now) {
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
})();
