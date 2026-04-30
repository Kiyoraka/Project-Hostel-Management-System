/* =====================================================================
   landing.js — Landing page interactivity + login modal
   ===================================================================== */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    redirectIfLoggedIn();
    initOpenLoginButtons();
  });

  function redirectIfLoggedIn() {
    if (!window.auth) return;
    const session = auth.getSession();
    if (session) {
      window.location.href = auth.dashboardPath(session.role);
    }
  }

  function initOpenLoginButtons() {
    document.querySelectorAll('[data-open-login]').forEach(btn => {
      btn.addEventListener('click', openLoginModal);
    });
  }

  function openLoginModal() {
    const body = document.createElement('div');
    body.innerHTML = `
      <form class="login-form" novalidate>
        <div class="login-form__error" role="alert"></div>

        <div class="field">
          <label class="field-label" for="login-email">Email</label>
          <input class="input" id="login-email" name="email" type="email" autocomplete="email"
                 placeholder="you@example.com" required>
        </div>

        <div class="field">
          <label class="field-label" for="login-password">Password</label>
          <input class="input" id="login-password" name="password" type="password"
                 autocomplete="current-password" placeholder="Your password" required>
        </div>

        <button type="submit" class="btn btn-primary btn-block btn-lg">
          Sign In <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </button>

        <div class="login-demo">
          <h4>Demo logins (click to auto-fill)</h4>
          <div class="login-demo__list">
            <button type="button" data-demo="admin@gmail.com|admin123">admin@gmail.com / admin123</button>
            <button type="button" data-demo="student1@gmail.com|student123">student1@gmail.com / student123</button>
            <button type="button" data-demo="driver@gmail.com|driver123">driver@gmail.com / driver123</button>
          </div>
        </div>
      </form>
    `;

    const opened = ui.openModal({
      title: 'Sign in to Hostel',
      body
    });

    const form = opened.body.querySelector('.login-form');
    const errorEl = form.querySelector('.login-form__error');
    const emailInput = form.querySelector('#login-email');
    const passwordInput = form.querySelector('#login-password');

    form.querySelectorAll('[data-demo]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [email, password] = btn.dataset.demo.split('|');
        emailInput.value = email;
        passwordInput.value = password;
        emailInput.focus();
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      hideError();

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        showError('Please enter both email and password.');
        return;
      }

      const result = auth.login(email, password);
      if (!result.ok) {
        showError(result.error || 'Login failed.');
        return;
      }

      ui.toast('Welcome back, ' + result.user.name + '!', 'success', 1400);
      setTimeout(() => {
        window.location.href = auth.dashboardPath(result.user.role);
      }, 600);
    });

    function showError(msg) {
      errorEl.textContent = msg;
      errorEl.classList.add('is-visible');
    }
    function hideError() {
      errorEl.classList.remove('is-visible');
    }
  }
})();
