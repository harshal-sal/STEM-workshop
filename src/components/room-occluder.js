/**
 * Room Occluder Component
 * Converts detected room mesh/geometry into invisible depth-write occluders for AR.
 */
AFRAME.registerComponent('room-occluder', {
    init: function () {
        this.el.addEventListener('model-loaded', () => {
            this.applyOcclusionMaterial();
        });

        // If applied to a primitive or loaded entity
        this.applyOcclusionMaterial();
    },

    applyOcclusionMaterial: function () {
        const mesh = this.el.getObject3D('mesh');
        if (!mesh) return;

        mesh.traverse((node) => {
            if (node.isMesh) {
                node.material.colorWrite = false;
                node.material.depthWrite = true;
                node.renderOrder = -1;
            }
        });
    }
});
