# ORBIT-X — Global Dark Mode + Credits Upgrade Report

Date: 2026-10-19 · Branch: `main` · All changes implemented directly in the existing project.

---

## 1. Summary of changes

### Global theme system (fixed)
- The dark theme is now a **single token-driven system**: `css/style.css` declares all
  semantic CSS variables in `:root` (light values = the exact original ORBIT-X palette)
  and re-points every one of them in the `[data-theme="dark"]` block. Components that
  use `var(...)` switch instantly with the toggle.
- **New shared tokens** added to `:root` / `[data-theme="dark"]`:
  `--surface`, `--surface-2`, `--bg-navbar`, `--btn2-ink/bg/border/hover`,
  `--text-heading`, `--text-caption`, plus `color-scheme: light|dark`.
- **Dark palette** (adapted from the requested spec, tuned to the ORBIT-X identity):
  page `#171522` · sections `#211D30` · navbar `rgba(41,37,54,.94)` ·
  text `#F7F2FF` / `#C5BCD9` · accents `#A984F5` / `#C9B3FF` · borders ≈ `#403750`.
- Every page-specific stylesheet received an appended `[data-theme="dark"]` override
  section for its legacy hardcoded colors (cards, chips, footers, forms, captions).
  Decorative *light sources* (moons, lanterns, stars, glows, halos, artwork frames)
  intentionally keep their light fills in both themes.
- **Flash prevention**: every page now runs a tiny inline head script (before the first
  stylesheet) that restores the saved theme — or the OS preference — before first paint.
- **System preference support**: `js/themeManager.js` now defaults to dark when
  `prefers-color-scheme: dark` is set and the user has never chosen a theme; live OS
  changes still propagate while no explicit choice exists.
- **`<meta name="theme-color">`** now follows the active theme (mobile browser chrome).

### Credits page (rebuilt as a native part of the site)
- Reuses the **shared navbar component** (logo, Home/About/Exploration/Stories/Credits/Login,
  hamburger, theme toggle). `js/script.js` builds the right-side drawer from these links,
  so credits gets the same animated drawer + sound panel as every other page.
- Reuses the **shared `orbit-footer` component** (same stylesheet set as the homepage:
  `css/style.css` + `css/about.css`) and the Nunito font.
- Nine content sections: intro/hero, team, stories & writing, character artwork,
  backgrounds & visual assets, music & SFX, fonts/icons/libraries/tools, special
  acknowledgements, and vision — plus the site footer.
- All colors come from the shared theme tokens, so the page follows light/dark
  automatically. Hover/focus states on cards and links; external links open safely
  (`target="_blank" rel="noopener noreferrer"`). Fully responsive
  (`auto-fit` grids, `clamp()` type, safe to 320 px).

### Audit fixes across all pages
- **Homepage (`index.html`)**: navbar, mobile nav panel, secondary buttons, section
  backgrounds, storybook captions/finale text, and the `.about-page`/mission/character
  sections (`css/about.css`) all theme-switch now.
- **About (`about.html`)**: `--about-*` token block re-pointed for dark; cards, chips,
  footer, and ~20 literal text colors overridden.
- **Exploration**: project cards use `var(--surface)`; ending banner, action pills, and
  back-button themed; `.about-footer` themed.
- **Project pages + Stories library (`pages.css`)**: all `#fff` card surfaces converted
  to `var(--surface)` (light value identical), per-story `--t-*` accent tokens get
  dark variants, frosted surfaces use `--surface-2`.
- **Story shell (`story.css`)** and **Forgotten Treats (`forgotten-treats.css`)**:
  nav bars, notes, chips, quote panels, buttons, footers themed.
- **Login (`login.css`)**: self-contained dark theme (login does not load `style.css`)
  re-pointing its own tokens + card/form/button/scene overrides.
- **Broken references fixed**: `login.html` referenced a non-existent `login.js`
  (404 on every visit — now created) and two non-existent lantern PNGs (removed;
  they rendered nothing but logged 404s).
