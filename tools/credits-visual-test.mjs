// ============================================================================
// ORBIT-X - Credits page visual / a11y / responsive smoke test
// Verifies the redesigned Credits cards:
//   1. three contributor cards render (D Web Studio, Divyansh, Abhay),
//   2. every external link is https and marked rel="noopener noreferrer",
//   3. contributor artwork is letter-boxed (object-fit: contain, not cropped),
//   4. keyboard focus produces a visible focus ring on the link buttons,
//   5. dark theme restyles the cards with readable text,
//   6. layout collapses to a single column on a 390px-wide viewport.
// Run: node tools/credits-visual-test.mjs
// ============================================================================

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const LOCAL_CREDITS = pathToFileURL(path.join(ROOT, 'credits.html')).href;
const SHOTS = path.join(ROOT, 'tests', 'shots');
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });

// Optional: also check a live deployment.
//   node tools/credits-visual-test.mjs https://orbit-x-brown.vercel.app/credits.html
const LIVE = process.argv[2] || null;
const TARGET = LIVE || LOCAL_CREDITS;
const LIVE_ORIGIN = LIVE ? new URL(LIVE).origin : null;
const TAG = LIVE ? 'live-' : '';

let failures = 0;
function assert(cond, label, extra = '') {
  console.log((cond ? 'PASS' : 'FAIL') + ' - ' + label + (extra ? ' :: ' + extra : ''));
  if (!cond) failures++;
}

// The installed Playwright package can be older than the Chromium build that
// is present on disk, so locate the newest local Chromium and use it.
function resolveChromium() {
  const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (!fs.existsSync(base)) return undefined;
  const builds = fs.readdirSync(base)
    .filter((d) => /^chromium-\d+$/.test(d))
    .sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))
    .reverse();
  for (const b of builds) {
    for (const rel of [path.join('chrome-win64', 'chrome.exe'), path.join('chrome-win', 'chrome.exe')]) {
      const p = path.join(base, b, rel);
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined;
}

const browser = await chromium.launch({ executablePath: resolveChromium() });

async function newPage(viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // Our own route aborts surface as a generic resource-load error; those are
    // expected for the blocked third-party hosts and are not real failures.
    if (/Failed to load resource: net::ERR_FAILED/.test(m.text())) return;
    consoleErrors.push(m.text());
  });
  page.on('requestfailed', (r) => {
    const url = r.url();
    // Only the page's own assets matter; off-machine requests are blocked on purpose.
    if (!url.startsWith('file:') && !(LIVE_ORIGIN && url.startsWith(LIVE_ORIGIN))) return;
    failedRequests.push(url);
  });
  page.on('response', (r) => {
    if (r.status() < 400) return;
    const url = r.url();
    if (!url.startsWith('file:') && !(LIVE_ORIGIN && url.startsWith(LIVE_ORIGIN))) return;
    failedRequests.push(url + ' -> ' + r.status());
  });
  // Block off-machine requests (webfonts, analytics) so the page never waits
  // on the network; only the page's own assets are under test.
  await page.route('**/*', (route) => {
    const url = route.request().url();
    const local = url.startsWith('file:') || url.startsWith('data:') || url.startsWith('blob:')
      || (LIVE_ORIGIN && url.startsWith(LIVE_ORIGIN));
    if (local) return route.continue();
    return route.abort();
  });
  return { ctx, page, consoleErrors, failedRequests };
}

async function open(page) {
  await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(400);
  await waitForImages(page);
}

// Credit artwork uses loading="lazy", so images can still be in flight when
// the DOM is ready. Wait for every card image to finish decoding (and scroll
// the page so lazily-deferred ones are requested at all).
async function waitForImages(page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 0));
  try {
    await page.waitForFunction(() => {
      const imgs = Array.from(document.querySelectorAll('.credit-card img'));
      return imgs.length > 0 && imgs.every((i) => i.complete && i.naturalWidth > 0);
    }, null, { timeout: 15000 });
  } catch {
    // Fall through: the assertions below report exactly which image is missing.
  }
  await page.waitForTimeout(100);
}

