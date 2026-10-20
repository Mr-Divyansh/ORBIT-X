const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const commits = execSync('git --no-pager log --all --oneline --format="%h %ad %s" --date=short -- "Story1.html" "Story2.html" "Story3.html" "stories/index.html" "js/script.js" "css/pages.css"', { cwd: ROOT, maxBuffer: 1e8 })
  .toString().trim().split('\n');

const files = ['Story1.html', 'Story2.html', 'Story3.html', 'stories/index.html', 'css/pages.css', 'js/script.js'];
const out = [];
for (const line of commits) {
  const [h, ...rest] = line.split(' ');
  out.push('\n=== ' + line);
  for (const f of files) {
    try {
      const blob = execSync(`git rev-parse ${h}:${f}`, { cwd: ROOT }).toString().trim();
      const sz = execSync(`git cat-file -s ${blob}`, { cwd: ROOT }).toString().trim();
      const t = execSync(`git cat-file -p ${blob}`, { cwd: ROOT, maxBuffer: 1e8 }).toString('utf8');
      const conflict = /^(<{7} |={7}\n|>{7} )/m.test(t) || t.includes('<<<<<<< ');
      const moji = (t.match(/Ã.|â€|Î.|Ð.|Ñ./g) || []).length;
      out.push(`   ${f}  ${blob.slice(0, 10)} size=${sz} conflict=${conflict} moji=${moji}`);
    } catch (e) { out.push(`   ${f}  -`); }
  }
}
fs.writeFileSync(path.join(__dirname, '_lineage.txt'), out.join('\n'), 'utf8');
console.log('ok');
