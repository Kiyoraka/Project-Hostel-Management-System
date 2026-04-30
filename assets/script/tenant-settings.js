/* =====================================================================
   tenant-settings.js — Tenant settings (profile / password / payment methods)
   ===================================================================== */

(function () {
  'use strict';

  let state = { tab: 'profile' };

  window.tenantSettingsInit = function ({ content, currentUser }) {
    render(content, currentUser);
  };

  function render(content, currentUser) {
    content.innerHTML = `
      <div class="section-header">
        <div>
          <div class="section-title">Settings</div>
          <div class="section-subtitle">Manage your profile, password, and saved payment methods</div>
        </div>
      </div>

      <div class="tab-bar">
        ${[['profile', 'Profile'], ['password', 'Password'], ['payment', 'Payment Methods']].map(([k, l]) => `
          <button class="tab-bar__item ${state.tab === k ? 'is-active' : ''}" data-tab="${k}">${l}</button>
        `).join('')}
      </div>

      <div class="card card-pad" id="settings-pane"></div>
    `;

    content.querySelectorAll('[data-tab]').forEach(b => {
      b.addEventListener('click', () => { state.tab = b.dataset.tab; render(content, currentUser); });
    });

    paint(content.querySelector('#settings-pane'), currentUser);
  }

  function paint(pane, currentUser) {
    if (state.tab === 'profile') {
      pane.innerHTML = `
        <form class="form" style="max-width: 540px;">
          <div class="grid grid-cols-2 gap-3">
            <div class="field"><label class="field-label">Full name</label><input class="input" name="name" value="${ui.escapeHtml(currentUser.name)}"></div>
            <div class="field"><label class="field-label">Email</label><input class="input" name="email" type="email" value="${ui.escapeHtml(currentUser.email)}" readonly></div>
            <div class="field"><label class="field-label">Phone</label><input class="input" name="phone" value="${ui.escapeHtml(currentUser.phone || '')}"></div>
            <div class="field"><label class="field-label">Student ID</label><input class="input" value="${ui.escapeHtml(currentUser.studentId || '')}" readonly></div>
            <div class="field"><label class="field-label">Room</label><input class="input" value="${ui.escapeHtml(currentUser.roomId)}" readonly></div>
          </div>
          <button type="button" class="btn btn-primary mt-3" data-save>Save profile</button>
        </form>
      `;
      pane.querySelector('[data-save]').addEventListener('click', () => ui.toast('Profile saved.', 'success'));
    }
    if (state.tab === 'password') {
      pane.innerHTML = `
        <form class="form" style="max-width: 460px;">
          <div class="field"><label class="field-label">Current password</label><input class="input" id="pw-current" type="password"></div>
          <div class="field"><label class="field-label">New password</label><input class="input" id="pw-new" type="password" minlength="6"></div>
          <div class="field"><label class="field-label">Confirm new password</label><input class="input" id="pw-confirm" type="password" minlength="6"></div>
          <button type="button" class="btn btn-primary" data-update>Update password</button>
        </form>
      `;
      pane.querySelector('[data-update]').addEventListener('click', () => {
        const cur = pane.querySelector('#pw-current').value;
        const next = pane.querySelector('#pw-new').value;
        const conf = pane.querySelector('#pw-confirm').value;
        if (next !== conf) { ui.toast('New passwords do not match.', 'danger'); return; }
        const result = auth.changePassword(currentUser.id, cur, next);
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
    if (state.tab === 'payment') {
      const cards = store.filter('cards', c => c.userId === currentUser.id);
      pane.innerHTML = `
        <h4 class="mb-3">Saved cards</h4>
        ${cards.length === 0 ? '<p class="text-mute mb-4">No saved cards.</p>' :
          '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">' +
          cards.map(c => `
            <div class="card card-pad-sm flex items-center justify-between">
              <div><i class="fa-solid fa-credit-card"></i> <strong>${ui.escapeHtml(c.brand)}</strong> ···· ${ui.escapeHtml(c.last4)}</div>
              <button class="btn btn-ghost btn-sm" data-remove="${c.id}"><i class="fa-solid fa-trash"></i></button>
            </div>
          `).join('') + '</div>'}
        <button type="button" class="btn btn-secondary" data-add-card><i class="fa-solid fa-plus"></i> Add card</button>
        <div class="mt-6">
          <label><input type="checkbox" data-autopay ${getAutoPay(currentUser.id) ? 'checked' : ''}> Enable auto-pay on the 1st of each month</label>
        </div>
      `;
      pane.querySelectorAll('[data-remove]').forEach(b => {
        b.addEventListener('click', () => { store.remove('cards', b.dataset.remove); render(pane.closest('#app-content'), currentUser); });
      });
      pane.querySelector('[data-add-card']?.addEventListener('click', () => addCardModal(currentUser, pane));
      pane.querySelector('[data-autopay]')?.addEventListener('change', (e) => {
        setAutoPay(currentUser.id, e.target.checked);
        ui.toast('Auto-pay ' + (e.target.checked ? 'enabled' : 'disabled') + '.', 'success');
      });
      // Re-bind add-card with proper selector (typo fix)
      const addBtn = pane.querySelector('[data-add-card]');
      if (addBtn) {
        addBtn.addEventListener('click', () => addCardModal(currentUser, pane));
      }
    }
  }

  function addCardModal(currentUser, pane) {
    const body = document.createElement('div');
    body.innerHTML = `
      <form class="card-form">
        <div class="field"><label class="field-label">Card number</label><input class="input" name="number" placeholder="4242 4242 4242 4242" required></div>
        <div class="grid grid-cols-2 gap-3">
          <div class="field"><label class="field-label">Expiry</label><input class="input" name="expiry" placeholder="MM/YY" required></div>
          <div class="field"><label class="field-label">CVV</label><input class="input" name="cvv" type="password" placeholder="123" required></div>
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
    save.textContent = 'Add card';
    save.addEventListener('click', () => {
      const data = Object.fromEntries(new FormData(body.querySelector('form')).entries());
      const cleaned = (data.number || '').replace(/\s/g, '');
      const last4 = cleaned.slice(-4);
      const brand = cleaned.startsWith('4') ? 'Visa' : cleaned.startsWith('5') ? 'Mastercard' : 'Card';
      store.insert('cards', { userId: currentUser.id, brand, last4 });
      ui.toast('Card added.', 'success');
      ui.closeModal();
      const content = pane.closest('#app-content');
      render(content, currentUser);
    });
    footer.appendChild(cancel); footer.appendChild(save);
    ui.openModal({ title: 'Add card', body, footer });
  }

  function getAutoPay(userId) {
    const s = store.find('settings', x => x.key === 'autopay-' + userId);
    return s?.enabled === true;
  }
  function setAutoPay(userId, enabled) {
    const existing = store.find('settings', x => x.key === 'autopay-' + userId);
    const data = { key: 'autopay-' + userId, enabled };
    if (existing) store.update('settings', existing.id, data);
    else store.insert('settings', data);
  }
})();
