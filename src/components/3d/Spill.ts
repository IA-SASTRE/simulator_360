import * as THREE from 'three';

export class SpillBuilder {
  public static createSpill(type: 'oil' | 'chemical' = 'oil'): THREE.Group {
    const group = new THREE.Group();
    group.name = 'FluidSpill';

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Irregular organic puddle shape with sheen
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 256, 256);

    const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 110);
    if (type === 'oil') {
      grad.addColorStop(0, 'rgba(24, 24, 27, 0.96)'); // Dark motor oil
      grad.addColorStop(0.5, 'rgba(39, 39, 42, 0.85)');
      grad.addColorStop(0.85, 'rgba(113, 63, 18, 0.7)'); // Amber-gold iridescent edge
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.9)'); // Bright toxic green coolant
      grad.addColorStop(0.7, 'rgba(5, 150, 105, 0.6)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(128, 128, 105, 0, Math.PI * 2);
    ctx.fill();

    // Secondary lobes
    ctx.beginPath();
    ctx.arc(80, 150, 45, 0, Math.PI * 2);
    ctx.arc(170, 95, 55, 0, Math.PI * 2);
    ctx.arc(160, 160, 40, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);

    const puddleMat = new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      roughness: 0.05, // Very slick / glossy reflection
      metalness: 0.6,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });

    const puddle = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.2), puddleMat);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.y = 0.015;
    group.add(puddle);

    return group;
  }
}
