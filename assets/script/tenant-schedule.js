/* =====================================================================
   tenant-schedule.js — Class enrollments + scanner for the driver's pickup QR
   (Direction: driver-shows / student-scans. Round 6 trip-driven refactor:
   day + startTime now live on classes (master), enrollments link student
   to class, the bus trip is whichever class meets today with >=1 enrollment.)
   ===================================================================== */

(function () {
  'use strict';

  function isMobile() { return window.innerWidth <= 900; }

  const PICKUP_WINDOW_MIN = 15;
  let scanner = null;

  window.tenantScheduleInit = function ({ content, currentUser }) {
    cleanupScanner();
    if (isMobile()) {
      renderMobileList(content, currentUser);
    } else {
      renderList(content, currentUser);
    }
  };

  function classOf(enrollment) {
    if (!enrollment) return null;
    return store.findById('classes', enrollment.classId);
  }

  function renderMobileList(content, currentUser) {
    cleanupScanner();
    const enrollments = store.filter('enrollments', e => e.userId === currentUser.id);
    const now = new Date();
    const activeCount = enrollments.filter(e => isPickupWindowActive(e, now)).length;
    const boardedToday = enrollments.filter(e => hasBoardedToday(e.id, currentUser)).length;

    content.innerHTML = `
      <div class="m-greeting" style="padding: var(--space-2) var(--space-2) var(--space-3);">
        <div class="m-greeting__hello">My Class Schedule</div>
        <div class="m-greeting__date">Pickup opens ${PICKUP_WINDOW_MIN} min before class. Scan driver's QR to board.</div>
      </div>

      ${activeCount > 0 ? `
        <div class="m-hero-card" style="background: var(--brand-tint); border-color: var(--brand-primary);">
          <div class="m-hero-card__label" style="color: var(--brand-primary-dark);">Pickup Window Open</div>
          <div class="m-hero-card__value" style="color: var(--brand-primary-dark);">${activeCount}</div>
          <div class="m-hero-card__summary" style="color: var(--brand-primary-dark);">
            <span><i class="fa-solid fa-bolt"></i>&nbsp;Tap Scan to Board below</span>
          </div>
        </div>
      ` : ''}

      <div class="m-stats-row">
        <div class="m-stat-card">
          <div class="m-stat-card__label">Total Classes</div>
          <div class="m-stat-card__value">${enrollments.length}</div>
          <div class="m-stat-card__delta">enrolled</div>
        </div>
        <div class="m-stat-card">
          <div class="m-stat-card__label">Boarded Today</div>
          <div class="m-stat-card__value">${boardedToday}</div>
          <div class="m-stat-card__delta">${boardedToday > 0 ? 'on board' : 'not yet'}</div>
        </div>
      </div>

      <button type="button" class="btn btn-primary" data-add-class style="width: 100%; padding: 12px; margin-bottom: var(--space-4);">
        <i class="fa-solid fa-plus" aria-hidden="true"></i>&nbsp;Add Class
      </button>

      <div class="m-section-label">My Classes <span class="m-carousel-hint">${enrollments.length}</span></div>
      <div class="m-list-card">
        ${enrollments.length === 0 ? '<div class="m-list-card__row" style="justify-content: center; color: var(--ink-500); padding: var(--space-6);">No classes yet — tap Add Class</div>'
          : enrollments.map(e => {
            const cls = classOf(e);
            const day = cls ? cls.day : '—';
            const startTime = cls ? cls.startTime : '—';
            const active = isPickupWindowActive(e, now);
            const boarded = hasBoardedToday(e.id, currentUser);
            return `
              <div class="m-list-card__row">
                <i class="fa-solid fa-clock activity-feed__icon activity-feed__icon--${active ? 'pickup' : boarded ? 'payment' : 'maintenance'}" aria-hidden="true"></i>
                <div class="m-list-card__main">
                  <span class="m-list-card__title">${ui.escapeHtml(day)} &middot; ${ui.escapeHtml(startTime)}</span>
                  <span class="m-list-card__meta">${ui.escapeHtml(classLabel(e.classId))}</span>
                  <span class="m-list-card__meta" style="font-size: 11px; opacity: 0.8;"><i class="fa-solid fa-location-dot"></i>&nbsp;${ui.escapeHtml(e.pickupLocation)}</span>
                  <div style="margin-top: 8px; display: flex; gap: 6px;">
                    ${boarded ? '<button class="btn btn-ghost btn-sm" disabled><i class="fa-solid fa-check"></i>&nbsp;Boarded</button>'
                      : active ? '<button class="btn btn-primary btn-sm" data-scan="' + ui.escapeHtml(e.id) + '"><i class="fa-solid fa-qrcode"></i>&nbsp;Scan to Board</button>'
                      : '<button class="btn btn-ghost btn-sm" disabled><i class="fa-solid fa-qrcode"></i>&nbsp;Wait for window</button>'}
                    <button class="btn btn-ghost btn-sm" data-delete="${ui.escapeHtml(e.id)}"><i class="fa-solid fa-trash"></i></button>
                  </div>
                </div>
                ${boarded ? '<span class="badge badge--success" style="font-size: 10px; flex-shrink: 0;">BOARDED</span>'
                  : active ? '<span class="badge badge--warning" style="font-size: 10px; flex-shrink: 0;">NOW</span>'
                  : ''}
              </div>
            `;
          }).join('')}
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
        store.remove('enrollments', b.dataset.delete);
        renderMobileList(content, currentUser);
      });
    });
  }

  function renderList(content, currentUser) {
    cleanupScanner();
    const enrollments = store.filter('enrollments', e => e.userId === currentUser.id);
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
            ${enrollments.length === 0
              ? '<tr><td colspan="6" style="text-align:center; padding: 32px; color: var(--ink-500);">No classes yet — click Add Class</td></tr>'
              : enrollments.map(e => {
                const cls = classOf(e);
                const day = cls ? cls.day : '—';
                const startTime = cls ? cls.startTime : '—';
                const active = isPickupWindowActive(e, now);
                const boarded = hasBoardedToday(e.id, currentUser);
                return `
                  <tr>
                    <td><strong>${ui.escapeHtml(day)}</strong></td>
                    <td>${ui.escapeHtml(classLabel(e.classId))}</td>
                    <td>${ui.escapeHtml(startTime)}</td>
                    <td>${ui.escapeHtml(e.pickupLocation)}</td>
                    <td>${
                      boarded ? '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Boarded</span>'
                      : active ? '<span class="now-badge">Now</span>'
                      : '<span class="badge badge-neutral">' + (e.status === 'active' ? 'Active' : e.status) + '</span>'
                    }</td>
                    <td style="text-align:right;">
                      ${boarded
                        ? '<button class="btn btn-ghost btn-sm" disabled><i class="fa-solid fa-check"></i> Boarded</button>'
                        : active
                          ? '<button class="btn btn-primary btn-sm" data-scan="' + e.id + '"><i class="fa-solid fa-qrcode"></i> Scan to Board</button>'
                          : '<button class="btn btn-ghost btn-sm" disabled title="Available during pickup window"><i class="fa-solid fa-qrcode"></i></button>'}
                      <button class="btn btn-ghost btn-sm" data-delete="${e.id}"><i class="fa-solid fa-trash"></i></button>
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
        store.remove('enrollments', b.dataset.delete);
        renderList(content, currentUser);
      });
    });
  }

  function renderScanner(content, currentUser, enrollmentId) {
    cleanupScanner();
    const enrollment = store.findById('enrollments', enrollmentId);
    if (!enrollment) { renderList(content, currentUser); return; }
    const cls = classOf(enrollment);
    const startTimeText = cls ? cls.startTime : '';

    content.innerHTML = `
      <div class="section-header">
        <div>
          <div class="section-title">Scan driver's QR to board</div>
          <div class="section-subtitle">${ui.escapeHtml(classLabel(enrollment.classId))} · ${ui.escapeHtml(startTimeText)} · ${ui.escapeHtml(enrollment.pickupLocation)}</div>
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
    content.querySelector('[data-switch]').addEventListener('click', () => switchCamera(content, currentUser, enrollment));

    startScanner(content, currentUser, enrollment);
  }

  function startScanner(content, currentUser, enrollment, facingMode = 'environment') {
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
      showResult(result, content, currentUser, enrollment);
    }).catch(err => {
      ui.toast('Camera unavailable: ' + (err.message || err), 'danger');
    });
  }

  function switchCamera(content, currentUser, enrollment) {
    cleanupScanner();
    setTimeout(() => startScanner(content, currentUser, enrollment, 'user'), 200);
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
    if (!payload.driverId || !payload.classId || !payload.issuedAt || !payload.expiresAt || !payload.sig) {
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
    // Rule 4: class must exist and meet today
    const cls = store.findById('classes', payload.classId);
    if (!cls) return { ok: false, reason: 'Class not found.' };
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayDay = days[new Date().getDay()];
    if (cls.day !== todayDay) return { ok: false, reason: 'This class is not scheduled for today.' };
    // Rule 5: I must be enrolled in that class
    const enrollment = store.find('enrollments', e => e.userId === currentUser.id && e.classId === payload.classId);
    if (!enrollment) return { ok: false, reason: 'You are not enrolled in this class.' };
    // Rule 6: pickup window must be open
    if (!isPickupWindowActive(enrollment, new Date())) {
      return { ok: false, reason: 'Pickup window for this class is not open.' };
    }
    // Rule 7: driver must be a registered driver
    const driver = auth.listUsers().find(u => u.id === payload.driverId);
    if (!driver || driver.role !== 'driver') {
      return { ok: false, reason: 'QR is not from a registered driver.' };
    }
    // Already boarded today?
    if (hasBoardedToday(enrollment.id, currentUser)) {
      return { ok: false, reason: 'You have already boarded this pickup today.' };
    }
    return {
      ok: true,
      driver,
      enrollment,
      classData: cls,
      classLabelText: classLabel(cls.id)
    };
  }

  function showResult(result, content, currentUser, enrollment) {
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
            Pickup: ${ui.escapeHtml(result.enrollment.pickupLocation)}
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
        enrollmentId: result.enrollment.id,
        classId: result.classData.id,
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
      renderScanner(content, currentUser, enrollment.id);
    });
    overlay.querySelector('[data-retry]')?.addEventListener('click', () => {
      overlay.remove();
      renderScanner(content, currentUser, enrollment.id);
    });
  }

  function hasBoardedToday(enrollmentId, currentUser) {
    const today = new Date().toISOString().slice(0, 10);
    return store.filter('pickups',
      p => p.enrollmentId === enrollmentId && p.userId === currentUser.id && p.date === today && p.status === 'completed'
    ).length > 0;
  }

  function isPickupWindowActive(enrollment, now) {
    const cls = classOf(enrollment);
    if (!cls) return false;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (cls.day !== days[now.getDay()]) return false;
    const [h, m] = cls.startTime.split(':').map(Number);
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime();
    const open = start - PICKUP_WINDOW_MIN * 60 * 1000;
    return now.getTime() >= open && now.getTime() < start;
  }

  function classLabel(id) {
    const c = store.findById('classes', id);
    return c ? c.name : id;
  }

  function openAddModal(content, currentUser) {
    const allClasses = store.readAll('classes');
    const myEnrollments = store.filter('enrollments', e => e.userId === currentUser.id);
    const enrolledClassIds = new Set(myEnrollments.map(e => e.classId));
    const availableClasses = allClasses.filter(c => !enrolledClassIds.has(c.id));

    const body = document.createElement('div');
    body.innerHTML = `
      <form class="schedule-form">
        ${availableClasses.length === 0 ? `
          <p class="text-mute" style="text-align: center; padding: var(--space-4);">
            You are already enrolled in every available class.
          </p>
        ` : `
          <div class="field">
            <label class="field-label" for="sf-class">Class</label>
            <select class="select" id="sf-class" name="classId" required>
              ${availableClasses.map(c => `<option value="${ui.escapeHtml(c.id)}">${ui.escapeHtml(c.name)} (${ui.escapeHtml(c.code)}) — ${ui.escapeHtml(c.day)} ${ui.escapeHtml(c.startTime)}</option>`).join('')}
            </select>
            <div class="field-help" style="font-size: 12px; color: var(--ink-500); margin-top: 4px;">Day &amp; time come from the class itself.</div>
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
        `}
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
    save.disabled = availableClasses.length === 0;
    save.addEventListener('click', () => {
      const data = Object.fromEntries(new FormData(body.querySelector('form')).entries());
      data.userId = currentUser.id;
      data.studentId = currentUser.studentId;
      data.status = 'active';
      data.id = 'EN-' + data.classId.replace(/^CLS-/, '') + '-' + currentUser.id;
      store.insert('enrollments', data);
      ui.toast('Class added.', 'success');
      ui.closeModal();
      if (isMobile()) renderMobileList(content, currentUser);
      else renderList(content, currentUser);
    });
    footer.appendChild(cancel); footer.appendChild(save);
    ui.openModal({ title: 'Add class to schedule', body, footer });
  }
})();
