// ============================================================================
// ORBIT-X Theme Manager
// Light ON / Light OFF toggle with localStorage persistence.
// Uses CSS variables for consistent theming across all pages.
// ============================================================================

const THEME_KEY = 'orbitx-theme';
const THEME_ATTR = 'data-theme';
const THEME_VALUES = { light: 'light', dark: 'dark' };

class ThemeManager {
  constructor() {
    this.currentTheme = this._loadTheme();
    this.toggleBtn = null;
    this.iconEl = null;
    this.labelEl = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Apply saved theme on load
    this.applyTheme(this.currentTheme, false);

    // Listen for system preference changes (only if no saved preference)
    if (!localStorage.getItem(THEME_KEY)) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem(THEME_KEY)) {
          this.applyTheme(e.matches ? THEME_VALUES.dark : THEME_VALUES.light, false);
        }
      });
    }
  }

  _loadTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved && Object.values(THEME_VALUES).includes(saved)) {
        return saved;
      }
    } catch (e) { /* ignore */ }
    // No saved preference: respect the operating system's color scheme.
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return THEME_VALUES.dark;
      }
    } catch (e) { /* ignore */ }
    // Default: light mode (original ORBIT-X appearance)
    return THEME_VALUES.light;
  }

  _saveTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) { /* ignore */ }
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
        meta.setAttribute('content', theme === THEME_VALUES.dark ? '#171522' : '#fffaf5');
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