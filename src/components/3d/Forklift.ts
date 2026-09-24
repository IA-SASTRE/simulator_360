import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator';

export interface ForkliftOptions {
  isOverloaded?: boolean;
  hasDriver?: boolean;
}

export class ForkliftBuilder {
  public static createForklift(options: ForkliftOptions = {}): THREE.Group {
    const group = new THREE.Group();
    group.name = 'IndustrialForklift';

    // Materials
    const bodyYellow = new THREE.MeshStandardMaterial({
      color: 0xeab308, // Safety yellow
      metalness: 0.4,
      roughness: 0.35
    });

    const darkSteel = new THREE.MeshStandardMaterial({
      color: 0x1f2937, // Charcoal steel
      metalness: 0.8,
      roughness: 0.3
    });

    const tireRubber = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9,
      metalness: 0.1
    });

    const wheelHub = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.7,
      roughness: 0.3
    });

    const chromeHydraulics = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.1
    });

    const seatVinyl = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.8
    });

    // 1. Lower Main Body / Chassis
    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.65, 2.4),
      bodyYellow
    );
    chassis.position.set(0, 0.55, 0);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    group.add(chassis);

    // Rear counterweight
    const counterweight = new THREE.Mesh(
      new THREE.BoxGeometry(1.36, 0.75, 0.7),
      darkSteel
    );
    counterweight.position.set(0, 0.6, -1.05);
    counterweight.castShadow = true;
    group.add(counterweight);

    // Chevron stripes on counterweight
    const chevronPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.45),
      new THREE.MeshStandardMaterial({
        map: TextureGenerator.getSafetyStripeTexture(),
        roughness: 0.5
      })
    );
    chevronPlate.rotation.y = Math.PI;
    chevronPlate.position.set(0, 0.6, -1.41);
    group.add(chevronPlate);

    // 2. Wheels (4 industrial heavy-duty solid tires)
    const wheelPositions: [number, number, number][] = [
      [-0.75, 0.38, 0.85],  // Front Left
      [0.75, 0.38, 0.85],   // Front Right
      [-0.68, 0.32, -0.9],  // Rear Left
      [0.68, 0.32, -0.9]    // Rear Right
    ];

    wheelPositions.forEach(([wx, wy, wz], idx) => {
      const radius = idx < 2 ? 0.38 : 0.32;
      const width = idx < 2 ? 0.28 : 0.24;

      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(wx, wy, wz);

      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, width, 24),
        tireRubber
      );
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wheelGroup.add(tire);

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.55, radius * 0.55, width + 0.02, 16),
        wheelHub
      );
      hub.rotation.z = Math.PI / 2;
      wheelGroup.add(hub);

      group.add(wheelGroup);
    });

    // 3. Cabin Floor & Pedals
    const cabFloor = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.1, 1.2),
      darkSteel
    );
    cabFloor.position.set(0, 0.9, 0.1);
    group.add(cabFloor);

    // Operator Seat
    const seatBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.3, 0.5),
      seatVinyl
    );
    seatBase.position.set(0, 1.15, -0.2);
    group.add(seatBase);

    const seatBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.5, 0.12),
      seatVinyl
    );
    seatBack.position.set(0, 1.5, -0.42);
    group.add(seatBack);

    // Steering Column & Wheel
    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 0.6),
      darkSteel
    );
    column.rotation.x = -Math.PI / 6;
    column.position.set(0, 1.25, 0.5);
    group.add(column);

    const wheel = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.025, 12, 24),
      tireRubber
    );
    wheel.rotation.x = Math.PI / 3;
    wheel.position.set(0, 1.52, 0.4);
    group.add(wheel);

    // 4. Overhead Protective Cage (ROPS)
    const cageMaterial = darkSteel;
    const legRadius = 0.035;

    // 4 vertical posts
    const legPositions: [number, number][] = [
      [-0.58, 0.65],
      [0.58, 0.65],
      [-0.58, -0.65],
      [0.58, -0.65]
    ];

    legPositions.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(legRadius, legRadius, 1.4, 12),
        cageMaterial
      );
      leg.position.set(lx, 1.6, lz);
      leg.castShadow = true;
      group.add(leg);
    });

    // Top roof canopy grid
    const canopyRim = new THREE.Mesh(
      new THREE.BoxGeometry(1.24, 0.06, 1.38),
      cageMaterial
    );
    canopyRim.position.set(0, 2.3, 0);
    canopyRim.castShadow = true;
    group.add(canopyRim);

    // Roof safety bars
    for (let r = -0.5; r <= 0.5; r += 0.2) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(1.15, 0.03, 0.04),
        cageMaterial
      );
      bar.position.set(0, 2.3, r);
      group.add(bar);
    }

    // Amber Flashing Strobe Beacon on top
    const beaconBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.09, 0.08, 16),
      darkSteel
    );
    beaconBase.position.set(0, 2.37, -0.45);
    group.add(beaconBase);

    const beaconLight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.12, 16),
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9
      })
    );
    beaconLight.position.set(0, 2.47, -0.45);
    group.add(beaconLight);

    // 5. Front Mast (Two-stage vertical channels)
    const mastHeight = 2.6;
    [-0.45, 0.45].forEach(mx => {
      const mastRail = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, mastHeight, 0.12),
        darkSteel
      );
      mastRail.position.set(mx, mastHeight / 2 + 0.15, 1.25);
      mastRail.castShadow = true;
      group.add(mastRail);
    });

    // Hydraulic Lift Cylinder
    const cylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.8, 16),
      chromeHydraulics
    );
    cylinder.position.set(0, 1.1, 1.25);
    group.add(cylinder);

    // Fork Carriage & Forks
    const forkCarriage = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 0.45, 0.06),
      darkSteel
    );
    forkCarriage.position.set(0, 0.4, 1.33);
    group.add(forkCarriage);

    // Two steel forks (L-shaped)
    [-0.32, 0.32].forEach(fx => {
      const forkVertical = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.65, 0.04),
        darkSteel
      );
      forkVertical.position.set(fx, 0.4, 1.38);
      group.add(forkVertical);

      const forkBlade = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.035, 1.25),
        darkSteel
      );
      forkBlade.position.set(fx, 0.08, 2.0);
      forkBlade.castShadow = true;
      group.add(forkBlade);
    });

    // 6. Hazard Overload Load (if isOverloaded is true)
    if (options.isOverloaded) {
      const overloadPallet = new THREE.Group();
      overloadPallet.position.set(0, 0.12, 2.0);

      // Wooden pallet base
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });
      const palBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 1.1), woodMat);
      overloadPallet.add(palBase);

      // Excessive towering unstable boxes blocking driver vision
      const cartonMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
      const giantLoad = new THREE.Mesh(
        new THREE.BoxGeometry(1.25, 2.2, 1.1),
        cartonMat
      );
      giantLoad.position.y = 1.2;
      giantLoad.rotation.z = 0.06; // tilted unstable load!
      giantLoad.castShadow = true;
      overloadPallet.add(giantLoad);

      group.add(overloadPallet);
    }

    return group;
  }
}
