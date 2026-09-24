import * as THREE from 'three';

export interface CableOptions {
  isCrossingWalkway?: boolean;
  length?: number;
}

export class CableBuilder {
  public static createCable(options: CableOptions = {}): THREE.Group {
    const { isCrossingWalkway = true, length = 4.2 } = options;
    const group = new THREE.Group();
    group.name = 'LooseCableHazard';

    const cableMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Black thick heavy rubber
      roughness: 0.85
    });

    const plugYellow = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.4
    });

    // Create a snake-like curve across the floor
    const points: THREE.Vector3[] = [];
    const segments = 12;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = (t - 0.5) * length;
      const z = Math.sin(t * Math.PI * 3) * 0.22;
      points.push(new THREE.Vector3(x, 0.02, z));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const geom = new THREE.TubeGeometry(curve, 32, 0.022, 8, false);
    const cableMesh = new THREE.Mesh(geom, cableMat);
    cableMesh.castShadow = true;
    group.add(cableMesh);

    // Industrial 3-phase yellow plug at one end
    const plug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.18, 12),
      plugYellow
    );
    plug.rotation.z = Math.PI / 2;
    plug.position.copy(points[0]);
    group.add(plug);

    if (isCrossingWalkway) {
      // Small hazard trip indicator tape loosely dangling
      const tapeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });
      const tape = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.005, 0.15), tapeMat);
      tape.position.set(0, 0.025, 0);
      group.add(tape);
    }

    return group;
  }
}
