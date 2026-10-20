// Patch 2/2 for js/script.js: shared sound-toggle factory + buildSoundUI.
import fs from 'node:fs';
const FILE = 'js/script.js';
let src = fs.readFileSync(FILE, 'utf8');
let fails = 0;
function rep(name, oldText, newText) {
  if (!src.includes(oldText)) { console.error('MISSING: ' + name); fails++; return; }
  src = src.replace(oldText, newText);
  console.log('ok: ' + name);
}

rep('factory',
`// ============================================================================
// ORBIT-X — Sound toggle button + floating toggles + ambience loop
// ============================================================================`,
`// ============================================================================
// ORBIT-X — Sound toggle button + floating toggles + ambience loop
// ============================================================================

// Shared factory: the navbar copy and the drawer copy are both built with
// this, and they stay in sync through the 'orbitx-sound-change' event.
function createSoundToggle() {
  const soundBtn = document.createElement('button');
  soundBtn.className = 'sound-toggle is-muted';
  soundBtn.type = 'button';
  const soundIcon = document.createElement('span');
  soundIcon.className = 'sound-icon';
  soundIcon.setAttribute('aria-hidden', 'true');
  // Crisp inline SVG speaker: waves appear only when sound is ON, so the
  // icon itself communicates the state (not just the text next to it).
  soundIcon.innerHTML =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" ' +
    'stroke="currentColor" stroke-width="1.9" stroke-linecap="round" ' +
    'stroke-linejoin="round" focusable="false">' +
    '<path d="M11 5L6.5 9H3v6h3.5L11 19V5z" fill="currentColor" stroke="none"/>' +
    '<path class="sound-wave sound-wave-1" d="M14.5 9.2a4 4 0 010 5.6"/>' +
    '<path class="sound-wave sound-wave-2" d="M17.6 6.6a7.8 7.8 0 010 10.8"/>' +
    '<path class="sound-mute" d="M15 9.5l5 5M20 9.5l-5 5"/>' +
    '</svg>';
  const soundLabel = document.createElement('span');
  soundLabel.className = 'sound-label';
  soundLabel.setAttribute('aria-hidden', 'true');
  soundLabel.textContent = 'Sound OFF';
  soundBtn.appendChild(soundIcon);
  soundBtn.appendChild(soundLabel);

  const sync = () => {
    if (!window.audioManager) return;
    const on = window.audioManager.isEnabled();
    soundBtn.classList.toggle('is-muted', !on);
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
    soundBtn.title = on ? 'Sound ON - click to mute' : 'Sound OFF - click to enable';
    soundLabel.textContent = on ? 'Sound ON' : 'Sound OFF';
    soundIcon.classList.toggle('is-on', on);
    soundIcon.classList.toggle('is-off', !on);
  };

  soundBtn.addEventListener('click', () => {
    if (!window.audioManager) return;
    const wasOn = window.audioManager.isEnabled();
    window.audioManager.setEnabled(!wasOn);
    if (!wasOn) {
      // Turning sound back on: immediate audible feedback + warm the story
      // sounds so they play without delay when the user reaches them.
      window.audioManager.play('ui', 'toggle-switch', { volume: 0.5 });
      window.audioManager.warmUp([
        { category: 'transitions', name: 'magical-reveal' },
        { category: 'transitions', name: 'scene-transition' },
        { category: 'interactions', name: 'ghost-appear' }
      ]);
    }
    sync();
    // Tell every other copy (navbar <-> drawer) to refresh.
    window.dispatchEvent(new CustomEvent('orbitx-sound-change', {
      detail: { enabled: !wasOn }
    }));
  });

  document.addEventListener('orbitx-sound-change', sync);
  sync();
  return soundBtn;
}`);

rep('floating-theme-no-emoji',
`    const icon = document.createElement('span');
    icon.className = 'theme-icon';
    icon.textContent = '\\u{1F319}';
    const label = document.createElement('span');
    label.className = 'theme-label';
    label.textContent = 'Dark';`,
`    const icon = document.createElement('span');
    icon.className = 'theme-icon';
    // themeManager.bindToggle fills the sun/moon SVG for the current mode.
    const label = document.createElement('span');
    label.className = 'theme-label';
    label.textContent = 'Light';`);

if (fails) { process.exit(1); }
fs.writeFileSync(FILE, src, 'utf8');
console.log('PATCH2A DONE');
