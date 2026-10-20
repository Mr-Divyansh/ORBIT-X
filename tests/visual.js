// Captures the circular reveal at several points + mobile drawer behaviour.
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
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  page.on('console', msg => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });
  await page.goto(BASE + '/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  // Capture the reveal mid-flight to prove the circle is expanding.
  // No screenshots taken here — they are already produced by shots.js
  // (which captures only after the reveal settles to avoid disturbing it).
  await page.locator('.theme-toggle').first().click();
  for (const ms of [80, 200, 380]) {
    await page.waitForTimeout(ms === 80 ? 80 : 120);
    const st = await page.evaluate(() => {
      const o = document.querySelector('.theme-reveal');
      return {
        overlay: !!o,
        clip: o ? getComputedStyle(o).clipPath.slice(0, 46) : null,
        theme: document.documentElement.getAttribute('data-theme')
      };
    }).catch(e => ({ error: String(e).slice(0, 60) }));
    console.log('t+' + ms + 'ms: ' + JSON.stringify(st));
  }
  await page.waitForTimeout(1400);
  const darkState = await page.evaluate(() => ({
    theme: document.documentElement.getAttribute('data-theme'),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    overlay: !!document.querySelector('.theme-reveal')
  }));
  console.log('after reveal: ' + JSON.stringify(darkState));
  await page.screenshot({ path: OUT + '/after-dark.png' });

  // Dark mode screenshot for palette check.
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log('dark body bg: ' + bg);

  // Back to light.
  await page.click('.theme-toggle');
  await page.waitForTimeout(1100);
  const dt2 = await page.evaluate(() => {
    const tm = window.themeManager;
    return {
      dataTheme: document.documentElement.getAttribute('data-theme'),
      currentTheme: tm ? tm.currentTheme : null,
      _transitioning: tm ? tm._transitioning : null,
      overlayCount: (document.querySelectorAll('.theme-reveal') || []).length,
      bodyClass: document.body.className
    };
  });
  console.log('after click2: ' + JSON.stringify(dt2));
  await page.screenshot({ path: OUT + '/after-light.png' });
  const bg2 = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log('light body bg: ' + bg2);

  // Sound ON state screenshot.
  await page.click('.sound-toggle');
  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + '/sound-on.png' });

  // ---- Mobile drawer ----
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR(mobile):', e.message));
  page.on('console', msg => { if (msg.type() === 'error') console.log('CONSOLE ERROR(mobile):', msg.text()); });
  await mp.goto(BASE + '/index.html', { waitUntil: 'load' });
  await mp.waitForTimeout(1000);
  await mp.screenshot({ path: OUT + '/mobile-closed.png' });
  const mt = await mp.locator('.menu-toggle');
  const mtVisible = await mt.isVisible().catch(() => false);
  console.log('mobile menu-toggle visible: ' + mtVisible);
  if (mtVisible) {
    await mt.click();
    await mp.waitForTimeout(700);
    await mp.screenshot({ path: OUT + '/mobile-menu-open.png' });
    const openState = await mp.evaluate(() => {
      const d = document.querySelector('.nav-drawer');
      const b = document.querySelector('.nav-drawer-backdrop');
      const body = document.body;
      return {
        drawerExists: !!d,
        drawerOpen: !!d && d.classList.contains('is-open'),
        drawerTransform: d ? getComputedStyle(d).transform : null,
        backdropVisible: !!b && b.classList.contains('is-visible'),
        scrollLocked: body.classList.contains('nav-drawer-open'),
        bodyOverflow: getComputedStyle(body).overflow
      };
    });
    console.log('mobile drawer: ' + JSON.stringify(openState));
    // The drawer must contain the nav links and the sound panel.
    const drawerInfo = await mp.evaluate(() => {
      const d = document.querySelector('.nav-drawer');
      if (!d) return null;
      return {
        links: d.querySelectorAll('.nav-drawer__nav a').length,
        soundRows: d.querySelectorAll('.sound-row').length,
        hasClose: !!d.querySelector('.nav-drawer__close')
      };
    });
    console.log('drawer contents: ' + JSON.stringify(drawerInfo));

    // Close it again and confirm it reverses.
    await mp.click('.nav-drawer__close');
    await mp.waitForTimeout(600);
    const closedState = await mp.evaluate(() => {
      const d = document.querySelector('.nav-drawer');
      return {
        drawerOpen: !!d && d.classList.contains('is-open'),
        scrollLocked: document.body.classList.contains('nav-drawer-open')
      };
    });
    console.log('after close: ' + JSON.stringify(closedState));
  }
  await browser.close();
  console.log('screenshots written to ' + OUT);
})();
