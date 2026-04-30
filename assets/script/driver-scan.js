/* =====================================================================
   driver-scan.js — QR scanner with 5-rule validation
   ===================================================================== */

(function () {
  'use strict';

  const PICKUP_WINDOW_MIN = 15;
  let scanner = null;

  window.driverScanInit = function ({ content, currentUser }) {
    cleanup();
    render(content, currentUser);
  };

  window.driverScanCleanup = cleanup;

  function render(content, currentUser) {
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayDay = days[now.getDay()];
    const todaySchedules = store.filter('schedules', s => s.day === todayDay);
    const activeWindow = todaySchedules.find(s => isWindowActive(s, now));
    const expected = activeWindow
      ? store.filter('schedules', s => s.id === activeWindow.id || (s.day === activeWindow.day && s.startTime === activeWindow.startTime))
      : [];

    content.innerHTML = `
      <div class="d-page-h">
        <div class="d-page-h__title">Scan student QR</div>
        <div class="d-page-h__sub">Aim camera at the student's pickup QR code</div>
      </div>

      <div class="scanner-context">
        ${activeWindow
          ? '<strong>Active window:</strong> ' + ui.escapeHtml(activeWindow.startTime) + ' ' + ui.escapeHtml(classLabel(activeWindow.classId)) + '<br>Expected: ' + expected.map(e => ui.escapeHtml(e.studentId)).join(', ')
          : '<strong>No active pickup window</strong><br>Scans during this time will fail validation.'}
      </div>

      <div class="scanner-stage" id="qr-reader">
        <div class="scanner-frame"></div>
      </div>

      <button class="btn btn-secondary btn-block" data-switch>
        <i class="fa-solid fa-camera-rotate"></i> Switch camera
      </button>
      <p class="text-xs text-mute mt-3" style="text-align: center;">
        Camera permission required. If the camera doesn't appear, check site permissions in your browser.
      </p>
    `;

    content.querySelector('[data-switch]').addEventListener('click', () => switchCamera(content, currentUser));

    startScanner(content, currentUser);
  }

  function startScanner(content, currentUser, facingMode = 'environment') {
    cleanup();
    if (!window.Html5Qrcode) {
      ui.toast('QR scanner library failed to load.', 'danger');
      return;
    }
    const reader = content.querySelector('#qr-reader');
    if (!reader) return;
    reader._busy = false;
    scanner = new Html5Qrcode('qr-reader', { verbose: false });
    const config = { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1.0 };

    scanner.start({ facingMode }, config, async (decoded) => {
      if (reader._busy) return;
      reader._busy = true;
      const result = await verifyQR(decoded, currentUser);
      showResult(result, content, currentUser);
    }).catch(err => {
      ui.toast('Camera unavailable: ' + (err.message || err), 'danger');
    });
  }

  function switchCamera(content, currentUser) {
    cleanup();
    setTimeout(() => startScanner(content, currentUser, 'user'), 200);
  }

  function cleanup() {
    if (scanner) {
      try { scanner.stop().catch(() => {}); } catch (e) {}
      try { scanner.clear(); } catch (e) {}
      scanner = null;
    }
  }

  async function verifyQR(decodedText, currentUser) {
    let payload;
    try {
      payload = JSON.parse(decodedText);
    } catch (e) {
      return { ok: false, reason: 'QR is not a valid pickup code.' };
    }
    if (!payload.studentId || !payload.scheduleId || !payload.issuedAt || !payload.expiresAt || !payload.sig) {
      return { ok: false, reason: 'QR payload is incomplete.' };
    }
    // Rule 1+2: signature integrity
    const { sig, ...rest } = payload;
    const expectedSig = (await ui.quickHash(JSON.stringify(rest))).slice(0, 16);
    if (expectedSig !== sig) {
      return { ok: false, reason: 'QR signature mismatch (forged or corrupt).' };
    }
    // Rule 3: time window
    const now = Date.now();
    if (now < payload.issuedAt) return { ok: false, reason: 'QR not yet valid.' };
    if (now > payload.expiresAt) {
      const min = Math.floor((now - payload.expiresAt) / 60000);
      return { ok: false, reason: 'QR expired (' + min + ' min ago). Ask student to refresh.' };
    }
    // Rule 4: schedule must exist and be in driver's today list
    const schedule = store.findById('schedules', payload.scheduleId);
    if (!schedule) return { ok: false, reason: 'Schedule not found.' };
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayDay = days[new Date().getDay()];
    if (schedule.day !== todayDay) return { ok: false, reason: 'Schedule is not for today.' };
    if (!isWindowActive(schedule, new Date())) {
      return { ok: false, reason: 'Pickup window for this class is not open.' };
    }
    // Rule 5: studentId matches schedule's studentId
    if (schedule.studentId !== payload.studentId) {
      return { ok: false, reason: 'Student does not match this pickup.' };
    }
    // All passed
    const studentName = lookupStudentName(payload.studentId);
    const pickupRow = {
      id: 'PK-' + Date.now().toString().slice(-6),
      driverId: currentUser.id,
      scheduleId: schedule.id,
      studentId: payload.studentId,
      classLabel: classLabel(schedule.classId),
      date: new Date().toISOString().slice(0, 10),
      status: 'pending_confirm'
    };
    return {
      ok: true,
      studentName,
      studentId: payload.studentId,
      classLabel: classLabel(schedule.classId),
      scheduleId: schedule.id,
      pickupLocation: schedule.pickupLocation,
      pickupRow
    };
  }

  function showResult(result, content, currentUser) {
    cleanup();
    const overlay = document.createElement('div');
    overlay.className = 'scan-result ' + (result.ok ? 'scan-result--valid' : 'scan-result--invalid');
    if (result.ok) {
      overlay.innerHTML = `
        <div class="scan-result__card">
          <div class="scan-result__icon"><i class="fa-solid fa-circle-check"></i></div>
          <div class="scan-result__title">Valid</div>
          <div class="scan-result__detail">
            <strong>${ui.escapeHtml(result.studentName)}</strong><br>
            ${ui.escapeHtml(result.studentId)}<br>
            ${ui.escapeHtml(result.classLabel)}<br>
            ${ui.escapeHtml(result.pickupLocation)}
          </div>
          <div class="scan-result__actions">
            <button class="btn btn-primary" data-confirm>Confirm Pickup</button>
            <button class="btn btn-ghost" data-close>Close</button>
          </div>
        </div>
      `;
    } else {
      overlay.innerHTML = `
        <div class="scan-result__card">
          <div class="scan-result__icon"><i class="fa-solid fa-circle-xmark"></i></div>
          <div class="scan-result__title">Invalid</div>
          <div class="scan-result__detail">${ui.escapeHtml(result.reason)}</div>
          <div class="scan-result__actions">
            <button class="btn btn-primary" data-retry>Try again</button>
          </div>
        </div>
      `;
    }
    document.body.appendChild(overlay);

    overlay.querySelector('[data-confirm]')?.addEventListener('click', () => {
      const row = result.pickupRow;
      row.status = 'completed';
      store.insert('pickups', row);
      ui.toast('Pickup confirmed.', 'success');
      overlay.remove();
      window.location.hash = '#/';
    });
    overlay.querySelector('[data-close]')?.addEventListener('click', () => {
      overlay.remove();
      render(content, currentUser);
    });
    overlay.querySelector('[data-retry]')?.addEventListener('click', () => {
      overlay.remove();
      render(content, currentUser);
    });
  }

  function isWindowActive(s, now) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (s.day !== days[now.getDay()]) return false;
    const [h, m] = s.startTime.split(':').map(Number);
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime();
    const open = start - PICKUP_WINDOW_MIN * 60 * 1000;
    return now.getTime() >= open && now.getTime() < start;
  }

  function classLabel(id) {
    const c = store.findById('classes', id);
    return c ? c.name : id;
  }

  function lookupStudentName(studentId) {
    const matches = [...auth.listUsers(), ...store.readAll('extra_tenants')]
      .filter(u => u.studentId === studentId);
    return matches[0]?.name || studentId;
  }
})();
