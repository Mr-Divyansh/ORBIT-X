// ============================================================================
// ORBIT-X smoke test for themeManager.js + audioManager.js
// Run: node tools/smoke-test-managers.mjs
// Stubs just enough DOM to verify: globals, path resolution, theme toggling,
// sound gating (autoplay compliance), volume persistence, mute toggle.
// ============================================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// --- DOM stubs -------------------------------------------------------------

const docListeners = {};
const documentStub = {
  readyState: 'complete',
  currentScript: { src: 'file:///' + path.join(root, 'js', 'audioManager.js').replace(/\\/g, '/') },
  documentElement: {
    attrs: {},
    setAttribute(k, v) { this.attrs[k] = v; },
    removeAttribute(k) { delete this.attrs[k]; },
    getAttribute(k) { return this.attrs[k] ?? null; }
  },
  body: { children: [], appendChild(el) { this.children.push(el); } },
  addEventListener(type, fn) { (docListeners[type] ||= []).push(fn); },
  removeEventListener() {},
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement() { return makeFakeElement(); }
};

function makeFakeElement() {
  const listeners = {};
  return {
    listeners,
    attrs: {},
    dataset: {},
    className: '',
    children: [],
    value: '50',
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    appendChild(child) { this.children.push(child); return child; },
    insertAdjacentElement(pos, el) { this._next = el; return el; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return this.attrs[k] ?? null; },
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      toggle(c, force) {
        if (force === undefined) force = !this._set.has(c);
        force ? this._set.add(c) : this._set.delete(c);
      },
      contains(c) { return this._set.has(c); }
    },
    click() { (listeners.click || []).forEach((fn) => fn({ preventDefault() {}, stopPropagation() {} })); }
  };
}

const themeBtn = makeFakeElement();
documentStub.querySelector = (sel) => (sel === '.theme-toggle' ? themeBtn : null);

const store = new Map();
const localStorageStub = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
};

const audioPlayed = [];
class FakeAudio {
  constructor(src) {
    this.src = src;
    this.volume = 1;
    this.loop = false;
    this.preload = 'auto';
    this.paused = true;
  }
  play() { this.paused = false; audioPlayed.push({ src: this.src, volume: this.volume }); return Promise.resolve(); }
  pause() { this.paused = true; }
  cloneNode() { const c = new FakeAudio(this.src); c.volume = this.volume; return c; }
  removeAttribute(name) { if (name === 'src') this.src = ''; }
}

const winListeners = {};
const windowStub = {
  location: { pathname: '/index.html' },
  addEventListener(type, fn) { (winListeners[type] ||= []).push(fn); },
  removeEventListener() {},
  dispatchEvent(evt) { (winListeners[evt.type] || []).forEach((fn) => fn(evt)); return true; },
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  setTimeout,
  requestAnimationFrame: () => 0,
  cancelAnimationFrame() {},
  Audio: FakeAudio
};

globalThis.document = documentStub;
globalThis.window = windowStub;
globalThis.localStorage = localStorageStub;
globalThis.Audio = FakeAudio;

// --- Load both managers as classic scripts ---------------------------------

vm.runInThisContext(readFileSync(path.join(root, 'js', 'audioManager.js'), 'utf8'), {
  filename: 'audioManager.js'
});
vm.runInThisContext(readFileSync(path.join(root, 'js', 'themeManager.js'), 'utf8'), {
  filename: 'themeManager.js'
});

// --- Assertions -------------------------------------------------------------
const audio = windowStub.audioManager;
const theme = windowStub.themeManager;

assert.ok(audio, 'window.audioManager must exist');
assert.ok(theme, 'window.themeManager must exist');

// Path resolution from document.currentScript (must be Assets/ with capital A).
const normalized = audio.sounds.ui['button-click'].src.replace(/\\/g, '/');
assert.ok(
  /ORBIT-X\/Assets\/audio\/ui\/button-click\.mp3$/.test(normalized),
  `template src should resolve to ORBIT-X/Assets/audio/... (got: ${normalized})`
);

// Autoplay gating: no interaction yet -> cannot play.
assert.strictEqual(audio.canPlay(), false, 'canPlay false before interaction');
assert.strictEqual(audio.play('ui', 'button-click'), null, 'play blocked before interaction');

// Simulate first user gesture (pointerdown fires before click handlers).
(docListeners.pointerdown || []).forEach((fn) => fn({}));
assert.strictEqual(audio.canPlay(), true, 'canPlay true after pointerdown');

// Play works and respects category volume.
const played = audio.play('ui', 'button-click', { volume: 0.5 });
assert.ok(played, 'play should return an element after interaction');
const last = audioPlayed[audioPlayed.length - 1];
assert.ok(last.src.includes('Assets/audio/ui/button-click.mp3'), 'played src uses Assets/');
assert.ok(Math.abs(last.volume - 0.5 * audio.getVolume('sfx')) < 1e-9, 'volume = requested * category');

