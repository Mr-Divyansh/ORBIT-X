const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rev = process.argv[2] || 'a62b624';
const files = ['Story1.html', 'Story2.html', 'Story3.html', 'stories/index.html'];
const outdir = path.join(__dirname, '_restore');
fs.mkdirSync(outdir, { recursive: true });

for (const f of files) {
  let buf;
  try {
    buf = execSync(`git cat-file -p ${rev}:${f}`, { cwd: path.resolve(__dirname, '..'), maxBuffer: 1e8 });
  } catch (e) { console.log('MISSING ' + f); continue; }
  const out = path.join(outdir, rev + '__' + f.replace(/\//g, '__'));
  fs.writeFileSync(out, buf);
  console.log('wrote ' + out + ' (' + buf.length + ' bytes)');
}
