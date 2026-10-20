// Scratch tool: inventory every local href/src target in the site.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'gitrefs', 'tests', 'tools', 'scripts']);
const SKIP_FILE = /^(tmp_|gitref_|scratch_)/;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
    } else if (entry.name.endsWith('.html')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

const files = walk(ROOT).sort();
const seen = new Set();
for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (SKIP_FILE.test(rel)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);
  const refs = [];
  const re = /(?:href|src)\s*=\s*(["'])(.*?)\1/gi;
  let m;
  while ((m = re.exec(html))) {
    refs.push(m[2]);
  }
  console.log('### ' + rel);
  const uniq = [...new Set(refs)];
  for (const ref of uniq) {
    if (/^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(ref)) {
      console.log(`    [ext] ${ref}`);
      continue;
    }
    const [p, hash] = ref.split('#');
    let target;
    if (p === '') {
      target = file;
    } else {
      target = path.resolve(dir, p);
    }
    let status = 'MISSING';
    if (fs.existsSync(target)) {
      status = fs.statSync(target).isDirectory() ? 'DIR' : 'ok';
    }
    console.log(`    [${status}] ${ref}  ->  ${path.relative(ROOT, target).replace(/\\/g, '/')}`);
    if (hash && status === 'ok' && /\.html$/i.test(target)) {
      const th = fs.readFileSync(target, 'utf8');
      const ids = new Set();
      const idRe = /\sid\s*=\s*(["'])(.*?)\1/gi;
      let im;
      while ((im = idRe.exec(th))) ids.add(im[2]);
      const nameRe = /<a[^>]*\sname\s*=\s*(["'])(.*?)\1/gi;
      while ((im = nameRe.exec(th))) ids.add(im[2]);
      if (!ids.has(hash)) {
        console.log(`        !! missing anchor #${hash} in ${path.relative(ROOT, target).replace(/\\/g, '/')}`);
        seen.add(`${rel} -> ${ref}`);
      }
    }
  }
}
console.log('\nTotal anchor failures: ' + seen.size);
