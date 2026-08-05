/**
 * visual-effects.js
 * ============================================================
 * ChronoScape VR — Visual Effects Components
 * Dust particles, floating leaves, light rays,
 * volumetric fog patches, and reconstruction magic particles.
 * ============================================================
 */

// ── Dust Particle System ──────────────────────────────────────
AFRAME.registerComponent('dust-particles', {
  schema: {
    count:  { type: 'number', default: 80 },
    spread: { type: 'number', default: 20 },
    speed:  { type: 'number', default: 0.3 },
    color:  { type: 'color',  default: '#c4a87a' },
    size:   { type: 'number', default: 0.04 }
  },

  init() {
    this._particles = [];
    this._time      = 0;
    this._build();
  },

  _build() {
    const { count, spread, color, size } = this.data;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('a-sphere');
      p.setAttribute('radius',  size * (0.5 + Math.random() * 0.8));
      p.setAttribute('color',   color);
      p.setAttribute('opacity', 0.08 + Math.random() * 0.18);
      p.setAttribute('shader',  'flat');
      p.setAttribute('segments-width',  '4');
      p.setAttribute('segments-height', '4');

      const x = (Math.random() - 0.5) * spread;
      const y = Math.random() * 8;
      const z = (Math.random() - 0.5) * spread;
      p.setAttribute('position', `${x} ${y} ${z}`);

      // Store state
      p._vel = {
        x: (Math.random() - 0.5) * 0.005,
        y: (Math.random() * 0.01 + 0.003),
        z: (Math.random() - 0.5) * 0.005
      };
      p._originY = y;
      p._maxY    = y + 3 + Math.random() * 4;

      this.el.appendChild(p);
      this._particles.push(p);
    }
  },

  tick(time, dt) {
    this._time += dt;
    const dts = dt * 0.001;

    this._particles.forEach(p => {
      const pos = p.getAttribute('position');
      let { x, y, z } = pos;

      x += p._vel.x + Math.sin(this._time * 0.001 + x) * 0.0015;
      y += p._vel.y;
      z += p._vel.z + Math.cos(this._time * 0.001 + z) * 0.0015;

      // Reset when too high
      if (y > p._maxY) {
        y = p._originY;
        x = (Math.random() - 0.5) * this.data.spread;
        z = (Math.random() - 0.5) * this.data.spread;
      }

      p.setAttribute('position', `${x} ${y} ${z}`);
    });
  }
});

// ── Floating Leaves ───────────────────────────────────────────
AFRAME.registerComponent('floating-leaves', {
  schema: {
    count:  { type: 'number', default: 30 },
    spread: { type: 'number', default: 12 },
    color:  { type: 'color',  default: '#5a8a40' }
  },

  init() {
    this._leaves = [];
    this._t = 0;
    this._build();
  },

  _build() {
    const colors = ['#5a8a40', '#3d6b2c', '#8fbc5a', '#4a7a35', '#6bad3d'];
    for (let i = 0; i < this.data.count; i++) {
      const leaf = document.createElement('a-plane');
      leaf.setAttribute('width',   '0.12');
      leaf.setAttribute('height',  '0.07');
      leaf.setAttribute('color',   colors[i % colors.length]);
      leaf.setAttribute('opacity', '0.7');
      leaf.setAttribute('side',    'double');
      leaf.setAttribute('shader',  'flat');

      const x = (Math.random() - 0.5) * this.data.spread;
      const y = 1 + Math.random() * 6;
      const z = (Math.random() - 0.5) * this.data.spread;
      leaf.setAttribute('position', `${x} ${y} ${z}`);

      leaf._phase  = Math.random() * Math.PI * 2;
      leaf._radius = 0.5 + Math.random() * 2;
      leaf._speed  = 0.2 + Math.random() * 0.5;
      leaf._originX = x;
      leaf._originZ = z;
      leaf._fallSpeed = 0.2 + Math.random() * 0.4;
      leaf._startY = y;

      this.el.appendChild(leaf);
      this._leaves.push(leaf);
    }
  },

  tick(time, dt) {
    this._t += dt * 0.001;
    this._leaves.forEach(leaf => {
      const pos = leaf.getAttribute('position');
      let { x, y, z } = pos;

      // Spiral fall
      x = leaf._originX + Math.sin(this._t * leaf._speed + leaf._phase) * leaf._radius * 0.3;
      y -= leaf._fallSpeed * dt * 0.001;
      z = leaf._originZ + Math.cos(this._t * leaf._speed + leaf._phase) * leaf._radius * 0.3;

      if (y < 0) {
        y = leaf._startY + Math.random() * 2;
        leaf._originX = (Math.random() - 0.5) * this.data.spread;
        leaf._originZ = (Math.random() - 0.5) * this.data.spread;
      }

      leaf.setAttribute('position', `${x} ${y} ${z}`);
      leaf.setAttribute('rotation', `${this._t * 40 * leaf._speed} ${this._t * 60 * leaf._speed} 0`);
    });
  }
});

