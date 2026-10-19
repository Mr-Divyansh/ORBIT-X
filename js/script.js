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
