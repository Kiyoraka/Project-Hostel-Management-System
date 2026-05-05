/* =====================================================================
   admin-hostel.js — Hostel Management tabbed wrapper (Phase 6)
   Tabs: Overview | Room & Beds | Check In/Out | Appointments
   ===================================================================== */

(function () {
  'use strict';

  const TABS = [
    { id: 'overview',   label: 'Overview',         icon: 'fa-house-chimney' },
    { id: 'rooms',      label: 'Room & Beds',      icon: 'fa-bed' },
    { id: 'checkinout', label: 'Check In / Out',   icon: 'fa-right-left' },
    { id: 'appts',      label: 'Appointments',     icon: 'fa-calendar-check' }
  ];

  function init({ content, currentUser }) {
    let activeTab = 'overview';

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

    function renderOverview(panel) {
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

    function renderRooms(panel) {
      panel.innerHTML = '<div class="card card-pad" id="hostel-rooms-mount"></div>';
      const mount = panel.querySelector('#hostel-rooms-mount');
      if (typeof window.adminRoomsInit === 'function') {
        window.adminRoomsInit({ content: mount });
      } else {
        mount.innerHTML = '<div class="empty-state"><i class="fa-solid fa-bed"></i><h3>Rooms module not loaded</h3></div>';
      }
    }

    function renderCheckInOut(panel) {
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

    function renderAppointments(panel) {
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

    render();
  }

  window.adminHostelInit = init;
})();
