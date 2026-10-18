const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

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
  // Gentle breeze: the character stage and hanging threads lean slightly
  // AWAY from the cursor while it is near, then spring back to rest.
  // Transform-only (CSS vars consumed by .hero-stage / .hanging-spider-swing);
  // never touches the entrance state, so it cannot restart the video.
  const hero = document.querySelector('.hero');
  const stage = document.querySelector('[data-hero-stage]');
  if (!hero || !stage) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Reduced motion: leave every offset at rest and attach no listeners.
  if (reduceMotion.matches) return;

  const swings = Array.from(document.querySelectorAll('.hanging-spider-swing'));

  // Two smoothed phases: the character body follows quickly, threads trail
  // with a slower lerp so strings feel flexible instead of rigid.
  const body = { x: 0, y: 0, r: 0 };
  const thread = { r: 0 };
  const target = { x: 0, y: 0, r: 0, gust: 0 };

  // Caps keep the effect subtle and prevent any jump of the whole hero.
  const MAX_X = 10; // px of stage lean
  const MAX_Y = 6;
  const MAX_R = 1.2; // deg of stage tilt
  const MAX_GUST = 3; // deg of thread push
  const IDLE_MS = 1200; // cursor quiet this long -> ease back to rest

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  let lastMove = 0;
  let pointer = null;
  let rafId = 0;
  let running = false;

  // Single rAF loop, started on demand and stopped at rest: no idle burn.
  const tick = () => {
    const now = performance.now();

    // Cursor gone quiet: decay the targets so everything settles home.
    if (!pointer || now - lastMove > IDLE_MS) {
      target.x = 0;
      target.y = 0;
      target.r = 0;
      target.gust = 0;
    }

    // Fast follow for bodies, slow trail for threads (spring-like lag).
    body.x += (target.x - body.x) * 0.08;
    body.y += (target.y - body.y) * 0.08;
    body.r += (target.r - body.r) * 0.08;
    thread.r += (target.gust - thread.r) * 0.045;

    stage.style.setProperty('--wind-x', body.x.toFixed(2) + 'px');
    stage.style.setProperty('--wind-y', body.y.toFixed(2) + 'px');
    stage.style.setProperty('--wind-rot', body.r.toFixed(3) + 'deg');
    const gust = thread.r.toFixed(3) + 'deg';
    swings.forEach((swing) => swing.style.setProperty('--gust', gust));

    const settled =
      Math.abs(body.x) < 0.05 &&
      Math.abs(body.y) < 0.05 &&
      Math.abs(body.r) < 0.02 &&
      Math.abs(thread.r) < 0.02 &&
      target.x === 0 &&
      target.y === 0 &&
      target.r === 0 &&
      target.gust === 0;

    if (settled) {
      // Snap exactly to rest so no sub-pixel drift lingers.
      stage.style.setProperty('--wind-x', '0px');
      stage.style.setProperty('--wind-y', '0px');
      stage.style.setProperty('--wind-rot', '0deg');
      swings.forEach((swing) => swing.style.setProperty('--gust', '0deg'));
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

  // Pointer position is sampled here; all DOM writes happen inside tick.
  hero.addEventListener(
    'pointermove',
    (event) => {
      if (document.hidden) return;
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
      target.gust = -clamp(dx, -1, 1) * MAX_GUST * influence;

      pointer = { x: event.clientX, y: event.clientY };
      lastMove = performance.now();
      kick();
    },
    { passive: true }
  );

  // Leaving the hero eases everything home instead of snapping.
  hero.addEventListener(
    'pointerleave',
    () => {
      pointer = null;
      target.x = 0;
      target.y = 0;
      target.r = 0;
      target.gust = 0;
      kick();
    },
    { passive: true }
  );

  // Hidden tab: stop the loop; CSS play-state pause (see .is-hidden-tab)
  // freezes the bats mid-keyframe so nothing jumps on return.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) window.cancelAnimationFrame(rafId);
      running = false;
      rafId = 0;
    }
  });
})();

(function initDecorVisibilityPause() {
  // Performance: freeze decorative keyframe loops while the page is hidden.
  // animation-play-state resumes mid-frame, so bats never restart or jump.
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const sync = () => hero.classList.toggle('is-hidden-tab', document.hidden);
  document.addEventListener('visibilitychange', sync);
  sync();
})();
