/**
 * guide-controller.js
 * ============================================================
 * ChronoScape VR — AI Historical Guide
 * The guide spawns, greets the player, and answers questions.
 * Uses placeholder AI dialogue with keyword matching.
 * ============================================================
 */

AFRAME.registerComponent('guide-controller', {
  schema: {
    name:          { type: 'string',  default: 'Archilochus' },
    greetDelay:    { type: 'number',  default: 3000 },
    followPlayer:  { type: 'boolean', default: false },
    followDistance:{ type: 'number',  default: 3.0 }
  },

  init() {
    this._camera       = null;
    this._dialogQueue  = [];
    this._isTalking    = false;
    this._greetDone    = false;
    this._dialogEl     = null;
    this._inputActive  = false;

    // Knowledge base — keyword → answer mapping
    this._knowledge = {
      building:  'This structure is the Temple of the Civic Gods, dedicated to Athena and Apollo. It served as the spiritual centre of the city.',
      purpose:   'This building housed the sacred flame that was never allowed to extinguish — a symbol of the city\'s eternal covenant with the divine.',
      lived:     'Citizens, merchants, priests, and scholars called this city home. At its peak, over 40,000 people lived within these walls.',
      built:     'The foundation stones were laid around 2,100 BCE by King Archeron II. Construction took over 40 years using techniques still admired today.',
      happened:  'A great earthquake in 500 BCE caused significant damage. Subsequent invasions left the city abandoned. The ruins you see today are all that remains.',
      column:    'These are Doric columns — the oldest of the three Greek orders. Their fluting removes visual weight while strengthening the stone.',
      temple:    'The temple faces east so the rising sun illuminates the inner sanctum at dawn — a deliberate architectural and spiritual choice.',
      road:      'This is the Sacred Way — the processional route used for religious festivals. Pilgrims travelled weeks to walk this path.',
      market:    'The agora — the marketplace — was the beating heart of civic life. Commerce, politics, philosophy, and gossip all happened here.',
      water:     'The aqueduct system delivered fresh mountain water to public fountains throughout the city. A remarkable feat of engineering.',
      default:   'That is a profound question. The ancient world holds many secrets. Explore and you may find your own answers among the stones.'
    };

    this.el.sceneEl.addEventListener('loaded', () => {
      this._camera = document.querySelector('#player-camera');
      this._buildGuide();
      setTimeout(() => this._greet(), this.data.greetDelay);
    });

    // Listen for player questions via event
    this.el.sceneEl.addEventListener('player-question', (e) => {
      if (e.detail && e.detail.text) this._answer(e.detail.text);
    });
  },

  // ── Build guide avatar ────────────────────────────────────
  _buildGuide() {
    const el = this.el;

    // Robe (body)
    const robe = document.createElement('a-cylinder');
    robe.setAttribute('radius', '0.22');
    robe.setAttribute('height', '1.1');
    robe.setAttribute('position', '0 0.55 0');
    robe.setAttribute('color',  '#e8dcc8');
    robe.setAttribute('roughness', '0.95');
    el.appendChild(robe);

    // Tunic accent
    const tunic = document.createElement('a-cylinder');
    tunic.setAttribute('radius', '0.225');
    tunic.setAttribute('height', '0.15');
    tunic.setAttribute('position', '0 1.05 0');
    tunic.setAttribute('color',   '#b8860b');
    tunic.setAttribute('roughness','0.9');
    el.appendChild(tunic);

    // Head
    const head = document.createElement('a-sphere');
    head.setAttribute('radius',   '0.2');
    head.setAttribute('position', '0 1.3 0');
    head.setAttribute('color',    '#c4956a');
    head.setAttribute('roughness','0.8');
    el.appendChild(head);
    this._headEl = head;

    // Eyes
    [-0.08, 0.08].forEach(x => {
      const eye = document.createElement('a-sphere');
      eye.setAttribute('radius',   '0.03');
      eye.setAttribute('position', `${x} 1.32 0.18`);
      eye.setAttribute('color',    '#2c1810');
      el.appendChild(eye);
    });

    // Beard
    const beard = document.createElement('a-cone');
    beard.setAttribute('radius-bottom', '0.1');
    beard.setAttribute('radius-top',    '0.02');
    beard.setAttribute('height',        '0.2');
    beard.setAttribute('position',      '0 1.16 0.12');
    beard.setAttribute('rotation',      '-20 0 0');
    beard.setAttribute('color',         '#8b7355');
    el.appendChild(beard);

    // Laurel crown
    const crown = document.createElement('a-torus');
    crown.setAttribute('radius',      '0.22');
    crown.setAttribute('radius-tubular','0.02');
    crown.setAttribute('position',    '0 1.47 0');
    crown.setAttribute('color',       '#4a7c59');
    el.appendChild(crown);

    // Scroll prop
    const scroll = document.createElement('a-cylinder');
    scroll.setAttribute('radius', '0.03');
    scroll.setAttribute('height', '0.35');
    scroll.setAttribute('position', '0.35 0.8 0.1');
    scroll.setAttribute('rotation', '-30 0 15');
    scroll.setAttribute('color',   '#d4a843');
    el.appendChild(scroll);

    // Glow aura
    const aura = document.createElement('a-sphere');
    aura.setAttribute('radius',  '0.55');
    aura.setAttribute('position','0 0.8 0');
    aura.setAttribute('color',   '#d4a843');
    aura.setAttribute('opacity', '0.04');
    aura.setAttribute('side',    'back');
    aura.setAttribute('animation__pulse', {
      property: 'components.material.material.opacity',
      from: 0.02, to: 0.08, dir: 'alternate', loop: true, dur: 2000
    });
    el.appendChild(aura);

    // Name plate
    const nameTag = document.createElement('a-text');
    nameTag.setAttribute('value', `${this.data.name}\n✦ Historical Guide ✦`);
    nameTag.setAttribute('position', '0 1.85 0');
    nameTag.setAttribute('align',    'center');
    nameTag.setAttribute('color',    '#d4a843');
    nameTag.setAttribute('width',    '1.4');
    el.appendChild(nameTag);

    // Dialogue bubble entity
    this._dialogEl = document.createElement('a-entity');
    this._dialogEl.setAttribute('position', '0 2.1 0');
    this._dialogEl.setAttribute('visible',  false);
    this._buildDialogueBubble();
    el.appendChild(this._dialogEl);

    // Idle float animation
    el.setAttribute('animation__float', {
      property: 'position', dir: 'alternate', loop: true,
      from: `${el.getAttribute('position')?.x || 0} ${(el.getAttribute('position')?.y || 0)} ${el.getAttribute('position')?.z || 0}`,
      to:   `${el.getAttribute('position')?.x || 0} ${(el.getAttribute('position')?.y || 0) + 0.1} ${el.getAttribute('position')?.z || 0}`,
      dur: 3000, easing: 'easeInOutSine'
    });
  },

  // ── Build speech bubble ───────────────────────────────────
  _buildDialogueBubble() {
    const bg = document.createElement('a-plane');
    bg.setAttribute('width',   '1.6');
    bg.setAttribute('height',  '0.55');
    bg.setAttribute('color',   '#050a15');
    bg.setAttribute('opacity', '0.92');
    bg.setAttribute('shader',  'flat');
    this._dialogEl.appendChild(bg);

    const border = document.createElement('a-plane');
    border.setAttribute('width',   '1.64');
    border.setAttribute('height',  '0.59');
    border.setAttribute('color',   '#d4a843');
    border.setAttribute('opacity', '0.25');
    border.setAttribute('position','0 0 -0.002');
    border.setAttribute('shader',  'flat');
    this._dialogEl.appendChild(border);

    const speaker = document.createElement('a-text');
    speaker.setAttribute('value',  this.data.name);
    speaker.setAttribute('position','-0.72 0.17 0.01');
    speaker.setAttribute('align',  'left');
    speaker.setAttribute('color',  '#d4a843');
    speaker.setAttribute('width',  '0.8');
    this._dialogEl.appendChild(speaker);

    this._dialogText = document.createElement('a-text');
    this._dialogText.setAttribute('value',    '');
    this._dialogText.setAttribute('position', '-0.72 -0.02 0.01');
    this._dialogText.setAttribute('align',    'left');
    this._dialogText.setAttribute('color',    '#e8dcc8');
    this._dialogText.setAttribute('width',    '1.55');
    this._dialogText.setAttribute('wrap-count','38');
    this._dialogEl.appendChild(this._dialogText);

    this._dialogEl.setAttribute('look-at', '#player-camera');
  },

  // ── Greeting sequence ─────────────────────────────────────
  _greet() {
    if (this._greetDone) return;
    this._greetDone = true;

    const greetings = [
      `Welcome, traveler. I am ${this.data.name}, keeper of histories.`,
      `You stand in the city as it existed over two thousand years ago.`,
      `Press your right trigger to witness the reconstruction of this great civilization.`,
      `Point your controller at any object and press trigger to learn its story.`
    ];

    this._speakSequence(greetings, 4500);
  },

  // ── Speak a sequence of lines ─────────────────────────────
  _speakSequence(lines, interval = 4000) {
    lines.forEach((line, i) => {
      setTimeout(() => this._say(line, i === lines.length - 1), i * interval);
    });
  },

  // ── Say one line ──────────────────────────────────────────
  _say(text, isLast = false) {
    this._dialogText.setAttribute('value', text);
    this._dialogEl.setAttribute('visible', true);
    this._dialogEl.setAttribute('animation__appear', {
      property: 'scale', from: '0 0 0', to: '1 1 1',
      dur: 300, easing: 'easeOutBack'
    });
    this._isTalking = true;

    // Typewriter effect via repeated updates
    this._typewriter(text);

    // Head bob while talking
    this._headEl?.setAttribute('animation__talk', {
      property: 'rotation', dir: 'alternate', loop: true,
      from: '-5 0 0', to: '5 0 0', dur: 350, easing: 'easeInOutSine'
    });

    if (isLast) {
      setTimeout(() => {
        this._dialogEl.setAttribute('animation__hide', {
          property: 'scale', to: '0 0 0', dur: 250
        });
        setTimeout(() => this._dialogEl.setAttribute('visible', false), 260);
        this._headEl?.removeAttribute('animation__talk');
        this._isTalking = false;
      }, 6000);
    }
  },

  // ── Typewriter effect ─────────────────────────────────────
  _typewriter(fullText) {
    let i = 0;
    clearInterval(this._typeInterval);
    this._dialogText.setAttribute('value', '');
    this._typeInterval = setInterval(() => {
      i += 2;
      this._dialogText.setAttribute('value', fullText.substring(0, i));
      if (i >= fullText.length) clearInterval(this._typeInterval);
    }, 28);
  },

  // ── Answer a player question ──────────────────────────────
  _answer(question) {
    const q = question.toLowerCase();
    let answer = this._knowledge.default;

    for (const [keyword, response] of Object.entries(this._knowledge)) {
      if (keyword !== 'default' && q.includes(keyword)) {
        answer = response;
        break;
      }
    }

    this._say(answer);
  },

  // ── Face player each frame ────────────────────────────────
  tick() {
    if (!this._camera) return;
    const camPos  = new THREE.Vector3();
    this._camera.object3D.getWorldPosition(camPos);
    const myPos   = new THREE.Vector3();
    this.el.object3D.getWorldPosition(myPos);
    const dir     = camPos.clone().sub(myPos);
    const angle   = Math.atan2(dir.x, dir.z) * (180 / Math.PI);
    this.el.object3D.rotation.y = THREE.MathUtils.degToRad(angle);
  },

  remove() {
    clearInterval(this._typeInterval);
  }
});
