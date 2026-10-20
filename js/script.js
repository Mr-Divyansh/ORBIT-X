// ============================================================================
// ORBIT-X — Navbar scroll effect: transparent → opaque on scroll
// ============================================================================

(function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  let ticking = false;
  function updateNavbar() {
    if (window.scrollY > 10) {
      navbar.classList.add('is-scrolled');
    } else {
      navbar.classList.remove('is-scrolled');
    }
    ticking = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateNavbar);
        ticking = true;
      }
    },
    { passive: true }
  );

  // Set initial state on load
  updateNavbar();
})();

// ============================================================================
// ORBIT-X — Navigation Drawer (right-side slide-in)
// ============================================================================

const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

let drawerBackdrop = document.querySelector('.nav-drawer-backdrop');
let drawer = document.querySelector('.nav-drawer');

function ensureDrawerElements() {
  if (!drawerBackdrop) {
    drawerBackdrop = document.createElement('div');
    drawerBackdrop.className = 'nav-drawer-backdrop';
    drawerBackdrop.setAttribute('aria-hidden', 'true');
    // Clicking the backdrop closes the drawer (the element is created lazily,
    // so its listener is attached here where the node exists).
    drawerBackdrop.addEventListener('click', () => closeDrawer());
    document.body.appendChild(drawerBackdrop);
  }
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.className = 'nav-drawer';
    drawer.setAttribute('role', 'navigation');
    drawer.setAttribute('aria-label', 'Main navigation drawer');

    // Build drawer header with close button
    const header = document.createElement('div');
    header.className = 'nav-drawer__header';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'nav-drawer__close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close navigation menu');
    closeBtn.addEventListener('click', () => closeDrawer());
    header.appendChild(closeBtn);
    drawer.appendChild(header);

    // Build drawer nav from existing nav-links
    const navContainer = document.createElement('nav');
    navContainer.className = 'nav-drawer__nav';
    if (navLinks) {
      const links = navLinks.querySelectorAll('a');
      links.forEach((link) => {
        const clone = link.cloneNode(true);
        clone.addEventListener('click', () => {
          if (window.audioManager && window.audioManager.isEnabled()) {
            window.audioManager.play('ui', 'navigation-click', { volume: 0.5 });
          }
          closeDrawer(true);
        });
        navContainer.appendChild(clone);
      });
    }
    drawer.appendChild(navContainer);

    // Theme + sound controls. On mobile the navbar copies are hidden by CSS,
    // so the drawer carries the real controls. Both stay synced through
    // themeManager (multi-button) and the 'orbitx-sound-change' event.
    const controlsSection = document.createElement('div');
    controlsSection.className = 'nav-drawer__controls';
    const drawerThemeBtn = document.createElement('button');
    drawerThemeBtn.className = 'theme-toggle';
    drawerThemeBtn.type = 'button';
    drawerThemeBtn.setAttribute('aria-label', 'Switch to Dark Mode');
    drawerThemeBtn.setAttribute('aria-pressed', 'false');
    const dtIcon = document.createElement('span');
    dtIcon.className = 'theme-icon';
    const dtLabel = document.createElement('span');
    dtLabel.className = 'theme-label';
    dtLabel.textContent = 'Light';
    drawerThemeBtn.appendChild(dtIcon);
    drawerThemeBtn.appendChild(dtLabel);
    if (window.themeManager) window.themeManager.bindToggle(drawerThemeBtn);
    controlsSection.appendChild(drawerThemeBtn);
    controlsSection.appendChild(createSoundToggle());
    drawer.appendChild(controlsSection);

    // Sound settings — volume sliders wired straight to audioManager
    const soundSection = document.createElement('div');
    soundSection.className = 'nav-drawer__sound';
    const soundTitle = document.createElement('h3');
    soundTitle.textContent = 'Sound';
    soundSection.appendChild(soundTitle);
    [['music', 'Music'], ['ambience', 'Ambience'], ['sfx', 'Effects']].forEach(
      ([category, labelText]) => {
        const row = document.createElement('label');
        row.className = 'sound-row';
        const caption = document.createElement('span');
        caption.textContent = labelText;
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '100';
        slider.step = '1';
        slider.setAttribute('aria-label', labelText + ' volume');
        slider.value = window.audioManager
          ? String(Math.round(window.audioManager.getVolume(category) * 100))
          : '50';
        slider.addEventListener('input', () => {
          if (window.audioManager) {
            window.audioManager.setVolume(category, Number(slider.value) / 100);
          }
        });
        row.appendChild(caption);
        row.appendChild(slider);
        soundSection.appendChild(row);
      }
    );
    drawer.appendChild(soundSection);

    // Divider + credits link
    const divider = document.createElement('div');
    divider.className = 'nav-drawer__divider';
    drawer.appendChild(divider);

    const creditsSection = document.createElement('div');
    creditsSection.className = 'nav-drawer__credits';
    const creditsLink = document.createElement('a');
    const href = window.location.pathname.includes('/projects/') ? '../credits.html' : 'credits.html';
    creditsLink.href = href;
    creditsLink.textContent = 'Credits';
    creditsLink.addEventListener('click', () => {
      if (window.audioManager && window.audioManager.isEnabled()) {
        window.audioManager.play('ui', 'navigation-click', { volume: 0.5 });
      }
    });
    creditsSection.appendChild(creditsLink);
    drawer.appendChild(creditsSection);

    document.body.appendChild(drawer);
  }
}

let drawerScrollY = 0;

function openDrawer() {
  ensureDrawerElements();
  drawerScrollY = window.scrollY;
  // Lock background scrolling (position:fixed via .nav-drawer-open) while
  // remembering the user's place so closing restores the exact spot.
  document.body.style.top = `-${drawerScrollY}px`;
  drawerBackdrop.classList.add('is-visible');
  drawer.classList.add('is-open');
  document.body.classList.add('nav-drawer-open');
  if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
  // Focus the close button for keyboard users
  const closeBtn = drawer.querySelector('.nav-drawer__close');
  if (closeBtn) closeBtn.focus();

  // Play menu toggle sound
  if (window.audioManager && window.audioManager.isEnabled()) {
    window.audioManager.play('ui', 'menu-toggle', { volume: 0.4 });
  }
}

