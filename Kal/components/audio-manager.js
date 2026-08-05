/**
 * audio-manager.js
 * ============================================================
 * ChronoScape VR — Spatial Audio Manager
 * Controls ambient soundscape, spatialized effects,
 * and era-specific audio layers.
 * ============================================================
 */

AFRAME.registerComponent('audio-manager', {
  schema: {
    masterVolume: { type: 'number', default: 0.7 },
    era:          { type: 'string', default: 'ruins' }
  },

  init() {
    this._sounds     = {};
    this._ambients   = {};
    this._ctx        = null;
    this._gainMaster = null;
    this._ready      = false;

    // Sound catalogue — using free public-domain-style URLs
    // In production: replace with actual hosted audio files
    this._catalogue = {
      // Ambient layers
      'wind':        { src: '#audio-wind',    loop: true,  spatial: false, volume: 0.4 },
      'birds':       { src: '#audio-birds',   loop: true,  spatial: false, volume: 0.3 },
      'crowd':       { src: '#audio-crowd',   loop: true,  spatial: false, volume: 0.0 },
      'bells':       { src: '#audio-bells',   loop: false, spatial: true,  volume: 0.6 },
      'water':       { src: '#audio-water',   loop: true,  spatial: true,  volume: 0.5 },
      'horses':      { src: '#audio-horses',  loop: true,  spatial: false, volume: 0.0 },
      'fire':        { src: '#audio-fire',    loop: true,  spatial: true,  volume: 0.35},
      // UI sounds (synthesized on load)
      'ui-click':    { synthetic: true, type: 'click' },
      'ui-open':     { synthetic: true, type: 'open' },
      'reconstruct': { synthetic: true, type: 'reconstruct' }
    };

    // Era audio profiles
    this._eraProfiles = {
      ruins:    { wind: 0.4, birds: 0.3, crowd: 0.0, horses: 0.0 },
      ancient:  { wind: 0.2, birds: 0.4, crowd: 0.5, horses: 0.3, bells: 0.6 },
      restored: { wind: 0.15,birds: 0.5, crowd: 0.6, horses: 0.4, bells: 0.7, fire: 0.35 }
    };

    this.el.sceneEl.addEventListener('loaded', () => {
      this._initAudioContext();
      this._startAmbient();
    });

    // Era change listener
    this.el.sceneEl.addEventListener('era-changed', (e) => {
      this._transitionToEra(e.detail.era);
    });

    // Reconstruction events
    this.el.sceneEl.addEventListener('reconstruction-start', (e) => {
      this._playReconstructionSound(e.detail.direction);
    });

    // Expose audio API globally
    window.ChronoScape = window.ChronoScape || {};
    window.ChronoScape.audio = this;
  },

  // ── Init Web Audio Context ────────────────────────────────
  _initAudioContext() {
    try {
      this._ctx        = new (window.AudioContext || window.webkitAudioContext)();
      this._gainMaster = this._ctx.createGain();
      this._gainMaster.gain.value = this.data.masterVolume;
      this._gainMaster.connect(this._ctx.destination);
      this._ready = true;
    } catch (e) {
      console.warn('[AudioManager] Web Audio not available:', e);
    }
  },

  // ── Synthesize UI sounds ──────────────────────────────────
  _synthClick() {
    if (!this._ready) return;
    const osc  = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.connect(gain);
    gain.connect(this._gainMaster);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, this._ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 0.1);
    osc.start();
    osc.stop(this._ctx.currentTime + 0.1);
  },

  _synthReconstructBeam() {
    if (!this._ready) return;
    const osc  = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    const filter = this._ctx.createBiquadFilter();
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this._gainMaster);

    osc.type = 'sawtooth';
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    osc.frequency.setValueAtTime(80, this._ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this._ctx.currentTime + 5);
    osc.frequency.exponentialRampToValueAtTime(1200, this._ctx.currentTime + 9);

    gain.gain.setValueAtTime(0.0, this._ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, this._ctx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0.15, this._ctx.currentTime + 8);
    gain.gain.linearRampToValueAtTime(0.0,  this._ctx.currentTime + 11);

    osc.start();
    osc.stop(this._ctx.currentTime + 11);
  },

  _synthComplete() {
    if (!this._ready) return;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5 chord
    freqs.forEach((freq, i) => {
      const osc  = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.connect(gain);
      gain.connect(this._gainMaster);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t0 = this._ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.0, t0);
      gain.gain.linearRampToValueAtTime(0.2, t0 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.5);
      osc.start(t0);
      osc.stop(t0 + 1.5);
    });
  },

  // ── Start ambient audio ───────────────────────────────────
  _startAmbient() {
    // A-Frame sound entities handle looping ambient via a-sound
    // We control them by toggling the 'paused' attribute
    const soundEls = document.querySelectorAll('[data-ambient-sound]');
    soundEls.forEach(el => {
      const key = el.dataset.ambientSound;
      this._ambients[key] = el;
    });

    // Start with ruins profile
    this._applyProfile('ruins', 0);
  },

  // ── Apply era audio profile ───────────────────────────────
  _applyProfile(era, fadeDuration = 3000) {
    const profile = this._eraProfiles[era] || this._eraProfiles.ruins;
    Object.entries(profile).forEach(([key, vol]) => {
      const el = this._ambients[key];
      if (!el) return;
      if (vol > 0) {
        el.setAttribute('sound', `src: ${this._catalogue[key]?.src}; autoplay: true; loop: true; volume: ${vol}`);
      } else {
        el.setAttribute('sound', `volume: 0`);
      }
    });
  },

  // ── Transition to new era ─────────────────────────────────
  _transitionToEra(era) {
    this._applyProfile(era, 3000);
  },

  // ── Play named sound ──────────────────────────────────────
  play(name) {
    const def = this._catalogue[name];
    if (!def) return;

    if (def.synthetic) {
      switch (def.type) {
        case 'click':       this._synthClick();          break;
        case 'reconstruct': this._synthReconstructBeam(); break;
        case 'complete':    this._synthComplete();        break;
      }
      return;
    }

    const el = this._ambients[name];
    if (el) el.components.sound?.playSound();
  },

  // ── Reconstruction sound sequence ─────────────────────────
  _playReconstructionSound(direction) {
    if (direction !== 'decay') {
      this._synthReconstructBeam();
      setTimeout(() => this._synthComplete(), 10200);
    }
  },

  // ── Spatial sound at position ─────────────────────────────
  playSpatial(name, position) {
    if (!this._ready) return;
    this._synthClick(); // placeholder
  }
});

