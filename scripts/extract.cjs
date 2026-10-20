// Scratch tool: byte-exact extraction of git blobs/trees to disk (no shell redirection).
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = 'c:\\Users\\divy1\\OneDrive\\Desktop\\Divyansh all codes\\ORBIT-X';
const OUT = path.join(ROOT, 'scripts', 'extract');

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, maxBuffer: 128 * 1024 * 1024 });
}

// Usage: node extract.cjs <rev> <path-in-tree> [outRelativeName]
const [rev, treePath, outName] = process.argv.slice(2);
if (!rev || !treePath) {
  console.error('usage: node extract.cjs <rev> <path> [outName]');
  process.exit(1);
}

const spec = `${rev}:${treePath}`;
const sha = execFileSync('git', ['rev-parse', spec], { cwd: ROOT }).toString().trim();
const buf = git(['cat-file', 'blob', sha]);
const outPath = path.join(OUT, outName || treePath.replace(/\//g, '__'));
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, buf);
console.log(`${spec} -> ${path.relative(ROOT, outPath)} (${buf.length} bytes)`);
