import * as THREE from 'three';

export interface WorkerOptions {
  hasHelmet?: boolean;
  hasGoggles?: boolean;
  isLiftingWrong?: boolean;
  isGrinding?: boolean;
  vestColor?: number; // 0xa3e635 (neon lime) or 0xf97316 (orange)
}

export class WorkerBuilder {
  public static createWorker(options: WorkerOptions = {}): THREE.Group {
    const {
      hasHelmet = true,
      hasGoggles = true,
      isLiftingWrong = false,
      isGrinding = false,
      vestColor = 0xa3e635
    } = options;

    const group = new THREE.Group();
    group.name = 'IndustrialWorker';

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xd4a373,
      roughness: 0.6
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.9
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Navy work pants
      roughness: 0.8
    });

    const bootsMat = new THREE.MeshStandardMaterial({
      color: 0x3f2e1e, // Dark work boots
      roughness: 0.7
    });

    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Grey work shirt
      roughness: 0.7
    });

    const vestMat = new THREE.MeshStandardMaterial({
      color: vestColor,
      roughness: 0.5,
      metalness: 0.1
    });

    const reflectiveMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.2,
      metalness: 0.8
    });

    const helmetMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // White safety helmet (Clase G/E)
      roughness: 0.3,
      metalness: 0.1
    });

    const gogglesMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.4,
      transparent: true,
      opacity: 0.7
    });

    // Worker root container
    const body = new THREE.Group();

    if (isLiftingWrong) {
      // Bending sharply at waist (Ergonomic Hazard PEL-010)
      body.position.y = 0;

      // Straight legs
      [-0.15, 0.15].forEach(lx => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.85, 12), pantsMat);
        leg.position.set(lx, 0.42, 0);
        leg.castShadow = true;
        body.add(leg);

        const boot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.24), bootsMat);
        boot.position.set(lx, 0.07, 0.05);
        boot.castShadow = true;
        body.add(boot);
      });

      // Torso bent forward horizontally ~65°
      const upperBody = new THREE.Group();
      upperBody.position.set(0, 0.85, 0);
      upperBody.rotation.x = Math.PI / 2.5;

      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.55, 0.22), shirtMat);
      torso.position.y = 0.28;
      upperBody.add(torso);

      const vest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.48, 0.24), vestMat);
      vest.position.y = 0.28;
      upperBody.add(vest);

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), skinMat);
      head.position.set(0, 0.68, 0.05);
      head.rotation.x = -Math.PI / 4; // looking down at heavy box
      upperBody.add(head);

      if (hasHelmet) {
        const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), helmetMat);
        helmet.position.set(0, 0.74, 0.05);
        upperBody.add(helmet);
      }

      // Arms reaching down to heavy box
      [-0.22, 0.22].forEach(ax => {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.55), shirtMat);
        arm.position.set(ax, 0.2, 0.18);
        arm.rotation.x = -Math.PI / 6;
        upperBody.add(arm);
      });

      body.add(upperBody);

      // Heavy 28kg box on ground far from body
      const heavyBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.45, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 })
      );
      heavyBox.position.set(0, 0.23, 0.55);
      heavyBox.castShadow = true;
      body.add(heavyBox);

    } else {
      // Standing upright posture (inspection or grinding)
      // Boots
      [-0.14, 0.14].forEach(bx => {
        const boot = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.14, 0.25), bootsMat);
        boot.position.set(bx, 0.07, 0.03);
        boot.castShadow = true;
        body.add(boot);

        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.82, 12), pantsMat);
        leg.position.set(bx, 0.48, 0);
        leg.castShadow = true;
        body.add(leg);
      });

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.58, 0.24), shirtMat);
      torso.position.set(0, 1.15, 0);
      torso.castShadow = true;
      body.add(torso);

      // High-vis Safety Vest
      const vest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.26), vestMat);
      vest.position.set(0, 1.16, 0);
      body.add(vest);

      // Reflective silver bands on vest
      const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.05, 0.27), reflectiveMat);
      stripe1.position.set(0, 1.25, 0);
      body.add(stripe1);

      const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.05, 0.27), reflectiveMat);
      stripe2.position.set(0, 1.02, 0);
      body.add(stripe2);

      // Neck & Head
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 10), skinMat);
      neck.position.set(0, 1.48, 0);
      body.add(neck);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), skinMat);
      head.position.set(0, 1.6, 0);
      head.castShadow = true;
      body.add(head);

      // Hair (always visible, especially if no helmet)
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.142, 16, 12), hairMat);
      hair.position.set(0, 1.63, -0.03);
      hair.scale.set(1.02, 0.8, 1.05);
      body.add(hair);

      // Hardhat / Helmet check
      if (hasHelmet) {
        const helmet = new THREE.Mesh(
          new THREE.SphereGeometry(0.165, 16, 14),
          helmetMat
        );
        helmet.position.set(0, 1.66, 0);
        helmet.scale.set(1, 0.75, 1.1);
        helmet.castShadow = true;
        body.add(helmet);

        // Helmet brim
        const brim = new THREE.Mesh(
          new THREE.CylinderGeometry(0.19, 0.19, 0.02, 16),
          helmetMat
        );
        brim.position.set(0, 1.6, 0.06);
        brim.rotation.x = 0.08;
        body.add(brim);
      }

      // Safety Glasses check
      if (hasGoggles) {
        const goggles = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.06, 0.12),
          gogglesMat
        );
        goggles.position.set(0, 1.61, 0.13);
        body.add(goggles);
      }

      // Arms
      if (isGrinding) {
        // Holding angle grinder forward towards a metal workpiece
        [-0.24, 0.24].forEach(ax => {
          const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.55), shirtMat);
          arm.position.set(ax * 0.85, 1.25, 0.22);
          arm.rotation.x = Math.PI / 3;
          body.add(arm);
        });

        // Grinder tool
        const grinderBody = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 0.35, 12),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5 })
        );
        grinderBody.rotation.x = Math.PI / 2;
        grinderBody.position.set(0, 1.15, 0.45);
        body.add(grinderBody);

        // Grinding abrasive disc (generating sparks hazard)
        const disc = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.14, 0.015, 16),
          new THREE.MeshStandardMaterial({ color: 0x52525b, metalness: 0.8 })
        );
        disc.position.set(0, 1.15, 0.65);
        body.add(disc);

        // Visual spark burst particles
        const sparkGeom = new THREE.BufferGeometry();
        const sparkCount = 20;
        const sparkPositions = new Float32Array(sparkCount * 3);
        for (let s = 0; s < sparkCount; s++) {
          sparkPositions[s * 3] = (Math.random() - 0.5) * 0.4;
          sparkPositions[s * 3 + 1] = (Math.random() - 0.5) * 0.3;
          sparkPositions[s * 3 + 2] = Math.random() * 0.5;
        }
        sparkGeom.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
        const sparkMat = new THREE.PointsMaterial({
          color: 0xfbbf24,
          size: 0.04,
          transparent: true,
          opacity: 0.9
        });
        const sparks = new THREE.Points(sparkGeom, sparkMat);
        sparks.position.set(0, 1.15, 0.68);
        body.add(sparks);

      } else {
        // Normal arms at sides
        [-0.24, 0.24].forEach(ax => {
          const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.62), shirtMat);
          arm.position.set(ax, 1.15, 0);
          arm.castShadow = true;
          body.add(arm);
        });
      }
    }

    group.add(body);
    return group;
  }
}
