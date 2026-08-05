/**
 * Volumetric 3D Basilica Builder Component
 * Builds a 360-degree volumetric 3D architectural model of the Basilica of Bom Jesus
 * complete with depth, side walls, twin bell towers, pillars, arches, and roof structures.
 */
AFRAME.registerComponent('basilica-builder', {
    schema: {
        type: { type: 'string', default: 'reconstructed' } // 'reconstructed' or 'ruin'
    },

    init: function () {
        const group = new THREE.Group();
        const isRuin = this.data.type === 'ruin';

        // Load realistic image textures
        const textureLoader = new THREE.TextureLoader();
        const texturePath = isRuin ? './assets/images/basilica_ruin.jpg' : './assets/images/basilica_reconstructed.jpg';
        const facadeTexture = textureLoader.load(texturePath);
        facadeTexture.colorSpace = THREE.SRGBColorSpace;
        facadeTexture.wrapS = THREE.RepeatWrapping;
        facadeTexture.wrapT = THREE.RepeatWrapping;

        // Base materials with texture mapping
        const wallMat = new THREE.MeshStandardMaterial({
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

        // 1. Central 3D Nave Building (Full 3D Volume with Depth)
        const naveGeo = new THREE.BoxGeometry(2.8, 2.2, 3.8);
        const nave = new THREE.Mesh(naveGeo, wallMat);
        nave.position.set(0, 1.1, -0.8);
        nave.castShadow = true;
        nave.receiveShadow = true;
        group.add(nave);

        // 2. Sloped 3D Roof
        const roofShape = new THREE.Shape();
        roofShape.moveTo(-1.45, 0);
        roofShape.lineTo(0, 0.8);
        roofShape.lineTo(1.45, 0);
        roofShape.closePath();

        const roofExtrudeSettings = { depth: 3.8, bevelEnabled: false };
        const roofGeo = new THREE.ExtrudeGeometry(roofShape, roofExtrudeSettings);
        const roof = new THREE.Mesh(roofGeo, trimMat);
        roof.position.set(0, 2.2, -2.7);
        roof.castShadow = true;
        group.add(roof);

        // 3. Three-Tier Facade Pillars & Columns (Volumetric Front)
        const numColumns = 6;
        const spacing = 0.46;
        const startX = -((numColumns - 1) * spacing) / 2;

        for (let tier = 0; tier < 3; tier++) {
            const tierY = 0.38 + tier * 0.65;
            const tierHeight = 0.6;

            // Horizontal Cornice Layer
            const corniceGeo = new THREE.BoxGeometry(2.9, 0.08, 0.3);
            const cornice = new THREE.Mesh(corniceGeo, trimMat);
            cornice.position.set(0, tierY + tierHeight / 2 + 0.04, 1.12);
            group.add(cornice);

            // Columns across the facade
            for (let i = 0; i < numColumns; i++) {
                if (isRuin && tier === 2 && (i === 1 || i === 4)) continue;

                const colGeo = new THREE.CylinderGeometry(0.06, 0.07, tierHeight, 16);
                const column = new THREE.Mesh(colGeo, stoneMat);
                column.position.set(startX + i * spacing, tierY, 1.15);
                column.castShadow = true;
                group.add(column);
            }
        }

        // 4. Arched Main Entrance Portal & Receding Corridor
        const portalArchGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16, 1, false, 0, Math.PI);
        const portalArch = new THREE.Mesh(portalArchGeo, trimMat);
        portalArch.rotation.x = Math.PI / 2;
        portalArch.position.set(0, 0.75, 1.1);
        group.add(portalArch);

        const doorGeo = new THREE.BoxGeometry(0.65, 0.75, 0.15);
        const door = new THREE.Mesh(doorGeo, darkDoorMat);
        door.position.set(0, 0.375, 1.1);
        group.add(door);

        // 5. Triangular Classical Pediment (Top Facade Crest)
        const pedimentShape = new THREE.Shape();
        pedimentShape.moveTo(-1.4, 0);
        pedimentShape.lineTo(0, 0.7);
        pedimentShape.lineTo(1.4, 0);
        pedimentShape.closePath();

        const pedimentSettings = { depth: 0.2, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.03, bevelThickness: 0.03 };
        const pedimentGeo = new THREE.ExtrudeGeometry(pedimentShape, pedimentSettings);
        const pediment = new THREE.Mesh(pedimentGeo, wallMat);
        pediment.position.set(0, 2.3, 1.0);
        group.add(pediment);

        // 6. Twin Bell Towers (3D Volumetric Side Towers on Left & Right)
        const towerGeo = new THREE.BoxGeometry(0.75, 2.8, 0.75);
        
        // Left 3D Tower
        const leftTower = new THREE.Mesh(towerGeo, wallMat);
        leftTower.position.set(-1.7, 1.4, 0.75);
        leftTower.castShadow = true;
        group.add(leftTower);

        // Right 3D Tower
        const rightTower = new THREE.Mesh(towerGeo, wallMat);
        rightTower.position.set(1.7, 1.4, 0.75);
        rightTower.castShadow = true;
        group.add(rightTower);

        // Tower Roof Spire Caps
        const spireGeo = new THREE.ConeGeometry(0.5, 0.9, 4);
        const leftSpire = new THREE.Mesh(spireGeo, trimMat);
        leftSpire.position.set(-1.7, 3.25, 0.75);
        leftSpire.rotation.y = Math.PI / 4;
        group.add(leftSpire);

        if (!isRuin) {
            const rightSpire = new THREE.Mesh(spireGeo, trimMat);
            rightSpire.position.set(1.7, 3.25, 0.75);
            rightSpire.rotation.y = Math.PI / 4;
            group.add(rightSpire);
        }

        // Set 3D mesh to A-Frame entity
        this.el.setObject3D('mesh', group);
    }
});
