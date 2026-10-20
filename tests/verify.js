// ORBIT-X verification suite (dev-only, not shipped to the site).
const { chromium } = require('playwright');

const BASE = 'http://127.0.0.1:5500';
const results = [];
function log(name, pass, info) {
  results.push({ name, pass, info });
  console.log((pass ? 'PASS' : 'FAIL') + ' :: ' + name + (info ? ' :: ' + info : ''));
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH ||
      (require('os').homedir() + '\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe')
  });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  await page.goto(BASE + '/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(600);

  // ---- 1. Fresh load = Light Mode, sound OFF ----
  const theme0 = await page.getAttribute('html', 'data-theme');
  log('Fresh load starts Light Mode', theme0 === null, 'data-theme=' + theme0);
  const sound0 = await page.getAttribute('.sound-toggle', 'aria-pressed');
  const soundLabel0 = await page.textContent('.sound-label');
  log('Sound OFF on fresh load', sound0 === 'false' && /OFF/i.test(soundLabel0), 'aria-pressed=' + sound0 + ' label=' + soundLabel0);

  // ---- 2. No audio element playing on fresh load ----
  const playingBefore = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('audio')).filter(a => !a.paused).length;
  });
  log('No autoplay on fresh load', playingBefore === 0, 'playing=' + playingBefore);

  // ---- 3. Sound toggle UI + accessible name ----
  const soundBox = await page.locator('.sound-toggle').boundingBox();
  const navBox = await page.locator('.navbar').boundingBox();
  const aria = await page.getAttribute('.sound-toggle', 'aria-label');
  const title = await page.getAttribute('.sound-toggle', 'title');
  log('Sound toggle has accessible name', !!aria && aria.length > 4, 'aria-label=' + aria);
  log('Sound toggle has tooltip', !!title && title.length > 4, 'title=' + title);
  log('Sound toggle inside navbar bounds',
    soundBox.x + soundBox.width <= navBox.x + navBox.width + 1,
    'sound right=' + (soundBox.x + soundBox.width) + ' nav right=' + (navBox.x + navBox.width));

  // ---- 4. Circular reveal: Light -> Dark ----
  await page.click('.theme-toggle');
  await page.waitForTimeout(120);
  const overlayMid = await page.evaluate(() => {
    const o = document.querySelector('.theme-reveal');
    if (!o) return null;
    const cs = getComputedStyle(o);
    return { z: cs.zIndex, pos: cs.position, w: o.getBoundingClientRect().width };
  });
  log('Reveal overlay appears during transition', !!overlayMid, JSON.stringify(overlayMid));
  const clipMid = await page.evaluate(() => {
    const o = document.querySelector('.theme-reveal');
    if (!o) return null;
    const a = o.getAnimations();
    return a.length ? getComputedStyle(o).clipPath : null;
  });
  log('Overlay uses clip-path circle', !!clipMid && /circle/.test(clipMid), String(clipMid).slice(0, 80));

  await page.waitForTimeout(1200);
  const theme1 = await page.getAttribute('html', 'data-theme');
  const overlayGone = await page.evaluate(() => !document.querySelector('.theme-reveal'));
  log('Light -> Dark applies dark theme', theme1 === 'dark', 'data-theme=' + theme1);
  log('Overlay cleaned up after reveal', overlayGone);

  // ---- 5. Reverse: Dark -> Light ----
  await page.click('.theme-toggle');
  await page.waitForTimeout(1200);
  const theme2 = await page.getAttribute('html', 'data-theme');
  const overlayGone2 = await page.evaluate(() => !document.querySelector('.theme-reveal'));
  log('Dark -> Light restores light theme', theme2 === null, 'data-theme=' + theme2);
  log('Overlay cleaned up after reverse', overlayGone2);

  // ---- 6. Rapid clicks leave no broken overlay ----
  await page.click('.theme-toggle');
  await page.waitForTimeout(60);
  await page.click('.theme-toggle');
  await page.waitForTimeout(1500);
  const overlayGone3 = await page.evaluate(() => !document.querySelector('.theme-reveal'));
  const theme3 = await page.getAttribute('html', 'data-theme');
  log('Rapid clicks leave no overlay', overlayGone3, 'data-theme=' + theme3);

  // ---- 7. Refresh returns to Light Mode ----
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(600);
  const theme4 = await page.getAttribute('html', 'data-theme');
  const sound4 = await page.getAttribute('.sound-toggle', 'aria-pressed');
  log('Refresh returns to Light Mode', theme4 === null, 'data-theme=' + theme4);
  log('Refresh returns Sound OFF', sound4 === 'false', 'aria-pressed=' + sound4);

  console.log('\n--- console errors ---');
  console.log(errors.length ? errors.join('\n') : '(none)');
  log('No console errors on homepage', errors.length === 0, errors.length + ' errors');

  // ---- 8. Sound ON / OFF lifecycle ----
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.click('.sound-toggle');
  await page.waitForTimeout(400);
  const on1 = await page.getAttribute('.sound-toggle', 'aria-pressed');
  const label1 = await page.textContent('.sound-label');
  log('Sound ON updates aria-pressed', on1 === 'true', 'aria-pressed=' + on1);
  log('Sound ON updates label', /ON/i.test(label1), 'label=' + label1);
  const musicPlaying = await page.evaluate(() => {
    const a = window.audioManager;
    return !!(a && a.musicNode && !a.musicNode.paused);
  });
  log('Background music starts after Sound ON', musicPlaying);

  // Sound OFF must silence everything immediately.
  await page.click('.sound-toggle');
  await page.waitForTimeout(300);
  const offState = await page.evaluate(() => {
    const a = window.audioManager;
    return {
      pressed: document.querySelector('.sound-toggle').getAttribute('aria-pressed'),
      enabled: a ? a.isEnabled() : null,
      music: !!(a && a.musicNode && !a.musicNode.paused),
      ambience: !!(a && a.ambienceNode && !a.ambienceNode.paused),
      oneShots: a ? a._activeOneShots.size : -1
    };
  });
  log('Sound OFF sets enabled=false', offState.enabled === false);
  log('Sound OFF stops music', !offState.music);
  log('Sound OFF stops ambience', !offState.ambience);
  log('Sound OFF clears in-flight one-shots', offState.oneShots === 0, 'n=' + offState.oneShots);
  log('Sound OFF updates aria-pressed', offState.pressed === 'false');

  // ---- 9. Theme toggle still works while sound is off ----
  await page.click('.theme-toggle');
  await page.waitForTimeout(1200);
  const t9 = await page.getAttribute('html', 'data-theme');
  log('Theme toggle works with sound OFF', t9 === 'dark', 'data-theme=' + t9);

  // ---- 10. All pages: consistent controls, light start, no errors ----
  const pages = ['index.html', 'about.html', 'Exploration.html', 'Story.html',
                 'credits.html', 'login.html',
                 'projects/dream-guardians.html', 'projects/ghost-catchers.html',
                 'projects/halloween-helpers.html'];
  for (const p of pages) {
    const errs = [];
    const p2 = await ctx.newPage();
    p2.on('pageerror', e => errs.push(e.message));
    p2.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    const resp = await p2.goto(BASE + '/' + p, { waitUntil: 'load' });
    await p2.waitForTimeout(900);
    const st = await p2.evaluate(() => {
      const s = document.querySelector('.sound-toggle');
      const t = document.querySelector('.theme-toggle');
      return {
        theme: document.documentElement.getAttribute('data-theme'),
        soundExists: !!s,
        soundPressed: s ? s.getAttribute('aria-pressed') : null,
        soundAria: s ? s.getAttribute('aria-label') : null,
        themeExists: !!t,
        themePressed: t ? t.getAttribute('aria-pressed') : null,
        bodyOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });
    const ok = st.theme === null && st.soundExists && st.soundPressed === 'false' &&
               st.soundAria && st.themeExists && st.themePressed === 'false' &&
               st.bodyOverflowX <= 1 && errs.length === 0 && resp.status() === 200;
    log('Page OK: ' + p, ok, JSON.stringify(st) + (errs.length ? ' ERR:' + errs.join('|') : ''));
    await p2.close();
  }

  // ---- 11. Responsive: no horizontal overflow ----
  for (const w of [320, 375, 390, 430, 768, 1024, 1366]) {
    const p3 = await ctx.newPage();
    await p3.setViewportSize({ width: w, height: 800 });
    await p3.goto(BASE + '/index.html', { waitUntil: 'load' });
    await p3.waitForTimeout(700);
    const ov = await p3.evaluate(() => {
      const de = document.documentElement;
      const overflow = de.scrollWidth - de.clientWidth;
      const s = document.querySelector('.sound-toggle');
      const nb = document.querySelector('.navbar');
      let soundFits = true;
      if (s && nb) {
        const sb = s.getBoundingClientRect(), nbv = nb.getBoundingClientRect();
        soundFits = sb.right <= nbv.right + 1 && sb.left >= nbv.left - 1;
      }
      return { overflow, soundFits, soundW: s ? Math.round(s.getBoundingClientRect().width) : -1 };
    });
    log('Responsive ' + w + 'px: no overflow + sound fits',
      ov.overflow <= 1 && ov.soundFits, JSON.stringify(ov));
    await p3.close();
  }

  // ---- 12. Reduced motion: instant switch, no overlay ----
  const rmCtx = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    reducedMotion: 'reduce'
  });
  const rm = await rmCtx.newPage();
  await rm.goto(BASE + '/index.html', { waitUntil: 'load' });
  await rm.waitForTimeout(600);
  await rm.click('.theme-toggle');
  await rm.waitForTimeout(150);
  const rmState = await rm.evaluate(() => ({
    theme: document.documentElement.getAttribute('data-theme'),
    overlay: !!document.querySelector('.theme-reveal')
  }));
  log('Reduced motion: instant theme, no circle', rmState.theme === 'dark' && !rmState.overlay,
    JSON.stringify(rmState));
  await rmCtx.close();

  // ---- 13. Mobile drawer behaviour ----
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mctx.newPage();
  await mp.goto(BASE + '/index.html', { waitUntil: 'load' });
  await mp.waitForTimeout(900);
  await mp.locator('.menu-toggle').first().click();
  await mp.waitForTimeout(700);
  const dr = await mp.evaluate(() => {
    const d = document.querySelector('.nav-drawer');
    const b = document.querySelector('.nav-drawer-backdrop');
    return {
      exists: !!d,
      open: !!d && d.classList.contains('is-open'),
      transform: d ? getComputedStyle(d).transform : null,
      backdrop: !!b && b.classList.contains('is-visible'),
      locked: document.body.classList.contains('nav-drawer-open'),
      overflow: getComputedStyle(document.body).overflow,
      links: d ? d.querySelectorAll('.nav-drawer__nav a').length : 0,
      sliders: d ? d.querySelectorAll('.sound-row input[type=range]').length : 0
    };
  });
  log('Mobile drawer opens from right', dr.exists && dr.open &&
    dr.transform === 'matrix(1, 0, 0, 1, 0, 0)', JSON.stringify(dr));
  log('Drawer shows backdrop + locks scroll', dr.backdrop && dr.locked && dr.overflow === 'hidden');
  log('Drawer contains nav links + sound sliders', dr.links >= 5 && dr.sliders === 3,
    'links=' + dr.links + ' sliders=' + dr.sliders);
  await mp.locator('.nav-drawer__close').first().click();
  await mp.waitForTimeout(700);
  const dc = await mp.evaluate(() => {
    const d = document.querySelector('.nav-drawer');
    return {
      open: !!d && d.classList.contains('is-open'),
      locked: document.body.classList.contains('nav-drawer-open'),
      transform: d ? getComputedStyle(d).transform : null
    };
  });
  log('Drawer closes and restores scroll', !dc.open && !dc.locked,
    'transform=' + dc.transform);
  await mctx.close();

  // ---- 14. Story page: content intact + reveal works there too ----
  const sctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const sp = await sctx.newPage();
  const sErr = [];
  sp.on('pageerror', e => sErr.push(e.message));
  sp.on('console', m => { if (m.type() === 'error') sErr.push(m.text()); });
  await sp.goto(BASE + '/Story.html', { waitUntil: 'load' });
  await sp.waitForTimeout(1200);
  const st2 = await sp.evaluate(() => ({
    scenes: document.querySelectorAll('.ft-scene').length,
    title: document.querySelector('.ft-hero-title') ? document.querySelector('.ft-hero-title').textContent.trim() : null,
    cta: !!document.querySelector('.ft-primary-btn'),
    theme: document.documentElement.getAttribute('data-theme')
  }));
  log('Story page keeps its 7 scenes + title + CTA',
    st2.scenes === 7 && !!st2.title && st2.cta, JSON.stringify(st2));
  await sp.locator('.theme-toggle').first().click();
  await sp.waitForTimeout(1300);
  const sTheme = await sp.getAttribute('html', 'data-theme');
  const sOverlay = await sp.evaluate(() => !!document.querySelector('.theme-reveal'));
  log('Story page circular reveal works', sTheme === 'dark' && !sOverlay,
    'theme=' + sTheme + ' overlay=' + sOverlay);
  log('Story page has no console errors', sErr.length === 0, sErr.join('|'));
  await sctx.close();

  // ---- 15. No stray sound nodes leak across pages ----
  const leak = await page.evaluate(() => {
    const a = window.audioManager;
    return {
      music: a && a.musicNode ? 1 : 0,
      ambience: a && a.ambienceNode ? 1 : 0,
      enabled: a ? a.isEnabled() : null
    };
  });
  log('Audio state clean after all interactions', leak.enabled === false &&
    leak.music === 0 && leak.ambience === 0, JSON.stringify(leak));

  await browser.close();
  const failed = results.filter(r => !r.pass);
  console.log('\n=== ' + (results.length - failed.length) + '/' + results.length + ' passed ===');
  process.exit(failed.length ? 1 : 0);
})();
