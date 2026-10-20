const fs = require('fs');
const path = 'js/script.js';
let s = fs.readFileSync(path, 'utf8');
const changes = [];
function rep(oldText, newText, label) {
  if (!s.includes(oldText)) { changes.push(label + ': MISS'); return; }
  s = s.split(oldText).join(newText);
  changes.push(label + ': ok');
}

// Recognizable sound toggle: speaker icon + Sound ON/OFF text + tooltip.
rep(
  "    soundBtn.className = 'sound-toggle';",
  "    soundBtn.className = 'sound-toggle is-muted';",
  "btn-class"
);

rep(
  "    soundBtn.appendChild(soundIcon);\n    themeBtn.insertAdjacentElement('afterend', soundBtn);",
  "    const soundLabel = document.createElement('span');\n" +
  "    soundLabel.className = 'sound-label';\n" +
  "    soundLabel.setAttribute('aria-hidden', 'true');\n" +
  "    soundLabel.textContent = 'Sound OFF';\n" +
  "    soundBtn.appendChild(soundIcon);\n" +
  "    soundBtn.appendChild(soundLabel);\n" +
  "    themeBtn.insertAdjacentElement('afterend', soundBtn);",
  "btn-label"
);

rep(
  "      soundBtn.setAttribute('aria-label', on ? 'Mute sound' : 'Unmute sound');",
  "      soundBtn.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');\n" +
  "      soundBtn.title = on ? 'Sound ON - click to mute' : 'Sound OFF - click to enable';\n" +
  "      soundLabel.textContent = on ? 'Sound ON' : 'Sound OFF';",
  "btn-sync"
);

fs.writeFileSync(path, s);
console.log(changes.join('\n'));
