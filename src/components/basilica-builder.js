/**
 * Volumetric 3D Basilica Builder Component with Realistic Image Textures
 * Maps generated high-res realistic textures onto the 3D architectural geometry.
 */
AFRAME.registerComponent('basilica-builder', {
    schema: {
        type: { type: 'string', default: 'reconstructed' } // 'reconstructed' or 'ruin'
    },

    init: function () {
        const group = new THREE.Group();
        const isRuin = this.data.type === 'ruin';

        // Load generated realistic texture maps
        const textureLoader = new THREE.TextureLoader();
        const texturePath = isRuin ? './assets/images/basilica_ruin.jpg' : './assets/images/basilica_reconstructed.jpg';
        const facadeTexture = textureLoader.load(texturePath);
        facadeTexture.colorSpace = THREE.SRGBColorSpace;

        // Base materials with texture mapping
        const mainMat = new THREE.MeshStandardMaterial({
            map: facadeTexture,
            roughness: isRuin ? 0.85 : 0.45,
            metalness: isRuin ? 0.05 : 0.15
        });

        const stoneMat = new THREE.MeshStandardMaterial({
            color: isRuin ? 0x8b3a2b : 0xd4af37,
            roughness: 0.7
        });

        const trimMat = new THREE.MeshStandardMaterial({
            color: isRuin ? 0x5a2318 : 0xc59b27,
            roughness: 0.5
        });

        const darkDoorMat = new THREE.MeshStandardMaterial({
            color: 0x1f140e,
            roughness: 0.9
        });

        // 1. Main Central Nave Structure (3D Volume)
        const naveGeo = new THREE.BoxGeometry(2.6, 2.0, 2.4);
        const nave = new THREE.Mesh(naveGeo, mainMat);
        nave.position.set(0, 1.0, 0);
        nave.castShadow = true;
        nave.receiveShadow = true;
        group.add(nave);

        // 2. High-Detail Front Facade Wall with Textured Map
        const facadeWallGeo = new THREE.PlaneGeometry(2.6, 2.0);
        const facadeWall = new THREE.Mesh(facadeWallGeo, mainMat);
        facadeWall.position.set(0, 1.0, 1.21);
        group.add(facadeWall);

        // 3. Three-Tier Facade Pillars & Columns (Volumetric)
        const numColumns = 6;
        const spacing = 0.44;
        const startX = -((numColumns - 1) * spacing) / 2;

        for (let tier = 0; tier < 3; tier++) {
            const tierY = 0.35 + tier * 0.6;
            const tierHeight = 0.55;

            // Horizontal Cornice Layer
            const corniceGeo = new THREE.BoxGeometry(2.7, 0.07, 0.25);
            const cornice = new THREE.Mesh(corniceGeo, trimMat);
            cornice.position.set(0, tierY + tierHeight / 2 + 0.03, 1.25);
            group.add(cornice);

            // Columns across the facade
            for (let i = 0; i < numColumns; i++) {
                if (isRuin && tier === 2 && (i === 1 || i === 4)) continue;

                const colGeo = new THREE.CylinderGeometry(0.05, 0.06, tierHeight, 16);
                const column = new THREE.Mesh(colGeo, stoneMat);
                column.position.set(startX + i * spacing, tierY, 1.28);
                column.castShadow = true;
                group.add(column);
            }
        }

        // 4. Arched Main Entrance Portal
        const portalArchGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.2, 16, 1, false, 0, Math.PI);
        const portalArch = new THREE.Mesh(portalArchGeo, trimMat);
        portalArch.rotation.x = Math.PI / 2;
        portalArch.position.set(0, 0.7, 1.22);
        group.add(portalArch);

        const doorGeo = new THREE.BoxGeometry(0.6, 0.7, 0.1);
        const door = new THREE.Mesh(doorGeo, darkDoorMat);
        door.position.set(0, 0.35, 1.22);
        group.add(door);

        // 5. Triangular Classical Pediment (Top Facade Crest)
        const pedimentShape = new THREE.Shape();
        pedimentShape.moveTo(-1.3, 0);
        pedimentShape.lineTo(0, 0.65);
        pedimentShape.lineTo(1.3, 0);
        pedimentShape.closePath();

        const extrudeSettings = { depth: 0.15, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
        const pedimentGeo = new THREE.ExtrudeGeometry(pedimentShape, extrudeSettings);
        const pediment = new THREE.Mesh(pedimentGeo, mainMat);
        pediment.position.set(0, 2.15, 1.15);
        group.add(pediment);

        // 6. Twin Bell Towers (3D Volumetric Side Towers with Textures)
        const towerGeo = new THREE.BoxGeometry(0.65, 2.6, 0.65);
        
        // Left Tower
        const leftTower = new THREE.Mesh(towerGeo, mainMat);
        leftTower.position.set(-1.55, 1.3, 0.8);
        leftTower.castShadow = true;
        group.add(leftTower);

        // Right Tower
        const rightTower = new THREE.Mesh(towerGeo, mainMat);
        rightTower.position.set(1.55, 1.3, 0.8);
        rightTower.castShadow = true;
        group.add(rightTower);

        // Tower Roof Spire Caps
        const spireGeo = new THREE.ConeGeometry(0.45, 0.8, 4);
        const leftSpire = new THREE.Mesh(spireGeo, trimMat);
        leftSpire.position.set(-1.55, 3.0, 0.8);
        leftSpire.rotation.y = Math.PI / 4;
        group.add(leftSpire);

        if (!isRuin) {
            const rightSpire = new THREE.Mesh(spireGeo, trimMat);
            rightSpire.position.set(1.55, 3.0, 0.8);
            rightSpire.rotation.y = Math.PI / 4;
            group.add(rightSpire);
        }

        // Set mesh to A-Frame entity
        this.el.setObject3D('mesh', group);
    }
});
