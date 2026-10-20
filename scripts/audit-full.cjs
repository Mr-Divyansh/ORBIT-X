// ============================================================================
// ORBIT-X — Link / anchor / casing / encoding audit.
//
// Writes UTF-8 output directly to scripts/audit-report.txt (never through a
// shell redirection, which mangles the file into UTF-16 on Windows).
//
// Checks performed
//   1. MISSING TARGET  – href/src that resolves to a non-existent path.
//   2. CASE MISMATCH   – the path exists only with different letter case.
//                        Fatal on Linux / Vercel (case-sensitive filesystem).
//   3. MISSING ANCHOR  – a "#id" fragment with no matching id="…".
//   4. MOJIBAKE        – UTF-8 text that was decoded as Windows-1252.
//   5. BOM / ENCODING  – files with a UTF-8 BOM or a non-UTF-8 encoding.
// ============================================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'audit-report.txt');

const SKIP_DIRS = new Set(['node_modules', '.git', 'gitrefs', 'tests', 'tools', 'scripts']);

const lines = [];
const say = (s = '') => lines.push(s);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
    } else {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

// --- Case-insensitive index of every file on disk -------------------------
const allFiles = walk(ROOT);
const lowerIndex = new Map(); // lowercased relative path -> actual relative path
for (const f of allFiles) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  lowerIndex.set(rel.toLowerCase(), rel);
}

// --- Files under audit ----------------------------------------------------
const htmlFiles = allFiles.filter((f) => f.endsWith('.html'));
const textFiles = allFiles.filter((f) => /\.(html|css|js|json|md)$/i.test(f));

const missing = [];
const caseMismatch = [];
const missingAnchor = [];

const EXT_REF = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;
const ID_RE = (id) =>
  new RegExp('id=["\']' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\']');

for (const file of htmlFiles) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const txt = fs.readFileSync(file, 'utf8');

  const bodyMatch = txt.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyScope = bodyMatch ? bodyMatch[1] : txt;

  let m;
  const re = new RegExp(EXT_REF.source, 'gi');
  while ((m = re.exec(txt))) {
    const ref = m[1].trim();
    if (!ref) continue;
    const line = txt.slice(0, m.index).split('\n').length;

    // Pure in-page fragment.
    if (ref.startsWith('#')) {
      const id = ref.slice(1);
      if (id && !ID_RE(id).test(bodyScope)) {
        missingAnchor.push(`${rel}:${line} "${ref}"`);
      }
      continue;
    }
    // External / mailto / tel / javascript / data / protocol-relative.
    if (/^(https?:|mailto:|tel:|javascript:|data:|\/\/)/i.test(ref)) continue;

    const [p, hash] = ref.split('#');
    if (!p) continue;

    const target = path.resolve(path.dirname(file), p);
    if (!fs.existsSync(target)) {
      // Does it exist with a different case?
      const relTarget = path.relative(ROOT, target).replace(/\\/g, '/');
      const actual = lowerIndex.get(relTarget.toLowerCase());
      if (actual && actual !== relTarget) {
        caseMismatch.push(`${rel}:${line} "${ref}"  ->  on disk: "${actual}"`);
      } else {
        missing.push(`${rel}:${line} "${ref}"`);
      }
      continue;
    }

    // Fragment on an existing local file.
    if (hash && fs.statSync(target).isFile()) {
      const t = fs.readFileSync(target, 'utf8');
      if (!ID_RE(hash).test(t)) {
        missingAnchor.push(`${rel}:${line} "${ref}"`);
      }
    }
  }
}


// --- Encoding / mojibake -------------------------------------------------
const CP1252 = {
  0x80: '\u20AC', 0x82: '\u201A', 0x83: '\u0192', 0x84: '\u201E', 0x85: '\u2026',
  0x86: '\u2020', 0x87: '\u2021', 0x88: '\u02C6', 0x89: '\u2030', 0x8A: '\u0160',
  0x8B: '\u2039', 0x8C: '\u0152', 0x8E: '\u017D', 0x91: '\u2018', 0x92: '\u2019',
  0x93: '\u201C', 0x94: '\u201D', 0x95: '\u2022', 0x96: '\u2013', 0x97: '\u2014',
  0x98: '\u02DC', 0x99: '\u2122', 0x9A: '\u0161', 0x9B: '\u203A', 0x9C: '\u0153',
  0x9E: '\u017E', 0x9F: '\u0178',
};
const MOJIBAKE_SIGNATURE =
  /[\u00C2\u00C3\u00E2][\u0080-\u00BF\u20AC\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u017D\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u017E\u0178]/;

// Re-encode the mis-decoded text back to its original bytes, then read those
// bytes as UTF-8. The inverse of "UTF-8 bytes read as Windows-1252".
function repairLatin1(text) {
  const bytes = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp > 0xff) return null;
    bytes.push(CP1252[cp] !== undefined ? Buffer.from(CP1252[cp], 'utf8')[0] : cp);
  }
  return Buffer.from(bytes).toString('utf8');
}

const mojibake = [];
const encoding = [];

for (const file of textFiles) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const buf = fs.readFileSync(file);

  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    encoding.push(`${rel}  (UTF-8 BOM)`);
  }
  // A NUL byte in the first 4 KB means it is almost certainly UTF-16.
  if (buf.subarray(0, 4096).includes(0x00)) {
    encoding.push(`${rel}  (UTF-16 / NUL bytes detected)`);
    continue;
  }

  const text = buf.toString('utf8');
  text.split(/\r?\n/).forEach((line, i) => {
    if (!MOJIBAKE_SIGNATURE.test(line) && !line.includes('\uFFFD')) return;
    const fixed = repairLatin1(line);
    mojibake.push(
      `${rel}:${i + 1}\n    raw  : ${JSON.stringify(line.trim().slice(0, 140))}\n` +
        `    fixed: ${JSON.stringify(fixed ? fixed.trim().slice(0, 140) : '<undecodable>')}`
    );
  });
}

// --- Report ---------------------------------------------------------------
say(`ORBIT-X link / anchor / encoding audit`);
say(`Generated: ${new Date().toISOString()}`);
say(`HTML files: ${htmlFiles.length}`);
say('');
say(`== MISSING TARGET (${missing.length}) ==`);
missing.forEach((x) => say('  ' + x));
say('');
say(`== CASE MISMATCH (${caseMismatch.length}) ==`);
caseMismatch.forEach((x) => say('  ' + x));
say('');
say(`== MISSING ANCHOR (${missingAnchor.length}) ==`);
missingAnchor.forEach((x) => say('  ' + x));
say('');
say(`== MOJIBAKE (${mojibake.length}) ==`);
mojibake.forEach((x) => say('  ' + x));
say('');
say(`== ENCODING (${encoding.length}) ==`);
encoding.forEach((x) => say('  ' + x));
say('');

const total =
  missing.length +
  caseMismatch.length +
  missingAnchor.length +
  mojibake.length +
  encoding.length;
say(`TOTAL FINDINGS: ${total}`);

fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(lines.join('\n'));
