/* =====================================================================
   driver.js — Driver mobile router + chrome
   ===================================================================== */

(function () {
  'use strict';

  let currentUser = null;

  document.addEventListener('DOMContentLoaded', function () {
    currentUser = auth.requireRole(['driver']);
    if (!currentUser) return;
    if (window.seed) seed.run();
    initTabActiveState();

    ui.hashRouter({
      '/':         () => callSection('Today',     window.driverTodayInit),
      '/scan':     () => callSection('Scan QR',   window.driverScanInit),
      '/schedule': () => callSection('Schedule',  window.driverScheduleInit),
      '/settings': () => callSection('Driver',    window.driverSettingsInit)
    }, '/');
  });

  function callSection(title, fn) {
    if (window.driverScanInit && window.location.hash !== '#/scan' && window.driverScanCleanup) {
      window.driverScanCleanup();
    }
    setPageTitle(title);
    if (typeof fn === 'function') return fn({ content: content(), currentUser });
    content().innerHTML = '<div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><h3>Loading...</h3></div>';
  }

  function initTabActiveState() {
    const items = document.querySelectorAll('.d-tab');
    function sync() {
      const hash = window.location.hash.replace(/^#/, '') || '/';
      items.forEach(it => it.classList.toggle('is-active', it.dataset.route === hash));
    }
    window.addEventListener('hashchange', sync);
    sync();
  }

  function setPageTitle(title) {
    const el = document.querySelector('[data-page-title]');
    if (el) el.textContent = title;
  }

  function content() { return document.getElementById('app-content'); }

  window.driver = { setPageTitle, getCurrentUser: () => currentUser };
})();
