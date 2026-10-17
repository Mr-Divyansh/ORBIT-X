# Technical Architecture & Rendering Pipeline — ORBIT-X

## 1. Architectural Principles
1. **Zero-Dependency Core:** Implemented with modern vanilla ES6+, HTML5, and CSS3. Requires no Node.js compilation, complex bundling, or fragile runtime dependencies. Runs instantly across any static server, GitHub Pages, or Vercel.
2. **Deterministic State Flow:** Unidirectional state management for theme (Day/Night), sound (Muted/Active), chaos mode, and guestbook items.
3. **Hardware-Accelerated Rendering:** Uses CSS transforms (`translate3d`), `will-change`, and a dedicated `<canvas>` particle loop driven by `requestAnimationFrame`.
4. **Accessible First:** Adheres to semantic HTML, ARIA attributes, keyboard accessibility, and respects `prefers-reduced-motion`.

---

## 2. System Component Diagram

```
+-------------------------------------------------------------------------------+
|                                  ORBIT-X UI                                   |
|  [Header & Controls]  [Hero Stage]  [Character Sheet]  [Inventions]  [Story]  |
+---------------------------------------+---------------------------------------+
                                        |
                 +----------------------+----------------------+
                 |                      |                      |
                 v                      v                      v
        +-----------------+    +-----------------+    +-----------------+
        | Theme Manager   |    | Web Audio Engine|    | Canvas Sparkles |
        | - Day/Night Mode|    | - Pentatonic    |    | - Mouse Tracker |
        | - Chaos Mode    |    | - Click Pops    |    | - Particle Loop |
        | - LocalStorage  |    | - Global Mute   |    | - Reduced-Motion|
        +-----------------+    +-----------------+    +-----------------+
                 |                      |                      |
                 +----------------------+----------------------+
                                        |
                                        v
                            +-----------------------+
                            | Starlight Data Store  |
                            | - Guestbook Messages  |
                            | - Hit Counter (Hits)  |
                            | - Easter Egg State    |
                            +-----------------------+
```

---

## 3. Core Modules & Pipelines

### 3.1 Dual Mood Theme Engine (`ThemeManager`)
- Listens to theme toggle buttons.
- Toggles `data-theme="night"` attribute on `document.documentElement`.
- Swaps active character artwork seamlessly between `character-day.jpg` and `character-night.jpg` with smooth opacity cross-fades.
- Saves preference to `localStorage.getItem('orbitx_theme')`.

### 3.2 Web Audio API Sound Synthesizer (`AudioEngine`)
- Direct programmatic sound synthesis without external audio file latency or copyright concerns.
- Uses `AudioContext` with master `GainNode` connected to dynamic `OscillatorNode` instances.
- **Sound Palettes:**
  - *Click / Pop:* 600Hz to 180Hz rapid pitch drop (40ms envelope).
  - *Starlight Chimes:* Pentatonic scale frequencies ($C_5, D_5, E_5, G_5, A_5, C_6$) with soft sine waves and gentle exponential decay.
  - *Fanfare / Easter Egg:* Multi-tone arpeggio burst celebrating discoveries.
- **Accessible Mute Switch:** Master gain instantly set to `0` upon user command.

### 3.3 Particle & Cursor Trail Pipeline (`SparkleCanvas`)
- Positioned fixed across the viewport with `pointer-events: none; z-index: 9999`.
- Subscribes to `pointermove` events.
- Spawns lightweight stardust particles:
  - `{ x, y, vx, vy, size, alpha, color, rotation }`
- Main rendering loop calculates friction, gravity drift, and opacity decay at 60fps via `requestAnimationFrame`. Automatically hibernates when pointer is stationary.

### 3.4 3D Parallax Character Tilt (`HeroInteraction`)
- Tracks mouse coordinates relative to the hero card center.
- Calculates Euler angles $\theta_x, \theta_y \in [-12^\circ, 12^\circ]$.
- Applies `transform: perspective(1000px) rotateX(...) rotateY(...) scale3d(1.02, 1.02, 1.02)` for a tactile, lifelike response.
- Fully touch-friendly: taps on mobile trigger a happy bounce and speech bubble.

### 3.5 Easter Egg & Confetti Subsystem
- Hidden constellation star equipped with click listener and keyboard `Enter` trigger.
- Generates high-performance canvas celebration confetti burst.
- Dispatches custom celebratory audio fanfare and displays an achievement badge.

### 3.6 Guestbook & Visitor Counter Persistence
- `localStorage` key `orbitx_guestbook`: Stores array of JSON objects `{ name, message, timestamp, starColor }`.
- `localStorage` key `orbitx_visits`: Increments visitor count and animates the mechanical odometer.
