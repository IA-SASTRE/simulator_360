import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator';

export interface EmergencyExitOptions {
  isBlocked?: boolean;
}

export class EmergencyExitBuilder {
  public static createExit(options: EmergencyExitOptions = {}): THREE.Group {
    const { isBlocked = true } = options;
    const group = new THREE.Group();
    group.name = 'EmergencyExitDoor';

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.7,
      roughness: 0.3
    });

    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Steel door
      metalness: 0.5,
      roughness: 0.4
    });

    const pushBarMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Red panic push bar
      metalness: 0.6,
      roughness: 0.3
    });

    // 1. Double Door Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 0.15), frameMat);
    frame.position.set(0, 1.4, 0);
    group.add(frame);

    // Left Door Leaf
    const doorLeft = new THREE.Mesh(new THREE.BoxGeometry(1.08, 2.65, 0.08), doorMat);
    doorLeft.position.set(-0.56, 1.35, 0.02);
    doorLeft.castShadow = true;
    group.add(doorLeft);

    // Right Door Leaf
    const doorRight = new THREE.Mesh(new THREE.BoxGeometry(1.08, 2.65, 0.08), doorMat);
    doorRight.position.set(0.56, 1.35, 0.02);
    doorRight.castShadow = true;
    group.add(doorRight);

    // Red Panic Push Bars on both doors
    [-0.56, 0.56].forEach(dx => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 0.06), pushBarMat);
      bar.position.set(dx, 1.05, 0.08);
      group.add(bar);

      // Bar brackets
      [-0.38, 0.38].forEach(bx => {
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.06), frameMat);
        bracket.position.set(dx + bx, 1.05, 0.05);
        group.add(bracket);
      });
    });

    // Illuminated Green Emergency Exit Sign Above Doors
    const exitSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.35, 0.06),
      new THREE.MeshStandardMaterial({
        map: TextureGenerator.getSignTexture('exit'),
        emissive: 0x15803d,
        emissiveIntensity: 0.4,
        roughness: 0.2
      })
    );
    exitSign.position.set(0, 2.95, 0.08);
    group.add(exitSign);

    // Emergency twin light fixture above sign
    const lightFixture = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.12), frameMat);
    lightFixture.position.set(0, 3.25, 0.1);
    group.add(lightFixture);

    // If blocked by pallets/cargo (PEL-005)
    if (isBlocked) {
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });
      const cartonMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });

      // Stacked pallets directly against the doors
      for (let p = 0; p < 4; p++) {
        const pal = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.14, 1.2), woodMat);
        pal.position.set(-0.2, 0.07 + p * 0.14, 0.65);
        pal.castShadow = true;
        group.add(pal);
      }

      // Tall stack of heavy cartons
      const boxes = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.3, 1.1), cartonMat);
      boxes.position.set(-0.2, 1.25, 0.65);
      boxes.castShadow = true;
      group.add(boxes);

      // Additional loose pallet leaning against the push bar
      const leaningPallet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.12), woodMat);
      leaningPallet.position.set(0.65, 0.5, 0.35);
      leaningPallet.rotation.x = -0.2;
      leaningPallet.castShadow = true;
      group.add(leaningPallet);
    }

    return group;
  }
}
