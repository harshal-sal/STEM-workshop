/**
 * Hand Input Layer for Meta Quest 3S (Hand Tracking)
 * Emits semantic events based on hand gestures (pinch).
 */
AFRAME.registerComponent('hand-input', {
    schema: {
        hand: { type: 'string', default: 'right' }
    },

    init: function () {
        this.el.setAttribute('hand-tracking-controls', `hand: ${this.data.hand}`);
        
        this.bindMethods();
        this.addEventListeners();
    },

    bindMethods: function () {
        this.onPinchStarted = this.onPinchStarted.bind(this);
        this.onPinchEnded = this.onPinchEnded.bind(this);
    },

    addEventListeners: function () {
        this.el.addEventListener('pinchstarted', this.onPinchStarted);
        this.el.addEventListener('pinchended', this.onPinchEnded);
    },

    onPinchStarted: function (evt) {
        // Mirrors trigger down
        this.el.sceneEl.emit('action-select', { hand: this.data.hand, rawEvent: evt });
    },
    
    onPinchEnded: function (evt) {
        // Mirrors trigger up
        this.el.sceneEl.emit('action-select-end', { hand: this.data.hand, rawEvent: evt });
    }
});
