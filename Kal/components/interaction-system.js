/**
 * interaction-system.js
 * ============================================================
 * ChronoScape VR — Controller Interaction System
 * Handles raycasting, laser pointer, highlight, and
 * controller locomotion for Meta Quest 3S.
 * ============================================================
 */

// ── Teleport Controller ───────────────────────────────────────
AFRAME.registerComponent('teleport-controller', {
  schema: {
    button:      { type: 'string', default: 'thumbstickdown' },
    hand:        { type: 'string', default: 'right' },
    maxDistance: { type: 'number', default: 15 },
    landingColor:{ type: 'color',  default: '#00ff88' }
  },

  init() {
    this._active    = false;
    this._marker    = null;
    this._raycaster = new THREE.Raycaster();
    this._direction = new THREE.Vector3();
    this._hitPoint  = null;
    this._camera    = null;

    this.el.sceneEl.addEventListener('loaded', () => {
      this._camera = document.querySelector('#player-camera');
      this._buildMarker();
    });

    this.el.addEventListener('thumbstickdown', () => this._startAim());
    this.el.addEventListener('thumbstickup',   () => this._teleport());
    this.el.addEventListener('gripdown',        () => this._startAim());
    this.el.addEventListener('gripup',          () => this._teleport());
  },

  _buildMarker() {
    this._marker = document.createElement('a-entity');

    const ring = document.createElement('a-torus');
    ring.setAttribute('radius',       '0.4');
    ring.setAttribute('radius-tubular','0.03');
    ring.setAttribute('color',         this.data.landingColor);
    ring.setAttribute('opacity',       '0.7');
    ring.setAttribute('rotation',      '-90 0 0');
    ring.setAttribute('animation__pulse', {
      property: 'scale', dir: 'alternate', loop: true,
      from: '1 1 1', to: '1.1 1.1 1.1', dur: 600
    });
    this._marker.appendChild(ring);

    const dot = document.createElement('a-sphere');
    dot.setAttribute('radius',  '0.07');
    dot.setAttribute('color',   this.data.landingColor);
    dot.setAttribute('position','0 0.05 0');
    this._marker.appendChild(dot);

    this._marker.setAttribute('visible', false);
    document.querySelector('a-scene').appendChild(this._marker);
  },

  _startAim() {
    this._active = true;
    this._marker.setAttribute('visible', true);
  },

  _teleport() {
    if (!this._active || !this._hitPoint) return;
    this._active = false;
    this._marker.setAttribute('visible', false);

    const rig = document.querySelector('#player-rig');
    if (!rig) return;

    const pos = rig.getAttribute('position');
    rig.setAttribute('animation__teleport', {
      property: 'position',
      to: `${this._hitPoint.x} ${pos.y} ${this._hitPoint.z}`,
      dur: 300, easing: 'easeInOutQuad'
    });

    window.ChronoScape?.audio?.play('ui-click');
  },

  tick() {
    if (!this._active) return;

    const origin = new THREE.Vector3();
    const dir    = new THREE.Vector3();
    this.el.object3D.getWorldPosition(origin);
    this.el.object3D.getWorldDirection(dir);

    this._raycaster.set(origin, dir);
    this._raycaster.far = this.data.maxDistance;

    const floor = document.querySelector('#terrain-ground');
    if (!floor) return;

    const intersects = this._raycaster.intersectObject(floor.object3D, true);
    if (intersects.length > 0) {
      this._hitPoint = intersects[0].point;
      this._marker.setAttribute('position', `${this._hitPoint.x} ${this._hitPoint.y + 0.02} ${this._hitPoint.z}`);
    }
  }
});

