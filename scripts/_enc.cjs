const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const out = [];
const say = (s) => out.push(s === undefined ? '' : s);

function hexdump(file, needle) {
  const buf = fs.readFileSync(path.join(ROOT, file));
  const i = buf.indexOf(needle);
  if (i === -1) return `${file}: needle not found`;
  const start = Math.max(0, i - 8);
  const slice = buf.subarray(start, i + needle.length + 8);
  const hex = [...slice].map((b) => b.toString(16).padStart(2, '0')).join(' ');
  const cp = needle
    .toString('utf8')
    .split('')
    .map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'))
    .join(' ');
  return `${file} @${i}\n   hex: ${hex}\n   cp : ${cp}`;
}

say('=== about.html mojibake bytes ===');
say(hexdump('about.html', Buffer.from('DivyanshG')));
say('');
say('=== css/exploration2.css mojibake bytes ===');
say(hexdump('css/exploration2.css', Buffer.from('Exploration 2 ')));
say('');

// Scan every text file for non-ASCII characters, listing distinct ones.
say('=== non-ASCII inventory per file ===');
function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules' || e.name === 'scripts') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(html|css|js|json|md)$/i.test(e.name)) acc.push(p);
  }
  return acc;
}
for (const f of walk(ROOT)) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const buf = fs.readFileSync(f);
  if (buf.subarray(0, 4096).includes(0x00)) { say(`${rel}: BINARY/UTF-16`); continue; }
  const text = buf.toString('utf8');
  const counts = new Map();
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp < 128) continue;
    counts.set(ch, (counts.get(ch) || 0) + 1);
  }
  if (!counts.size) continue;
  const list = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `${JSON.stringify(c)}=U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}(${n})`);
  say(`${rel}:`);
  list.forEach((l) => say('    ' + l));
}

fs.writeFileSync(path.join(__dirname, '_enc.txt'), out.join('\n'), 'utf8');
console.log('written');
