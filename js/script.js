const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.querySelectorAll('.nav-links a').forEach((item) => item.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

document.querySelectorAll('[data-character-image]').forEach((visual) => {
  const soloImage = visual.querySelector('.character-image-solo');
  const gadgetImage = visual.querySelector('.character-image-gadget');
  const hoverAvailable = window.matchMedia('(hover: hover)');
  const setGadgetVisible = (visible) => {
    visual.classList.toggle('is-gadget-visible', visible);
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
  var hero = document.querySelector('.hero');
  if (!hero) return;
  var rm = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (rm.matches) return;
  var canFlee = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var els = Array.prototype.slice.call(hero.querySelectorAll('.flying-bat'));
  if (!els.length) return;
  function cl(v, a, b) { return Math.min(b, Math.max(a, v)); }
  var bats = els.map(function (el, i) {
    var k = el.getAttribute('data-bat') || 'a';
    var cfg = { hx: 0.12, hy: 0.16, ax: 46, ay: 22, sx: 0.42, sy: 0.61, px: 0, py: 1.3, rt: 5 };
    if (k === 'b') cfg = { hx: 0.86, hy: 0.2, ax: 52, ay: 26, sx: 0.35, sy: 0.53, px: 2.4, py: 4.1, rt: 6 };
    if (k === 'c') cfg = { hx: 0.5, hy: 0.1, ax: 60, ay: 20, sx: 0.48, sy: 0.67, px: 4.4, py: 2.2, rt: 5 };
    return { el: el, hx: cfg.hx, hy: cfg.hy, ax: cfg.ax, ay: cfg.ay, sx: cfg.sx, sy: cfg.sy, px: cfg.px, py: cfg.py, rt: cfg.rt, fx: 0, fy: 0, vx: 0, vy: 0, cool: 0, seed: (i + 1) * 2.13, cx: 0, cy: 0, act: false, homeX: 0, homeY: 0, x: 0, y: 0, rot: 0 };
  });
  var RADIUS = 190, COOL = 700, PUSH = 95, EDGE = 30;
  var rect = null;
  function measure() { rect = hero.getBoundingClientRect(); }
  measure();
  var raf = 0, run = false, lastT = 0;
  function kick() {
    if (!run && !document.hidden) { run = true; lastT = performance.now(); raf = window.requestAnimationFrame(tick); }
  }
  function tick(now) {
    var dt = cl((now - lastT) / 1000, 0.008, 0.05);
    lastT = now;
    var t = now / 1000;
    if (!rect || rect.width === 0) measure();
    var W = rect ? rect.width : 800, H = rect ? rect.height : 500;
    for (var i = 0; i < bats.length; i++) {
      var b = bats[i];
      if (b.el.offsetParent === null) continue;
      var roamX = Math.sin(t * b.sx + b.px) * b.ax + Math.sin(t * b.sx * 0.37 + b.py) * b.ax * 0.25;
      var roamY = Math.sin(t * b.sy + b.py) * b.ay + Math.cos(t * b.sx * 0.43 + b.px) * b.ay * 0.3;
      if (b.act && canFlee && now >= b.cool) {
        var dx = (b.homeX + b.x) - b.cx, dy = (b.homeY + b.y) - b.cy;
        var dist = Math.hypot(dx, dy) || 1;
        if (dist < RADIUS) {
          var near = 1 - dist / RADIUS;
          var ux = dx / dist + Math.sin(t * 3.1 + b.seed) * 0.35;
          var uy = dy / dist + Math.cos(t * 2.6 + b.seed * 1.7) * 0.35;
          var ul = Math.hypot(ux, uy) || 1;
          var burst = PUSH * (0.45 + 0.55 * near);
          b.vx += (ux / ul) * burst * 3.07 * dt;
          b.vy += (uy / ul) * burst * 3.07 * dt;
          b.cool = now + COOL;
        } else { b.act = false; }
      }
      b.vx += (-b.fx * 2.4 - b.vx * 3.4) * dt;
      b.vy += (-b.fy * 2.4 - b.vy * 3.4) * dt;
      b.fx = cl(b.fx + b.vx * dt * 21, -PUSH * 1.3, PUSH * 1.3);
      b.fy = cl(b.fy + b.vy * dt * 21, -PUSH, PUSH);
      b.homeX = W * b.hx; b.homeY = H * b.hy;
      var x = roamX + b.fx, y = roamY + b.fy;
      var minX = -b.homeX + EDGE, maxX = W - b.homeX - b.el.offsetWidth - EDGE;
      var minY = -b.homeY + EDGE * 0.5, maxY = H - b.homeY - b.el.offsetHeight - EDGE;
      if (x < minX) { x = minX; b.vx = Math.abs(b.vx) * 0.4; }
      if (x > maxX) { x = maxX; b.vx = -Math.abs(b.vx) * 0.4; }
      if (y < minY) { y = minY; b.vy = Math.abs(b.vy) * 0.4; }
      if (y > maxY) { y = maxY; b.vy = -Math.abs(b.vy) * 0.4; }
      var vxi = (x - b.x) / Math.max(dt, 0.008);
      var tr = cl(vxi * 0.02, -b.rt, b.rt) + Math.sin(t * b.sy + b.px) * 2;
      b.rot += (tr - b.rot) * 0.08;
      b.x = x; b.y = y;
      b.el.style.setProperty('--bat-x', x.toFixed(1) + 'px');
      b.el.style.setProperty('--bat-y', y.toFixed(1) + 'px');
      b.el.style.setProperty('--bat-rot', b.rot.toFixed(2) + 'deg');
    }
    if (!document.hidden) { raf = window.requestAnimationFrame(tick); }
    else { run = false; raf = 0; }
  }
  function onMove(e) {
    if (document.hidden || e.pointerType === 'touch' || !canFlee) return;
    if (!rect) measure();
    var rx = e.clientX - rect.left, ry = e.clientY - rect.top;
    for (var i = 0; i < bats.length; i++) {
      var b = bats[i];
      if (b.el.offsetParent === null) continue;
      var bx = (b.homeX || 0) + b.x + b.el.offsetWidth / 2;
      var by = (b.homeY || 0) + b.y + b.el.offsetHeight / 2;
      var d = Math.hypot(bx - rx, by - ry);
      if (d < RADIUS) { b.cx = rx; b.cy = ry; b.act = true; }
      else if (d > RADIUS * 1.4) { b.act = false; }
      else { b.cx = rx; b.cy = ry; }
    }
    kick();
  }
  function onLeave() {
    for (var i = 0; i < bats.length; i++) bats[i].act = false;
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
