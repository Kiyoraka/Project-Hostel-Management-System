/* =====================================================================
   admin-billing.js — Billings & Payment tabbed wrapper (Phase 9)
   Tabs: Overview | Invoices | Overdue | Compounds | Statistics
   ===================================================================== */

(function () {
  'use strict';

  const TABS = [
    { id: 'overview',   label: 'Overview',    icon: 'fa-gauge' },
    { id: 'invoices',   label: 'Invoices',    icon: 'fa-file-invoice-dollar' },
    { id: 'overdue',    label: 'Overdue',     icon: 'fa-circle-exclamation' },
    { id: 'compounds',  label: 'Compounds',   icon: 'fa-receipt' },
    { id: 'statistics', label: 'Statistics',  icon: 'fa-chart-column' }
  ];

  function init({ content, currentUser }) {
    let activeTab = 'overview';

    function render() {
      content.innerHTML = `
        <div class="section-header">
          <div>
            <div class="section-title">Billings &amp; Payment</div>
            <div class="section-subtitle">Rent invoices, overdue accounts, compound fines, and revenue analytics</div>
          </div>
        </div>

        <div class="tabs" role="tablist">
          ${TABS.map(t => `
            <button type="button" class="tabs__btn ${t.id === activeTab ? 'is-active' : ''}" data-tab="${t.id}" role="tab" aria-selected="${t.id === activeTab}">
              <i class="fa-solid ${t.icon}" aria-hidden="true"></i>&nbsp;${t.label}
            </button>
          `).join('')}
        </div>

        <div id="billing-tab-panel" class="tabs__panel is-active" role="tabpanel"></div>
      `;
      content.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => { activeTab = btn.dataset.tab; render(); });
      });
      renderPanel();
    }

    function renderPanel() {
      const panel = content.querySelector('#billing-tab-panel');
      if (!panel) return;
      if (activeTab === 'overview')   return renderOverview(panel);
      if (activeTab === 'invoices')   return renderInvoices(panel);
      if (activeTab === 'overdue')    return renderOverdue(panel);
      if (activeTab === 'compounds')  return renderCompounds(panel);
      if (activeTab === 'statistics') return renderStatistics(panel);
    }

    function renderOverview(panel) {
      const payments = store.readAll('payments') || [];
      const totalBilled = payments.reduce((s, p) => s + (p.amount || 0), 0);
      const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
      const outstanding = totalBilled - totalPaid;
      const overdueCount = payments.filter(p => p.status === 'late' || p.status === 'overdue').length;
      panel.innerHTML = `
        <div class="kpi-strip" style="grid-template-columns: repeat(4, 1fr); margin-bottom: var(--space-4);">
          <div class="kpi-tile"><div class="kpi-tile__label">Total Billed</div><div class="kpi-tile__value">${ui.formatMoney(totalBilled)}</div></div>
          <div class="kpi-tile"><div class="kpi-tile__label">Paid</div><div class="kpi-tile__value">${ui.formatMoney(totalPaid)}</div></div>
          <div class="kpi-tile"><div class="kpi-tile__label">Outstanding</div><div class="kpi-tile__value">${ui.formatMoney(outstanding)}</div></div>
          <div class="kpi-tile"><div class="kpi-tile__label">Overdue Accounts</div><div class="kpi-tile__value">${overdueCount}</div></div>
        </div>
        <div class="card card-pad">
          <h3 class="mb-3">Recent Payments</h3>
          <ul class="recent-list">
            ${payments.filter(p => p.status === 'paid').slice(0, 5).map(p => `
              <li class="recent-list__item">
                <div class="recent-list__main">
                  <span class="recent-list__title">${ui.escapeHtml(p.tenantName)} &mdash; ${ui.formatMoney(p.amount)}</span>
                  <span class="recent-list__meta">${ui.formatPeriod(p.period)} &middot; ${ui.escapeHtml(p.method || '-')}</span>
                </div>
                <span class="recent-list__time">${ui.escapeHtml(p.paidOn || '-')}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    function renderInvoices(panel) {
      panel.innerHTML = '<div class="card card-pad" id="billing-invoices-mount"></div>';
      const mount = panel.querySelector('#billing-invoices-mount');
      if (typeof window.adminRentalsInit === 'function') {
        window.adminRentalsInit({ content: mount });
      } else {
        mount.innerHTML = '<div class="empty-state"><i class="fa-solid fa-file-invoice-dollar"></i><h3>Rentals module not loaded</h3></div>';
      }
    }

    function renderOverdue(panel) {
      const payments = (store.readAll('payments') || []).filter(p => p.status === 'late' || p.status === 'overdue' || p.status === 'due');
      panel.innerHTML = `
        <div class="card card-pad">
          <h3 class="mb-3">Overdue &amp; Due Accounts</h3>
          <p style="color: var(--ink-500); font-size: 13px;">Filtered view of unpaid invoices. Send reminder or escalate from the action column.</p>
          <table class="table">
            <thead><tr><th>Tenant</th><th>Room</th><th>Period</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${payments.map(p => `
                <tr>
                  <td>${ui.escapeHtml(p.tenantName)}</td>
                  <td>${ui.escapeHtml(p.roomId)}</td>
                  <td>${ui.formatPeriod(p.period)}</td>
                  <td>${ui.formatMoney(p.amount)}</td>
                  <td><span class="badge badge--${p.status === 'late' || p.status === 'overdue' ? 'danger' : 'warning'}">${ui.escapeHtml((p.status || '').toUpperCase())}</span></td>
                  <td><button class="btn btn-ghost btn-sm" type="button">Send Reminder</button></td>
                </tr>
              `).join('')}
              ${payments.length === 0 ? '<tr><td colspan="6" style="text-align: center; color: var(--ink-500); padding: var(--space-6);">All accounts current</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      `;
    }

    function renderCompounds(panel) {
      const compounds = store.readAll('compounds') || [];
      panel.innerHTML = `
        <div class="card card-pad stub-section">
          <div class="stub-section__banner">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; compound fines view. Auto-detection rules + dispute workflow ship in Phase 2.</span>
          </div>
          <div class="stub-section__layout">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
                <h4 style="margin: 0;">Compound Fines</h4>
                <button class="btn btn-primary btn-sm" type="button"><i class="fa-solid fa-plus"></i>&nbsp;Issue Compound</button>
              </div>
              <table class="table">
                <thead><tr><th>ID</th><th>Student</th><th>Violation</th><th>Amount</th><th>Status</th><th>Issued</th></tr></thead>
                <tbody>
                  ${compounds.map(c => `
                    <tr>
                      <td>${ui.escapeHtml(c.id)}</td>
                      <td>${ui.escapeHtml(c.studentName)} <span style="color: var(--ink-500); font-size: 11px;">(${ui.escapeHtml(c.studentId)})</span></td>
                      <td>${ui.escapeHtml(c.violation)}</td>
                      <td>${ui.formatMoney(c.amount)}</td>
                      <td><span class="badge badge--${c.status === 'paid' ? 'success' : 'warning'}">${ui.escapeHtml((c.status || '').toUpperCase())}</span></td>
                      <td>${ui.formatRelative(c.issuedAt)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <aside class="stub-section__aside">
              <h4>Coming next</h4>
              <ul>
                <li>Auto-detection rules</li>
                <li>Dispute workflow</li>
                <li>Bulk waive / forgive</li>
                <li>Linked to attendance</li>
              </ul>
            </aside>
          </div>
        </div>
      `;
    }

    function renderStatistics(panel) {
      panel.innerHTML = `
        <div class="card card-pad stub-section">
          <div class="stub-section__banner">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; revenue analytics preview. Drilldown reports + export ship in Phase 2.</span>
          </div>
          <div class="stub-section__layout">
            <div>
              <h4 style="margin-top: 0;">Monthly Revenue (last 6 months)</h4>
              <div style="position: relative; height: 280px;">
                <canvas id="billing-stats-chart"></canvas>
              </div>
            </div>
            <aside class="stub-section__aside">
              <h4>Coming next</h4>
              <ul>
                <li>Drilldown by tenant</li>
                <li>Block-level revenue</li>
                <li>Year-on-year compare</li>
                <li>CSV / PDF export</li>
              </ul>
            </aside>
          </div>
        </div>
      `;
      const canvas = panel.querySelector('#billing-stats-chart');
      if (canvas && window.Chart) {
        new Chart(canvas, {
          type: 'bar',
          data: {
            labels: ['Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26'],
            datasets: [
              { label: 'Billed',    data: [62000, 64500, 65000, 65800, 65400, 66200], backgroundColor: '#BAE6FD' },
              { label: 'Collected', data: [58000, 61000, 62500, 63000, 58200, 59800], backgroundColor: '#0EA5E9' }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            scales: {
              x: { grid: { display: false } },
              y: { beginAtZero: true, ticks: { callback: v => 'RM ' + (v/1000) + 'k' } }
            }
          }
        });
      }
    }

    render();
  }

  window.adminBillingInit = init;
})();
