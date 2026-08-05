/**
 * Pure 3D Volumetric Architectural Basilica Builder
 * Constructs a pristine 3D model for BEFORE (1594) and an old/broken laterite ruin model for AFTER.
 * Uses pure procedural 3D materials without distorted image projections.
 */
AFRAME.registerComponent('basilica-builder', {
    schema: {
        type: { type: 'string', default: 'reconstructed' } // 'reconstructed' (BEFORE) or 'ruin' (AFTER)
    },

    init: function () {
        const group = new THREE.Group();
        const isRuin = this.data.type === 'ruin';

        // 1. Define Pure 3D Materials (No wrapped 2D photos)
        const wallMat = new THREE.MeshStandardMaterial({
            color: isRuin ? 0x7c3426 : 0xf4efe6, // Weathered Red Laterite Stone vs Pristine Cream Plaster
            roughness: isRuin ? 0.95 : 0.35,
            metalness: isRuin ? 0.05 : 0.05
        });

        const pillarMat = new THREE.MeshStandardMaterial({
            color: isRuin ? 0x5a2318 : 0xd4af37, // Dark weathered laterite vs Golden Baroque pillars
            roughness: isRuin ? 0.9 : 0.3,
            metalness: isRuin ? 0.1 : 0.6
        });

        const trimMat = new THREE.MeshStandardMaterial({
            color: isRuin ? 0x42170f : 0xb8860b, // Mossy dark stone trim vs Polished Gold trim
            roughness: isRuin ? 0.9 : 0.45,
            metalness: isRuin ? 0.1 : 0.5
        });

        const doorMat = new THREE.MeshStandardMaterial({
            color: isRuin ? 0x1f120c : 0x3d2012, // Weathered old wood vs Polished Mahogany
            roughness: 0.8
        });

        const goldCrossMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.8,
            roughness: 0.2
        });

        // 2. Main Central 3D Nave Structure
        const naveGeo = new THREE.BoxGeometry(2.8, 2.2, 3.6);
        const nave = new THREE.Mesh(naveGeo, wallMat);
        nave.position.set(0, 1.1, -0.8);
        nave.castShadow = true;
        nave.receiveShadow = true;
        group.add(nave);

        // 3. 3D Sloped Roof Structure
        const roofShape = new THREE.Shape();
        roofShape.moveTo(-1.45, 0);
        roofShape.lineTo(0, 0.85);
        roofShape.lineTo(1.45, 0);
        roofShape.closePath();

        const roofSettings = { depth: 3.6, bevelEnabled: false };
        const roofGeo = new THREE.ExtrudeGeometry(roofShape, roofSettings);
        const roof = new THREE.Mesh(roofGeo, trimMat);
        roof.position.set(0, 2.2, -2.6);
        roof.castShadow = true;
        group.add(roof);

        // 4. Three-Tier Facade Columns & Cornices
        const numColumns = 6;
        const spacing = 0.46;
        const startX = -((numColumns - 1) * spacing) / 2;

        for (let tier = 0; tier < 3; tier++) {
            const tierY = 0.38 + tier * 0.65;
            const tierHeight = 0.58;

            // Cornice Strip
            const corniceGeo = new THREE.BoxGeometry(2.9, 0.08, 0.28);
            const cornice = new THREE.Mesh(corniceGeo, trimMat);
            cornice.position.set(0, tierY + tierHeight / 2 + 0.04, 1.05);
            cornice.castShadow = true;
            group.add(cornice);

            // Columns
            for (let i = 0; i < numColumns; i++) {
                // If ruin, collapse top columns and make some broken
                if (isRuin && tier === 2 && (i === 1 || i === 4)) continue;

                const height = (isRuin && tier === 2 && i === 2) ? tierHeight * 0.4 : tierHeight;
                const colGeo = new THREE.CylinderGeometry(0.065, 0.075, height, 16);
                const column = new THREE.Mesh(colGeo, pillarMat);
                column.position.set(startX + i * spacing, tierY - (tierHeight - height) / 2, 1.1);
                column.castShadow = true;
                group.add(column);
            }
        }

        // 5. Arched Main Portal
        const portalArchGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.25, 16, 1, false, 0, Math.PI);
        const portalArch = new THREE.Mesh(portalArchGeo, trimMat);
        portalArch.rotation.x = Math.PI / 2;
        portalArch.position.set(0, 0.75, 1.05);
        group.add(portalArch);

        const doorGeo = new THREE.BoxGeometry(0.65, 0.75, 0.15);
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(0, 0.375, 1.04);
        group.add(door);

        // 6. Triangular Classical Pediment Crest
        const pedimentShape = new THREE.Shape();
        pedimentShape.moveTo(-1.4, 0);
        pedimentShape.lineTo(0, 0.7);
        pedimentShape.lineTo(1.4, 0);
        pedimentShape.closePath();

        const pedimentSettings = { depth: 0.18, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.03, bevelThickness: 0.03 };
        const pedimentGeo = new THREE.ExtrudeGeometry(pedimentShape, pedimentSettings);
        const pediment = new THREE.Mesh(pedimentGeo, isRuin ? trimMat : wallMat);
        pediment.position.set(0, 2.3, 0.96);
        pediment.castShadow = true;
        group.add(pediment);

        // Gold Cross atop Pediment (Pristine BEFORE mode)
        if (!isRuin) {
            const crossVGeo = new THREE.BoxGeometry(0.06, 0.35, 0.06);
            const crossV = new THREE.Mesh(crossVGeo, goldCrossMat);
            crossV.position.set(0, 3.15, 1.05);
            group.add(crossV);

            const crossHGeo = new THREE.BoxGeometry(0.22, 0.06, 0.06);
            const crossH = new THREE.Mesh(crossHGeo, goldCrossMat);
            crossH.position.set(0, 3.2, 1.05);
            group.add(crossH);
        }

        // 7. Twin 3D Bell Towers
        const towerGeo = new THREE.BoxGeometry(0.75, 2.8, 0.75);
        
        // Left Tower
        const leftTower = new THREE.Mesh(towerGeo, wallMat);
        leftTower.position.set(-1.75, 1.4, 0.75);
        leftTower.castShadow = true;
        group.add(leftTower);

        // Right Tower
        const rightTowerHeight = isRuin ? 2.0 : 2.8;
        const rightTowerGeo = new THREE.BoxGeometry(0.75, rightTowerHeight, 0.75);
        const rightTower = new THREE.Mesh(rightTowerGeo, wallMat);
        rightTower.position.set(1.75, rightTowerHeight / 2, 0.75);
        rightTower.castShadow = true;
        group.add(rightTower);

        // Tower Roof Spires
        const spireGeo = new THREE.ConeGeometry(0.5, 0.9, 4);
        const leftSpire = new THREE.Mesh(spireGeo, trimMat);
        leftSpire.position.set(-1.75, 3.25, 0.75);
        leftSpire.rotation.y = Math.PI / 4;
        group.add(leftSpire);

        if (!isRuin) {
            const rightSpire = new THREE.Mesh(spireGeo, trimMat);
            rightSpire.position.set(1.75, 3.25, 0.75);
            rightSpire.rotation.y = Math.PI / 4;
            group.add(rightSpire);
        }

        // 8. Fallen Broken Debris Blocks for AFTER Ruin Mode
        if (isRuin) {
            const debrisMat = new THREE.MeshStandardMaterial({ color: 0x5a2318, roughness: 0.9 });
            
            const debris1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.3), debrisMat);
            debris1.position.set(1.6, 0.12, 1.3);
            debris1.rotation.set(0.2, 0.4, 0.1);
            group.add(debris1);

            const debris2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.25), debrisMat);
            debris2.position.set(1.9, 0.1, 1.1);
            debris2.rotation.set(0.1, 0.8, -0.3);
            group.add(debris2);

            const debris3 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3), debrisMat);
            debris3.position.set(-0.6, 0.07, 1.25);
            debris3.rotation.set(1.2, 0.3, 0.5);
            group.add(debris3);
        }

        // Attach 3D Mesh to A-Frame Entity
        this.el.setObject3D('mesh', group);
    }
});
