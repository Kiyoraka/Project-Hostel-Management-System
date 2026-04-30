/* =====================================================================
   tenant-room.js — Tenant My Room detail
   ===================================================================== */

(function () {
  'use strict';

  window.tenantRoomInit = function ({ content, currentUser }) {
    const room = store.findById('rooms', currentUser.roomId);
    const roommate = room && room.tenantId !== currentUser.id
      ? null
      : store.readAll('extra_tenants').find(t => t.roomId === currentUser.roomId && t.id !== currentUser.id);

    if (!room) {
      content.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-bed"></i>
          <h3>No room assigned</h3>
          <p>Please contact the hostel admin.</p>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div class="section-header">
        <div>
          <div class="section-title">Room ${ui.escapeHtml(room.id)}</div>
          <div class="section-subtitle">Block ${ui.escapeHtml(room.block)} · Floor ${room.floor} · ${room.type === 'twin' ? 'Twin' : 'Single'}</div>
        </div>
      </div>

      <div class="room-detail">
        <div class="room-photo">
          <i class="fa-solid fa-bed"></i>
        </div>
        <div class="card card-pad">
          <h3 class="mb-3">Details</h3>
          <div class="detail-row"><span class="detail-row__label">Type</span><span class="detail-row__value">${room.type === 'twin' ? 'Twin' : 'Single'}</span></div>
          <div class="detail-row"><span class="detail-row__label">Rate</span><span class="detail-row__value">${ui.formatMoney(room.rate)}/mo</span></div>
          <div class="detail-row"><span class="detail-row__label">Move-in</span><span class="detail-row__value">${currentUser.moveInDate ? ui.formatDate(currentUser.moveInDate) : '—'}</span></div>
          <div class="detail-row"><span class="detail-row__label">Lease ends</span><span class="detail-row__value">${currentUser.leaseEnd ? ui.formatDate(currentUser.leaseEnd) : '—'}</span></div>
          <div class="detail-row"><span class="detail-row__label">Roommate</span><span class="detail-row__value">${roommate ? ui.escapeHtml(roommate.name) : '—'}</span></div>
          <div class="detail-row"><span class="detail-row__label">House rules</span><span class="detail-row__value">Quiet hours 11pm-7am</span></div>
        </div>
      </div>

      <div class="card card-pad mt-6">
        <h3 class="mb-3">Amenities</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${(room.amenities || []).map(a => `<span class="badge badge-brand"><i class="fa-solid fa-check"></i> ${ui.escapeHtml(a)}</span>`).join('')}
        </div>
      </div>
    `;
  };
})();
