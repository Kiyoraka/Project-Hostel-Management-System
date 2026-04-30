/* =====================================================================
   admin-settings.js — Admin Settings section
   ===================================================================== */

(function () {
  'use strict';

  let state = { tab: 'profile' };

  function render(content, currentUser) {
    content.innerHTML = `
      <div class="section-header">
        <div>
          <div class="section-title">Settings</div>
          <div class="section-subtitle">Manage profile, password, payment, and hostel info</div>
        </div>
      </div>

      <div class="tab-bar">
        ${[
          ['profile', 'Profile'],
          ['password', 'Password'],
          ['payment', 'Payment Settings'],
          ['hostel', 'Hostel Info']
        ].map(([k, label]) => `
          <button class="tab-bar__item ${state.tab === k ? 'is-active' : ''}" data-tab="${k}">${label}</button>
        `).join('')}
      </div>

      <div class="card card-pad" id="settings-pane"></div>
    `;

    content.querySelectorAll('[data-tab]').forEach(b => {
      b.addEventListener('click', () => { state.tab = b.dataset.tab; render(content, currentUser); });
    });

    paintPane(content, currentUser);
  }

  function paintPane(content, currentUser) {
    const pane = content.querySelector('#settings-pane');
    if (state.tab === 'profile') pane.innerHTML = profileTab(currentUser);
    if (state.tab === 'password') pane.innerHTML = passwordTab();
    if (state.tab === 'payment') pane.innerHTML = paymentTab();
    if (state.tab === 'hostel') pane.innerHTML = hostelTab();

    if (state.tab === 'profile') bindProfile(pane, currentUser);
    if (state.tab === 'password') bindPassword(pane, currentUser);
    if (state.tab === 'payment') bindPayment(pane);
    if (state.tab === 'hostel') bindHostel(pane);
  }

  function profileTab(u) {
    return `
      <form class="settings-form" style="max-width: 540px;">
        <div class="grid grid-cols-2 gap-3">
          <div class="field">
            <label class="field-label" for="pr-name">Full name</label>
            <input class="input" id="pr-name" name="name" value="${ui.escapeHtml(u.name)}">
          </div>
          <div class="field">
            <label class="field-label" for="pr-email">Email</label>
            <input class="input" id="pr-email" name="email" type="email" value="${ui.escapeHtml(u.email)}" readonly>
          </div>
          <div class="field">
            <label class="field-label" for="pr-phone">Phone</label>
            <input class="input" id="pr-phone" name="phone" value="${ui.escapeHtml(u.phone || '')}">
          </div>
        </div>
        <button type="button" class="btn btn-primary mt-3" data-save-profile>Save profile</button>
      </form>
    `;
  }

  function passwordTab() {
    return `
      <form class="settings-form" style="max-width: 460px;">
        <div class="field">
          <label class="field-label" for="pw-current">Current password</label>
          <input class="input" id="pw-current" name="current" type="password" autocomplete="current-password">
        </div>
        <div class="field">
          <label class="field-label" for="pw-new">New password</label>
          <input class="input" id="pw-new" name="next" type="password" minlength="6" autocomplete="new-password">
        </div>
        <div class="field">
          <label class="field-label" for="pw-confirm">Confirm new password</label>
          <input class="input" id="pw-confirm" name="confirm" type="password" minlength="6" autocomplete="new-password">
        </div>
        <button type="button" class="btn btn-primary" data-save-password>Update password</button>
      </form>
    `;
  }

  function paymentTab() {
    const cfg = store.find('settings', s => s.key === 'payment') || {
      key: 'payment',
      bankName: 'Maybank',
      accountNumber: '5141 2345 6789',
      accountHolder: 'Hostel Management Sdn Bhd',
      dueDay: '1',
      lateFee: '50'
    };
    return `
      <form class="settings-form" style="max-width: 540px;">
        <h4 class="mb-3">Bank account for receiving rent</h4>
        <div class="grid grid-cols-2 gap-3">
          <div class="field">
            <label class="field-label" for="py-bank">Bank</label>
            <select class="select" id="py-bank" name="bankName">
              ${['Maybank', 'CIMB', 'Public Bank', 'RHB', 'AmBank', 'HSBC'].map(b => `<option ${cfg.bankName === b ? 'selected' : ''}>${b}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label class="field-label" for="py-num">Account number</label>
            <input class="input" id="py-num" name="accountNumber" value="${ui.escapeHtml(cfg.accountNumber)}">
          </div>
          <div class="field" style="grid-column: span 2;">
            <label class="field-label" for="py-holder">Account holder</label>
            <input class="input" id="py-holder" name="accountHolder" value="${ui.escapeHtml(cfg.accountHolder)}">
          </div>
          <div class="field">
            <label class="field-label" for="py-day">Default rent due day</label>
            <select class="select" id="py-day" name="dueDay">
              ${['1','5','10','15','20','25'].map(d => `<option ${cfg.dueDay === d ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label class="field-label" for="py-fee">Late fee (RM)</label>
            <input class="input" id="py-fee" name="lateFee" type="number" min="0" value="${cfg.lateFee}">
          </div>
        </div>
        <button type="button" class="btn btn-primary mt-3" data-save-payment>Save settings</button>
      </form>
    `;
  }

  function hostelTab() {
    const cfg = store.find('settings', s => s.key === 'hostel') || {
      key: 'hostel',
      name: 'Hostel Management System',
      address: '12 Jalan Universiti, 47500 Subang Jaya, Selangor',
      contactEmail: 'hello@hostel.example',
      contactPhone: '+60-3-1234-5678'
    };
    return `
      <form class="settings-form" style="max-width: 540px;">
        <div class="field">
          <label class="field-label" for="ho-name">Hostel name</label>
          <input class="input" id="ho-name" name="name" value="${ui.escapeHtml(cfg.name)}">
        </div>
        <div class="field">
          <label class="field-label" for="ho-addr">Address</label>
          <textarea class="textarea" id="ho-addr" name="address" rows="2">${ui.escapeHtml(cfg.address)}</textarea>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="field">
            <label class="field-label" for="ho-email">Contact email</label>
            <input class="input" id="ho-email" name="contactEmail" type="email" value="${ui.escapeHtml(cfg.contactEmail)}">
          </div>
          <div class="field">
            <label class="field-label" for="ho-phone">Contact phone</label>
            <input class="input" id="ho-phone" name="contactPhone" value="${ui.escapeHtml(cfg.contactPhone)}">
          </div>
        </div>
        <button type="button" class="btn btn-primary mt-3" data-save-hostel>Save hostel info</button>
      </form>
    `;
  }

  function bindProfile(pane, u) {
    pane.querySelector('[data-save-profile]').addEventListener('click', () => {
      ui.toast('Profile saved.', 'success');
    });
  }
  function bindPassword(pane, u) {
    pane.querySelector('[data-save-password]').addEventListener('click', () => {
      const cur = pane.querySelector('#pw-current').value;
      const next = pane.querySelector('#pw-new').value;
      const conf = pane.querySelector('#pw-confirm').value;
      if (next !== conf) { ui.toast('New passwords do not match.', 'danger'); return; }
      const result = auth.changePassword(u.id, cur, next);
      if (result.ok) {
        ui.toast('Password updated.', 'success');
        pane.querySelector('#pw-current').value = '';
        pane.querySelector('#pw-new').value = '';
        pane.querySelector('#pw-confirm').value = '';
      } else {
        ui.toast(result.error, 'danger');
      }
    });
  }
  function bindPayment(pane) {
    pane.querySelector('[data-save-payment]').addEventListener('click', () => {
      const data = Object.fromEntries(new FormData(pane.querySelector('form')).entries());
      data.key = 'payment';
      const existing = store.find('settings', s => s.key === 'payment');
      if (existing) store.update('settings', existing.id, data);
      else store.insert('settings', data);
      ui.toast('Payment settings saved.', 'success');
    });
  }
  function bindHostel(pane) {
    pane.querySelector('[data-save-hostel]').addEventListener('click', () => {
      const data = Object.fromEntries(new FormData(pane.querySelector('form')).entries());
      data.key = 'hostel';
      const existing = store.find('settings', s => s.key === 'hostel');
      if (existing) store.update('settings', existing.id, data);
      else store.insert('settings', data);
      ui.toast('Hostel info saved.', 'success');
    });
  }

  window.adminSettingsInit = function ({ content, currentUser }) {
    render(content, currentUser);
  };
})();
