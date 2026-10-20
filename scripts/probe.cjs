// Scratch probe: dump the raw bytes of specific file regions and search git
// history for the original (pre-corruption) text.
const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'probe-out.txt');
const out = [];
const say = (s) => out.push(String(s));

// 1) Raw bytes for css/exploration2.css line 2
{
  const t = fs.readFileSync(path.join(ROOT, 'css/exploration2.css'), 'utf8').split(/\r?\n/);
  say('== exploration2.css line 2 ==');
  say(JSON.stringify(t[1]));
  say('bytes: ' + Array.from(Buffer.from(t[1], 'utf8')).map((c) => c.toString(16).padStart(2, '0')).join(' '));
}

// 2) Git history for about.html: find the revision where the line was clean
{
  say('');
  say('== about.html history ==');
  const revs = execFileSync('git', ['log', '--all', '--format=%H', '--', 'about.html'], {
    encoding: 'utf8',
    cwd: ROOT,
  })
    .trim()
    .split('\n')
    .filter(Boolean);
  say('revisions touching about.html: ' + revs.length);
  for (const r of revs) {
    let content = '';
    try {
      content = execFileSync('git', ['show', `${r}:about.html`], {
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
        cwd: ROOT,
      });
    } catch (e) {
      continue;
    }
    const hasBad = content.includes('\uFFFD');
    const m = content.match(/Divyansh.{0,4}s twisted wand/);
    const m2 = content.match(/Divyansh.{0,4}s signature gadget/);
    say(`${r.slice(0, 8)} fffd=${hasBad} "${m ? m[0] : '-'}" "${m2 ? m2[0] : '-'}"`);
  }
}

// 3) Git history for exploration2.css
{
  say('');
  say('== exploration2.css history ==');
  const revs = execFileSync('git', ['log', '--all', '--format=%H', '--', 'css/exploration2.css'], {
    encoding: 'utf8',
    cwd: ROOT,
  })
    .trim()
    .split('\n')
    .filter(Boolean);
  for (const r of revs) {
    let content = '';
    try {
      content = execFileSync('git', ['show', `${r}:css/exploration2.css`], {
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
        cwd: ROOT,
      });
    } catch (e) {
      continue;
    }
    const l2 = content.split(/\r?\n/)[1] || '';
    say(`${r.slice(0, 8)} ${JSON.stringify(l2.slice(0, 90))}`);
  }
}

// 4) Which files reference Story1.html / Story2.html / Story3.html
{
  say('');
  say('== references to Story1/2/3.html ==');
  const walk = (d, acc = []) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === '.git' || e.name === 'scripts') continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p, acc);
      else acc.push(p);
    }
    return acc;
  };
  for (const f of walk(ROOT)) {
    if (!/\.(html|js|css|md)$/i.test(f)) continue;
    const t = fs.readFileSync(f, 'utf8');
    t.split(/\r?\n/).forEach((line, i) => {
      if (/Story[123]\.html/i.test(line)) {
        say(`${path.relative(ROOT, f).replace(/\\/g, '/')}:${i + 1}  ${line.trim().slice(0, 160)}`);
      }
    });
  }
}

fs.writeFileSync(OUT, out.join('\n'), 'utf8');
console.log('probe written');
