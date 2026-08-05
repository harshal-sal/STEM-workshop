/**
 * npc-controller.js
 * ============================================================
 * ChronoScape VR — NPC Behaviour Controller
 * Drives idle, walk, talk, wave, and look-at-player
 * animations for all historical avatars.
 * ============================================================
 */

AFRAME.registerComponent('npc-controller', {
  schema: {
    type:          { type: 'string',  default: 'villager' },  // merchant|guard|priest|historian|architect|villager|child|animal
    walkRadius:    { type: 'number',  default: 4 },
    walkSpeed:     { type: 'number',  default: 0.6 },
    lookAtPlayer:  { type: 'boolean', default: true },
    talkChance:    { type: 'number',  default: 0.3 },
    waveChance:    { type: 'number',  default: 0.15 },
    idleDuration:  { type: 'number',  default: 3000 },
    active:        { type: 'boolean', default: false }
  },

  init() {
    this._state       = 'idle';
    this._origin      = { ...this.el.getAttribute('position') };
    this._target      = { ...this._origin };
    this._camera      = document.querySelector('#player-camera');
    this._stateTimer  = null;
    this._talkPanel   = null;
    this._bodyEl      = null;
    this._headEl      = null;
    this._animFrame   = null;

    // Dialogue lines keyed by NPC type
    this._dialogues = {
      merchant:    ['Fresh spices from the East!', 'Finest cloth in the city!', 'Trade brings prosperity, friend.'],
      guard:       ['Halt! State your business.', 'The temple district is sacred ground.', 'Move along, citizen.'],
      priest:      ['The gods watch over us.', 'Today we make offerings at dawn.', 'Peace be upon you, traveler.'],
      historian:   ['This city dates to 2000 BCE.', 'Observe the Doric columns — remarkable craftsmanship.', 'The agora was the heart of civic life.'],
      architect:   ['These walls will stand for millennia.', 'The proportions follow the golden ratio.', 'We quarried stone from the eastern hills.'],
      villager:    ['Fine day, isn\'t it?', 'The harvest was good this season.', 'Have you visited the market yet?'],
      child:       ['Can you catch me?', 'Look at the shiny stones!', '*runs and laughs*'],
      animal:      []  // animals use ambient sounds only
    };

    // Build NPC body from primitives
    this._buildBody();

    // Listen for activate event (triggered during reconstruction)
    this.el.addEventListener('activate', () => this._activate());
    this.el.addEventListener('npc-talk',  () => this._triggerTalk());
    this.el.addEventListener('npc-wave',  () => this._triggerWave());

    if (this.data.active) this._activate();
  },

  // ── Build avatar geometry ─────────────────────────────────
  _buildBody() {
    const type  = this.data.type;
    const color = this._getColor(type);

    // Torso
    const torso = document.createElement('a-box');
    torso.setAttribute('width',  '0.4');
    torso.setAttribute('height', '0.55');
    torso.setAttribute('depth',  '0.2');
    torso.setAttribute('position', '0 0.6 0');
    torso.setAttribute('color', color);
    torso.setAttribute('roughness', '0.9');
    this.el.appendChild(torso);
    this._bodyEl = torso;

    // Head
    const head = document.createElement('a-sphere');
    head.setAttribute('radius',   '0.18');
    head.setAttribute('position', '0 1.05 0');
    head.setAttribute('color',    '#d4a07a');
    head.setAttribute('roughness','0.8');
    this.el.appendChild(head);
    this._headEl = head;

    // Eyes
    [-0.07, 0.07].forEach(x => {
      const eye = document.createElement('a-sphere');
      eye.setAttribute('radius',   '0.035');
      eye.setAttribute('position', `${x} 1.07 0.17`);
      eye.setAttribute('color',    '#1a1a1a');
      this.el.appendChild(eye);
    });

    // Legs
    [-0.1, 0.1].forEach((x, i) => {
      const leg = document.createElement('a-box');
      leg.setAttribute('width',  '0.15');
      leg.setAttribute('height', '0.55');
      leg.setAttribute('depth',  '0.15');
      leg.setAttribute('position', `${x} 0.12 0`);
      leg.setAttribute('color', color);
      leg.setAttribute('roughness','0.9');
      leg.dataset.legIndex = i;
      this.el.appendChild(leg);
    });

    // Arms
    [-0.3, 0.3].forEach((x, i) => {
      const arm = document.createElement('a-box');
      arm.setAttribute('width',  '0.12');
      arm.setAttribute('height', '0.45');
      arm.setAttribute('depth',  '0.12');
      arm.setAttribute('position', `${x} 0.65 0`);
      arm.setAttribute('color', color);
      arm.setAttribute('roughness','0.9');
      arm.dataset.armIndex = i;
      this.el.appendChild(arm);
    });

    // Type-specific props
    this._addTypeProp(type);

    // Name tag
    const nameTag = document.createElement('a-text');
    nameTag.setAttribute('value', this._getTitle(type));
    nameTag.setAttribute('position', '0 1.5 0');
    nameTag.setAttribute('align',    'center');
    nameTag.setAttribute('color',    '#d4a843');
    nameTag.setAttribute('width',    '1.2');
    nameTag.setAttribute('font',     'https://cdn.aframe.io/fonts/Exo2Bold.fnt');
    this.el.appendChild(nameTag);
  },

  _getColor(type) {
    const colors = { merchant:'#8b4513', guard:'#4a5568', priest:'#f5f0e8', historian:'#6b5b3e', architect:'#5d7a8a', villager:'#7d6b4f', child:'#c4956a', animal:'#8b7355' };
    return colors[type] || '#7d6b4f';
  },

  _getTitle(type) {
    const titles = { merchant:'Merchant', guard:'City Guard', priest:'High Priest', historian:'Historian', architect:'Royal Architect', villager:'Citizen', child:'Child', animal:'' };
    return titles[type] || 'Citizen';
  },

  _addTypeProp(type) {
    if (type === 'guard') {
      const spear = document.createElement('a-cylinder');
      spear.setAttribute('radius', '0.025');
      spear.setAttribute('height', '1.8');
      spear.setAttribute('position', '0.35 0.9 0');
      spear.setAttribute('color', '#8b7355');
      this.el.appendChild(spear);
    } else if (type === 'priest') {
      const staff = document.createElement('a-cylinder');
      staff.setAttribute('radius', '0.02');
      staff.setAttribute('height', '1.5');
      staff.setAttribute('position', '-0.35 0.75 0');
      staff.setAttribute('color', '#d4a843');
      this.el.appendChild(staff);
    } else if (type === 'merchant') {
      const basket = document.createElement('a-cylinder');
      basket.setAttribute('radius', '0.15');
      basket.setAttribute('height', '0.2');
      basket.setAttribute('position', '0.4 0.35 0');
      basket.setAttribute('color', '#8b6914');
      this.el.appendChild(basket);
    }
  },

  // ── Activate NPC ──────────────────────────────────────────
  _activate() {
    this.data.active = true;
    this._scheduleNextBehaviour();
  },

  // ── State machine ─────────────────────────────────────────
  _scheduleNextBehaviour() {
    if (!this.data.active) return;

    const rand = Math.random();
    let nextDelay = this.data.idleDuration + Math.random() * 2000;

    if (rand < this.data.waveChance) {
      this._state = 'wave';
      this._triggerWave();
    } else if (rand < this.data.waveChance + this.data.talkChance) {
      this._state = 'talk';
      this._triggerTalk();
    } else if (this.data.type !== 'animal' && rand < 0.6) {
      this._state = 'walk';
      this._triggerWalk();
      nextDelay = 3000 + Math.random() * 3000;
    } else {
      this._state = 'idle';
      this._triggerIdle();
    }

    clearTimeout(this._stateTimer);
    this._stateTimer = setTimeout(() => this._scheduleNextBehaviour(), nextDelay);
  },

  // ── Idle ──────────────────────────────────────────────────
  _triggerIdle() {
    // Gentle breathing bob
    this._bodyEl?.setAttribute('animation__breathe', {
      property: 'position', dir: 'alternate', loop: true,
      from: '0 0.60 0', to: '0 0.63 0', dur: 2500, easing: 'easeInOutSine'
    });
  },

  // ── Walk to random point ──────────────────────────────────
  _triggerWalk() {
    const angle  = Math.random() * Math.PI * 2;
    const radius = Math.random() * this.data.walkRadius;
    const tx = this._origin.x + Math.cos(angle) * radius;
    const tz = this._origin.z + Math.sin(angle) * radius;
    const pos  = this.el.getAttribute('position');
    const dist = Math.sqrt((tx - pos.x) ** 2 + (tz - pos.z) ** 2);
    const dur  = (dist / this.data.walkSpeed) * 1000;

    // Rotate to face direction
    const angle2D = Math.atan2(tx - pos.x, tz - pos.z) * (180 / Math.PI);
    this.el.setAttribute('animation__rotate', {
      property: 'rotation', to: `0 ${angle2D} 0`, dur: 400, easing: 'easeInOutQuad'
    });

    // Translate
    this.el.setAttribute('animation__walk', {
      property: 'position',
      to: `${tx} ${pos.y} ${tz}`,
      dur, easing: 'linear'
    });

    // Leg swing
    Array.from(this.el.querySelectorAll('[data-leg-index]')).forEach((leg, i) => {
      leg.setAttribute('animation__swing', {
        property: 'rotation', dir: 'alternate', loop: true,
        from: `${i % 2 === 0 ? -25 : 25} 0 0`,
        to:   `${i % 2 === 0 ? 25 : -25} 0 0`,
        dur: 500, easing: 'easeInOutSine'
      });
    });

    setTimeout(() => {
      Array.from(this.el.querySelectorAll('[data-leg-index]')).forEach(leg => {
        leg.removeAttribute('animation__swing');
        leg.setAttribute('rotation', '0 0 0');
      });
    }, dur);
  },

  // ── Talk ─────────────────────────────────────────────────
  _triggerTalk() {
    const lines = this._dialogues[this.data.type] || [];
    if (!lines.length) return;

    const text = lines[Math.floor(Math.random() * lines.length)];
    this._showSpeechBubble(text);

    // Head nod while talking
    this._headEl?.setAttribute('animation__nod', {
      property: 'rotation', dir: 'alternate', loop: true,
      from: '-5 0 0', to: '5 0 0', dur: 400, easing: 'easeInOutSine'
    });

    setTimeout(() => {
      this._headEl?.removeAttribute('animation__nod');
      this._headEl?.setAttribute('rotation', '0 0 0');
      this._hideSpeechBubble();
    }, 4000);
  },

  // ── Wave ──────────────────────────────────────────────────
  _triggerWave() {
    const arm = this.el.querySelector('[data-arm-index="0"]');
    if (!arm) return;

    arm.setAttribute('animation__wave', {
      property: 'rotation', dir: 'alternate', loop: false,
      from: '-80 0 40', to: '-80 0 -10', dur: 300, repeat: 5, easing: 'easeInOutSine'
    });

    setTimeout(() => arm.setAttribute('rotation', '0 0 0'), 2500);
  },

  // ── Speech bubble ─────────────────────────────────────────
  _showSpeechBubble(text) {
    if (!this._speechEl) {
      const bubble = document.createElement('a-entity');
      bubble.setAttribute('position', '0 1.8 0');

      const bg = document.createElement('a-plane');
      bg.setAttribute('width',    '0.9');
      bg.setAttribute('height',   '0.35');
      bg.setAttribute('color',    '#0a0601');
      bg.setAttribute('opacity',  '0.85');
      bg.setAttribute('roughness','0.0');
      bubble.appendChild(bg);

      const txt = document.createElement('a-text');
      txt.setAttribute('value',    text);
      txt.setAttribute('align',    'center');
      txt.setAttribute('color',    '#d4a843');
      txt.setAttribute('width',    '0.85');
      txt.setAttribute('position', '0 0 0.01');
      txt.setAttribute('wrap-count', '18');
      bubble.appendChild(txt);

      bubble.setAttribute('look-at', '#player-camera');
      this.el.appendChild(bubble);
      this._speechEl = { bubble, txt };
    } else {
      this._speechEl.bubble.setAttribute('visible', true);
      this._speechEl.txt.setAttribute('value', text);
    }

    this._speechEl.bubble.setAttribute('animation__appear', {
      property: 'scale', from: '0 0 0', to: '1 1 1', dur: 300, easing: 'easeOutBack'
    });
  },

  _hideSpeechBubble() {
    if (this._speechEl) {
      this._speechEl.bubble.setAttribute('animation__hide', {
        property: 'scale', to: '0 0 0', dur: 200
      });
    }
  },

  // ── Look at player ────────────────────────────────────────
  tick() {
    if (!this.data.active || !this.data.lookAtPlayer || !this._camera) return;
    if (this._state === 'walk') return;

    // Only head follows player
    const camPos = this._camera.object3D.getWorldPosition(new THREE.Vector3());
    const headPos = new THREE.Vector3();
    if (this._headEl) {
      this._headEl.object3D.getWorldPosition(headPos);
      const dir = camPos.clone().sub(headPos);
      const angle = Math.atan2(dir.x, dir.z) * (180 / Math.PI);
      const tilt  = Math.atan2(-dir.y, Math.sqrt(dir.x**2+dir.z**2)) * (180/Math.PI);
      // Clamp look range
      const clampedAngle = Math.max(-60, Math.min(60, angle));
      const clampedTilt  = Math.max(-30, Math.min(20, tilt));
      this._headEl.setAttribute('rotation', `${clampedTilt} ${clampedAngle} 0`);
    }
  },

  remove() {
    clearTimeout(this._stateTimer);
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }
});
