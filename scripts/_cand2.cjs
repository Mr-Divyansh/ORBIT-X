const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const revs = execSync('git --no-pager rev-list --all', { cwd: process.cwd(), maxBuffer: 1e8 })
  .toString().trim().split(/\s+/);

const targets = ['Story1.html', 'Story2.html', 'Story3.html', 'stories/index.html'];
const out = [];

function gitFile(rev, p) {
  try {
    return execSync(`git cat-file -p ${rev}:${p}`, { cwd: process.cwd(), maxBuffer: 1e8 });
  } catch (e) { return null; }
}

const map = {};
for (const rev of revs) {
  for (const t of targets) {
    const buf = gitFile(rev, t);
    if (!buf) continue;
    if (!map[t]) map[t] = {};
    const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10);
    if (map[t][hash]) { map[t][hash].revs.push(rev.slice(0, 7)); continue; }
    const s = buf.toString('utf8');
    const conflict = /^(<{7}|={7}|>{7})/m.test(s);
    const moji = (s.match(/Ã|â€|Γ|�/g) || []).length;
    const title = (s.match(/<title>([^<]*)<\/title>/i) || [])[1] || '';
    const h1 = [...s.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
    const links = [...new Set([...s.matchAll(/href="([^"#][^"]*)"/g)].map(m => m[1]))];
    const css = [...new Set([...s.matchAll(/href="([^"]*\.css)"/g)].map(m => m[1]))];
    const js = [...new Set([...s.matchAll(/src="([^"]*\.js)"/g)].map(m => m[1]))];
    const imgs = [...new Set([...s.matchAll(/src="([^"]*\.(?:png|jpe?g|svg|webp))"/g)].map(m => m[1]))];
    map[t][hash] = { len: s.length, conflict, moji, title, h1, links, css, js, imgs, revs: [rev.slice(0, 7)] };
  }
}

for (const t of targets) {
  out.push(`\n========== ${t} ==========`);
  if (!map[t]) { out.push('  (never existed)'); continue; }
  for (const [hash, v] of Object.entries(map[t])) {
    out.push(`  -- blob ${hash} len=${v.len} conflict=${v.conflict} moji=${v.moji} revs=${v.revs.join(',')}`);
    out.push(`     title: ${v.title}`);
    out.push(`     h1: ${JSON.stringify(v.h1)}`);
    out.push(`     css : ${v.css.join(' | ')}`);
    out.push(`     js  : ${v.js.join(' | ')}`);
    out.push(`     links: ${v.links.join(' | ')}`);
    out.push(`     imgs: ${v.imgs.join(' | ')}`);
  }
}

fs.writeFileSync(path.join(__dirname, '_cand2.txt'), out.join('\n'), 'utf8');
console.log('written _cand2.txt');
