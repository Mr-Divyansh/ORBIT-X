// Map every historical revision of the story pages to their blob hash, then
// score each candidate (merge markers, encoding, dependency completeness).
const { execFileSync } = require('child_process');
const fs = require('fs');

function git(args, opts = {}) {
  return execFileSync('git', args, {
    maxBuffer: 1e8,
    encoding: opts.binary ? 'buffer' : 'utf8',
  });
}

const TARGETS = [
  'Story1.html',
  'Story2.html',
  'Story3.html',
  'stories/index.html',
  'stories/dream-beyond-shadows.html',
  'stories/halloween-lantern.html',
  'stories/last-wandering-ghost.html',
  'script.js',
  'style (2).css',
];

const revs = git(['log', '--all', '--format=%H|%at']).split('\n').filter(Boolean).map((l) => { const p = l.split('|'); return { rev: p[0], ts: parseInt(p[1], 10) }; });
const seen = new Map(); // "path|blob" -> {path, blob, revs:[]}

for (const { rev, ts } of revs) {
  let tree;
  try {
    tree = git(['ls-tree', '-r', '--name-only', rev]);
  } catch {
    continue;
  }
  const files = tree.split('\n');
  for (const target of TARGETS) {
    if (!files.includes(target)) continue;
    const l = git(['ls-tree', rev, '--', target]).trim();
    const m = l.match(/\sblob ([0-9a-f]{40})\t/);
    if (!m) continue;
    const key = target + '|' + m[1];
    if (!seen.has(key)) seen.set(key, { path: target, blob: m[1], revs: [] });
    seen.get(key).revs.push({ rev, ts });
  }
}

const out = [];
for (const { path, blob, revs: r } of seen.values()) {
  let buf;
  try {
    buf = git(['cat-file', '-p', blob], { binary: true });
  } catch {
    continue;
  }
  const text = buf.toString('utf8');
  const mergeMarkers = /^(<{7}|={7}|>{7})/m.test(text);
  const hasBom = buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
  const hasNul = buf.subarray(0, 4096).includes(0x00);
  const mojibake = /Ã¢â‚¬|Ãƒ.|Ã‚./.test(text);
  const refs = [
    ...new Set(
      [...text.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)]
        .map((m) => m[1])
        .filter((x) => !/^(https?:|mailto:|tel:|javascript:|data:|#)/i.test(x))
    ),
  ];
  const newest = r.reduce((a, b) => (b.ts > a.ts ? b : a));
  const oldest = r.reduce((a, b) => (b.ts < a.ts ? b : a));
  out.push({
    path,
    blob,
    size: buf.length,
    revCount: r.length,
    newestRev: newest.rev.slice(0, 8),
    newestDate: new Date(newest.ts * 1000).toISOString().slice(0, 10),
    oldestRev: oldest.rev.slice(0, 8),
    oldestDate: new Date(oldest.ts * 1000).toISOString().slice(0, 10),
    mergeMarkers,
    hasBom,
    hasNul,
    mojibake,
    refs,
  });
}

out.sort((a, b) => a.path.localeCompare(b.path) || b.newestDate.localeCompare(a.newestDate));
fs.writeFileSync('scripts/_story-candidates.json', JSON.stringify(out, null, 2), 'utf8');
for (const o of out) {
  console.log(
    [
      o.path.padEnd(34),
      o.blob.slice(0, 8),
      String(o.size).padStart(7),
      o.newestDate,
      o.oldestDate,
      'n=' + o.revCount,
      o.mergeMarkers ? 'MERGE!' : '',
      o.hasBom ? 'BOM' : '',
      o.hasNul ? 'NUL' : '',
      o.mojibake ? 'MOJI' : '',
    ].join(' ')
  );
}