// ── God Rays (Light Shafts) ───────────────────────────────────
AFRAME.registerComponent('god-rays', {
  schema: {
    count:   { type: 'number', default: 6 },
    color:   { type: 'color',  default: '#fff5cc' },
    opacity: { type: 'number', default: 0.06 }
  },

  init() {
    this._rays = [];
    this._t    = 0;

    for (let i = 0; i < this.data.count; i++) {
      const ray = document.createElement('a-cone');
      ray.setAttribute('radius-top',    '0.01');
      ray.setAttribute('radius-bottom', `${0.8 + i * 0.3}`);
      ray.setAttribute('height',        `${6 + i * 1.5}`);
      ray.setAttribute('color',          this.data.color);
      ray.setAttribute('opacity',        this.data.opacity * (0.5 + Math.random() * 0.8));
      ray.setAttribute('shader',         'flat');
      ray.setAttribute('side',           'back');
      ray.setAttribute('open-ended',     true);

      const angle = (i / this.data.count) * Math.PI * 2;
      const x     = Math.cos(angle) * 3;
      const z     = Math.sin(angle) * 3;
      ray.setAttribute('position', `${x} 10 ${z}`);
      ray.setAttribute('rotation', `${-15 + Math.random() * 10} ${(angle * 180 / Math.PI)} 0`);

      ray._baseOpacity = this.data.opacity * (0.5 + Math.random() * 0.8);
      ray._phase       = Math.random() * Math.PI * 2;

      this.el.appendChild(ray);
      this._rays.push(ray);
    }
  },

  tick(time, dt) {
    this._t += dt * 0.0003;
    this._rays.forEach(ray => {
      const op = ray._baseOpacity * (0.7 + 0.3 * Math.sin(this._t + ray._phase));
      ray.setAttribute('opacity', op);
    });
  }
});

