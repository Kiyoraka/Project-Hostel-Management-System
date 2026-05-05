/* =====================================================================
   tenant-room.js — Tenant My Room detail
   ===================================================================== */

(function () {
  'use strict';

  function isMobile() { return window.innerWidth <= 900; }

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

    if (isMobile()) {
      content.innerHTML = `
        <div class="m-greeting" style="padding: var(--space-2) var(--space-2) var(--space-3);">
          <div class="m-greeting__hello">Room ${ui.escapeHtml(room.id)}</div>
          <div class="m-greeting__date">Block ${ui.escapeHtml(room.block)} &middot; Floor ${room.floor} &middot; ${room.type === 'twin' ? 'Twin' : 'Single'}</div>
        </div>

        <div class="m-hero-card" style="text-align: center; padding: var(--space-6);">
          <div style="width: 72px; height: 72px; border-radius: 50%; background: var(--brand-tint); color: var(--brand-primary); display: inline-flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: var(--space-3);">
            <i class="fa-solid fa-bed" aria-hidden="true"></i>
          </div>
          <div class="m-hero-card__label">Monthly Rate</div>
          <div class="m-hero-card__value">${ui.formatMoney(room.rate)}</div>
          <div class="m-hero-card__summary" style="justify-content: center;">
            <span><i class="dot dot--occupied"></i> ${room.type === 'twin' ? 'Twin shared' : 'Single private'}</span>
          </div>
        </div>

        <div class="m-section-label">Room Details</div>
        <div class="m-list-card">
          <div class="m-list-card__row">
            <i class="fa-solid fa-building activity-feed__icon activity-feed__icon--pickup" aria-hidden="true"></i>
            <div class="m-list-card__main"><span class="m-list-card__title">Block ${ui.escapeHtml(room.block)} &middot; Floor ${room.floor}</span><span class="m-list-card__meta">Location</span></div>
          </div>
          <div class="m-list-card__row">
            <i class="fa-solid fa-bed activity-feed__icon activity-feed__icon--pickup" aria-hidden="true"></i>
            <div class="m-list-card__main"><span class="m-list-card__title">${room.type === 'twin' ? 'Twin' : 'Single'}</span><span class="m-list-card__meta">Type</span></div>
          </div>
          <div class="m-list-card__row">
            <i class="fa-solid fa-arrow-right-to-bracket activity-feed__icon activity-feed__icon--payment" aria-hidden="true"></i>
            <div class="m-list-card__main"><span class="m-list-card__title">${currentUser.moveInDate ? ui.formatDate(currentUser.moveInDate) : '—'}</span><span class="m-list-card__meta">Move-in date</span></div>
          </div>
          <div class="m-list-card__row">
            <i class="fa-solid fa-calendar-check activity-feed__icon activity-feed__icon--payment" aria-hidden="true"></i>
            <div class="m-list-card__main"><span class="m-list-card__title">${currentUser.leaseEnd ? ui.formatDate(currentUser.leaseEnd) : '—'}</span><span class="m-list-card__meta">Lease ends</span></div>
          </div>
          <div class="m-list-card__row">
            <i class="fa-solid fa-user-group activity-feed__icon activity-feed__icon--maintenance" aria-hidden="true"></i>
            <div class="m-list-card__main"><span class="m-list-card__title">${roommate ? ui.escapeHtml(roommate.name) : 'No roommate'}</span><span class="m-list-card__meta">Roommate</span></div>
          </div>
          <div class="m-list-card__row">
            <i class="fa-solid fa-moon activity-feed__icon activity-feed__icon--maintenance" aria-hidden="true"></i>
            <div class="m-list-card__main"><span class="m-list-card__title">11pm – 7am</span><span class="m-list-card__meta">Quiet hours</span></div>
          </div>
        </div>

        <div class="m-section-label">Amenities</div>
        <div class="card card-pad">
          <ul style="list-style: none; padding-left: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            ${(room.amenities || []).map(a => `
              <li style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink-700);">
                <i class="fa-solid fa-check" style="color: var(--success);" aria-hidden="true"></i>
                ${ui.escapeHtml(a)}
              </li>
            `).join('')}
          </ul>
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
