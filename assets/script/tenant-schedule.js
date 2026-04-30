/* =====================================================================
   tenant-schedule.js — Class schedule + time-bound QR pickup code
   ===================================================================== */

(function () {
  'use strict';

  const PICKUP_WINDOW_MIN = 15;   // pickup opens 15 min before class start
  const QR_VALIDITY_MIN = 10;     // each QR valid for 10 min from issue

  let qrTimer = null;

  window.tenantScheduleInit = function ({ content, currentUser }) {
    stopQrTimer();
    renderList(content, currentUser);
  };

  function renderList(content, currentUser) {
    stopQrTimer();
    const schedules = store.filter('schedules', s => s.userId === currentUser.id);
    const now = new Date();

    content.innerHTML = `
      <div class="section-header">
        <div>
          <div class="section-title">My Class Schedule</div>
          <div class="section-subtitle">Pickup window opens ${PICKUP_WINDOW_MIN} min before class start, closes at class start</div>
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
                return `
                  <tr>
                    <td><strong>${ui.escapeHtml(s.day)}</strong></td>
                    <td>${ui.escapeHtml(classLabel(s.classId))}</td>
                    <td>${ui.escapeHtml(s.startTime)}</td>
                    <td>${ui.escapeHtml(s.pickupLocation)}</td>
                    <td>${active ? '<span class="now-badge">Now</span>' : '<span class="badge badge-neutral">' + (s.status === 'active' ? 'Active' : s.status) + '</span>'}</td>
                    <td style="text-align:right;">
                      ${active
                        ? '<button class="btn btn-primary btn-sm" data-show-qr="' + s.id + '"><i class="fa-solid fa-qrcode"></i> Show QR</button>'
                        : '<button class="btn btn-ghost btn-sm" data-show-qr="' + s.id + '" title="Preview QR (only valid during pickup window)"><i class="fa-solid fa-qrcode"></i></button>'}
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
    content.querySelectorAll('[data-show-qr]').forEach(b => {
      b.addEventListener('click', () => renderQr(content, currentUser, b.dataset.showQr));
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

  async function renderQr(content, currentUser, scheduleId) {
    const s = store.findById('schedules', scheduleId);
    if (!s) return;
    const now = new Date();
    const active = isPickupWindowActive(s, now);

    let payload = await issueQr(s, currentUser);

    content.innerHTML = `
      <div class="section-header">
        <div>
          <div class="section-title">Pickup QR Code</div>
          <div class="section-subtitle">${active ? 'Pickup window is OPEN' : 'Preview only - QR will only scan valid during the pickup window'}</div>
        </div>
        <button type="button" class="btn btn-secondary" data-back>
          <i class="fa-solid fa-arrow-left"></i> Back to schedule
        </button>
      </div>

      <div class="qr-stage">
        <div class="qr-card">
          <div class="qr-card__qr" id="qr-target"></div>
          <div class="qr-card__class">${ui.escapeHtml(classLabel(s.classId))}</div>
          <div class="qr-card__pickup"><i class="fa-solid fa-location-dot"></i> ${ui.escapeHtml(s.pickupLocation)}</div>
          <div class="qr-card__expires" data-countdown>Expires in <span data-tick>--:--</span></div>
          <div class="qr-card__hint">Show this to your driver. ${active ? '' : '<br>(Currently outside pickup window — QR will fail validation.)'}</div>
          <div class="qr-card__actions">
            <button type="button" class="btn btn-secondary" data-refresh><i class="fa-solid fa-rotate"></i> Refresh</button>
            <button type="button" class="btn btn-ghost" data-back>Back</button>
          </div>
        </div>
      </div>
    `;

    drawQrInto(content.querySelector('#qr-target'), payload);
    startQrTimer(content, payload);

    content.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => renderList(content, currentUser)));
    content.querySelector('[data-refresh]').addEventListener('click', async () => {
      stopQrTimer();
      payload = await issueQr(s, currentUser);
      drawQrInto(content.querySelector('#qr-target'), payload);
      startQrTimer(content, payload);
    });
  }

  async function issueQr(schedule, currentUser) {
    const issuedAt = Date.now();
    const expiresAt = issuedAt + QR_VALIDITY_MIN * 60 * 1000;
    const today = new Date();
    const classDate = today.toISOString().slice(0, 10);
    const payload = {
      studentId: currentUser.studentId,
      scheduleId: schedule.id,
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
      const tag = qr.createImgTag(6, 0);
      targetEl.innerHTML = tag;
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
      if (remain < 60000) {
        wrapEl.classList.add('is-expiring');
      }
    }
    tick();
    qrTimer = setInterval(tick, 1000);
  }

  function stopQrTimer() {
    if (qrTimer) { clearInterval(qrTimer); qrTimer = null; }
  }

  function isPickupWindowActive(s, now) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayDay = days[now.getDay()];
    if (s.day !== todayDay) return false;
    const [h, m] = s.startTime.split(':').map(Number);
    const startMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime();
    const openMs = startMs - PICKUP_WINDOW_MIN * 60 * 1000;
    return now.getTime() >= openMs && now.getTime() < startMs;
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
