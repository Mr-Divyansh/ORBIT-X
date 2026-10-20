// ORBIT-X link + asset auditor (dev-only).
// Walks every HTML file in the repo, extracts href/src references and
// reports: missing local files, missing directories, and anchors that do
// not exist in the target document.
//
// Usage:  node tools/audit-links.mjs [--verbose]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VERBOSE = process.argv.includes('--verbose');

const SKIP_DIRS = new Set(['node_modules', '.git', 'tests', 'tools']);
const HTML_EXT = new Set(['.html', '.htm']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
    } else if (entry.isFile() && HTML_EXT.has(path.extname(entry.name).toLowerCase())) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

// Strip script/style BODIES but keep their opening tags, so `src=`/`href=`
// attributes on <script src> / <link href> are still audited.
// Newlines inside the removed bodies are preserved so that reported line
// numbers still match the original file.
function blankOut(body) {
  return body.replace(/[^\n]/g, ' ');
}
function stripNonMarkup(html) {
  return html
    .replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, open, body, close) => open + blankOut(body) + close)
    .replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, open, body, close) => open + blankOut(body) + close)
    .replace(/<!--[\s\S]*?-->/g, (m) => blankOut(m));
}

function collectRefs(html) {
  const refs = [];
  const re = /(href|src)\s*=\s*"([^"]*)"|(href|src)\s*=\s*'([^']*)'/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = m[2] !== undefined ? m[2] : m[4];
    const attr = m[1] !== undefined ? m[1] : m[3];
    refs.push({ attr, value: raw.trim() });
  }
  return refs;
}

function collectIds(html) {
  const ids = new Set();
  const re = /id\s*=\s*"([^"]*)"|id\s*=\s*'([^']*)'/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    ids.add((m[1] !== undefined ? m[1] : m[2]).trim());
  }
  return ids;
}

function lineOf(html, index) {
  return html.slice(0, index).split('\n').length;
}

const files = walk(ROOT);
const idCache = new Map();
function idsOf(file) {
  if (!idCache.has(file)) {
    idCache.set(file, collectIds(stripNonMarkup(fs.readFileSync(file, 'utf8'))));
  }
  return idCache.get(file);
}

const problems = [];
const allRefs = [];

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  const html = stripNonMarkup(raw);
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const dir = path.dirname(file);

  // Track source positions for nicer reporting.
  const re = /(href|src)\s*=\s*"([^"]*)"|(href|src)\s*=\s*'([^']*)'/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const value = (m[2] !== undefined ? m[2] : m[4]).trim();
    const attr = m[1] !== undefined ? m[1] : m[3];
    const line = lineOf(raw, m.index);

    if (!value) continue;
    if (/^(https?:|mailto:|tel:|data:|javascript:|blob:|#)/i.test(value)) {
      if (value.startsWith('#') && value.length > 1) {
        const id = decodeURIComponent(value.slice(1));
        if (!idsOf(file).has(id)) {
          problems.push({ kind: 'MISSING ANCHOR', file: rel, line, ref: value });
        }
      }
      continue;
    }

    const [pathPart, frag] = value.split('#');
    if (!pathPart) continue;
    if (/^(https?:|data:|mailto:)/i.test(pathPart)) continue;

    // Strip query string.
    const clean = pathPart.split('?')[0];
    let target = path.resolve(dir, decodeURIComponent(clean));
    const targetRel = path.relative(ROOT, target).replace(/\\/g, '/');

    allRefs.push({ file: rel, line, value });

    if (!fs.existsSync(target)) {
      // Distinguish "directory missing" from "file missing" for a clearer fix hint.
      const asDir = path.resolve(dir, decodeURIComponent(clean).replace(/\/$/, ''));
      const kind = fs.existsSync(asDir) ? 'MISSING DIRECTORY' : 'MISSING FILE';
      problems.push({ kind, file: rel, line, ref: value, resolvesTo: targetRel });
      continue;
    }

    if (frag) {
      const id = decodeURIComponent(frag);
      if (HTML_EXT.has(path.extname(target).toLowerCase()) && !idsOf(target).has(id)) {
        problems.push({
          kind: 'MISSING ANCHOR', file: rel, line, ref: value, target: targetRel
        });
      }
    }
  }
}

const byKind = new Map();
for (const p of problems) {
  if (!byKind.has(p.kind)) byKind.set(p.kind, []);
  byKind.get(p.kind).push(p);
}

console.log('ORBIT-X link audit');
console.log('Files scanned: ' + files.length);
console.log('Local references checked: ' + allRefs.length);
console.log('');

let total = 0;
for (const [kind, list] of byKind) {
  console.log('== ' + kind + ' (' + list.length + ') ==');
  for (const p of list) {
    total++;
    console.log(
      '  ' + p.file + ':' + p.line + '  ' + JSON.stringify(p.ref) +
      (p.resolvesTo ? '  -> ' + p.resolvesTo : '') +
      (p.target ? '  (in ' + p.target + ')' : '')
    );
  }
  console.log('');
}
console.log(total === 0 ? 'OK: no broken local links or anchors.' : 'TOTAL PROBLEMS: ' + total);
