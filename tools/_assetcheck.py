import subprocess, os, re

files = subprocess.run(['git', 'ls-files'], capture_output=True, text=True).stdout.split()
skip = ('scripts/', 'node_modules/', '.github/')
files = [f for f in files if not f.startswith(skip)]

site = [f for f in files
        if f.lower().endswith(('.html', '.css')) and os.path.isfile(f)]
missing = []

for f in site:
    s = open(f, 'rb').read().decode('utf-8', 'replace')
    base = os.path.dirname(f)
    for m in re.finditer(r'(?:src|href)="([^"]+\.(?:png|jpg|jpeg|webp|svg|gif))"', s):
        p = m.group(1)
        if p.startswith(('http', 'data:', '#', 'mailto:')):
            continue
        t = os.path.normpath(os.path.join(base, p)).replace('\\', '/')
        if not os.path.isfile(t):
            missing.append((f, p))

print('SITE FILES CHECKED:', len(site))
print('MISSING:', len(missing))
for x in missing[:30]:
    print('  ', x[0], '->', x[1])
