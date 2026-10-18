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

(function initHeadlineTyping() {
  // Fast, smooth headline typing: buffered per-line batches keep paints cheap,
  // rAF-aligned appends avoid caret jitter, and short line gaps keep the run
  // under ~1s. Full text stays readable for AT + no-JS (aria-label on the h1
  // plus static fallback markup), and reduced-motion skips typing entirely.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const headline = document.querySelector('h1');
  const typingLines = document.querySelectorAll('[data-typing-text]');
  if (!headline || typingLines.length === 0) return;

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

    // Done: park a steady caret on the final line (no blink loop burn).
    headline.classList.add('typing-done');
  };

  typeHeadline();
})();

/* ============================================================
   Exploration page — project details dialog + Story Mode reader.
   Fully guarded: index.html shares this script.
   ============================================================ */

const PROJECT_DETAILS = {
  halloween: {
    no: '01',
    tag: 'Kindness Mission',
    title: 'Halloween Helpers',
    image: 'Assets/img/HalloweenHelpers.jpeg',
    alt: 'Abhay and Divyansh on a Halloween street with pumpkins, a lantern and friendly ghosts',
    mission: 'Every child deserves a little Halloween magic. On Halloween night, Abhay and Divyansh set out to bring costumes, treats and kindness to the kids and streets that usually get skipped over.',
    characters: [
      'Abhay — the explorer with the lantern staff, brave enough to knock on any door.',
      'Divyansh — the storyteller with the magic staff, whose ideas light up dark streets.',
      'The neighbourhood kids — the reason the mission exists in the first place.'
    ],
    objective: 'Reach every doorstep in the old quarter before midnight and make sure no child is left out of the celebration.',
    challenges: [
      'Streets that others skip are the darkest and hardest to find.',
      'Running out of costumes before every child is served.',
      'Convincing shy and excluded kids to join the fun.'
    ]
  },
  dream: {
    no: '02',
    tag: 'Hexa Baby Universe',
    title: 'Hexa Baby: Dream Guardians',
    image: 'Assets/img/TogetherNoBg.png',
    alt: 'The two friends standing together as dream guardians',
    mission: 'When nightmares trap little dreamers, our guardians step inside the dream to guide them out and turn fear into happier, cozier sleep.',
    characters: [
      'Abhay — the curious guardian who keeps his cool when the dream gets strange.',
      'Divyansh — the quick-thinking guardian whose stories reshape the dream world.',
      'Hexa Baby — the tiny dreamer who needs a light to find the way home.'
    ],
    objective: 'Enter the nightmare through a star portal, find the lost dreamer, and walk them back to safe, happy sleep.',
    challenges: [
      'Nightmares twist the paths so the exit keeps moving.',
      'Fear itself becomes a shadow that blocks the way.',
      'The portal closes if the guardians wait too long.'
    ]
  },
  ghost: {
    no: '03',
    tag: 'Spirit Mission',
    title: 'Ghost Catchers: Spirit Purification',
    image: 'Assets/img/icons/ghost trans.png',
    alt: 'A friendly wandering ghost',
    mission: 'Track down wandering spirits, capture them gently with magical tools, and purify their energy so they can finally find peace and move on.',
    characters: [
      'Abhay — the tracker who reads the signs other people miss.',
      'Divyansh — the purifier whose staff calms restless spirits.',
      'The wandering ghosts — stuck between worlds, not out to harm anyone.'
    ],
    objective: 'Locate every restless spirit in town, capture it without anyone getting scared, and complete the purification ritual.',
    challenges: [
      'Ghosts hide in places that make no logical sense.',
      'Capture must be gentle — never a fight.',
      'Purification fails if the spirit is still upset.'
    ]
  }
};

