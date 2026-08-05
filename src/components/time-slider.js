/**
 * Upgraded Time Slider Component
 * Smoothly crossfades between the 1594 historical reconstruction texture and modern red laterite ruin facade.
 */
AFRAME.registerComponent('time-slider', {
    schema: {
        fromYear: { type: 'int', default: 1594 },
        toYear: { type: 'int', default: 2025 }
    },

    init: function () {
        this.t = 0.5; // Start mid-way
        this.currentYear = Math.round((this.data.fromYear + this.data.toYear) / 2);

        // Reference 3D model / facade entities
        this.ruinEl = this.el.querySelector('#ruin-model');
        this.reconstructedEl = this.el.querySelector('#reconstructed-model');
        this.yearText = this.el.querySelector('#year-text');

        // Apply initial state
        this.setT(this.t);

        // Listen for semantic thumbstick events
        this.el.sceneEl.addEventListener('action-scrub-time', (evt) => {
            const delta = evt.detail.x * 0.025;
            this.setT(Math.min(Math.max(this.t + delta, 0), 1));
        });

        // Listen for UI slider change events from HTML overlay
        window.addEventListener('ui-time-change', (evt) => {
            const normalized = evt.detail.value; // 0 to 1
            this.setT(normalized);
        });
    },

    setT: function (newT) {
        this.t = newT;
        const totalSpan = this.data.toYear - this.data.fromYear;
        this.currentYear = Math.round(this.data.fromYear + this.t * totalSpan);
        
        // Update 3D Year Display Text
        if (this.yearText) {
            let label = `Year: ${this.currentYear}`;
            if (this.currentYear < 1610) label += " (Golden Age - Construction)";
            else if (this.currentYear < 1950) label += " (Colonial Era)";
            else label += " (Modern UNESCO Site)";
            this.yearText.setAttribute('value', label);
        }

        // Crossfade opacities
        this.setOpacity(this.ruinEl, this.t);
        this.setOpacity(this.reconstructedEl, 1 - this.t);

        // Dispatch sync event for HTML UI slider
        window.dispatchEvent(new CustomEvent('app-time-synced', {
            detail: { t: this.t, year: this.currentYear }
        }));
    },

    setOpacity: function (el, opacity) {
        if (!el) return;
        el.setAttribute('material', `opacity: ${opacity}; transparent: true`);
        const children = el.querySelectorAll('*');
        children.forEach(child => {
            if (child.hasAttribute('material')) {
                const currentMat = child.getAttribute('material') || '';
                child.setAttribute('material', `${currentMat}; opacity: ${opacity}; transparent: true`);
            }
        });
    }
});
