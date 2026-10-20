// Scratch tool: print code points around suspected mojibake characters.
const fs = require('fs');

const files = process.argv.slice(2);
for (const f of files) {
  const buf = fs.readFileSync(f);
  const text = buf.toString('utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    const chars = [...line];
    chars.forEach((c, ci) => {
      const cp = c.codePointAt(0);
      const bad = cp === 0xfffd || (cp >= 0xc2 && cp <= 0xf4);
      if (!bad) return;
      const window = chars.slice(Math.max(0, ci - 1), ci + 4)
        .map((x) => 'U+' + x.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'))
        .join(' ');
      console.log(`${f}:${i + 1} col${ci} -> ${window}`);
    });
  });
}
