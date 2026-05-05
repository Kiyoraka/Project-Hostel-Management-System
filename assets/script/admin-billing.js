/* =====================================================================
   admin-billing.js — Billings & Payment tabbed wrapper (Phase 9)
   Tabs: Overview | Invoices | Overdue | Compounds | Statistics
   ===================================================================== */

(function () {
  'use strict';

  function isMobile() { return window.innerWidth <= 900; }

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

    function paymentStatusBadge(s) {
      if (s === 'paid') return 'success';
      if (s === 'due') return 'warning';
      return 'danger';
    }

    function renderOverview(panel) {
      if (isMobile()) return renderMobileOverview(panel);
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

    function renderMobileOverview(panel) {
      const payments = store.readAll('payments') || [];
      const totalBilled = payments.reduce((s, p) => s + (p.amount || 0), 0);
      const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
      const outstanding = totalBilled - totalPaid;
      const overdueCount = payments.filter(p => p.status === 'late' || p.status === 'overdue').length;
      const collectionRate = totalBilled ? Math.round(totalPaid / totalBilled * 100) : 0;
      const recent = payments.filter(p => p.status === 'paid').slice(0, 5);

      panel.innerHTML = `
        <div class="m-greeting" style="padding: var(--space-2) var(--space-2) var(--space-3);">
          <div class="m-greeting__hello">Billings &amp; Payment</div>
          <div class="m-greeting__date">${payments.length} invoices tracked</div>
        </div>

        <div class="m-hero-card">
          <div class="m-hero-card__label">Total Billed</div>
          <div class="m-hero-card__value">${ui.formatMoney(totalBilled)}</div>
          <div class="m-hero-card__bar">
            <div class="m-hero-card__bar-fill" style="width: ${collectionRate}%;"></div>
          </div>
          <div class="m-hero-card__summary">
            <span><i class="dot dot--paid"></i> ${ui.formatMoney(totalPaid)} paid</span>
            <span><i class="dot dot--due"></i> ${ui.formatMoney(outstanding)} due</span>
            <span><i class="dot dot--overdue"></i> ${overdueCount} overdue</span>
          </div>
        </div>

        <div class="m-stats-row">
          <div class="m-stat-card">
            <div class="m-stat-card__label">Collection Rate</div>
            <div class="m-stat-card__value">${collectionRate}%</div>
            <div class="m-stat-card__delta">paid / billed</div>
          </div>
          <div class="m-stat-card">
            <div class="m-stat-card__label">Outstanding</div>
            <div class="m-stat-card__value" style="font-size: 16px;">${ui.formatMoney(outstanding)}</div>
            <div class="m-stat-card__delta m-stat-card__delta--down">${overdueCount} overdue</div>
          </div>
        </div>

        <div class="m-section-label">Recent Payments <span class="m-carousel-hint">${recent.length}</span></div>
        <div class="m-list-card">
          ${recent.map(p => `
            <div class="m-list-card__row">
              <i class="fa-solid fa-money-bill-wave activity-feed__icon activity-feed__icon--payment" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(p.tenantName)} &middot; ${ui.formatMoney(p.amount)}</span>
                <span class="m-list-card__meta">${ui.formatPeriod(p.period)} &middot; ${ui.escapeHtml(p.method || '-')}</span>
              </div>
              <span class="m-list-card__time">${ui.escapeHtml(p.paidOn || '-')}</span>
            </div>
          `).join('')}
          ${recent.length === 0 ? '<div class="m-list-card__row" style="justify-content: center; color: var(--ink-500);">No payments yet</div>' : ''}
        </div>
      `;
    }

    function renderInvoices(panel) {
      if (isMobile()) return renderMobileInvoices(panel);
      panel.innerHTML = '<div class="card card-pad" id="billing-invoices-mount"></div>';
      const mount = panel.querySelector('#billing-invoices-mount');
      if (typeof window.adminRentalsInit === 'function') {
        window.adminRentalsInit({ content: mount });
      } else {
        mount.innerHTML = '<div class="empty-state"><i class="fa-solid fa-file-invoice-dollar"></i><h3>Rentals module not loaded</h3></div>';
      }
    }

    function renderMobileInvoices(panel) {
      const payments = store.readAll('payments') || [];
      panel.innerHTML = `
        <div class="m-section-label">Invoices <span class="m-carousel-hint">${payments.length}</span></div>
        <div class="m-list-card">
          ${payments.map(p => `
            <div class="m-list-card__row">
              <i class="fa-solid fa-file-invoice-dollar activity-feed__icon activity-feed__icon--payment" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(p.tenantName)} &middot; ${ui.escapeHtml(p.roomId)}</span>
                <span class="m-list-card__meta">${ui.formatPeriod(p.period)} &middot; ${ui.formatMoney(p.amount)}</span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
                <span class="badge badge--${paymentStatusBadge(p.status)}" style="font-size: 10px;">${ui.escapeHtml((p.status || '').toUpperCase())}</span>
                <span class="m-list-card__time">${ui.escapeHtml(p.paidOn || '-')}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    function renderOverdue(panel) {
      if (isMobile()) return renderMobileOverdue(panel);
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

    function renderMobileOverdue(panel) {
      const payments = (store.readAll('payments') || []).filter(p => p.status === 'late' || p.status === 'overdue' || p.status === 'due');

      panel.innerHTML = `
        <div class="m-section-label">Overdue &amp; Due Accounts <span class="m-carousel-hint">${payments.length}</span></div>
        <div class="m-list-card">
          ${payments.map(p => `
            <div class="m-list-card__row">
              <i class="fa-solid fa-circle-exclamation activity-feed__icon activity-feed__icon--maintenance" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(p.tenantName)} &middot; ${ui.escapeHtml(p.roomId)}</span>
                <span class="m-list-card__meta">${ui.formatPeriod(p.period)} &middot; ${ui.formatMoney(p.amount)}</span>
                <button class="btn btn-ghost btn-sm" type="button" style="margin-top: 6px; align-self: flex-start;">Send Reminder</button>
              </div>
              <span class="badge badge--${p.status === 'late' || p.status === 'overdue' ? 'danger' : 'warning'}" style="font-size: 10px; flex-shrink: 0;">${ui.escapeHtml((p.status || '').toUpperCase())}</span>
            </div>
          `).join('')}
          ${payments.length === 0 ? '<div class="m-list-card__row" style="justify-content: center; color: var(--ink-500);">All accounts current</div>' : ''}
        </div>
      `;
    }

    function renderCompounds(panel) {
      if (isMobile()) return renderMobileCompounds(panel);
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

    function renderMobileCompounds(panel) {
      const compounds = store.readAll('compounds') || [];

      panel.innerHTML = `
        <div class="card card-pad stub-section" style="margin-bottom: var(--space-3);">
          <div class="stub-section__banner" style="margin-bottom: 0;">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; auto-detection ships in Phase 2.</span>
          </div>
        </div>

        <button class="btn btn-primary" type="button" style="width: 100%; padding: 12px; margin-bottom: var(--space-4);">
          <i class="fa-solid fa-plus" aria-hidden="true"></i>&nbsp;Issue Compound
        </button>

        <div class="m-section-label">Compound Fines <span class="m-carousel-hint">${compounds.length}</span></div>
        <div class="m-list-card">
          ${compounds.map(c => `
            <div class="m-list-card__row">
              <i class="fa-solid fa-receipt activity-feed__icon activity-feed__icon--maintenance" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(c.studentName)} &middot; ${ui.formatMoney(c.amount)}</span>
                <span class="m-list-card__meta">${ui.escapeHtml(c.violation)}</span>
                <span class="m-list-card__meta" style="font-size: 11px; opacity: 0.7;">${ui.escapeHtml(c.studentId)}</span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
                <span class="badge badge--${c.status === 'paid' ? 'success' : 'warning'}" style="font-size: 10px;">${ui.escapeHtml((c.status || '').toUpperCase())}</span>
                <span class="m-list-card__time">${ui.formatRelative(c.issuedAt)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    function renderStatistics(panel) {
      if (isMobile()) return renderMobileStatistics(panel);
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

    function renderMobileStatistics(panel) {
      panel.innerHTML = `
        <div class="card card-pad stub-section" style="margin-bottom: var(--space-3);">
          <div class="stub-section__banner" style="margin-bottom: 0;">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; drilldown reports ship in Phase 2.</span>
          </div>
        </div>

        <div class="m-section-label">Monthly Revenue <span class="m-carousel-hint">last 6 months</span></div>
        <div class="card card-pad">
          <div style="position: relative; height: 220px;">
            <canvas id="billing-stats-chart-mobile"></canvas>
          </div>
        </div>

        <div class="m-section-label">Coming Next</div>
        <div class="m-list-card">
          ${['Drilldown by tenant', 'Block-level revenue', 'Year-on-year compare', 'CSV / PDF export'].map(item => `
            <div class="m-list-card__row">
              <i class="fa-solid fa-circle-dot" style="color: var(--brand-primary); font-size: 8px; margin-top: 8px;" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title" style="font-weight: 400;">${ui.escapeHtml(item)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      const canvas = panel.querySelector('#billing-stats-chart-mobile');
      if (canvas && window.Chart) {
        new Chart(canvas, {
          type: 'bar',
          data: {
            labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [
              { label: 'Billed',    data: [62000, 64500, 65000, 65800, 65400, 66200], backgroundColor: '#BAE6FD' },
              { label: 'Collected', data: [58000, 61000, 62500, 63000, 58200, 59800], backgroundColor: '#0EA5E9' }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
            scales: {
              x: { grid: { display: false } },
              y: { beginAtZero: true, ticks: { callback: v => 'RM ' + (v/1000) + 'k', font: { size: 10 } } }
            }
          }
        });
      }
    }

    render();
  }

  window.adminBillingInit = init;
})();