// ---------------------------------------------------------------------------
// 1. Desktop + light theme
// ---------------------------------------------------------------------------
{
  const { ctx, page, consoleErrors, failedRequests } = await newPage({ width: 1440, height: 1000 });
  await open(page);

  // --- Cards present -------------------------------------------------------
  const studio = page.locator('.credit-card--studio');
  const profiles = page.locator('.credits-grid--contributors .credit-card--profile');

  assert(await studio.count() === 1, 'exactly one D Web Studio card', 'count=' + await studio.count());
  assert(await profiles.count() === 2, 'exactly two contributor cards', 'count=' + await profiles.count());

  const names = await page.locator('.credit-card--profile h3').allTextContents();
  assert(names.includes('Divyansh Kumar'), 'Divyansh Kumar card present', JSON.stringify(names));
  assert(names.includes('Abhay Gautam'), 'Abhay Gautam card present', JSON.stringify(names));

  // --- Images actually loaded ----------------------------------------------
  const imgInfo = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.credit-card img')).map((img) => ({
      src: img.getAttribute('src'),
      complete: img.complete,
      nw: img.naturalWidth,
      nh: img.naturalHeight,
      objectFit: getComputedStyle(img).objectFit,
      renderedW: Math.round(img.getBoundingClientRect().width),
      renderedH: Math.round(img.getBoundingClientRect().height),
    })));

  for (const i of imgInfo) {
    assert(i.complete && i.nw > 0, 'image loaded: ' + i.src, `natural=${i.nw}x${i.nh}`);
    assert(i.objectFit === 'contain', 'image is letter-boxed (contain): ' + i.src, 'object-fit=' + i.objectFit);
  }

  // --- Contained images must not be cropped --------------------------------
  for (const i of imgInfo) {
    if (!i.nw || !i.nh || !i.renderedW || !i.renderedH) continue;
    const scaled = Math.min(i.renderedW / i.nw, i.renderedH / i.nh);
    const drawnW = i.nw * scaled;
    const drawnH = i.nh * scaled;
    const fits = drawnW <= i.renderedW + 1 && drawnH <= i.renderedH + 1;
    assert(fits, 'no cropping of ' + i.src,
      `rendered=${i.renderedW}x${i.renderedH} drawn=${Math.round(drawnW)}x${Math.round(drawnH)}`);
  }

  // --- Links ---------------------------------------------------------------
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.credit-card a[target="_blank"]')).map((a) => ({
      href: a.getAttribute('href'),
      rel: a.getAttribute('rel') || '',
    })));

  assert(links.length >= 9, 'expected at least 9 external credit links', 'count=' + links.length);
  for (const l of links) {
    assert(/^https:\/\//.test(l.href), 'link is https: ' + l.href);
    assert(l.rel.includes('noopener') && l.rel.includes('noreferrer'),
      'link has rel=noopener noreferrer: ' + l.href, 'rel=' + l.rel);
  }

  const hrefs = links.map((l) => l.href).join(' ');
  for (const host of ['github.com/Mr-Divyansh', 'instagram.com', 'abhay-portflio.netlify.app']) {
    assert(hrefs.includes(host), 'links include ' + host);
  }

  // --- Keyboard focus ring -------------------------------------------------
  const firstLink = page.locator('.credit-card--profile-link').first();
  await firstLink.focus();
  const focusInfo = await firstLink.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { outlineWidth: cs.outlineWidth, outlineStyle: cs.outlineStyle, active: document.activeElement === el };
  });
  assert(focusInfo.active, 'profile link can receive keyboard focus');
  assert(focusInfo.outlineStyle !== 'none' && parseFloat(focusInfo.outlineWidth) > 0,
    'focused link shows a visible outline', JSON.stringify(focusInfo));

  // --- Tab order reaches the credit links ---------------------------------
  await page.locator('.brand-logo-img').first().focus();
  let reached = false;
  for (let i = 0; i < 40 && !reached; i++) {
    await page.keyboard.press('Tab');
    reached = await page.evaluate(() =>
      !!document.activeElement?.classList?.contains('credit-card--profile-link'));
  }
  assert(reached, 'Tab key reaches the contributor links');

  // --- No console errors / failed requests ---------------------------------
  assert(consoleErrors.length === 0, 'no console errors', consoleErrors.slice(0, 3).join(' | '));
  assert(failedRequests.length === 0, 'no failed network requests', failedRequests.slice(0, 3).join(' | '));

  await page.screenshot({ path: path.join(SHOTS, TAG + 'credits-desktop-light.png'), fullPage: true });

  // -------------------------------------------------------------------------
  // 2. Dark theme
  // -------------------------------------------------------------------------
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(200);

  const dark = await page.evaluate(() => {
    const card = document.querySelector('.credit-card--profile');
    const studio = document.querySelector('.credit-card--studio');
    const cs = getComputedStyle(card);
    const ss = getComputedStyle(studio);
    return {
      theme: document.documentElement.getAttribute('data-theme'),
      cardBg: cs.backgroundColor,
      cardBgImage: cs.backgroundImage,
      studioBgImage: ss.backgroundImage,
    };
  });

  assert(dark.theme === 'dark', 'dark theme attribute applied');
  assert(dark.cardBgImage !== 'none', 'dark theme applies a card background', JSON.stringify(dark));
  assert(dark.studioBgImage !== 'none', 'dark theme overrides the studio card background', JSON.stringify(dark));

  // Text must stay readable against the dark surface.
  const contrast = await page.evaluate(() => {
    const lum = (rgb) => {
      const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const card = document.querySelector('.credit-card--profile');
    const bg = getComputedStyle(card).backgroundColor;
    const results = [];
    for (const el of card.querySelectorAll('h3, p, a')) {
      const fg = getComputedStyle(el).color;
      results.push({
        tag: el.tagName + '.' + (el.className || '').toString().split(' ')[0],
        ratio: (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05),
      });
    }
    return { bg, results };
  });

  for (const r of contrast.results) {
    assert(r.ratio >= 4.5, 'dark theme contrast >= 4.5 for ' + r.tag,
      r.ratio.toFixed(2) + ' on ' + contrast.bg);
  }

  await page.screenshot({ path: path.join(SHOTS, TAG + 'credits-desktop-dark.png'), fullPage: true });

  await ctx.close();
}

