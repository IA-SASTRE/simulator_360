import * as THREE from 'three';

export interface BarrierOptions {
  length?: number;
  height?: number;
}

export class SafetyBarrierBuilder {
  public static createGuardrail(options: BarrierOptions = {}): THREE.Group {
    const { length = 3.0, height = 1.05 } = options;
    const group = new THREE.Group();
    group.name = 'SafetyGuardrail';

    const railYellow = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Safety yellow
      metalness: 0.5,
      roughness: 0.35
    });

    const basePlateMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.7,
      roughness: 0.4
    });

    // Vertical posts at ends and middle
    const postPositions = [-length / 2, length / 2];
    if (length > 2.5) postPositions.splice(1, 0, 0);

    postPositions.forEach(px => {
      // Post
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, height, 16), railYellow);
      post.position.set(px, height / 2, 0);
      post.castShadow = true;
      group.add(post);

      // Floor base flange
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.18), basePlateMat);
      base.position.set(px, 0.01, 0);
      group.add(base);
    });

    // Top rail
    const topRail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, length, 16), railYellow);
    topRail.rotation.z = Math.PI / 2;
    topRail.position.set(0, height, 0);
    topRail.castShadow = true;
    group.add(topRail);

    // Mid rail (knee rail)
    const midRail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, length, 16), railYellow);
    midRail.rotation.z = Math.PI / 2;
    midRail.position.set(0, height * 0.52, 0);
    midRail.castShadow = true;
    group.add(midRail);

    // Toe board (kick plate)
    const toeBoard = new THREE.Mesh(new THREE.BoxGeometry(length, 0.12, 0.02), railYellow);
    toeBoard.position.set(0, 0.07, 0);
    group.add(toeBoard);

    return group;
  }

  public static createBollard(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'SafetyBollard';

    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.4,
      roughness: 0.4
    });

    const blackRingMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.5,
      roughness: 0.4
    });

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.1, 16), yellowMat);
    pole.position.y = 0.55;
    pole.castShadow = true;
    group.add(pole);

    // Dome cap
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), yellowMat);
    cap.position.y = 1.1;
    group.add(cap);

    // Reflective black vinyl stripe rings
    [-0.1, 0.1].forEach(offsetY => {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.113, 0.113, 0.07, 16), blackRingMat);
      ring.position.y = 0.85 + offsetY;
      group.add(ring);
    });

    return group;
  }
}
