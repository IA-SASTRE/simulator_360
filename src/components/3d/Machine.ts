import * as THREE from 'three';

export interface MachineOptions {
  hasGuard?: boolean;
}

export class MachineBuilder {
  public static createMachine(options: MachineOptions = {}): THREE.Group {
    const { hasGuard = false } = options;
    const group = new THREE.Group();
    group.name = 'IndustrialMachine';

    // Materials
    const machineGreen = new THREE.MeshStandardMaterial({
      color: 0x334155, // Industrial slate/charcoal
      metalness: 0.6,
      roughness: 0.4
    });

    const polishedMetal = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      metalness: 0.85,
      roughness: 0.2
    });

    const motorSteel = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.7,
      roughness: 0.35
    });

    const beltRubber = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.9
    });

    const eStopRed = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.3
    });

    // 1. Heavy Base Frame
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 1.8), machineGreen);
    base.position.y = 0.4;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // 2. Machine Main Column & Head
    const column = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 1.4), machineGreen);
    column.position.set(0, 1.7, -0.1);
    column.castShadow = true;
    group.add(column);

    const head = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 1.6), machineGreen);
    head.position.set(0, 2.7, 0.1);
    head.castShadow = true;
    group.add(head);

    // Worktable / Bed
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 1.0), polishedMetal);
    bed.position.set(0, 0.9, 0.4);
    group.add(bed);

    // Spindle / Hydraulic Ram
    const ram = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 16), polishedMetal);
    ram.position.set(0, 1.9, 0.4);
    group.add(ram);

    // Electric Drive Motor on side
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.75, 16), motorSteel);
    motor.rotation.z = Math.PI / 2;
    motor.position.set(0.9, 2.1, -0.2);
    group.add(motor);

    // 3. Drive Pulleys & Belt (Hazard PEL-014 when unguarded)
    const upperPulley = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 20), polishedMetal);
    upperPulley.rotation.z = Math.PI / 2;
    upperPulley.position.set(1.15, 2.5, -0.2);
    group.add(upperPulley);

    const lowerPulley = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 20), polishedMetal);
    lowerPulley.rotation.z = Math.PI / 2;
    lowerPulley.position.set(1.15, 1.7, -0.2);
    group.add(lowerPulley);

    // Transmission V-belt connecting the two pulleys
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.36), beltRubber);
    belt.position.set(1.15, 2.1, -0.2);
    group.add(belt);

    // Guard mesh or yellow mesh cover (if hasGuard is true)
    if (hasGuard) {
      const guard = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 1.3, 0.65),
        new THREE.MeshStandardMaterial({
          color: 0xeab308,
          transparent: true,
          opacity: 0.65,
          wireframe: true
        })
      );
      guard.position.set(1.22, 2.1, -0.2);
      group.add(guard);
    } else {
      // Danger label next to open nip point
      const dangerPlate = new THREE.Mesh(
        new THREE.PlaneGeometry(0.4, 0.2),
        new THREE.MeshBasicMaterial({ color: 0xdc2626 })
      );
      dangerPlate.position.set(0.72, 1.4, 0.4);
      dangerPlate.rotation.y = Math.PI / 2;
      group.add(dangerPlate);
    }

    // Emergency Stop button (Mushroom button)
    const eStopBox = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.12), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
    eStopBox.position.set(0.85, 1.1, 0.7);
    group.add(eStopBox);

    const eStopBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16), eStopRed);
    eStopBtn.rotation.x = Math.PI / 2;
    eStopBtn.position.set(0.85, 1.1, 0.78);
    group.add(eStopBtn);

    return group;
  }
}
