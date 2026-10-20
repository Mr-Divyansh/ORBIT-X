import fs from 'node:fs';
const pick = (head, incoming, mergedLabel) => ({ head, incoming });
// Resolve the 3 conflicted files by keeping the best of both sides.
function resolveFile(path, resolutions) {
  let text = fs.readFileSync(path, 'utf8');
  const re = /<<<<<<< HEAD\r?\n([\s\S]*?)\r?\n=======\r?\n([\s\S]*?)\r?\n>>>>>>> [^\r\n]*\r?\n/g;
  let i = 0;
  text = text.replace(re, () => {
    const r = resolutions[i++];
    if (!r) throw new Error('no resolution for hunk ' + i + ' in ' + path);
    return r + (r.endsWith('\n') ? '' : '\n');
  });
  fs.writeFileSync(path, text);
  console.log(path + ': resolved ' + i + ' hunks; remaining markers=' + ((text.match(/<{7}|>{7}/g) || []).length));
}

// --- css/style.css: 5 hunks ---
resolveFile('css/style.css', [
  // 1. Navbar: premium translucent start + opaque on scroll (incoming), generous 72px profile (HEAD).
  `  gap: 22px;
  /* Premium bar (72px): room for the larger, clearly visible brand mark.
     Starts translucent, turns opaque on scroll via .is-scrolled. */
  min-height: 72px;
  padding: 6px 4.5%;
  background: rgba(255, 250, 245, 0.35);
  border-bottom: none;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transition: background 0.3s ease, border-bottom 0.3s ease, backdrop-filter 0.3s ease;
  will-change: background, backdrop-filter;
}

/* Scrolled state: navbar turns opaque */
.navbar.is-scrolled {
  background: rgba(255, 250, 245, 0.92);`,
  // 2. Theme toggle sizing: 40px min target + surface token (HEAD).
  `  min-height: 40px;
  padding: 8px 14px;
  background: var(--surface);`,
  // 3. Theme toggle type: token spacing/weight (HEAD hybrid).
  `  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  margin-left: 12px;
  transition: background-color 0.2s ease, border-color 0.2s ease,
    color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;`,
  // 4. Theme hover shadow: explicit lavender rgba (HEAD).
  `  box-shadow: 0 4px 12px rgba(152, 113, 221, 0.18);`,
  // 5. Theme pressed hover: explicit darker lavender (HEAD).
  `  box-shadow: 0 4px 14px rgba(152, 113, 221, 0.32);
}

.theme-toggle[aria-pressed="true"]:hover {
  background: #7d54c4;
  border-color: #7d54c4;`,
]);

// --- js/script.js: 1 hunk (keep factory + also wrap in toggle-group) ---
resolveFile('js/script.js', [
  `    const soundBtn = createSoundToggle();
    themeBtn.insertAdjacentElement('afterend', soundBtn);
    // Wrap theme + sound toggles together so they stay side-by-side instead of
    // being pushed apart by the navbar's justify-content: space-between.
    const group = document.createElement('div');
    group.className = 'toggle-group';
    themeBtn.parentNode.insertBefore(group, themeBtn);
    group.appendChild(themeBtn);
    group.appendChild(soundBtn);`,
]);

// --- login.html: 1 hunk (HEAD: no fake navbar; keep skip link + main id) ---
resolveFile('login.html', [
  `  <a class="skip-link" href="#main-content">Skip to main content</a>
  <main class="login-scene" id="main-content">`,
]);