- Stale lowercase-`assets/audio` references in `manifest.json`/`README.md` were
  verified: **0 occurrences** (already correct).

---

## 2. Root cause of the original dark-mode bug

**Primary cause:** `css/style.css` paints the page background on `body::before` — a
*fixed, full-viewport pseudo-element with `z-index:-2`* carrying the cream
`linear-gradient(120deg, #fffaf5 …)`. The old dark rules set `[data-theme="dark"] body
{ background: … }`, but an element's own background paints **beneath** its `::before`
layer, so the light gradient covered the dark one. The navbar looked dark only because
it has its own opaque background. (Fixed with `[data-theme="dark"] body::before`.)

**Secondary causes:**
1. The dark theme was only ~8 partial overrides in `style.css`; sections, cards, and
   footers were hardcoded light hex colors with no token indirection.
2. Each page loads a different page-specific stylesheet (`about.css`,
   `about new page.css`, `exploration*.css`, `pages.css`, `story.css`,
   `forgotten-treats.css`, `login.css`) — **none of them had any dark rules at all**.
3. `credits.html` redefined the `:root` tokens in an inline `<style>` that loads
   *after* `style.css`, so equal-specificity `:root` beat the `[data-theme="dark"]`
   block and even the tokens stayed light on that page.
4. No pre-paint theme restore existed, so a saved dark preference flashed light.
5. `_loadTheme()` ignored system preferences for first-time visitors.

---

## 3. Files responsible for global theme management

| File | Role |
|---|---|
| `js/themeManager.js` | Single source of truth for state: `data-theme="dark"` on `<html>`, `orbitx-theme` in localStorage, OS-preference default, toggle UI/ARIA sync, `orbitx-theme-change` events, `theme-color` meta sync. |
| Inline `<head>` snippet in all 9 root HTML pages | Pre-paint restore of the saved/OS theme (no listeners, no state — mirrors `themeManager` read logic only). |
| `css/style.css` | **Token source of truth** — `:root` (light) + `[data-theme="dark"]` (dark) define every semantic variable; shared chrome (navbar, drawer, buttons, toggles) themed here. |
| Page stylesheets (`about.css`, `about new page.css`, `exploration.css`, `exploration2.css`, `pages.css`, `story.css`, `forgotten-treats.css`, `login.css`) | Load after `style.css`; each ends with a `[data-theme="dark"]` override section for its legacy colors. `login.css` is self-contained and re-points its own tokens to the same attribute. |

Cascade rule: base rules use tokens (`var(--…)`) → tokens flip globally; remaining
literal-color rules are overridden by same-file `[data-theme="dark"]` selectors
(equal specificity, later in the file → they win).

---

## 4. Modified and created files

**Modified**

| File | Change |
|---|---|
| `css/style.css` | Token expansion, base hardcode→token swaps (navbar ×4, buttons, sections, mobile nav), full dark-block rewrite (tokens, `body::before`, chrome, hero, storybook). |
| `css/about.css` | Dark block: `.about-page` gradient/tokens, cards, mission cards, callouts, footer. |
| `css/about new page.css` | Dark block: `--about-*` tokens + ~25 component/text overrides + both footer variants. |
| `css/exploration.css` | Project card → `var(--surface)`; dark block for ending banner, action pills, back button, footer. |
| `css/exploration2.css` | Dark block for the shared `orbit-footer` (Exploration/Story/projects). |
| `css/pages.css` | 14 card surfaces → `var(--surface)`/`var(--surface-2)`; per-story `--t-*` dark variants. |
| `css/story.css` | Dark block: story nav, note cards, tags, secondary button, footer. |
| `css/forgotten-treats.css` | Dark block: navbar, kicker, chips, quote, buttons, footer (file kept in its original UTF-16LE encoding). |
| `css/login.css` | Self-contained `[data-theme="dark"]` system (30 rules). |
| `js/themeManager.js` | OS-preference default + `theme-color` meta sync. |
| `index.html`, `about.html`, `Exploration.html`, `Story.html`, `projects/*.html` (×3), `login.html`, `credits.html` | Pre-paint theme bootstrap script in `<head>`. |
| `login.html` | Also: removed 2 broken lantern images. |

