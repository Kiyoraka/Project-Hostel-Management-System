/* =====================================================================
   admin-hostel.js — Hostel Management tabbed wrapper
   Tabs: Overview | Room & Beds | Check In/Out | Appointments
   Phase 6 (desktop) + Phase MH1 (mobile-native per-tab renders)
   ===================================================================== */

(function () {
  'use strict';

  function isMobile() { return window.innerWidth <= 900; }

  const TABS = [
    { id: 'overview',   label: 'Overview',         icon: 'fa-house-chimney' },
    { id: 'rooms',      label: 'Room & Beds',      icon: 'fa-bed' },
    { id: 'checkinout', label: 'Check In / Out',   icon: 'fa-right-left' },
    { id: 'appts',      label: 'Appointments',     icon: 'fa-calendar-check' }
  ];

  function init({ content, currentUser }) {
    let activeTab = 'overview';
    let activeBlock = 'A';

    function render() {
      content.innerHTML = `
        <div class="section-header">
          <div>
            <div class="section-title">Hostel Management</div>
            <div class="section-subtitle">Hostel directory, room and bed management, check-in flows, and appointments</div>
          </div>
        </div>

        <div class="tabs" role="tablist">
          ${TABS.map(t => `
            <button type="button" class="tabs__btn ${t.id === activeTab ? 'is-active' : ''}" data-tab="${t.id}" role="tab" aria-selected="${t.id === activeTab}">
              <i class="fa-solid ${t.icon}" aria-hidden="true"></i>&nbsp;${t.label}
            </button>
          `).join('')}
        </div>

        <div id="hostel-tab-panel" class="tabs__panel is-active" role="tabpanel"></div>
      `;

      content.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
          activeTab = btn.dataset.tab;
          render();
        });
      });

      renderPanel();
    }

    function renderPanel() {
      const panel = content.querySelector('#hostel-tab-panel');
      if (!panel) return;
      if (activeTab === 'overview')   return renderOverview(panel);
      if (activeTab === 'rooms')      return renderRooms(panel);
      if (activeTab === 'checkinout') return renderCheckInOut(panel);
      if (activeTab === 'appts')      return renderAppointments(panel);
    }

    /* ===================================================================
       Overview tab
       =================================================================== */
    function renderOverview(panel) {
      if (isMobile()) return renderMobileOverview(panel);
      const hostel = (store.readAll('hostels') || [])[0] || {};
      const rooms = store.readAll('rooms');
      const occupied = rooms.filter(r => r.status === 'occupied').length;
      const vacant = rooms.filter(r => r.status === 'vacant').length;
      const maint = rooms.filter(r => r.status === 'maintenance').length;
      panel.innerHTML = `
        <div class="card card-pad">
          <h3 class="mb-3">${ui.escapeHtml(hostel.name || 'Hostel')}</h3>
          <div class="kpi-strip" style="grid-template-columns: repeat(4, 1fr); margin-bottom: var(--space-4);">
            <div class="kpi-tile"><div class="kpi-tile__label">Capacity</div><div class="kpi-tile__value">${hostel.capacity || rooms.length}</div></div>
            <div class="kpi-tile"><div class="kpi-tile__label">Occupied</div><div class="kpi-tile__value">${occupied}</div></div>
            <div class="kpi-tile"><div class="kpi-tile__label">Vacant</div><div class="kpi-tile__value">${vacant}</div></div>
            <div class="kpi-tile"><div class="kpi-tile__label">Under Maint.</div><div class="kpi-tile__value">${maint}</div></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6);">
            <div>
              <h4 style="margin-top: 0;">Property Info</h4>
              <p><strong>Address:</strong> ${ui.escapeHtml(hostel.address || '-')}</p>
              <p><strong>Blocks:</strong> ${(hostel.blocks || []).join(', ') || '-'}</p>
              <p><strong>Manager:</strong> ${ui.escapeHtml(hostel.managerName || '-')}</p>
              <p><strong>Contact:</strong> ${ui.escapeHtml(hostel.contactPhone || '-')} &middot; ${ui.escapeHtml(hostel.contactEmail || '-')}</p>
              <p><strong>Established:</strong> ${ui.escapeHtml(hostel.established || '-')}</p>
            </div>
            <div>
              <h4 style="margin-top: 0;">Amenities</h4>
              <ul style="list-style: none; padding-left: 0; margin: 0;">
                ${(hostel.amenities || []).map(a => `<li style="padding: 4px 0;"><i class="fa-solid fa-check" style="color: var(--success); margin-right: 8px;" aria-hidden="true"></i>${ui.escapeHtml(a)}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      `;
    }

    function renderMobileOverview(panel) {
      const hostel = (store.readAll('hostels') || [])[0] || {};
      const rooms = store.readAll('rooms');
      const occupied = rooms.filter(r => r.status === 'occupied').length;
      const vacant = rooms.filter(r => r.status === 'vacant').length;
      const maint = rooms.filter(r => r.status === 'maintenance').length;
      const capacity = hostel.capacity || rooms.length;
      const occupancyRate = capacity ? Math.round(occupied / capacity * 100) : 0;
      const cityLine = (hostel.address || '').split(',').slice(-2).join(',').trim() || '-';
      const blocksLine = (hostel.blocks || []).map(b => 'Block ' + b).join(' · ');

      panel.innerHTML = `
        <div class="m-greeting" style="padding: var(--space-2) var(--space-2) var(--space-3);">
          <div class="m-greeting__hello">${ui.escapeHtml(hostel.name || 'Hostel')}</div>
          <div class="m-greeting__date">${ui.escapeHtml(cityLine)}${blocksLine ? ' · ' + ui.escapeHtml(blocksLine) : ''}</div>
        </div>

        <div class="m-hero-card">
          <div class="m-hero-card__label">Occupancy</div>
          <div class="m-hero-card__value">${occupancyRate}%</div>
          <div class="m-hero-card__bar">
            <div class="m-hero-card__bar-fill" style="width: ${occupancyRate}%;"></div>
          </div>
          <div class="m-hero-card__summary">
            <span><i class="dot dot--occupied"></i> ${occupied} occupied</span>
            <span><i class="dot dot--vacant"></i> ${vacant} vacant</span>
            <span><i class="dot dot--maintenance"></i> ${maint} maint.</span>
          </div>
        </div>

        <div class="m-stats-row">
          <div class="m-stat-card">
            <div class="m-stat-card__label">Capacity</div>
            <div class="m-stat-card__value">${capacity}</div>
            <div class="m-stat-card__delta">beds total</div>
          </div>
          <div class="m-stat-card">
            <div class="m-stat-card__label">Established</div>
            <div class="m-stat-card__value" style="font-size: 16px;">${ui.escapeHtml(hostel.established || '-')}</div>
            <div class="m-stat-card__delta">opened</div>
          </div>
        </div>

        <div class="m-section-label">Property Info</div>
        <div class="m-list-card">
          <div class="m-list-card__row">
            <i class="fa-solid fa-location-dot activity-feed__icon activity-feed__icon--pickup" aria-hidden="true"></i>
            <div class="m-list-card__main">
              <span class="m-list-card__title">${ui.escapeHtml(hostel.address || '-')}</span>
              <span class="m-list-card__meta">Address</span>
            </div>
          </div>
          <div class="m-list-card__row">
            <i class="fa-solid fa-building activity-feed__icon activity-feed__icon--pickup" aria-hidden="true"></i>
            <div class="m-list-card__main">
              <span class="m-list-card__title">${(hostel.blocks || []).map(b => 'Block ' + b).join(' · ') || '-'}</span>
              <span class="m-list-card__meta">Blocks</span>
            </div>
          </div>
          <div class="m-list-card__row">
            <i class="fa-solid fa-user-tie activity-feed__icon activity-feed__icon--maintenance" aria-hidden="true"></i>
            <div class="m-list-card__main">
              <span class="m-list-card__title">${ui.escapeHtml(hostel.managerName || '-')}</span>
              <span class="m-list-card__meta">Manager</span>
            </div>
          </div>
          <div class="m-list-card__row">
            <i class="fa-solid fa-phone activity-feed__icon activity-feed__icon--payment" aria-hidden="true"></i>
            <div class="m-list-card__main">
              <span class="m-list-card__title">${ui.escapeHtml(hostel.contactPhone || '-')}</span>
              <span class="m-list-card__meta">Phone</span>
            </div>
          </div>
          <div class="m-list-card__row">
            <i class="fa-solid fa-envelope activity-feed__icon activity-feed__icon--payment" aria-hidden="true"></i>
            <div class="m-list-card__main">
              <span class="m-list-card__title">${ui.escapeHtml(hostel.contactEmail || '-')}</span>
              <span class="m-list-card__meta">Email</span>
            </div>
          </div>
        </div>

        <div class="m-section-label">Amenities</div>
        <div class="card card-pad">
          <ul style="list-style: none; padding-left: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            ${(hostel.amenities || []).map(a => `
              <li style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink-700);">
                <i class="fa-solid fa-check" style="color: var(--success);" aria-hidden="true"></i>
                ${ui.escapeHtml(a)}
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    /* ===================================================================
       Room & Beds tab
       =================================================================== */
    function renderRooms(panel) {
      if (isMobile()) return renderMobileRooms(panel);
      panel.innerHTML = '<div class="card card-pad" id="hostel-rooms-mount"></div>';
      const mount = panel.querySelector('#hostel-rooms-mount');
      if (typeof window.adminRoomsInit === 'function') {
        window.adminRoomsInit({ content: mount });
      } else {
        mount.innerHTML = '<div class="empty-state"><i class="fa-solid fa-bed"></i><h3>Rooms module not loaded</h3></div>';
      }
    }

    function renderMobileRooms(panel) {
      const allRooms = store.readAll('rooms') || [];
      const blocks = [...new Set(allRooms.map(r => r.block).filter(Boolean))].sort();
      if (!blocks.includes(activeBlock) && blocks.length) activeBlock = blocks[0];
      const blockRooms = allRooms.filter(r => r.block === activeBlock);
      const occupied = allRooms.filter(r => r.status === 'occupied').length;
      const vacant = allRooms.filter(r => r.status === 'vacant').length;
      const maint = allRooms.filter(r => r.status === 'maintenance').length;

      panel.innerHTML = `
        <div class="m-block-pills" role="tablist" aria-label="Block selector">
          ${blocks.map(b => `
            <button type="button" class="m-block-pill ${b === activeBlock ? 'is-active' : ''}" data-block="${ui.escapeHtml(b)}">Block ${ui.escapeHtml(b)}</button>
          `).join('')}
        </div>

        <div class="m-section-label">Room Status</div>
        <div class="card card-pad">
          <div class="room-status-grid">
            ${allRooms.map(r => `<span class="room-status-grid__cell room-status-grid__cell--${ui.escapeHtml(r.status)}" title="${ui.escapeHtml(r.id)} - ${ui.escapeHtml(r.status)}"></span>`).join('')}
          </div>
          <div class="room-status-grid__legend">
            <span><i class="dot dot--occupied"></i> Occupied (${occupied})</span>
            <span><i class="dot dot--vacant"></i> Vacant (${vacant})</span>
            <span><i class="dot dot--maintenance"></i> Maintenance (${maint})</span>
          </div>
        </div>

        <div class="m-section-label">Rooms in Block ${ui.escapeHtml(activeBlock)} <span class="m-carousel-hint">${blockRooms.length} rooms</span></div>
        <div class="m-list-card">
          ${blockRooms.map(r => `
            <div class="m-list-card__row m-room-row" data-room="${ui.escapeHtml(r.id)}">
              <span class="m-room-row__dot dot dot--${ui.escapeHtml(r.status)}"></span>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(r.id)} &middot; ${ui.escapeHtml(r.type || '-')}</span>
                <span class="m-list-card__meta">Floor ${ui.escapeHtml(String(r.floor || '-'))}</span>
              </div>
              <span class="m-list-card__time">${ui.formatMoney ? ui.formatMoney(r.rate || 0) : 'RM ' + (r.rate || 0)}</span>
            </div>
          `).join('')}
          ${blockRooms.length === 0 ? '<div class="m-list-card__row" style="justify-content: center; color: var(--ink-500);">No rooms in this block</div>' : ''}
        </div>
      `;

      panel.querySelectorAll('[data-block]').forEach(btn => {
        btn.addEventListener('click', () => {
          activeBlock = btn.dataset.block;
          renderMobileRooms(panel);
        });
      });
    }

    /* ===================================================================
       Check In / Out tab
       =================================================================== */
    function renderCheckInOut(panel) {
      if (isMobile()) return renderMobileCheckInOut(panel);
      const tenants = auth.listUsers().filter(u => u.role === 'tenant');
      const rooms = store.readAll('rooms');
      panel.innerHTML = `
        <div class="card card-pad stub-section">
          <div class="stub-section__banner">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; this view shows the planned structure for Check In / Check Out. Live data wiring + workflows ship in Phase 2.</span>
          </div>
          <div class="stub-section__layout">
            <div>
              <h4 style="margin-top: 0;">New Check-In / Check-Out</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-4);">
                <label class="field"><span class="field__label">Resident</span>
                  <select class="field__input">${tenants.map(t => `<option>${ui.escapeHtml(t.name)}</option>`).join('')}</select>
                </label>
                <label class="field"><span class="field__label">Room</span>
                  <select class="field__input">${rooms.slice(0, 12).map(r => `<option>${ui.escapeHtml(r.id)}</option>`).join('')}</select>
                </label>
                <label class="field"><span class="field__label">Action</span>
                  <select class="field__input"><option>Check In</option><option>Check Out</option></select>
                </label>
                <label class="field"><span class="field__label">Date / Time</span>
                  <input class="field__input" type="datetime-local" />
                </label>
              </div>
              <button class="btn btn-primary" type="button">Submit</button>

              <h4 style="margin-top: var(--space-6);">Recent Check-Ins</h4>
              <table class="table">
                <thead><tr><th>Resident</th><th>Room</th><th>Action</th><th>When</th></tr></thead>
                <tbody>
                  <tr><td>Ahmad Faiz</td><td>R-204</td><td>Check In</td><td>15 Jan 2026</td></tr>
                  <tr><td>Lee Wei</td><td>R-301</td><td>Check In</td><td>20 Jan 2026</td></tr>
                  <tr><td>Siti Aminah</td><td>R-118</td><td>Check In</td><td>05 Feb 2026</td></tr>
                  <tr><td>Raj Kumar</td><td>R-205</td><td>Check In</td><td>12 Feb 2026</td></tr>
                  <tr><td>Nur Hidayah</td><td>R-122</td><td>Check In</td><td>20 Feb 2026</td></tr>
                </tbody>
              </table>
            </div>
            <aside class="stub-section__aside">
              <h4>Coming next</h4>
              <ul>
                <li>E-signature capture</li>
                <li>Photo of resident at check-in</li>
                <li>Key handover log</li>
                <li>Inventory checklist</li>
                <li>Auto-email confirmation</li>
              </ul>
            </aside>
          </div>
        </div>
      `;
    }

    function renderMobileCheckInOut(panel) {
      const tenants = auth.listUsers().filter(u => u.role === 'tenant');
      const rooms = store.readAll('rooms');
      const recent = [
        { who: 'Ahmad Faiz',  room: 'R-204', action: 'Check In', when: '15 Jan 2026' },
        { who: 'Lee Wei',     room: 'R-301', action: 'Check In', when: '20 Jan 2026' },
        { who: 'Siti Aminah', room: 'R-118', action: 'Check In', when: '05 Feb 2026' },
        { who: 'Raj Kumar',   room: 'R-205', action: 'Check In', when: '12 Feb 2026' },
        { who: 'Nur Hidayah', room: 'R-122', action: 'Check In', when: '20 Feb 2026' }
      ];

      panel.innerHTML = `
        <div class="card card-pad stub-section" style="margin-bottom: var(--space-3);">
          <div class="stub-section__banner" style="margin-bottom: 0;">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; workflow ships in Phase 2.</span>
          </div>
        </div>

        <div class="m-section-label">New Check-In / Check-Out</div>
        <div class="card card-pad">
          <label class="field"><span class="field__label">Resident</span>
            <select class="field__input">${tenants.map(t => `<option>${ui.escapeHtml(t.name)}</option>`).join('')}</select>
          </label>
          <label class="field"><span class="field__label">Room</span>
            <select class="field__input">${rooms.slice(0, 12).map(r => `<option>${ui.escapeHtml(r.id)}</option>`).join('')}</select>
          </label>
          <div class="field">
            <span class="field__label">Action</span>
            <div class="m-segmented" role="radiogroup" aria-label="Action">
              <button type="button" class="m-segmented__btn is-active" data-action="in">Check In</button>
              <button type="button" class="m-segmented__btn" data-action="out">Check Out</button>
            </div>
          </div>
          <label class="field"><span class="field__label">Date / Time</span>
            <input class="field__input" type="datetime-local" />
          </label>
          <button class="btn btn-primary" type="button" style="width: 100%; padding: 12px;">Submit</button>
        </div>

        <div class="m-section-label">Recent Check-Ins</div>
        <div class="m-list-card">
          ${recent.map(r => `
            <div class="m-list-card__row">
              <i class="fa-solid fa-arrow-right-to-bracket activity-feed__icon activity-feed__icon--pickup" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(r.who)} &middot; ${ui.escapeHtml(r.room)}</span>
                <span class="m-list-card__meta">${ui.escapeHtml(r.action)}</span>
              </div>
              <span class="m-list-card__time">${ui.escapeHtml(r.when)}</span>
            </div>
          `).join('')}
        </div>

        <div class="m-section-label">Coming Next</div>
        <div class="m-list-card">
          ${['E-signature capture', 'Photo of resident at check-in', 'Key handover log', 'Inventory checklist', 'Auto-email confirmation'].map(item => `
            <div class="m-list-card__row">
              <i class="fa-solid fa-circle-dot" style="color: var(--brand-primary); font-size: 8px; margin-top: 8px;" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title" style="font-weight: 400;">${ui.escapeHtml(item)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      panel.querySelectorAll('.m-segmented__btn').forEach(btn => {
        btn.addEventListener('click', () => {
          panel.querySelectorAll('.m-segmented__btn').forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');
        });
      });
    }

    /* ===================================================================
       Appointments tab
       =================================================================== */
    function renderAppointments(panel) {
      if (isMobile()) return renderMobileAppts(panel);
      const appts = [
        { time: '14:00', visitor: 'Encik Ali (Father)', resident: 'Ahmad Faiz',  purpose: 'Family visit' },
        { time: '15:30', visitor: 'Pos Laju Courier',   resident: 'Siti Aminah', purpose: 'Parcel delivery' },
        { time: '16:00', visitor: 'UTM Liaison Officer',resident: 'All Block A', purpose: 'Welfare check' }
      ];
      panel.innerHTML = `
        <div class="card card-pad stub-section">
          <div class="stub-section__banner">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; appointment scheduling structure preview. Booking workflow ships in Phase 2.</span>
          </div>
          <div class="stub-section__layout">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
                <h4 style="margin: 0;">Today's Appointments</h4>
                <button class="btn btn-primary btn-sm" type="button"><i class="fa-solid fa-plus"></i>&nbsp;Book Appointment</button>
              </div>
              <ul class="recent-list">
                ${appts.map(a => `
                  <li class="recent-list__item">
                    <div class="recent-list__main">
                      <span class="recent-list__title">${ui.escapeHtml(a.time)} &mdash; ${ui.escapeHtml(a.visitor)}</span>
                      <span class="recent-list__meta">For: ${ui.escapeHtml(a.resident)} &middot; ${ui.escapeHtml(a.purpose)}</span>
                    </div>
                    <span class="recent-list__time">Confirmed</span>
                  </li>
                `).join('')}
              </ul>
            </div>
            <aside class="stub-section__aside">
              <h4>Coming next</h4>
              <ul>
                <li>Resident-side request flow</li>
                <li>Visitor pre-registration</li>
                <li>Calendar sync</li>
                <li>SMS reminders</li>
              </ul>
            </aside>
          </div>
        </div>
      `;
    }

    function renderMobileAppts(panel) {
      const appts = [
        { time: '14:00', icon: 'fa-user', visitor: 'Encik Ali (Father)', resident: 'Ahmad Faiz',  purpose: 'Family visit',     status: 'Confirmed' },
        { time: '15:30', icon: 'fa-box',  visitor: 'Pos Laju Courier',   resident: 'Siti Aminah', purpose: 'Parcel delivery',  status: 'Confirmed' },
        { time: '16:00', icon: 'fa-graduation-cap', visitor: 'UTM Liaison Officer', resident: 'All Block A', purpose: 'Welfare check', status: 'Confirmed' }
      ];

      panel.innerHTML = `
        <div class="card card-pad stub-section" style="margin-bottom: var(--space-3);">
          <div class="stub-section__banner" style="margin-bottom: 0;">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Prototype scope &mdash; booking ships in Phase 2.</span>
          </div>
        </div>

        <button class="btn btn-primary" type="button" style="width: 100%; padding: 12px; margin-bottom: var(--space-4);">
          <i class="fa-solid fa-plus" aria-hidden="true"></i>&nbsp;Book Appointment
        </button>

        <div class="m-section-label">Today's Appointments <span class="m-carousel-hint">${appts.length}</span></div>
        <div class="m-list-card">
          ${appts.map(a => `
            <div class="m-list-card__row">
              <i class="fa-solid ${a.icon} activity-feed__icon activity-feed__icon--pickup" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title">${ui.escapeHtml(a.time)} &middot; ${ui.escapeHtml(a.visitor)}</span>
                <span class="m-list-card__meta">For ${ui.escapeHtml(a.resident)} &middot; ${ui.escapeHtml(a.purpose)}</span>
              </div>
              <span class="badge badge--success" style="font-size: 10px; flex-shrink: 0;">${ui.escapeHtml(a.status)}</span>
            </div>
          `).join('')}
        </div>

        <div class="m-section-label">Coming Next</div>
        <div class="m-list-card">
          ${['Resident-side request flow', 'Visitor pre-registration', 'Calendar sync', 'SMS reminders'].map(item => `
            <div class="m-list-card__row">
              <i class="fa-solid fa-circle-dot" style="color: var(--brand-primary); font-size: 8px; margin-top: 8px;" aria-hidden="true"></i>
              <div class="m-list-card__main">
                <span class="m-list-card__title" style="font-weight: 400;">${ui.escapeHtml(item)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    render();
  }

  window.adminHostelInit = init;
})();
