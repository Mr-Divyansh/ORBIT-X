// ============================================================================
// ORBIT-X — Historical file recovery scanner.
//
// Walks EVERY git object (reachable + dangling) and scores candidate blobs
// for the production files that are currently missing / broken:
//   Story1.html, Story2.html, Story3.html, stories/index.html, script.js
//
// Writes UTF-8 output to scripts/_recover-report.txt (never through a shell
// redirection, which mangles the file into UTF-16 on Windows).
// ============================================================================

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, '_recover-report.txt');

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

// --- 1. Every blob in the object database -----------------------------------
const allObjects = git(['cat-file', '--batch-all-objects', '--batch-check=%(objectname) %(objecttype) %(objectsize)'])
  .split('\n')
  .filter(Boolean)
  .map((l) => {
    const [oid, type, size] = l.split(' ');
    return { oid, type, size: Number(size) };
  });

const blobs = allObjects.filter((o) => o.type === 'blob');
say(`Total objects: ${allObjects.length}   blobs: ${blobs.length}`);

// --- 2. Which paths did each blob ever occupy? ------------------------------
const revs = git(['rev-list', '--all']).trim().split(/\s+/);
const pathMap = new Map(); // "path|oid" -> {path, oid, revs:[]}

for (const rev of revs) {
  let tree;
  try {
    tree = git(['ls-tree', '-r', rev]);
  } catch {
    continue;
  }
  for (const line of tree.split('\n')) {
    const m = line.match(/^\d+ blob ([0-9a-f]{40})\t(.+)$/);
    if (!m) continue;
    const key = m[2] + '|' + m[1];
    if (!pathMap.has(key)) pathMap.set(key, { path: m[2], oid: m[1], revs: [] });
    pathMap.get(key).revs.push(rev);
  }
}

const dateOf = new Map();
for (const rev of revs) {
  try {
    dateOf.set(rev, Number(git(['log', '-1', '--format=%at', rev]).trim()) || 0);
  } catch {
    dateOf.set(rev, 0);
  }
}


say('');
say('=== PATH -> BLOB HISTORY (targeted paths) ===');
const TARGET_PATHS = [
  'Story1.html', 'Story2.html', 'Story3.html',
  'story1.html', 'story2.html', 'story3.html',
  'stories/index.html', 'script.js', 'js/script.js', 'style (2).css',
];
const lowerPath = new Map();
for (const { path: p, oid, revs: r } of pathMap.values()) {
  const k = p.toLowerCase();
  if (!lowerPath.has(k)) lowerPath.set(k, []);
  lowerPath.get(k).push({ p, oid, r });
}

for (const tp of TARGET_PATHS) {
  const entries = lowerPath.get(tp.toLowerCase()) || [];
  const byOid = new Map();
  for (const e of entries) {
    if (!byOid.has(e.oid)) byOid.set(e.oid, { paths: new Set(), revs: [] });
    byOid.get(e.oid).paths.add(e.p);
    byOid.get(e.oid).revs.push(...e.r);
  }
  say('');
  say(`--- ${tp}  (${byOid.size} distinct blobs) ---`);
  for (const [oid, v] of byOid) {
    const dated = v.revs.map((r) => [r, dateOf.get(r) || 0]).sort((a, b) => b[1] - a[1]);
    const newest = dated[0];
    const oldest = dated[dated.length - 1];
    say(
      `   blob ${oid.slice(0, 10)}  revs=${v.revs.length}  ` +
        `newest=${newest[0].slice(0, 8)}@${new Date(newest[1] * 1000).toISOString().slice(0, 10)}  ` +
        `oldest=${oldest[0].slice(0, 8)}@${new Date(oldest[1] * 1000).toISOString().slice(0, 10)}  ` +
        `paths=${[...v.paths].join(',')}`
    );
  }
}


// --- 3. Score every blob for the story-page quality signals -----------------
const SCENE_ENGINE = ['storyGrid', 'sceneDots', 'prevBtn', 'nextBtn', 'replayBtn', 'currentCount'];
const STORY_MARKERS = ['story-nav', 'read-hero', 'read-scene', 'scene-index', 'library-item'];

function scoreBlob(oid) {
  let buf;
  try {
    buf = git(['cat-file', '-p', oid], { binary: true });
  } catch {
    return null;
  }
  const text = buf.toString('utf8');
  const merge = (text.match(/^<{7} |^={7} |^>{7} /gm) || []).length;
  const hasBom = buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
  const hasNul = buf.subarray(0, 4096).includes(0x00);
  const moji = (text.match(/Ã|â€|â€™|â€œ|ΓÇ|�/g) || []).length;
  const isHtml = /<html/i.test(text.slice(0, 2000));
  const sceneHits = SCENE_ENGINE.filter((n) => text.includes(n)).length;
  const storyHits = STORY_MARKERS.filter((n) => text.includes(n)).length;
  return { text, size: buf.length, merge, hasBom, hasNul, moji, isHtml, sceneHits, storyHits };
}

const pathsByOid = new Map();
for (const { path: p, oid } of pathMap.values()) {
  if (!pathsByOid.has(oid)) pathsByOid.set(oid, new Set());
  pathsByOid.get(oid).add(p);
}

say('');
say('=== SCENE-ENGINE BLOBS (root script.js candidates) ===');
say('   needles: ' + SCENE_ENGINE.join(', '));
const engineHits = [];
for (const { oid } of blobs) {
  const s = scoreBlob(oid);
  if (s && s.sceneHits >= 4) engineHits.push({ oid, ...s });
}
engineHits.sort((a, b) => b.sceneHits - a.sceneHits || a.size - b.size);
for (const h of engineHits) {
  const paths = [...(pathsByOid.get(h.oid) || [])];
  say(
    `   ${h.oid.slice(0, 10)}  size=${String(h.size).padStart(7)}  engineHits=${h.sceneHits}  ` +
      `merge=${h.merge} bom=${h.hasBom} nul=${h.hasNul} moji=${h.moji}  paths=${paths.join(',') || '(unreferenced)'}`
  );
}

say('');
say('=== STORY PAGE BLOBS (Story1/2/3 + stories/index) ===');
const targetFiles = ['Story1.html', 'Story2.html', 'Story3.html', 'stories/index.html'];
const seenTarget = new Set();
for (const { path: p, oid, revs: r } of pathMap.values()) {
  if (!targetFiles.includes(p)) continue;
  const key = p + '|' + oid;
  if (seenTarget.has(key)) continue;
  seenTarget.add(key);
  const s = scoreBlob(oid);
  if (!s) continue;
  const dated = r.map((x) => [x, dateOf.get(x) || 0]).sort((a, b) => b[1] - a[1]);
  say(
    `   ${p.padEnd(20)} ${oid.slice(0, 10)} size=${String(s.size).padStart(6)} ` +
      `merge=${String(s.merge).padStart(3)} bom=${s.hasBom} nul=${s.hasNul} moji=${String(s.moji).padStart(3)} ` +
      `storyHits=${s.storyHits} revs=${r.length} newest=${dated[0][0].slice(0, 8)}@${new Date(dated[0][1] * 1000).toISOString().slice(0, 10)}`
  );
}

fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(lines.join('\n'));
console.log('\nwritten ' + OUT);
