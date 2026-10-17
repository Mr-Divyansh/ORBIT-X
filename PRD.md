# Product Requirements Document (PRD) — ORBIT-X

## 1. Project Identification
- **Project Name:** ORBIT-X (Character Portfolio: *Meet Momo — The Cloud Shepherd*)
- **Hackathon:** "Baby's First Website" 48-Hour Hackathon (17–19 October 2026) by [haX.baby](https://hax.baby)
- **Track:** Track 2 — *Your Own Baby (Original Character)*
- **Team Members:** Abhay Gautam (Frontend Lead), Divyansh Kumar (Full-Stack Lead)

---

## 2. Core Mission & Objectives
Build a warm, highly interactive, responsive portfolio website for an original character that delights visitors and judges alike.

The portfolio answers the three fundamental hackathon questions:
1. **What Momo is:** Species (Voxel Star-Sprite), cozy hoodie appearance, sleepy-curious personality, quirks, and expressive speech.
2. **What Momo does:** Celestial craft & inventions — weaving starlight lanterns, mapping dream airways, and chiming lullabies (3 interactive showcase projects).
3. **What Momo's story is:** An illustrated, scroll-driven journey from a falling star on Cloud Nine to lighting Orbit Castle (3 scenes, under 150 words each).

---

## 3. Detailed Requirements Matrix

### 3.1 Tier 1: Baseline & Mandatory Features (Must-Have)
| ID | Requirement | Acceptance Criteria | Status |
|---|---|---|---|
| **REQ-01** | Character Introduction | Prominent hero section featuring Momo atop a cloud with animated micro-interactions and dual action CTAs. | Implemented |
| **REQ-02** | 5-Point Character Sheet | Cleanly structured card displaying: Name, Species & Appearance, Profession/Talent, Origin, and Memorable Tagline. | Implemented |
| **REQ-03** | 3 Showcase Projects | Exactly 3 functional cards featuring: (1) The Lantern Loom, (2) Cloud Castle Flight Orrery, (3) Lullaby Music Box. | Implemented |
| **REQ-04** | Scroll-Driven Story | 3 narrative scenes with smooth reveal transitions; each scene is strictly under 150 words. | Implemented |
| **REQ-05** | Day / Night Mood Toggle | Functional toggle switching between "Golden Sunbeam Mode" (Yellow Hoodie) and "Starlight Dream Mode" (Fleece Coat). | Implemented |
| **REQ-06** | Pointer Reaction | Character artwork tilts in 3D parallax to mouse/touch and provides speech bubble reactions on click. | Implemented |
| **REQ-07** | Hidden Easter Egg | A secret interactive element (glowing celestial star) triggers celebration confetti and an unlocked achievement toast. | Implemented |
| **REQ-08** | Mobile & Tablet Responsive | Seamless fluid display across viewports from 320px up to 4K displays with zero horizontal scroll bleed. | Implemented |

### 3.2 Tier 2: Interactive Standout Features
| ID | Feature | Implementation Details |
|---|---|---|
| **REQ-09** | Web Audio Sound Engine | Real-time synthesized chimes and UI clicks using Web Audio API (zero external audio files). |
| **REQ-10** | Accessible Mute Switch | Persistent global audio toggle (`Sound ON / MUTE`) clearly visible in the sticky navigation. |
| **REQ-11** | Interactive Mini-Toy / Loom | Visitors can interact directly with the Lantern Loom to capture falling star sparks and illuminate lanterns. |

### 3.3 Bonus Side Quests (+13 Points)
| ID | Quest | Value | Acceptance Criteria |
|---|---|---|---|
| **BON-01** | Sparkle Cursor Trail | +2 pts | Retro stardust sparkle trail rendered smoothly on canvas following mouse movements. |
| **BON-02** | Click Sounds + Mute Toggle | +3 pts | Delightful tactile sound feedback on buttons, toggles, and cards with instant mute. |
| **BON-03** | Hit Counter Odometer | +1 pt | Classic 90s mechanical-style visitor counter ticker with animated number rolls. |
| **BON-04** | Live Starlight Guestbook | +2 pts | Interactive visitor message board with name, dream wish, timestamp, and local persistence. |
| **BON-05** | Responsive Chaos Mode | +5 pts | Toggleable retro-fun mode with wobbly stickers, nostalgic marquee, and bouncy badges. |

---

## 4. Judging Rubric Alignment
- **Functionality & Polish (35%):**
  - Zero console errors or warnings.
  - Every button, link, and interactive trigger performs a concrete, delightful action.
  - Smooth 60fps animations with CSS transforms and `requestAnimationFrame`.
- **Early-Web Soul (30%):**
  - Warm cream background palette (`#FFF8F1`), rich berry accents (`#A34063`), and playful typography (`Fredoka` & `Fraunces`).
  - Whimsical retro badges, marquee ribbon, and mechanical odometer.
- **Creativity & Surprises (20%):**
  - Interactive speech bubbles when clicking Momo.
  - Discoverable hidden constellation triggering full-screen starlight confetti.
  - Day/Night artwork switch synchronizing with the user's theme preference.
- **Clean Craft (15%):**
  - Clean semantic HTML5, modular CSS architecture with custom properties, and accessible ARIA attributes.
  - Mobile-first responsive layout tested across screen widths.

---

## 5. Non-Goals & Scope Limits
- No external authentication backends or database setups requiring API keys.
- No heavy bloated frameworks that add unnecessary load time or build fragility.
- Zero copyrighted assets; all artwork, audio, and code are original.

---

## 6. Success Metrics
1. **Lighthouse Score:** Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95.
2. **First Meaningful Paint:** < 0.5 seconds on standard 4G connections.
3. **Cross-Browser Compatibility:** Flawless in Chrome, Firefox, Safari, and Edge.
