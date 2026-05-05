/* =====================================================================
   admin-residents.js — Resident Management tabbed wrapper
   Tabs: Overview | Record | Announcement | Attendance | History
   Phase 7 (desktop) + Phase MR (mobile-native per-tab renders)
   ===================================================================== */

(function () {
  'use strict';

  function isMobile() { return window.innerWidth <= 900; }

  const TABS = [
    { id: 'overview',     label: 'Overview',           icon: 'fa-users' },
    { id: 'record',       label: 'Record',             icon: 'fa-id-badge' },
    { id: 'announcement', label: 'Announcement',       icon: 'fa-bullhorn' },
    { id: 'attendance',   label: 'Attendance',         icon: 'fa-location-crosshairs' },
    { id: 'history',      label: 'History',            icon: 'fa-clock-rotate-left' }
  ];

  function init({ content, currentUser }) {
    let activeTab = 'overview';

    function render() {
      content.innerHTML = `
        <div class="section-header">
          <div>
            <div class="section-title">Resident Management</div>
            <div class="section-subtitle">Tenant directory, records, announcements, geofence attendance, and history</div>
          </div>
        </div>

        <div class="tabs" role="tablist">
          ${TABS.map(t => `
            <button type="button" class="tabs__btn ${t.id === activeTab ? 'is-active' : ''}" data-tab="${t.id}" role="tab" aria-selected="${t.id === activeTab}">
              <i class="fa-solid ${t.icon}" aria-hidden="true"></i>&nbsp;${t.label}
            </button>
          `).join('')}
        </div>

        <div id="residents-tab-panel" class="tabs__panel is-active" role="tabpanel"></div>
      `;
      content.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => { activeTab = btn.dataset.tab; render(); });
      });
      renderPanel();
    }

    function renderPanel() {
      const panel = content.querySelector('#residents-tab-panel');
      if (!panel) return;
      if (activeTab === 'overview')     return renderOverview(panel);
      if (activeTab === 'record')       return renderRecord(panel);
      if (activeTab === 'announcement') return renderAnnouncements(panel);
      if (activeTab === 'attendance')   return renderAttendance(panel);
      if (activeTab === 'history')      return renderHistory(panel);
    }

    function getResidents() {
      const tenants = auth.listUsers().filter(u => u.role === 'tenant');
      const extras = store.readAll('extra_tenants') || [];
      return [...tenants, ...extras];
    }

    function avatarInitials(name) {
      return (name || '').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
    }

    function historyEvents() {
      return [
        { date: '2026-04-28', kind: 'move-in',     who: 'Nur Hidayah',  desc: 'Moved into R-122 (Single, Block A)' },
        { date: '2026-04-15', kind: 'transfer',    who: 'Lee Wei',      desc: 'Transferred from R-205 to R-301' },
        { date: '2026-03-20', kind: 'course',      who: 'Ahmad Faiz',   desc: 'Course updated to Software Engineering' },
        { date: '2026-02-10', kind: 'move-in',     who: 'Raj Kumar',    desc: 'Moved into R-205 (Single, Block A)' },
        { date: '2026-01-30', kind: 'move-out',    who: 'Tan Wei Ming', desc: 'Lease ended, checked out R-110' },
        { date: '2026-01-15', kind: 'move-in',     who: 'Ahmad Faiz',   desc: 'Moved into R-204 (Twin, Block A)' }
      ];
    }
    function historyIcon(k) {
      return k === 'move-in' ? 'fa-arrow-right-to-bracket'
        : k === 'move-out' ? 'fa-arrow-right-from-bracket'
        : k === 'transfer' ? 'fa-shuffle'
        : 'fa-pen';
    }

    /* ===================================================================
       Overview tab
       =================================================================== */
    function renderOverview(panel) {
      if (isMobile()) return renderMobileOverview(panel);
      panel.innerHTML = '<div class="card card-pad" id="residents-overview-mount"></div>';
      const mount = panel.querySelector('#residents-overview-mount');
      if (typeof window.adminUsersInit === 'function') {
        window.adminUsersInit({ content: mount, currentUser });
      } else {
        mount.innerHTML = '<div class="empty-state"><i class="fa-solid fa-users"></i><h3>Users module not loaded</h3></div>';
      }
    }

    function renderMobileOverview(panel) {
      const residents = getResidents();
      const total = residents.length;
      const active = residents.filter(r => (r.status || 'Active').toLowerCase() === 'active').length;
      const extras = (store.readAll('extra_tenants') || []).length;
      const rooms = store.readAll('rooms') || [];
      const occupancy = rooms.length ? Math.round(rooms.filter(r => r.status === 'occupied').length / rooms.length * 100) : 0;

      panel.innerHTML = `
        <div class="m-greeting" style="padding: var(--space-2) var(--space-2) var(--space-3);">
          <div class="m-greeting__hello">Resident Management</div>
          <div class="m-greeting__date">${total} residents registered</div>
        </div>

        <div class="m-hero-card">
          <div class="m-hero-card__label">Total Residents</div>
          <div class="m-hero-card__value">${total}</div>
          <div class="m-hero-card__bar">
            <div class="m-hero-card__bar-fill" style="width: ${occupancy}%;"></div>
          </div>
          <div class="m-hero-card__summary">
            <span><i class="dot dot--occupied"></i> ${active} active</span>
            <span><i class="dot dot--vacant"></i> ${total - active} inactive</span>
            <span><i class="dot dot--paid"></i> ${occupancy}% occupied</span>
          </div>
        </div>

        <div class="m-stats-row">
          <div class="m-stat-card">
            <div class="m-stat-card__label">Primary Tenants</div>
            <div class="m-stat-card__value">${total - extras}</div>
            <div class="m-stat-card__delta">named in auth</div>
          </div>
          <div class="m-stat-card">
            <div class="m-stat-card__label">Extra Tenants</div>
            <div class="m-stat-card__value">${extras}</div>
            <div class="m-stat-card__delta">seeded list</div>
          </div>
        </div>

        <div class="m-section-label">All Tenants <span class="m-carousel-hint">${total}</span></div>
        <div class="m-list-card">
          ${residents.map(r => `
            <div class="m-list-card__row">
              <i class="fa-solid fa-user activity-feed__icon activity-feed__icon--pickup" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(r.name || 'Unnamed')}</span>
                <span class="m-list-card__meta">${ui.escapeHtml(r.studentId || r.id || '-')} &middot; ${ui.escapeHtml(r.roomId || '-')}</span>
              </div>
              <span class="badge badge--${(r.status || 'Active').toLowerCase() === 'active' ? 'success' : 'warning'}" style="font-size: 10px;">${ui.escapeHtml(r.status || 'Active')}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    /* ===================================================================
       Record tab
       =================================================================== */
    function renderRecord(panel) {
      if (isMobile()) return renderMobileRecord(panel);
      const tenants = auth.listUsers().filter(u => u.role === 'tenant');
      const extras = store.readAll('extra_tenants') || [];
      const all = [...tenants, ...extras].slice(0, 6);
      panel.innerHTML = `
        <div class="card card-pad stub-section">
          <div class="stub-section__banner">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; resident record card structure preview. Full record editing + document upload ship in Phase 2.</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4);">
            ${all.map(t => `
              <div class="card card-pad" style="background: var(--surface-soft);">
                <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3);">
                  <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--brand-tint); color: var(--brand-primary-dark); display: flex; align-items: center; justify-content: center; font-weight: 600;">${ui.escapeHtml(avatarInitials(t.name))}</div>
                  <div>
                    <div style="font-weight: 600; color: var(--ink-900);">${ui.escapeHtml(t.name)}</div>
                    <div style="font-size: 12px; color: var(--ink-500);">${ui.escapeHtml(t.studentId || t.id || '-')}</div>
                  </div>
                </div>
                <div style="font-size: 13px; color: var(--ink-700); line-height: 1.7;">
                  <div><strong>Email:</strong> ${ui.escapeHtml(t.email || '-')}</div>
                  <div><strong>Room:</strong> ${ui.escapeHtml(t.roomId || '-')}</div>
                  <div><strong>Status:</strong> ${ui.escapeHtml(t.status || 'Active')}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    function renderMobileRecord(panel) {
      const all = getResidents();
      panel.innerHTML = `
        <div class="card card-pad stub-section" style="margin-bottom: var(--space-3);">
          <div class="stub-section__banner" style="margin-bottom: 0;">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; full record editing ships in Phase 2.</span>
          </div>
        </div>

        <div class="m-section-label">Resident Records <span class="m-carousel-hint">${all.length}</span></div>
        <div class="m-list-card">
          ${all.map(t => `
            <div class="m-list-card__row" style="align-items: center;">
              <span style="width: 40px; height: 40px; border-radius: 50%; background: var(--brand-tint); color: var(--brand-primary-dark); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; flex-shrink: 0;">${ui.escapeHtml(avatarInitials(t.name))}</span>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(t.name || 'Unnamed')}</span>
                <span class="m-list-card__meta">${ui.escapeHtml(t.studentId || t.id || '-')} &middot; ${ui.escapeHtml(t.roomId || '-')}</span>
                <span class="m-list-card__meta" style="font-size: 11px;">${ui.escapeHtml(t.email || '-')}</span>
              </div>
              <span class="badge badge--${(t.status || 'Active').toLowerCase() === 'active' ? 'success' : 'warning'}" style="font-size: 10px;">${ui.escapeHtml(t.status || 'Active')}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    /* ===================================================================
       Announcement tab
       =================================================================== */
    function renderAnnouncements(panel) {
      if (isMobile()) return renderMobileAnnouncements(panel);
      const announcements = store.readAll('announcements') || [];
      panel.innerHTML = `
        <div class="card card-pad">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
            <h3 style="margin: 0;">Announcements</h3>
            <button class="btn btn-primary btn-sm" type="button" data-compose><i class="fa-solid fa-plus"></i>&nbsp;New Announcement</button>
          </div>
          <ul class="recent-list">
            ${announcements.map(a => `
              <li class="recent-list__item">
                <div class="recent-list__main">
                  <span class="recent-list__title">${ui.escapeHtml(a.title)} ${a.priority === 'high' ? '<span class="badge badge--danger">High</span>' : ''}</span>
                  <span class="recent-list__meta">${ui.escapeHtml(a.body)}</span>
                  <span class="recent-list__meta" style="font-size: 11px; opacity: 0.7;">Audience: ${ui.escapeHtml(a.audience)} &middot; By ${ui.escapeHtml(a.createdBy)}</span>
                </div>
                <span class="recent-list__time">${ui.formatRelative(a.createdAt)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
      wireComposeButton(panel);
    }

    function renderMobileAnnouncements(panel) {
      const announcements = store.readAll('announcements') || [];
      panel.innerHTML = `
        <button class="btn btn-primary" type="button" data-compose style="width: 100%; padding: 12px; margin-bottom: var(--space-4);">
          <i class="fa-solid fa-plus" aria-hidden="true"></i>&nbsp;New Announcement
        </button>

        <div class="m-section-label">Announcements <span class="m-carousel-hint">${announcements.length}</span></div>
        <div class="m-list-card">
          ${announcements.map(a => `
            <div class="m-list-card__row">
              <i class="fa-solid fa-bullhorn activity-feed__icon activity-feed__icon--${a.priority === 'high' ? 'maintenance' : 'pickup'}" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(a.title)}</span>
                <span class="m-list-card__meta">${ui.escapeHtml(a.body)}</span>
                <span class="m-list-card__meta" style="font-size: 11px; opacity: 0.7;">${ui.escapeHtml(a.audience)} &middot; ${ui.escapeHtml(a.createdBy)}</span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
                ${a.priority === 'high' ? '<span class="badge badge--danger" style="font-size: 9px;">HIGH</span>' : ''}
                <span class="m-list-card__time">${ui.formatRelative(a.createdAt)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      wireComposeButton(panel);
    }

    function wireComposeButton(panel) {
      const composeBtn = panel.querySelector('[data-compose]');
      if (composeBtn) {
        composeBtn.addEventListener('click', () => {
          ui.openModal({
            title: 'New Announcement',
            body: `
              <label class="field"><span class="field__label">Title</span><input class="field__input" type="text" placeholder="What's this about?" /></label>
              <label class="field"><span class="field__label">Body</span><textarea class="field__input" rows="4" placeholder="Details..."></textarea></label>
              <label class="field"><span class="field__label">Audience</span><select class="field__input"><option>All</option><option>Tenants</option><option>Staff</option></select></label>
              <label class="field"><span class="field__label">Priority</span><select class="field__input"><option>Normal</option><option>High</option></select></label>
            `,
            footer: '<button class="btn btn-ghost" data-modal-close>Cancel</button> <button class="btn btn-primary" data-modal-close>Send</button>'
          });
        });
      }
    }

    /* ===================================================================
       Attendance tab
       =================================================================== */
    function renderAttendance(panel) {
      if (isMobile()) return renderMobileAttendance(panel);
      const records = store.readAll('attendance') || [];
      panel.innerHTML = `
        <div class="card card-pad stub-section">
          <div class="stub-section__banner">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; geofence attendance log preview. Live map + real geofence alerts ship in Phase 2.</span>
          </div>
          <div class="stub-section__layout">
            <div>
              <div style="background: linear-gradient(135deg, var(--brand-tint) 0%, var(--surface-soft) 100%); border-radius: var(--radius-card); height: 220px; display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-4); position: relative; overflow: hidden;">
                <div style="position: absolute; top: 30%; left: 25%; color: var(--brand-primary); font-size: 24px;"><i class="fa-solid fa-location-dot"></i></div>
                <div style="position: absolute; top: 50%; left: 60%; color: var(--success); font-size: 24px;"><i class="fa-solid fa-location-dot"></i></div>
                <div style="position: absolute; top: 70%; left: 40%; color: var(--warning); font-size: 24px;"><i class="fa-solid fa-location-dot"></i></div>
                <div style="color: var(--ink-500); font-size: 13px;">Geofence map placeholder</div>
              </div>
              <h4 style="margin-top: 0;">Recent Activity</h4>
              <table class="table">
                <thead><tr><th>Student</th><th>ID</th><th>Event</th><th>Location</th><th>Method</th><th>When</th></tr></thead>
                <tbody>
                  ${records.map(r => `
                    <tr>
                      <td>${ui.escapeHtml(r.studentName)}</td>
                      <td>${ui.escapeHtml(r.studentId)}</td>
                      <td><span class="badge badge--${r.event === 'in' ? 'success' : 'warning'}">${ui.escapeHtml(r.event.toUpperCase())}</span></td>
                      <td>${ui.escapeHtml(r.location)}</td>
                      <td>${ui.escapeHtml(r.method)}</td>
                      <td>${ui.formatRelative(r.recordedAt)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <aside class="stub-section__aside">
              <h4>Coming next</h4>
              <ul>
                <li>Live Mapbox/Leaflet integration</li>
                <li>Real-time geofence alerts</li>
                <li>Curfew violation auto-flag</li>
                <li>Attendance reports</li>
              </ul>
            </aside>
          </div>
        </div>
      `;
    }

    function renderMobileAttendance(panel) {
      const records = store.readAll('attendance') || [];
      panel.innerHTML = `
        <div class="card card-pad stub-section" style="margin-bottom: var(--space-3);">
          <div class="stub-section__banner" style="margin-bottom: 0;">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; live geofence ships in Phase 2.</span>
          </div>
        </div>

        <div style="background: linear-gradient(135deg, var(--brand-tint) 0%, var(--surface-soft) 100%); border-radius: var(--radius-card); height: 160px; display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-4); position: relative; overflow: hidden;">
          <div style="position: absolute; top: 30%; left: 25%; color: var(--brand-primary); font-size: 22px;"><i class="fa-solid fa-location-dot"></i></div>
          <div style="position: absolute; top: 55%; left: 60%; color: var(--success); font-size: 22px;"><i class="fa-solid fa-location-dot"></i></div>
          <div style="position: absolute; top: 70%; left: 35%; color: var(--warning); font-size: 22px;"><i class="fa-solid fa-location-dot"></i></div>
          <div style="color: var(--ink-500); font-size: 12px;">Geofence map placeholder</div>
        </div>

        <div class="m-section-label">Recent Attendance <span class="m-carousel-hint">${records.length}</span></div>
        <div class="m-list-card">
          ${records.map(r => `
            <div class="m-list-card__row">
              <i class="fa-solid fa-location-crosshairs activity-feed__icon activity-feed__icon--${r.event === 'in' ? 'pickup' : 'maintenance'}" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(r.studentName)} &middot; ${ui.escapeHtml(r.studentId)}</span>
                <span class="m-list-card__meta">${ui.escapeHtml(r.location)} &middot; ${ui.escapeHtml(r.method)}</span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
                <span class="badge badge--${r.event === 'in' ? 'success' : 'warning'}" style="font-size: 10px;">${ui.escapeHtml(r.event.toUpperCase())}</span>
                <span class="m-list-card__time">${ui.formatRelative(r.recordedAt)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    /* ===================================================================
       History tab
       =================================================================== */
    function renderHistory(panel) {
      if (isMobile()) return renderMobileHistory(panel);
      const events = historyEvents();
      panel.innerHTML = `
        <div class="card card-pad stub-section">
          <div class="stub-section__banner">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; resident timeline preview. Searchable filter + per-resident drilldown ship in Phase 2.</span>
          </div>
          <ul class="activity-feed">
            ${events.map(e => `
              <li class="activity-feed__item">
                <i class="fa-solid ${historyIcon(e.kind)} activity-feed__icon activity-feed__icon--pickup" aria-hidden="true"></i>
                <div class="activity-feed__main">
                  <span class="activity-feed__title">${ui.escapeHtml(e.who)} &mdash; ${ui.escapeHtml(e.desc)}</span>
                  <span class="activity-feed__meta">${ui.escapeHtml(e.kind.replace('-', ' '))}</span>
                </div>
                <span class="activity-feed__time">${ui.escapeHtml(e.date)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    function renderMobileHistory(panel) {
      const events = historyEvents();
      panel.innerHTML = `
        <div class="card card-pad stub-section" style="margin-bottom: var(--space-3);">
          <div class="stub-section__banner" style="margin-bottom: 0;">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; searchable filter ships in Phase 2.</span>
          </div>
        </div>

        <div class="m-section-label">Resident Timeline <span class="m-carousel-hint">${events.length}</span></div>
        <div class="m-list-card">
          ${events.map(e => `
            <div class="m-list-card__row">
              <i class="fa-solid ${historyIcon(e.kind)} activity-feed__icon activity-feed__icon--pickup" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(e.who)}</span>
                <span class="m-list-card__meta">${ui.escapeHtml(e.desc)}</span>
                <span class="m-list-card__meta" style="font-size: 11px; opacity: 0.7;">${ui.escapeHtml(e.kind.replace('-', ' '))}</span>
              </div>
              <span class="m-list-card__time">${ui.escapeHtml(e.date)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    render();
  }

  window.adminResidentsInit = init;
})();
