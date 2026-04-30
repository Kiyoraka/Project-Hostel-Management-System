/* =====================================================================
   tenant.js — Tenant dashboard router + chrome
   ===================================================================== */

(function () {
  'use strict';

  let currentUser = null;

  document.addEventListener('DOMContentLoaded', function () {
    currentUser = auth.requireRole(['tenant']);
    if (!currentUser) return;
    if (window.seed) seed.run();
    initSidebar();
    initTopbar();
    initLogout();
    paintUserChrome();

    ui.hashRouter({
      '/':            (path) => callSection('Home', window.tenantHomeInit),
      '/room':        (path) => callSection('My Room', window.tenantRoomInit),
      '/schedule':    (path) => callSection('Class Schedule', window.tenantScheduleInit),
      '/maintenance': (path) => callSection('Maintenance', window.tenantMaintenanceInit),
      '/payments':    (path) => callSection('Payments', window.tenantPaymentsInit),
      '/settings':    (path) => callSection('Settings', window.tenantSettingsInit)
    }, '/');
  });

  function callSection(title, fn) {
    setPageTitle(title);
    if (typeof fn === 'function') return fn({ content: content(), currentUser });
    content().innerHTML = '<div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><h3>Loading...</h3></div>';
  }

  function initSidebar() {
    const items = document.querySelectorAll('[data-route]');
    function syncActive() {
      const hash = window.location.hash.replace(/^#/, '') || '/';
      const base = '/' + hash.split('/')[1];
      items.forEach(it => {
        const isActive = it.dataset.route === hash || (it.dataset.route === '/' && hash === '/');
        it.classList.toggle('is-active', isActive);
      });
    }
    window.addEventListener('hashchange', syncActive);
    syncActive();
  }

  function initTopbar() {
    document.querySelector('[data-sidebar-toggle]')?.addEventListener('click', () => {
      document.body.classList.toggle('is-collapsed');
    });
  }

  function initLogout() {
    document.querySelectorAll('[data-logout]').forEach(btn => btn.addEventListener('click', () => auth.logout()));
  }

  function paintUserChrome() {
    const initials = (currentUser.name || '').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
    document.querySelectorAll('[data-user-avatar]').forEach(el => el.textContent = initials);
    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = currentUser.name);
  }

  function setPageTitle(title) {
    const el = document.querySelector('[data-page-title]');
    if (el) el.textContent = title;
  }

  function content() { return document.getElementById('app-content'); }

  window.tenant = { setPageTitle, getCurrentUser: () => currentUser };
})();
