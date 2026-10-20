// ============================================================================
// ORBIT-X Theme Manager
// Light ON / Light OFF toggle. ALWAYS starts in Light Mode on every page
// load — the toggle is session-only and never persists across loads.
// ============================================================================

const THEME_KEY = 'orbitx-theme';
const THEME_ATTR = 'data-theme';
const THEME_VALUES = { light: 'light', dark: 'dark' };

// Clean inline SVG icons (no emoji). The control shows the CURRENT mode:
// a sun in light mode, a crescent moon in dark mode. currentColor keeps the
// icon in sync with the button's text colour in both themes.
const THEME_SVG_SUN =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" focusable="false" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none"/>' +
  '<path d="M12 2.6v2.4M12 19v2.4M2.6 12H5M19 12h2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M18.8 5.2l-1.7 1.7M6.9 17.1l-1.7 1.7"/>' +
  '</svg>';
const THEME_SVG_MOON =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" focusable="false" ' +
  'aria-hidden="true"><path d="M20.4 14.6A8.6 8.6 0 019.4 3.6a8.9 8.9 0 1011 11z"/></svg>';

class ThemeManager {
  constructor() {
    this.currentTheme = THEME_VALUES.light;
    // All bound toggle buttons (navbar copy + drawer copy + floating copies).
    this.toggleButtons = [];
    this.isInitialized = false;
    this._transitioning = false;
    this._revealOverlay = null;
    this._revealGen = 0;
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // FRESH LOAD = LIGHT MODE, always. Wipe any stale saved preference or
    // OS-driven state first so nothing can override the light default.
    this._clearSavedTheme();
    this.applyTheme(THEME_VALUES.light, false);
  }

  _clearSavedTheme() {
    // Remove the obsolete persisted preference (localStorage + sessionStorage)
    // so a previous Dark Mode choice can never leak into a fresh page load.
    // NOTE: no cookie was ever used for theme; nothing to clear there.
    try {
      localStorage.removeItem(THEME_KEY);
    } catch (e) { /* ignore */ }
    try {
      sessionStorage.removeItem(THEME_KEY);
    } catch (e) { /* ignore */ }
    try {
      document.documentElement.removeAttribute(THEME_ATTR);
    } catch (e) { /* ignore */ }
    // NOTE: system prefers-color-scheme is intentionally IGNORED — the
    // requirement is Light Mode on every fresh load, no exceptions.
  }

  _saveTheme() {
    // Session-only by design: never persist the theme. Kept as a no-op hook
    // so applyTheme(theme, persist) keeps its signature.
  }

  applyTheme(theme, persist = true) {
    if (!Object.values(THEME_VALUES).includes(theme)) return;
    if (theme === this.currentTheme) {
      this._paintTheme(theme, persist);
      return;
    }
    const from = this.currentTheme;
    if (!this._animateThemeCircle(from, theme, persist)) {
      this._paintTheme(theme, persist);
    }
  }

  // Instant theme paint: attribute + meta + UI + event. Single place the DOM
  // theme state changes, so animation and fallback paths never disagree.
  _paintTheme(theme, persist) {
    this.currentTheme = theme;
    if (persist) this._saveTheme(theme);

    const html = document.documentElement;
    if (theme === THEME_VALUES.dark) {
      html.setAttribute(THEME_ATTR, THEME_VALUES.dark);
    } else {
      html.removeAttribute(THEME_ATTR);
    }

    // Keep the browser UI (mobile address bar) in sync with the theme.
    try {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', theme === THEME_VALUES.dark ? '#191624' : '#fffaf5');
      }
    } catch (e) { /* ignore */ }