**Created**

| File | Purpose |
|---|---|
| `credits.html` | Full rebuild: shared navbar + drawer + theme/sound toggles, 9 credit sections, shared footer. |
| `login.js` | Missing script referenced by `login.html` (password toggle, validation feedback, Google placeholder) — fixes a console 404. |
| `tools/theme-pref-test.mjs` | Node test for OS-preference defaults + saved-precedence. |
| `THEME-CREDITS-REPORT.md` | This report. |

---

## 5. Testing performed (automated)

- `node tools/smoke-test-managers.mjs` → **ALL PASSED** (audio path/autoplay/mute/volumes,
  theme toggle + persistence + ARIA, single-bind guarantee, sound-button injection,
  full `script.js` drawer integration with sound panel).
- `node tools/theme-pref-test.mjs` → **ALL PASSED** (7 assertions: OS-dark default,
  OS-light default, saved-preference precedence, `data-theme` attribute flipping).
- `node --check` clean on `themeManager.js`, `script.js`, `audioManager.js`, `login.js`.
- Structural sweeps: brace balance equal in all 9 stylesheets; encoding/NUL check on
  every edited file (one corruption incident on the UTF-16 `forgotten-treats.css` was
  detected, restored from git, re-appended in UTF-16, and verified byte-level); credits
  tag balance (10/10 `<section>`); 0 leftover part markers; FOUC snippet in 9/9 pages;
  0 `type="module"`; 0 lowercase `assets/audio`; 0 `lantern trans` references.
- Final leftover-color audit: every remaining light `background:#fff/white` rule is a
  decorative light source (moon/halo/glow) or an artwork frame — or is already covered
  by a dark override.

## 6. What could not be tested here (manual checklist)

This environment has no browser, so please verify visually:
1. Open `index.html`, toggle dark → entire page (hero, sections, storybook, footer) goes
   night-violet; toggle back → original cream restored.
2. Navigate to all 9 pages in dark mode; refresh each → theme persists, no light flash.
3. `credits.html` directly + via navbar: drawer slides in from the right, sound panel
   works, active link highlighted, footer matches other pages.
4. Mobile widths 320/375/390/430 px: hamburger drawer, theme+sound toggles fit,
   credits cards stack, no horizontal scroll. 768/1024/1440 px: grids reflow.
5. `login.html`: dark card/inputs readable; password eye toggle, validation messages,
   Google placeholder message all respond (new `login.js`).
6. Keyboard: Tab through toggles/cards/links; focus rings visible in both themes.
7. OS-level dark mode in a private window → site opens dark with no saved preference.

## 7. Credits information that still needs your input

Clearly marked placeholders exist on `credits.html` for:
- Additional **team members / roles / links** (besides Divyansh → GitHub, Abhay, D Web Studio).
- **Story authors** for the four stories (names are not recorded anywhere in the repo).
- **Individual illustrators** for character art, scenes, and backgrounds (repo only
  credits “the team”; per-asset attribution unknown).
- **Acknowledgements** names (friends/family/testers).
- **Development tools** you want credited (editor, AI assistants, design software).
- Optional: confirm the SoundHelix license wording you prefer, and whether footer link
  labels (“Ghost Purificators”, “Magical Gadgets”) should point anywhere new.

## 8. Known limitations / follow-ups

- SoundHelix tracks are full-length songs (7–22 MB each); trimming them into short
  loops with `ffmpeg` is recommended for production (see `DELIVERABLES-REPORT.md`).
- `css/forgotten-treats.css` is stored as UTF-16LE (pre-existing repo quirk). It works
  (BOM present) but converting it to UTF-8 would be a nice cleanup.
- `_footer.js` in the repo root is referenced nowhere (dead file, left untouched).
- The credits inline `<style>` remains inline by design (page-local layout only;
  all colors come from the shared tokens).
