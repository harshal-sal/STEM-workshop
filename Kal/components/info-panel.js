/**
 * info-panel.js
 * ============================================================
 * ChronoScape VR — Floating Holographic Information Panel
 * Displays historical data, period, materials, and facts.
 * Always faces the player. Animated appearance.
 * ============================================================
 */

AFRAME.registerComponent('info-panel', {
  schema: {
    title:      { type: 'string',  default: '' },
    period:     { type: 'string',  default: '' },
    purpose:    { type: 'string',  default: '' },
    material:   { type: 'string',  default: '' },
    fact:       { type: 'string',  default: '' },
    visible:    { type: 'boolean', default: false },
    width:      { type: 'number',  default: 1.4 },
    height:     { type: 'number',  default: 1.0 }
  },

  init() {
    this._built   = false;
    this._visible = false;
    this._camera  = null;

    this.el.sceneEl.addEventListener('loaded', () => {
      this._camera = document.querySelector('#player-camera');
      this._buildPanel();
    });
  },

  // ── Build holographic panel geometry ──────────────────────
  _buildPanel() {
    if (this._built) return;
    this._built = true;

    const root = this.el;
    root.setAttribute('visible', false);

    // ── Background glass plane ─────────────────────────────
    const bg = document.createElement('a-plane');
    bg.setAttribute('width',    this.data.width);
    bg.setAttribute('height',   this.data.height);
    bg.setAttribute('color',    '#050a15');
    bg.setAttribute('opacity',  '0.88');
    bg.setAttribute('side',     'double');
    bg.setAttribute('shader',   'flat');
    root.appendChild(bg);

    // ── Glow border (slightly larger plane) ────────────────
    const border = document.createElement('a-plane');
    border.setAttribute('width',    this.data.width + 0.04);
    border.setAttribute('height',   this.data.height + 0.04);
    border.setAttribute('color',    '#4fc3f7');
    border.setAttribute('opacity',  '0.25');
    border.setAttribute('position', '0 0 -0.002');
    border.setAttribute('side',     'double');
    border.setAttribute('shader',   'flat');
    root.appendChild(border);

    // ── Animated border glow ───────────────────────────────
    border.setAttribute('animation__glow', {
      property: 'components.material.material.opacity',
      from: 0.15, to: 0.4, dir: 'alternate', loop: true,
      dur: 1800, easing: 'easeInOutSine'
    });

    // ── Title text ─────────────────────────────────────────
    const title = document.createElement('a-text');
    title.setAttribute('value',    this.data.title);
    title.setAttribute('position', `0 ${this.data.height / 2 - 0.12} 0.01`);
    title.setAttribute('align',    'center');
    title.setAttribute('color',    '#d4a843');
    title.setAttribute('width',    this.data.width * 0.85);
    title.setAttribute('wrap-count', '24');
    title.dataset.role = 'title';
    root.appendChild(title);

    // ── Divider line ───────────────────────────────────────
    const divider = document.createElement('a-plane');
    divider.setAttribute('width',   this.data.width * 0.85);
    divider.setAttribute('height',  '0.005');
    divider.setAttribute('color',   '#d4a843');
    divider.setAttribute('opacity', '0.5');
    divider.setAttribute('position', `0 ${this.data.height / 2 - 0.22} 0.01`);
    divider.setAttribute('shader', 'flat');
    root.appendChild(divider);

    // ── Body fields ────────────────────────────────────────
    const fields = [
      { label: '📅 Period',   key: 'period',   y: 0.15 },
      { label: '🏛  Purpose', key: 'purpose',  y: 0.02 },
      { label: '🪨 Material', key: 'material', y: -0.11 },
      { label: '💡 Fact',     key: 'fact',     y: -0.28 }
    ];

    fields.forEach(({ label, key, y }) => {
      const lbl = document.createElement('a-text');
      lbl.setAttribute('value',    label);
      lbl.setAttribute('position', `${-(this.data.width / 2 - 0.12)} ${y} 0.01`);
      lbl.setAttribute('align',    'left');
      lbl.setAttribute('color',    '#4fc3f7');
      lbl.setAttribute('width',    0.5);
      lbl.setAttribute('wrap-count', '12');
      root.appendChild(lbl);

      const val = document.createElement('a-text');
      val.setAttribute('value',    this.data[key] || '—');
      val.setAttribute('position', `${-(this.data.width / 2 - 0.12)} ${y - 0.08} 0.01`);
      val.setAttribute('align',    'left');
      val.setAttribute('color',    '#e8dcc8');
      val.setAttribute('width',    this.data.width * 0.85);
      val.setAttribute('wrap-count', '30');
      val.dataset.field = key;
      root.appendChild(val);
    });

    // ── Close button ───────────────────────────────────────
    const closeBg = document.createElement('a-circle');
    closeBg.setAttribute('radius',   '0.07');
    closeBg.setAttribute('color',    '#c0392b');
    closeBg.setAttribute('opacity',  '0.8');
    closeBg.setAttribute('position', `${this.data.width / 2 - 0.1} ${this.data.height / 2 - 0.1} 0.01`);
    closeBg.setAttribute('class',    'interactive');
    closeBg.addEventListener('click', () => this.hide());
    root.appendChild(closeBg);

    const closeX = document.createElement('a-text');
    closeX.setAttribute('value', '✕');
    closeX.setAttribute('align', 'center');
    closeX.setAttribute('color', '#ffffff');
    closeX.setAttribute('width', '0.35');
    closeX.setAttribute('position', `${this.data.width / 2 - 0.1} ${this.data.height / 2 - 0.1} 0.015`);
    root.appendChild(closeX);

    // ── Particle decorations on corners ───────────────────
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sy]) => {
      const corner = document.createElement('a-sphere');
      corner.setAttribute('radius',   '0.03');
      corner.setAttribute('color',    '#4fc3f7');
      corner.setAttribute('position', `${sx * (this.data.width / 2 - 0.03)} ${sy * (this.data.height / 2 - 0.03)} 0.01`);
      corner.setAttribute('animation__pulse', {
        property: 'components.material.material.emissiveIntensity',
        from: 0.5, to: 2, dir: 'alternate', loop: true, dur: 1200
      });
      corner.setAttribute('material', 'emissive: #4fc3f7; emissiveIntensity: 1');
      root.appendChild(corner);
    });

    // Make panel always face camera
    root.setAttribute('look-at', '#player-camera');
  },

  // ── Show panel ────────────────────────────────────────────
  show(data = {}) {
    // Update content
    Object.keys(data).forEach(key => {
      const el = this.el.querySelector(`[data-field="${key}"]`);
      if (el) el.setAttribute('value', data[key]);
    });
    if (data.title) {
      const titleEl = this.el.querySelector('[data-role="title"]');
      if (titleEl) titleEl.setAttribute('value', data.title);
    }

    this.el.setAttribute('visible', true);
    this.el.setAttribute('animation__appear', {
      property: 'scale', from: '0.01 0.01 0.01', to: '1 1 1',
      dur: 400, easing: 'easeOutBack'
    });
    this._visible = true;

    // Auto-hide after 30s
    clearTimeout(this._autoHide);
    this._autoHide = setTimeout(() => this.hide(), 30000);
  },

  // ── Hide panel ────────────────────────────────────────────
  hide() {
    this.el.setAttribute('animation__disappear', {
      property: 'scale', to: '0.01 0.01 0.01',
      dur: 250, easing: 'easeInBack'
    });
    setTimeout(() => this.el.setAttribute('visible', false), 260);
    this._visible = false;
    clearTimeout(this._autoHide);
  },

  isVisible() { return this._visible; },

  remove() { clearTimeout(this._autoHide); }
});

