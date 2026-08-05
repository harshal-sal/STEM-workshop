/**
 * sketchfab-model.js
 * ============================================================
 * ChronoScape VR — Sketchfab & 3D Model Integration Helper
 * 
 * Supports loading 3D GLTF / GLB models downloaded from Sketchfab
 * or loaded from WebXR CDNs. Provides automatic bounding-box scaling,
 * shadow setup, material optimizations, and seamless time-reconstruction morphing.
 * ============================================================
 */

AFRAME.registerComponent('sketchfab-model', {
  schema: {
    src:            { type: 'string', default: '' },
    targetScale:    { type: 'number', default: 1.0 },   // Normalize model size in meters
    autoCenter:     { type: 'boolean', default: true }, // Center geometry pivot to ground
    castShadow:     { type: 'boolean', default: true },
    receiveShadow:  { type: 'boolean', default: true },
    interactive:    { type: 'boolean', default: true },
    roughness:      { type: 'number', default: -1 },    // -1 = preserve original textures
    metalness:      { type: 'number', default: -1 },
    title:          { type: 'string', default: 'Sketchfab Monument' },
    period:         { type: 'string', default: 'Ancient Era' },
    purpose:        { type: 'string', default: 'Architectural Heritage' },
    material:       { type: 'string', default: 'Carved Stone / Marble' },
    fact:           { type: 'string', default: '3D model imported from Sketchfab.' }
  },

  init() {
    this._modelLoaded = false;
    this.el.addEventListener('model-loaded', () => this._onModelLoaded());
    this.el.addEventListener('model-error', (e) => this._onModelError(e));

    if (this.data.src) {
      this.el.setAttribute('gltf-model', this.data.src);
    }

    if (this.data.interactive) {
      this.el.classList.add('interactive');
      this.el.setAttribute('historical-object', {
        title:    this.data.title,
        period:   this.data.period,
        purpose:  this.data.purpose,
        material: this.data.material,
        fact:     this.data.fact
      });
    }
  },

  update(oldData) {
    if (oldData.src !== this.data.src && this.data.src) {
      this.el.setAttribute('gltf-model', this.data.src);
    }
  },

  _onModelLoaded() {
    const mesh = this.el.getObject3D('mesh');
    if (!mesh) return;

    this._modelLoaded = true;

    // ── 1. Calculate Bounding Box & Auto-Center ──────────────
    const bbox = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    const maxDimension = Math.max(size.x, size.y, size.z);

    if (this.data.targetScale > 0 && maxDimension > 0) {
      const scaleFactor = this.data.targetScale / maxDimension;
      // Preserve relative node scale if explicitly set on entity
      const currentScale = this.el.getAttribute('scale') || { x: 1, y: 1, z: 1 };
      mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }

    if (this.data.autoCenter) {
      // Re-calculate bbox with scaled mesh
      bbox.setFromObject(mesh);
      const center = new THREE.Vector3();
      bbox.getCenter(center);
      // Align bottom of model to local Y = 0 ground plane
      mesh.position.y -= bbox.min.y;
    }

    // ── 2. Apply Shadows & Material Tweaks ──────────────────
    mesh.traverse((node) => {
      if (node.isMesh) {
        node.castShadow    = this.data.castShadow;
        node.receiveShadow = this.data.receiveShadow;

        if (node.material) {
          // Enable transparency handling if model has alpha
          node.material.transparent = node.material.transparent || node.material.opacity < 1.0;
          
          if (this.data.roughness >= 0) {
            node.material.roughness = this.data.roughness;
          }
          if (this.data.metalness >= 0) {
            node.material.metalness = this.data.metalness;
          }

          // Ensure proper VR lighting setup
          node.material.needsUpdate = true;
        }
      }
    });

    this.el.emit('sketchfab-model-ready', { mesh, bbox, size });
  },

  _onModelError(err) {
    console.warn(`[SketchfabModel] Failed to load model from ${this.data.src}:`, err);
    // Fallback: create visual placeholder prism if model fails to load
    this._createFallbackGeometry();
  },

  _createFallbackGeometry() {
    if (this.el.querySelector('.sketchfab-fallback')) return;

    const fallback = document.createElement('a-entity');
    fallback.className = 'sketchfab-fallback';

    const base = document.createElement('a-box');
    base.setAttribute('width',  '2.0');
    base.setAttribute('height', '3.0');
    base.setAttribute('depth',  '2.0');
    base.setAttribute('color',  '#8b7355');
    base.setAttribute('roughness', '0.9');
    fallback.appendChild(base);

    const label = document.createElement('a-text');
    label.setAttribute('value', `${this.data.title}\n[Sketchfab Model]`);
    label.setAttribute('align', 'center');
    label.setAttribute('color', '#d4a843');
    label.setAttribute('position', '0 1.8 0');
    label.setAttribute('width', '3.0');
    fallback.appendChild(label);

    this.el.appendChild(fallback);
  }
});
