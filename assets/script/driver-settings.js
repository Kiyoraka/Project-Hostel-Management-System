/* =====================================================================
   driver-settings.js — Driver Me/Settings tab
   ===================================================================== */

(function () {
  'use strict';

  window.driverSettingsInit = function ({ content, currentUser }) {
    render(content, currentUser);
  };

  function render(content, currentUser) {
    const initials = (currentUser.name || '').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
    const sound = getPref(currentUser.id, 'sound', true);
    const vibe = getPref(currentUser.id, 'vibe', true);

    content.innerHTML = `
      <div class="dr-profile">
        <div class="dr-profile__avatar">${initials}</div>
        <div>
          <div class="dr-profile__name">${ui.escapeHtml(currentUser.name)}</div>
          <div class="dr-profile__sub">Driver · ${ui.escapeHtml(currentUser.vehiclePlate || '')}</div>
          <div class="dr-profile__sub">${ui.escapeHtml(currentUser.email)}</div>
        </div>
      </div>

      <div class="section-divider">Account</div>
      <div class="dr-setting-group">
        <div class="dr-setting" data-action="password">
          <span class="dr-setting__label">Change password</span>
          <i class="fa-solid fa-chevron-right dr-setting__chevron"></i>
        </div>
        <div class="dr-setting" data-action="phone">
          <div>
            <div class="dr-setting__label">Phone number</div>
            <div class="dr-setting__value">${ui.escapeHtml(currentUser.phone || '—')}</div>
          </div>
          <i class="fa-solid fa-chevron-right dr-setting__chevron"></i>
        </div>
      </div>

      <div class="section-divider">Vehicle</div>
      <div class="dr-setting-group">
        <div class="dr-setting" data-action="plate">
          <div>
            <div class="dr-setting__label">Vehicle plate</div>
            <div class="dr-setting__value">${ui.escapeHtml(currentUser.vehiclePlate || '—')}</div>
          </div>
          <i class="fa-solid fa-chevron-right dr-setting__chevron"></i>
        </div>
        <div class="dr-setting">
          <div>
            <div class="dr-setting__label">Capacity</div>
            <div class="dr-setting__value">${currentUser.vehicleCapacity || 12} pax</div>
          </div>
          <i class="fa-solid fa-chevron-right dr-setting__chevron"></i>
        </div>
      </div>

      <div class="section-divider">Payment</div>
      <div class="dr-setting-group">
        <div class="dr-setting" data-action="payout">
          <div>
            <div class="dr-setting__label">Bank for payouts</div>
            <div class="dr-setting__value">Maybank ····5678</div>
          </div>
          <i class="fa-solid fa-chevron-right dr-setting__chevron"></i>
        </div>
        <div class="dr-setting" data-action="schedule">
          <div>
            <div class="dr-setting__label">Auto-payment schedule</div>
            <div class="dr-setting__value">Weekly · Friday</div>
          </div>
          <i class="fa-solid fa-chevron-right dr-setting__chevron"></i>
        </div>
      </div>

      <div class="section-divider">Preferences</div>
      <div class="dr-setting-group">
        <div class="dr-setting">
          <span class="dr-setting__label">Sound alerts</span>
          <span class="toggle ${sound ? 'is-on' : ''}" data-pref="sound" role="switch" aria-checked="${sound}"></span>
        </div>
        <div class="dr-setting">
          <span class="dr-setting__label">Vibration</span>
          <span class="toggle ${vibe ? 'is-on' : ''}" data-pref="vibe" role="switch" aria-checked="${vibe}"></span>
        </div>
      </div>

      <button class="btn btn-secondary btn-block mt-6" data-logout>
        <i class="fa-solid fa-right-from-bracket"></i> Logout
      </button>
    `;

    content.querySelector('[data-logout]').addEventListener('click', () => auth.logout());
    content.querySelectorAll('[data-pref]').forEach(t => {
      t.addEventListener('click', () => {
        const key = t.dataset.pref;
        const cur = getPref(currentUser.id, key, true);
        setPref(currentUser.id, key, !cur);
        t.classList.toggle('is-on', !cur);
        t.setAttribute('aria-checked', String(!cur));
      });
    });
    content.querySelectorAll('[data-action]').forEach(row => {
      row.addEventListener('click', () => handleAction(row.dataset.action, currentUser, content));
    });
  }

  function handleAction(action, currentUser, content) {
    if (action === 'password') {
      const body = document.createElement('div');
      body.innerHTML = `
        <form class="form">
          <div class="field"><label class="field-label">Current password</label><input class="input" id="pw-cur" type="password"></div>
          <div class="field"><label class="field-label">New password</label><input class="input" id="pw-new" type="password" minlength="6"></div>
          <div class="field"><label class="field-label">Confirm new password</label><input class="input" id="pw-conf" type="password" minlength="6"></div>
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
      save.textContent = 'Update';
      save.addEventListener('click', () => {
        const cur = body.querySelector('#pw-cur').value;
        const next = body.querySelector('#pw-new').value;
        const conf = body.querySelector('#pw-conf').value;
        if (next !== conf) { ui.toast('New passwords do not match.', 'danger'); return; }
        const r = auth.changePassword(currentUser.id, cur, next);
        if (r.ok) { ui.toast('Password updated.', 'success'); ui.closeModal(); }
        else ui.toast(r.error, 'danger');
      });
      footer.appendChild(cancel); footer.appendChild(save);
      ui.openModal({ title: 'Change password', body, footer });
      return;
    }
    ui.toast('Edit not implemented in demo.', 'warning');
  }

  function getPref(userId, key, def) {
    const s = store.find('settings', x => x.key === 'driver-' + userId + '-' + key);
    return s ? s.value : def;
  }
  function setPref(userId, key, value) {
    const k = 'driver-' + userId + '-' + key;
    const existing = store.find('settings', x => x.key === k);
    if (existing) store.update('settings', existing.id, { key: k, value });
    else store.insert('settings', { key: k, value });
  }
})();
