# Project & Coding Rules — ORBIT-X

## 1. General Principles
- **Golden Rule:** A 100% working, ultra-polished Tier 1 & Tier 2 experience always beats a half-baked, broken Tier 3 feature.
- **Zero Console Errors:** The browser developer console must remain completely clean at all times (no uncaught exceptions, 404 image errors, or failed promises).
- **Respect Teammates' Work:** Coordinate on branches and avoid overwriting existing code or architecture without mutual alignment.

---

## 2. Coding & Technical Standards

### 2.1 CSS & Styling
- Use CSS Custom Properties (variables) defined in `:root` and `[data-theme="night"]` for all color and spacing values.
- Never hardcode raw hex values directly in component rules.
- Mobile-first responsive design using modern CSS Flexbox and CSS Grid.
- Support `prefers-reduced-motion` media queries:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```

### 2.2 JavaScript & State Management
- Write clean, modular ES6+ JavaScript.
- Avoid global variable pollution; encapsulate logic in scoped modules/objects.
- Any event listener attached to `window` or `document` must be lightweight and debounced or throttled where appropriate (e.g. `requestAnimationFrame` for cursor tracking).
- Always guard Web Audio API initialization behind user interaction to prevent browser autoplay blocking.

### 2.3 Audio Engine & Accessibility
- **Mute Control is Mandatory:** Never play audio without giving users an immediate, obvious way to mute sound.
- All interactive controls (buttons, links, sliders) must have meaningful `aria-label` or accessible text descriptions.
- Ensure color contrast ratios meet WCAG AA standards (minimum 4.5:1 for body text).

---

## 3. Git & Repository Etiquette
- **Main Branch Stability:** The `main` branch must always remain deployable and bug-free.
- **Feature Branches:** Use descriptive branch names: `feature/audio-engine`, `feature/guestbook`, `fix/mobile-nav`.
- **Commit Messages:** Use clear conventional commit style:
  - `feat: add pentatonic web audio chime synthesizer`
  - `fix: resolve mobile header overlap on iPhone SE`
  - `docs: update PRD with verified character sheet`
- **Secrets Policy:** Never commit secrets, tokens, or private credentials to the repository.
