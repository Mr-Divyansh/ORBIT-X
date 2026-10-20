// Patch 1/2 for js/script.js: drawer controls, backdrop close, scroll lock,
// focus trap. Exact-match replacements; fails loudly if a pattern is missing.
import fs from 'node:fs';
const FILE = 'js/script.js';
let src = fs.readFileSync(FILE, 'utf8');
let fails = 0;
function rep(name, oldText, newText) {
  if (!src.includes(oldText)) { console.error('MISSING: ' + name); fails++; return; }
  src = src.replace(oldText, newText);
  console.log('ok: ' + name);
}

rep('drawer-controls',
`    drawer.appendChild(navContainer);

    // Sound settings — volume sliders wired straight to audioManager`,
`    drawer.appendChild(navContainer);

    // Theme + sound controls. On mobile the navbar copies are hidden by CSS,
    // so the drawer carries the real controls. Both stay synced through
    // themeManager (multi-button) and the 'orbitx-sound-change' event.
    const controlsSection = document.createElement('div');
    controlsSection.className = 'nav-drawer__controls';
    const drawerThemeBtn = document.createElement('button');
    drawerThemeBtn.className = 'theme-toggle';
    drawerThemeBtn.type = 'button';
    drawerThemeBtn.setAttribute('aria-label', 'Switch to Dark Mode');
    drawerThemeBtn.setAttribute('aria-pressed', 'false');
    const dtIcon = document.createElement('span');
    dtIcon.className = 'theme-icon';
    const dtLabel = document.createElement('span');
    dtLabel.className = 'theme-label';
    dtLabel.textContent = 'Light';
    drawerThemeBtn.appendChild(dtIcon);
    drawerThemeBtn.appendChild(dtLabel);
    if (window.themeManager) window.themeManager.bindToggle(drawerThemeBtn);
    controlsSection.appendChild(drawerThemeBtn);
    controlsSection.appendChild(createSoundToggle());
    drawer.appendChild(controlsSection);

    // Sound settings — volume sliders wired straight to audioManager`);

rep('backdrop-listener',
`    drawerBackdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(drawerBackdrop);`,
`    drawerBackdrop.setAttribute('aria-hidden', 'true');
    // Clicking the backdrop closes the drawer (the element is created lazily,
    // so its listener is attached here where the node exists).
    drawerBackdrop.addEventListener('click', () => closeDrawer());
    document.body.appendChild(drawerBackdrop);`);

rep('open-scrolllock',
`function openDrawer() {
  ensureDrawerElements();
  drawerBackdrop.classList.add('is-visible');`,
`let drawerScrollY = 0;

function openDrawer() {
  ensureDrawerElements();
  drawerScrollY = window.scrollY;
  // Lock background scrolling (position:fixed via .nav-drawer-open) while
  // remembering the user's place so closing restores the exact spot.
  document.body.style.top = \`-\${drawerScrollY}px\`;
  drawerBackdrop.classList.add('is-visible');`);

rep('close-scrollrestore',
`  document.body.classList.remove('nav-drawer-open');
  if (menuToggle) {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.focus();
  }`,
`  document.body.classList.remove('nav-drawer-open');
  document.body.style.top = '';
  window.scrollTo(0, drawerScrollY);
  if (menuToggle) {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.focus();
  }`);

rep('focus-trap',
`// Close drawer when clicking a link inside it (handled in ensureDrawerElements)`,
`// Keep keyboard focus inside the open drawer (Tab cycles through visible
// controls only; Shift+Tab wraps backwards).
const ORBIT_FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab' || !drawer || !drawer.classList.contains('is-open')) return;
  const items = Array.from(drawer.querySelectorAll(ORBIT_FOCUSABLE))
    .filter((el) => el.offsetParent !== null);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

// Close drawer when clicking a link inside it (handled in ensureDrawerElements)`);

if (fails) { process.exit(1); }
fs.writeFileSync(FILE, src, 'utf8');
console.log('PATCH1 DONE');
