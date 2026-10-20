// Scan all git revisions for files that could hold the Story 2 scene-grid logic.
const { execFileSync } = require('child_process');
const fs = require('fs');

const OUT = __dirname + '/../scripts/hist-scan.txt';
const log = (s) => fs.appendFileSync(OUT, s + '\n', 'utf8');
fs.writeFileSync(OUT, '', 'utf8');

const revs = execFileSync('git', ['rev-list', '--all'], { encoding: 'utf8' })
  .trim()
  .split('\n');
log('total revs ' + revs.length);

const treeCache = new Map();
const listFiles = (r) => {
  if (treeCache.has(r)) return treeCache.get(r);
  let files = [];
  try {
    files = execFileSync('git', ['ls-tree', '-r', '--name-only', r], { encoding: 'utf8' })
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  } catch (e) {
    files = [];
  }
  treeCache.set(r, files);
  return files;
};

// 1) Which revisions contain a root-level script.js or any story2-ish file?
for (const r of revs) {
  const hits = listFiles(r).filter(
    (x) => /(^|\/)script\.js$/i.test(x) || /story2|ghost-purif/i.test(x)
  );
  if (hits.length) log('TREE ' + r.slice(0, 8) + ' ' + JSON.stringify(hits));
}

// 2) Content search: which blob ever mentions storyGrid / sceneDots / replayBtn?
const seen = new Set();
for (const r of revs) {
  for (const f of listFiles(r)) {
    if (!/\.(js|html)$/i.test(f)) continue;
    const key = f;
    if (seen.has(key)) continue;
    let content = '';
    try {
      content = execFileSync('git', ['show', `${r}:${f}`], {
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
      });
    } catch (e) {
      continue;
    }
    if (/storyGrid|sceneDots|replayBtn|currentCount/.test(content)) {
      seen.add(key);
      log('CONTENT HIT ' + f + ' @ ' + r.slice(0, 8));
    }
  }
}
log('DONE');
