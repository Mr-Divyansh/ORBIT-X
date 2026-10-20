// Extract candidate story-page blobs for side-by-side inspection.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTDIR = path.join(__dirname, '_cand3');
fs.mkdirSync(OUTDIR, { recursive: true });

const CANDIDATES = {
  'Story1__48f34a794b': '48f34a794b',
  'Story1__9ee68a4936': '9ee68a4936',
  'Story1__0228ac91eb': '0228ac91eb',
  'Story1__5d41b9bb86': '5d41b9bb86',
  'Story1__566f26641e': '566f26641e',
  'Story2__fa261cf752': 'fa261cf752',
  'Story2__dffd9b3667': 'dffd9b3667',
  'Story2__130c45d71a': '130c45d71a',
  'Story3__3a47f1482b': '3a47f1482b',
  'Story3__3889ee3cab': '3889ee3cab',
  'Story3__a8c10236c1': 'a8c10236c1',
  'stories-index__e07d17e530': 'e07d17e530',
  'stories-index__e4be19a692': 'e4be19a692',
  'stories-index__2d0dad0904': '2d0dad0904',
  'stories-index__44a323b1c9': '44a323b1c9',
};

const report = [];
for (const [name, short] of Object.entries(CANDIDATES)) {
  const full = execFileSync('git', ['rev-parse', short], { cwd: ROOT, encoding: 'utf8' }).trim();
  const buf = execFileSync('git', ['cat-file', '-p', full], { cwd: ROOT, maxBuffer: 1e8, encoding: 'buffer' });
  const file = path.join(OUTDIR, name + '.html');
  fs.writeFileSync(file, buf);
  const text = buf.toString('utf8');
  const refs = [...new Set([...text.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]))];
  const local = refs.filter((r) => !/^(https?:|mailto:|tel:|javascript:|data:|#|\/\/)/i.test(r));
  const title = (text.match(/<title>([^<]*)<\/title>/i) || [])[1] || '';
  const h1 = [...text.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => m[1].replace(/<[^>]+>/g, '').trim().slice(0, 90));
  report.push(
    `${name.padEnd(30)} size=${String(buf.length).padStart(6)}  title="${title}"\n` +
      `   h1: ${JSON.stringify(h1)}\n` +
      `   localRefs: ${local.join(' | ')}`
  );
}
fs.writeFileSync(path.join(__dirname, '_cand3.txt'), report.join('\n\n'), 'utf8');
console.log(report.join('\n\n'));
