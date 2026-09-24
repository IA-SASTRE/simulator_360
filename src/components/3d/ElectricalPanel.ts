import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator';

export interface ElectricalPanelOptions {
  isBlocked?: boolean;
  hasDamagedCable?: boolean;
}

export class ElectricalPanelBuilder {
  public static createPanel(options: ElectricalPanelOptions = {}): THREE.Group {
    const { isBlocked = false, hasDamagedCable = false } = options;
    const group = new THREE.Group();
    group.name = 'ElectricalPanel';

    // Materials
    const panelGrey = new THREE.MeshStandardMaterial({
      color: 0x64748b, // Industrial grey enclosure
      metalness: 0.5,
      roughness: 0.35
    });

    const darkTrim = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.7,
      roughness: 0.3
    });

    const conduitSteel = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.2
    });

    // 1. Steel Enclosure Body (Wall mounted or floor pedestal)
    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.45), panelGrey);
    cabinet.position.set(0, 1.4, 0);
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    group.add(cabinet);

    // Door bevel trim
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.14, 1.74, 0.05), panelGrey);
    door.position.set(0, 1.4, 0.24);
    group.add(door);

    // Turn latch / handle
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.08), darkTrim);
    handle.position.set(0.48, 1.4, 0.3);
    group.add(handle);

    // Electric Hazard Warning Sign on Door
    const signMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.45, 0.45),
      new THREE.MeshStandardMaterial({
        map: TextureGenerator.getSignTexture('electric'),
        roughness: 0.3
      })
    );
    signMesh.position.set(0, 1.6, 0.27);
    group.add(signMesh);

    // Conduit Pipes entering top
    [-0.35, 0, 0.35].forEach(cx => {
      const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 12), conduitSteel);
      conduit.position.set(cx, 2.7, 0);
      group.add(conduit);
    });

    // If blocked by pallets/drums (PEL-013)
    if (isBlocked) {
      // Wood pallet sitting right in front of the door
      const palletMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });
      const pal = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 1.0), palletMat);
      pal.position.set(0, 0.07, 0.75);
      pal.castShadow = true;
      group.add(pal);

      // Two metal drums stacked on the pallet directly blocking the door swing
      const drumMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, metalness: 0.7, roughness: 0.3 });
      const drum1 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 16), drumMat);
      drum1.position.set(-0.3, 0.6, 0.75);
      drum1.castShadow = true;
      group.add(drum1);

      const drumMat2 = new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.7, roughness: 0.3 });
      const drum2 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 16), drumMat2);
      drum2.position.set(0.3, 0.6, 0.75);
      drum2.castShadow = true;
      group.add(drum2);
    }

    // If damaged cable (PEL-003)
    if (hasDamagedCable) {
      // Cable coming out from bottom corner with insulation tear
      const cableMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
      const cableSegment1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 8), cableMat);
      cableSegment1.position.set(0.4, 0.4, 0.1);
      cableSegment1.rotation.z = Math.PI / 8;
      group.add(cableSegment1);

      // Exposed copper wires (bright shiny copper)
      const copperMat = new THREE.MeshStandardMaterial({
        color: 0xb45309,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.6,
        metalness: 0.95,
        roughness: 0.2
      });
      const bareCopper = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.15, 8), copperMat);
      bareCopper.position.set(0.5, 0.35, 0.12);
      group.add(bareCopper);

      // Spark glow point light
      const sparkLight = new THREE.PointLight(0x60a5fa, 0.8, 2);
      sparkLight.position.set(0.5, 0.35, 0.15);
      group.add(sparkLight);
    }

    return group;
  }
}
