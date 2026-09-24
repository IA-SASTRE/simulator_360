import * as THREE from 'three';

export class TextureGenerator {
  private static cache: Map<string, THREE.CanvasTexture> = new Map();

  public static getConcreteFloorTexture(): THREE.CanvasTexture {
    const key = 'concrete_floor';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Concrete base tone
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(0, 0, size, size);

    // Subtle noise & mottling
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 24;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Expansion joints grid lines
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    this.cache.set(key, texture);
    return texture;
  }

  public static getSafetyStripeTexture(): THREE.CanvasTexture {
    const key = 'safety_stripes';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#eab308'; // Safety yellow
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#18181b'; // Dark black/zinc
    ctx.beginPath();
    const stripeWidth = 32;
    for (let x = -size; x < size * 2; x += stripeWidth * 2) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth - size, size);
      ctx.lineTo(x - size, size);
      ctx.closePath();
    }
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, texture);
    return texture;
  }

  public static getMetalWallTexture(): THREE.CanvasTexture {
    const key = 'metal_wall';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const width = 256;
    const height = 256;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(0, 0, width, height);

    // Corrugation vertical ridges
    const ridgeStep = 16;
    for (let x = 0; x < width; x += ridgeStep) {
      ctx.fillStyle = '#52525b';
      ctx.fillRect(x, 0, ridgeStep / 2, height);
      ctx.fillStyle = '#27272a';
      ctx.fillRect(x + ridgeStep / 2, 0, ridgeStep / 2, height);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 4);
    this.cache.set(key, texture);
    return texture;
  }

  public static getSignTexture(type: 'exit' | 'fire' | 'electric' | 'pedestrian' | 'forklift'): THREE.CanvasTexture {
    const key = 'sign_' + type;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    if (type === 'exit') {
      ctx.fillStyle = '#15803d'; // Green
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 10;
      ctx.strokeRect(12, 12, size - 24, size - 24);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SALIDA DE', size / 2, 80);
      ctx.fillText('EMERGENCIA', size / 2, 135);

      // Arrow
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(size / 2 - 40, 190);
      ctx.lineTo(size / 2 + 20, 190);
      ctx.lineTo(size / 2 + 20, 175);
      ctx.lineTo(size / 2 + 50, 200);
      ctx.lineTo(size / 2 + 20, 225);
      ctx.lineTo(size / 2 + 20, 210);
      ctx.lineTo(size / 2 - 40, 210);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'fire') {
      ctx.fillStyle = '#b91c1c'; // Red
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 10;
      ctx.strokeRect(12, 12, size - 24, size - 24);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EXTINTOR', size / 2, 70);
      ctx.font = '22px sans-serif';
      ctx.fillText('PQS 9 KG', size / 2, 105);

      // Extinguisher icon
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(size / 2 - 18, 125, 36, 85);
      ctx.beginPath();
      ctx.arc(size / 2, 125, 18, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(size / 2 - 8, 210, 16, 12);
      ctx.fillRect(size / 2 - 6, 100, 12, 10);
    } else if (type === 'electric') {
      ctx.fillStyle = '#eab308'; // Safety yellow
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 12;
      ctx.strokeRect(10, 10, size - 20, size - 20);

      // Lightning triangle
      ctx.fillStyle = '#18181b';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PELIGRO', size / 2, 65);
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('ALTO VOLTAJE', size / 2, 98);
      ctx.font = '20px sans-serif';
      ctx.fillText('440 VOLTIOS', size / 2, 125);

      // Lightning bolt icon
      ctx.beginPath();
      ctx.moveTo(size / 2 + 10, 140);
      ctx.lineTo(size / 2 - 20, 185);
      ctx.lineTo(size / 2 - 5, 185);
      ctx.lineTo(size / 2 - 15, 230);
      ctx.lineTo(size / 2 + 25, 175);
      ctx.lineTo(size / 2 + 5, 175);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'forklift') {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 12;
      ctx.strokeRect(10, 10, size - 20, size - 20);

      ctx.fillStyle = '#18181b';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PRECAUCIÓN', size / 2, 60);
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('TRÁNSITO DE', size / 2, 90);
      ctx.fillText('MONTACARGAS', size / 2, 120);

      // Forklift simple silhouette
      ctx.fillRect(size / 2 - 40, 150, 50, 45);
      ctx.fillRect(size / 2 + 10, 160, 30, 8);
      ctx.fillRect(size / 2 + 35, 140, 6, 45);
      ctx.beginPath();
      ctx.arc(size / 2 - 25, 200, 14, 0, Math.PI * 2);
      ctx.arc(size / 2 + 15, 200, 14, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Pedestrian
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 10;
      ctx.strokeRect(12, 12, size - 24, size - 24);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ZONA PEATONAL', size / 2, 70);
      ctx.font = '22px sans-serif';
      ctx.fillText('OBLIGATORIA', size / 2, 100);

      // Walking figure
      ctx.beginPath();
      ctx.arc(size / 2, 135, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(size / 2 - 10, 155, 20, 45);
      ctx.fillRect(size / 2 - 18, 200, 12, 35);
      ctx.fillRect(size / 2 + 6, 200, 12, 35);
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }
}
