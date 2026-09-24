import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator';

export interface ExtinguisherOptions {
  isBlocked?: boolean;
}

export class ExtinguisherBuilder {
  public static createExtinguisher(options: ExtinguisherOptions = {}): THREE.Group {
    const { isBlocked = false } = options;
    const group = new THREE.Group();
    group.name = 'FireExtinguisher';

    // Materials
    const tankRed = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Fire red
      metalness: 0.3,
      roughness: 0.35
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xca8a04,
      metalness: 0.85,
      roughness: 0.25
    });

    const hoseRubber = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.85
    });

    // 1. Tank Body
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 20), tankRed);
    tank.position.set(0, 1.2, 0);
    tank.castShadow = true;
    group.add(tank);

    // Rounded top dome
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), tankRed);
    dome.position.set(0, 1.5, 0);
    group.add(dome);

    // Valve & Squeeze Handle
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 12), brassMat);
    valve.position.set(0, 1.64, 0);
    group.add(valve);

    const handleLever = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.015, 0.22), brassMat);
    handleLever.position.set(0, 1.68, 0.05);
    group.add(handleLever);

    // Pressure Gauge
    const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12), brassMat);
    gauge.rotation.x = Math.PI / 2;
    gauge.position.set(0.04, 1.64, 0.04);
    group.add(gauge);

    // Hose
    const hoseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.03, 1.64, 0),
      new THREE.Vector3(-0.16, 1.45, 0.05),
      new THREE.Vector3(-0.14, 1.1, 0.08),
      new THREE.Vector3(0, 0.95, 0.12)
    ]);
    const hoseGeom = new THREE.TubeGeometry(hoseCurve, 16, 0.015, 8, false);
    const hose = new THREE.Mesh(hoseGeom, hoseRubber);
    group.add(hose);

    // Extinguisher Sign on wall above
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 0.4),
      new THREE.MeshStandardMaterial({
        map: TextureGenerator.getSignTexture('fire'),
        roughness: 0.3
      })
    );
    sign.position.set(0, 2.15, 0.05);
    group.add(sign);

    // Red Arrow down pointing to extinguisher
    const arrowMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.18, 4),
      new THREE.MeshBasicMaterial({ color: 0xdc2626 })
    );
    arrowMesh.rotation.z = Math.PI;
    arrowMesh.position.set(0, 1.85, 0.05);
    group.add(arrowMesh);

    // If blocked by pallets/crates (PEL-001)
    if (isBlocked) {
      const crateMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });
      const palMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.9 });

      // Stacked pallets
      for (let p = 0; p < 3; p++) {
        const pal = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.85), palMat);
        pal.position.set(0, 0.06 + p * 0.13, 0.35);
        pal.castShadow = true;
        group.add(pal);
      }

      // Wooden shipping crates stacked right up to the tank
      const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), crateMat);
      crate1.position.set(-0.1, 0.72, 0.35);
      crate1.castShadow = true;
      group.add(crate1);

      const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), crateMat);
      crate2.position.set(0.15, 1.25, 0.35);
      crate2.rotation.y = 0.15;
      crate2.castShadow = true;
      group.add(crate2);
    }

    return group;
  }
}
