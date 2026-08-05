/**
 * main.js
 * ============================================================
 * ChronoScape VR — Application Bootstrap & Global Controller
 * Manages loading, era switching, notifications, and
 * the desktop 2D overlay UI.
 * ============================================================
 */

/* ──────────────────────────────────────────────────────────────
   Global ChronoScape namespace
────────────────────────────────────────────────────────────── */
window.ChronoScape = window.ChronoScape || {};

(function (CS) {
  'use strict';

  // ── State ─────────────────────────────────────────────────
  CS.state = {
    era:           'ruins',
    reconstructed: false,
    loading:       true,
    inVR:          false
  };

  CS.audio   = null;   // set by audio-manager component
  CS.guide   = null;   // set by guide-controller component

  // ── Era definitions ───────────────────────────────────────
  CS.eras = [
    { id: 'ruins',    label: 'Present — Ruins',       year: '2026 CE' },
    { id: '500',      label: '500 Years Ago',          year: '~1526 CE' },
    { id: '1000',     label: '1000 Years Ago',         year: '~1026 CE' },
    { id: 'original', label: 'Original Construction', year: '~2100 BCE' }
  ];

  // ── Loading sequence ──────────────────────────────────────
  CS.startLoading = function () {
    const bar    = document.querySelector('.loading-bar-fill');
    const status = document.querySelector('.loading-status');
    const screen = document.getElementById('loading-screen');

    const steps = [
      { pct: 10,  msg: 'Initialising WebXR context…' },
      { pct: 25,  msg: 'Loading A-Frame scene…' },
      { pct: 40,  msg: 'Building ancient architecture…' },
      { pct: 55,  msg: 'Spawning historical avatars…' },
      { pct: 70,  msg: 'Placing artefacts…' },
      { pct: 82,  msg: 'Configuring spatial audio…' },
      { pct: 92,  msg: 'Preparing time layers…' },
      { pct: 100, msg: 'Ready to travel through time…' }
    ];

    let i = 0;
    const advance = () => {
      if (i >= steps.length) {
        setTimeout(() => {
          screen.classList.add('hidden');
          CS.state.loading = false;
          CS.showIntroSplash();
        }, 600);
        return;
      }
      const step = steps[i++];
      if (bar)    bar.style.width = step.pct + '%';
      if (status) status.textContent = step.msg;
      setTimeout(advance, 450 + Math.random() * 300);
    };

    setTimeout(advance, 400);
  };

  // ── Intro splash ──────────────────────────────────────────
  CS.showIntroSplash = function () {
    const splash = document.getElementById('intro-splash');
    if (splash) splash.classList.remove('hidden');
  };

  CS.hideIntroSplash = function () {
    const splash = document.getElementById('intro-splash');
    if (splash) splash.classList.add('hidden');

    const hud   = document.getElementById('hud-overlay');
    const eras  = document.getElementById('era-switcher');
    if (hud)  hud.style.display  = 'block';
    if (eras) eras.style.display = 'flex';
  };

  // ── Era switching ─────────────────────────────────────────
  CS.setEra = function (eraId) {
    CS.state.era = eraId;

    // Update HUD badge
    const badge = document.querySelector('.hud-era-badge');
    const era   = CS.eras.find(e => e.id === eraId);
    if (badge && era) badge.textContent = era.year;

    // Update era buttons
    document.querySelectorAll('.era-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.era === eraId);
    });

    // Dispatch to A-Frame scene
    const scene = document.querySelector('a-scene');
    if (scene) {
      scene.emit('switch-era', { era: eraId });
    }
  };

  // ── Notification system ───────────────────────────────────
  let _notifyTimer = null;
  CS.notify = function (message, duration = 3500) {
    const toast = document.getElementById('notification-toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(_notifyTimer);
    _notifyTimer = setTimeout(() => toast.classList.remove('show'), duration);
  };

  // ── Build era switcher UI ─────────────────────────────────
  CS.buildEraUI = function () {
    const container = document.getElementById('era-switcher');
    if (!container) return;

    CS.eras.forEach(era => {
      const btn = document.createElement('button');
      btn.className    = 'era-btn' + (era.id === 'ruins' ? ' active' : '');
      btn.dataset.era  = era.id;
      btn.textContent  = era.label;
      btn.addEventListener('click', () => CS.setEra(era.id));
      container.appendChild(btn);
    });
  };

  // ── VR session callbacks ──────────────────────────────────
  CS.onVREnter = function () {
    CS.state.inVR = true;
    document.getElementById('hud-overlay').style.display  = 'none';
    document.getElementById('era-switcher').style.display = 'none';
    CS.notify('VR Mode active — use controllers to explore');
  };

  CS.onVRExit = function () {
    CS.state.inVR = false;
    document.getElementById('hud-overlay').style.display  = 'block';
    document.getElementById('era-switcher').style.display = 'flex';
  };

  // ── Cinematic aerial overview ─────────────────────────────
  CS.startCinematicAerial = function () {
    const rig = document.querySelector('#player-rig');
    if (!rig) return;

    CS.notify('🎬 Cinematic overview starting…');

    const waypoints = [
      { x: 0,   y: 18, z: 0   },
      { x: -12, y: 20, z: 8   },
      { x: 12,  y: 22, z: -8  },
      { x: 0,   y: 15, z: 15  },
      { x: 0,   y: 10, z: 0   }
    ];

    let i = 0;
    const fly = () => {
      if (i >= waypoints.length) {
        CS.notify('✅ Tour complete');
        return;
      }
      const wp = waypoints[i++];
      rig.setAttribute('animation__cinematic', {
        property: 'position',
        to: `${wp.x} ${wp.y} ${wp.z}`,
        dur: 4000,
        easing: 'easeInOutCubic'
      });
      setTimeout(fly, 4200);
    };

    fly();
  };

  // ── DOM ready ─────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    CS.buildEraUI();
    CS.startLoading();

    // Enter button
    const enterBtn = document.getElementById('btn-enter');
    if (enterBtn) enterBtn.addEventListener('click', CS.hideIntroSplash);

    // Aerial tour button
    const aerialBtn = document.getElementById('btn-aerial');
    if (aerialBtn) aerialBtn.addEventListener('click', CS.startCinematicAerial);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === '1') CS.setEra('ruins');
      if (e.key === '2') CS.setEra('500');
      if (e.key === '3') CS.setEra('1000');
      if (e.key === '4') CS.setEra('original');
      if (e.key === 'c') CS.startCinematicAerial();
    });

    // A-Frame VR events
    const scene = document.querySelector('a-scene');
    if (scene) {
      scene.addEventListener('enter-vr', CS.onVREnter);
      scene.addEventListener('exit-vr',  CS.onVRExit);

      scene.addEventListener('reconstruction-complete', (e) => {
        CS.state.reconstructed = (e.detail.direction !== 'decay');
      });
    }
  });

})(window.ChronoScape);

