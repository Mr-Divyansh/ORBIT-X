// ============================================================================
// ORBIT-X Audio Manager
// UI sounds, ambience, interactions, transitions, music. Respects autoplay
// restrictions, user sound preference, and missing assets.
// Classic script (not a module) so it works over file:// too.
// Global: window.audioManager
// ============================================================================

(function () {
  'use strict';

  // Resolve the audio dir relative to THIS script's URL so paths work from
  // any page depth (root pages and projects/ subpages), http(s) and file://.
  const SCRIPT_URL = (document.currentScript && document.currentScript.src) || '';
  let AUDIO_BASE_URL = 'Assets/audio/';
  if (SCRIPT_URL) {
    try {
      AUDIO_BASE_URL = new URL('../Assets/audio/', SCRIPT_URL).href;
    } catch (e) { /* keep fallback */ }
  }

  const AUDIO_MANIFEST = {
    ui: {
      'button-click': 'ui/button-click.mp3',
      'menu-toggle': 'ui/menu-toggle.mp3',
      'navigation-click': 'ui/navigation-click.mp3',
      'modal-open': 'ui/modal-open.mp3',
      'toggle-switch': 'ui/toggle-switch.mp3'
    },
    ambience: {
      'night-wind': 'ambience/night-wind.mp3',
      'forest-night': 'ambience/forest-night.mp3',
      'distant-owl': 'ambience/distant-owl.mp3'
    },
    interactions: {
      'pumpkin-click': 'interactions/pumpkin-click.mp3',
      'ghost-appear': 'interactions/ghost-appear.mp3',
      'bat-flap': 'interactions/bat-flap.mp3',
      'discover-item': 'interactions/discover-item.mp3'
    },
    transitions: {
      'scene-transition': 'transitions/scene-transition.mp3',
      'magical-reveal': 'transitions/magical-reveal.mp3',
      'character-appear': 'transitions/character-appear.mp3'
    },
    music: {
      'halloween-bg': 'music/halloween-bg-music.mp3',
      'mysterious-loop': 'music/mysterious-loop.mp3'
    }
  };

  const DEFAULT_VOLUMES = { music: 0.35, ambience: 0.25, sfx: 0.6 };
  const SOUND_ENABLED_KEY = 'orbitx-sound-enabled';
  const VOLUMES_KEY = 'orbitx-volumes';

  // Short procedural UI blips (WebAudio synth). The local ui/*.mp3 files are
  // full-length songs (6-10MB each), so streaming one for a 100ms click would
  // stall the UI. The synth plays instantly with zero network cost.
  const SYNTH_PRESETS = {
    'button-click': { freq: 660, endFreq: 880, dur: 0.09, type: 'sine' },
    'navigation-click': { freq: 520, endFreq: 780, dur: 0.1, type: 'sine' },
    'menu-toggle': { freq: 440, endFreq: 620, dur: 0.12, type: 'triangle' },
    'toggle-switch': { freq: 740, endFreq: 520, dur: 0.12, type: 'sine' },
    'modal-open': { freq: 480, endFreq: 720, dur: 0.14, type: 'sine' }
  };

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  class AudioManager {
    constructor() {
      // Fresh page load = sound OFF, always. Clear any stale saved preference
      // (mirrors themeManager's session-only policy) so a previous Sound ON
      // choice can never leak into a new visit.
      this._clearSavedPref();
      this.enabled = false;
      this.volumes = this._loadPref(VOLUMES_KEY, Object.assign({}, DEFAULT_VOLUMES));
      this.sounds = {};
      this.musicNode = null;
      this.ambienceNode = null;
      this.initialized = false;
      this.userInteracted = false;
      // Procedural WebAudio synth (see _ensureSynth): instant UI blips so we
      // never stream multi-MB song files for a 100ms click.
      this._synthCtx = null;
      this._lastSfxAt = 0;
      // In-flight one-shot elements, so Sound OFF can silence them
      // immediately instead of letting them ring out.
      this._activeOneShots = new Set();
    }

    init() {
      if (this.initialized) return;
      this.initialized = true;
      for (const category of Object.keys(AUDIO_MANIFEST)) {
        this.sounds[category] = {};
        const items = AUDIO_MANIFEST[category];
        for (const name of Object.keys(items)) {
          this.sounds[category][name] = this._createAudioElement(
            this._resolvePath(items[name])
          );
        }
      }
      // Browsers block audio before the first user gesture; flag the first
      // interaction so later play() calls satisfy autoplay policy.
      const markInteracted = () => { this.userInteracted = true; };
      document.addEventListener('pointerdown', markInteracted, { once: true, passive: true });
      document.addEventListener('click', markInteracted, { once: true, passive: true });
      document.addEventListener('keydown', markInteracted, { once: true, passive: true });
      document.addEventListener('touchstart', markInteracted, { once: true, passive: true });
    }

    _resolvePath(relPath) {
      return AUDIO_BASE_URL + relPath;
    }

    _createAudioElement(src) {
      const audio = new Audio(src);
      audio.preload = 'none';
      audio.onerror = () => { /* missing asset - degrade silently */ };
      if (src.indexOf('/music/') !== -1) audio.volume = this.volumes.music;
      else if (src.indexOf('/ambience/') !== -1) audio.volume = this.volumes.ambience;
      else audio.volume = this.volumes.sfx;
      return audio;
    }

    _loadPref(key, defaultValue) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return defaultValue;
        const parsed = JSON.parse(raw);
        if (defaultValue && typeof defaultValue === 'object' && parsed && typeof parsed === 'object') {
          return Object.assign({}, defaultValue, parsed);
        }
        return parsed;
      } catch (e) {
        return defaultValue;
      }
    }

    _clearSavedPref() {
      /* Sound ON/OFF is session-only: never carry a previous visit's choice
         into a fresh page load. (Volumes are still persisted.) */
      try { localStorage.removeItem(SOUND_ENABLED_KEY); } catch (e) { /* ignore */ }
      try { sessionStorage.removeItem(SOUND_ENABLED_KEY); } catch (e) { /* ignore */ }
    }

    _savePref(key, value) {
      if (key === SOUND_ENABLED_KEY) return; /* session-only, never persist */
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) { /* localStorage may be blocked */ }
    }

    _dispatchChange() {
      window.dispatchEvent(new CustomEvent('orbitx-sound-change', {
        detail: {
          enabled: this.enabled,
          volumes: Object.assign({}, this.volumes)
        }
      }));
    }

    setEnabled(enabled) {
      this.enabled = !!enabled;
      this._clearSavedPref(); /* session-only: wipes any stale saved value */
      if (!this.enabled) {
        this.stopMusic();
        this.stopAmbience();
        this.stopAll();
        this._silenceSynth();
      }
      this._dispatchChange();
    }

    toggleEnabled() {
      this.setEnabled(!this.enabled);
      return this.enabled;
    }

    isEnabled() {
      return !!this.enabled;
    }

    // True only when sound is enabled AND the user interacted with the page.
    canPlay() {
      return this.initialized && this.enabled && this.userInteracted;
    }

    // ---- Procedural WebAudio synth -------------------------------------
    // Instant, zero-network UI blips. The local ui/*.mp3 files are
    // full-length songs (6-10MB each), so streaming one for a 100ms click
    // would stall the UI. Frequencies sit in the soft 440-880Hz band with
    // a fast decay: subtle, never harsh. No-op when WebAudio is missing.
    _ensureSynth() {
      if (this._synthCtx) return this._synthCtx;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this._synthCtx = new AC();
        return this._synthCtx;
      } catch (e) {
        return null;
      }
    }
    _silenceSynth() {
      if (!this._synthCtx) return;
      try {
        if (typeof this._synthCtx.suspend === 'function') { this._synthCtx.suspend(); }
      } catch (e) { /* ignore */ }
    }
    _playSynth(name) {
      const preset = SYNTH_PRESETS[name];
      if (!preset) return false;
      // 60ms floor stops machine-gun repeats from rapid clicks.
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      if (now - this._lastSfxAt < 60) return true;
      this._lastSfxAt = now;
      const ctx = this._ensureSynth();
      if (!ctx) return false;
      try {
        if (ctx.state === 'suspended' && typeof ctx.resume === 'function') { ctx.resume(); }
        const t0 = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = preset.type;
        osc.frequency.setValueAtTime(preset.freq, t0);
        osc.frequency.exponentialRampToValueAtTime(preset.endFreq, t0 + preset.dur);
        const peak = clamp01(this.volumes.sfx) * 0.25;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.001), t0 + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + preset.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + preset.dur + 0.02);
        return true;
      } catch (e) {
        return false;
      }
    }
    setVolume(category, value) {
      if (!(category in this.volumes)) return;
      const v = clamp01(Number(value));
      this.volumes[category] = v;
      this._savePref(VOLUMES_KEY, this.volumes);
      if (category === 'music' && this.musicNode) this.musicNode.volume = v;
      if (category === 'ambience' && this.ambienceNode) this.ambienceNode.volume = v;
      const templates = this.sounds[category];
      if (templates) {
        for (const name of Object.keys(templates)) {
          templates[name].volume = v;
        }
      }
      this._dispatchChange();
    }

    getVolume(category) {
      return typeof this.volumes[category] === 'number' ? this.volumes[category] : 0;
    }

    // Warm up the audio cache in the background once sound is enabled, so
    // story/interaction sounds are ready to play instantly when triggered.
    // Uses requestIdleCallback when available to avoid competing with the
    // UI thread during the click that turned sound on.
    warmUp(names) {
      const list = Array.isArray(names) ? names : [];
      const run = () => {
        list.forEach((entry) => {
          const category = entry.category;
          const name = entry.name;
          const template = this.sounds[category] && this.sounds[category][name];
          if (!template) return;
          try {
            template.preload = 'auto';
            template.load();
          } catch (e) { /* ignore - asset may be missing */ }
        });
      };
      try {
        if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(run, { timeout: 2000 });
        } else {
          setTimeout(run, 400);
        }
      } catch (e) {
        setTimeout(run, 400);
      }
    }

    // Fire-and-forget one-shot sound. Clones the template so overlapping
    // sounds can play at once. Returns the playing element or null.
    play(category, name, options) {
      options = options || {};
      if (!this.canPlay()) return null;
      // UI blips: instant procedural synth (zero network). The local
      // ui/*.mp3 files are full-length songs; streaming one per click would
      // stall the UI. Pass { forceFile: true } to use the file instead.
      if (category === 'ui' && SYNTH_PRESETS[name] && !options.forceFile) {
        return this._playSynth(name) ? { synth: true, name: name } : null;
      }
      const template = this.sounds[category] && this.sounds[category][name];
      if (!template) return null;
      try {
        const node = template.cloneNode(true);
        const categoryVolume = category === 'music'
          ? this.volumes.music
          : category === 'ambience' ? this.volumes.ambience : this.volumes.sfx;
        const requested = typeof options.volume === 'number' ? options.volume : 1;
        node.volume = clamp01(requested * categoryVolume);
        node.loop = !!options.loop;
        const played = node.play();
        if (played && typeof played.catch === 'function') {
          played.catch(() => { /* autoplay blocked or asset missing */ });
        }
        // Track the one-shot so Sound OFF can silence it mid-playback.
        this._activeOneShots.add(node);
        const release = () => { this._activeOneShots.delete(node); };
        node.addEventListener('ended', release, { once: true });
        node.addEventListener('error', release, { once: true });
        return node;
      } catch (e) {
        return null;
      }
    }

    playMusic(name, options) {
      options = options || {};
      if (!this.canPlay()) return null;
      const template = this.sounds.music && this.sounds.music[name];
      if (!template) return null;
      this.stopMusic();
      try {
        const node = template.cloneNode(true);
        node.loop = options.loop !== false;
        const requested = typeof options.volume === 'number' ? options.volume : 1;
        node.volume = clamp01(requested * this.volumes.music);
        const played = node.play();
        if (played && typeof played.catch === 'function') {
          played.catch(() => { /* autoplay blocked */ });
        }
        this.musicNode = node;
        return node;
      } catch (e) {
        return null;
      }
    }

    stopMusic() {
      if (this.musicNode) {
        try { this.musicNode.pause(); } catch (e) { /* ignore */ }
        this.musicNode.removeAttribute('src');
        this.musicNode = null;
      }
    }

    playAmbience(name, options) {
      options = options || {};
      if (!this.canPlay()) return null;
      const template = this.sounds.ambience && this.sounds.ambience[name];
      if (!template) return null;
      this.stopAmbience();
      try {
        const node = template.cloneNode(true);
        node.loop = options.loop !== false;
        const requested = typeof options.volume === 'number' ? options.volume : 1;
        node.volume = clamp01(requested * this.volumes.ambience);
        const played = node.play();
        if (played && typeof played.catch === 'function') {
          played.catch(() => { /* autoplay blocked */ });
        }
        this.ambienceNode = node;
        return node;
      } catch (e) {
        return null;
      }
    }

    stopAll() {
      // Single cleanup entry point for in-flight audio. Persistent nodes
      // (music/ambience) are halted here; one-shots are paused and released
      // so Sound OFF takes effect immediately. The synth tail (~150ms max)
      // is silenced via _silenceSynth() in setEnabled(false).
      this.stopMusic();
      this.stopAmbience();
      if (this._activeOneShots && this._activeOneShots.size) {
        this._activeOneShots.forEach((node) => {
          try {
            node.pause();
            node.currentTime = 0;
          } catch (e) { /* ignore */ }
          try { node.removeAttribute('src'); } catch (e) { /* ignore */ }
        });
        this._activeOneShots.clear();
      }
    }

    stopAmbience() {
      if (this.ambienceNode) {
        try { this.ambienceNode.pause(); } catch (e) { /* ignore */ }
        this.ambienceNode.removeAttribute('src');
        this.ambienceNode = null;
      }
    }

    // Gradually fade the current music, then stop it (element.volume based,
    // no Web Audio graph needed, so it works everywhere).
    fadeOutMusic(ms) {
      ms = typeof ms === 'number' && ms > 0 ? ms : 1000;
      if (!this.musicNode) return;
      const node = this.musicNode;
      this.musicNode = null;
      const startVolume = node.volume;
      const steps = 10;
      const stepMs = ms / steps;
      let step = 0;
      const interval = setInterval(() => {
        step += 1;
        node.volume = clamp01(startVolume * (1 - step / steps));
        if (step >= steps) {
          clearInterval(interval);
          try { node.pause(); } catch (e) { /* ignore */ }
          node.removeAttribute('src');
        }
      }, stepMs);
    }

    getAvailableSounds(category) {
      return Object.keys(this.sounds[category] || {});
    }

    soundExists(category, name) {
      return !!(this.sounds[category] && this.sounds[category][name]);
    }
  }

  window.audioManager = new AudioManager();

  // Init once DOM is ready so listeners attach cleanly whether this script
  // sits in <head> (with defer) or at the end of <body>.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.audioManager.init();
    });
  } else {
    window.audioManager.init();
  }
})();
