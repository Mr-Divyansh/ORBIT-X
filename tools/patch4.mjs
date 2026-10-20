// Patch 4 for js/script.js: factory polls briefly for a deferred audioManager.
import fs from 'node:fs';
const FILE = 'js/script.js';
let src = fs.readFileSync(FILE, 'utf8');
const oldText = `  document.addEventListener('orbitx-sound-change', sync);
  sync();
  return soundBtn;
}`;
const newText = `  document.addEventListener('orbitx-sound-change', sync);
  sync();
  // audioManager.js may load just after this button (deferred on some pages);
  // poll briefly so the button reflects the real state instead of staying
  // muted. On pages with no audio manager at all it simply stays OFF.
  if (!window.audioManager) {
    let tries = 0;
    const wait = () => {
      if (window.audioManager) { sync(); return; }
      if (++tries < 80) setTimeout(wait, 40);
    };
    setTimeout(wait, 40);
  }
  return soundBtn;
}`;
if (!src.includes(oldText)) { console.error('MISSING'); process.exit(1); }
src = src.replace(oldText, newText);
fs.writeFileSync(FILE, src, 'utf8');
console.log('PATCH4 DONE');