// ---------------------------------------------------------------------------
// 3. Mobile (390px) - layout must collapse to one column
// ---------------------------------------------------------------------------
{
  const { ctx, page } = await newPage({ width: 390, height: 844 });
  await open(page);

  const layout = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.credits-grid--contributors .credit-card--profile'));
    const tops = cards.map((c) => Math.round(c.getBoundingClientRect().top));
    const studio = document.querySelector('.credit-card--studio');
    return {
      tops,
      studioCols: getComputedStyle(studio).gridTemplateColumns,
      profileCols: getComputedStyle(cards[0]).gridTemplateColumns,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      scrollW: document.documentElement.scrollWidth,
    };
  });

  assert(!layout.overflow, 'no horizontal overflow at 390px', 'scrollW=' + layout.scrollW);
  assert(layout.tops[0] !== layout.tops[1], 'contributor cards stack in a single column', JSON.stringify(layout.tops));
  assert(layout.profileCols.split(' ').length === 1, 'profile card collapses to one column', layout.profileCols);
  assert(layout.studioCols.split(' ').length === 1, 'studio card collapses to one column', layout.studioCols);

  await page.screenshot({ path: path.join(SHOTS, TAG + 'credits-mobile.png'), fullPage: true });
  await ctx.close();
}

await browser.close();

console.log('');
console.log(failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED');
process.exit(failures === 0 ? 0 : 1);