function closeDrawer(silent) {
  if (!drawerBackdrop || !drawer) return;
  const wasOpen = drawer.classList.contains('is-open');
  drawerBackdrop.classList.remove('is-visible');
  drawer.classList.remove('is-open');
  document.body.classList.remove('nav-drawer-open');
  document.body.style.top = '';
  window.scrollTo(0, drawerScrollY);
  if (menuToggle) {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.focus();
  }
  // Close feedback sound (suppressed when a link click already played one).
  if (!silent && wasOpen && window.audioManager && window.audioManager.isEnabled()) {
    window.audioManager.play('ui', 'menu-toggle', { volume: 0.3 });
  }
}

function toggleDrawer() {
  if (drawer && drawer.classList.contains('is-open')) {
    closeDrawer();
  } else {
    openDrawer();
  }
}

if (menuToggle) {
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDrawer();
  });
}

// Close drawer on backdrop click
if (drawerBackdrop) {
  drawerBackdrop.addEventListener('click', () => closeDrawer());
}

// Close drawer on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeDrawer();
  }
});

// Keep keyboard focus inside the open drawer (Tab cycles through visible
// controls only; Shift+Tab wraps backwards).
const ORBIT_FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab' || !drawer || !drawer.classList.contains('is-open')) return;
  const items = Array.from(drawer.querySelectorAll(ORBIT_FOCUSABLE))
    .filter((el) => el.offsetParent !== null);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

// Close drawer when clicking a link inside it (handled in ensureDrawerElements)
// Also close the old mobile menu when drawer opens/closes
const origLinks = document.querySelectorAll('.nav-links a');
origLinks.forEach((link) => {
  link.addEventListener('click', () => {
    closeDrawer();
    document.querySelectorAll('.nav-links a').forEach((item) => item.classList.remove('active'));
    link.classList.add('active');
  });
});

document.querySelectorAll('[data-character-image]').forEach((visual) => {
  const soloImage = visual.querySelector('.character-image-solo');
  const gadgetImage = visual.querySelector('.character-image-gadget');
  const gadgetCard = visual.closest('.character-card');
  const hoverAvailable = window.matchMedia('(hover: hover)');
  const setGadgetVisible = (visible) => {
    visual.classList.toggle('is-gadget-visible', visible);
    if (gadgetCard) gadgetCard.classList.toggle('is-gadget-on', visible);
    visual.setAttribute('aria-pressed', String(visible));
    soloImage.setAttribute('aria-hidden', String(visible));
    gadgetImage.setAttribute('aria-hidden', String(!visible));
    visual.setAttribute(
      'aria-label',
      `${visual.dataset.characterName}${visible ? ` with ${visual.dataset.gadgetLabel}` : `, activate to show ${visual.dataset.gadgetLabel}`}`
    );
  };

  if (hoverAvailable.matches) {
    visual.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'touch') setGadgetVisible(true);
    });
    visual.addEventListener('pointerleave', (event) => {
      if (event.pointerType !== 'touch') setGadgetVisible(false);
    });
  }

  visual.addEventListener('click', (event) => {
    if (event.detail === 0) return;

    if (event.pointerType === 'touch' || !hoverAvailable.matches) {
      setGadgetVisible(!visual.classList.contains('is-gadget-visible'));
    } else {
      setGadgetVisible(true);
    }
  });

  visual.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setGadgetVisible(!visual.classList.contains('is-gadget-visible'));
    }
  });
});

(function initStoryReveal() {
  const story = document.querySelector('.storybook');
  if (!story) return;

  const revealItems = story.querySelectorAll('.story-reveal');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  story.classList.add('has-scene-reveals');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  revealItems.forEach((item) => observer.observe(item));
})();

(function initFooter() {
  const footer = document.querySelector('.orbit-footer');
  if (!footer) return;

  const year = footer.querySelector('[data-current-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  const revealItems = footer.querySelectorAll('.footer-reveal');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  footer.classList.add('has-reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => observer.observe(item));
})();

(function initHeroEntrance() {
  const stage = document.querySelector('[data-hero-stage]');
  if (!stage) return;

  const video = stage.querySelector('.hero-video');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let settled = false;

  const settle = () => {
    if (settled) return;
    settled = true;
    try {
      video.pause();
    } catch (error) {
      /* video may not be pausable before load — the still image covers it either way */
    }
    stage.classList.add('is-settled');
  };

  // Reduced motion: skip the entrance entirely and show the still characters.
  if (reduceMotion.matches) {
    settle();
    return;
  }

  // Browsers require the muted property to be set before play() for autoplay.
  video.muted = true;

  const playAttempt = video.play();
  if (playAttempt && typeof playAttempt.catch === 'function') {
    // Autoplay blocked or media unavailable — fall back to the still image.
    playAttempt.catch(settle);
  }

  // The reliable end-of-video signal drives the video-to-image transition.
  video.addEventListener('ended', settle);

  // Format/network errors fall back to the still image.
  video.addEventListener('error', settle);

  // Safety net for environments where 'ended' never fires.
  video.addEventListener('loadedmetadata', () => {
    if (!isFinite(video.duration)) return;
    window.setTimeout(() => {
      if (video.ended) settle();
    }, (video.duration + 1.5) * 1000);
  }, { once: true });

  // If playback never starts (stalled stream, aggressive data saver), show the still.
  window.setTimeout(() => {
    if (!settled && video.paused) settle();
  }, 3000);

  if (typeof reduceMotion.addEventListener === 'function') {
    reduceMotion.addEventListener('change', (event) => {
      if (event.matches) settle();
    });
  }
})();

