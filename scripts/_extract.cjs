const { execSync } = require('child_process');
const fs = require('fs');

const targets = [
  ['cf70857^:Story1.html', 'scripts/_hist_Story1.html'],
  ['cf70857^:Story2.html', 'scripts/_hist_Story2.html'],
  ['cf70857^:Story3.html', 'scripts/_hist_Story3.html'],
  ['920db02:stories/dream-beyond-shadows.html', 'scripts/_hist_stories_dream-beyond-shadows.html'],
  ['920db02:stories/index.html', 'scripts/_hist_stories_index.html'],
  ['69984c2:Story2.html', 'scripts/_hist_69984c2_Story2.html'],
  ['a62b62:Story2.html', 'scripts/_hist_a62b62_Story2.html'],
];

for (const [spec, out] of targets) {
  try {
    const buf = execSync('git cat-file -p "' + spec + '"', { maxBuffer: 1e8 });
    fs.writeFileSync(out, buf);
    console.log(out, buf.length, 'bytes');
  } catch (e) {
    console.log(out, 'FAILED', spec);
  }
}