(function initProjectDialog() {
  const dialog = document.getElementById('project-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const fields = {
    image: document.getElementById('project-dialog-image'),
    no: document.getElementById('project-dialog-no'),
    tag: document.getElementById('project-dialog-tag'),
    title: document.getElementById('project-dialog-title'),
    mission: document.getElementById('project-dialog-mission'),
    characters: document.getElementById('project-dialog-characters'),
    objective: document.getElementById('project-dialog-objective'),
    challenges: document.getElementById('project-dialog-challenges')
  };
  if (!fields.title) return;

  const fillList = (list, items) => {
    if (!list) return;
    list.textContent = '';
    (items || []).forEach((text) => {
      const li = document.createElement('li');
      li.textContent = text;
      list.appendChild(li);
    });
  };

  document.querySelectorAll('[data-open-project]').forEach((button) => {
    button.addEventListener('click', () => {
      const data = PROJECT_DETAILS[button.dataset.openProject];
      if (!data) return;
      if (fields.image) { fields.image.src = data.image; fields.image.alt = data.alt; }
      if (fields.no) fields.no.textContent = data.no;
      if (fields.tag) fields.tag.textContent = data.tag;
      fields.title.textContent = data.title;
      if (fields.mission) fields.mission.textContent = data.mission;
      if (fields.objective) fields.objective.textContent = data.objective;
      fillList(fields.characters, data.characters);
      fillList(fields.challenges, data.challenges);
      dialog.showModal();
    });
  });

  dialog.querySelectorAll('[data-close-dialog], .dialog-close').forEach((el) => {
    el.addEventListener('click', () => dialog.close());
  });
  // Click on the backdrop (the dialog element itself) closes it.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
})();
const STORY_MODE = {
  lantern: {
    no: 'Story 01',
    title: 'The Halloween Lantern',
    scenes: [
      { kicker: 'Scene 1 — The Dark Doorstep', art: 'Assets/img/HalloweenHelpers.jpeg', artAlt: 'A Halloween street lit by lanterns', paragraphs: [
        'The old quarter was quiet on Halloween night — too quiet for Abhay and Divyansh. Every house they passed had curtains drawn and porch lights off, as if the whole street had decided not to celebrate.',
        'Divyansh hugged his magic staff and frowned. "No lights means no treats. No treats means no Halloween for the kids down here." Abhay lifted his lantern staff high, and its warm glow spilled across the pavement. "Then we bring the Halloween to them."'
      ]},
      { kicker: 'Scene 2 — The First Lantern', art: 'Assets/img/icons/pumpkin trans.png', artAlt: 'A cheerful carved pumpkin', paragraphs: [
        'Their first stop was the house at the corner. A small face peeked from behind the curtain — a boy in a t-shirt costume that was clearly meant to be something braver. Abhay knelt down and held out a carved pumpkin, its smile glowing from within.',
        '"Happy Halloween," Divyansh said, and the boy smiled so wide it looked like his costume had finally come true. By the time they left, three more lanterns were swinging from the porch rail, and the street was no longer dark.'
      ]},
      { kicker: 'Scene 3 — A Trail of Light', art: 'Assets/img/icons/sparkle-yellow.svg', artAlt: 'A yellow sparkle', paragraphs: [
        'Door after door, the trail grew. Kids who had never knocked on a neighbour\'s house started joining them, carrying lanterns of their own. The skipped street turned into the brightest one in the old quarter.',
        'When the clock struck midnight, Abhay and Divyansh stood at the end of the street and looked back. It was a river of lanterns — and every single doorstep had a light. "Best Halloween ever," Divyansh whispered. "Until next year," Abhay answered, already planning the next mission.'
      ]}
    ]
  },
  shadows: {
    no: 'Story 02',
    title: 'The Dream Beyond the Shadows',
    scenes: [
      { kicker: 'Scene 1 — The Dreamer Who Stopped', art: 'Assets/img/TogetherNoBg.png', artAlt: 'The two friends together', paragraphs: [
        'For three nights in a row, Hexa Baby had not slept. Every time sleep came, the shadows came with them — long, quiet shapes that filled the room and swallowed the light.',
        'Abhay and Divyansh noticed immediately. "A nightmare has trapped him inside," Divyansh said softly. "If we don\'t go in, he\'ll never fall asleep again." They packed the lantern, the staff, and a story to spare, and stepped toward the star portal.'
      ]},
      { kicker: 'Scene 2 — Inside the Nightmare', art: 'Assets/img/icons/bat trans.png', artAlt: 'A bat flying', paragraphs: [
        'The dream world was a hallway of shadows that moved when nobody watched. Every corner they turned, the exit shifted. The shadow was not attacking — it was simply afraid, the way Hexa Baby was afraid.',
        'Divyansh knelt and began to tell a story: not a scary one, but a small tale about a light that had never learned it was allowed to stay. The shadows slowed. For the first time, they listened.'
      ]},
      { kicker: 'Scene 3 — Beyond the Shadows', art: 'Assets/img/icons/sparkle-lavender.svg', artAlt: 'A lavender sparkle', paragraphs: [
        'They found Hexa Baby curled beneath a sky with no stars. Abhay raised the lantern, and Divyansh finished the story, and the shadows uncurled like paper in warm water. Behind them, the exit was finally standing still.',
        'Walking back, Hexa Baby held both their hands. The nightmare did not disappear — it just became a hallway, and hallways have ends. He slept that night, and the next, and every night after.'
      ]}
    ]
  },
  wandering: {
    no: 'Story 03',
    title: 'The Last Wandering Ghost',
    scenes: [
      { kicker: 'Scene 1 — The Ghost on Bell Street', art: 'Assets/img/icons/ghost trans.png', artAlt: 'A friendly wandering ghost', paragraphs: [
        'The ghost on Bell Street had wandered for a hundred years. He had outlived every person he ever scared, and he was, he admitted to no one, extremely tired.',
        'When Abhay and Divyansh found him, he was sitting on the old bakery steps, watching two kids chase each other in the dark. "You don\'t look dangerous," Divyansh said. The ghost sighed. "I\'ve forgotten how."'
      ]},
      { kicker: 'Scene 2 — One Hundred Years of Stories', art: 'Assets/img/icons/pumpkin trans.png', artAlt: 'A pumpkin with a gentle smile', paragraphs: [
        'He told them everything: the century of festivals he had watched, the wars he had hidden from, the children he had tried to warn instead of frighten. He had never wanted to haunt — he had just never been told he could stop.',
        'Divyansh opened his story book. "Then let\'s finish your story properly." Abhay raised the lantern staff so the light fell gently on the old stone steps. Nobody ran. Nobody screamed. For the first time, the ghost felt warm.'
      ]},
      { kicker: 'Scene 3 — The Farewell', art: 'Assets/img/icons/sparkle-pink.svg', artAlt: 'A pink sparkle', paragraphs: [
        'When the purification was complete, the ghost stood a little straighter, and a little lighter. He thanked them with a bow so old-fashioned that Divyansh had to stop himself from bowing back.',
        'The next morning, Bell Street was unusually bright, and the kids swore the air smelled faintly of warm bread. Abhay and Divyansh walked on to the next mission — one last wandering ghost, finally at peace.'
      ]}
    ]
  }
};

