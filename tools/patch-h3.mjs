// HTML patch 3: page-specific content fixes.
import fs from 'node:fs';
let fails = 0;
function rep(file, name, oldText, newText, required = true) {
  let t = fs.readFileSync(file, 'utf8');
  if (!t.includes(oldText)) {
    if (t.includes(newText)) { console.log('already ' + file + ' :: ' + name); return; }
    if (required) { console.error('MISSING ' + file + ' :: ' + name); fails++; }
    else console.log('optional-skip ' + file + ' :: ' + name);
    return;
  }
  t = t.replace(oldText, newText);
  fs.writeFileSync(file, t, 'utf8');
  console.log('ok ' + file + ' :: ' + name);
}

// login.html already carried its own og tags; nothing to fix there.

// ---------- index.html ----------
// One H1 per page: the About heading becomes an h2 (styled via about.css).
rep('index.html', 'about-h2',
  '<h1>Meet the Ghost Purificators</h1>',
  '<h2>Meet the Ghost Purificators</h2>');
// storybook finale is a content section, not a second site footer landmark.
rep('index.html', 'finale-section-open',
  '<footer class="storybook__finale story-reveal">',
  '<section class="storybook__finale story-reveal">');
rep('index.html', 'finale-section-close',
  '  </footer>\r\n</section>\r\n\r\n<footer class="orbit-footer"',
  '  </section>\r\n</section>\r\n\r\n<footer class="orbit-footer"');
// The finale CTA pointed at a page that does not exist (Story1.html).
rep('index.html', 'finale-cta-link',
  '<a class="storybook__finale-cta" href="Story1.html">',
  '<a class="storybook__finale-cta" href="Story.html">');
// Optimized artwork.
rep('index.html', 'two-webp',
  'src="Assets/img/two.png" alt="Abhay and Divyansh stand together under the Halloween moon with their magical gadgets" loading="lazy" decoding="async"',
  'src="Assets/img/two.webp" alt="Abhay and Divyansh stand together under the Halloween moon with their magical gadgets" width="1376" height="768" loading="lazy" decoding="async"');
rep('index.html', 'storybook-dream-webp',
  'src="Assets/img/TheDreamBeyondTheShadows.png"',
  'src="Assets/img/TheDreamBeyondTheShadows.webp" width="1375" height="768" decoding="async"');
rep('index.html', 'storybook-ghost-webp',
  'src="Assets/img/TheLastWanderingGhost.png"',
  'src="Assets/img/TheLastWanderingGhost.webp" width="1375" height="768" decoding="async"');
rep('index.html', 'divyansh-solo-webp',
  'src="Assets/img/DivyanshSolo.png"',
  'src="Assets/img/DivyanshSolo.webp" width="360" height="540"');
rep('index.html', 'footer-friends-webp-abhay',
  'src="Assets/img/abhay bg solo.png" alt="Abhay in his yellow hoodie" loading="lazy" width="444" height="562"',
  'src="Assets/img/abhay bg solo.webp" alt="Abhay in his yellow hoodie" width="280" height="354" loading="lazy" decoding="async"');
rep('index.html', 'footer-friends-webp-divyansh',
  'src="Assets/img/divyansh solo.png" alt="Divyansh in his black and white outfit" loading="lazy" width="444" height="562"',
  'src="Assets/img/divyansh solo.webp" alt="Divyansh in his black and white outfit" width="280" height="354" loading="lazy" decoding="async"');
rep('index.html', 'footer-logo-dims',
  '<img src="Assets/img/Logo.png" alt="ORBIT-X logo" class="orbit-footer__logo-img" />',
  '<img src="Assets/img/Logo.png" alt="ORBIT-X logo" class="orbit-footer__logo-img" width="96" height="96" loading="lazy" decoding="async" />');

console.log(fails ? 'FAILURES: ' + fails : 'H3-PART-A DONE');
if (fails) process.exit(1);
