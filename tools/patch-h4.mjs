// HTML patch 4: Exploration, Story, about, projects, ghost-hunt fixes.
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

// ---------- Exploration.html ----------
// Landmark: the page content section becomes <main>.
rep('Exploration.html', 'main-open',
  '<section class="exploration-page" aria-labelledby="exp-title">',
  '<main class="exploration-page" aria-labelledby="exp-title">');
rep('Exploration.html', 'main-close',
  '    </div>\r\n  </section>\r\n\r\n\r\n<footer class="orbit-footer exp-footer"',
  '    </div>\r\n  </main>\r\n\r\n\r\n<footer class="orbit-footer exp-footer"');
rep('Exploration.html', 'skip-link',
  '<body>\r\n  <div class="page-frame" aria-hidden="true"></div>',
  '<body>\r\n  <a class="skip-link" href="#exp-title">Skip to main content</a>\r\n  <div class="page-frame" aria-hidden="true"></div>');
// Mojibake fixes (encoding damage in visible copy).
rep('Exploration.html', 'mojibake-emdash',
  'endless stories ï¿½ kindness', 'endless stories — kindness');
rep('Exploration.html', 'mojibake-arrow',
  'Explore Our Stories <span aria-hidden="true">â†’</span>',
  'Explore Our Stories <span aria-hidden="true">→</span>');
rep('Exploration.html', 'mojibake-description',
  'Abhay and Divyansh â€” Halloween Helpers', 'Abhay and Divyansh — Halloween Helpers');
rep('Exploration.html', 'mojibake-stars',
  '<span aria-hidden="true">âœ¦ best friends, always âœ¦</span>',
  '<span aria-hidden="true">✦ best friends, always ✦</span>');
rep('Exploration.html', 'mojibake-gh',
  'GitHub <span aria-hidden="true">â†—</span>', 'GitHub <span aria-hidden="true">↗</span>');
rep('Exploration.html', 'mojibake-copy',
  '<p>Â© <span data-current-year></span> ORBIT-X. All rights reserved.</p>\r\n      <span aria-hidden="true">âœ¦</span>',
  '<p>© <span data-current-year></span> ORBIT-X. All rights reserved.</p>\r\n      <span aria-hidden="true">✦</span>');
// Footer CTA pointed to a non-existent route.
rep('Exploration.html', 'footer-cta-link',
  'href="stories/index.html"', 'href="Story.html"');
// Footer logo: Logo.jpeg has a solid dark-green background; use the
// transparent Logo.png and style it plainly.
rep('Exploration.html', 'footer-logo',
  '<img src="Assets/img/Logo.jpeg" alt="ORBIT-X logo" loading="lazy" />',
  '<img src="Assets/img/Logo.png" alt="ORBIT-X logo" class="orbit-footer__logo-img" width="96" height="96" loading="lazy" decoding="async" />');
// Optimized artwork.
rep('Exploration.html', 'solo-webp-div',
  'src="Assets/img/DivyanshSolo.png" alt="Divyansh in his white and black outfit" width="120" height="140" loading="lazy"',
  'src="Assets/img/DivyanshSolo.webp" alt="Divyansh in his white and black outfit" width="120" height="140" loading="lazy" decoding="async"');
rep('Exploration.html', 'solo-webp-abh',
  'src="Assets/img/AbhaySolo.png" alt="Abhay in his yellow and black outfit" width="120" height="140" loading="lazy"',
  'src="Assets/img/AbhaySolo.webp" alt="Abhay in his yellow and black outfit" width="120" height="140" loading="lazy" decoding="async"');
rep('Exploration.html', 'lantern-webp',
  'src="Assets/img/TheHalloweenLantern.png" alt="" width="400" height="225" loading="lazy"',
  'src="Assets/img/TheHalloweenLantern.webp" alt="" width="400" height="225" loading="lazy" decoding="async"');
rep('Exploration.html', 'dream-webp',
  'src="Assets/img/TheDreamBeyondTheShadows.png" alt="" width="400" height="225" loading="lazy"',
  'src="Assets/img/TheDreamBeyondTheShadows.webp" alt="" width="400" height="225" loading="lazy" decoding="async"');
rep('Exploration.html', 'ghost-webp',
  'src="Assets/img/TheLastWanderingGhost.png" alt="" width="400" height="225" loading="lazy"',
  'src="Assets/img/TheLastWanderingGhost.webp" alt="" width="400" height="225" loading="lazy" decoding="async"');
rep('Exploration.html', 'footer-friends',
  'src="Assets/img/abhay bg solo.png" alt="Abhay in his yellow hoodie" loading="lazy" width="444" height="562"',
  'src="Assets/img/abhay bg solo.webp" alt="Abhay in his yellow hoodie" width="280" height="354" loading="lazy" decoding="async"');
rep('Exploration.html', 'footer-friends2',
  'src="Assets/img/divyansh solo.png" alt="Divyansh in his black and white outfit" loading="lazy" width="444" height="562"',
  'src="Assets/img/divyansh solo.webp" alt="Divyansh in his black and white outfit" width="280" height="354" loading="lazy" decoding="async"');
// Add the Games link so navigation matches the other pages.
rep('Exploration.html', 'nav-games',
  '<a href="credits.html">Credits</a>\r\n    </nav>',
  '<a href="credits.html">Credits</a>\r\n      <a href="games.html">Games</a>\r\n    </nav>');

console.log(fails ? 'FAILURES: ' + fails : 'H4 DONE');
if (fails) process.exit(1);
