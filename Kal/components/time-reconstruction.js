/**
 * time-reconstruction.js
 * ============================================================
 * ChronoScape VR — Time Reconstruction Component
 * Manages the 10-second animated transition from ruins to
 * fully restored ancient architecture.
 * ============================================================
 */

AFRAME.registerComponent('time-reconstruction', {
  schema: {
    duration:    { type: 'number', default: 10000 },  // ms
    active:      { type: 'boolean', default: false },
    currentEra:  { type: 'string',  default: 'ruins' },
    easing:      { type: 'string',  default: 'easeInOutCubic' }
  },

  init() {
    this._isAnimating  = false;
    this._progress     = 0;
    this._startTime    = 0;
    this._direction    = 1;          // 1 = rebuild, -1 = decay
    this._listeners    = [];

    // Bind methods
    this._onTrigger    = this._onTrigger.bind(this);
    this._tick         = this._tick.bind(this);

    // Gather scene layers once scene is loaded
    this.el.sceneEl.addEventListener('loaded', () => {
      this._gatherElements();
      this._attachControllerListeners();
      this._initParticleSystem();
    });

    // Expose API on scene element for cross-component access
    this.el.sceneEl.timeReconstruction = this;
  },

  // ── Gather all managed DOM elements ──────────────────────
  _gatherElements() {
    const s = document.querySelector;
    this.ruins    = Array.from(document.querySelectorAll('[data-layer="ruins"]'));
    this.restored = Array.from(document.querySelectorAll('[data-layer="restored"]'));
    this.npcs     = Array.from(document.querySelectorAll('[data-layer="npcs"]'));
    this.decor    = Array.from(document.querySelectorAll('[data-layer="decor"]'));
    this.torches  = Array.from(document.querySelectorAll('[data-torch]'));
    this.flags    = Array.from(document.querySelectorAll('[data-flag]'));
    this.columns  = Array.from(document.querySelectorAll('[data-column]'));
    this.walls    = Array.from(document.querySelectorAll('[data-wall]'));
    this.roof     = document.querySelector('[data-roof]');
    this.particles= document.querySelector('#reconstruction-particles');
  },

  // ── Attach controller trigger listeners ───────────────────
  _attachControllerListeners() {
    ['right-hand', 'rightHand', 'right-controller'].forEach(id => {
      const el = document.querySelector(`#${id}`);
      if (el) {
        const handler = (evt) => this._onTrigger(evt);
        el.addEventListener('triggerdown', handler);
        el.addEventListener('abuttondown', handler); // Quest A button also triggers
        this._listeners.push({ el, event: 'triggerdown', handler });
      }
    });

    // Keyboard fallback for desktop testing
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') this._onTrigger();
    });
  },

  // ── Handle trigger press ──────────────────────────────────
  _onTrigger() {
    if (this._isAnimating) return;

    const era = this.data.currentEra;
    if (era === 'ruins') {
      this._startReconstruction();
    } else {
      this._startDecay();
    }
  },

  // ── Begin rebuild animation ───────────────────────────────
  _startReconstruction() {
    this._isAnimating = true;
    this._direction   = 1;
    this._startTime   = performance.now();
    this._progress    = 0;

    // Activate magic particles
    if (this.particles) this.particles.setAttribute('visible', true);

    // Emit event for other components (audio, guide, etc.)
    this.el.sceneEl.emit('reconstruction-start', { direction: 'rebuild' });

    // Show notification
    window.ChronoScape?.notify('⚡ Temporal reconstruction initiated…');

    // Stage 1 — columns rise (0–30%)
    this._scheduleStage(0,     () => this._riseColumns());
    // Stage 2 — walls rebuild (20–60%)
    this._scheduleStage(2000,  () => this._rebuildWalls());
    // Stage 3 — roof appears (50–80%)
    this._scheduleStage(5000,  () => this._materializeRoof());
    // Stage 4 — decor + torches (70–100%)
    this._scheduleStage(7000,  () => this._igniteDecoration());
    // Stage 5 — NPCs spawn (85–100%)
    this._scheduleStage(8500,  () => this._spawnNPCs());
    // Stage 6 — complete
    this._scheduleStage(10000, () => this._onReconstructionComplete());

    this._startTick();
  },

  // ── Begin decay animation (reverse) ──────────────────────
  _startDecay() {
    this._isAnimating = true;
    this._direction   = -1;
    this._startTime   = performance.now();

    this.el.sceneEl.emit('reconstruction-start', { direction: 'decay' });
    window.ChronoScape?.notify('↩ Returning to present…');

    this._scheduleStage(0,    () => this._hideNPCs());
    this._scheduleStage(2000, () => this._extinguishDecoration());
    this._scheduleStage(4000, () => this._collapseRoof());
    this._scheduleStage(6000, () => this._crumbleWalls());
    this._scheduleStage(8000, () => this._sinkColumns());
    this._scheduleStage(10000,() => this._onDecayComplete());

    this._startTick();
  },

  // ── Schedule a timed stage ────────────────────────────────
  _scheduleStage(delay, fn) {
    const id = setTimeout(fn, delay);
    this._stageTimers = this._stageTimers || [];
    this._stageTimers.push(id);
  },

  _clearStages() {
    (this._stageTimers || []).forEach(id => clearTimeout(id));
    this._stageTimers = [];
  },

  // ── Per-frame tick for continuous effects ─────────────────
  _startTick() {
    this._rafId = requestAnimationFrame(this._frameTick.bind(this));
  },

  _frameTick(now) {
    if (!this._isAnimating) return;
    const elapsed  = now - this._startTime;
    this._progress = Math.min(elapsed / this.data.duration, 1);

    // Pulse particles intensity with progress
    this._updateParticles(this._progress);

    if (this._progress < 1) {
      this._rafId = requestAnimationFrame(this._frameTick.bind(this));
    }
  },

  // ── Column rise ───────────────────────────────────────────
  _riseColumns() {
    this.columns.forEach((col, i) => {
      const delay = i * 300;
      col.setAttribute('visible', true);
      col.removeAttribute('animation__rise');
      col.setAttribute('animation__rise', {
        property: 'position',
        to: col.dataset.targetPos || col.getAttribute('position'),
        from: { x: parseFloat(col.getAttribute('position').x || 0), y: -5, z: parseFloat(col.getAttribute('position').z || 0) },
        dur: 2500,
        delay,
        easing: 'easeOutElastic'
      });
      col.setAttribute('animation__fade', {
        property: 'components.material.material.opacity',
        from: 0, to: 1, dur: 1500, delay, easing: 'easeInQuad'
      });
    });
  },

  // ── Wall rebuild ──────────────────────────────────────────
  _rebuildWalls() {
    this.walls.forEach((wall, i) => {
      const delay = i * 400;
      wall.setAttribute('visible', true);
      const pos  = wall.getAttribute('position');
      wall.setAttribute('animation__rebuild', {
        property: 'scale',
        from: '1 0.01 1', to: '1 1 1',
        dur: 2000, delay, easing: 'easeOutBounce'
      });
      wall.setAttribute('animation__fade', {
        property: 'components.material.material.opacity',
        from: 0.2, to: 1, dur: 1800, delay, easing: 'easeInOutQuad'
      });
    });

    // Hide ruined equivalents
    this.ruins.forEach(r => {
      r.setAttribute('animation__hide', {
        property: 'components.material.material.opacity',
        from: 1, to: 0, dur: 1500, easing: 'easeInQuad'
      });
      setTimeout(() => r.setAttribute('visible', false), 1600);
    });
  },

  // ── Roof materialise ──────────────────────────────────────
  _materializeRoof() {
    if (!this.roof) return;
    this.roof.setAttribute('visible', true);
    this.roof.setAttribute('animation__drop', {
      property: 'position',
      from: { x: 0, y: 15, z: 0 },
      to:   { x: 0, y: parseFloat(this.roof.dataset.targetY || 8), z: 0 },
      dur: 2000, easing: 'easeOutCubic'
    });
    this.roof.setAttribute('animation__fade', {
      property: 'components.material.material.opacity',
      from: 0, to: 1, dur: 1500, easing: 'easeInQuad'
    });
  },

  // ── Torches + decorations ─────────────────────────────────
  _igniteDecoration() {
    this.decor.forEach((el, i) => {
      el.setAttribute('visible', true);
      el.setAttribute('animation__pop', {
        property: 'scale',
        from: '0 0 0', to: '1 1 1',
        dur: 600, delay: i * 150, easing: 'easeOutBack'
      });
    });

    this.torches.forEach((torch, i) => {
      torch.setAttribute('visible', true);
      setTimeout(() => {
        torch.emit('ignite');
        torch.setAttribute('animation__flicker', {
          property: 'components.light.light.intensity',
          from: 0, to: 1.5, dur: 400, easing: 'easeOutQuad'
        });
      }, i * 200);
    });

    this.flags.forEach((flag, i) => {
      flag.setAttribute('visible', true);
      setTimeout(() => flag.emit('wave'), i * 300);
    });
  },

  // ── Spawn NPCs ────────────────────────────────────────────
  _spawnNPCs() {
    this.npcs.forEach((npc, i) => {
      const delay = i * 500;
      setTimeout(() => {
        npc.setAttribute('visible', true);
        npc.setAttribute('animation__appear', {
          property: 'scale',
          from: '0 0 0', to: '1 1 1',
          dur: 800, easing: 'easeOutBack'
        });
        npc.emit('activate');
      }, delay);
    });
  },

  // ── Reconstruction complete ───────────────────────────────
  _onReconstructionComplete() {
    this._isAnimating = false;
    this.el.setAttribute('time-reconstruction', 'currentEra', 'restored');
    if (this.particles) this.particles.setAttribute('visible', false);
    this.el.sceneEl.emit('reconstruction-complete', {});
    window.ChronoScape?.notify('✨ City restored — 2000 BCE');
    window.ChronoScape?.setEra('restored');
  },

  // ── Decay complete ────────────────────────────────────────
  _onDecayComplete() {
    this._isAnimating = false;
    this.el.setAttribute('time-reconstruction', 'currentEra', 'ruins');
    this.el.sceneEl.emit('reconstruction-complete', { direction: 'decay' });
    window.ChronoScape?.notify('Present day — ruins restored');
    window.ChronoScape?.setEra('ruins');
  },

  // ── Reverse stages ────────────────────────────────────────
  _hideNPCs()            { this.npcs.forEach(n => { n.setAttribute('animation__vanish', { property:'scale', to:'0 0 0', dur:400 }); setTimeout(()=>n.setAttribute('visible',false),450); }); },
  _extinguishDecoration(){ this.decor.forEach(d => d.setAttribute('visible',false)); this.torches.forEach(t=>t.emit('extinguish')); },
  _collapseRoof()        { if(this.roof){ this.roof.setAttribute('animation__collapse',{ property:'position', to:{x:0,y:-10,z:0}, dur:1500, easing:'easeInCubic'}); setTimeout(()=>this.roof.setAttribute('visible',false),1600); }},
  _crumbleWalls()        { this.walls.forEach((w,i)=>{ w.setAttribute('animation__crumble',{ property:'scale', to:'1 0.01 1', dur:1200, delay:i*200, easing:'easeInBounce'}); setTimeout(()=>w.setAttribute('visible',false),1300+i*200); }); this.ruins.forEach(r=>{ r.setAttribute('visible',true); r.setAttribute('animation__appear',{ property:'components.material.material.opacity', from:0, to:1, dur:1200, easing:'easeOutQuad'}); }); },
  _sinkColumns()         { this.columns.forEach((c,i)=>{ c.setAttribute('animation__sink',{ property:'position', to:{x:0,y:-5,z:0}, dur:1500, delay:i*200, easing:'easeInCubic'}); setTimeout(()=>c.setAttribute('visible',false),1600+i*200); }); },

  // ── Particle intensity update ─────────────────────────────
  _updateParticles(t) {
    if (!this.particles) return;
    // Particles peak at 50% progress then fade
    const intensity = Math.sin(t * Math.PI);
    this.particles.setAttribute('particle-system', 'velocityValue', `0 ${intensity * 3} 0`);
  },

  // ── Init magic particle system ────────────────────────────
  _initParticleSystem() {
    this.particles = document.querySelector('#reconstruction-particles');
    if (this.particles) this.particles.setAttribute('visible', false);
  },

  remove() {
    this._clearStages();
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._listeners.forEach(({ el, event, handler }) => el.removeEventListener(event, handler));
  }
});
