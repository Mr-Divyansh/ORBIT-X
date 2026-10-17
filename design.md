# Design System & UI Specifications — ORBIT-X

## 1. Aesthetic Direction: "Early-Web Whimsy meets Cozy Modern Polish"
The visual identity of ORBIT-X bridges the warm, playful soul of the early web (tactile rounded buttons, starry decorations, marquee ribbons, mechanical counters) with contemporary editorial design (balanced typography, rich CSS custom properties, and buttery smooth 60fps animations).

---

## 2. Color Palette & Design Tokens

### Primary Theme: Warm Cream & Berry (Official haX.baby Palette)
```css
New Color Themes And Palates

  
:root {
  /* Cute pastel theme */
  --baby-blue: #CFE2FF;
  --powder-blue: #E4EEFF;
  --butter-yellow: #FFE8A3;
  --vanilla: #FFF2CC;
  --baby-lavender: #DCCFFF;
  --lilac-mist: #F0E9FF;
  --cotton-pink: #FFDCE8;
  --baby-mint: #D5F4E7;
  --soft-peach: #FFE2D2;
  --dream-periwinkle: #D5D9FF;
  --soft-coral: #FFC9C9;
  --cloud-cream: #FFF8F2;

  /* Light mode */
  --bg-light: #FFF8F2;
  --card-light: #FFFFFF;
  --text-light: #39364F;

  /* Dark mode */
  --bg-dark: #191A2B;
  --card-dark: #24263A;
  --surface-dark: #31304B;
  --border-dark: #484664;
  --text-dark: #FFF7FA;
  --muted-dark: #C8C9DE;

  /* Character accents */
  --divyansh-accent: #B9D4FF;
  --abhay-accent: #FFE29A;
}

```

---

## 3. Typography Hierarchy

| Role | Font Family | Weight | Fallback | Purpose |
|---|---|---|---|---|
| **Display Headings** | `Fraunces`, serif | 700 / 800 | Georgia, serif | Editorial warmth, storybook elegance, story scenes |
| **Accent & Brand** | `Fredoka`, sans-serif | 600 / 700 | 'Comic Sans MS', cursive | Playful badges, buttons, stickers, hit counter |
| **Body & UI** | `Plus Jakarta Sans`, sans-serif | 400 / 500 / 600 | system-ui, sans-serif | Clean, legible storytelling, character sheet metrics |

---

## 4. UI Components & Layout Specs

### 4.1 Sticky Navigation Bar
- Frosted glass effect with `backdrop-filter: blur(12px)` and semi-transparent cream border.
- Features:
  - Team & Character Brand Pill (`ORBIT-X ✦ MOMO`)
  - Section Quicklinks: `About`, `Inventions`, `Story`, `Guestbook`
  - Control Action Cluster:
    - ☀️/🌙 **Mood Toggle Button** (switches day/night visuals)
    - 🔊/🔇 **Sound Mute Switch** (accessible Web Audio mute)
    - 🌀 **Chaos Mode Pill** (triggers nostalgic 90s stickers)

### 4.2 Interactive Hero Section
- Dual-column hero:
  - **Left:** Welcoming headline, animated badge (*"Track 2: Original Character"*), lyrical description, and action buttons.
  - **Right:** The Cloud Dais. A floating 3D-styled card showcasing Momo holding his lantern with soft drifting cloud particles, interactive pointer parallax tilt, and a live speech bubble on click.

### 4.3 5-Point Character Sheet Card
- Designed as an illustrated adventurer passport / cloud license.
- Clean grid showing:
  - `Species`: Voxel Star-Sprite
  - `Personality`: Sleepy, Gentle & Curious
  - `Special Talent`: Celestial Starlight Weaving
  - `Origin`: Cloud Nine (Orbit Skyway)
  - `Tagline`: *"Weaving starlight into lanterns..."*

### 4.4 3 Invention Cards
- Styled with tactile retro borders, rounded corners (`border-radius: 24px`), and distinct hover-lift animations.
- Cards feature mini-interactive preview triggers that play unique pentatonic chimes upon click.

### 4.5 Story Scroll Section
- 3 storybook vignette panels with progressive scroll reveal effects.
- Gentle floating illustrations and scene badges (*Scene I, Scene II, Scene III*).

### 4.6 Bonus Interactive Elements
- **Vintage Hit Counter:** Classic black-and-green odometer with animated numbers.
- **Sparkle Cursor:** High-performance 60fps HTML5 Canvas particle emitter following pointer motion.
- **Hidden Easter Egg:** A tiny glowing constellation star embedded in the clouds; clicking triggers confetti and audio fanfares.
- **Starlight Guestbook:** Live input form allowing visitors to post a bedtime wish, saving to `localStorage`.
