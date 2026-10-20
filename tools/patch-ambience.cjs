const fs = require('fs');
const path = 'js/script.js';
let s = fs.readFileSync(path, 'utf8');
const changes = [];
function rep(oldText, newText, label) {
  if (!s.includes(oldText)) { changes.push(label + ': MISS'); return; }
  s = s.split(oldText).join(newText);
  changes.push(label + ': ok');
}

// Ambience lifecycle: start only after gesture + Sound ON; Sound OFF resets.
rep(
  "(function initAmbience() {\n" +
  "  let started = false;\n" +
  "  const startAmbience = () => {\n" +
  "    if (started) return;\n" +
  "    started = true;\n" +
  "    if (window.audioManager && window.audioManager.canPlay()) {",
  "(function initAmbience() {\n" +
  "  let started = false;\n" +
  "  const arm = () => {\n" +
  "    document.addEventListener('click', startAmbience, { once: true, passive: true });\n" +
  "    document.addEventListener('keydown', startAmbience, { once: true, passive: true });\n" +
  "  };\n" +
  "  const startAmbience = () => {\n" +
  "    if (started) return;\n" +
  "    if (window.audioManager && window.audioManager.canPlay()) {",
  "amb-a"
);

rep(
  "  document.addEventListener('click', startAmbience, { once: true, passive: true });\n" +
  "  document.addEventListener('keydown', startAmbience, { once: true, passive: true });\n" +
  "})();",
  "  window.addEventListener('orbitx-sound-change', (e) => {\n" +
  "    if (e.detail && e.detail.enabled) { startAmbience(); }\n" +
  "    else { started = false; arm(); }\n" +
  "  });\n" +
  "  arm();\n" +
  "})();",
  "amb-b"
);

// Story hooks marker (block inserted before ambience comment).
rep(
  "// Loop the night-wind ambience after the first user gesture (autoplay-safe).",
  "// STORY-SOUNDS-ANCHOR\n// Loop the night-wind ambience after the first user gesture (autoplay-safe).",
  "anchor"
);

fs.writeFileSync(path, s);
console.log(changes.join('\n'));
