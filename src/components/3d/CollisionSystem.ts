import * as THREE from 'three';

export interface CollisionObstacle {
  id: string;
  box: THREE.Box3;
  name?: string;
}

export class CollisionSystem {
  private obstacles: CollisionObstacle[] = [];
  private playerRadius: number = 0.45; // 45cm body clearance
  private playerHeight: number = 1.72; // eye level ~1.68m
  private tempBox: THREE.Box3 = new THREE.Box3();
  private warehouseBounds: THREE.Box3;

  constructor() {
    // Total warehouse floor limits: X: [-23, 23], Z: [-21, 21]
    this.warehouseBounds = new THREE.Box3(
      new THREE.Vector3(-22.2, 0, -20.2),
      new THREE.Vector3(22.2, 8, 20.2)
    );
  }

  public clear() {
    this.obstacles = [];
  }

  public addObstacle(id: string, center: THREE.Vector3, size: THREE.Vector3, name?: string) {
    const min = new THREE.Vector3(
      center.x - size.x / 2,
      center.y - size.y / 2,
      center.z - size.z / 2
    );
    const max = new THREE.Vector3(
      center.x + size.x / 2,
      center.y + size.y / 2,
      center.z + size.z / 2
    );
    const box = new THREE.Box3(min, max);
    this.obstacles.push({ id, box, name });
  }

  public addBox(id: string, box: THREE.Box3, name?: string) {
    this.obstacles.push({ id, box: box.clone(), name });
  }

  public checkPositionValid(pos: THREE.Vector3): boolean {
    // 1. Check perimeter bounds
    if (
      pos.x < this.warehouseBounds.min.x ||
      pos.x > this.warehouseBounds.max.x ||
      pos.z < this.warehouseBounds.min.z ||
      pos.z > this.warehouseBounds.max.z
    ) {
      return false;
    }

    // 2. Check player cylinder/AABB with all registered obstacles
    this.tempBox.min.set(
      pos.x - this.playerRadius,
      0.1,
      pos.z - this.playerRadius
    );
    this.tempBox.max.set(
      pos.x + this.playerRadius,
      this.playerHeight,
      pos.z + this.playerRadius
    );

    for (let i = 0; i < this.obstacles.length; i++) {
      if (this.tempBox.intersectsBox(this.obstacles[i].box)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Resolves collision with sliding along unobstructed axes
   */
  public resolveMovement(
    currentPos: THREE.Vector3,
    desiredPos: THREE.Vector3
  ): THREE.Vector3 {
    // Try direct movement
    if (this.checkPositionValid(desiredPos)) {
      return desiredPos.clone();
    }

    // Try sliding along X
    const tryX = new THREE.Vector3(desiredPos.x, desiredPos.y, currentPos.z);
    if (this.checkPositionValid(tryX)) {
      return tryX;
    }

    // Try sliding along Z
    const tryZ = new THREE.Vector3(currentPos.x, desiredPos.y, desiredPos.z);
    if (this.checkPositionValid(tryZ)) {
      return tryZ;
    }

    // Blocked on both axes
    return currentPos.clone();
  }

  public getObstacles(): CollisionObstacle[] {
    return this.obstacles;
  }
}
