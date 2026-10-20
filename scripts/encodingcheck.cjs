// Scratch tool: detect mojibake (UTF-8 bytes misread as Windows-1252/Latin-1)
// across site text files, and report the exact repair for each hit.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'gitrefs', 'tests', 'tools', 'scripts']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
    } else if (/\.(html|css|js|md|json)$/.test(entry.name)) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

// Latin-1 / Windows-1252 -> Unicode
const CP1252 = {
  0x80: '\u20AC', 0x82: '\u201A', 0x83: '\u0192', 0x84: '\u201E', 0x85: '\u2026',
  0x86: '\u2020', 0x87: '\u2021', 0x88: '\u02C6', 0x89: '\u2030', 0x8A: '\u0160',
  0x8B: '\u2039', 0x8C: '\u0152', 0x8E: '\u017D', 0x91: '\u2018', 0x92: '\u2019',
  0x93: '\u201C', 0x94: '\u201D', 0x95: '\u2022', 0x96: '\u2013', 0x97: '\u2014',
  0x98: '\u02DC', 0x99: '\u2122', 0x9A: '\u0161', 0x9B: '\u203A', 0x9C: '\u0153',
  0x9E: '\u017E', 0x9F: '\u0178',
};

function fromLatin1(bytes) {
  return bytes.map((b) => (CP1252[b] !== undefined ? CP1252[b] : String.fromCharCode(b)));
}

// Detect a run of bytes that decode to a "mojibake signature" (e.g. â€™ -> ’)
const MOJIBAKE_SIGNATURE = /[ÂÃâ][-¿€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œž�]/;

function repair(text) {
  // Round-trip: encode text as latin1 bytes, then reinterpret as cp1252 -> utf8
  const bytes = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp > 0xff) return null; // cannot be pure latin1
    bytes.push(cp);
  }
  const decoded = Buffer.from(bytes).toString('latin1');
  const fixed = Buffer.from(decoded, 'latin1').toString('utf8');
  return fixed;
}

let total = 0;
for (const file of walk(ROOT).sort()) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const buf = fs.readFileSync(file);
  const text = buf.toString('utf8');
  const lines = text.split(/\r?\n/);
  let hits = 0;
  lines.forEach((line, i) => {
    if (!MOJIBAKE_SIGNATURE.test(line) && !line.includes('\uFFFD')) return;
    const fixed = repair(line);
    hits++;
    console.log(`${rel}:${i + 1}`);
    console.log('   raw   : ' + JSON.stringify(line.trim().slice(0, 160)));
    console.log('   fixed : ' + JSON.stringify(fixed ? fixed.trim().slice(0, 160) : '<undecodable>'));
  });
  if (hits) {
    total += hits;
    console.log(`  -> ${rel}: ${hits} suspect line(s)`);
  }
}
console.log('\nTotal suspect lines: ' + total);

