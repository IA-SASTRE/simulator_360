import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { TextureGenerator } from './TextureGenerator';
import { CollisionSystem } from './CollisionSystem';
import { RackBuilder } from './Rack';
import { ForkliftBuilder } from './Forklift';
import { WorkerBuilder } from './Worker';
import { MachineBuilder } from './Machine';
import { ElectricalPanelBuilder } from './ElectricalPanel';
import { ExtinguisherBuilder } from './Extinguisher';
import { SpillBuilder } from './Spill';
import { CableBuilder } from './Cable';
import { EmergencyExitBuilder } from './EmergencyExit';
import { SafetyBarrierBuilder } from './SafetyBarrier';
import { HazardDefinition } from '../../types/Hazard';

export const CinematicColorGradeShader = {
  name: 'CinematicColorGradeShader',
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    grainIntensity: { value: 0.042 },
    grainSize: { value: 1.6 },
    contrast: { value: 1.08 },
    lift: { value: 0.015 },
    saturation: { value: 1.04 },
    temperature: { value: -0.02 }, // Subtle cool industrial cast
    vignetteIntensity: { value: 0.35 },
    vignetteRoundness: { value: 0.8 },
    chromaticAberration: { value: 0.0018 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float grainIntensity;
    uniform float grainSize;
    uniform float contrast;
    uniform float lift;
    uniform float saturation;
    uniform float temperature;
    uniform float vignetteIntensity;
    uniform float vignetteRoundness;
    uniform float chromaticAberration;
    varying vec2 vUv;

    // High quality temporal noise for organic 35mm film grain
    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float filmGrain(vec2 uv, float t) {
      vec2 seed = (uv + fract(t * 0.037)) * (720.0 / grainSize);
      float n1 = hash21(seed);
      float n2 = hash21(seed + vec2(17.3, 31.7));
      return (n1 + n2) * 0.5 - 0.5;
    }

    void main() {
      vec2 uv = vUv;
      vec2 toCenter = uv - 0.5;
      float distFromCenter = length(toCenter);

      // 1. Subtle peripheral lens chromatic aberration (simulates industrial goggles/lens optic)
      vec2 caOffset = toCenter * (distFromCenter * chromaticAberration);
      float r = texture2D(tDiffuse, uv - caOffset).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv + caOffset).b;
      vec3 color = vec3(r, g, b);

      // 2. Cinematic S-Curve Contrast & Shadow Lift
      // Prevents crushed pure blacks and highlights clipping
      color += vec3(lift);
      color = (color - 0.5) * contrast + 0.5;

      // 3. Color Temperature & Industrial Split-Toning
      // Shadows slightly cool steel/graphite, highlights maintain warm safety beacons
      vec3 coolShadow = vec3(0.96, 0.98, 1.03);
      vec3 warmHighlight = vec3(1.02, 1.01, 0.97);
      float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
      vec3 toneColor = mix(coolShadow, warmHighlight, smoothstep(0.15, 0.85, lum));
      color *= toneColor;
      color.r += temperature;
      color.b -= temperature;

      // 4. Saturation control
      color = mix(vec3(lum), color, saturation);

      // 5. Physically-modelled Film Grain (more prominent in mid-tones, fading in specular peaks)
      float grainMask = 1.0 - abs(lum - 0.5) * 1.5;
      grainMask = clamp(grainMask, 0.15, 1.0);
      float grain = filmGrain(uv, time) * grainIntensity * grainMask;
      color += grain;

      // 6. Smooth Natural Lens Vignette
      float vignette = smoothstep(1.0, 0.35, distFromCenter * vignetteRoundness);
      color *= mix(1.0 - vignetteIntensity, 1.0, vignette);

      gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }
  `
};

export class WarehouseScene {
  public scene: THREE.Scene;
  public collisionSystem: CollisionSystem;
  private hazardObjects: Map<string, THREE.Object3D> = new Map();
  public composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private gradePass: ShaderPass | null = null;

  constructor(collisionSystem: CollisionSystem) {
    this.scene = new THREE.Scene();
    this.collisionSystem = collisionSystem;

    // Atmospheric dark slate fog for realistic depth perception
    this.scene.background = new THREE.Color(0x18181b);
    this.scene.fog = new THREE.FogExp2(0x18181b, 0.018);

    this.setupLighting();
    this.buildArchitecture();
    this.buildRacksAndStorage();
    this.buildMachineryAndElectrical();
    this.buildWalkwaysAndBarriers();
    this.buildForkliftsAndTraffic();
    this.buildWorkers();
  }

  public initPostProcessing(
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera,
    width: number,
    height: number
  ) {
    try {
      const composer = new EffectComposer(renderer);

      // 1. Base scene render pass
      const renderPass = new RenderPass(this.scene, camera);
      composer.addPass(renderPass);

      // 2. Light bloom pass for industrial high-bay lamps and metallic specular highlights
      // Tuned threshold (0.72) and strength (0.35) with dispersion radius (0.52):
      // Isolates high-bay LED emitters, warning beacons, and specular highlights
      // on polished steel machinery and structural beams without blowing out the floor or walls
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(Math.max(1, Math.floor(width / 2)), Math.max(1, Math.floor(height / 2))),
        0.35, // Calibrated bloom strength: noticeable glow without washing out contrast
        0.52, // Atmospheric radius: mimics light dispersion in a cavernous warehouse
        0.72  // Luminance threshold: catches light sources and high specular metal reflections
      );
      composer.addPass(this.bloomPass);

      // 3. Output tone mapping pass (ACES Filmic to display space)
      const outputPass = new OutputPass();
      composer.addPass(outputPass);

      // 4. Cinematic Optical ShaderPass: Photographic S-curve, dual-tone grading,
      // subtle lens chromatic fringe and organic 35mm film grain
      this.gradePass = new ShaderPass(CinematicColorGradeShader);
      composer.addPass(this.gradePass);

      this.composer = composer;
    } catch (err) {
      console.warn('Postprocessing pipeline error, fallback to standard rendering', err);
      this.composer = null;
    }
  }

  public setSize(width: number, height: number) {
    if (this.composer) {
      this.composer.setSize(width, height);
      if (this.bloomPass) {
        this.bloomPass.resolution.set(
          Math.max(1, Math.floor(width / 2)),
          Math.max(1, Math.floor(height / 2))
        );
      }
    }
  }

  public setBloomParameters(strength?: number, threshold?: number, radius?: number) {
    if (this.bloomPass) {
      if (typeof strength === 'number') this.bloomPass.strength = strength;
      if (typeof threshold === 'number') this.bloomPass.threshold = threshold;
      if (typeof radius === 'number') this.bloomPass.radius = radius;
    }
  }

  public render(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, delta: number = 0.016) {
    if (this.composer) {
      if (this.gradePass) {
        this.gradePass.uniforms.time.value += delta * 1000;
      }
      this.composer.render(delta);
    } else {
      renderer.render(this.scene, camera);
    }
  }

  public dispose() {
    if (this.composer) {
      this.composer.dispose();
      this.composer = null;
    }
  }

  private setupLighting() {
    // 1. Hemisphere Light: Natural skylight + floor bounce
    const hemiLight = new THREE.HemisphereLight(0xe2e8f0, 0x334155, 0.7);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    // 2. Main Directional Light (Skylights / warehouse roof lanterns)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(15, 22, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = -25;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    // Secondary fill light for corners
    const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.35);
    fillLight.position.set(-15, 18, -10);
    this.scene.add(fillLight);

    // 3. Overhead High-bay Industrial LED Lamps
    const lampRows = [-12, 0, 12];
    const lampCols = [-12, -4, 4, 12];

    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfff7ed, // High-bay neutral-warm industrial LED (5000K)
      emissiveIntensity: 1.35,
      roughness: 0.08,
      metalness: 0.1
    });

    const reflectorMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.88,
      roughness: 0.15
    });

    lampRows.forEach(x => {
      lampCols.forEach(z => {
        // Lamp fixture housing
        const housing = new THREE.Mesh(
          new THREE.CylinderGeometry(0.4, 0.58, 0.28, 16),
          new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
        );
        housing.position.set(x, 7.85, z);
        this.scene.add(housing);

        // Polished reflector rim (catches bright specular highlights)
        const reflectorRim = new THREE.Mesh(
          new THREE.TorusGeometry(0.5, 0.035, 8, 20),
          reflectorMat
        );
        reflectorRim.rotation.x = Math.PI / 2;
        reflectorRim.position.set(x, 7.74, z);
        this.scene.add(reflectorRim);

        // LED disc emitter (Bloom target)
        const emitter = new THREE.Mesh(
          new THREE.CylinderGeometry(0.38, 0.38, 0.05, 16),
          lampMat
        );
        emitter.position.set(x, 7.72, z);
        this.scene.add(emitter);

        // Subtle area point light per bay
        const pointLight = new THREE.PointLight(0xfffbeb, 0.45, 14, 1.2);
        pointLight.position.set(x, 7.4, z);
        this.scene.add(pointLight);
      });
    });
  }

  private buildArchitecture() {
    const W = 44; // width X: [-22, 22]
    const D = 40; // depth Z: [-20, 20]
    const H = 8;  // height Y: [0, 8]

    // 1. Concrete Floor
    const floorGeo = new THREE.PlaneGeometry(W, D);
    const floorMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getConcreteFloorTexture(),
      roughness: 0.35,
      metalness: 0.15
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 2. Ceiling / Metal Deck
    const ceilGeo = new THREE.PlaneGeometry(W, D);
    const ceilMat = new THREE.MeshStandardMaterial({
      color: 0x3f3f46,
      roughness: 0.7,
      metalness: 0.4
    });
    const ceil = new THREE.Mesh(ceilGeo, ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = H;
    this.scene.add(ceil);

    // 3. Perimeter Metal Walls
    const wallMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getMetalWallTexture(),
      roughness: 0.6,
      metalness: 0.4
    });

    // North Wall (Z = -D/2)
    const northWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    northWall.position.set(0, H / 2, -D / 2);
    northWall.receiveShadow = true;
    this.scene.add(northWall);

    // South Wall (Z = +D/2)
    const southWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    southWall.position.set(0, H / 2, D / 2);
    southWall.rotation.y = Math.PI;
    southWall.receiveShadow = true;
    this.scene.add(southWall);

    // West Wall (X = -W/2)
    const westWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    westWall.position.set(-W / 2, H / 2, 0);
    westWall.rotation.y = Math.PI / 2;
    westWall.receiveShadow = true;
    this.scene.add(westWall);

    // East Wall (X = +W/2)
    const eastWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    eastWall.position.set(W / 2, H / 2, 0);
    eastWall.rotation.y = -Math.PI / 2;
    eastWall.receiveShadow = true;
    this.scene.add(eastWall);

    // 4. Heavy Steel I-Beams & Columns along center lines
    const columnMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Blue structural steel
      metalness: 0.82, // High specular reflection for bloom gleam
      roughness: 0.22
    });

    const girderMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      metalness: 0.80,
      roughness: 0.24
    });

    [-12, 0, 12].forEach(colX => {
      [-10, 0, 10].forEach(colZ => {
        // Main structural H-column
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.5, H, 0.5), columnMat);
        col.position.set(colX, H / 2, colZ);
        col.castShadow = true;
        col.receiveShadow = true;
        this.scene.add(col);

        // Add collision box for column
        this.collisionSystem.addObstacle(
          `col_${colX}_${colZ}`,
          new THREE.Vector3(colX, H / 2, colZ),
          new THREE.Vector3(0.65, H, 0.65)
        );
      });

      // Transverse roof girder
      const girder = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, D), girderMat);
      girder.position.set(colX, H - 0.3, 0);
      this.scene.add(girder);
    });
  }

  private buildRacksAndStorage() {
    // Zona 2: Almacenamiento en Racks (Left wing: X around -14 to -4, Z from -14 to +10)
    // Aisle 1 Racks
    const rack1 = RackBuilder.createRack({ width: 8.5, height: 5.4, levels: 3, bays: 3 });
    rack1.position.set(-6.5, 0, 6);
    this.scene.add(rack1);
    this.collisionSystem.addObstacle('rack_1', new THREE.Vector3(-6.5, 2.7, 6), new THREE.Vector3(8.8, 5.4, 1.8));

    // Aisle 2 Racks (Back to back)
    const rack2 = RackBuilder.createRack({ width: 8.5, height: 5.4, levels: 3, bays: 3 });
    rack2.position.set(-6.5, 0, 1.5);
    this.scene.add(rack2);
    this.collisionSystem.addObstacle('rack_2', new THREE.Vector3(-6.5, 2.7, 1.5), new THREE.Vector3(8.8, 5.4, 1.8));

    // Aisle 3 Racks
    const rack3 = RackBuilder.createRack({ width: 8.5, height: 5.4, levels: 3, bays: 3 });
    rack3.position.set(-6.5, 0, -6);
    this.scene.add(rack3);
    this.collisionSystem.addObstacle('rack_3', new THREE.Vector3(-6.5, 2.7, -6), new THREE.Vector3(8.8, 5.4, 1.8));

    // Aisle 4 Far West Racks
    const rack4 = RackBuilder.createRack({ width: 9.0, height: 5.4, levels: 3, bays: 3 });
    rack4.position.set(-16, 0, 0);
    rack4.rotation.y = Math.PI / 2;
    this.scene.add(rack4);
    this.collisionSystem.addObstacle('rack_4', new THREE.Vector3(-16, 2.7, 0), new THREE.Vector3(1.8, 5.4, 9.2));

    // Hazard PEL-006: Unstable Pallet on top of rack at [-5, 3.8, 8]
    const unstableGroup = new THREE.Group();
    unstableGroup.position.set(-5, 3.8, 6.8);
    const palMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });
    const pal = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 1.2), palMat);
    unstableGroup.add(pal);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
    const leaningBox = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), boxMat);
    leaningBox.position.set(0.15, 0.65, 0.2);
    leaningBox.rotation.z = 0.22; // Incline dangerously!
    leaningBox.rotation.x = 0.18;
    leaningBox.castShadow = true;
    unstableGroup.add(leaningBox);
    this.scene.add(unstableGroup);
    this.hazardObjects.set('PEL-006', unstableGroup);

    // Hazard PEL-007: High storage hazard without back safety netting at [-9, 3.6, 2]
    const highDrums = new THREE.Group();
    highDrums.position.set(-9, 3.7, 1.5);
    const drumMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 });
    [-0.35, 0.35].forEach(dx => {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 16), drumMat);
      drum.position.set(dx, 0.45, 0.6); // Hanging off rear beam
      drum.castShadow = true;
      highDrums.add(drum);
    });
    this.scene.add(highDrums);
    this.hazardObjects.set('PEL-007', highDrums);

    // Hazard PEL-001: Blocked Extinguisher on column [-12, 1.2, -6]
    const extinguisherObj = ExtinguisherBuilder.createExtinguisher({ isBlocked: true });
    extinguisherObj.position.set(-12, 0, -6);
    this.scene.add(extinguisherObj);
    this.hazardObjects.set('PEL-001', extinguisherObj);
    this.collisionSystem.addObstacle('ext_obs', new THREE.Vector3(-12, 0.7, -5.6), new THREE.Vector3(1.2, 1.4, 1.2));
  }

  private buildMachineryAndElectrical() {
    // Zona 4: Área de Maquinaria (Right front quadrant: X: [6, 18], Z: [2, 15])
    // Milling press 1 (Unguarded hazard PEL-014 at [12, 1.1, 10])
    const machineUnguarded = MachineBuilder.createMachine({ hasGuard: false });
    machineUnguarded.position.set(12, 0, 10);
    machineUnguarded.rotation.y = -Math.PI / 2;
    this.scene.add(machineUnguarded);
    this.hazardObjects.set('PEL-014', machineUnguarded);
    this.collisionSystem.addObstacle('machine_1', new THREE.Vector3(12, 1.5, 10), new THREE.Vector3(2.6, 3.0, 2.2));

    // Milling press 2 (Guarded reference machine)
    const machineGuarded = MachineBuilder.createMachine({ hasGuard: true });
    machineGuarded.position.set(12, 0, 3);
    machineGuarded.rotation.y = -Math.PI / 2;
    this.scene.add(machineGuarded);
    this.collisionSystem.addObstacle('machine_2', new THREE.Vector3(12, 1.5, 3), new THREE.Vector3(2.6, 3.0, 2.2));

    // Heavy Workbench
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 0.9, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.4 })
    );
    bench.position.set(15, 0.45, 6.5);
    bench.castShadow = true;
    this.scene.add(bench);
    this.collisionSystem.addObstacle('bench', new THREE.Vector3(15, 0.45, 6.5), new THREE.Vector3(3.2, 1.0, 1.4));

    // Hazard PEL-015: Flammable solvents open near grinding workbench at [15, 0.6, 6]
    const solventGroup = new THREE.Group();
    solventGroup.position.set(15, 0.95, 6.2);
    const canMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.6, roughness: 0.3 });
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.32, 12), canMat);
    solventGroup.add(can);
    const jug = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.16), canMat);
    jug.position.set(0.22, 0, 0);
    solventGroup.add(jug);
    this.scene.add(solventGroup);
    this.hazardObjects.set('PEL-015', solventGroup);

    // Hazard PEL-002: Oil spill on floor at [4, 0.05, 5]
    const oilSpill = SpillBuilder.createSpill('oil');
    oilSpill.position.set(4, 0, 5);
    this.scene.add(oilSpill);
    this.hazardObjects.set('PEL-002', oilSpill);

    // Zona 5: Área Eléctrica (Northwest quadrant: X: [-20, -8], Z: [-18, -10])
    // Hazard PEL-013: Blocked Electrical Distribution Panel at [-18.5, 1.4, -12]
    const panelBlocked = ElectricalPanelBuilder.createPanel({ isBlocked: true });
    panelBlocked.position.set(-18.5, 0, -12);
    this.scene.add(panelBlocked);
    this.hazardObjects.set('PEL-013', panelBlocked);
    this.collisionSystem.addObstacle('panel_blocked_obs', new THREE.Vector3(-18.5, 1.0, -11.5), new THREE.Vector3(1.6, 2.0, 1.4));

    // Hazard PEL-003: Damaged live cable near electrical substation at [-8, 0.8, -14]
    const panelDamagedCable = ElectricalPanelBuilder.createPanel({ isBlocked: false, hasDamagedCable: true });
    panelDamagedCable.position.set(-8, 0, -14);
    this.scene.add(panelDamagedCable);
    this.hazardObjects.set('PEL-003', panelDamagedCable);
    this.collisionSystem.addObstacle('panel_elec_2', new THREE.Vector3(-8, 1.0, -14), new THREE.Vector3(1.4, 2.0, 0.8));

    // Electrical Substation Safety Cage Enclosure
    const cageWallMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });
    const cageWall = new THREE.Mesh(new THREE.BoxGeometry(6.0, 2.5, 0.05), cageWallMat);
    cageWall.position.set(-14, 1.25, -9.5);
    this.scene.add(cageWall);
    this.collisionSystem.addObstacle('cage_fence', new THREE.Vector3(-14, 1.25, -9.5), new THREE.Vector3(6.2, 2.5, 0.2));
  }

  private buildWalkwaysAndBarriers() {
    // Zona 7: Ruta de Evacuación (Along East Wall towards exit at [18.8, 1.5, 4])
    // Green floor walkway strip for evacuation
    const evacStripe = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 28),
      new THREE.MeshStandardMaterial({
        color: 0x16a34a,
        roughness: 0.5,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
      })
    );
    evacStripe.rotation.x = -Math.PI / 2;
    evacStripe.position.set(18.5, 0.01, 2);
    this.scene.add(evacStripe);

    // Hazard PEL-005: Blocked Emergency Exit Door at [18.8, 1.5, 4]
    const exitDoor = EmergencyExitBuilder.createExit({ isBlocked: true });
    exitDoor.position.set(21.9, 0, 4);
    exitDoor.rotation.y = -Math.PI / 2;
    this.scene.add(exitDoor);
    this.hazardObjects.set('PEL-005', exitDoor);
    this.collisionSystem.addObstacle('exit_block_obs', new THREE.Vector3(20.5, 1.2, 4), new THREE.Vector3(2.4, 2.4, 2.2));

    // Pedestrian Walkway Markings (Yellow pedestrian lines)
    const walkwayStripe = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 30),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7, // Blue pedestrian route
        roughness: 0.6,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
      })
    );
    walkwayStripe.rotation.x = -Math.PI / 2;
    walkwayStripe.position.set(0, 0.01, 0);
    this.scene.add(walkwayStripe);

    // Hazard PEL-004: Cable crossing pedestrian corridor at [6, 0.05, -7]
    const cableCrossing = CableBuilder.createCable({ isCrossingWalkway: true, length: 3.8 });
    cableCrossing.position.set(6, 0, -7);
    this.scene.add(cableCrossing);
    this.hazardObjects.set('PEL-004', cableCrossing);

    // Guardrails separating walkway in front of machinery
    const rail1 = SafetyBarrierBuilder.createGuardrail({ length: 5.0 });
    rail1.position.set(7.5, 0, 1.0);
    this.scene.add(rail1);
    this.collisionSystem.addObstacle('rail_1', new THREE.Vector3(7.5, 0.5, 1.0), new THREE.Vector3(5.2, 1.1, 0.3));

    // Safety bollards at corners
    const bollardCoords: [number, number][] = [
      [7.5, -1.8], [7.5, 8.5], [2.5, 8.5], [-1.2, 8.5]
    ];
    bollardCoords.forEach(([bx, bz]) => {
      const b = SafetyBarrierBuilder.createBollard();
      b.position.set(bx, 0, bz);
      this.scene.add(b);
      this.collisionSystem.addObstacle(`bollard_${bx}_${bz}`, new THREE.Vector3(bx, 0.6, bz), new THREE.Vector3(0.4, 1.2, 0.4));
    });

    // Hazard PEL-012: Blind crossing lacking segregation at [2, 0.05, -5]
    const blindZone = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 3.5),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    blindZone.position.set(2, 0.05, -5);
    this.scene.add(blindZone);
    this.hazardObjects.set('PEL-012', blindZone);
  }

  private buildForkliftsAndTraffic() {
    // Zona 3: Circulación de Montacargas
    // Hazard PEL-011: Forklift maneuvering dangerously close to pedestrians at [-1, 1.2, 0]
    const forkliftNearPedestrian = ForkliftBuilder.createForklift({ isOverloaded: false });
    forkliftNearPedestrian.position.set(-1, 0, 0);
    forkliftNearPedestrian.rotation.y = Math.PI / 4;
    this.scene.add(forkliftNearPedestrian);
    this.hazardObjects.set('PEL-011', forkliftNearPedestrian);
    this.collisionSystem.addObstacle('forklift_ped_obs', new THREE.Vector3(-1, 1.2, 0), new THREE.Vector3(2.2, 2.4, 3.0));

    // Zona 6: Zona de Carga y Descarga (Northeast corner: X: [8, 18], Z: [-16, -8])
    // Hazard PEL-016: Overloaded forklift blocking driver front sight at [10, 1.3, -12]
    const overloadedForklift = ForkliftBuilder.createForklift({ isOverloaded: true });
    overloadedForklift.position.set(10, 0, -12);
    overloadedForklift.rotation.y = -Math.PI / 3;
    this.scene.add(overloadedForklift);
    this.hazardObjects.set('PEL-016', overloadedForklift);
    this.collisionSystem.addObstacle('forklift_overloaded_obs', new THREE.Vector3(10, 1.4, -12), new THREE.Vector3(2.4, 2.8, 3.6));

    // Loading Dock Doors on North Wall
    const dockDoorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    [10, 15].forEach(dx => {
      const dockDoor = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.2, 0.15), dockDoorMat);
      dockDoor.position.set(dx, 2.1, -19.9);
      this.scene.add(dockDoor);

      // Dock bumper pads
      [-1.5, 1.5].forEach(bx => {
        const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.25), new THREE.MeshStandardMaterial({ color: 0x09090b }));
        bumper.position.set(dx + bx, 0.5, -19.7);
        this.scene.add(bumper);
      });
    });
  }

  private buildWorkers() {
    // Zona 2: Worker in racks without helmet (Hazard PEL-008 at [-3, 0.9, -4])
    const workerNoHelmet = WorkerBuilder.createWorker({
      hasHelmet: false, // VIOLATION!
      hasGoggles: true,
      isLiftingWrong: false,
      vestColor: 0xa3e635
    });
    workerNoHelmet.position.set(-3, 0, -4);
    workerNoHelmet.rotation.y = Math.PI / 3;
    this.scene.add(workerNoHelmet);
    this.hazardObjects.set('PEL-008', workerNoHelmet);
    this.collisionSystem.addObstacle('worker_no_helmet_obs', new THREE.Vector3(-3, 0.9, -4), new THREE.Vector3(0.8, 1.8, 0.8));

    // Zona 4: Worker grinding metal without eye protection goggles (Hazard PEL-009 at [7, 0.9, 8])
    const workerNoGoggles = WorkerBuilder.createWorker({
      hasHelmet: true,
      hasGoggles: false, // VIOLATION!
      isLiftingWrong: false,
      isGrinding: true,
      vestColor: 0xf97316
    });
    workerNoGoggles.position.set(7, 0, 8);
    workerNoGoggles.rotation.y = -Math.PI / 4;
    this.scene.add(workerNoGoggles);
    this.hazardObjects.set('PEL-009', workerNoGoggles);
    this.collisionSystem.addObstacle('worker_no_goggles_obs', new THREE.Vector3(7, 0.9, 8), new THREE.Vector3(0.8, 1.8, 0.8));

    // Zona 1: Worker lifting 28kg box with wrong ergonomic posture (Hazard PEL-010 at [9, 0.8, -3])
    const workerBadPosture = WorkerBuilder.createWorker({
      hasHelmet: true,
      hasGoggles: true,
      isLiftingWrong: true, // VIOLATION!
      vestColor: 0xa3e635
    });
    workerBadPosture.position.set(9, 0, -3);
    workerBadPosture.rotation.y = -Math.PI / 2;
    this.scene.add(workerBadPosture);
    this.hazardObjects.set('PEL-010', workerBadPosture);
    this.collisionSystem.addObstacle('worker_bad_posture_obs', new THREE.Vector3(9, 0.8, -3), new THREE.Vector3(1.2, 1.5, 1.2));

    // Extra compliant background workers (adds life and industrial realism)
    const compliantWorker1 = WorkerBuilder.createWorker({ hasHelmet: true, hasGoggles: true, vestColor: 0xa3e635 });
    compliantWorker1.position.set(-14, 0, -3);
    compliantWorker1.rotation.y = Math.PI / 2;
    this.scene.add(compliantWorker1);
    this.collisionSystem.addObstacle('worker_comp_1', new THREE.Vector3(-14, 0.9, -3), new THREE.Vector3(0.6, 1.8, 0.6));
  }

  public getHazardObject(hazardId: string): THREE.Object3D | undefined {
    return this.hazardObjects.get(hazardId);
  }
}