// Mute toggle stops playback and blocks further sounds.
audio.setEnabled(false);
assert.strictEqual(audio.isEnabled(), false, 'disabled after setEnabled(false)');
assert.strictEqual(audio.play('ui', 'button-click'), null, 'play blocked when muted');
audio.setEnabled(true);
assert.strictEqual(audio.isEnabled(), true, 're-enabled');

// Volume persistence.
audio.setVolume('music', 0.9);
assert.strictEqual(audio.getVolume('music'), 0.9, 'music volume set');
assert.ok(store.get('orbitx-volumes').includes('0.9'), 'volumes persisted to localStorage');
assert.ok(
  store.get('orbitx-sound-enabled') === 'true' || store.get('orbitx-sound-enabled') === 'false',
  'enabled persisted'
);

// Ambience loop node.
const amb = audio.playAmbience('night-wind', { loop: true, volume: 0.7 });
assert.ok(amb, 'ambience plays');
assert.strictEqual(amb.loop, true, 'ambience loops');
assert.ok(Math.abs(amb.volume - 0.7 * audio.getVolume('ambience')) < 1e-9, 'ambience volume scaling');
audio.stopAmbience();
assert.strictEqual(audio.ambienceNode, null, 'ambience stopped');

// Theme: default light, toggles to dark, persists, updates button.
assert.strictEqual(theme.currentTheme, 'light', 'default theme light');
assert.strictEqual(documentStub.documentElement.getAttribute('data-theme'), null, 'no dark attr initially');
themeBtn.click();
assert.strictEqual(theme.currentTheme, 'dark', 'toggled to dark');
assert.strictEqual(documentStub.documentElement.getAttribute('data-theme'), 'dark', 'data-theme=dark set');
assert.strictEqual(themeBtn.attrs['aria-pressed'], 'true', 'aria-pressed true in dark mode');
assert.strictEqual(store.get('orbitx-theme'), 'dark', 'theme persisted');
themeBtn.click();
assert.strictEqual(theme.currentTheme, 'light', 'toggled back to light');
assert.strictEqual(documentStub.documentElement.getAttribute('data-theme'), null, 'dark attr removed');

// Exactly one click listener bound (no double-binding from boot + manual bind).
assert.strictEqual((themeBtn.listeners.click || []).length, 1, 'one click listener on theme button');

// --- Full script.js integration (sound button, drawer sound panel) ----------

vm.runInThisContext(readFileSync(path.join(root, 'js', 'script.js'), 'utf8'), {
  filename: 'script.js'
});

const soundBtn = themeBtn._next;
assert.ok(soundBtn && String(soundBtn.className).includes('sound-toggle'), 'sound button injected after theme toggle');
assert.strictEqual(soundBtn.attrs['aria-pressed'], 'true', 'sound button reflects ON state');
assert.strictEqual((soundBtn.listeners.click || []).length, 1, 'sound button click bound');

// Mute via sound button updates aria state through orbitx-sound-change.
soundBtn.click();
assert.strictEqual(audio.isEnabled(), false, 'sound button mutes');
assert.strictEqual(soundBtn.attrs['aria-pressed'], 'false', 'aria-pressed false when muted');
assert.strictEqual(soundBtn.classList.contains('is-muted'), true, 'is-muted class applied');
soundBtn.click();
assert.strictEqual(audio.isEnabled(), true, 'sound button unmutes');
assert.strictEqual(soundBtn.attrs['aria-pressed'], 'true', 'aria-pressed true again');

// Drawer builds with the sound panel (3 volume sliders, music = 90 from above).
assert.strictEqual(typeof globalThis.ensureDrawerElements, 'function', 'ensureDrawerElements exposed');
globalThis.ensureDrawerElements();
const drawerEl = documentStub.body.children.find(
  (el) => String(el.className).includes('nav-drawer') && !String(el.className).includes('backdrop')
);
assert.ok(drawerEl, 'drawer appended to body');
const soundSection = drawerEl.children.find((c) => String(c.className).includes('nav-drawer__sound'));
assert.ok(soundSection, 'drawer contains sound section');
assert.strictEqual(soundSection.children.length, 4, 'h3 + 3 volume rows');
const musicSlider = soundSection.children[1].children[1];
assert.strictEqual(String(musicSlider.value), '90', 'music slider reflects volume 0.9 set earlier');

console.log('ALL SMOKE TESTS PASSED');
console.log('  - audioManager global + script-relative Assets/audio path');
console.log('  - autoplay gating (pointerdown unlocks playback)');
console.log('  - mute/unmute, volume persistence, ambience loop');
console.log('  - theme toggle dark/light + persistence + aria-pressed');