// ── Magic Reconstruction Particles ───────────────────────────
AFRAME.registerComponent('magic-particles', {
  schema: {
    count:  { type: 'number', default: 120 },
    radius: { type: 'number', default: 8 },
    active: { type: 'boolean', default: false }
  },

  init() {
    this._sparks = [];
    this._t      = 0;
    this._active = false;
    this._build();

    this.el.addEventListener('activate-magic', () => this._activate());
    this.el.addEventListener('deactivate-magic', () => this._deactivate());

    this.el.sceneEl.addEventListener('reconstruction-start', () => this._activate());
    this.el.sceneEl.addEventListener('reconstruction-complete', () => {
      setTimeout(() => this._deactivate(), 2000);
    });
  },

  _build() {
    const colors = ['#d4a843', '#4fc3f7', '#ffffff', '#ff8c00', '#e8dcc8'];
    for (let i = 0; i < this.data.count; i++) {
      const spark = document.createElement('a-sphere');
      spark.setAttribute('radius',   '0.025');
      spark.setAttribute('color',    colors[i % colors.length]);
      spark.setAttribute('opacity',  '0');
      spark.setAttribute('shader',   'flat');
      spark.setAttribute('material', `emissive: ${colors[i % colors.length]}; emissiveIntensity: 2`);
      spark.setAttribute('segments-width',  '4');
      spark.setAttribute('segments-height', '4');

      // Random orbit params
      spark._theta   = Math.random() * Math.PI * 2;
      spark._phi     = Math.random() * Math.PI;
      spark._r       = 1 + Math.random() * this.data.radius;
      spark._speed   = (0.5 + Math.random() * 2) * (Math.random() > 0.5 ? 1 : -1);
      spark._riseSpeed = 0.2 + Math.random() * 1.5;

      this.el.appendChild(spark);
      this._sparks.push(spark);
    }
  },

  _activate() {
    this._active = true;
    this.el.setAttribute('visible', true);
    this._sparks.forEach((spark, i) => {
      setTimeout(() => {
        spark.setAttribute('animation__appear', {
          property: 'components.material.material.opacity',
          from: 0, to: 0.8 + Math.random() * 0.2, dur: 500
        });
      }, i * 15);
    });
  },

  _deactivate() {
    this._active = false;
    this._sparks.forEach(spark => {
      spark.setAttribute('animation__disappear', {
        property: 'components.material.material.opacity',
        to: 0, dur: 1200
      });
    });
    setTimeout(() => this.el.setAttribute('visible', false), 1300);
  },

  tick(time, dt) {
    if (!this._active) return;
    this._t += dt * 0.001;

    this._sparks.forEach((spark, i) => {
      spark._theta += spark._speed * dt * 0.001;
      const phi = spark._phi + this._t * 0.3;

      const x = spark._r * Math.sin(phi) * Math.cos(spark._theta);
      const y = spark._r * Math.cos(phi) + this._t * 0.3;
      const z = spark._r * Math.sin(phi) * Math.sin(spark._theta);

      spark.setAttribute('position', `${x} ${y} ${z}`);

      // Twinkle
      const scl = 0.8 + Math.sin(this._t * 4 + i) * 0.3;
      spark.setAttribute('scale', `${scl} ${scl} ${scl}`);
    });
  }
});

// ── Fire Effect ───────────────────────────────────────────────
AFRAME.registerComponent('fire-effect', {
  schema: {
    intensity: { type: 'number', default: 1.0 },
    color:     { type: 'color',  default: '#ff6600' }
  },

  init() {
    this._t      = 0;
    this._flames = [];
    this._buildFire();
  },

  _buildFire() {
    const layers = 4;
    const palette = ['#ff2200', '#ff6600', '#ff9900', '#ffcc00'];

    for (let i = 0; i < layers; i++) {
      const cone = document.createElement('a-cone');
      cone.setAttribute('radius-bottom', `${0.12 - i * 0.02}`);
      cone.setAttribute('radius-top',    '0.01');
      cone.setAttribute('height',        `${0.25 + i * 0.12}`);
      cone.setAttribute('position',      `${(Math.random()-0.5)*0.04} ${i * 0.06} ${(Math.random()-0.5)*0.04}`);
      cone.setAttribute('color',          palette[i]);
      cone.setAttribute('opacity',        `${0.85 - i * 0.15}`);
      cone.setAttribute('shader',         'flat');
      cone._layer = i;
      cone._phase = Math.random() * Math.PI * 2;
      this.el.appendChild(cone);
      this._flames.push(cone);
    }

    // Base glow
    const glow = document.createElement('a-sphere');
    glow.setAttribute('radius',  '0.1');
    glow.setAttribute('color',   '#ff4400');
    glow.setAttribute('opacity', '0.3');
    glow.setAttribute('shader',  'flat');
    glow.setAttribute('material','emissive: #ff4400; emissiveIntensity: 2');
    this.el.appendChild(glow);
  },

  tick(time, dt) {
    this._t += dt * 0.003;
    this._flames.forEach((cone, i) => {
      const sx = 0.85 + Math.sin(this._t * 3 + cone._phase) * 0.2;
      const sy = 0.9  + Math.sin(this._t * 2.5 + cone._phase * 1.3) * 0.15;
      cone.setAttribute('scale', `${sx} ${sy} ${sx}`);
      cone.setAttribute('rotation', `0 ${this._t * 20 + i * 45} 0`);
    });
  }
});
