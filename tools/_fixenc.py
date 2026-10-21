"""Repair double-encoded UTF-8 + stray BOMs introduced by a bad PowerShell rewrite.

For each target file:
  1. strip a leading UTF-8 BOM unless HEAD has one
  2. undo UTF-8 -> cp1252/latin-1 mojibake via ftfy
  3. write back as UTF-8 with CRLF endings (repo uses core.autocrlf=true)
"""
import subprocess, sys
from ftfy import fix_text

BOM = b'\xef\xbb\xbf'


def head_blob(path):
    r = subprocess.run(['git', 'cat-file', 'blob', 'HEAD:' + path],
                       capture_output=True)
    return r.stdout if r.returncode == 0 else None


def repair(path, write=True):
    hb = head_blob(path)
    keep_bom = bool(hb) and hb.startswith(BOM)
    raw = open(path, 'rb').read()
    if raw.startswith(BOM):
        raw = raw[3:]
    text = raw.decode('utf-8')
    fixed = fix_text(text)
    moji_changed = fixed != text
    out = fixed.replace('\r\n', '\n').replace('\n', '\r\n').encode('utf-8')
    if keep_bom:
        out = BOM + out
    if write:
        open(path, 'wb').write(out)
    return keep_bom, moji_changed, len(text), len(fixed)


if __name__ == '__main__':
    for p in sys.argv[1:]:
        keep_bom, changed, a, b = repair(p, write=True)
        print("%-32s keep_bom=%-5s moji_fixed=%-5s chars %d->%d" %
              (p, keep_bom, changed, a, b))