// ── Torch Flame Component ─────────────────────────────────────
AFRAME.registerComponent('torch-flame', {
  schema: { lit: { type: 'boolean', default: false } },

  init() {
    this._lit = false;
    this._flickerInterval = null;

    this._light = document.createElement('a-light');
    this._light.setAttribute('type',      'point');
    this._light.setAttribute('color',     '#ff8c00');
    this._light.setAttribute('intensity', '0');
    this._light.setAttribute('distance',  '4');
    this._light.setAttribute('decay',     '2');
    this._light.setAttribute('position',  '0 0.1 0');
    this.el.appendChild(this._light);

    // Flame cone
    this._flame = document.createElement('a-cone');
    this._flame.setAttribute('radius-bottom', '0.06');
    this._flame.setAttribute('radius-top',    '0.01');
    this._flame.setAttribute('height',        '0.2');
    this._flame.setAttribute('position',      '0 0.15 0');
    this._flame.setAttribute('color',         '#ff6600');
    this._flame.setAttribute('opacity',       '0.9');
    this._flame.setAttribute('visible',       false);
    this.el.appendChild(this._flame);

    this.el.addEventListener('ignite',     () => this.ignite());
    this.el.addEventListener('extinguish', () => this.extinguish());

    if (this.data.lit) this.ignite();
  },

  ignite() {
    this._lit = true;
    this._flame.setAttribute('visible', true);
    this._light.setAttribute('animation__ignite', {
      property: 'components.light.light.intensity',
      from: 0, to: 1.5, dur: 500, easing: 'easeOutQuad'
    });
    this._startFlicker();
  },

  extinguish() {
    this._lit = false;
    clearInterval(this._flickerInterval);
    this._light.setAttribute('animation__extinguish', {
      property: 'components.light.light.intensity',
      to: 0, dur: 400, easing: 'easeInQuad'
    });
    setTimeout(() => this._flame.setAttribute('visible', false), 420);
  },

  _startFlicker() {
    clearInterval(this._flickerInterval);
    this._flickerInterval = setInterval(() => {
      if (!this._lit) return;
      const intensity = 1.2 + Math.random() * 0.6;
      this._light.setAttribute('light', `intensity: ${intensity}`);
      const scaleX = 0.9 + Math.random() * 0.2;
      const scaleY = 0.85 + Math.random() * 0.3;
      this._flame.setAttribute('scale', `${scaleX} ${scaleY} ${scaleX}`);
    }, 80);
  },

  remove() { clearInterval(this._flickerInterval); }
});

// ── Flag Wave Component ───────────────────────────────────────
AFRAME.registerComponent('flag-wave', {
  init() {
    this._t = 0;
    this._waving = false;

    this.el.addEventListener('wave', () => { this._waving = true; });

    // Build flag geometry
    const pole = document.createElement('a-cylinder');
    pole.setAttribute('radius', '0.025');
    pole.setAttribute('height', '2.5');
    pole.setAttribute('position', '0 1.25 0');
    pole.setAttribute('color',   '#8b7355');
    this.el.appendChild(pole);

    this._flag = document.createElement('a-plane');
    this._flag.setAttribute('width',    '0.7');
    this._flag.setAttribute('height',   '0.45');
    this._flag.setAttribute('position', '0.35 2.3 0');
    this._flag.setAttribute('color',    '#8b0000');
    this._flag.setAttribute('side',     'double');
    this.el.appendChild(this._flag);
  },

  tick(time, dt) {
    if (!this._waving) return;
    this._t += dt * 0.002;
    const wave = Math.sin(this._t * 3) * 0.06;
    const scale = 1 + Math.sin(this._t * 5) * 0.02;
    this._flag.setAttribute('rotation', `0 ${wave * 30} 0`);
    this._flag.setAttribute('scale',    `${scale} 1 1`);
  }
});