    this._updateToggleUI();
    this._dispatchThemeEvent();
  }

  _toggleCenter() {
    try {
      // Use the first VISIBLE bound button (navbar copy is hidden on mobile,
      // the drawer copy is the visible one there).
      const el = this.toggleButtons.find((btn) => btn && btn.isConnected &&
        btn.offsetParent !== null) || this.toggleButtons[0] ||
        document.querySelector('.theme-toggle');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    } catch (e) { return null; }
  }

  _maxRevealRadius(x, y) {
    const w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    return Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
  }

  // ---- Premium circular theme reveal ---------------------------------
  // A fixed overlay painted in the INCOMING theme colour expands as a
  // circle from the toggle button; when it finishes, the real theme is
  // applied and the overlay is removed. Returns true when the animation
  // took over the paint, false when the caller should paint instantly.
  _animateThemeCircle(from, theme, persist) {
    // A reveal is already running (rapid double click): land it now so a
    // stale overlay can never be left behind.
    if (this._transitioning) {
      this._finishReveal();
      return false;
    }
    // Reduced motion: switch themes directly, no sweeping circle.
    if (this._prefersReducedMotion()) return false;

    const center = this._toggleCenter();
    if (!center) return false;

    const radius = this._maxRevealRadius(center.x, center.y);
    const isDark = theme === THEME_VALUES.dark;
    const x = center.x;
    const y = center.y;

    const overlay = document.createElement('div');
    overlay.className = 'theme-reveal';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.background = isDark
      ? 'radial-gradient(circle at ' + x + 'px ' + y + 'px, #2a2340 0%, #191624 72%)'
      : 'radial-gradient(circle at ' + x + 'px ' + y + 'px, #fffaf5 0%, #f4eefc 72%)';
    document.body.appendChild(overlay);

    this._transitioning = true;
    this._revealOverlay = overlay;

    const anim = overlay.animate(
      [
        { clipPath: 'circle(0px at ' + x + 'px ' + y + 'px)' },
        { clipPath: 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)' }
      ],
      {
        duration: this._revealDuration(),
        easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
        fill: 'forwards'
      }
    );

    const gen = this._revealGen; // generation counter (increments on every click)
    const done = () => {
      if (done._gen !== this._revealGen) return; // stale reveal (cancelled by a newer click)
      if (!this._transitioning) return;
      this._transitioning = false;
      // Paint the real theme FIRST, then drop the overlay. The overlay is
      // already fully covering the viewport, so removing it afterwards
      // reveals an identical colour — no white flash, no mismatch.
      this._paintTheme(theme, persist);
      this._revealOverlay = null;
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };
    done._gen = gen;

    if (anim && anim.finished && typeof anim.finished.then === 'function') {
      anim.finished.then(done).catch(() => {
        if (this._transitioning) done();
      });
    } else {
      // No Web Animations support: land on the correct theme immediately.
      done();
    }
    return true;
  }

  _finishReveal() {
    const overlay = this._revealOverlay;
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    this._revealOverlay = null;
    this._transitioning = false;
  }

  _prefersReducedMotion() {
    try {
      return !!(window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { return false; }
  }

  // Desktop gets the full cinematic sweep; smaller screens get a quicker,
  // lighter reveal so mobile stays responsive.
  _revealDuration() {
    const w = window.innerWidth || 0;
    if (w <= 480) return 520;
    if (w <= 900) return 640;
    return 780;
  }

  toggle() {
    this._revealGen += 1; // bump generation so any in-flight reveal is invalidated
    const next = this.currentTheme === THEME_VALUES.light
      ? THEME_VALUES.dark
      : THEME_VALUES.light;
    this.applyTheme(next, true);
    // Play toggle sound if audio manager is available
    if (window.audioManager && window.audioManager.isEnabled()) {
      window.audioManager.play('ui', 'toggle-switch', { volume: 0.5 });
    }
    return next;
  }

  _updateToggleUI() {
    const isDark = this.currentTheme === THEME_VALUES.dark;
    this.toggleButtons.forEach((btn) => {
      if (!btn || !btn.isConnected) return;
      btn.setAttribute('aria-pressed', String(isDark));
      btn.setAttribute('aria-label', isDark
        ? 'Switch to Light Mode'
        : 'Switch to Dark Mode');

      const iconEl = btn.querySelector('.theme-icon');
      if (iconEl) {
        // Sun while in light mode, crescent moon in dark mode (no emoji).
        iconEl.innerHTML = isDark ? THEME_SVG_MOON : THEME_SVG_SUN;
      }
      const labelEl = btn.querySelector('.theme-label');
      if (labelEl) {
        labelEl.textContent = isDark ? 'Dark' : 'Light';
      }
    });
    this._announce(isDark ? 'Dark mode on' : 'Light mode on');
  }

  // Polite live-region status for assistive tech (theme changes).
  _announce(message) {
    try {
      let status = document.getElementById('orbit-a11y-status');
      if (!status) {
        status = document.createElement('div');
        status.id = 'orbit-a11y-status';
        status.className = 'vh-only';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        document.body.appendChild(status);
      }
      status.textContent = message;
    } catch (e) { /* ignore */ }
  }

  _dispatchThemeEvent() {
    window.dispatchEvent(new CustomEvent('orbitx-theme-change', {
      detail: { theme: this.currentTheme }
    }));
  }

  bindToggle(buttonElement) {
    if (!buttonElement || this.toggleButtons.includes(buttonElement)) return;
    this.toggleButtons.push(buttonElement);

    buttonElement.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    });

    // Note: no custom keydown handler needed - native <button> elements
    // already fire click on Enter/Space, so adding one would double-toggle.

    this._updateToggleUI();
  }
}

const themeManager = new ThemeManager();
window.themeManager = themeManager;

// Self-initialize: apply the light default ASAP and bind EVERY theme button
// present on the page (navbar copy, drawer copy created later by script.js,
// or the JS-injected floating button on pages without a navbar).
function bootThemeManager() {
  themeManager.init();
  document.querySelectorAll('.theme-toggle').forEach((btn) => {
    themeManager.bindToggle(btn);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootThemeManager);
} else {
  bootThemeManager();
}