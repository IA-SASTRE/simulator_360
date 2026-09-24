import * as THREE from 'three';

export interface RackOptions {
  width?: number;
  height?: number;
  depth?: number;
  levels?: number;
  bays?: number;
  hasPallets?: boolean;
}

export class RackBuilder {
  public static createRack(options: RackOptions = {}): THREE.Group {
    const {
      width = 7.0,
      height = 5.2,
      depth = 1.4,
      levels = 3,
      bays = 2,
      hasPallets = true
    } = options;

    const group = new THREE.Group();
    group.name = 'IndustrialRack';

    // Materials
    const uprightMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Industrial dark blue
      metalness: 0.6,
      roughness: 0.4
    });

    const beamMaterial = new THREE.MeshStandardMaterial({
      color: 0xea580c, // Safety orange beam
      metalness: 0.5,
      roughness: 0.4
    });

    const palletWoodMaterial = new THREE.MeshStandardMaterial({
      color: 0xb45309, // Pine / pallet wood
      roughness: 0.8,
      metalness: 0.1
    });

    const boxMaterials = [
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 }), // Cardboard
      new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.75 }),
      new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.7 })
    ];

    const plasticWrapMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85
    });

    const bayWidth = width / bays;

    // Uprights (Vertical posts)
    for (let b = 0; b <= bays; b++) {
      const x = -width / 2 + b * bayWidth;
      // Front and back uprights
      [-depth / 2, depth / 2].forEach(z => {
        const postGeom = new THREE.BoxGeometry(0.1, height, 0.1);
        const post = new THREE.Mesh(postGeom, uprightMaterial);
        post.position.set(x, height / 2, z);
        post.castShadow = true;
        post.receiveShadow = true;
        group.add(post);

        // Footplate
        const footGeom = new THREE.BoxGeometry(0.22, 0.04, 0.22);
        const foot = new THREE.Mesh(footGeom, uprightMaterial);
        foot.position.set(x, 0.02, z);
        group.add(foot);
      });

      // Diagonal bracing between front and back uprights
      for (let l = 0; l < levels; l++) {
        const braceGeom = new THREE.CylinderGeometry(0.02, 0.02, depth * 1.1);
        const brace = new THREE.Mesh(braceGeom, uprightMaterial);
        brace.rotation.x = Math.PI / 3 * (l % 2 === 0 ? 1 : -1);
        brace.position.set(x, (l + 0.5) * (height / levels), 0);
        group.add(brace);
      }
    }

    // Horizontal beams and shelves
    const levelHeight = height / levels;
    for (let l = 1; l <= levels; l++) {
      const y = l * levelHeight - 0.2;
      for (let b = 0; b < bays; b++) {
        const bayCenterX = -width / 2 + (b + 0.5) * bayWidth;

        // Front beam
        const beamGeom = new THREE.BoxGeometry(bayWidth - 0.05, 0.12, 0.06);
        const frontBeam = new THREE.Mesh(beamGeom, beamMaterial);
        frontBeam.position.set(bayCenterX, y, depth / 2);
        frontBeam.castShadow = true;
        group.add(frontBeam);

        // Back beam
        const backBeam = new THREE.Mesh(beamGeom, beamMaterial);
        backBeam.position.set(bayCenterX, y, -depth / 2);
        backBeam.castShadow = true;
        group.add(backBeam);

        // Cross ties
        [-0.35, 0.35].forEach(offsetX => {
          const tieGeom = new THREE.BoxGeometry(0.04, 0.04, depth - 0.1);
          const tie = new THREE.Mesh(tieGeom, beamMaterial);
          tie.position.set(bayCenterX + offsetX * (bayWidth / 2), y, 0);
          group.add(tie);
        });

        // Add Pallet and loaded cargo if requested
        if (hasPallets && Math.random() > 0.15) {
          // Pallet
          const pallet = new THREE.Group();
          pallet.position.set(bayCenterX, y + 0.1, 0);

          // Wood runners & top slats
          const topDeck = new THREE.Mesh(
            new THREE.BoxGeometry(bayWidth * 0.85, 0.04, depth * 0.85),
            palletWoodMaterial
          );
          topDeck.position.y = 0.08;
          topDeck.castShadow = true;
          pallet.add(topDeck);

          const bottomRunners = new THREE.Mesh(
            new THREE.BoxGeometry(bayWidth * 0.85, 0.06, depth * 0.85),
            palletWoodMaterial
          );
          bottomRunners.position.y = 0.03;
          pallet.add(bottomRunners);

          // Cargo box or stacked cartons
          const boxType = Math.floor(Math.random() * 3);
          if (boxType === 0) {
            // Big stretch-wrapped pallet cube
            const cargo = new THREE.Mesh(
              new THREE.BoxGeometry(bayWidth * 0.8, 1.1, depth * 0.8),
              plasticWrapMaterial
            );
            cargo.position.y = 0.65;
            cargo.castShadow = true;
            pallet.add(cargo);
          } else {
            // Stack of distinct cardboard cartons
            for (let cx = -1; cx <= 1; cx += 2) {
              for (let cz = -1; cz <= 1; cz += 2) {
                const box = new THREE.Mesh(
                  new THREE.BoxGeometry((bayWidth * 0.75) / 2 - 0.04, 0.5, (depth * 0.75) / 2 - 0.04),
                  boxMaterials[Math.floor(Math.random() * boxMaterials.length)]
                );
                box.position.set(cx * 0.45, 0.35, cz * 0.25);
                box.castShadow = true;
                pallet.add(box);

                // Second tier
                if (Math.random() > 0.3) {
                  const box2 = new THREE.Mesh(
                    new THREE.BoxGeometry((bayWidth * 0.75) / 2 - 0.04, 0.45, (depth * 0.75) / 2 - 0.04),
                    boxMaterials[Math.floor(Math.random() * boxMaterials.length)]
                  );
                  box2.position.set(cx * 0.45, 0.85, cz * 0.25);
                  box2.castShadow = true;
                  pallet.add(box2);
                }
              }
            }
          }

          group.add(pallet);
        }
      }
    }

    return group;
  }
}
