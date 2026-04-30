/* =====================================================================
   admin-rooms.js — Admin Rooms section
   ===================================================================== */

(function () {
  'use strict';

  let state = { block: 'all', view: 'grid' };

  function render(content) {
    const rooms = store.readAll('rooms');
    const filtered = state.block === 'all' ? rooms : rooms.filter(r => r.block === state.block);
    const occupied = rooms.filter(r => r.status === 'occupied').length;
    const vacant = rooms.filter(r => r.status === 'vacant').length;
    const maintenance = rooms.filter(r => r.status === 'maintenance').length;

    content.innerHTML = `
      <div class="section-header">
        <div>
          <div class="section-title">Hostel Rooms</div>
          <div class="section-subtitle">${rooms.length} total — ${occupied} occupied, ${vacant} vacant, ${maintenance} maintenance</div>
        </div>
        <button type="button" class="btn btn-primary" data-add-room>
          <i class="fa-solid fa-plus"></i> Add Room
        </button>
      </div>

      <div class="block-tabs">
        <button class="block-tabs__item ${state.block === 'all' ? 'is-active' : ''}" data-block="all">All</button>
        <button class="block-tabs__item ${state.block === 'A' ? 'is-active' : ''}" data-block="A">Block A</button>
        <button class="block-tabs__item ${state.block === 'B' ? 'is-active' : ''}" data-block="B">Block B</button>
        <button class="block-tabs__item ${state.block === 'C' ? 'is-active' : ''}" data-block="C">Block C</button>
      </div>

      <div class="room-grid">
        ${filtered.map(r => `
          <div class="room-card" data-room="${r.id}">
            <div class="room-card__id">${ui.escapeHtml(r.id)}</div>
            <div class="room-card__status" style="color: ${statusColor(r.status)};">
              <span class="status-dot status-dot--${r.status}"></span>${labelStatus(r.status)}
            </div>
            <div class="room-card__type">${r.type === 'twin' ? 'Twin' : 'Single'} · Floor ${r.floor}</div>
            <div class="room-card__rate">${ui.formatMoney(r.rate)}/mo</div>
          </div>
        `).join('')}
      </div>

      <div class="legend">
        <span><span class="status-dot status-dot--occupied"></span> Occupied</span>
        <span><span class="status-dot status-dot--vacant"></span> Vacant</span>
        <span><span class="status-dot status-dot--maintenance"></span> Maintenance</span>
      </div>
    `;

    content.querySelectorAll('[data-block]').forEach(b => {
      b.addEventListener('click', () => { state.block = b.dataset.block; render(content); });
    });
    content.querySelectorAll('[data-room]').forEach(r => {
      r.addEventListener('click', () => openRoomDrawer(r.dataset.room, content));
    });
    content.querySelector('[data-add-room]')?.addEventListener('click', () => openRoomModal(null, content));
  }

  function statusColor(s) {
    return { occupied: 'var(--brand-primary-dark)', vacant: 'var(--success)', maintenance: 'var(--warning)' }[s] || 'var(--ink-700)';
  }
  function labelStatus(s) {
    return { occupied: 'Occupied', vacant: 'Vacant', maintenance: 'Maintenance' }[s] || s;
  }

  function openRoomDrawer(id, content) {
    const r = store.findById('rooms', id);
    if (!r) return;
    let tenant = null;
    if (r.tenantId) {
      tenant = auth.listUsers().find(u => u.id === r.tenantId)
            || store.readAll('extra_tenants').find(u => u.id === r.tenantId);
    }
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="card-pad-sm" style="background: var(--brand-tint); border-radius: var(--radius-input); margin-bottom: 16px;">
        <div style="font-size: 13px; color: var(--brand-ink); font-weight: 600;">${ui.escapeHtml(r.id)} · Block ${ui.escapeHtml(r.block)} · Floor ${r.floor}</div>
      </div>
      <div class="detail-row"><span class="detail-row__label">Type</span><span class="detail-row__value">${r.type === 'twin' ? 'Twin' : 'Single'}</span></div>
      <div class="detail-row"><span class="detail-row__label">Rate</span><span class="detail-row__value">${ui.formatMoney(r.rate)}/mo</span></div>
      <div class="detail-row"><span class="detail-row__label">Status</span><span class="detail-row__value">${labelStatus(r.status)}</span></div>
      ${tenant ? `
        <div class="detail-row"><span class="detail-row__label">Tenant</span><span class="detail-row__value">${ui.escapeHtml(tenant.name)}</span></div>
        ${tenant.studentId ? `<div class="detail-row"><span class="detail-row__label">Student ID</span><span class="detail-row__value">${ui.escapeHtml(tenant.studentId)}</span></div>` : ''}
        ${tenant.moveInDate ? `<div class="detail-row"><span class="detail-row__label">Move-in</span><span class="detail-row__value">${ui.formatDate(tenant.moveInDate)}</span></div>` : ''}
        ${tenant.leaseEnd ? `<div class="detail-row"><span class="detail-row__label">Lease ends</span><span class="detail-row__value">${ui.formatDate(tenant.leaseEnd)}</span></div>` : ''}
      ` : '<div class="detail-row"><span class="detail-row__label">Tenant</span><span class="detail-row__value">—</span></div>'}
      <div class="detail-row" style="border:0;"><span class="detail-row__label">Amenities</span></div>
      <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
        ${(r.amenities || []).map(a => `<span class="badge badge-neutral">${ui.escapeHtml(a)}</span>`).join('')}
      </div>
    `;
    const footer = document.createElement('div');
    footer.style.display = 'flex'; footer.style.gap = '12px';
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-secondary';
    editBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Edit';
    editBtn.addEventListener('click', () => { ui.closeDrawer(); openRoomModal(r, content); });
    const maintBtn = document.createElement('button');
    maintBtn.className = 'btn ' + (r.status === 'maintenance' ? 'btn-secondary' : 'btn-primary');
    maintBtn.innerHTML = r.status === 'maintenance' ? '<i class="fa-solid fa-check"></i> Mark Vacant' : '<i class="fa-solid fa-screwdriver-wrench"></i> Mark Maintenance';
    maintBtn.addEventListener('click', () => {
      const newStatus = r.status === 'maintenance' ? 'vacant' : 'maintenance';
      store.update('rooms', r.id, { status: newStatus });
      ui.toast('Room status updated.', 'success');
      ui.closeDrawer();
      render(content);
    });
    footer.appendChild(editBtn);
    footer.appendChild(maintBtn);
    ui.openDrawer({ title: 'Room ' + r.id, body, footer });
  }

  function openRoomModal(existing, content) {
    const isEdit = !!existing;
    const body = document.createElement('div');
    body.innerHTML = `
      <form class="room-form">
        <div class="grid grid-cols-2 gap-3">
          <div class="field">
            <label class="field-label" for="rf-id">Room ID</label>
            <input class="input" id="rf-id" name="id" required value="${ui.escapeHtml(existing?.id || '')}" placeholder="R-204" ${isEdit ? 'readonly' : ''}>
          </div>
          <div class="field">
            <label class="field-label" for="rf-block">Block</label>
            <select class="select" id="rf-block" name="block" required>
              <option value="A" ${existing?.block === 'A' ? 'selected' : ''}>Block A</option>
              <option value="B" ${existing?.block === 'B' ? 'selected' : ''}>Block B</option>
              <option value="C" ${existing?.block === 'C' ? 'selected' : ''}>Block C</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label" for="rf-floor">Floor</label>
            <input class="input" id="rf-floor" name="floor" type="number" min="1" max="10" required value="${existing?.floor || 1}">
          </div>
          <div class="field">
            <label class="field-label" for="rf-type">Type</label>
            <select class="select" id="rf-type" name="type" required>
              <option value="single" ${existing?.type === 'single' ? 'selected' : ''}>Single</option>
              <option value="twin" ${existing?.type === 'twin' ? 'selected' : ''}>Twin</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label" for="rf-rate">Rate (RM/mo)</label>
            <input class="input" id="rf-rate" name="rate" type="number" min="0" required value="${existing?.rate || 450}">
          </div>
          <div class="field">
            <label class="field-label" for="rf-status">Status</label>
            <select class="select" id="rf-status" name="status">
              <option value="vacant" ${existing?.status === 'vacant' ? 'selected' : ''}>Vacant</option>
              <option value="occupied" ${existing?.status === 'occupied' ? 'selected' : ''}>Occupied</option>
              <option value="maintenance" ${existing?.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
            </select>
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
    save.textContent = isEdit ? 'Save changes' : 'Create room';
    save.addEventListener('click', () => {
      const form = body.querySelector('.room-form');
      const data = Object.fromEntries(new FormData(form).entries());
      data.floor = parseInt(data.floor, 10);
      data.rate = parseInt(data.rate, 10);
      data.amenities = existing?.amenities || ['Air Conditioning', 'WiFi', 'Study Desk', 'Wardrobe'];
      data.tenantId = existing?.tenantId || null;
      if (isEdit) {
        store.update('rooms', existing.id, data);
        ui.toast('Room updated.', 'success');
      } else {
        store.insert('rooms', data);
        ui.toast('Room created.', 'success');
      }
      ui.closeModal();
      render(content);
    });
    footer.appendChild(cancel); footer.appendChild(save);
    ui.openModal({ title: isEdit ? 'Edit room' : 'Add room', body, footer });
  }

  window.adminRoomsInit = function ({ content }) {
    render(content);
  };
})();
