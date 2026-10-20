const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const out = [];
const say = (s) => out.push(s === undefined ? '' : s);

// --- ids per page ---------------------------------------------------------
const pages = ['index.html', 'about.html', 'Exploration.html', 'Story.html', 'story2.html',
  'login.html', 'games.html', 'ghost-hunt.html', 'credits.html',
  'projects/halloween-helpers.html', 'projects/dream-guardians.html', 'projects/ghost-catchers.html'];

for (const p of pages) {
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f)) { say(`### ${p} :: MISSING`); continue; }
  const t = fs.readFileSync(f, 'utf8');
  const ids = [...t.matchAll(/\bid=["']([^"']+)["']/g)].map((m) => m[1]);
  const want = ['home', 'about', 'story', 'character-abhay', 'gadget-lamp', 'forgot-password', 'create-account'];
  const missing = want.filter((w) => !ids.includes(w));
  say(`### ${p}`);
  say(`   ids(${ids.length}): ${ids.join(' ')}`);
  say(`   missing-of-interest: ${missing.join(', ') || 'none'}`);
  // scripts + styles
  const scripts = [...t.matchAll(/<script[^>]*src=["']([^"']+)["']/g)].map((m) => m[1]);
  const styles = [...t.matchAll(/<link[^>]*href=["']([^"']+\.css)["']/g)].map((m) => m[1]);
  say(`   scripts: ${scripts.join(' | ')}`);
  say(`   styles : ${styles.join(' | ')}`);
  say('');
}

// --- root script.js in git at a409227 -------------------------------------
try {
  const tree = execSync('git ls-tree -r --name-only a409227', { maxBuffer: 1e8 }).toString('utf8');
  say('=== a409227 root-level js ===');
  say(tree.split('\n').filter((f) => /^\w[\w .()-]*\.js$/.test(f) && !f.includes('/')).join('\n'));
} catch (e) { say('git a409227 failed: ' + e.message); }

// --- exploration2.css head ------------------------------------------------
const ex2 = path.join(ROOT, 'css', 'exploration2.css');
if (fs.existsSync(ex2)) {
  const buf = fs.readFileSync(ex2);
  say('');
  say('=== css/exploration2.css first 3 lines (raw bytes as utf8) ===');
  say(JSON.stringify(buf.toString('utf8').split('\n').slice(0, 4)));
  say('BOM: ' + (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf));
}

// --- about.html raw bytes around the mojibake -----------------------------
const ab = fs.readFileSync(path.join(ROOT, 'about.html'));
say('');
say('=== about.html lines 605-618 raw ===');
say(JSON.stringify(ab.toString('utf8').split('\n').slice(604, 618), null, 1));

fs.writeFileSync(path.join(__dirname, '_ctx.txt'), out.join('\n'), 'utf8');
console.log(out.join('\n'));
