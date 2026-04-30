/* =====================================================================
   admin-rentals.js — Admin Rentals & Payments section
   ===================================================================== */

(function () {
  'use strict';

  let state = { status: 'all', month: '2026-04' };

  function render(content) {
    const all = store.readAll('payments');
    let rows = all.filter(p => p.period === state.month);
    if (state.status !== 'all') rows = rows.filter(p => p.status === state.status);

    const totalBilled = rows.reduce((s, p) => s + p.amount, 0);
    const paid = rows.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const outstanding = totalBilled - paid;

    content.innerHTML = `
      <div class="section-header">
        <div>
          <div class="section-title">Rentals &amp; Payments</div>
          <div class="section-subtitle">${rows.length} record${rows.length === 1 ? '' : 's'} for ${ui.formatPeriod(state.month)}</div>
        </div>
        <button type="button" class="btn btn-primary" data-record-payment>
          <i class="fa-solid fa-plus"></i> Record Payment
        </button>
      </div>

      <div class="filter-bar">
        <div class="filter-bar__pills">
          ${['all', 'paid', 'due', 'late'].map(s => `
            <button class="filter-bar__pill ${state.status === s ? 'is-active' : ''}" data-status="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</button>
          `).join('')}
        </div>
        <select class="select" data-month>
          <option value="2026-04" ${state.month === '2026-04' ? 'selected' : ''}>April 2026</option>
          <option value="2026-03" ${state.month === '2026-03' ? 'selected' : ''}>March 2026</option>
          <option value="2026-02" ${state.month === '2026-02' ? 'selected' : ''}>February 2026</option>
        </select>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Room</th>
              <th>Period</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Paid On</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length === 0
              ? '<tr><td colspan="7" style="text-align:center; padding: 32px; color: var(--ink-500);">No payments match these filters</td></tr>'
              : rows.map(p => `
                <tr>
                  <td>${ui.escapeHtml(p.tenantName || p.userId)}</td>
                  <td><code>${ui.escapeHtml(p.roomId)}</code></td>
                  <td>${ui.formatPeriod(p.period)}</td>
                  <td><strong>${ui.formatMoney(p.amount)}</strong></td>
                  <td>${statusBadge(p.status)}</td>
                  <td><span class="text-mute">${p.paidOn ? ui.formatDate(p.paidOn) : '—'}</span></td>
                  <td style="text-align:right;">
                    ${rowAction(p)}
                  </td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>

      <div class="summary-footer">
        <span><strong>Total billed:</strong> ${ui.formatMoney(totalBilled)}</span>
        <span><strong>Paid:</strong> ${ui.formatMoney(paid)}</span>
        <span><strong>Outstanding:</strong> ${ui.formatMoney(outstanding)}</span>
      </div>
    `;

    content.querySelectorAll('[data-status]').forEach(b => {
      b.addEventListener('click', () => { state.status = b.dataset.status; render(content); });
    });
    content.querySelector('[data-month]').addEventListener('change', (e) => { state.month = e.target.value; render(content); });

    content.querySelector('[data-record-payment]').addEventListener('click', () => openRecordModal(content));
    content.querySelectorAll('[data-receipt]').forEach(b => b.addEventListener('click', () => ui.toast('Receipt downloaded.', 'success')));
    content.querySelectorAll('[data-remind]').forEach(b => b.addEventListener('click', () => ui.toast('Reminder sent to tenant.', 'success')));
    content.querySelectorAll('[data-notify]').forEach(b => b.addEventListener('click', () => ui.toast('Late notice sent.', 'warning')));
  }

  function statusBadge(s) {
    if (s === 'paid') return '<span class="badge badge-success">Paid</span>';
    if (s === 'due') return '<span class="badge badge-warning">Due</span>';
    if (s === 'late') return '<span class="badge badge-danger">Late</span>';
    return '<span class="badge badge-neutral">' + s + '</span>';
  }

  function rowAction(p) {
    if (p.status === 'paid') return '<button class="btn btn-ghost btn-sm" data-receipt><i class="fa-solid fa-download"></i> Receipt</button>';
    if (p.status === 'due') return '<button class="btn btn-secondary btn-sm" data-remind>Remind</button>';
    if (p.status === 'late') return '<button class="btn btn-danger btn-sm" data-notify>Notify</button>';
    return '';
  }

  function openRecordModal(content) {
    const tenants = [...auth.listUsers().filter(u => u.role === 'tenant'), ...store.readAll('extra_tenants')];
    const body = document.createElement('div');
    body.innerHTML = `
      <form class="payment-form">
        <div class="field">
          <label class="field-label" for="pf-tenant">Tenant</label>
          <select class="select" id="pf-tenant" name="tenantId" required>
            ${tenants.map(t => `<option value="${ui.escapeHtml(t.id)}" data-name="${ui.escapeHtml(t.name)}" data-room="${ui.escapeHtml(t.roomId || '')}">${ui.escapeHtml(t.name)} — ${ui.escapeHtml(t.roomId || '')}</option>`).join('')}
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="field">
            <label class="field-label" for="pf-period">Period</label>
            <input class="input" id="pf-period" name="period" type="month" required value="${state.month}">
          </div>
          <div class="field">
            <label class="field-label" for="pf-amount">Amount (RM)</label>
            <input class="input" id="pf-amount" name="amount" type="number" step="0.01" min="0" required value="450">
          </div>
          <div class="field">
            <label class="field-label" for="pf-method">Method</label>
            <select class="select" id="pf-method" name="method">
              <option value="FPX">FPX</option>
              <option value="Card">Card</option>
              <option value="Bank">Bank Transfer</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label" for="pf-paid-on">Paid On</label>
            <input class="input" id="pf-paid-on" name="paidOn" type="date" value="${new Date().toISOString().slice(0, 10)}">
          </div>
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
    save.textContent = 'Record payment';
    save.addEventListener('click', () => {
      const form = body.querySelector('.payment-form');
      const data = Object.fromEntries(new FormData(form).entries());
      const opt = form.querySelector('select[name="tenantId"] option:checked');
      const tenantName = opt.dataset.name;
      const roomId = opt.dataset.room;
      data.amount = parseFloat(data.amount);
      data.userId = data.tenantId;
      data.tenantName = tenantName;
      data.roomId = roomId;
      data.status = 'paid';
      delete data.tenantId;
      store.insert('payments', data);
      ui.toast('Payment recorded.', 'success');
      ui.closeModal();
      render(content);
    });
    footer.appendChild(cancel); footer.appendChild(save);
    ui.openModal({ title: 'Record payment', body, footer });
  }

  window.adminRentalsInit = function ({ content }) {
    render(content);
  };
})();
