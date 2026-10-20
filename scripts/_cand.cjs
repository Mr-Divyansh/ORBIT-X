const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const out = [];
const say = (s) => out.push(s === undefined ? '' : s);

function show(rev, file) {
  let t;
  try {
    t = execSync(`git cat-file -p ${rev}:${file}`, { maxBuffer: 1e8 }).toString('utf8');
  } catch (e) {
    say(`  !! ${rev}:${file} -> ${e.message.split('\n')[0]}`);
    return;
  }
  const title = (t.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1].trim();
  const h1 = [...t.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
  const h2 = [...t.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
  const links = [...new Set([...t.matchAll(/href=["']([^"']+)["']/g)].map((m) => m[1])
    .filter((x) => !/^(https?:|mailto:|#|tel:|javascript:)/i.test(x)))];
  const styles = [...new Set([...t.matchAll(/<link[^>]*href=["']([^"']+\.css)["']/g)].map((m) => m[1]))];
  const scripts = [...new Set([...t.matchAll(/<script[^>]*src=["']([^"']+)["']/g)].map((m) => m[1]))];
  const imgs = [...new Set([...t.matchAll(/<img[^>]*src=["']([^"']+)["']/g)].map((m) => m[1]))];
  say(`  ${rev}:${file}  len=${t.length}`);
  say(`     title: ${title}`);
  say(`     h1: ${JSON.stringify(h1)}`);
  say(`     h2: ${JSON.stringify(h2)}`);
  say(`     css : ${styles.join(' | ')}`);
  say(`     js  : ${scripts.join(' | ')}`);
  say(`     links: ${links.join(' | ')}`);
  say(`     imgs: ${imgs.join(' | ')}`);
}

// Commits where the files existed
say('=== candidate revisions ===');
for (const rev of ['920db02', 'bbc87aa', 'aae2e1f', '4ef9070', '3217186', 'cf70857', 'HEAD']) {
  say(`--- ${rev} ---`);
  for (const f of ['Story1.html', 'Story2.html', 'Story3.html', 'stories/index.html',
    'stories/halloween-lantern.html', 'stories/dream-beyond-shadows.html', 'stories/last-wandering-ghost.html']) {
    show(rev, f);
  }
}

fs.writeFileSync(path.join(__dirname, '_cand.txt'), out.join('\n'), 'utf8');
console.log('ok');
