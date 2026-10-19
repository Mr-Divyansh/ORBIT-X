// ============================================================================
// ORBIT-X Theme Manager
// Light ON / Light OFF toggle. ALWAYS starts in Light Mode on every page
// load — the toggle is session-only and never persists across loads.
// ============================================================================

const THEME_KEY = 'orbitx-theme';
const THEME_ATTR = 'data-theme';
const THEME_VALUES = { light: 'light', dark: 'dark' };

class ThemeManager {
  constructor() {
    this.currentTheme = THEME_VALUES.light;
    this.toggleBtn = null;
    this.iconEl = null;
    this.labelEl = null;
    this.isInitialized = false;
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

  toggle() {
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
    if (!this.toggleBtn) return;
    const isDark = this.currentTheme === THEME_VALUES.dark;
    this.toggleBtn.setAttribute('aria-pressed', String(isDark));
    this.toggleBtn.setAttribute('aria-label', isDark
      ? 'Switch to Light Mode'
      : 'Switch to Dark Mode');

    if (this.iconEl) {
      this.iconEl.textContent = isDark ? '\u{1F319}' : '\u{1F31A}'; // 🌙 light -> 🌕 dark
    }
    if (this.labelEl) {
      this.labelEl.textContent = isDark ? 'Dark' : 'Light';
    }
  }

  _dispatchThemeEvent() {
    window.dispatchEvent(new CustomEvent('orbitx-theme-change', {
      detail: { theme: this.currentTheme }
    }));
  }

  bindToggle(buttonElement) {
    this.toggleBtn = buttonElement;
    this.iconEl = buttonElement.querySelector('.theme-icon');
    this.labelEl = buttonElement.querySelector('.theme-label');

    this.toggleBtn.addEventListener('click', (e) => {
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

// Self-initialize: apply saved theme ASAP and bind the navbar theme button
// (or the JS-injected floating button on pages without a navbar).
function bootThemeManager() {
  themeManager.init();
  const btn = document.querySelector('.theme-toggle');
  if (btn) themeManager.bindToggle(btn);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootThemeManager);
} else {
  bootThemeManager();
}