(function initCursorWind() {
  // Hanging-spider gust physics: spiders stay pinned to their hanging point.
  // A cursor CROSSING near a spider (velocity-gated) kicks the swing with a
  // small impulse, then a damped pendulum settles it home. No attraction, no
  // following, no held offset while the cursor sits still. Transform-only
  // (CSS var --gust on .hanging-spider-swing).
  const hero = document.querySelector('.hero');
  const stage = document.querySelector('[data-hero-stage]');
  if (!hero || !stage) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Reduced motion: leave every offset at rest and attach no listeners.
  if (reduceMotion.matches) return;

  const hoverFine = window.matchMedia('(hover: hover) and (pointer: fine)');
  // Touch / no-hover devices: preserve the static decoration, no listeners.
  if (!hoverFine.matches) return;

  const spiderEls = Array.from(document.querySelectorAll('.hanging-spider'));
  const swings = Array.from(document.querySelectorAll('.hanging-spider-swing'));
  const spiders = spiderEls.map((el) => {
    const swing = el.querySelector('.hanging-spider-swing');
    return { el, swing, angle: 0, vel: 0, cooldownUntil: 0 };
  });

  // The character stage keeps its own tiny breeze lean (away from cursor),
  // fully separate from spider gusts so spiders can never be dragged.
  const body = { x: 0, y: 0, r: 0 };
  const target = { x: 0, y: 0, r: 0 };

  // Caps keep the effect subtle and prevent any jump of the whole hero.
  const MAX_X = 8; // px of stage lean
  const MAX_Y = 5;
  const MAX_R = 1; // deg of stage tilt
  const MAX_GUST = 5; // deg max swing amplitude from a gust kick
  const RADIUS = 220; // px crossing zone around each spider
  const MIN_KICK_SPEED = 140; // px/s cursor speed needed to disturb a spider
  const KICK_COOLDOWN = 900; // ms between kicks per spider (no machine-gun)
  const IDLE_MS = 1200; // cursor quiet this long -> stage eases home

  // Damped pendulum: stiffness pulls home, damping bleeds energy so each
  // kick wobbles 2-3 times then rests. Tuned for ~1.6s visible settle.
  const STIFFNESS = 0.008;
  const DAMPING = 0.965;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  let lastMove = 0;
  let pointer = null;
  let prevX = 0;
  let prevY = 0;
  let prevT = 0;
  let hasPrev = false;
  let rafId = 0;
  let running = false;

  // Single rAF loop, started on demand and stopped at rest: no idle burn.
  const tick = (now) => {
    // Cursor gone quiet: stage targets decay home. Spider targets are
    // ALWAYS zero - kicks are impulses only, never held offsets.
    if (!pointer || now - lastMove > IDLE_MS) {
      target.x = 0;
      target.y = 0;
      target.r = 0;
    }

    // Stage breeze: fast follow toward its (decaying) target.
    body.x += (target.x - body.x) * 0.08;
    body.y += (target.y - body.y) * 0.08;
    body.r += (target.r - body.r) * 0.08;

    let spidersAwake = false;
    spiders.forEach((s) => {
      // Pendulum integration toward rest (target is always 0).
      s.vel += -s.angle * STIFFNESS;
      s.vel *= DAMPING;
      s.angle += s.vel;
      if (Math.abs(s.angle) > 0.005 || Math.abs(s.vel) > 0.005) spidersAwake = true;
      else { s.angle = 0; s.vel = 0; }
      if (s.swing) s.swing.style.setProperty('--gust', s.angle.toFixed(3) + 'deg');
    });

    stage.style.setProperty('--wind-x', body.x.toFixed(2) + 'px');
    stage.style.setProperty('--wind-y', body.y.toFixed(2) + 'px');
    stage.style.setProperty('--wind-rot', body.r.toFixed(3) + 'deg');

    const bodySettled =
      Math.abs(body.x) < 0.05 &&
      Math.abs(body.y) < 0.05 &&
      Math.abs(body.r) < 0.02 &&
      target.x === 0 &&
      target.y === 0 &&
      target.r === 0;

    if (bodySettled && !spidersAwake) {
      // Snap exactly to rest so no sub-pixel drift lingers.
      stage.style.setProperty('--wind-x', '0px');
      stage.style.setProperty('--wind-y', '0px');
      stage.style.setProperty('--wind-rot', '0deg');
      swings.forEach((swing) => swing.style.setProperty('--gust', '0deg'));
      spiders.forEach((s) => { s.angle = 0; s.vel = 0; });
      running = false;
      rafId = 0;
      return;
    }

    rafId = window.requestAnimationFrame(tick);
  };

  const kick = () => {
    if (!running && !document.hidden) {
      running = true;
      rafId = window.requestAnimationFrame(tick);
    }
  };

  // Pointer sampled here; pendulum integrated in tick. A spider is kicked
  // ONLY by a cursor crossing: fast enough, inside its zone, off cooldown.
  // Stationary cursor = no new kicks, current swing just settles. Spiders
  // never translate toward the cursor; only --gust rotation changes.
  const onPointerMove = (event) => {
      if (document.hidden) return;
      if (event.pointerType === 'touch') return;
      const now = performance.now();
      const rect = stage.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = (event.clientX - centerX) / (rect.width / 2);
      const dy = (event.clientY - centerY) / (rect.height / 2);
      // Full strength over the characters, fading out ~1.4 radii away.
      const influence = clamp(1.4 - Math.hypot(dx, dy), 0, 1);

      // Negated: lean AWAY from the cursor, like a passing breeze.
      target.x = -clamp(dx, -1, 1) * MAX_X * influence;
      target.y = -clamp(dy, -1, 1) * MAX_Y * influence * 0.6;
      target.r = -clamp(dx, -1, 1) * MAX_R * influence;

      const dt = hasPrev ? Math.max(8, now - prevT) : 16;
      const vx = hasPrev ? (event.clientX - prevX) / (dt / 1000) : 0;
      prevX = event.clientX;
      prevY = event.clientY;
      prevT = now;
      hasPrev = true;
      const speed = Math.hypot(vx, 0);

      spiders.forEach((s) => {
        if (!s.el) return;
        if (now < s.cooldownUntil) return;
        // Velocity gate: a still cursor never re-kicks.
        if (speed < MIN_KICK_SPEED) return;
        const r = s.el.getBoundingClientRect();
        const sx = r.left + r.width / 2;
        const sy = r.top + r.height * 0.35;
        const sdx = event.clientX - sx;
        const sdy = event.clientY - sy;
        const dist = Math.hypot(sdx, sdy);
        if (dist > RADIUS) return;
        const near = 1 - dist / RADIUS;
        // Gust direction follows the passing cursor: a cursor sweeping right
        // shoves the swing right, sweeping left shoves it left. Amplitude
        // scales with proximity so close passes swing wider.
        const dir = vx === 0 ? 0 : clamp(vx / 600, -1, 1);
        const kickAmp = clamp((0.5 + near * 1.6) * (0.6 + speed / 900), 0.4, 2.2);
        s.vel += dir * kickAmp;
        // Clamp so one pass can never cause wild shaking (±MAX_GUST).
        s.vel = clamp(s.vel, -MAX_GUST * 0.9, MAX_GUST * 0.9);
        s.cooldownUntil = now + KICK_COOLDOWN;
      });

      pointer = { x: event.clientX, y: event.clientY };
      lastMove = now;
      kick();
  };
  hero.addEventListener('pointermove', onPointerMove, { passive: true });

  // Leaving the hero eases the stage home; spider swings settle on their own.
  const onPointerLeave = () => {
      pointer = null;
      hasPrev = false;
      target.x = 0;
      target.y = 0;
      target.r = 0;
      kick();
  };
  hero.addEventListener('pointerleave', onPointerLeave, { passive: true });

  // Hidden tab: stop the loop; CSS play-state pause (see .is-hidden-tab)
  // freezes the bats mid-keyframe so nothing jumps on return.
  const onVisibility = () => {
    if (document.hidden) {
      if (rafId) window.cancelAnimationFrame(rafId);
      running = false;
      rafId = 0;
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
  // Cleanup hooks for SPA-style unload: no leaked listeners or frames.
  window.addEventListener(
    'pagehide',
    () => {
      hero.removeEventListener('pointermove', onPointerMove);
      hero.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      if (rafId) window.cancelAnimationFrame(rafId);
      running = false;
      rafId = 0;
    },
    { once: true }
  );
})();

(function initDecorVisibilityPause() {
  // Performance: freeze decorative keyframe loops while the page is hidden.
  // animation-play-state resumes mid-frame, so wing-flap never restarts.
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const sync = () => hero.classList.toggle('is-hidden-tab', document.hidden);
  document.addEventListener('visibilitychange', sync);
  sync();
})();

(function initBatFlight() {
  // Fear + buddy-rescue flight: single authoritative rAF loop owns every bat.
  // Each bat has pos/vel/heading/cruise/frightTimer/state (roaming|fleeing|
  // rescuing). Cursor proximity triggers a 2s fast escape away from the
  // cursor; 3s sustained pursuit of one bat calls the others to its vicinity.
  var hero = document.querySelector('.hero');
  if (!hero) return;
  var rm = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (rm.matches) return;
  var canFlee = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var els = Array.prototype.slice.call(hero.querySelectorAll('.flying-bat'));
  if (!els.length) return;
  function cl(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function len(x, y) { return Math.hypot(x, y) || 1; }
  var bats = els.map(function (el, i) {
    var k = el.getAttribute('data-bat') || 'a';
    var cfg = { hx: 0.12, hy: 0.16, ax: 46, ay: 22, sx: 0.42, sy: 0.61, px: 0, py: 1.3, rt: 6, cruise: 58 };
    if (k === 'b') cfg = { hx: 0.86, hy: 0.2, ax: 52, ay: 26, sx: 0.35, sy: 0.53, px: 2.4, py: 4.1, rt: 6, cruise: 64 };
    if (k === 'c') cfg = { hx: 0.5, hy: 0.1, ax: 60, ay: 20, sx: 0.48, sy: 0.67, px: 4.4, py: 2.2, rt: 6, cruise: 52 };
    return { el: el, kind: k, hx: cfg.hx, hy: cfg.hy, ax: cfg.ax, ay: cfg.ay, sx: cfg.sx, sy: cfg.sy, px: cfg.px, py: cfg.py, rt: cfg.rt, cruise: cfg.cruise, x: 0, y: 0, vx: 0, vy: 0, heading: 0, state: 'roaming', frightUntil: 0, fleeDx: 0, fleeDy: 0, fleeCool: 0, seed: (i + 1) * 2.13, homeX: 0, homeY: 0, rot: 0 };
  });
  var RADIUS = 190, FLEE_MULT = 1.75, FRIGHT_MS = 2000, FLEE_COOL = 500;
  var PURSUE_MS = 3000, SWITCH_STABLE_MS = 350, PURSUE_LOST_MS = 900, RESCUE_END_MS = 1500;
  var EDGE = 30, PUSH_SEP = 70;
  var rect = null;
  function measure() { rect = hero.getBoundingClientRect(); }
  measure();
  // Pursuit tracking: sustained chase of ONE bat, noise-tolerant.
  var pursuit = { target: null, time: 0, lastSeen: 0, stable: null, stableSince: 0 };
  var rescue = { active: false, target: null };
  var cursor = { x: 0, y: 0, vx: 0, vy: 0, speed: 0, inside: false, lastMove: 0 };
  var raf = 0, run = false, lastT = 0;
  function kick() {
    if (!run && !document.hidden) { run = true; lastT = performance.now(); raf = window.requestAnimationFrame(tick); }
  }
  function visibleBats() { return bats.filter(function (b) { return b.el.offsetParent !== null; }); }
  function batCenter(b) {
    return { x: b.homeX + b.x + b.el.offsetWidth / 2, y: b.homeY + b.y + b.el.offsetHeight / 2 };
  }
  function setRescuers(target) {
    var others = visibleBats().filter(function (b) { return b !== target; });
    others.forEach(function (b, idx) {
      if (b.state !== 'fleeing') b.state = 'rescuing';
      b.rescueSide = idx === 0 ? -1 : 1;
    });
  }
  function releaseRescuers() {
    bats.forEach(function (b) { if (b.state === 'rescuing') b.state = 'roaming'; });
  }
  function pickFleeDir(b, cx, cy, t) {
    var c = batCenter(b);
    var dx = c.x - cx, dy = c.y - cy;
    var d = len(dx, dy);
    dx /= d; dy /= d;
    var ux = dx + Math.sin(t * 3.1 + b.seed) * 0.35;
    var uy = dy + Math.cos(t * 2.6 + b.seed * 1.7) * 0.35;
    var ul = len(ux, uy);
    ux /= ul; uy /= ul;
    var W = rect ? rect.width : 800, H = rect ? rect.height : 500;
    var margin = 90;
    if (c.x < margin && ux < -0.15) { ux = Math.abs(ux) * 0.7; uy += 0.4; }
    if (c.x > W - margin && ux > 0.15) { ux = -Math.abs(ux) * 0.7; uy -= 0.4; }
    if (c.y < margin && uy < -0.15) { uy = Math.abs(uy) * 0.7; }
    if (c.y > H - margin && uy > 0.15) { uy = -Math.abs(uy) * 0.7; }
    var l2 = len(ux, uy);
    return { x: ux / l2, y: uy / l2 };
  }
  function triggerFlee(b, now, t) {
    if (now < b.fleeCool) return;
    var dir = pickFleeDir(b, cursor.x, cursor.y, t);
    b.fleeDx = dir.x; b.fleeDy = dir.y;
    b.state = 'fleeing';
    b.frightUntil = now + FRIGHT_MS;
    b.fleeCool = now + FLEE_COOL;
  }
  //TICK2
  function updatePursuit(now) {
    var vis = visibleBats();
    var nearest = null, nearestD = Infinity;
    for (var pi = 0; pi < vis.length; pi++) {
      var cc = batCenter(vis[pi]);
      var dNow = len(cc.x - cursor.x, cc.y - cursor.y);
      var closing = false;
      if (dNow < RADIUS * 1.1) {
        var dot = (cc.x - cursor.x) * cursor.vx + (cc.y - cursor.y) * cursor.vy;
        closing = dot > 0 || cursor.speed < 60 || dNow < RADIUS * 0.55;
      }
      if (closing && dNow < nearestD) { nearestD = dNow; nearest = vis[pi]; }
    }
    if (!cursor.inside || !canFlee) nearest = null;
    if (nearest) {
      if (pursuit.stable !== nearest) { pursuit.stable = nearest; pursuit.stableSince = now; }
      var cand = (now - pursuit.stableSince >= SWITCH_STABLE_MS) ? pursuit.stable : pursuit.target;
      if (cand && cand !== pursuit.target) {
        pursuit.target = cand; pursuit.time = 0;
        if (rescue.active) { rescue.active = false; rescue.target = null; releaseRescuers(); }
      } else if (!pursuit.target) { pursuit.target = nearest; pursuit.time = 0; }
      if (pursuit.target === nearest || pursuit.target === pursuit.stable) {
        pursuit.time += tickDt * 1000; pursuit.lastSeen = now;
      }
      if (pursuit.target && pursuit.time >= PURSUE_MS && !rescue.active) {
        rescue.active = true; rescue.target = pursuit.target;
        setRescuers(pursuit.target);
      }
      if (rescue.active && rescue.target !== pursuit.target) {
        rescue.target = pursuit.target; setRescuers(pursuit.target);
      }
    } else {
      pursuit.stable = null;
      if (pursuit.target && now - pursuit.lastSeen > PURSUE_LOST_MS) {
        pursuit.time = 0;
        if (rescue.active && now - pursuit.lastSeen > RESCUE_END_MS) {
          rescue.active = false; rescue.target = null; releaseRescuers();
        }
      }
    }
  }
  var tickDt = 0.016;
  function tick(now) {
    var dt = cl((now - lastT) / 1000, 0.008, 0.05);
    lastT = now; tickDt = dt;
    var t = now / 1000;
    if (!rect || rect.width === 0) measure();
    var W = rect ? rect.width : 800, H = rect ? rect.height : 500;
    updatePursuit(now);
    for (var i = 0; i < bats.length; i++) {
      var b = bats[i];
      if (b.el.offsetParent === null) continue;
      b.homeX = W * b.hx; b.homeY = H * b.hy;
      var inFright = now < b.frightUntil;
      if (b.state === 'fleeing' && !inFright) {
        b.state = (rescue.active && b !== rescue.target) ? 'rescuing' : 'roaming';
      }
      var speed = b.cruise, tx = 0, ty = 0;
      if (b.state === 'fleeing' && canFlee) {
        speed = b.cruise * FLEE_MULT;
        tx = b.fleeDx * speed; ty = b.fleeDy * speed;
        var c0 = batCenter(b);
        var dc = len(c0.x - cursor.x, c0.y - cursor.y);
        if (cursor.inside && dc < RADIUS * 0.8 && now >= b.fleeCool) triggerFlee(b, now, t);
      } else if (b.state === 'rescuing' && rescue.active && rescue.target) {
        var tc = batCenter(rescue.target);
        var sc = batCenter(b);
        var side = (b.rescueSide || 1);
        var gx = tc.x + side * 85, gy = tc.y - 55 - (i % 2) * 30;
        var rxx = gx - sc.x, ryy = gy - sc.y;
        var rd = len(rxx, ryy);
        var want = rescue.target.cruise * FLEE_MULT * 0.95;
        speed = want;
        if (rd > 12) { tx = (rxx / rd) * want; ty = (ryy / rd) * want; }
        else { tx = Math.cos(t * b.sx + b.px) * b.cruise * 0.5; ty = Math.sin(t * b.sy + b.px) * b.cruise * 0.4; }
        for (var j = 0; j < bats.length; j++) {
          if (j === i) continue;
          var oc = batCenter(bats[j]);
          var sx = sc.x - oc.x, sy = sc.y - oc.y;
          var sd = Math.hypot(sx, sy);
          if (sd > 0.1 && sd < PUSH_SEP) { tx += (sx / sd) * 60; ty += (sy / sd) * 60; }
        }
      } else {
        b.state = 'roaming';
        var roamX = Math.sin(t * b.sx + b.px) * b.ax + Math.sin(t * b.sx * 0.37 + b.py) * b.ax * 0.25;
        var roamY = Math.sin(t * b.sy + b.py) * b.ay + Math.cos(t * b.sx * 0.43 + b.px) * b.ay * 0.3;
        var desX = b.homeX + roamX, desY = b.homeY + roamY;
        var curX = b.homeX + b.x, curY = b.homeY + b.y;
        tx = cl((desX - curX) * 2.2, -b.cruise * 1.2, b.cruise * 1.2);
        ty = cl((desY - curY) * 2.2, -b.cruise * 1.2, b.cruise * 1.2);
        var sp0 = len(tx, ty);
        if (sp0 < b.cruise * 0.5) {
          tx += Math.cos(t * b.sx + b.px) * b.cruise * 0.35;
          ty += Math.sin(t * b.sy + b.px) * b.cruise * 0.3;
        }
        if (pursuit.target === b && cursor.inside && canFlee && now >= b.fleeCool) {
          var cb = batCenter(b);
          if (len(cb.x - cursor.x, cb.y - cursor.y) < RADIUS) triggerFlee(b, now, t);
        }
      }
      var want2 = (b.state === 'fleeing' || b.state === 'rescuing') ? b.cruise * FLEE_MULT : b.cruise * 1.25;
      var tw = len(tx, ty);
      if (tw > want2) { tx = (tx / tw) * want2; ty = (ty / tw) * want2; }
      var blend = b.state === 'roaming' ? 2.6 : 4.2;
      b.vx += (tx - b.vx) * Math.min(1, blend * dt);
      b.vy += (ty - b.vy) * Math.min(1, blend * dt);
      var nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
      var minX = -b.homeX + EDGE, maxX = W - b.homeX - b.el.offsetWidth - EDGE;
      var minY = -b.homeY + EDGE * 0.5, maxY = H - b.homeY - b.el.offsetHeight - EDGE;
      if (nx < minX || nx > maxX) {
        var ex = nx < minX ? b.homeX - 200 : b.homeX + W + 200;
        var nd = pickFleeDir(b, ex, b.homeY + b.y, t);
        var sp = Math.max(len(b.vx, b.vy), b.cruise);
        b.vx = nd.x * sp * 0.7;
        nx = cl(nx, minX, maxX);
      }
      if (ny < minY || ny > maxY) {
        ny = cl(ny, minY, maxY);
        b.vy = (ny === minY ? Math.abs(b.vy) : -Math.abs(b.vy)) * 0.5;
      }
      b.heading = Math.atan2(b.vy, b.vx);
      var vxi = (nx - b.x) / Math.max(dt, 0.008);
      var tr = cl(vxi * 0.02, -b.rt, b.rt) + Math.sin(t * b.sy + b.px) * 2;
      b.rot += (tr - b.rot) * 0.08;
      b.x = nx; b.y = ny;
      b.el.style.setProperty('--bat-x', nx.toFixed(1) + 'px');
      b.el.style.setProperty('--bat-y', ny.toFixed(1) + 'px');
      b.el.style.setProperty('--bat-rot', b.rot.toFixed(2) + 'deg');
    }
    if (!document.hidden) { raf = window.requestAnimationFrame(tick); }
    else { run = false; raf = 0; }
  }
  var prevCX = 0, prevCY = 0, prevCT = 0, hasCPrev = false;
  function onMove(e) {
    if (document.hidden || e.pointerType === 'touch' || !canFlee) return;
    if (!rect) measure();
    var now = performance.now();
    var rx = e.clientX - rect.left, ry = e.clientY - rect.top;
    var dtc = hasCPrev ? Math.max(8, now - prevCT) / 1000 : 0.016;
    var cvx = hasCPrev ? (rx - prevCX) / dtc : 0;
    var cvy = hasCPrev ? (ry - prevCY) / dtc : 0;
    prevCX = rx; prevCY = ry; prevCT = now; hasCPrev = true;
    cursor.x = rx; cursor.y = ry;
    cursor.vx = cvx; cursor.vy = cvy;
    cursor.speed = Math.hypot(cvx, cvy);
    cursor.inside = true; cursor.lastMove = now;
    kick();
  }
  function onLeave() {
    cursor.inside = false; hasCPrev = false;
    pursuit.stable = null;
  }
  hero.addEventListener('pointermove', onMove, { passive: true });
  hero.addEventListener('pointerleave', onLeave, { passive: true });
  function onVis() {
    if (document.hidden) { if (raf) window.cancelAnimationFrame(raf); run = false; raf = 0; }
    else { measure(); kick(); }
  }
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('pagehide', function () {
    hero.removeEventListener('pointermove', onMove);
    hero.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('resize', measure);
    if (raf) window.cancelAnimationFrame(raf);
    run = false; raf = 0;
  }, { once: true });
  if (typeof rm.addEventListener === 'function') {
    rm.addEventListener('change', function (ev) {
      if (ev.matches) {
        if (raf) window.cancelAnimationFrame(raf);
        run = false; raf = 0;
      } else { measure(); kick(); }
    });
  }
  measure();
  kick();
})();

(function initHeadlineTyping() {
  // Fast, smooth headline typing: buffered per-line batches keep paints cheap,
  // rAF-aligned appends avoid caret jitter, and short line gaps keep the run
  // under ~1s. Full text stays readable for AT + no-JS (aria-label on the h1
  // plus static fallback markup), and reduced-motion skips typing entirely.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const headline = document.querySelector('h1');
  const typingLines = document.querySelectorAll('[data-typing-text]');
  if (!headline || typingLines.length === 0) return;

  if (headline.dataset.typingInit === '1') return;
  headline.dataset.typingInit = '1';
  // Reduced motion (or mid-run toggle): show everything instantly, no caret.
  const showAll = () => {
    typingLines.forEach((line) => {
      line.textContent = line.dataset.typingText || line.textContent;
      line.classList.remove('typing-active');
    });
    headline.classList.remove('typing-done');
  };

  if (reduceMotion.matches) return;

  const START_DELAY = 180; // ms before the first character lands
  const CHAR_DELAY = 26; // ms per character batch (~3x faster than before)
  const CHARS_PER_TICK = 1;
  const LINE_GAP = 90; // pause between lines, keeps rhythm but stays quick
  let cancelled = false;

  if (typeof reduceMotion.addEventListener === 'function') {
    reduceMotion.addEventListener('change', (event) => {
      if (event.matches) {
        cancelled = true;
        showAll();
      }
    });
  }

  // Visibility + bfcache returns: reveal instantly instead of replaying or
  // leaving a half-typed headline.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelled = true;
  });
  window.addEventListener('pageshow', () => {
    if (cancelled) showAll();
  });

  const wait = (ms) =>
    new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });

  // rAF gate: batches the next append with the compositor tick so caret and
  // text advance together with no visible stutter.
  const nextFrame = () =>
    new Promise((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });

  const typeHeadline = async () => {
    await wait(START_DELAY);

    typingLines.forEach((line) => {
      line.textContent = '';
    });

    for (const line of typingLines) {
      if (cancelled || document.hidden) {
        showAll();
        return;
      }
      line.classList.add('typing-active');
      const fullText = line.dataset.typingText || '';

      for (let index = 0; index < fullText.length; index += CHARS_PER_TICK) {
        if (cancelled || document.hidden) {
          showAll();
          return;
        }
        await nextFrame();
        line.textContent += fullText.slice(index, index + CHARS_PER_TICK);
        await wait(CHAR_DELAY);
      }

      line.classList.remove('typing-active');
      await wait(LINE_GAP);
    }

    // Done: resting state is plain text - no caret or cursor left behind.
    headline.classList.remove('typing-done');
  };

  typeHeadline();
})();

