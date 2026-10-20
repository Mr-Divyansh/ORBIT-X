// ============================================================================
// ORBIT-X — Inventory every path that EVER existed in git, and report which
// of them are missing from the current working tree.
//
// This is the authoritative "what did we lose?" list.
// Output: scripts/_missing.txt
// ============================================================================

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, '_missing.txt');

function git(args, opts = {}) {
  return execFileSync('git', args, {
    cwd: ROOT,
    maxBuffer: 256 * 1024 * 1024,
    encoding: opts.binary ? 'buffer' : 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

const lines = [];
const say = (s = '') => lines.push(s);

// --- Working tree inventory (exact on-disk casing) --------------------------
const onDisk = new Set();       // relative path, forward slashes, real casing
const onDiskLower = new Map();  // lowercased -> real casing
const diskDirs = new Set();

function walk(dir, rel = '') {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const abs = path.join(dir, e.name);
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) {
      diskDirs.add(r);
      walk(abs, r);
    } else {
      onDisk.add(r);
      onDiskLower.set(r.toLowerCase(), r);
    }
  }
}
walk(ROOT);

// --- Every path that ever existed ------------------------------------------
const revs = git(['rev-list', '--all']).trim().split(/\s+/);
const ever = new Map(); // path -> {blobs:Set, first, last, revs:Set}
const dates = new Map();

for (const rev of revs) {
  let tree;
  try {
    tree = git(['ls-tree', '-r', rev]);
  } catch {
    continue;
  }
  let ts = 0;
  try {
    ts = Number(git(['log', '-1', '--format=%at', rev]).trim()) || 0;
  } catch {
    /* ignore */
  }
  for (const line of tree.split('\n')) {
    const m = line.match(/^\d+ blob ([0-9a-f]{40})\t(.+)$/);
    if (!m) continue;
    const p = m[2];
    if (!ever.has(p)) ever.set(p, { blobs: new Set(), revs: new Set(), first: ts, last: ts });
    const e = ever.get(p);
    e.blobs.add(m[1]);
    e.revs.add(rev);
    if (ts < e.first) e.first = ts;
    if (ts > e.last) e.last = ts;
  }
}

const IGNORE = /^(node_modules\/|\.git\/|scripts\/|tools\/|tests\/|gitrefs\/)/;

const missing = [];
const caseOnly = [];
for (const [p, e] of ever) {
  if (IGNORE.test(p)) continue;
  if (onDisk.has(p)) continue;
  const actual = onDiskLower.get(p.toLowerCase());
  if (actual) {
    caseOnly.push({ p, actual, e });
  } else {
    missing.push({ p, e });
  }
}

const fmtDate = (ts) => new Date(ts * 1000).toISOString().slice(0, 10);

say('ORBIT-X — paths that existed in git history but are absent from the working tree');
say('Generated: ' + new Date().toISOString());
say('Paths ever seen: ' + ever.size + '   On disk: ' + onDisk.size);
say('');
say(`== MISSING ENTIRELY (${missing.length}) ==`);
missing
  .sort((a, b) => a.p.localeCompare(b.p))
  .forEach(({ p, e }) => {
    say(`  ${p.padEnd(58)} blobs=${e.blobs.size} revs=${e.revs.size} ${fmtDate(e.first)}..${fmtDate(e.last)}`);
  });

say('');
say(`== PRESENT BUT DIFFERENT CASE (${caseOnly.length}) ==`);
caseOnly
  .sort((a, b) => a.p.localeCompare(b.p))
  .forEach(({ p, actual, e }) => {
    say(`  git="${p}"  disk="${actual}"  revs=${e.revs.size} ${fmtDate(e.first)}..${fmtDate(e.last)}`);
  });

say('');
say('== DISK DIRECTORIES ==');
[...diskDirs].sort().forEach((d) => say('  ' + d));

fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(lines.join('\n'));
