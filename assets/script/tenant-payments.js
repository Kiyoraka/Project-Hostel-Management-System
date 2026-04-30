/* =====================================================================
   tenant-payments.js — Tenant rent payments
   ===================================================================== */

(function () {
  'use strict';

  window.tenantPaymentsInit = function ({ content, currentUser }) {
    render(content, currentUser);
  };

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
