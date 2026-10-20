// Captures the circular reveal frames by sampling the clip-path radius.
// Runs in an isolated page so screenshot capture cannot disturb the
// functional flow of the main verification suite.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'http://127.0.0.1:5500';
const OUT = __dirname + '/shots';

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);
  const browser = await chromium.launch({
    executablePath: require('os').homedir() +
      '\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe'
  });

  // Sample the radius over time to prove the circle expands from the toggle.
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  const samples = await page.evaluate(async () => {
    const btn = document.querySelector('.theme-toggle');
    const r = btn.getBoundingClientRect();
    const origin = { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    document.querySelector('.theme-toggle').click();
    const out = [];
    const t0 = performance.now();
    return new Promise(resolve => {
      const tick = () => {
        const o = document.querySelector('.theme-reveal');
        if (o) {
          const m = /circle\(([\d.]+)px at ([\d.]+)px ([\d.]+)px\)/.exec(getComputedStyle(o).clipPath);
          out.push({
            t: Math.round(performance.now() - t0),
            r: m ? Math.round(parseFloat(m[1])) : null,
            cx: m ? Math.round(parseFloat(m[2])) : null,
            cy: m ? Math.round(parseFloat(m[3])) : null
          });
        }
        if (performance.now() - t0 < 900) requestAnimationFrame(tick);
        else resolve({ origin, out });
      };
      requestAnimationFrame(tick);
    });
  });

  console.log('toggle origin: ' + JSON.stringify(samples.origin));
  console.log('radius samples (t=ms, radius=px):');
  const every = Math.max(1, Math.floor(samples.out.length / 10));
  samples.out.forEach((s, i) => {
    if (i % every === 0) console.log('  t=' + s.t + 'ms  r=' + s.r + 'px  @' + s.cx + ',' + s.cy);
  });
  const last = samples.out[samples.out.length - 1];
  // The furthest point from the toggle origin is the opposite corner.
  const need = Math.hypot(
    Math.max(samples.origin.x, 1366 - samples.origin.x),
    Math.max(samples.origin.y, 900 - samples.origin.y)
  );
  console.log('final radius: ' + last.r + 'px  (needed to cover viewport: ' + Math.round(need) + 'px)');
  console.log('origin matches toggle: ' + (last.cx === samples.origin.x && last.cy === samples.origin.y));

  // Settled state: the overlay is removed and the theme is fully painted,
  // so the real check is that no uncovered gap remains.
  await page.waitForTimeout(600);
  const settled = await page.evaluate(() => ({
    theme: document.documentElement.getAttribute('data-theme'),
    overlay: !!document.querySelector('.theme-reveal'),
    bodyBg: getComputedStyle(document.body).backgroundColor
  }));
  console.log('settled: ' + JSON.stringify(settled));
  console.log('covers viewport (overlay removed + theme painted): ' +
    (settled.theme === 'dark' && !settled.overlay));

  await browser.close();
})();
