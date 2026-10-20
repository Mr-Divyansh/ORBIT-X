const fs = require('fs');
const files = [
  'index.html', 'Exploration.html', 'about.html', 'Story.html', 'credits.html',
  'login.html', 'projects/dream-guardians.html', 'projects/ghost-catchers.html',
  'projects/halloween-helpers.html', 'games.html', 'ghost-hunt.html', 'story2.html',
];
const out = [];
for (const f of files) {
  const t = fs.readFileSync(f, 'utf8');
  const ids = [...t.matchAll(/\sid=["']([^"']+)["']/g)].map((m) => m[1]);
  out.push(f + ' :: ' + ids.join(', '));
}
fs.writeFileSync('scripts/_ids.txt', out.join('\n'), 'utf8');
console.log('ok');