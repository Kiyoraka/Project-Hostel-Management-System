/* =====================================================================
   tenant.js — Tenant dashboard router + chrome
   ===================================================================== */

(function () {
  'use strict';

  let currentUser = null;

  function isMobile() { return window.innerWidth <= 900; }

  document.addEventListener('DOMContentLoaded', function () {
    currentUser = auth.requireRole(['tenant']);
    if (!currentUser) return;
    if (window.seed) seed.run();
    initSidebar();
    initTopbar();
    initLogout();
    initBottomNav();
    initUserMenu();
    initResponsiveReRender();
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
    const mobileItems = document.querySelectorAll('[data-mobile-route]');
    function syncActive() {
      const hash = window.location.hash.replace(/^#/, '') || '/';
      items.forEach(it => {
        const isActive = it.dataset.route === hash || (it.dataset.route === '/' && hash === '/');
        it.classList.toggle('is-active', isActive);
        if (isActive) it.setAttribute('aria-current', 'page');
        else it.removeAttribute('aria-current');
      });
      mobileItems.forEach(it => {
        it.classList.toggle('is-active', it.dataset.mobileRoute === hash);
      });
    }
    window.addEventListener('hashchange', syncActive);
    syncActive();
  }

  function initBottomNav() {
    document.querySelectorAll('[data-mobile-route]').forEach(link => {
      link.addEventListener('click', (e) => {
        const target = link.dataset.mobileRoute;
        const currentHash = window.location.hash.replace(/^#/, '') || '/';
        if (target === currentHash) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }

  function initUserMenu() {
    const trigger = document.querySelector('[data-user-menu]');
    const menu = document.querySelector('[data-user-dropdown]');
    if (!trigger || !menu) return;

    function open() {
      menu.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
    }
    function close() {
      menu.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.contains('is-open') ? close() : open();
    });
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !trigger.contains(e.target)) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) close();
    });
    menu.querySelectorAll('.topbar__user-menu-item').forEach(item => {
      item.addEventListener('click', () => close());
    });
  }

  function initResponsiveReRender() {
    let lastIsMobile = isMobile();
    let timer = null;
    window.addEventListener('resize', () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const nowIsMobile = isMobile();
        if (nowIsMobile !== lastIsMobile) {
          lastIsMobile = nowIsMobile;
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        }
      }, 150);
    });
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
    document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = currentUser.email || '');
  }

  function setPageTitle(title) {
    const el = document.querySelector('[data-page-title]');
    if (el) el.textContent = title;
  }

  function content() { return document.getElementById('app-content'); }

  window.tenant = { setPageTitle, getCurrentUser: () => currentUser, isMobile };
})();
