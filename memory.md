# Project Memory — Stable Decisions & Durable Context

This document preserves the official, confirmed facts and architectural decisions for the **ORBIT-X** project.

---

## 1. Confirmed Project Context
- **Event:** "Baby's First Website" 48-Hour Hackathon (17–19 October 2026) organized by [haX.baby](https://hax.baby).
- **Track Selection:** Track 2 — *Your Own Baby (Original Character)*.
- **Team Name:** ORBIT-X.
- **Team Members:**
  - Abhay Gautam (Frontend Lead / Creative Direction)
  - Divyansh Kumar (Full-Stack / Technical Lead)
- **Character Name:** Momo.
- **Character Concept:** Voxel Star-Sprite & Celestial Lantern Weaver residing on Cloud Nine.
- **Dual Visual Modes:**
  - Day Mode: Yellow-and-black hoodie with warm golden eyes and cloud castle in sunset sky.
  - Night Mode: Cozy starlight fleece coat with midnight galaxy eyes and floating moonlit lanterns.
- **Asset Files:** `my character.jpeg` (Day Mode) and `character.jpeg` (Night Mode).

---

## 2. Technical Stack Decisions
- **Core Technology:** Zero-build static web application (HTML5, Modern CSS3, Vanilla ES6+).
- **Reason:** Guarantees instant deployment to Vercel/GitHub Pages without build-step fragility, achieves 100/100 Lighthouse scores, and works identically across all developer machines.
- **Audio Strategy:** Pure Web Audio API synthesis (pentatonic chimes and tactile click envelopes). No external MP3 assets needed.
- **Data Persistence:** LocalStorage for the Starlight Guestbook and Hit Counter.
- **Bonus Side Quests:** All 5 side quests included (Sparkle cursor +2, Click audio +3, Hit counter +1, Guestbook +2, Chaos mode +5 = +13 bonus points).

---

## 3. Decision Log
- **2026-10-17 — Decision:** Selected Track 2 (Original Character) over Track 1 (Pip).
  - *Reason:* Team possessed custom high-resolution voxel artwork with perfect day/night dual aesthetics.
  - *Impact:* Defined Momo character sheet and 3 celestial invention projects.
- **2026-10-17 — Decision:** Implemented native Web Audio API instead of bundling audio files.
  - *Reason:* Eliminates asset load delays, prevents 404 audio errors, and allows dynamic musical pitch variations.
  - *Impact:* Instant auditory feedback on every user interaction.