/* ──────────────────────────────────────────────────────────────
   A-Frame animation-manager component
   (lightweight helper for queuing animation chains)
────────────────────────────────────────────────────────────── */
AFRAME.registerComponent('animation-manager', {
  init() {
    // Expose animation queue on scene
    this.el.sceneEl.animQueue = this;
    this._queue = [];
    this._running = false;
  },

  enqueue(fn, delay = 0) {
    this._queue.push({ fn, delay });
    if (!this._running) this._processNext();
  },

  _processNext() {
    if (this._queue.length === 0) { this._running = false; return; }
    this._running = true;
    const { fn, delay } = this._queue.shift();
    setTimeout(() => {
      fn();
      this._processNext();
    }, delay);
  }
});

/* ──────────────────────────────────────────────────────────────
   Dialog System Component (in-scene text UI)
────────────────────────────────────────────────────────────── */
AFRAME.registerComponent('dialog-system', {
  schema: {
    active: { type: 'boolean', default: false }
  },

  init() {
    this._questions = [
      'What was this building?',
      'Who lived here?',
      'When was this city built?',
      'What happened to it?',
      'Tell me about the columns.',
      'What is the Sacred Way?'
    ];

    this._buildUI();

    this.el.sceneEl.addEventListener('loaded', () => {
      this._guide = document.querySelector('[guide-controller]');
    });
  },

  _buildUI() {
    const root = this.el;
    root.setAttribute('position', '-1.2 1.4 -2.5');
    root.setAttribute('rotation', '0 20 0');

    // Panel background
    const bg = document.createElement('a-plane');
    bg.setAttribute('width',  '1.1');
    bg.setAttribute('height', '1.5');
    bg.setAttribute('color',  '#050a15');
    bg.setAttribute('opacity','0.88');
    bg.setAttribute('shader', 'flat');
    root.appendChild(bg);

    const title = document.createElement('a-text');
    title.setAttribute('value',    'Ask the Guide');
    title.setAttribute('position', '-0.45 0.62 0.01');
    title.setAttribute('color',    '#d4a843');
    title.setAttribute('width',    '1.1');
    root.appendChild(title);

    // Question buttons
    this._questions.forEach((q, i) => {
      const btn = document.createElement('a-plane');
      btn.setAttribute('width',   '0.95');
      btn.setAttribute('height',  '0.16');
      btn.setAttribute('color',   '#0d1a2e');
      btn.setAttribute('opacity', '0.9');
      btn.setAttribute('position',`0 ${0.44 - i * 0.2} 0.01`);
      btn.setAttribute('class',   'interactive');

      const txt = document.createElement('a-text');
      txt.setAttribute('value',    q);
      txt.setAttribute('align',    'left');
      txt.setAttribute('position', '-0.43 0 0.005');
      txt.setAttribute('color',    '#e8dcc8');
      txt.setAttribute('width',    '0.95');
      txt.setAttribute('wrap-count','28');
      btn.appendChild(txt);

      btn.addEventListener('click', () => {
        this.el.sceneEl.emit('player-question', { text: q });
        window.ChronoScape?.audio?.play('ui-click');
        btn.setAttribute('animation__press', {
          property: 'scale', from:'1.02 1.02 1', to:'1 1 1', dur: 150
        });
      });

      btn.addEventListener('raycaster-intersected', () => {
        btn.setAttribute('color', '#1a3050');
      });
      btn.addEventListener('raycaster-intersected-cleared', () => {
        btn.setAttribute('color', '#0d1a2e');
      });

      root.appendChild(btn);
    });
  }
});
