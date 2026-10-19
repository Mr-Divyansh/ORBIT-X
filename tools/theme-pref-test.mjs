// ============================================================================
// ORBIT-X — theme preference bootstrap test
// Verifies js/themeManager.js:
//   1. defaults to DARK when the OS prefers dark and nothing is saved,
//   2. defaults to LIGHT when the OS prefers light,
//   3. honors an explicit saved preference over the OS,
//   4. flips <html data-theme> accordingly.
// Run: node tools/theme-pref-test.mjs
// ============================================================================

import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(__dirname, '..', 'js', 'themeManager.js'), 'utf8');

function makeEnv({ osDark, saved }) {
  const attrs = {};
  const store = new Map(Object.entries(saved || {}));
  const documentStub = {
    readyState: 'complete',
    documentElement: {
      setAttribute: (k, v) => { attrs[k] = v; },
      removeAttribute: (k) => { delete attrs[k]; },
      getAttribute: (k) => (k in attrs ? attrs[k] : null),
    },
    querySelector: () => null,
    addEventListener() {},
  };
  const windowStub = {
    matchMedia: () => ({ matches: osDark, addEventListener() {} }),
    dispatchEvent() { return true; },
    addEventListener() {},
    removeEventListener() {},
  };
  const ctx = {
    window: windowStub,
    document: documentStub,
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, String(v)); },
      removeItem: (k) => { store.delete(k); },
    },
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } },
    console,
  };
  vm.createContext(ctx);
  vm.runInContext(source, ctx);
  return { theme: ctx.window.themeManager, attrs, store };
}

let failures = 0;
function assert(cond, label) {
  console.log((cond ? 'PASS' : 'FAIL') + ' - ' + label);
  if (!cond) failures++;
}

// 1. OS dark, nothing saved -> dark theme applied.
let env = makeEnv({ osDark: true, saved: null });
assert(env.theme.currentTheme === 'dark', 'OS prefers dark -> default theme dark');
assert(env.attrs['data-theme'] === 'dark', 'OS prefers dark -> <html data-theme="dark"> set');

// 2. OS light, nothing saved -> light theme.
env = makeEnv({ osDark: false, saved: null });
assert(env.theme.currentTheme === 'light', 'OS prefers light -> default theme light');
assert(!('data-theme' in env.attrs), 'OS prefers light -> no data-theme attribute');

// 3. Explicit light saved on an OS-dark machine -> light wins.
env = makeEnv({ osDark: true, saved: { 'orbitx-theme': 'light' } });
assert(env.theme.currentTheme === 'light', 'saved light overrides OS dark');

// 4. Explicit dark saved on an OS-light machine -> dark wins.
env = makeEnv({ osDark: false, saved: { 'orbitx-theme': 'dark' } });
assert(env.theme.currentTheme === 'dark', 'saved dark overrides OS light');
assert(env.attrs['data-theme'] === 'dark', 'saved dark -> attribute set');

if (failures > 0) {
  console.error('\n' + failures + ' theme preference test(s) FAILED');
  process.exit(1);
}
console.log('\nALL THEME PREFERENCE TESTS PASSED');
