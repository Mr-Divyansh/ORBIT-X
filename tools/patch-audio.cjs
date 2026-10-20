const fs = require('fs');
const path = 'js/audioManager.js';
let s = fs.readFileSync(path, 'utf8');
const changes = [];
function rep(oldText, newText, label) {
  if (!s.includes(oldText)) { changes.push(label + ': MISS'); return; }
  s = s.split(oldText).join(newText);
  changes.push(label + ': ok');
}

// 1. Session-only sound: never persist ON/OFF across loads.
rep(
  "    _savePref(key, value) {",
  "    _clearSavedPref() {\n" +
  "      try { localStorage.removeItem(SOUND_ENABLED_KEY); } catch (e) { /* ignore */ }\n" +
  "      try { sessionStorage.removeItem(SOUND_ENABLED_KEY); } catch (e) { /* ignore */ }\n" +
  "    }\n\n" +
  "    _savePref(key, value) {\n" +
  "      // Sound ON/OFF is session-only by design: never persist playback state.\n" +
  "      // (Volume sliders ARE persisted — a comfort setting, not playback.)\n" +
  "      if (key === SOUND_ENABLED_KEY) return;",
  "savePref-guard"
);

// 2. Constructor: always OFF on fresh load, synth fields.
rep(
  "      this.enabled = this._loadPref(SOUND_ENABLED_KEY, true);",
  "      this._clearSavedPref();\n      this.enabled = false; // OFF by default on every fresh page load.\n" +
  "      this._synthCtx = null;\n      this._lastSfxAt = 0;",
  "ctor-off"
);

// 3. setEnabled: clear stale pref, hard-stop everything when turning OFF.
rep(
  "    setEnabled(enabled) {\n      this.enabled = !!enabled;\n      this._savePref(SOUND_ENABLED_KEY, this.enabled);\n      if (!this.enabled) {\n        this.stopMusic();\n        this.stopAmbience();\n      }\n      this._dispatchChange();",
  "    setEnabled(enabled) {\n      this.enabled = !!enabled;\n      this._clearSavedPref(); // session-only: Sound ON dies with this visit.\n" +
  "      if (!this.enabled) {\n        this.stopMusic();\n        this.stopAmbience();\n        this.stopAll();\n        this._silenceSynth();\n      }\n      this._dispatchChange();",
  "setEnabled-stop"
);

// 4. Toggle helper used by the navbar control.
rep(
  "    toggleEnabled() {",
  "    // Procedural WebAudio blip for short UI sounds (button/navigation/menu/\n" +
  "    // toggle/modal). The local ui/*.mp3 files are 6-10MB full-length songs,\n" +
  "    // so streaming one for a 100ms click would stall the UI — the synth\n" +
  "    // plays instantly with zero network cost. Returns true if played.\n" +
  "    _playSynth(name) {\n" +
  "      const preset = SYNTH_PRESETS[name];\n" +
  "      if (!preset) return false;\n" +
  "      try {\n" +
  "        const AC = window.AudioContext || window.webkitAudioContext;\n" +
  "        if (!AC) return false;\n" +
  "        if (!this._synthCtx) this._synthCtx = new AC();\n" +
  "        const ctx = this._synthCtx;\n" +
  "        if (ctx.state === 'suspended') { ctx.resume().catch(function () {}); }\n" +
  "        const t = ctx.currentTime;\n" +
  "        const osc = ctx.createOscillator();\n" +
  "        const gain = ctx.createGain();\n" +
  "        osc.type = preset.type;\n" +
  "        osc.frequency.setValueAtTime(preset.freq, t);\n" +
  "        osc.frequency.exponentialRampToValueAtTime(preset.endFreq, t + preset.dur);\n" +
  "        const peak = 0.22 * this.volumes.sfx;\n" +
  "        gain.gain.setValueAtTime(0.0001, t);\n" +
  "        gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.001), t + 0.015);\n" +
  "        gain.gain.exponentialRampToValueAtTime(0.0001, t + preset.dur);\n" +
  "        osc.connect(gain);\n" +
  "        gain.connect(ctx.destination);\n" +
  "        osc.start(t);\n" +
  "        osc.stop(t + preset.dur + 0.05);\n" +
  "        return true;\n" +
  "      } catch (e) { return false; }\n" +
  "    }\n\n" +
  "    _silenceSynth() {\n" +
  "      // Drop the shared synth context so any ringing tail stops with Sound OFF.\n" +
  "      if (this._synthCtx) {\n" +
  "        try { this._synthCtx.close(); } catch (e) { /* ignore */ }\n" +
  "        this._synthCtx = null;\n" +
  "      }\n" +
  "    }\n\n" +
  "    toggleEnabled() {",
  "synth-methods"
);

// 5. play(): synth fast-path for UI blips + throttle + single-track categories.
rep(
  "    play(category, soundName, options) {\n      options = options || {};\n      if (!this.canPlay()) return null;\n      const group = this.sounds[category];\n      if (!group) return null;\n      const template = group[soundName];\n      if (!template) return null;",
  "    play(category, soundName, options) {\n      options = options || {};\n      if (!this.canPlay()) return null;\n" +
  "      // Short UI feedback goes through the procedural synth: instant and\n" +
  "      // network-free. Long-form categories (interactions/transitions) keep\n" +
  "      // their real MP3 assets.\n" +
  "      if (category === 'ui') {\n" +
  "        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());\n" +
  "        if (now - this._lastSfxAt < 70) return null; // no stacked/duplicate blips\n" +
  "        this._lastSfxAt = now;\n" +
  "        return this._playSynth(soundName) ? { synth: true, name: soundName } : null;\n" +
  "      }\n" +
  "      const group = this.sounds[category];\n      if (!group) return null;\n      const template = group[soundName];\n      if (!template) return null;\n" +
  "      // One-shot categories: stop the previous take so rapid clicks (scene\n" +
  "      // nav, ghost/bat triggers) never stack overlapping duplicates.\n" +
  "      if (category === 'interactions' || category === 'transitions') this.stopAll();",
  "play-synth"
);

fs.writeFileSync(path, s);
console.log(changes.join('\n'));
