// Scan every blob in the object database for a root-level script.js that
// implements the Story 2 scene grid (storyGrid + S2 image paths).
const { execFileSync } = require('child_process');
const fs = require('fs');

const hashes = fs
  .readFileSync('scripts/_allblobs.txt', 'utf8')
  .split(/\r?\n/)
  .map((s) => s.trim())
  .filter(Boolean);

const needles = ['storyGrid', 'S2 S1', 'sceneDots', 'replayBtn', 'currentCount'];
const hits = [];

for (const h of hashes) {
  let buf;
  try {
    buf = execFileSync('git', ['cat-file', '-p', h], { maxBuffer: 1e8 });
  } catch (e) {
    continue;
  }
  if (buf.length < 500) continue;
  const text = buf.toString('utf8');
  const found = needles.filter((n) => text.includes(n));
  if (found.length >= 3) {
    hits.push({ hash: h, size: buf.length, found });
  }
}

console.log(JSON.stringify(hits, null, 2));
fs.writeFileSync(
  'scripts/_scriptjs-candidates.json',
  JSON.stringify(hits, null, 2),
  'utf8'
);