(function initStoryMode() {
  const dialog = document.getElementById('story-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const els = {
    no: document.getElementById('reader-story-no'),
    title: document.getElementById('story-dialog-title'),
    progress: dialog.querySelector('.reader-progress'),
    progressBar: document.getElementById('reader-progress-bar'),
    count: document.getElementById('reader-count'),
    scene: document.getElementById('reader-scene'),
    art: document.getElementById('reader-art'),
    kicker: document.getElementById('scene-kicker'),
    text: document.getElementById('scene-text'),
    prev: document.getElementById('scene-prev'),
    next: document.getElementById('scene-next'),
    dots: document.getElementById('scene-dots')
  };
  if (!els.scene || !els.text || !els.dots) return;

  let story = null;
  let index = 0;

  const renderDots = () => {
    els.dots.textContent = '';
    story.scenes.forEach((scene, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'scene-dot';
      dot.setAttribute('aria-label', `Go to ${scene.kicker}`);
      dot.addEventListener('click', () => goTo(i));
      els.dots.appendChild(dot);
    });
  };

  const render = (animate) => {
    const scene = story.scenes[index];
    if (els.art) { els.art.src = scene.art; els.art.alt = scene.artAlt || ''; }
    if (els.kicker) els.kicker.textContent = scene.kicker;
    els.text.textContent = '';
    scene.paragraphs.forEach((para) => {
      const p = document.createElement('p');
      p.textContent = para;
      els.text.appendChild(p);
    });
    if (els.no) els.no.textContent = story.no;
    if (els.title) els.title.textContent = story.title;
    if (els.count) els.count.textContent = `Scene ${index + 1} of ${story.scenes.length}`;
    if (els.progress) {
      els.progress.setAttribute('aria-valuenow', String(index + 1));
      els.progress.setAttribute('aria-valuemax', String(story.scenes.length));
    }
    if (els.progressBar) {
      els.progressBar.style.width = `${((index + 1) / story.scenes.length) * 100}%`;
    }
    if (els.prev) els.prev.disabled = index === 0;
    if (els.next) els.next.textContent = index === story.scenes.length - 1 ? 'The End ✦' : 'Next →';
    Array.from(els.dots.children).forEach((dot, i) => {
      dot.setAttribute('aria-current', String(i === index));
    });
    els.scene.scrollTop = 0;
    if (animate) {
      els.scene.classList.remove('turning');
      void els.scene.offsetWidth; // restart the CSS animation
      els.scene.classList.add('turning');
    }
  };

  function goTo(nextIndex) {
    if (!story) return;
    index = Math.max(0, Math.min(nextIndex, story.scenes.length - 1));
    render(true);
  }

  document.querySelectorAll('[data-open-story]').forEach((button) => {
    button.addEventListener('click', () => {
      const data = STORY_MODE[button.dataset.openStory];
      if (!data) return;
      story = data;
      index = 0;
      renderDots();
      render(false);
      dialog.showModal();
    });
  });

  if (els.prev) els.prev.addEventListener('click', () => goTo(index - 1));
  if (els.next) els.next.addEventListener('click', () => goTo(index + 1));
  dialog.querySelectorAll('.dialog-close').forEach((el) => {
    el.addEventListener('click', () => dialog.close());
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  document.addEventListener('keydown', (event) => {
    if (!dialog.open || !story) return;
    if (event.key === 'ArrowRight') goTo(index + 1);
    if (event.key === 'ArrowLeft') goTo(index - 1);
  });
})();
