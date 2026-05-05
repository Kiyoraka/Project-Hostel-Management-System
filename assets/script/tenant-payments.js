/* =====================================================================
   tenant-payments.js — Tenant rent payments
   ===================================================================== */

(function () {
  'use strict';

  function isMobile() { return window.innerWidth <= 900; }

  window.tenantPaymentsInit = function ({ content, currentUser }) {
    if (isMobile()) {
      renderMobile(content, currentUser);
    } else {
      render(content, currentUser);
    }
  };

  function renderMobile(content, currentUser) {
    const myPayments = [...store.filter('payments', p => p.userId === currentUser.id)]
      .sort((a, b) => b.period.localeCompare(a.period));
    const currentMonth = monthKey(0);
    const nextMonth = monthKey(1);
    const room = store.findById('rooms', currentUser.roomId);
    const monthly = room?.rate || 700;

    const current = myPayments.find(p => p.period === currentMonth) || { period: currentMonth, amount: monthly, status: 'due', paidOn: null };
    const next = myPayments.find(p => p.period === nextMonth) || { period: nextMonth, amount: monthly, status: 'due', paidOn: null };

    const totalPaid = myPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const onTimeCount = myPayments.filter(p => p.status === 'paid').length;

    content.innerHTML = `
      <div class="m-greeting" style="padding: var(--space-2) var(--space-2) var(--space-3);">
        <div class="m-greeting__hello">Rental Payments</div>
        <div class="m-greeting__date">Room ${ui.escapeHtml(currentUser.roomId)} &middot; ${ui.formatMoney(monthly)}/mo</div>
      </div>

      <div class="m-hero-card">
        <div class="m-hero-card__label">${ui.formatPeriod(currentMonth)} Rent</div>
        <div class="m-hero-card__value">${ui.formatMoney(current.amount)}</div>
        <div class="m-hero-card__summary" style="margin-bottom: var(--space-3);">
          ${current.status === 'paid'
            ? '<span><i class="fa-solid fa-circle-check" style="color: var(--success);"></i>&nbsp;Paid on ' + ui.formatDate(current.paidOn) + '</span>'
            : '<span><i class="fa-solid fa-clock" style="color: var(--warning);"></i>&nbsp;Outstanding</span>'}
        </div>
        ${current.status === 'paid'
          ? '<button class="btn btn-ghost" type="button" data-receipt="' + ui.escapeHtml(current.id || '') + '" style="width: 100%; padding: 10px;"><i class="fa-solid fa-download"></i>&nbsp;Download Receipt</button>'
          : '<button class="btn btn-primary" type="button" data-pay="' + ui.escapeHtml(currentMonth) + '" style="width: 100%; padding: 12px;"><i class="fa-solid fa-credit-card"></i>&nbsp;Pay Now</button>'}
      </div>

      <div class="m-stats-row">
        <div class="m-stat-card">
          <div class="m-stat-card__label">Next Month</div>
          <div class="m-stat-card__value" style="font-size: 16px;">${ui.formatMoney(next.amount)}</div>
          <div class="m-stat-card__delta">Due ${ui.formatDate(nextMonthStart())}</div>
        </div>
        <div class="m-stat-card">
          <div class="m-stat-card__label">Total Paid</div>
          <div class="m-stat-card__value" style="font-size: 16px;">${ui.formatMoney(totalPaid)}</div>
          <div class="m-stat-card__delta">${onTimeCount} payment${onTimeCount === 1 ? '' : 's'}</div>
        </div>
      </div>

      <button class="btn btn-ghost" type="button" data-pay="${ui.escapeHtml(nextMonth)}" style="width: 100%; padding: 10px; margin-bottom: var(--space-4);">
        <i class="fa-solid fa-calendar-plus" aria-hidden="true"></i>&nbsp;Pay Next Month Early
      </button>

      <div class="m-section-label">Payment History <span class="m-carousel-hint">${myPayments.length}</span></div>
      <div class="m-list-card">
        ${myPayments.length === 0 ? '<div class="m-list-card__row" style="justify-content: center; color: var(--ink-500); padding: var(--space-6);">No payment history yet</div>'
          : myPayments.map(p => `
            <div class="m-list-card__row">
              <i class="fa-solid fa-money-bill-wave activity-feed__icon activity-feed__icon--${p.status === 'paid' ? 'payment' : p.status === 'late' ? 'maintenance' : 'pickup'}" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.formatPeriod(p.period)} &middot; ${ui.formatMoney(p.amount)}</span>
                <span class="m-list-card__meta">${ui.escapeHtml(p.method || 'No method')} &middot; ${p.paidOn ? ui.formatDate(p.paidOn) : 'Not paid'}</span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
                <span class="badge badge--${p.status === 'paid' ? 'success' : p.status === 'late' ? 'danger' : 'warning'}" style="font-size: 10px;">${ui.escapeHtml((p.status || '').toUpperCase())}</span>
                ${p.status === 'paid' ? '<button class="btn btn-ghost btn-sm" type="button" data-receipt="' + ui.escapeHtml(p.id) + '" aria-label="Receipt"><i class="fa-solid fa-download"></i></button>' : ''}
              </div>
            </div>
          `).join('')}
      </div>
    `;

    wirePaymentActions(content, currentUser);
  }

  function wirePaymentActions(content, currentUser) {
    content.querySelectorAll('[data-pay]').forEach(b => {
      b.addEventListener('click', () => openPayModal(content, currentUser, b.dataset.pay));
    });
    content.querySelectorAll('[data-receipt]').forEach(b => {
      b.addEventListener('click', () => {
        ui.toast('Receipt downloaded (demo).', 'success');
      });
    });
  }

  function render(content, currentUser) {
    const myPayments = [...store.filter('payments', p => p.userId === currentUser.id)]
      .sort((a, b) => b.period.localeCompare(a.period));

    const currentMonth = monthKey(0);
    const nextMonth = monthKey(1);
    const room = store.findById('rooms', currentUser.roomId);
    const monthly = room?.rate || 700;

    const current = myPayments.find(p => p.period === currentMonth) || {
      period: currentMonth,
      amount: monthly,
      status: 'due',
      paidOn: null
    };
    const next = myPayments.find(p => p.period === nextMonth) || {
      period: nextMonth,
      amount: monthly,
      status: 'due',
      paidOn: null
    };

    content.innerHTML = `
      <div class="section-header">
        <div>
          <div class="section-title">Rental Payments</div>
          <div class="section-subtitle">Room ${ui.escapeHtml(currentUser.roomId)} · ${ui.formatMoney(monthly)}/mo</div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="card card-pad">
          <h3 class="mb-2">Current month — ${ui.formatPeriod(currentMonth)}</h3>
          <div class="kpi-tile__value">${ui.formatMoney(current.amount)}</div>
          <div class="mt-2" style="font-size:14px;">
            ${current.status === 'paid'
              ? '<span class="badge badge-success">Paid on ' + ui.formatDate(current.paidOn) + '</span>'
              : '<span class="badge badge-warning">Outstanding</span>'}
          </div>
          <div class="mt-3">
            ${current.status === 'paid'
              ? '<button class="btn btn-secondary btn-sm" data-receipt="' + current.id + '"><i class="fa-solid fa-download"></i> Receipt</button>'
              : '<button class="btn btn-primary btn-sm" data-pay="' + currentMonth + '"><i class="fa-solid fa-credit-card"></i> Pay now</button>'}
          </div>
        </div>

        <div class="card card-pad">
          <h3 class="mb-2">Next month — ${ui.formatPeriod(nextMonth)}</h3>
          <div class="kpi-tile__value">${ui.formatMoney(next.amount)}</div>
          <div class="mt-2" style="font-size: 14px; color: var(--ink-500);">Due: ${ui.formatDate(nextMonthStart())}</div>
          <div class="mt-3">
            <button class="btn btn-secondary btn-sm" data-pay="${nextMonth}"><i class="fa-solid fa-credit-card"></i> Pay early</button>
          </div>
        </div>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Amount</th>
              <th>Paid On</th>
              <th>Method</th>
              <th>Status</th>
              <th style="text-align:right;">Receipt</th>
            </tr>
          </thead>
          <tbody>
            ${myPayments.length === 0
              ? '<tr><td colspan="6" style="text-align:center; padding: 32px; color: var(--ink-500);">No payment history yet</td></tr>'
              : myPayments.map(p => `
                <tr>
                  <td>${ui.formatPeriod(p.period)}</td>
                  <td><strong>${ui.formatMoney(p.amount)}</strong></td>
                  <td>${p.paidOn ? ui.formatDate(p.paidOn) : '—'}</td>
                  <td>${ui.escapeHtml(p.method || '—')}</td>
                  <td>${p.status === 'paid' ? '<span class="badge badge-success">Paid</span>' : p.status === 'late' ? '<span class="badge badge-danger">Late</span>' : '<span class="badge badge-warning">Due</span>'}</td>
                  <td style="text-align:right;">
                    ${p.status === 'paid' ? '<button class="btn btn-ghost btn-sm" data-receipt="' + p.id + '"><i class="fa-solid fa-download"></i></button>' : '—'}
                  </td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    `;

    content.querySelectorAll('[data-pay]').forEach(b => {
      b.addEventListener('click', () => openPayModal(content, currentUser, b.dataset.pay, monthly));
    });
    content.querySelectorAll('[data-receipt]').forEach(b => {
      b.addEventListener('click', () => ui.toast('Receipt downloaded.', 'success'));
    });
  }

  function monthKey(offset) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + offset);
    return d.toISOString().slice(0, 7);
  }

  function nextMonthStart() {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    return d;
  }

  function openPayModal(content, currentUser, period, amount) {
    let method = 'FPX';
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="card-pad-sm" style="background: var(--brand-tint); border-radius: var(--radius-input); margin-bottom: 16px;">
        <div style="font-size: 13px; color: var(--brand-ink);">Pay rent for <strong>${ui.formatPeriod(period)}</strong></div>
        <div class="kpi-tile__value" style="font-size: 26px; margin-top: 4px;">${ui.formatMoney(amount)}</div>
      </div>
      <div class="field">
        <label class="field-label">Payment method</label>
        <div class="grid grid-cols-3 gap-3">
          <label class="card card-pad-sm" style="cursor:pointer; text-align:center;"><input type="radio" name="method" value="FPX" checked><div class="mt-2"><i class="fa-solid fa-building-columns"></i><br>FPX</div></label>
          <label class="card card-pad-sm" style="cursor:pointer; text-align:center;"><input type="radio" name="method" value="Card"><div class="mt-2"><i class="fa-solid fa-credit-card"></i><br>Card</div></label>
          <label class="card card-pad-sm" style="cursor:pointer; text-align:center;"><input type="radio" name="method" value="Bank"><div class="mt-2"><i class="fa-solid fa-money-check"></i><br>Bank</div></label>
        </div>
      </div>
    `;
    const footer = document.createElement('div');
    footer.style.display = 'flex'; footer.style.gap = '12px';
    const cancel = document.createElement('button');
    cancel.className = 'btn btn-secondary';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', () => ui.closeModal());
    const save = document.createElement('button');
    save.className = 'btn btn-primary';
    save.textContent = 'Pay ' + ui.formatMoney(amount);
    save.addEventListener('click', () => {
      const m = body.querySelector('input[name="method"]:checked').value;
      const existing = store.find('payments', p => p.userId === currentUser.id && p.period === period);
      const data = {
        userId: currentUser.id,
        tenantName: currentUser.name,
        roomId: currentUser.roomId,
        period,
        amount,
        status: 'paid',
        paidOn: new Date().toISOString().slice(0, 10),
        method: m
      };
      if (existing) store.update('payments', existing.id, data);
      else store.insert('payments', data);
      ui.toast('Payment successful.', 'success');
      ui.closeModal();
      render(content, currentUser);
    });
    footer.appendChild(cancel); footer.appendChild(save);
    ui.openModal({ title: 'Pay rent', body, footer });
  }
})();