// ── Smooth Locomotion ─────────────────────────────────────────
AFRAME.registerComponent('smooth-locomotion', {
  schema: {
    speed:   { type: 'number', default: 3.0 },
    hand:    { type: 'string', default: 'left' },
    enabled: { type: 'boolean', default: true }
  },

  init() {
    this._axis     = { x: 0, y: 0 };
    this._camera   = null;
    this._rig      = null;
    this._vel      = new THREE.Vector3();

    this.el.sceneEl.addEventListener('loaded', () => {
      this._camera = document.querySelector('#player-camera');
      this._rig    = document.querySelector('#player-rig');
    });

    this.el.addEventListener('thumbstickmoved', (e) => {
      this._axis.x = e.detail.x;
      this._axis.y = e.detail.y;
    });
    this.el.addEventListener('thumbstickup', () => { this._axis = { x:0, y:0 }; });
  },

  tick(time, dt) {
    if (!this.data.enabled || !this._rig || !this._camera) return;
    if (Math.abs(this._axis.x) < 0.1 && Math.abs(this._axis.y) < 0.1) return;

    const yaw     = this._camera.getAttribute('rotation')?.y || 0;
    const rad     = THREE.MathUtils.degToRad(yaw);
    const forward = new THREE.Vector3(-Math.sin(rad), 0, -Math.cos(rad));
    const right   = new THREE.Vector3(Math.cos(rad), 0, -Math.sin(rad));

    const move = forward.multiplyScalar(-this._axis.y)
                 .add(right.multiplyScalar(this._axis.x));
    move.multiplyScalar(this.data.speed * dt * 0.001);

    const pos = this._rig.getAttribute('position');
    this._rig.setAttribute('position', {
      x: pos.x + move.x,
      y: pos.y,
      z: pos.z + move.z
    });
  }
});

// ── Snap Turn ─────────────────────────────────────────────────
AFRAME.registerComponent('snap-turn', {
  schema: {
    angle:    { type: 'number', default: 30 },
    cooldown: { type: 'number', default: 350 }
  },

  init() {
    this._lastSnap = 0;
    this._rig = null;

    this.el.sceneEl.addEventListener('loaded', () => {
      this._rig = document.querySelector('#player-rig');
    });

    this.el.addEventListener('thumbstickmoved', (e) => {
      const now = Date.now();
      if (now - this._lastSnap < this.data.cooldown) return;
      if (Math.abs(e.detail.x) < 0.7) return;

      this._lastSnap = now;
      const dir = e.detail.x > 0 ? 1 : -1;
      const rig = this._rig;
      if (!rig) return;

      const rot = rig.getAttribute('rotation') || { x:0, y:0, z:0 };
      rig.setAttribute('rotation', { x: rot.x, y: rot.y - dir * this.data.angle, z: rot.z });
    });
  }
});

// ── Laser Pointer / Raycaster UI ─────────────────────────────
AFRAME.registerComponent('laser-pointer', {
  schema: {
    color:  { type: 'color',  default: '#4fc3f7' },
    length: { type: 'number', default: 10 }
  },

  init() {
    this._line  = null;
    this._dot   = null;
    this._hovered = null;

    this._buildLaser();

    this.el.addEventListener('raycaster-intersection', (e) => {
      const el = e.detail.els[0];
      if (el !== this._hovered) {
        this._hovered = el;
        this._onHoverEnter(el);
      }
    });

    this.el.addEventListener('raycaster-intersection-cleared', () => {
      if (this._hovered) {
        this._onHoverExit(this._hovered);
        this._hovered = null;
      }
    });

    // Trigger to click
    this.el.addEventListener('triggerdown', () => {
      if (this._hovered) this._onClick(this._hovered);
    });
  },

  _buildLaser() {
    // Laser line
    this._line = document.createElement('a-entity');
    this._line.setAttribute('line', `start: 0 0 0; end: 0 0 -${this.data.length}; color: ${this.data.color}; opacity: 0.6`);
    this.el.appendChild(this._line);

    // End dot
    this._dot = document.createElement('a-sphere');
    this._dot.setAttribute('radius',   '0.012');
    this._dot.setAttribute('color',    this.data.color);
    this._dot.setAttribute('position', `0 0 -${this.data.length}`);
    this._dot.setAttribute('material', `emissive: ${this.data.color}; emissiveIntensity: 2`);
    this.el.appendChild(this._dot);
  },

  _onHoverEnter(el) {
    if (!el.classList.contains('interactive')) return;
    this._line.setAttribute('line', `start: 0 0 0; end: 0 0 -${this.data.length}; color: #ffffff; opacity: 0.9`);
    this._dot.setAttribute('material', 'color: #ffffff; emissive: #ffffff; emissiveIntensity: 3');
    this._dot.setAttribute('animation__pulse', {
      property: 'scale', from: '1 1 1', to: '2 2 2', dir: 'alternate', loop: true, dur: 300
    });
    el.emit('raycaster-intersected', {}, false);
    window.ChronoScape?.audio?.play('ui-click');
  },

  _onHoverExit(el) {
    this._line.setAttribute('line', `start: 0 0 0; end: 0 0 -${this.data.length}; color: ${this.data.color}; opacity: 0.6`);
    this._dot.removeAttribute('animation__pulse');
    this._dot.setAttribute('scale', '1 1 1');
    this._dot.setAttribute('material', `color: ${this.data.color}; emissive: ${this.data.color}; emissiveIntensity: 2`);
    el.emit('raycaster-intersected-cleared', {}, false);
  },

  _onClick(el) {
    el.emit('click', {}, false);
    window.ChronoScape?.audio?.play('ui-click');
    el.setAttribute('animation__click', {
      property: 'scale', from: '1.05 1.05 1.05', to: '1 1 1', dur: 150
    });
  }
});

