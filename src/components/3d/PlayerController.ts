import * as THREE from 'three';
import { CollisionSystem } from './CollisionSystem';
import { audioEngine } from '../../services/audioEngine';
import { HazardDefinition } from '../../types/Hazard';

export interface RaycastHitResult {
  hazard: HazardDefinition | null;
  distance: number;
  canInspect: boolean;
  message: string;
}

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private collisionSystem: CollisionSystem;

  // Position & Velocity
  public position: THREE.Vector3 = new THREE.Vector3(0, 1.68, 14); // Starting near reception
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private moveSpeed: number = 4.2; // m/s walking speed
  private eyeHeight: number = 1.68;

  // Rotation angles (Euler angles in radians)
  private yaw: number = 0; // Horizontal rotation
  private pitch: number = 0; // Vertical rotation
  private minPitch: number = -Math.PI / 2.2; // ~-80 deg
  private maxPitch: number = Math.PI / 2.2;  // ~+80 deg

  // Key states
  private keys: { forward: boolean; backward: boolean; left: boolean; right: boolean } = {
    forward: false,
    backward: false,
    left: false,
    right: false
  };

  // Touch / Mobile virtual joystick input (-1 to 1)
  public mobileMoveX: number = 0;
  public mobileMoveY: number = 0;

  // Mouse / PointerLock state
  public isLocked: boolean = false;
  private isPointerDown: boolean = false;
  private prevPointerX: number = 0;
  private prevPointerY: number = 0;

  // Raycaster for hazard detection
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private screenCenter: THREE.Vector2 = new THREE.Vector2(0, 0); // Center of viewport (crosshair)

  // Head bobbing & footsteps
  private bobCycle: number = 0;
  private footstepTimer: number = 0;

  // Active hazards list for raycasting
  private activeHazards: HazardDefinition[] = [];
  public currentHit: RaycastHitResult = {
    hazard: null,
    distance: 0,
    canInspect: false,
    message: ''
  };

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement, collisionSystem: CollisionSystem) {
    this.camera = camera;
    this.domElement = domElement;
    this.collisionSystem = collisionSystem;

    this.initEvents();
    this.camera.position.copy(this.position);
    this.camera.rotation.order = 'YXZ';
  }

  public setHazards(hazards: HazardDefinition[]) {
    this.activeHazards = hazards;
  }

  public setPosition(x: number, y: number, z: number) {
    this.position.set(x, y, z);
    this.camera.position.set(x, y + this.eyeHeight, z);
  }

  private initEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    // Mouse look via PointerLock or drag fallback
    this.domElement.addEventListener('click', this.onClickCanvas);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('mousemove', this.onMouseMove);

    // Fallback drag for devices or when pointer lock is not active
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
    this.domElement.addEventListener('pointermove', this.onPointerDrag);
  }

  public dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.domElement.removeEventListener('click', this.onClickCanvas);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.domElement.removeEventListener('pointermove', this.onPointerDrag);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
    }
  };

  private onClickCanvas = () => {
    // Attempt pointer lock on desktop canvas click
    if (!this.isLocked && document.pointerLockElement !== this.domElement) {
      try {
        this.domElement.requestPointerLock?.();
      } catch {}
    }
  };

  private onPointerLockChange = () => {
    this.isLocked = document.pointerLockElement === this.domElement;
  };

  public requestLock() {
    try {
      this.domElement.requestPointerLock?.();
    } catch {}
  }

  public unlock() {
    try {
      if (document.exitPointerLock) {
        document.exitPointerLock();
      }
    } catch {}
    this.isLocked = false;
  }

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isLocked) return;
    const sensitivity = 0.0022;
    this.yaw -= e.movementX * sensitivity;
    this.pitch -= e.movementY * sensitivity;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
  };

  private onPointerDown = (e: PointerEvent) => {
    if (this.isLocked) return;
    this.isPointerDown = true;
    this.prevPointerX = e.clientX;
    this.prevPointerY = e.clientY;
  };

  private onPointerUp = () => {
    this.isPointerDown = false;
  };

  private onPointerDrag = (e: PointerEvent) => {
    if (this.isLocked || !this.isPointerDown) return;
    const dx = e.clientX - this.prevPointerX;
    const dy = e.clientY - this.prevPointerY;
    this.prevPointerX = e.clientX;
    this.prevPointerY = e.clientY;

    const sensitivity = 0.0035;
    this.yaw -= dx * sensitivity;
    this.pitch -= dy * sensitivity;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
  };

  public applyTouchLook(deltaX: number, deltaY: number) {
    const sensitivity = 0.004;
    this.yaw -= deltaX * sensitivity;
    this.pitch -= deltaY * sensitivity;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
  }

  public update(delta: number): RaycastHitResult {
    // 1. Calculate direction vector from yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

    // 2. Compute movement input
    const inputDir = new THREE.Vector3(0, 0, 0);

    if (this.keys.forward) inputDir.add(forward);
    if (this.keys.backward) inputDir.sub(forward);
    if (this.keys.right) inputDir.add(right);
    if (this.keys.left) inputDir.sub(right);

    // Add mobile joystick input if any
    if (Math.abs(this.mobileMoveX) > 0.05 || Math.abs(this.mobileMoveY) > 0.05) {
      inputDir.add(forward.clone().multiplyScalar(-this.mobileMoveY));
      inputDir.add(right.clone().multiplyScalar(this.mobileMoveX));
    }

    const isMoving = inputDir.lengthSq() > 0.01;

    if (isMoving) {
      inputDir.normalize();
      this.velocity.copy(inputDir).multiplyScalar(this.moveSpeed);

      // Footstep sound
      this.footstepTimer += delta;
      if (this.footstepTimer >= 0.42) {
        this.footstepTimer = 0;
        audioEngine.playFootstep();
      }

      // Head bobbing
      this.bobCycle += delta * 11;
    } else {
      this.velocity.set(0, 0, 0);
      this.footstepTimer = 0.3;
      this.bobCycle = 0;
    }

    // 3. Collision resolution
    const desiredPosition = this.position.clone().add(
      this.velocity.clone().multiplyScalar(delta)
    );
    const resolvedPosition = this.collisionSystem.resolveMovement(this.position, desiredPosition);
    this.position.copy(resolvedPosition);

    // 4. Update camera
    const bobOffset = isMoving ? Math.sin(this.bobCycle) * 0.035 : 0;
    this.camera.position.set(
      this.position.x,
      this.eyeHeight + bobOffset,
      this.position.z
    );

    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');

    // 5. Raycasting for Hazard Interaction
    this.currentHit = this.performHazardRaycast();
    return this.currentHit;
  }

  private performHazardRaycast(): RaycastHitResult {
    // Cast ray from center of camera into the scene
    this.raycaster.setFromCamera(this.screenCenter, this.camera);
    const ray = this.raycaster.ray;

    let closestHazard: HazardDefinition | null = null;
    let closestDist = Infinity;
    let closestRayDist = Infinity;

    for (let i = 0; i < this.activeHazards.length; i++) {
      const h = this.activeHazards[i];
      const hPos = new THREE.Vector3(...h.position);
      
      // Distance from player to hazard
      const playerDist = this.position.distanceTo(hPos);

      // Distance from ray to hazard center point (how closely the player is aiming at it)
      const rayDist = ray.distanceToPoint(hPos);
      const angleTolerance = Math.max(0.9, h.interactionRadius * 0.45);

      if (rayDist < angleTolerance && playerDist < 12) {
        if (playerDist < closestDist) {
          closestDist = playerDist;
          closestRayDist = rayDist;
          closestHazard = h;
        }
      }
    }

    if (closestHazard) {
      const maxInteractDist = closestHazard.interactionRadius || 3.0;
      if (closestDist <= maxInteractDist) {
        return {
          hazard: closestHazard,
          distance: closestDist,
          canInspect: true,
          message: 'INSPECCIONAR CONDICIÓN'
        };
      } else {
        return {
          hazard: closestHazard,
          distance: closestDist,
          canInspect: false,
          message: 'Acércate para inspeccionar'
        };
      }
    }

    return {
      hazard: null,
      distance: 0,
      canInspect: false,
      message: ''
    };
  }

  public getYaw(): number {
    return this.yaw;
  }
}
