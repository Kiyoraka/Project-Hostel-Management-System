/* =====================================================================
   admin-users.js — Admin Users section
   Attaches window.adminUsersInit
   ===================================================================== */

(function () {
  'use strict';

  let state = {
    page: 1,
    perPage: 10,
    search: '',
    roleFilter: 'all',
    statusFilter: 'all'
  };

  function getAllUsers() {
    const base = auth.listUsers();
    const extras = store.readAll('extra_tenants');
    const merged = [...base];
    extras.forEach(e => {
      if (!merged.find(u => u.id === e.id)) merged.push({ ...e, status: e.status || 'active' });
    });
    return merged.map(u => ({
      ...u,
      status: u.status || 'active'
    }));
  }

  function applyFilters(users) {
    let rows = [...users];
    if (state.search) {
      const q = state.search.toLowerCase();
      rows = rows.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.id || '').toLowerCase().includes(q)
      );
    }
    if (state.roleFilter !== 'all') {
      rows = rows.filter(u => u.role === state.roleFilter);
    }
    if (state.statusFilter !== 'all') {
      rows = rows.filter(u => u.status === state.statusFilter);
    }
    return rows;
  }

  function render(content) {
    const all = getAllUsers();
    const filtered = applyFilters(all);
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / state.perPage));
    if (state.page > totalPages) state.page = totalPages;
    const start = (state.page - 1) * state.perPage;
    const pageRows = filtered.slice(start, start + state.perPage);

    content.innerHTML = `
      <div class="section-header">
        <div>
          <div class="section-title">Users</div>
          <div class="section-subtitle">${total} ${total === 1 ? 'person' : 'people'}</div>
        </div>
        <button type="button" class="btn btn-primary" data-add-user>
          <i class="fa-solid fa-plus"></i> Add User
        </button>
      </div>

      <div class="filter-bar">
        <input type="search" class="input" placeholder="Search by name, email, or ID" data-search value="${ui.escapeHtml(state.search)}">
        <select class="select" data-role-filter>
          <option value="all">Role: All</option>
          <option value="tenant" ${state.roleFilter === 'tenant' ? 'selected' : ''}>Tenant</option>
          <option value="driver" ${state.roleFilter === 'driver' ? 'selected' : ''}>Driver</option>
          <option value="admin" ${state.roleFilter === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
        <select class="select" data-status-filter>
          <option value="all">Status: All</option>
          <option value="active" ${state.statusFilter === 'active' ? 'selected' : ''}>Active</option>
          <option value="inactive" ${state.statusFilter === 'inactive' ? 'selected' : ''}>Inactive</option>
        </select>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${pageRows.length === 0
              ? '<tr><td colspan="6" style="text-align:center; padding: 32px; color: var(--ink-500);">No users match these filters</td></tr>'
              : pageRows.map(u => `
                <tr>
                  <td><code>${ui.escapeHtml(u.id)}</code></td>
                  <td>${ui.escapeHtml(u.name)}</td>
                  <td><span class="text-mute">${ui.escapeHtml(u.email)}</span></td>
                  <td><span class="badge badge-${u.role === 'admin' ? 'brand' : u.role === 'driver' ? 'warning' : 'info'}">${u.role}</span></td>
                  <td><span class="status-dot status-dot--${u.status}"></span>${u.status === 'active' ? 'Active' : 'Inactive'}</td>
                  <td style="text-align: right;">
                    <button class="btn btn-ghost btn-sm" data-edit="${u.id}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-ghost btn-sm" data-delete="${u.id}"><i class="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              `).join('')}
          </tbody>
        </table>
        <div class="pagination">
          <div>Showing ${total === 0 ? 0 : start + 1}-${Math.min(start + state.perPage, total)} of ${total}</div>
          <div class="pagination__pages">
            <button data-page-prev ${state.page === 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>
            ${Array.from({ length: totalPages }, (_, i) => `
              <button data-page="${i + 1}" class="${state.page === i + 1 ? 'is-active' : ''}">${i + 1}</button>
            `).join('')}
            <button data-page-next ${state.page === totalPages ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>
          </div>
        </div>
      </div>
    `;

    bindEvents(content);
  }

  function bindEvents(content) {
    const search = content.querySelector('[data-search]');
    const role = content.querySelector('[data-role-filter]');
    const status = content.querySelector('[data-status-filter]');
    let searchTimer;
    search.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.search = e.target.value;
        state.page = 1;
        render(content);
      }, 200);
    });
    role.addEventListener('change', (e) => { state.roleFilter = e.target.value; state.page = 1; render(content); });
    status.addEventListener('change', (e) => { state.statusFilter = e.target.value; state.page = 1; render(content); });

    content.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => { state.page = parseInt(btn.dataset.page, 10); render(content); });
    });
    const prev = content.querySelector('[data-page-prev]');
    const next = content.querySelector('[data-page-next]');
    if (prev) prev.addEventListener('click', () => { if (state.page > 1) { state.page--; render(content); } });
    if (next) next.addEventListener('click', () => { state.page++; render(content); });

    content.querySelector('[data-add-user]')?.addEventListener('click', () => openUserModal(null, content));
    content.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = getAllUsers().find(x => x.id === btn.dataset.edit);
        if (u) openUserModal(u, content);
      });
    });
    content.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.delete;
        const u = getAllUsers().find(x => x.id === id);
        if (!u) return;
        const ok = await ui.confirmDialog({
          title: 'Delete user',
          message: 'Delete ' + u.name + '? This action cannot be undone.',
          confirmText: 'Delete',
          danger: true
        });
        if (!ok) return;
        const extras = store.readAll('extra_tenants').filter(e => e.id !== id);
        store.writeAll('extra_tenants', extras);
        ui.toast('User deleted.', 'success');
        render(content);
      });
    });
  }

  function openUserModal(existing, content) {
    const isEdit = !!existing;
    const body = document.createElement('div');
    body.innerHTML = `
      <form class="user-form">
        <div class="field">
          <label class="field-label">Role</label>
          <div class="flex gap-3">
            <label><input type="radio" name="role" value="tenant" ${(!existing || existing.role === 'tenant') ? 'checked' : ''}> Tenant</label>
            <label><input type="radio" name="role" value="driver" ${existing?.role === 'driver' ? 'checked' : ''}> Driver</label>
          </div>
        </div>
        <div class="field">
          <label class="field-label" for="uf-name">Full name</label>
          <input class="input" id="uf-name" name="name" required value="${ui.escapeHtml(existing?.name || '')}">
        </div>
        <div class="field">
          <label class="field-label" for="uf-email">Email</label>
          <input class="input" id="uf-email" name="email" type="email" required value="${ui.escapeHtml(existing?.email || '')}">
        </div>
        ${isEdit ? '' : `
          <div class="field">
            <label class="field-label" for="uf-pwd">Password</label>
            <input class="input" id="uf-pwd" name="password" type="password" minlength="6" required>
          </div>
        `}
        <div class="field" data-tenant-only ${existing?.role === 'driver' ? 'hidden' : ''}>
          <label class="field-label" for="uf-room">Room</label>
          <input class="input" id="uf-room" name="roomId" value="${ui.escapeHtml(existing?.roomId || '')}" placeholder="R-204">
        </div>
        <div class="field" data-tenant-only ${existing?.role === 'driver' ? 'hidden' : ''}>
          <label class="field-label" for="uf-stuid">Student ID</label>
          <input class="input" id="uf-stuid" name="studentId" value="${ui.escapeHtml(existing?.studentId || '')}" placeholder="STU-2026-0001">
        </div>
        <div class="field" data-driver-only ${existing?.role !== 'driver' ? 'hidden' : ''}>
          <label class="field-label" for="uf-plate">Vehicle plate</label>
          <input class="input" id="uf-plate" name="vehiclePlate" value="${ui.escapeHtml(existing?.vehiclePlate || '')}" placeholder="WMK 1234">
        </div>
      </form>
    `;
    const footer = document.createElement('div');
    footer.style.display = 'flex'; footer.style.gap = '12px';
    const cancel = document.createElement('button');
    cancel.className = 'btn btn-secondary';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', () => ui.closeModal());
    const submit = document.createElement('button');
    submit.className = 'btn btn-primary';
    submit.textContent = isEdit ? 'Save changes' : 'Create user';
    footer.appendChild(cancel);
    footer.appendChild(submit);

    const opened = ui.openModal({
      title: isEdit ? 'Edit user' : 'Add new user',
      body,
      footer
    });

    opened.body.querySelectorAll('input[name="role"]').forEach(r => {
      r.addEventListener('change', (e) => {
        const isTenant = e.target.value === 'tenant';
        opened.body.querySelectorAll('[data-tenant-only]').forEach(el => el.hidden = !isTenant);
        opened.body.querySelectorAll('[data-driver-only]').forEach(el => el.hidden = isTenant);
      });
    });

    submit.addEventListener('click', () => {
      const form = opened.body.querySelector('.user-form');
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.name || !data.email || !data.role) {
        ui.toast('Please fill in name, email, and role.', 'warning');
        return;
      }
      if (isEdit) {
        const existing2 = store.readAll('extra_tenants').find(e => e.id === existing.id);
        if (existing2) {
          store.update('extra_tenants', existing.id, { ...data, status: existing.status });
        }
        ui.toast('User updated.', 'success');
      } else {
        const newUser = {
          id: store.generateId('users'),
          ...data,
          status: 'active'
        };
        store.insert('extra_tenants', newUser);
        ui.toast('User created.', 'success');
      }
      ui.closeModal();
      render(content);
    });
  }

  window.adminUsersInit = function ({ content }) {
    render(content);
  };
})();