// ============================================================================
// ORBIT-X — Audio Integration (click sounds on UI elements)
// ============================================================================

(function initAudioInteractions() {
  // Delegated click handler for elements with data-audio attribute
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-audio]');
    if (!trigger) return;

    const category = trigger.dataset.audioCategory || 'ui';
    const soundName = trigger.dataset.audio;
    if (!soundName) return;

    // Prevent sound when clicking nav drawer links (they already play menu sound)
    if (trigger.closest('.nav-drawer')) return;

    if (window.audioManager && window.audioManager.isEnabled()) {
      window.audioManager.play(category, soundName, { volume: 0.5 });
    }
  }, { passive: true });

  // Add data-audio to common button types automatically
  document.querySelectorAll('a.button, button').forEach((el) => {
    if (el.dataset.audio) return; // already has explicit audio
    const classes = el.className || '';
    if (classes.includes('button-primary')) {
      el.dataset.audio = 'button-click';
      el.dataset.audioCategory = 'ui';
    } else if (classes.includes('button-secondary')) {
      el.dataset.audio = 'button-click';
      el.dataset.audioCategory = 'ui';
    }
  });

  // Note: .theme-toggle intentionally gets NO data-audio here —
  // themeManager.toggle() already plays its own toggle-switch sound,
  // so an extra assignment would double the sound.
})();