// ── Historical Layer Switcher ─────────────────────────────────
AFRAME.registerComponent('historical-layer', {
  schema: {
    era: { type: 'string', default: 'ruins' }  // ruins|500|1000|original
  },

  init() {
    this.el.sceneEl.addEventListener('loaded', () => {
      this._applyEra(this.data.era);
    });

    this.el.sceneEl.addEventListener('switch-era', (e) => {
      this._applyEra(e.detail.era);
      this.el.setAttribute('historical-layer', 'era', e.detail.era);
    });
  },

  _applyEra(era) {
    // Get all layer-tagged elements
    const allLayers = document.querySelectorAll('[data-era]');
    allLayers.forEach(el => {
      const visible = el.dataset.era === era || el.dataset.era === 'all';
      el.setAttribute('visible', visible);
    });

    // Lighting adjustments per era
    const sky   = document.querySelector('#scene-sky');
    const sun   = document.querySelector('#sunlight');
    const fog   = document.querySelector('a-scene');

    const configs = {
      ruins:    { skyColor: '#87CEEB', fogColor: '#8ba3bc', fogNear: 15, fogFar: 60,  sunInt: 0.8, sunColor: '#ffd580' },
      '500':    { skyColor: '#ff8c42', fogColor: '#a0826d', fogNear: 12, fogFar: 55,  sunInt: 1.0, sunColor: '#ffb347' },
      '1000':   { skyColor: '#4a90d9', fogColor: '#6b89a0', fogNear: 12, fogFar: 60,  sunInt: 0.9, sunColor: '#ffeaa0' },
      original: { skyColor: '#1a0a2e', fogColor: '#2d1b69', fogNear: 8,  fogFar: 45,  sunInt: 1.2, sunColor: '#ffe5b4' }
    };

    const cfg = configs[era] || configs.ruins;
    if (sky) sky.setAttribute('color', cfg.skyColor);
    if (sun) {
      sun.setAttribute('light', `type: directional; color: ${cfg.sunColor}; intensity: ${cfg.sunInt}; castShadow: true`);
    }
    if (fog) fog.setAttribute('fog', `type: linear; color: ${cfg.fogColor}; near: ${cfg.fogNear}; far: ${cfg.fogFar}`);

    // Emit era-changed for audio manager
    this.el.sceneEl.emit('era-changed', { era });
    window.ChronoScape?.setEra?.(era);

    window.ChronoScape?.notify?.(`🕰 ${this._eraLabel(era)}`);
  },

  _eraLabel(era) {
    return { ruins:'Present — Ruins', '500':'500 Years Ago', '1000':'1000 Years Ago', original:'Original Construction ~2100 BCE' }[era] || era;
  }
});
