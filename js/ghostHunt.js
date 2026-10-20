document.addEventListener('DOMContentLoaded', () => {
  const gameArea = document.getElementById('gh-playfield');
  const darkness = document.getElementById('gh-darkness');
  const lantern = document.getElementById('gh-lantern');
  const staff = document.getElementById('gh-staff');
  const interactionCircle = document.getElementById('gh-interaction-circle');
  const ghostsContainer = document.getElementById('gh-ghosts-container');
  const uiLayer = document.getElementById('gh-ui-layer');
  const instructionEl = document.getElementById('gh-instruction');
  const discoveredEl = document.getElementById('gh-discovered');
  const capturedEl = document.getElementById('gh-captured');
  const purifiedEl = document.getElementById('gh-purified');
  const soundBtn = document.getElementById('gh-sound-btn');
  const restartBtn = document.getElementById('gh-restart-btn');
  const playAgainBtn = document.getElementById('gh-play-again');
  const victoryOverlay = document.getElementById('gh-victory-overlay');
  const victoryCountEl = document.getElementById('gh-victory-count');

  const TOTAL_GHOSTS = 20;
  let ghosts = [];
  let discoveredCount = 0;
  let capturedCount = 0;
  let purifiedCount = 0;
  let isSoundOn = false;
  let activeTool = null;
  let audioCtx = null;
  let lanternX = 5;
  let lanternY = 80;
  let currentDragEl = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  function initAudio() {
    if (!audioCtx) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
      } catch (e) {
        console.warn('Web Audio API not supported');
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type) {
    if (!isSoundOn || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    if (type === 'discover') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'capture_step') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'capture_done') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'purify') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
    }
  }

  function updateToolPositions() {
    lantern.style.left = 'calc(' + lanternX + '% - ' + (lantern.offsetWidth / 2) + 'px)';
    lantern.style.top = 'calc(' + lanternY + '% - ' + (lantern.offsetHeight / 2) + 'px)';
    interactionCircle.style.left = 'calc(' + lanternX + '% - 20px)';
    interactionCircle.style.top = 'calc(' + lanternY + '% - 20px)';
  }

  function initGhosts() {
    ghostsContainer.innerHTML = '';
    ghosts = [];
    discoveredCount = 0;
    capturedCount = 0;
    purifiedCount = 0;
    updateStats();
    for (let i = 0; i < TOTAL_GHOSTS; i++) {
      const ghost = {
        id: i,
        x: 15 + Math.random() * 70,
        y: 15 + Math.random() * 70,
        state: 'hidden',
        el: document.createElement('div')
      };
      ghost.el.className = 'gh-ghost';
      ghost.el.style.left = ghost.x + '%';
      ghost.el.style.top = ghost.y + '%';
      ghost.el.addEventListener('pointerdown', (e) => handleGhostClick(e, ghost));
      ghostsContainer.appendChild(ghost.el);
      ghosts.push(ghost);
    }
    lanternX = 5;
    lanternY = 80;
    updateToolPositions();
    updateDarknessMask(null);
    instructionEl.textContent = 'Drag the lantern or the yellow circle to explore the dark room...';
    victoryOverlay.classList.add('hidden');
  }

  function updateStats() {
    discoveredEl.textContent = discoveredCount;
    capturedEl.textContent = capturedCount;
    purifiedEl.textContent = purifiedCount;
    if (purifiedCount >= TOTAL_GHOSTS) {
      setTimeout(showVictory, 1000);
    }
  }

  function showMessage(msg) {
    instructionEl.textContent = msg;
    instructionEl.style.opacity = 1;
    clearTimeout(instructionEl.timeoutId);
    instructionEl.timeoutId = setTimeout(() => {
      instructionEl.style.opacity = 0;
    }, 3000);
  }


  function updateDarknessMask(pos) {
    if (!pos) {
      darkness.style.maskImage = 'none';
      darkness.style.webkitMaskImage = 'none';
      darkness.style.backgroundColor = 'rgba(10, 5, 20, 0.9)';
      return;
    }
    const radius = 25;
    const gradient = 'radial-gradient(circle at ' + pos.x + '% ' + pos.y + '%, transparent 0%, rgba(0,0,0,0.8) ' + radius + '%, rgba(0,0,0,1) ' + (radius * 1.5) + '%)';
    darkness.style.maskImage = gradient;
    darkness.style.webkitMaskImage = gradient;
    darkness.style.backgroundColor = 'rgba(10, 5, 20, 0.95)';
  }

  function checkRevealGhosts(pos) {
    const revealRadius = 20;
    ghosts.forEach(ghost => {
      if (ghost.state === 'hidden') {
        const dx = ghost.x - pos.x;
        const dy = ghost.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < revealRadius) {
          ghost.state = 'discovered';
          ghost.el.classList.add('discovered');
          discoveredCount++;
          updateStats();
          playSound('discover');
          showMessage('A ghost appeared! Tap it to capture.');
        }
      }
    });
  }

  function handleGhostClick(e, ghost) {
    e.preventDefault();
    e.stopPropagation();
    if (ghost.state !== 'discovered' || ghost.isCapturing) return;
    ghost.isCapturing = true;
    let step = 1;
    const maxSteps = 3;
    function runStep() {
      if (step > maxSteps) {
        ghost.state = 'captured';
        ghost.el.classList.remove('discovered');
        ghost.el.classList.add('captured');
        capturedCount++;
        updateStats();
        playSound('capture_done');
        showMessage('Ghost captured! Use the staff to purify it.');
        ghost.isCapturing = false;
        return;
      }
      showIndicator(ghost.el, step);
      playSound('capture_step');
      step++;
      setTimeout(runStep, 400);
    }
    runStep();
  }

  function showIndicator(targetEl, text, color) {
    const ind = document.createElement('div');
    ind.className = 'gh-capture-indicator';
    ind.textContent = text;
    ind.style.color = color || '#bca0ef';
    const rect = targetEl.getBoundingClientRect();
    const areaRect = gameArea.getBoundingClientRect();
    const x = rect.left - areaRect.left + rect.width / 2;
    const y = rect.top - areaRect.top + rect.height / 2;
    ind.style.left = x + 'px';
    ind.style.top = y + 'px';
    uiLayer.appendChild(ind);
    setTimeout(() => {
      if (uiLayer.contains(ind)) ind.remove();
    }, 600);
  }

  function showSparkles(x, y, color) {
    for (let i = 0; i < 5; i++) {
      const spark = document.createElement('div');
      spark.className = 'gh-sparkle';
      spark.style.left = (x + (Math.random() * 40 - 20)) + 'px';
      spark.style.top = (y + (Math.random() * 40 - 20)) + 'px';
      if (color) spark.style.background = 'radial-gradient(circle, ' + color + ' 0%, rgba(255,255,255,0) 70%)';
      uiLayer.appendChild(spark);
      setTimeout(() => {
        if (uiLayer.contains(spark)) spark.remove();
      }, 500);
    }
  }


  function checkStaffPurify(posRect) {
    const staffCenterX = posRect.left + posRect.width / 2;
    const staffCenterY = posRect.top + posRect.height / 2;
    const areaRect = gameArea.getBoundingClientRect();
    const staffRelX = ((staffCenterX - areaRect.left) / areaRect.width) * 100;
    const staffRelY = ((staffCenterY - areaRect.top) / areaRect.height) * 100;
    const purifyRadius = 15;
    ghosts.forEach(ghost => {
      if (ghost.state === 'captured' && !ghost.isPurifying) {
        const dx = ghost.x - staffRelX;
        const dy = ghost.y - staffRelY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < purifyRadius) {
          purifyGhost(ghost);
        }
      }
    });
  }

  function purifyGhost(ghost) {
    ghost.isPurifying = true;
    let step = 1;
    const maxSteps = 3;
    function runStep() {
      if (step > maxSteps) {
        ghost.state = 'purified';
        ghost.el.classList.remove('captured');
        ghost.el.classList.add('purified');
        const areaRect = gameArea.getBoundingClientRect();
        const px = (ghost.x / 100) * areaRect.width;
        const py = (ghost.y / 100) * areaRect.height;
        showSparkles(px, py, '#bca0ef');
        purifiedCount++;
        updateStats();
        playSound('purify');
        showMessage('Ghost purified!');
        return;
      }
      showIndicator(ghost.el, '✨', '#bca0ef');
      playSound('capture_step');
      step++;
      setTimeout(runStep, 300);
    }
    runStep();
  }


  function onPointerDown(e) {
    if (e.target === lantern) {
      currentDragEl = lantern;
      activeTool = 'lantern';
    } else if (e.target === staff) {
      currentDragEl = staff;
      activeTool = 'staff';
    } else if (e.target === interactionCircle || e.target.parentElement === interactionCircle) {
      currentDragEl = interactionCircle;
      activeTool = 'circle';
    } else {
      return;
    }
    e.preventDefault();
    initAudio();
    const rect = currentDragEl.getBoundingClientRect();
    const areaRect = gameArea.getBoundingClientRect();
    if (activeTool === 'circle') {
      const circleCenterX = rect.left + rect.width / 2;
      const circleCenterY = rect.top + rect.height / 2;
      lanternX = ((circleCenterX - areaRect.left) / areaRect.width) * 100;
      lanternY = ((circleCenterY - areaRect.top) / areaRect.height) * 100;
      updateToolPositions();
    } else if (activeTool === 'lantern') {
      lanternX = ((rect.left - areaRect.left) / areaRect.width) * 100;
      lanternY = ((rect.top - areaRect.top) / areaRect.height) * 100;
    }
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    dragOffsetX = clientX - rect.left - (rect.width / 2);
    dragOffsetY = clientY - rect.top - (rect.height / 2);
    currentDragEl.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!currentDragEl) return;
    e.preventDefault();
    const areaRect = gameArea.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    let x = clientX - areaRect.left - dragOffsetX;
    let y = clientY - areaRect.top - dragOffsetY;
    let percX = (x / areaRect.width) * 100;
    let percY = (y / areaRect.height) * 100;
    percX = Math.max(5, Math.min(95, percX));
    percY = Math.max(5, Math.min(95, percY));
    if (activeTool === 'lantern' || activeTool === 'circle') {
      lanternX = percX;
      lanternY = percY;
      updateToolPositions();
      updateDarknessMask({ x: lanternX, y: lanternY });
      checkRevealGhosts({ x: lanternX, y: lanternY });
    } else if (activeTool === 'staff') {
      staff.style.left = 'calc(' + percX + '% - ' + (staff.offsetWidth / 2) + 'px)';
      staff.style.top = 'calc(' + percY + '% - ' + (staff.offsetHeight / 2) + 'px)';
      checkStaffPurify(staff.getBoundingClientRect());
    }
  }

  function onPointerUp(e) {
    if (currentDragEl) {
      try { currentDragEl.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      currentDragEl = null;
      activeTool = null;
    }
  }

  lantern.addEventListener('pointerdown', onPointerDown);
  staff.addEventListener('pointerdown', onPointerDown);
  interactionCircle.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove, { passive: false });
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('touchmove', (e) => {
    if (currentDragEl) e.preventDefault();
  }, { passive: false });

  soundBtn.addEventListener('click', () => {
    isSoundOn = !isSoundOn;
    soundBtn.textContent = 'Sound: ' + (isSoundOn ? 'ON' : 'OFF');
    soundBtn.classList.toggle('button-primary', isSoundOn);
    soundBtn.classList.toggle('button-secondary', !isSoundOn);
    initAudio();
  });

  restartBtn.addEventListener('click', initGhosts);
  playAgainBtn.addEventListener('click', initGhosts);

  function showVictory() {
    victoryCountEl.textContent = TOTAL_GHOSTS;
    victoryOverlay.classList.remove('hidden');
    playSound('purify');
  }

  initGhosts();
});