// ============================================================================
// ORBIT-X — Sound toggle button + floating toggles + ambience loop
// ============================================================================

// Shared factory: the navbar copy and the drawer copy are both built with
// this, and they stay in sync through the 'orbitx-sound-change' event.
function createSoundToggle() {
  const soundBtn = document.createElement('button');
  soundBtn.className = 'sound-toggle is-muted';
  soundBtn.type = 'button';
  const soundIcon = document.createElement('span');
  soundIcon.className = 'sound-icon';
  soundIcon.setAttribute('aria-hidden', 'true');
  // Crisp inline SVG speaker: waves appear only when sound is ON, so the
  // icon itself communicates the state (not just the text next to it).
  soundIcon.innerHTML =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" ' +
    'stroke="currentColor" stroke-width="1.9" stroke-linecap="round" ' +
    'stroke-linejoin="round" focusable="false">' +
    '<path d="M11 5L6.5 9H3v6h3.5L11 19V5z" fill="currentColor" stroke="none"/>' +
    '<path class="sound-wave sound-wave-1" d="M14.5 9.2a4 4 0 010 5.6"/>' +
    '<path class="sound-wave sound-wave-2" d="M17.6 6.6a7.8 7.8 0 010 10.8"/>' +
    '<path class="sound-mute" d="M15 9.5l5 5M20 9.5l-5 5"/>' +
    '</svg>';
  const soundLabel = document.createElement('span');
  soundLabel.className = 'sound-label';
  soundLabel.setAttribute('aria-hidden', 'true');
  soundLabel.textContent = 'Sound OFF';
  soundBtn.appendChild(soundIcon);
  soundBtn.appendChild(soundLabel);

  const sync = () => {
    if (!window.audioManager) return;
    const on = window.audioManager.isEnabled();
    soundBtn.classList.toggle('is-muted', !on);
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
    soundBtn.title = on ? 'Sound ON - click to mute' : 'Sound OFF - click to enable';
    soundLabel.textContent = on ? 'Sound ON' : 'Sound OFF';
    soundIcon.classList.toggle('is-on', on);
    soundIcon.classList.toggle('is-off', !on);
  };

  soundBtn.addEventListener('click', () => {
    if (!window.audioManager) return;
    const wasOn = window.audioManager.isEnabled();
    window.audioManager.setEnabled(!wasOn);
    if (!wasOn) {
      // Turning sound back on: immediate audible feedback + warm the story
      // sounds so they play without delay when the user reaches them.
      window.audioManager.play('ui', 'toggle-switch', { volume: 0.5 });
      window.audioManager.warmUp([
        { category: 'transitions', name: 'magical-reveal' },
        { category: 'transitions', name: 'scene-transition' },
        { category: 'interactions', name: 'ghost-appear' }
      ]);
    }
    sync();
    // Tell every other copy (navbar <-> drawer) to refresh.
    window.dispatchEvent(new CustomEvent('orbitx-sound-change', {
      detail: { enabled: !wasOn }
    }));
  });

  document.addEventListener('orbitx-sound-change', sync);
  sync();
  // audioManager.js may load just after this button (deferred on some pages);
  // poll briefly so the button reflects the real state instead of staying
  // muted. On pages with no audio manager at all it simply stays OFF.
  if (!window.audioManager) {
    let tries = 0;
    const wait = () => {
      if (window.audioManager) { sync(); return; }
      if (++tries < 80) setTimeout(wait, 40);
    };
    setTimeout(wait, 40);
  }
  return soundBtn;
}

