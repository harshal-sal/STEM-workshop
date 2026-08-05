/**
 * Site Anchor Component
 * Handles WebXR hit-testing for reticle placement and anchor persistence in localStorage.
 */
AFRAME.registerComponent('site-anchor', {
    schema: {
        persistentKey: { type: 'string', default: 'chronoscope_site_anchor' }
    },

    init: function () {
        this.reticle = document.createElement('a-ring');
        this.reticle.setAttribute('color', '#00FFCC');
        this.reticle.setAttribute('radius-inner', '0.15');
        this.reticle.setAttribute('radius-outer', '0.2');
        this.reticle.setAttribute('rotation', '-90 0 0');
        this.reticle.setAttribute('visible', 'false');
        this.el.sceneEl.appendChild(this.reticle);

        this.placed = false;
        this.hitTestTargetPose = null;

        // Restore saved position if available
        this.restoreAnchor();

        // Listen for semantic events from input layer
        this.el.sceneEl.addEventListener('action-select', this.onSelect.bind(this));

        // Setup WebXR Hit Test when AR session starts
        this.el.sceneEl.addEventListener('enter-vr', () => {
            if (this.el.sceneEl.is('ar-mode')) {
                this.setupHitTest();
            }
        });
    },

    restoreAnchor: function () {
        const saved = localStorage.getItem(this.data.persistentKey);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.el.object3D.position.fromArray(data.position);
                this.el.object3D.rotation.fromArray(data.rotation);
                this.placed = true;
                console.log("Restored anchor position from localStorage:", data);
            } catch (e) {
                console.warn("Could not restore anchor:", e);
            }
        }
    },

    saveAnchor: function () {
        const pos = this.el.object3D.position.toArray();
        const rot = [
            this.el.object3D.rotation.x,
            this.el.object3D.rotation.y,
            this.el.object3D.rotation.z
        ];
        localStorage.setItem(this.data.persistentKey, JSON.stringify({ position: pos, rotation: rot }));
        console.log("Saved anchor position to localStorage.");
    },

    setupHitTest: function () {
        const sceneEl = this.el.sceneEl;
        const session = sceneEl.xrSession;
        if (!session) return;

        session.requestReferenceSpace('viewer').then((viewerSpace) => {
            session.requestHitTestSource({ space: viewerSpace }).then((source) => {
                this.hitTestSource = source;
            });
        });

        session.requestReferenceSpace('local-floor').then((refSpace) => {
            this.localFloorSpace = refSpace;
        });
    },

    tick: function (time, frame) {
        if (!frame || !this.hitTestSource || !this.localFloorSpace || this.placed) return;

        const hitTestResults = frame.getHitTestResults(this.hitTestSource);
        if (hitTestResults.length > 0) {
            const pose = hitTestResults[0].getPose(this.localFloorSpace);
            this.hitTestTargetPose = pose;
            this.reticle.setAttribute('visible', 'true');
            this.reticle.object3D.position.copy(pose.transform.position);
        } else {
            this.reticle.setAttribute('visible', 'false');
        }
    },

    onSelect: function () {
        if (!this.placed && this.hitTestTargetPose) {
            // Place site at reticle position
            this.el.object3D.position.copy(this.hitTestTargetPose.transform.position);
            this.placed = true;
            this.reticle.setAttribute('visible', 'false');
            this.saveAnchor();
            
            // Trigger haptic feedback if right controller is available
            const rightController = document.getElementById('right-controller');
            if (rightController && rightController.components['meta-touch-controls']) {
                const gamepad = rightController.components['meta-touch-controls'].controller;
                if (gamepad && gamepad.hapticActuators && gamepad.hapticActuators[0]) {
                    gamepad.hapticActuators[0].pulse(0.8, 100);
                }
            }
        }
    }
});
