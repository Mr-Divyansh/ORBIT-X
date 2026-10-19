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

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  class AudioManager {
    constructor() {
      this.enabled = this._loadPref(SOUND_ENABLED_KEY, true);
      this.volumes = this._loadPref(VOLUMES_KEY, Object.assign({}, DEFAULT_VOLUMES));
      this.sounds = {};
      this.musicNode = null;
      this.ambienceNode = null;
      this.initialized = false;
      this.userInteracted = false;
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

    _savePref(key, value) {
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
      this._savePref(SOUND_ENABLED_KEY, this.enabled);
      if (!this.enabled) {
        this.stopMusic();
        this.stopAmbience();
      }
      this._dispatchChange();
    }

    toggleEnabled() {
      this.setEnabled(!this.enabled);
      return this.enabled;
    }

    isEnabled() {
      return this.enabled;
    }

    // True only when sound is enabled AND the user interacted with the page.
    canPlay() {
      return this.enabled && this.userInteracted;
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

    // Fire-and-forget one-shot sound. Clones the template so overlapping
    // sounds can play at once. Returns the playing element or null.
    play(category, name, options) {
      options = options || {};
      if (!this.canPlay()) return null;
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
