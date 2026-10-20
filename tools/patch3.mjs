// Patch 3 for js/script.js: buildSoundUI uses the shared factory.
import fs from 'node:fs';
const FILE = 'js/script.js';
let src = fs.readFileSync(FILE, 'utf8');

const startMarker = '  // Global sound ON/OFF toggle, injected next to the theme toggle on every';
const endMarker = `    window.addEventListener('orbitx-sound-change', syncSoundUI);
  }
}`;
const a = src.indexOf(startMarker);
const b = src.indexOf(endMarker);
if (a === -1 || b === -1 || b < a) {
  console.error('MISSING bounds', a, b);
  process.exit(1);
}
const replacement = `  // Global sound ON/OFF toggle, injected next to the theme toggle on every
  // page so the control stays consistent without editing 9 HTML files.
  // Built with the shared factory so the drawer copy stays in sync.
  if (!document.querySelector('.sound-toggle')) {
    const soundBtn = createSoundToggle();
    themeBtn.insertAdjacentElement('afterend', soundBtn);

    // On navbar-less pages, park both buttons in a fixed top-right group.
    if (needsFloatingToggles) {
      const wrap = document.createElement('div');
      wrap.className = 'floating-toggles';
      document.body.appendChild(wrap);
      wrap.appendChild(themeBtn);
      wrap.appendChild(soundBtn);
    }
  }
}`;
src = src.slice(0, a) + replacement + src.slice(b + endMarker.length);
fs.writeFileSync(FILE, src, 'utf8');
console.log('PATCH3 DONE');
