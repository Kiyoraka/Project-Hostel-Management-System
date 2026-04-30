/* =====================================================================
   tenant-schedule.js — Class schedule + scanner for the driver's pickup QR
   (Direction flipped: driver-shows / student-scans. Student's role here is
   to verify the driver's QR is for ONE of MY scheduled classes RIGHT NOW
   and record the boarding event into the pickups store.)
   ===================================================================== */

(function () {
  'use strict';

  const PICKUP_WINDOW_MIN = 15;
  let scanner = null;

  window.tenantScheduleInit = function ({ content, currentUser }) {
    cleanupScanner();
    renderList(content, currentUser);
  };

  function renderList(content, currentUser) {
    cleanupScanner();
    const schedules = store.filter('schedules', s => s.userId === currentUser.id);
    const now = new Date();

    content.innerHTML = `
      <div class="section-header">
        <div>
          <div class="section-title">My Class Schedule</div>
          <div class="section-subtitle">Pickup window opens ${PICKUP_WINDOW_MIN} min before class start. Scan the driver's QR to board.</div>
        </div>
        <button type="button" class="btn btn-primary" data-add-class>
          <i class="fa-solid fa-plus"></i> Add Class
        </button>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Class</th>
              <th>Time</th>
              <th>Pickup</th>
              <th>Status</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${schedules.length === 0
              ? '<tr><td colspan="6" style="text-align:center; padding: 32px; color: var(--ink-500);">No classes yet — click Add Class</td></tr>'
              : schedules.map(s => {
                const active = isPickupWindowActive(s, now);
                const boarded = hasBoardedToday(s.id, currentUser);
                return `
                  <tr>
                    <td><strong>${ui.escapeHtml(s.day)}</strong></td>
                    <td>${ui.escapeHtml(classLabel(s.classId))}</td>
                    <td>${ui.escapeHtml(s.startTime)}</td>
                    <td>${ui.escapeHtml(s.pickupLocation)}</td>
                    <td>${
                      boarded ? '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Boarded</span>'
                      : active ? '<span class="now-badge">Now</span>'
                      : '<span class="badge badge-neutral">' + (s.status === 'active' ? 'Active' : s.status) + '</span>'
                    }</td>
                    <td style="text-align:right;">
                      ${boarded
                        ? '<button class="btn btn-ghost btn-sm" disabled><i class="fa-solid fa-check"></i> Boarded</button>'
                        : active
                          ? '<button class="btn btn-primary btn-sm" data-scan="' + s.id + '"><i class="fa-solid fa-qrcode"></i> Scan to Board</button>'
                          : '<button class="btn btn-ghost btn-sm" disabled title="Available during pickup window"><i class="fa-solid fa-qrcode"></i></button>'}
                      <button class="btn btn-ghost btn-sm" data-delete="${s.id}"><i class="fa-solid fa-trash"></i></button>
                    </td>
                  </tr>
                `;
              }).join('')}
          </tbody>
        </table>
      </div>
    `;

    content.querySelector('[data-add-class]')?.addEventListener('click', () => openAddModal(content, currentUser));
    content.querySelectorAll('[data-scan]').forEach(b => {
      b.addEventListener('click', () => renderScanner(content, currentUser, b.dataset.scan));
    });
    content.querySelectorAll('[data-delete]').forEach(b => {
      b.addEventListener('click', async () => {
        const ok = await ui.confirmDialog({ title: 'Remove class', message: 'Remove this class from your schedule?', danger: true, confirmText: 'Remove' });
        if (!ok) return;
        store.remove('schedules', b.dataset.delete);
        renderList(content, currentUser);
      });
    });
  }

  function renderScanner(content, currentUser, scheduleId) {
    cleanupScanner();
    const schedule = store.findById('schedules', scheduleId);
    if (!schedule) { renderList(content, currentUser); return; }

    content.innerHTML = `
      <div class="section-header">
        <div>
          <div class="section-title">Scan driver's QR to board</div>
          <div class="section-subtitle">${ui.escapeHtml(classLabel(schedule.classId))} · ${ui.escapeHtml(schedule.startTime)} · ${ui.escapeHtml(schedule.pickupLocation)}</div>
        </div>
        <button type="button" class="btn btn-secondary" data-back>
          <i class="fa-solid fa-arrow-left"></i> Back to schedule
        </button>
      </div>

      <div style="max-width: 480px; margin: 0 auto;">
        <div class="scanner-stage" id="qr-reader">
          <div class="scanner-frame"></div>
        </div>
        <p class="text-mute mt-3" style="text-align: center; font-size: 13px;">
          Aim your camera at the driver's pickup QR. Camera permission is required — if it doesn't appear, check site permissions.
        </p>
        <button class="btn btn-secondary btn-block mt-3" data-switch>
          <i class="fa-solid fa-camera-rotate"></i> Switch camera
        </button>
      </div>
    `;

    content.querySelector('[data-back]').addEventListener('click', () => renderList(content, currentUser));
    content.querySelector('[data-switch]').addEventListener('click', () => switchCamera(content, currentUser, schedule));

    startScanner(content, currentUser, schedule);
  }

  function startScanner(content, currentUser, schedule, facingMode = 'environment') {
    cleanupScanner();
    if (!window.Html5Qrcode) { ui.toast('QR scanner library failed to load.', 'danger'); return; }
    const reader = content.querySelector('#qr-reader');
    if (!reader) return;
    reader._busy = false;
    scanner = new Html5Qrcode('qr-reader', { verbose: false });
    const config = { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1.0 };

    scanner.start({ facingMode }, config, async (decoded) => {
      if (reader._busy) return;
      reader._busy = true;
      const result = await verifyDriverQR(decoded, currentUser);
      showResult(result, content, currentUser, schedule);
    }).catch(err => {
      ui.toast('Camera unavailable: ' + (err.message || err), 'danger');
    });
  }

  function switchCamera(content, currentUser, schedule) {
    cleanupScanner();
    setTimeout(() => startScanner(content, currentUser, schedule, 'user'), 200);
  }

  function cleanupScanner() {
    if (scanner) {
      try { scanner.stop().catch(() => {}); } catch (e) {}
      try { scanner.clear(); } catch (e) {}
      scanner = null;
    }
  }

  async function verifyDriverQR(decodedText, currentUser) {
    let payload;
    try {
      payload = JSON.parse(decodedText);
    } catch (e) {
      return { ok: false, reason: 'Not a valid pickup QR.' };
    }
    if (!payload.driverId || !payload.scheduleId || !payload.issuedAt || !payload.expiresAt || !payload.sig) {
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
      return { ok: false, reason: 'QR expired (' + min + ' min ago). Ask the driver to refresh.' };
    }
    // Rule 4: schedule must exist, be one of MY schedules, today
    const schedule = store.findById('schedules', payload.scheduleId);
    if (!schedule) return { ok: false, reason: 'Schedule not found.' };
    if (schedule.userId !== currentUser.id) {
      return { ok: false, reason: 'This pickup is not on your schedule.' };
    }
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayDay = days[new Date().getDay()];
    if (schedule.day !== todayDay) return { ok: false, reason: 'Schedule is not for today.' };
    if (!isPickupWindowActive(schedule, new Date())) {
      return { ok: false, reason: 'Pickup window for this class is not open.' };
    }
    // Rule 5: driver must be a registered driver
    const driver = auth.listUsers().find(u => u.id === payload.driverId);
    if (!driver || driver.role !== 'driver') {
      return { ok: false, reason: 'QR is not from a registered driver.' };
    }
    // Already boarded today?
    if (hasBoardedToday(schedule.id, currentUser)) {
      return { ok: false, reason: 'You have already boarded this pickup today.' };
    }
    return {
      ok: true,
      driver,
      schedule,
      classLabelText: classLabel(schedule.classId)
    };
  }

  function showResult(result, content, currentUser, schedule) {
    cleanupScanner();
    const overlay = document.createElement('div');
    overlay.className = 'scan-result ' + (result.ok ? 'scan-result--valid' : 'scan-result--invalid');
    if (result.ok) {
      overlay.innerHTML = `
        <div class="scan-result__card">
          <div class="scan-result__icon"><i class="fa-solid fa-circle-check"></i></div>
          <div class="scan-result__title">You're on board</div>
          <div class="scan-result__detail">
            Driver: <strong>${ui.escapeHtml(result.driver.name)}</strong> · ${ui.escapeHtml(result.driver.vehiclePlate || '')}<br>
            Class: ${ui.escapeHtml(result.classLabelText)}<br>
            Pickup: ${ui.escapeHtml(result.schedule.pickupLocation)}
          </div>
          <div class="scan-result__actions">
            <button class="btn btn-primary" data-confirm>Confirm boarding</button>
            <button class="btn btn-ghost" data-close>Close</button>
          </div>
        </div>
      `;
    } else {
      overlay.innerHTML = `
        <div class="scan-result__card">
          <div class="scan-result__icon"><i class="fa-solid fa-circle-xmark"></i></div>
          <div class="scan-result__title">Cannot board</div>
          <div class="scan-result__detail">${ui.escapeHtml(result.reason)}</div>
          <div class="scan-result__actions">
            <button class="btn btn-primary" data-retry>Try again</button>
          </div>
        </div>
      `;
    }
    document.body.appendChild(overlay);

    overlay.querySelector('[data-confirm]')?.addEventListener('click', () => {
      const row = {
        id: 'PK-' + Date.now().toString().slice(-6),
        driverId: result.driver.id,
        scheduleId: result.schedule.id,
        studentId: currentUser.studentId,
        studentName: currentUser.name,
        userId: currentUser.id,
        classLabel: result.classLabelText,
        date: new Date().toISOString().slice(0, 10),
        boardedAt: new Date().toISOString(),
        status: 'completed'
      };
      store.insert('pickups', row);
      ui.toast('Boarded! Have a good ride.', 'success');
      overlay.remove();
      renderList(content, currentUser);
    });
    overlay.querySelector('[data-close]')?.addEventListener('click', () => {
      overlay.remove();
      renderScanner(content, currentUser, schedule.id);
    });
    overlay.querySelector('[data-retry]')?.addEventListener('click', () => {
      overlay.remove();
      renderScanner(content, currentUser, schedule.id);
    });
  }

  function hasBoardedToday(scheduleId, currentUser) {
    const today = new Date().toISOString().slice(0, 10);
    return store.filter('pickups',
      p => p.scheduleId === scheduleId && p.userId === currentUser.id && p.date === today && p.status === 'completed'
    ).length > 0;
  }

  function isPickupWindowActive(s, now) {
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

  function openAddModal(content, currentUser) {
    const classes = store.readAll('classes');
    const body = document.createElement('div');
    body.innerHTML = `
      <form class="schedule-form">
        <div class="grid grid-cols-2 gap-3">
          <div class="field">
            <label class="field-label" for="sf-day">Day</label>
            <select class="select" id="sf-day" name="day" required>
              ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => `<option>${d}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label class="field-label" for="sf-time">Start time</label>
            <input class="input" id="sf-time" name="startTime" type="time" required value="09:00">
          </div>
        </div>
        <div class="field">
          <label class="field-label" for="sf-class">Class</label>
          <select class="select" id="sf-class" name="classId" required>
            ${classes.map(c => `<option value="${ui.escapeHtml(c.id)}">${ui.escapeHtml(c.name)} (${ui.escapeHtml(c.code)})</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label" for="sf-pickup">Pickup location</label>
          <select class="select" id="sf-pickup" name="pickupLocation" required>
            <option>Block A Lobby</option>
            <option>Block B Lobby</option>
            <option>Block C Lobby</option>
            <option>Main Gate</option>
          </select>
        </div>
      </form>
    `;
    const footer = document.createElement('div');
    footer.style.display = 'flex'; footer.style.gap = '12px';
    const cancel = document.createElement('button');
    cancel.className = 'btn btn-secondary';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', () => ui.closeModal());
    const save = document.createElement('button');
    save.className = 'btn btn-primary';
    save.textContent = 'Add class';
    save.addEventListener('click', () => {
      const data = Object.fromEntries(new FormData(body.querySelector('form')).entries());
      data.userId = currentUser.id;
      data.studentId = currentUser.studentId;
      data.status = 'active';
      data.id = 'SCH-' + data.day + '-' + data.startTime.replace(':', '');
      store.insert('schedules', data);
      ui.toast('Class added.', 'success');
      ui.closeModal();
      renderList(content, currentUser);
    });
    footer.appendChild(cancel); footer.appendChild(save);
    ui.openModal({ title: 'Add class to schedule', body, footer });
  }
})();
