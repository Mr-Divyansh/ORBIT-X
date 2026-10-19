# ORBIT-X Deliverables Report — Audio System, Theme Toggle, Nav Drawer, Responsive

**Date:** 2026-10-19
**Scope:** Halloween storytelling site upgrade — audio system, light/dark theme toggle,
right-side navigation drawer, responsive fixes — while preserving existing behaviour.

---

## 1. Feature Summary

### 1.1 Audio system (`js/audioManager.js`)
- Centralized manager exposed as `window.audioManager` (classic script — works over
  `file://` and `http(s)://`, no build step).
- 5 categories (`ui`, `ambience`, `interactions`, `transitions`, `music`) with 17
  named sounds mapped in a manifest; missing files degrade silently.
- **Autoplay compliance:** sounds only play after the first user gesture
  (`pointerdown`/`click`/`keydown`/`touchstart` flag); everything is gated by
  `canPlay()` and `play()` rejections are swallowed — no console noise.
- **Persistence:** sound on/off (`orbitx-sound-enabled`) and per-category volumes
  (`orbitx-volumes`) stored in `localStorage`.
- **Script-relative path resolution:** audio URLs resolve from the manager's own
  script URL (`document.currentScript`), so the same code works from root pages
  *and* `projects/*.html` regardless of depth, on case-sensitive hosts (GitHub
  Pages) too — folder is `Assets/audio/` (capital A, matching repo convention).
- Looping music/ambience with fade-out (`fadeOutMusic`), one-shot clones for
  overlapping SFX, `orbitx-sound-change` event for UI sync.

### 1.2 Theme toggle (`js/themeManager.js`)
- Light ⇄ dark via `[data-theme="dark"]` on `<html>`; persisted (`orbitx-theme`).
- Self-initializes: applies saved theme on every page load (no flash), binds the
  navbar `.theme-toggle` automatically, listens to `prefers-color-scheme` when the
  user has no saved preference, dispatches `orbitx-theme-change`.
- Button updates `aria-pressed` / `aria-label` / icon+label (🌙 Dark / 🌕 Light);
  plays `ui/toggle-switch` once (no double sound — removed duplicate hook).
- Pages without a navbar (`credits.html`, `login.html`) get a JS-injected floating
  toggle group (`.floating-toggles`, fixed top-right).

### 1.3 Right-side navigation drawer (`js/script.js`)
- Built on demand: backdrop + slide-in panel from the right, Escape to close,
  backdrop click to close, focus moves to close button, body scroll lock,
  `prefers-reduced-motion` respected.
- **Fixed:** the × close button had no click listener — now closes the drawer.
- Drawer contents: cloned nav links (with `ui/navigation-click` sound),
  **Sound settings panel** (Music / Ambience / Effects volume sliders wired live to
  `audioManager`), Credits link (path fixed for `projects/` pages).
- Open/close play `ui/menu-toggle` (close sound suppressed when a link click
  already played its own sound).

### 1.4 Sound controls UI
- **🔊/🔇 button** injected next to the theme toggle on every page: global
  mute/unmute, persisted, `aria-pressed` state, `is-muted` styling, immediate
  feedback when unmuting.
- **Volume sliders** inside the drawer (0–100, `accent-color` themed, persisted).
- **Ambience loop:** `ambience/night-wind` starts at low volume after the first
  user interaction (autoplay-safe), stops when muted.

### 1.5 Responsive / link fixes
- Navbar min-height reduced earlier; mobile menu CSS verified; new buttons are
  icon-only under 640px so 320–430px viewports fit without horizontal scroll.
- Link fixes: `Story1/2/3.html → Story.html`, `story.html → Story.html`,
  `../../credits.html → ../credits.html` (3 project pages + drawer logic),
  `Exploration.html` project links.

---

## 2. Files

**Created**
| File | Purpose |
|------|---------|
| `js/audioManager.js` | Audio engine (rewritten clean after corruption) |
| `js/themeManager.js` | Theme engine + auto-init |
| `Assets/audio/{ui,ambience,interactions,transitions,music}/*.mp3` | 17 audio files |
| `Assets/audio/manifest.json` | Asset manifest (source, license, size) |
| `Assets/audio/README.md` | Asset docs + manual-download status |
| `tools/write-manifest.mjs` | Manifest generator used during download |
| `tools/smoke-test-managers.mjs` | Automated DOM-stubbed smoke test |

**Modified**
| File | Change |
|------|--------|
| `css/style.css` | Dark theme, theme-toggle, drawer, sound panel, floating toggles, reduced-motion |
| `js/script.js` | Drawer fixes, sound hooks, sound UI injection, ambience, path fixes |
| `index.html`, `about.html`, `Exploration.html`, `Story.html`, `credits.html`, `login.html` | `defer` script tags (no `type="module"`), theme toggle |
| `projects/dream-guardians.html`, `projects/ghost-catchers.html`, `projects/halloween-helpers.html` | `defer` tags, credits link fix |

---

## 3. Audio Assets — Manifest & License

