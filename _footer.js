// Temporary script: add the index.html orbit-footer to every other page,
// swap the footer SVG for Logo.jpeg, and link css/about.css where missing.
const fs = require('fs');

let index = fs.readFileSync('index.html', 'utf8');
const start = index.indexOf('<footer class="orbit-footer"');
const end = index.indexOf('</footer>', start) + '</footer>'.length;
if (start === -1 || end < start) throw new Error('orbit-footer not found in index.html');
let footer = index.slice(start, end);

// Swap the SVG planet logo for Logo.jpeg.
const svgStart = footer.indexOf('<svg viewBox="0 0 76 58"');
const svgEnd = footer.indexOf('</svg>', svgStart) + '</svg>'.length;
if (svgStart === -1) throw new Error('footer logo svg not found');
footer =
  footer.slice(0, svgStart) +
  '<img class="orbit-footer__logo-img" src="Assets/img/Logo.jpeg" alt="ORBIT-X logo" width="48" height="48" loading="lazy" />' +
  footer.slice(svgEnd);

// index.html keeps the footer as-is (just logo swap) — anchors stay on-page.
index = index.slice(0, start) + footer + index.slice(end);
fs.writeFileSync('index.html', index);

function localize(tpl, sub) {
  let t = tpl;
  if (sub) {
    t = t.split('src="Assets/').join('src="../Assets/');
    t = t.split('href="Exploration.html').join('href="../Exploration.html');
    t = t.split('href="projects/').join('href="../projects/');
    t = t.split('href="Story2.html').join('href="../Story2.html');
  }
  // Page-fragment anchors must point back to index.html from other pages.
  t = t.split('href="#').join('href="index.html#');
  return t;
}

function inject(file, footerHtml) {
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('orbit-footer')) throw new Error(file + ' already has orbit-footer');
  const cssHref = file.includes('/') ? '../css/about.css' : 'css/about.css';
  if (!html.includes('about.css')) {
    if (!html.includes('</head>')) throw new Error(file + ': no </head>');
    html = html.replace('</head>', `  <link rel="stylesheet" href="${cssHref}" />\n</head>`);
  }
  const m = html.match(/<script src="[^"]*script\.js"><\/script>/);
  if (!m) throw new Error(file + ': script tag not found');
  html = html.replace(m[0], footerHtml + '\n  ' + m[0]);
  fs.writeFileSync(file, html);
}

const rootPages = ['Exploration.html', 'Story1.html', 'Story2.html', 'Story3.html'];
const subPages = [
  'projects/halloween-helpers.html',
  'projects/dream-guardians.html',
  'projects/ghost-catchers.html',
  'stories/index.html',
];

for (const f of rootPages) inject(f, localize(footer, false));
for (const f of subPages) inject(f, localize(footer, true));

console.log('footer injected into ' + (rootPages.length + subPages.length) + ' pages + logo swapped in index.html');