(function initSoundUI() {
  // This block injects the global sound toggle. It must run AFTER
  // audioManager.js has defined window.audioManager, otherwise the button
  // would render with no state, no accessible name and no wiring.
  // script.js may be loaded with or without `defer`, so we wait for the
  // DOM to be ready and poll briefly for the manager.
  const start = () => {
    if (!window.audioManager) {
      // audioManager.js is deferred: it will land right after this tick.
      setTimeout(start, 30);
      return;
    }
    buildSoundUI();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

function buildSoundUI() {
  // Pages without a navbar (credits, login) get a floating theme toggle.
  let themeBtn = document.querySelector('.theme-toggle');
  const needsFloatingToggles = !themeBtn;
  if (needsFloatingToggles) {
    themeBtn = document.createElement('button');
    themeBtn.className = 'theme-toggle floating';
    themeBtn.type = 'button';
    themeBtn.setAttribute('aria-label', 'Switch to Dark Mode');
    themeBtn.setAttribute('aria-pressed', 'false');
    const icon = document.createElement('span');
    icon.className = 'theme-icon';
    // themeManager.bindToggle fills the sun/moon SVG for the current mode.
    const label = document.createElement('span');
    label.className = 'theme-label';
    label.textContent = 'Light';
    themeBtn.appendChild(icon);
    themeBtn.appendChild(label);
    if (window.themeManager) window.themeManager.bindToggle(themeBtn);
  }

  // Global sound ON/OFF toggle, injected next to the theme toggle on every
  // page so the control stays consistent without editing 9 HTML files.
  // Built with the shared factory so the drawer copy stays in sync.
  if (!document.querySelector('.sound-toggle')) {
    const soundBtn = createSoundToggle();
    themeBtn.insertAdjacentElement('afterend', soundBtn);
    // Wrap theme + sound toggles together so they stay side-by-side instead of
    // being pushed apart by the navbar's justify-content: space-between.
    const group = document.createElement('div');
    group.className = 'toggle-group';
    themeBtn.parentNode.insertBefore(group, themeBtn);
    group.appendChild(themeBtn);
    group.appendChild(soundBtn);

    // On navbar-less pages, park both buttons in a fixed top-right group.
    if (needsFloatingToggles) {
      const wrap = document.createElement('div');
      wrap.className = 'floating-toggles';
      document.body.appendChild(wrap);
      wrap.appendChild(group);
    }
  }
}

// Story page: Enter-the-Story CTA + scene navigation + artwork hovers.
// Forgotten Treats scenes use anchor navigation (#scene-N) with an
// IntersectionObserver reveal (js/forgotten-treats.js); sounds hook onto the
// same user gestures without touching story text or animation code.
(function initStorySounds() {
  const play = (category, name, volume) => {
    try {
      if (window.audioManager && window.audioManager.canPlay()) {
        window.audioManager.play(category, name, { volume: volume });
      }
    } catch (e) { /* never break story nav on audio errors */ }
  };
  const bind = () => {
    document.querySelectorAll('.ft-primary-btn').forEach((btn) => {
      if (btn.dataset.soundBound) return;
      btn.dataset.soundBound = '1';
      btn.addEventListener('click', () => play('transitions', 'magical-reveal', 0.5));
    });
    document.querySelectorAll('a[href^="#scene-"]').forEach((link) => {
      if (link.classList.contains('ft-primary-btn')) return; // counted above
      if (link.dataset.soundBound) return;
      link.dataset.soundBound = '1';
      link.addEventListener('click', () => play('transitions', 'scene-transition', 0.45));
    });
    document.querySelectorAll('.ft-scene-art img, .ft-frame img, .ft-ghost, .ft-bat').forEach((art) => {
      if (art.dataset.soundBound) return;
      art.dataset.soundBound = '1';
      art.addEventListener('pointerenter', () => play('interactions', 'ghost-appear', 0.3), { passive: true });
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();

// STORY-SOUNDS-ANCHOR
// Global audio bed: looping night-wind ambience + a quiet background music
// track. Both start ONLY after the user turns Sound ON and interacts, so
// nothing is ever audible before a gesture (autoplay policy).
// The audioManager owns the actual nodes and guarantees a single music
// track plays at a time (playMusic stops the previous one first).
(function initAmbience() {
  let ambienceStarted = false;
  let musicStarted = false;

  const startBed = () => {
    if (!window.audioManager || !window.audioManager.canPlay()) return false;
    if (!ambienceStarted) {
      ambienceStarted = true;
      window.audioManager.playAmbience('night-wind', { loop: true, volume: 0.7 });
    }
    if (!musicStarted) {
      musicStarted = true;
      // Background music sits under the ambience at the music volume.
      window.audioManager.playMusic('halloween-bg', { loop: true, volume: 0.8 });
    }
    return true;
  };

  const arm = () => {
    document.addEventListener('click', startBed, { once: true, passive: true });
    document.addEventListener('keydown', startBed, { once: true, passive: true });
  };

  // Sound ON -> (re)start the bed. Sound OFF -> the manager already stopped
  // every node, so we just clear the flags to allow a clean restart.
  window.addEventListener('orbitx-sound-change', (e) => {
    if (e.detail && e.detail.enabled) {
      if (!startBed()) arm();
    } else {
      ambienceStarted = false;
      musicStarted = false;
      arm();
    }
  });

  // audioManager.js is deferred, so wait for it before arming the bed.
  const waitForManager = () => {
    if (window.audioManager) { arm(); return; }
    setTimeout(waitForManager, 30);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForManager);
  } else {
    waitForManager();
  }


// ============================================================================
// ORBIT-X — Global nav / footer active-state sync (audit + patch)
// ============================================================================
(function initGlobalNav() {
  'use strict';

  const navContainers = Array.prototype.concat(
    document.querySelectorAll('.nav-links'),
    document.querySelectorAll('.orbit-footer__nav')
  );
  if (!navContainers.length) return;

  const resolveTarget = (href) => {
    try {
      return new URL(href, window.location.href).pathname;
    } catch (error) {
      return href;
    }
  };

  const normalizePath = (value) =>
    value.replace(/\/+/g, '/').replace(/^\/+/, '');

  const currentPage = normalizePath(window.location.pathname)
    .split('/')
    .pop() || 'index.html';

  const setActive = (link) => {
    if (link.classList.contains('active') || link.getAttribute('aria-current') === 'page') {
      return;
    }
    link.classList.add('active');
    link.setAttribute('aria-current', 'page');
  };

  navContainers.forEach((container) => {
    const links = Array.from(container.querySelectorAll('a[href]'));
    links.forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (href.charAt(0) === '#') return;

      let target = normalizePath(resolveTarget(href));
      target = target.replace(/\/index\.html$/, '/index.html');
      if (target === '/' || target === '') target = 'index.html';

      if (target === currentPage) {
        setActive(link);
      }
    });
  });
})();

})();
