// ORBIT-X structural dumper (dev-only).
// Prints, for every HTML page: its ids, the .nav-links entries, and the
// footer nav entries, so nav/footer drift between pages is obvious.
//
// Usage:  node tools/dump-structure.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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

function block(html, tag) {
  const m = html.match(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'i'));
  return m ? m[0] : '';
}

function links(html) {
  const out = [];
  const re = /<a\b[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const text = m[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    out.push({ href: m[1], text });
  }
  return out;
}

for (const file of walk(ROOT)) {
  const raw = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');

  const ids = [...raw.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]);
  const nav = links(block(raw, 'nav'));
  const footer = links(block(raw, 'footer'));
  const scripts = [...raw.matchAll(/<script[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  const styles = [...raw.matchAll(/<link[^>]*\brel\s*=\s*["']stylesheet["'][^>]*href\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);

  console.log('='.repeat(70));
  console.log('PAGE: ' + rel);
  console.log('  ids      : ' + (ids.join(', ') || '(none)'));
  console.log('  nav      :');
  for (const l of nav) console.log('      ' + JSON.stringify(l.href).padEnd(34) + ' ' + l.text);
  console.log('  footer   :');
  for (const l of footer) console.log('      ' + JSON.stringify(l.href).padEnd(34) + ' ' + l.text);
  console.log('  css      : ' + styles.join(' | '));
  console.log('  scripts  : ' + scripts.join(' | '));
  console.log('');
}