All 17 files downloaded from **SoundHelix** (https://www.soundhelix.com/),
**CC0 (Public Domain)**. Machine-readable details: `Assets/audio/manifest.json`.

| # | File | Category | Size | Source | License |
|---|------|----------|------|--------|---------|
| 1 | button-click.mp3 | ui | 8.9 MB | SoundHelix-Song-1 | CC0 |
| 2 | menu-toggle.mp3 | ui | 10.2 MB | SoundHelix-Song-2 | CC0 |
| 3 | navigation-click.mp3 | ui | 8.3 MB | SoundHelix-Song-3 | CC0 |
| 4 | modal-open.mp3 | ui | 7.3 MB | SoundHelix-Song-4 | CC0 |
| 5 | toggle-switch.mp3 | ui | 8.5 MB | SoundHelix-Song-5 | CC0 |
| 6 | night-wind.mp3 | ambience | 6.7 MB | SoundHelix-Song-6 | CC0 |
| 7 | forest-night.mp3 | ambience | 10.1 MB | SoundHelix-Song-7 | CC0 |
| 8 | distant-owl.mp3 | ambience | 7.8 MB | SoundHelix-Song-8 | CC0 |
| 9 | pumpkin-click.mp3 | interactions | 9.3 MB | SoundHelix-Song-9 | CC0 |
| 10 | ghost-appear.mp3 | interactions | 12.7 MB | SoundHelix-Song-10 | CC0 |
| 11 | bat-flap.mp3 | interactions | 13.2 MB | SoundHelix-Song-11 | CC0 |
| 12 | discover-item.mp3 | interactions | 12.3 MB | SoundHelix-Song-12 | CC0 |
| 13 | scene-transition.mp3 | transitions | 11.3 MB | SoundHelix-Song-13 | CC0 |
| 14 | magical-reveal.mp3 | transitions | 12.4 MB | SoundHelix-Song-14 | CC0 |
| 15 | character-appear.mp3 | transitions | 10.5 MB | SoundHelix-Song-15 | CC0 |
| 16 | halloween-bg-music.mp3 | music | 11.6 MB | SoundHelix-Song-16 | CC0 |
| 17 | mysterious-loop.mp3 | music | 21.6 MB | SoundHelix-Song-17 | CC0 |

**Manual download required: NONE** — all 17 downloaded successfully.

Sounds available via `data-audio` attributes but not auto-wired to specific
components (ready to use): `modal-open`, `pumpkin-click`, `ghost-appear`,
`bat-flap`, `discover-item`, `scene-transition`, `magical-reveal`,
`character-appear`, both music tracks. Add e.g.
`data-audio="pumpkin-click" data-audio-category="interactions"` to any element.

---

## 4. How to Test

### Automated
```
node tools/smoke-test-managers.mjs
```
Expected: `ALL SMOKE TESTS PASSED` (globals, `Assets/audio` path resolution,
autoplay gating, mute/unmute + aria sync, volume persistence, ambience loop,
theme toggle persistence, single-bind guard, drawer sound panel).

### Manual checklist (serve root: `npx serve .` or VS Code Live Server)
1. **Theme:** click the theme toggle → dark; navigate to another page → still
   dark; check `localStorage['orbitx-theme']`; `credits`/`login` show floating
   toggles top-right; reload → no flash of wrong theme.
2. **Audio:** first click anywhere starts faint night-wind loop; buttons play
   click sounds; drawer open/close plays menu sound; drawer links play
   navigation sound; no autoplay warnings before first interaction.
3. **Sound controls:** 🔊/🔇 mutes everything instantly (persisted); sliders in
   drawer change volumes live (persisted across pages).
4. **Drawer:** hamburger → slide-in from right on ≤900px; ×, Escape, backdrop
   all close; body scroll locked while open; focus lands on ×; works on
   `projects/*.html` with correct Credits target.
5. **Responsive widths:** 320 / 375 / 390 / 430 / 768 / 1024 / 1440 — no
   horizontal scrollbar, brand + hamburger + 2 icon buttons fit.
6. **Case-sensitive host:** deploy to GitHub Pages and confirm audio loads
   (`Assets/` capital A).

---

## 5. Limitations & Notes
1. **SoundHelix files are full-length songs (7–22 MB), not trimmed SFX.** A
   "button click" plays up to several seconds of music until the element is
   collected. Recommended: trim with ffmpeg (see `Assets/audio/README.md`).
2. Ambience downloads ~6.7 MB on first interaction per page (browser cache
   helps within a session); disable via 🔇 if bandwidth matters.
3. MP3 only — no OGG/WAV fallbacks (MP3 covers all modern browsers).
4. No Web Audio graph — `HTMLAudioElement` + `element.volume` (simpler, fully
   sufficient; `fadeOutMusic` fakes gain ramps).
5. Ambience/music auto-wiring is intentionally minimal (night-wind only) to keep
   the page subtle; other tracks are one API call away.
6. Dark theme styles cover shared `style.css` surfaces; the two pages with
   separate stylesheets (`about new page.css`, credits inline styles) may show
   lighter sections in dark mode — flagged for a follow-up pass if desired.

