import subprocess, os, re

files = [f for f in subprocess.run(
    ['git', 'ls-files'], capture_output=True, text=True).stdout.split()
    if not f.startswith(('scripts/', 'node_modules/'))]

for f in files:
    if not f.lower().endswith(('.html', '.css')):
        continue
    if not os.path.isfile(f):
        continue
    s = open(f, 'rb').read().decode('utf-8', 'replace')
    for i, line in enumerate(s.split('\n'), 1):
        if re.search(r'Logo(Crop)?\.png', line):
            print('%-28s %4d | %s' % (f, i, ' '.join(line.split())[:150]))