// ── Convenience component for interactive objects ─────────────
AFRAME.registerComponent('historical-object', {
  schema: {
    title:    { type: 'string', default: 'Ancient Structure' },
    period:   { type: 'string', default: 'Unknown' },
    purpose:  { type: 'string', default: 'Unknown' },
    material: { type: 'string', default: 'Stone' },
    fact:     { type: 'string', default: '' }
  },

  init() {
    this.el.classList.add('interactive');
    this._originalColor = null;
    this._panel = null;

    this.el.addEventListener('raycaster-intersected', () => this._onHover(true));
    this.el.addEventListener('raycaster-intersected-cleared', () => this._onHover(false));
    this.el.addEventListener('click', () => this._onClick());

    this.el.sceneEl.addEventListener('loaded', () => {
      this._panel = document.querySelector('#global-info-panel');
    });
  },

  _onHover(isHovering) {
    const mat = this.el.getAttribute('material') || {};
    if (isHovering) {
      this._originalColor = mat.color;
      this.el.setAttribute('material', 'emissive: #4fc3f7; emissiveIntensity: 0.3');
      this.el.setAttribute('animation__hover', {
        property: 'scale', to: '1.03 1.03 1.03', dur: 200, easing: 'easeOutQuad'
      });
    } else {
      this.el.setAttribute('material', `emissive: #000000; emissiveIntensity: 0`);
      this.el.setAttribute('animation__hover', {
        property: 'scale', to: '1 1 1', dur: 200, easing: 'easeInQuad'
      });
    }
  },

  _onClick() {
    if (this._panel) {
      this._panel.components['info-panel'].show({ ...this.data });
    }
    window.ChronoScape?.audio?.play('ui-click');
  }
});
