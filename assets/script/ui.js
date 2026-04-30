/* =====================================================================
   ui.js — Shared UI utilities: toast, modal, drawer, formatters, hash router
   ===================================================================== */

(function () {
  'use strict';

  /* ---- Toast ---- */
  function toast(message, variant = 'default', durationMs = 3000) {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    const el = document.createElement('div');
    el.className = 'toast' + (variant !== 'default' ? ' toast-' + variant : '');
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity 200ms ease, transform 200ms ease';
      el.style.opacity = '0';
      el.style.transform = 'translateX(20px)';
      setTimeout(() => el.remove(), 220);
    }, durationMs);
  }

  /* ---- Modal ---- */
  function openModal({ title, body, footer, size = 'md', onClose } = {}) {
    closeModal();
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.dataset.modalRoot = '1';

    const modal = document.createElement('div');
    modal.className = 'modal' + (size === 'lg' ? ' modal-lg' : '');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const header = document.createElement('div');
    header.className = 'modal-header';
    const titleEl = document.createElement('div');
    titleEl.className = 'modal-title';
    titleEl.textContent = title || '';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'modal-close';
    closeBtn.setAttribute('aria-label', 'Close dialog');
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    closeBtn.addEventListener('click', () => closeModal());
    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    const bodyEl = document.createElement('div');
    bodyEl.className = 'modal-body';
    if (typeof body === 'string') bodyEl.innerHTML = body;
    else if (body instanceof Node) bodyEl.appendChild(body);

    modal.appendChild(header);
    modal.appendChild(bodyEl);

    if (footer) {
      const footerEl = document.createElement('div');
      footerEl.className = 'modal-footer';
      if (typeof footer === 'string') footerEl.innerHTML = footer;
      else if (footer instanceof Node) footerEl.appendChild(footer);
      modal.appendChild(footerEl);
    }

    backdrop.appendChild(modal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    const escListener = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', escListener);
    backdrop._escListener = escListener;
    backdrop._onClose = onClose;

    setTimeout(() => {
      const focusable = modal.querySelector('input, select, textarea, button:not(.modal-close)');
      if (focusable) focusable.focus();
    }, 50);

    return { backdrop, modal, body: bodyEl };
  }

  function closeModal() {
    const backdrop = document.querySelector('.modal-backdrop[data-modal-root="1"]');
    if (!backdrop) return;
    if (backdrop._escListener) {
      document.removeEventListener('keydown', backdrop._escListener);
    }
    if (typeof backdrop._onClose === 'function') backdrop._onClose();
    backdrop.remove();
    document.body.style.overflow = '';
  }

  /* ---- Drawer ---- */
  function openDrawer({ title, body, footer, onClose } = {}) {
    closeDrawer();
    const backdrop = document.createElement('div');
    backdrop.className = 'drawer-backdrop';
    backdrop.dataset.drawerRoot = '1';

    const drawer = document.createElement('aside');
    drawer.className = 'drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');

    const header = document.createElement('div');
    header.className = 'drawer-header';
    const titleEl = document.createElement('div');
    titleEl.className = 'modal-title';
    titleEl.textContent = title || '';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'modal-close';
    closeBtn.setAttribute('aria-label', 'Close drawer');
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    closeBtn.addEventListener('click', () => closeDrawer());
    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    const bodyEl = document.createElement('div');
    bodyEl.className = 'drawer-body';
    if (typeof body === 'string') bodyEl.innerHTML = body;
    else if (body instanceof Node) bodyEl.appendChild(body);

    drawer.appendChild(header);
    drawer.appendChild(bodyEl);

    if (footer) {
      const footerEl = document.createElement('div');
      footerEl.className = 'drawer-footer';
      if (typeof footer === 'string') footerEl.innerHTML = footer;
      else if (footer instanceof Node) footerEl.appendChild(footer);
      drawer.appendChild(footerEl);
    }

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
    document.body.style.overflow = 'hidden';

    backdrop.addEventListener('click', () => closeDrawer());

    const escListener = (e) => { if (e.key === 'Escape') closeDrawer(); };
    document.addEventListener('keydown', escListener);
    backdrop._escListener = escListener;
    backdrop._onClose = onClose;

    return { backdrop, drawer, body: bodyEl };
  }

  function closeDrawer() {
    const backdrop = document.querySelector('.drawer-backdrop[data-drawer-root="1"]');
    const drawer = document.querySelector('.drawer');
    if (backdrop) {
      if (backdrop._escListener) document.removeEventListener('keydown', backdrop._escListener);
      if (typeof backdrop._onClose === 'function') backdrop._onClose();
      backdrop.remove();
    }
    if (drawer) drawer.remove();
    document.body.style.overflow = '';
  }

  /* ---- Formatters ---- */
  function formatDate(input, fmt = 'medium') {
    if (!input) return '';
    const d = (input instanceof Date) ? input : new Date(input);
    if (isNaN(d.getTime())) return '';
    if (fmt === 'short') {
      return d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short' });
    }
    if (fmt === 'long') {
      return d.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (fmt === 'time') {
      return d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatRelative(input) {
    const d = (input instanceof Date) ? input : new Date(input);
    if (isNaN(d.getTime())) return '';
    const diffMs = Date.now() - d.getTime();
    const sec = Math.floor(diffMs / 1000);
    const min = Math.floor(sec / 60);
    const hour = Math.floor(min / 60);
    const day = Math.floor(hour / 24);
    if (sec < 60) return 'just now';
    if (min < 60) return min + 'm ago';
    if (hour < 24) return hour + 'h ago';
    if (day < 7) return day + 'd ago';
    return formatDate(d);
  }

  function formatMoney(amount, currency = 'RM') {
    if (typeof amount !== 'number') amount = parseFloat(amount) || 0;
    return currency + ' ' + amount.toFixed(2);
  }

  function formatPeriod(period) {
    if (!period) return '';
    const [y, m] = period.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[parseInt(m, 10) - 1] + ' ' + y;
  }

  /* ---- Hash router ---- */
  function hashRouter(routes, defaultRoute = '/') {
    function dispatch() {
      const hash = window.location.hash.replace(/^#/, '') || defaultRoute;
      const path = hash.startsWith('/') ? hash : '/' + hash;
      const route = path.split('?')[0];
      const handler = routes[route] || routes[defaultRoute];
      if (typeof handler === 'function') {
        try { handler(path); } catch (e) { console.error('[router]', route, e); }
      }
    }
    window.addEventListener('hashchange', dispatch);
    document.addEventListener('DOMContentLoaded', dispatch);
    if (document.readyState !== 'loading') dispatch();
    return { go: (path) => { window.location.hash = path; }, dispatch };
  }

  /* ---- Hash helpers ---- */
  async function quickHash(input) {
    const buf = new TextEncoder().encode(String(input));
    if (window.crypto && window.crypto.subtle) {
      const hashBuf = await window.crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let hash = 5381;
    for (let i = 0; i < input.length; i++) hash = ((hash << 5) + hash) + input.charCodeAt(i);
    return ('00000000' + (hash >>> 0).toString(16)).slice(-8);
  }

  /* ---- DOM helpers ---- */
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') {
        node.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (v === true) node.setAttribute(k, '');
      else if (v !== false && v != null) node.setAttribute(k, v);
    }
    children.flat().forEach(c => {
      if (c == null) return;
      if (c instanceof Node) node.appendChild(c);
      else node.appendChild(document.createTextNode(String(c)));
    });
    return node;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  /* ---- Confirm dialog (promise-based) ---- */
  function confirmDialog({ title = 'Confirm', message = 'Are you sure?', confirmText = 'Confirm', cancelText = 'Cancel', danger = false } = {}) {
    return new Promise((resolve) => {
      const footer = document.createElement('div');
      footer.style.display = 'flex';
      footer.style.gap = '12px';
      const cancel = document.createElement('button');
      cancel.className = 'btn btn-secondary';
      cancel.textContent = cancelText;
      cancel.addEventListener('click', () => { closeModal(); resolve(false); });
      const confirm = document.createElement('button');
      confirm.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');
      confirm.textContent = confirmText;
      confirm.addEventListener('click', () => { closeModal(); resolve(true); });
      footer.appendChild(cancel);
      footer.appendChild(confirm);
      openModal({ title, body: '<p>' + escapeHtml(message) + '</p>', footer, onClose: () => resolve(false) });
    });
  }

  window.ui = {
    toast,
    openModal,
    closeModal,
    openDrawer,
    closeDrawer,
    formatDate,
    formatRelative,
    formatMoney,
    formatPeriod,
    hashRouter,
    quickHash,
    el,
    escapeHtml,
    confirmDialog
  };
})();
