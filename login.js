// ============================================================================
// ORBIT-X — Login page behaviour
// Password visibility toggle, client-side validation feedback, and the
// Google sign-in placeholder. (This file was referenced by login.html but
// missing from the repo, which produced a 404 on every visit.)
// ============================================================================

(function () {
  'use strict';

  var form = document.getElementById('login-form');
  if (!form) return;

  var emailInput = document.getElementById('email');
  var passwordInput = document.getElementById('password');
  var togglePassword = document.querySelector('.toggle-password');
  var formMessage = document.getElementById('form-message');
  var googleButton = document.getElementById('google-button');

  function showMessage(text) {
    if (!formMessage) return;
    formMessage.textContent = text;
    formMessage.classList.add('visible');
  }

  function clearMessage() {
    if (!formMessage) return;
    formMessage.textContent = '';
    formMessage.classList.remove('visible');
  }

  // --- Password visibility toggle ------------------------------------------
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function () {
      var pressed = togglePassword.getAttribute('aria-pressed') === 'true';
      var show = !pressed;
      passwordInput.type = show ? 'text' : 'password';
      togglePassword.setAttribute('aria-pressed', String(show));
      togglePassword.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      if (window.audioManager && window.audioManager.canPlay()) {
        window.audioManager.play('ui', 'button-click', { volume: 0.4 });
      }
    });
  }

  // --- Form validation (demo only: no backend is wired up yet) --------------
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearMessage();

    var email = (emailInput && emailInput.value || '').trim();
    var password = passwordInput && passwordInput.value || '';

    if (!email || !password) {
      showMessage('Please fill in both your email and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage('That email address doesn\u2019t look quite right.');
      return;
    }
    showMessage('Thanks! Account sign-in is coming soon \u2014 your magical adventure is on its way.');
    if (window.audioManager && window.audioManager.canPlay()) {
      window.audioManager.play('ui', 'modal-open', { volume: 0.4 });
    }
  });

  // Keep the message area tidy as soon as the user edits a field again.
  [emailInput, passwordInput].forEach(function (el) {
    if (el) el.addEventListener('input', clearMessage);
  });

  // --- Google sign-in placeholder ------------------------------------------
  if (googleButton) {
    googleButton.addEventListener('click', function () {
      showMessage('Google sign-in is not connected yet \u2014 check back soon!');
      if (window.audioManager && window.audioManager.canPlay()) {
        window.audioManager.play('ui', 'button-click', { volume: 0.4 });
      }
    });
  }
})();
