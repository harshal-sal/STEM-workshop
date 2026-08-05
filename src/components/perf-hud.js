AFRAME.registerComponent('perf-hud', {
    schema: {
        enabled: { type: 'boolean', default: false }
    },
    init: function () {
        this.frameCounter = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        
        // Create HUD container
        this.hud = document.createElement('a-entity');
        // Attach to camera to make it a HUD
        this.hud.setAttribute('position', '0 0 -0.5'); // 50cm in front of eyes
        this.hud.setAttribute('visible', this.data.enabled);
        
        // Background panel
        this.panel = document.createElement('a-plane');
        this.panel.setAttribute('color', '#000');
        this.panel.setAttribute('opacity', '0.7');
        this.panel.setAttribute('width', '0.4');
        this.panel.setAttribute('height', '0.2');
        this.hud.appendChild(this.panel);
        
        // Text element
        this.text = document.createElement('a-text');
        this.text.setAttribute('value', 'Loading Stats...');
        this.text.setAttribute('align', 'left');
        this.text.setAttribute('position', '-0.18 0.08 0.01');
        this.text.setAttribute('scale', '0.15 0.15 0.15');
        this.text.setAttribute('color', '#0f0');
        this.hud.appendChild(this.text);
        
        // Listen for camera ready to attach HUD
        const attachHud = () => {
            const camera = this.el.sceneEl.camera.el;
            if (camera) {
                camera.appendChild(this.hud);
            }
        };
        
        if (this.el.sceneEl.camera) {
            attachHud();
        } else {
            this.el.sceneEl.addEventListener('camera-set-active', attachHud);
        }
        
        // Toggle on menu button
        this.el.sceneEl.addEventListener('menudown', () => {
            const isVisible = this.hud.getAttribute('visible');
            this.hud.setAttribute('visible', !isVisible);
        });
    },
    tick: function (time, timeDelta) {
        if (!this.hud.getAttribute('visible')) return;
        
        this.frameCounter++;
        if (time - this.lastTime >= 1000) {
            this.fps = this.frameCounter;
            this.frameCounter = 0;
            this.lastTime = time;
            
            const renderer = this.el.sceneEl.renderer;
            if (renderer) {
                const info = renderer.info;
                const calls = info.render.calls;
                const triangles = info.render.triangles;
                
                this.text.setAttribute('value', 
                    `FPS: ${this.fps}\n` +
                    `Draw Calls: ${calls} (target < 150)\n` +
                    `Triangles: ${(triangles/1000).toFixed(1)}k (target < 350k)`
                );
                
                // Color code FPS
                if (this.fps >= 72) {
                    this.text.setAttribute('color', '#0f0');
                } else if (this.fps >= 60) {
                    this.text.setAttribute('color', '#ff0');
                } else {
                    this.text.setAttribute('color', '#f00');
                }
            }
        }
    }
});
