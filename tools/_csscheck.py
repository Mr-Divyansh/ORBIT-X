import re

s = open('credits.html', 'rb').read().decode('utf-8-sig')
css = re.search(r'<style>(.*?)</style>', s, re.S).group(1)
body = s[s.find('</style>'):]

print('body credit-link usages:',
      len(re.findall(r'class="[^"]*\bcredit-link\b', body)))
print('body credit-link__icon usages:',
      len(re.findall(r'class="[^"]*\bcredit-link__icon\b', body)))
print()

for m in re.finditer(r'(\.credit-card--(?:studio|profile)-link[^{]*)\{([^}]*)\}', css):
    print(m.group(1).strip().replace('\n', ' '))
    print('   ', ' '.join(m.group(2).split())[:230])
    print('---')
