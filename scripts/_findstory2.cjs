const { execSync } = require('child_process');

const revs = execSync('git rev-list --all', { maxBuffer: 1e8 })
  .toString('utf8')
  .split('\n')
  .filter(Boolean);

const needles = ['storyGrid', 'sceneDots', 'currentCount', 'S2 S1', 'replayBtn'];

for (const rev of revs) {
  let tree;
  try {
    tree = execSync(`git ls-tree -r --name-only ${rev}`, { maxBuffer: 1e8 }).toString('utf8');
  } catch (e) {
    continue;
  }
  const candidates = tree
    .split('\n')
    .filter((f) => /\.(js|html)$/i.test(f) && !/^node_modules/.test(f));
  for (const file of candidates) {
    let blob;
    try {
      blob = execSync(`git cat-file -p ${rev}:${file}`, { maxBuffer: 1e8 }).toString('utf8');
    } catch (e) {
      continue;
    }
    const hits = needles.filter((n) => blob.includes(n));
    if (hits.length >= 2) {
      console.log(rev.slice(0, 8), file, hits.join(','));
    }
  }
}
