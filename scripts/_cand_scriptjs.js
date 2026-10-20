// Scratch tool: search all git objects (incl. dangling) for Story 2 scene-engine code.
const { execFileSync } = require('child_process');

function git(args, opts = {}) {
  return execFileSync('git', args, {
    cwd: 'c:\\Users\\divy1\\OneDrive\\Desktop\\Divyansh all codes\\ORBIT-X',
    maxBuffer: 64 * 1024 * 1024,
    encoding: opts.binary ? 'buffer' : 'utf8',
  });
}

const fsck = git(['fsck', '--lost-found', '--dangling']);
const blobs = new Set();
const commits = new Set();
for (const line of fsck.split('\n')) {
  const m = line.match(/dangling blob ([0-9a-f]{40})/);
  if (m) blobs.add(m[1]);
  const c = line.match(/dangling commit ([0-9a-f]{40})/);
  if (c) commits.add(c[1]);
}

// Also walk every dangling commit tree for blobs.
for (const c of commits) {
  let tree;
  try {
    tree = git(['ls-tree', '-r', c]);
  } catch {
    continue;
  }
  for (const line of tree.split('\n')) {
    const m = line.match(/\sblob ([0-9a-f]{40})\t(.+)$/);
    if (m) blobs.add(m[1]);
  }
}

console.log(`Scanning ${blobs.size} blobs / ${commits.size} dangling commits\n`);

const NEEDLES = [
  'storyGrid',
  'sceneDots',
  'prevBtn',
  'nextBtn',
  'replayBtn',
  'currentCount',
  'Ghost Purificators',
  'scene-card',
  'story2',
  'S2 S1',
];

const hits = [];
for (const b of blobs) {
  let buf;
  try {
    buf = git(['cat-file', 'blob', b], { binary: true });
  } catch {
    continue;
  }
  const text = buf.toString('utf8');
  const found = NEEDLES.filter((n) => text.includes(n));
  if (found.length >= 2) {
    hits.push({ blob: b, size: buf.length, found, text });
  }
}

hits.sort((a, b) => b.found.length - a.found.length);
for (const h of hits) {
  console.log(`--- ${h.blob}  (${h.size} bytes)  matches: ${h.found.join(', ')}`);
  const isHtml = /^\s*<!doctype/i.test(h.text) || /<html/i.test(h.text.slice(0, 500));
  const isJs = /\bconst\b|\bfunction\b|addEventListener/.test(h.text);
  console.log(`    type: ${isHtml ? 'HTML' : isJs ? 'JS' : 'other'}`);
  const firstLines = h.text.split(/\r?\n/).slice(0, 6).join('\n      ');
  console.log('    head:\n      ' + firstLines.slice(0, 500));
}
console.log('\nTotal candidate blobs: ' + hits.length);
