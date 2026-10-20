// HTML patch 1: skip links, theme-icon emoji -> empty span (JS fills SVG),
// meta description + canonical + Open Graph for every root/project page.
import fs from 'node:fs';

const BASE = 'https://orbit-x-brown.vercel.app/';
const results = [];
let fails = 0;

function edit(file, fn) {
  let t = fs.readFileSync(file, 'utf8');
  const before = t;
  t = fn(t);
  if (t !== before) { fs.writeFileSync(file, t, 'utf8'); results.push('edited ' + file); }
  else { console.error('NO-CHANGE ' + file); fails++; }
}

// 1) Theme toggle: drop emoji; themeManager injects sun/moon SVG.
for (const f of ['index.html', 'about.html', 'credits.html', 'Exploration.html',
  'games.html', 'ghost-hunt.html', 'Story.html', 'login.html',
  'projects/dream-guardians.html', 'projects/ghost-catchers.html',
  'projects/halloween-helpers.html']) {
  edit(f, (t) => t.split('<span class="theme-icon">🌙</span>')
    .join('<span class="theme-icon" aria-hidden="true"></span>'));
}

// 2) Skip link as first focusable element + main landmark id for the target.
const skipTargets = {
  'index.html': 'home',
  'about.html': 'home',
  'games.html': 'games',
  'ghost-hunt.html': 'ghost-hunt-game'
};
for (const [f, id] of Object.entries(skipTargets)) {
  edit(f, (t) => {
    if (t.includes('skip-link')) return t;
    return t.replace(/(<body[^>]*>)/,
      '$1\n  <a class="skip-link" href="#' + id + '">Skip to main content</a>');
  });
}

// Pages needing a main id added first (credits, login, projects).
edit('credits.html', (t) => t
  .replace('<main class="credits-main">', '<main class="credits-main" id="main-content">')
  .replace(/(<body[^>]*>)/, (m) => m.includes('skip-link') ? m :
    m + '\n  <a class="skip-link" href="#main-content">Skip to main content</a>'));
edit('login.html', (t) => t
  .replace('<main class="login-scene">', '<main class="login-scene" id="main-content">')
  .replace(/(<body[^>]*>)/, (m) => m.includes('skip-link') ? m :
    m + '\n  <a class="skip-link" href="#main-content">Skip to main content</a>'));
for (const f of ['projects/dream-guardians.html', 'projects/ghost-catchers.html',
  'projects/halloween-helpers.html']) {
  edit(f, (t) => t
    .replace('<main class="page-shell">', '<main class="page-shell" id="main-content">')
    .replace(/(<body[^>]*>)/, (m) => m.includes('skip-link') ? m :
      m + '\n  <a class="skip-link" href="#main-content">Skip to main content</a>'));
}

console.log(results.join('\n'));
if (fails) process.exit(1);
console.log('H1 DONE');
