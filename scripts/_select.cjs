// ============================================================================
// ORBIT-X — Candidate selector.
//
// For every target path, collect EVERY distinct blob it ever had, then score
// each candidate on:
//   * encoding quality   (strict UTF-8 decode, mojibake markers)
//   * merge-marker contamination
//   * link resolvability (does each referenced local asset exist on disk?)
//   * completeness       (scene count, headings, script/style wiring)
//   * recency            (newest commit that contained it)
//
// Output: scripts/_allcands.txt  +  scripts/_allcands/<path>__<blob>.<ext>
// ============================================================================

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTDIR = path.join(__dirname, '_allcands');
const OUTTXT = path.join(__dirname, '_allcands.txt');

function git(args, opts = {}) {
  return execFileSync('git', args, {
    cwd: ROOT,
    maxBuffer: 512 * 1024 * 1024,
    encoding: opts.binary ? 'buffer' : 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

const TARGETS = [
  'Story1.html',
  'Story2.html',
  'Story3.html',
  'stories/index.html',
  'script.js',
  'style.css',
  'stories/halloween-lantern.html',
  'stories/dream-beyond-shadows.html',
  'stories/last-wandering-ghost.html',
  'the-night-of-forgotten-treats.html',
];


// ---- on-disk file set (for link resolution) --------------------------------
const onDisk = new Set();
function walk(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const abs = path.join(dir, e.name);
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) walk(abs, r);
    else onDisk.add(r);
  }
}
walk(ROOT, '');
const onDiskLower = new Set([...onDisk].map((p) => p.toLowerCase()));

// ---- all paths that ever existed in git (for link resolution) --------------
const everPaths = new Set();
const revList = git(['rev-list', '--all']).trim().split(/\s+/);
for (const rev of revList) {
  let tree;
  try { tree = git(['ls-tree', '-r', rev]); } catch { continue; }
  for (const line of tree.split('\n')) {
    const m = line.match(/^\d+ blob [0-9a-f]{40}\t(.+)$/);
    if (m) everPaths.add(m[1]);
  }
}
const everLower = new Set([...everPaths].map((p) => p.toLowerCase()));

// ---- build blob -> {revs, first, last} -------------------------------------
const cands = new Map();
for (const t of TARGETS) cands.set(t, new Map());

const revDate = new Map();
for (const rev of revList) {
  try { revDate.set(rev, Number(git(['log', '-1', '--format=%at', rev]).trim()) || 0); }
  catch { revDate.set(rev, 0); }
}

for (const rev of revList) {
  let tree;
  try { tree = git(['ls-tree', '-r', rev]); } catch { continue; }
  const ts = revDate.get(rev) || 0;
  for (const line of tree.split('\n')) {
    const m = line.match(/^(\d+) blob ([0-9a-f]{40})\t(.+)$/);
    if (!m) continue;
    const blob = m[2];
    const p = m[3];
    const map = cands.get(p);
    if (!map) continue;
    if (!map.has(blob)) map.set(blob, { blob, revs: [], first: ts, last: ts });
    const e = map.get(blob);
    e.revs.push(rev);
    if (ts < e.first) e.first = ts;
    if (ts > e.last) e.last = ts;
  }
}


// ---- helpers ---------------------------------------------------------------
const MOJI = /(\u00c3.|â€|\u00c2.|ï»¿|\ufffd|ΓÇ|Γå|├ó|∩┐╜)/g;
const MERGE = /^(<<<<<<<|=======|>>>>>>>)/gm;

function decode(buf) {
  try {
    const s = new TextDecoder('utf-8', { fatal: true }).decode(buf);
    return { text: s, utf8: true };
  } catch {
    return { text: buf.toString('latin1'), utf8: false };
  }
}

function scoreCandidate(target, buf) {
  const { text, utf8 } = decode(buf);
  const s = text;

  const refs = new Set();
  const re = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(s))) {
    const v = m[1].trim();
    if (!v || v.startsWith('#') || /^(https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(v)) continue;
    refs.add(v.split('#')[0].split('?')[0]);
  }

  let resolved = 0, gitOnly = 0, missing = 0;
  const missingList = [];
  const base = path.posix.dirname(target);
  for (const r of refs) {
    const abs = r.startsWith('/') ? r.slice(1) : path.posix.normalize(path.posix.join(base, r));
    if (onDisk.has(abs) || onDiskLower.has(abs.toLowerCase())) { resolved++; continue; }
    if (everPaths.has(abs) || everLower.has(abs.toLowerCase())) { gitOnly++; continue; }
    missing++;
    missingList.push(r);
  }

  const title = ((s.match(/<title>([^<]*)<\/title>/i) || [])[1] || '').trim();
  const h1 = ((s.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '').replace(/<[^>]+>/g, '').trim();
  const sceneCards = (s.match(/scene-card/gi) || []).length;

  return {
    bytes: buf.length,
    utf8,
    mojibakeHits: (s.match(MOJI) || []).length,
    mergeHits: (s.match(MERGE) || []).length,
    refs: refs.size,
    resolved,
    gitOnly,
    missing,
    missingList,
    title,
    h1: h1.slice(0, 60),
    h2s: (s.match(/<h2/gi) || []).length,
    paras: (s.match(/<p[\s>]/gi) || []).length,
    sceneCards,
  };
}


// ---- run -------------------------------------------------------------------
fs.rmSync(OUTDIR, { recursive: true, force: true });
fs.mkdirSync(OUTDIR, { recursive: true });

const L = [];
const say = (s) => L.push(s === undefined ? '' : s);
const fmtD = (ts) => new Date(ts * 1000).toISOString().slice(0, 10);

say('ORBIT-X candidate selector — ' + new Date().toISOString());
say('');

for (const t of TARGETS) {
  const map = cands.get(t);
  if (!map || map.size === 0) { say(`### ${t}  -- NO HISTORY`); say(''); continue; }
  say(`### ${t}  (${map.size} distinct blobs)`);
  say('    blob        bytes  utf8 moji mrg  ref res git mis  lastseen  title');
  const rows = [];
  for (const [blob, e] of map) {
    const buf = git(['cat-file', '-p', blob], { binary: true });
    const sc = scoreCandidate(t, buf);
    const ext = path.extname(t) || '.txt';
    const safe = t.replace(/[\\/]/g, '__');
    fs.writeFileSync(path.join(OUTDIR, `${safe}__${blob}${ext}`), buf);
    rows.push({ blob, e, sc });
  }
  rows.sort((a, b) => (b.e.last - a.e.last) || (b.sc.bytes - a.sc.bytes));
  for (const { blob, e, sc } of rows) {
    say(
      `    ${blob.slice(0, 10)}  ${String(sc.bytes).padStart(6)}  ${sc.utf8 ? 'Y' : 'N'}    ${String(sc.mojibakeHits).padStart(3)} ${String(sc.mergeHits).padStart(3)}  ${String(sc.refs).padStart(3)} ${String(sc.resolved).padStart(3)} ${String(sc.gitOnly).padStart(3)} ${String(sc.missing).padStart(3)}  ${fmtD(e.last)}  "${sc.title.slice(0, 34)}" h2=${sc.h2s} p=${sc.paras} sc=${sc.sceneCards}`
    );
    if (sc.missing) say(`         missing: ${sc.missingList.join(', ')}`);
    if (sc.mojibakeHits) say(`         MOJIBAKE x${sc.mojibakeHits}`);
    if (sc.mergeHits) say(`         MERGE MARKERS x${sc.mergeHits}`);
  }
  say('');
}

fs.writeFileSync(OUTTXT, L.join('\n'), 'utf8');
console.log('written ' + OUTTXT);
