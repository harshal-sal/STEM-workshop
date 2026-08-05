/**
 * Controller Input Layer for Meta Quest 3S (Touch Plus)
 * Emits semantic events based on raw button presses.
 */
AFRAME.registerComponent('controller-input', {
    schema: {
        hand: { type: 'string', default: 'right' }
    },

    init: function () {
        this.el.setAttribute('meta-touch-controls', `hand: ${this.data.hand}`);
        
        // Also add raycaster for laser interactions
        if (this.data.hand === 'right') {
            this.el.setAttribute('laser-controls', `hand: right`);
            this.el.setAttribute('raycaster', 'objects: .clickable, .hotspot; far: 20');
        }

        this.bindMethods();
        this.addEventListeners();
    },

    bindMethods: function () {
        this.onTriggerDown = this.onTriggerDown.bind(this);
        this.onTriggerUp = this.onTriggerUp.bind(this);
        this.onGripDown = this.onGripDown.bind(this);
        this.onGripUp = this.onGripUp.bind(this);
        this.onThumbstickMoved = this.onThumbstickMoved.bind(this);
        this.onAButtonDown = this.onAButtonDown.bind(this);
        this.onAButtonUp = this.onAButtonUp.bind(this);
        this.onBButtonDown = this.onBButtonDown.bind(this);
        this.onXButtonDown = this.onXButtonDown.bind(this);
        this.onYButtonDown = this.onYButtonDown.bind(this);
        this.onMenuDown = this.onMenuDown.bind(this);
    },

    addEventListeners: function () {
        this.el.addEventListener('triggerdown', this.onTriggerDown);
        this.el.addEventListener('triggerup', this.onTriggerUp);
        this.el.addEventListener('gripdown', this.onGripDown);
        this.el.addEventListener('gripup', this.onGripUp);
        this.el.addEventListener('thumbstickmoved', this.onThumbstickMoved);
        
        if (this.data.hand === 'right') {
            this.el.addEventListener('abuttondown', this.onAButtonDown);
            this.el.addEventListener('abuttonup', this.onAButtonUp);
            this.el.addEventListener('bbuttondown', this.onBButtonDown);
        } else {
            this.el.addEventListener('xbuttondown', this.onXButtonDown);
            this.el.addEventListener('ybuttondown', this.onYButtonDown);
            this.el.addEventListener('menudown', this.onMenuDown);
        }
    },

    onTriggerDown: function (evt) {
        this.el.sceneEl.emit('action-select', { hand: this.data.hand, rawEvent: evt });
    },
    
    onTriggerUp: function (evt) {
        this.el.sceneEl.emit('action-select-end', { hand: this.data.hand, rawEvent: evt });
    },

    onGripDown: function (evt) {
        this.el.sceneEl.emit('action-grab', { hand: this.data.hand, rawEvent: evt });
    },
    
    onGripUp: function (evt) {
        this.el.sceneEl.emit('action-grab-end', { hand: this.data.hand, rawEvent: evt });
    },

    onThumbstickMoved: function (evt) {
        const x = evt.detail.x;
        const y = evt.detail.y;
        // Debounce with deadzone 0.15
        if (Math.abs(x) < 0.15 && Math.abs(y) < 0.15) return;
        
        if (this.data.hand === 'right') {
            this.el.sceneEl.emit('action-scrub-time', { x: x, rawEvent: evt });
            this.el.sceneEl.emit('action-scale', { y: y, rawEvent: evt });
        } else {
            this.el.sceneEl.emit('action-locomote', { x: x, y: y, rawEvent: evt });
        }
    },

    onAButtonDown: function (evt) {
        this.el.sceneEl.emit('action-talk-start', { rawEvent: evt });
    },
    
    onAButtonUp: function (evt) {
        this.el.sceneEl.emit('action-talk-end', { rawEvent: evt });
    },

    onBButtonDown: function (evt) {
        this.el.sceneEl.emit('action-toggle-passthrough', { rawEvent: evt });
    },

    onXButtonDown: function (evt) {
        this.el.sceneEl.emit('action-toggle-hotspots', { rawEvent: evt });
    },

    onYButtonDown: function (evt) {
        this.el.sceneEl.emit('action-toggle-layers', { rawEvent: evt });
    },

    onMenuDown: function (evt) {
        // Semantic event for perf HUD or reset anchor
        this.el.sceneEl.emit('action-menu', { rawEvent: evt });
    }
});
