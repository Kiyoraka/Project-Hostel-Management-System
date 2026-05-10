/* =====================================================================
   driver-scan.js — Driver displays a fresh time-bound QR for students to scan
   (Direction: driver-shows / student-scans / driver = pickup authority)
   File kept under the same name for HTML script-tag continuity; the route is
   still /scan from the URL standpoint, but the tab now shows "My QR".

   Round 6: trip-driven model. Active window picks the class whose pickup
   window is open. QR payload anchors classId (no scheduleId). Expected
   students come from enrollments joined to that class. Boarded list filters
   pickups by classId.
   ===================================================================== */

(function () {
  'use strict';

  const PICKUP_WINDOW_MIN = 15;
  const QR_VALIDITY_MIN = 10;
  let qrTimer = null;

  window.driverScanInit = function ({ content, currentUser }) {
    stopQrTimer();
    render(content, currentUser);
  };

  window.driverScanCleanup = function () {
    stopQrTimer();
  };

  async function render(content, currentUser) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const todayDay = days[now.getDay()];

    const allEnrollments = store.readAll('enrollments');
    const enrolledClassIds = new Set(allEnrollments.map(e => e.classId));
    const todayClasses = store.filter('classes', c => c.day === todayDay && enrolledClassIds.has(c.id))
      .sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));

    const activeClass = todayClasses.find(c => isWindowActive(c, now));

    if (!activeClass) {
      const next = todayClasses.find(c => timeToMin(c.startTime) > now.getHours() * 60 + now.getMinutes());
      content.innerHTML = `
        <div class="d-page-h">
          <div class="d-page-h__title">My Pickup QR</div>
          <div class="d-page-h__sub">Show this to boarding students</div>
        </div>
        <div class="empty-state" style="padding: 40px 20px;">
          <i class="fa-solid fa-clock"></i>
          <h3>No active pickup window</h3>
          <p>${next ? 'Next pickup at <strong>' + ui.escapeHtml(next.startTime) + '</strong> for ' + ui.escapeHtml(next.name) + '. The QR opens 15 min before class.' : 'No more pickups today.'}</p>
        </div>
      `;
      return;
    }

    const expectedStudents = allEnrollments.filter(e => e.classId === activeClass.id);
    const pickupLocations = [...new Set(expectedStudents.map(e => e.pickupLocation))].join(' / ');
    let payload = await issueQr(activeClass, currentUser);

    content.innerHTML = `
      <div class="d-page-h">
        <div class="d-page-h__title">My Pickup QR</div>
        <div class="d-page-h__sub">${ui.escapeHtml(activeClass.startTime)} · ${ui.escapeHtml(activeClass.name)}</div>
      </div>

      <div class="qr-card" style="margin-bottom: 16px;">
        <div class="qr-card__qr" id="dr-qr-target"></div>
        <div class="qr-card__class">${ui.escapeHtml(activeClass.name)}</div>
        <div class="qr-card__pickup"><i class="fa-solid fa-location-dot"></i> ${ui.escapeHtml(pickupLocations || '—')}</div>
        <div class="qr-card__expires" data-countdown>Expires in <span data-tick>--:--</span></div>
        <div class="qr-card__hint">Show this to boarding students. Each student scans to confirm they're on the ride.</div>
        <div class="qr-card__actions">
          <button type="button" class="btn btn-secondary btn-sm" data-refresh><i class="fa-solid fa-rotate"></i> Refresh QR</button>
        </div>
      </div>

      <div class="scanner-context" style="margin-top: 8px;">
        <strong>Expected students (${expectedStudents.length}):</strong><br>
        ${expectedStudents.map(e => '<span style="display:inline-block; margin: 2px 4px 0 0; padding: 3px 10px; background: var(--brand-tint); border-radius: 999px; font-size: 12px; color: var(--brand-ink);">' + ui.escapeHtml(e.studentId) + '</span>').join('')}
      </div>

      <div class="section-divider">Boarded so far</div>
      <div id="dr-boarded-list"></div>
    `;

    drawQrInto(content.querySelector('#dr-qr-target'), payload);
    startQrTimer(content, payload);
    paintBoardedList(content, activeClass);

    content.querySelector('[data-refresh]').addEventListener('click', async () => {
      stopQrTimer();
      payload = await issueQr(activeClass, currentUser);
      drawQrInto(content.querySelector('#dr-qr-target'), payload);
      startQrTimer(content, payload);
      ui.toast('QR refreshed.', 'success', 1200);
    });

    // Re-render boarded list every 3s in case students scan
    const boardTimer = setInterval(() => {
      if (!document.body.contains(content)) { clearInterval(boardTimer); return; }
      if (window.location.hash !== '#/scan') { clearInterval(boardTimer); return; }
      paintBoardedList(content, activeClass);
    }, 3000);
  }

  async function issueQr(cls, currentUser) {
    const issuedAt = Date.now();
    const expiresAt = issuedAt + QR_VALIDITY_MIN * 60 * 1000;
    const today = new Date();
    const classDate = today.toISOString().slice(0, 10);
    const payload = {
      driverId: currentUser.id,
      classId: cls.id,
      classDate,
      issuedAt,
      expiresAt
    };
    payload.sig = (await ui.quickHash(JSON.stringify(payload))).slice(0, 16);
    return payload;
  }

  function drawQrInto(targetEl, payload) {
    if (!targetEl) return;
    targetEl.innerHTML = '';
    const data = JSON.stringify(payload);
    if (typeof window.qrcode === 'function') {
      const qr = window.qrcode(0, 'M');
      qr.addData(data);
      qr.make();
      targetEl.innerHTML = qr.createImgTag(6, 0);
    } else {
      targetEl.textContent = data;
    }
  }

  function startQrTimer(content, payload) {
    stopQrTimer();
    const tickEl = content.querySelector('[data-tick]');
    const wrapEl = content.querySelector('[data-countdown]');
    if (!tickEl) return;
    function tick() {
      const remain = payload.expiresAt - Date.now();
      if (remain <= 0) {
        tickEl.textContent = 'expired';
        wrapEl.classList.remove('is-expiring');
        wrapEl.classList.add('is-expired');
        stopQrTimer();
        return;
      }
      const min = Math.floor(remain / 60000);
      const sec = Math.floor((remain % 60000) / 1000);
      tickEl.textContent = String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
      if (remain < 60000) wrapEl.classList.add('is-expiring');
    }
    tick();
    qrTimer = setInterval(tick, 1000);
  }

  function stopQrTimer() {
    if (qrTimer) { clearInterval(qrTimer); qrTimer = null; }
  }

  function paintBoardedList(content, activeClass) {
    const wrap = content.querySelector('#dr-boarded-list');
    if (!wrap) return;
    const today = new Date().toISOString().slice(0, 10);
    const boarded = store.filter('pickups',
      p => p.classId === activeClass.id && p.date === today && p.status === 'completed'
    );
    if (boarded.length === 0) {
      wrap.innerHTML = '<div class="empty-state" style="padding: 24px; font-size: 13px;"><i class="fa-solid fa-user-clock"></i><br>Waiting for students to scan...</div>';
      return;
    }
    wrap.innerHTML = boarded.map(b => `
      <div class="dr-row">
        <div class="dr-row__time"><i class="fa-solid fa-circle-check" style="color: var(--success);"></i></div>
        <div class="dr-row__class">${ui.escapeHtml(b.studentId)}${b.studentName ? ' · ' + ui.escapeHtml(b.studentName) : ''}</div>
        <div class="dr-row__loc">${ui.formatDate(b.boardedAt || b.createdAt, 'time')}</div>
      </div>
    `).join('');
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
})();
