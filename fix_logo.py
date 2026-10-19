import os

root_pages = ['index.html', 'about.html', 'Exploration.html', 'Story.html', 'Story1.html', 'Story2.html', 'Story3.html']
sub_pages = ['stories/index.html', 'projects/halloween-helpers.html', 'projects/dream-guardians.html', 'projects/ghost-catchers.html']

old_navbar_block = '''      <img src="{prefix}Assets/img/Logo.png" alt="ORBIT-X logo" class="brand-logo-img" width="40" height="40" loading="eager" />
      <svg class="brand-planet" viewBox="0 0 76 58" aria-hidden="true">
        <ellipse cx="36" cy="29" rx="30" ry="11" transform="rotate(-28 36 29)" fill="none" stroke="currentColor" stroke-width="4" />
        <circle cx="34" cy="28" r="15" fill="#bca0ef" />
        <path d="M22 18c5-7 13-9 20-7" fill="none" stroke="#fff8ff" stroke-width="4" stroke-linecap="round" />
        <path d="M59 9l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#f8d889" />
      </svg>
      <span>ORBIT-X</span>'''

new_navbar_block = '      <img src="{prefix}Assets/img/Logo.png" alt="ORBIT-X official logo" class="brand-logo-img" width="160" height="160" loading="eager" />'

for p in root_pages + sub_pages:
    with open(p, 'r', encoding='utf-8') as f:
        content = f.read()
    prefix = '' if p in root_pages else '../'
    old = old_navbar_block.format(prefix=prefix)
    new = new_navbar_block.format(prefix=prefix)
    if old in content:
        content = content.replace(old, new)
        with open(p, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'OK: {p}')
    else:
        print(f'MISS: {p}')