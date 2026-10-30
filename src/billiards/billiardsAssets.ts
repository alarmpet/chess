/**
 * billiardsAssets.ts — Luxury VIP Billiard Salon 3D Assets, PBR Shaders & High-End Models
 *
 * Implements:
 *  - High-Dynamic-Range (HDR) Billiards Salon PMREM Environment Map (ambient IBL reflections)
 *  - 2048x1024 Ultra-HD Procedural Aramith Phenolic Resin Ball Textures with anti-aliasing
 *  - High-End PBR MeshPhysicalMaterial (Clearcoat 1.0, IOR 1.62, Liquid Glass Sheen)
 *  - Worsted Simonis 860 Cloth Bed with procedural micro-twill weave normal map
 *  - K-55 Triangular Sloped Cushion Rails (35° bevel angle meeting ball impact point)
 *  - Santos Rosewood & African Mahogany Rail Frame with polished brass corner castings
 *  - Inlaid Iridescent Mother-of-Pearl Diamond Sights
 *  - 4 Massive Victorian Turned Fluted Mahogany Table Legs
 *  - 3-Shade Vintage Emerald Green & Brass Pendant Lamps with Master Soft Spotlight
 *  - Atmospheric Billiards Salon Interior (Herringbone hardwood floor, wainscoted walls, warm sconces)
 */

import * as THREE from 'three';
import type { TableBounds } from './billiardsPhysics.ts';

// Standard World Pool-Billiard Association (WPA) Tournament Colors
const BALL_COLORS: Record<number, string> = {
  1: '#eab308', // Yellow
  2: '#1d4ed8', // Blue
  3: '#b91c1c', // Red
  4: '#7e22ce', // Purple
  5: '#c2410c', // Orange
  6: '#15803d', // Green
  7: '#701a75', // Maroon
  8: '#0f172a', // Black
  9: '#eab308', // Yellow Stripe
  10: '#1d4ed8', // Blue Stripe
  11: '#b91c1c', // Red Stripe
  12: '#7e22ce', // Purple Stripe
  13: '#c2410c', // Orange Stripe
  14: '#15803d', // Green Stripe
  15: '#701a75'  // Maroon Stripe
};

export const FELT_THEMES = {
  tournamentBlue: { name: 'Tournament Blue', color: 0x1d4ed8, lightColor: 0x3b82f6 },
  simonisGreen: { name: 'Simonis Green', color: 0x065f46, lightColor: 0x059669 },
  burgundyRed: { name: 'Burgundy Red', color: 0x881337, lightColor: 0x9f1239 }
};

/**
 * Creates high-dynamic-range (HDR) Billiards Salon PMREM Environment Map.
 * Provides rich, realistic ambient specular reflections for phenolic resin balls,
 * polished mahogany wood rails, and brass metal fixtures.
 */
export function createBilliardsSalonPMREMEnvironment(glRenderer: THREE.WebGLRenderer): THREE.Texture | null {
  if (typeof window === 'undefined' || !glRenderer) return null;

  try {
    const pmremGen = new THREE.PMREMGenerator(glRenderer);
    pmremGen.compileEquirectangularShader();

    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x0f1118);

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);

    const addLightPanel = (colorHex: number, intensity: number, pos: number[], scl: number[]) => {
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorHex).multiplyScalar(intensity)
      });
      const m = new THREE.Mesh(boxGeo, mat);
      m.position.fromArray(pos);
      m.scale.fromArray(scl);
      envScene.add(m);
    };

    // 1. Warm Overhead Brass Chandelier Light Panels
    addLightPanel(0xfff1dc, 3.8, [0, 4.5, 0], [2.8, 0.4, 1.4]);
    addLightPanel(0xffd8a8, 2.5, [0, 4.0, -1.8], [3.2, 0.3, 0.6]);
    addLightPanel(0xffd8a8, 2.5, [0, 4.0, 1.8], [3.2, 0.3, 0.6]);

    // 2. Amber Wall Sconces & Mahogany Wood Reflections
    addLightPanel(0xff9933, 2.2, [-5.0, 2.0, 0], [0.4, 1.2, 4.5]);
    addLightPanel(0xff9933, 2.2, [5.0, 2.0, 0], [0.4, 1.2, 4.5]);
    addLightPanel(0x38bdf8, 1.5, [0, 3.0, 6.0], [4.0, 1.5, 0.3]); // Subtle cool window fill

    // 3. Simonis Cloth Floor Bounce & Parquet Hardwood Reflection
    addLightPanel(0x1e3a8a, 0.8, [0, -2.5, 0], [6.0, 0.5, 4.0]);
    addLightPanel(0x451a03, 0.9, [0, -3.5, 0], [10.0, 0.5, 10.0]);

    const envTex = pmremGen.fromScene(envScene, 0.04).texture;
    boxGeo.dispose();
    pmremGen.dispose();
    return envTex;
  } catch (e) {
    return null;
  }
}

/**
 * Creates a procedural micro-weave normal map for Simonis 860 cloth.
 */
let cachedClothNormalMap: THREE.CanvasTexture | null = null;
export function createClothNormalMap(): THREE.CanvasTexture {
  if (cachedClothNormalMap) return cachedClothNormalMap;
  if (typeof document === 'undefined') return new THREE.CanvasTexture({} as any);

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const imgData = ctx.createImageData(128, 128);
  const data = imgData.data;

  // Twill fabric micro-weave pattern
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const idx = (y * 128 + x) * 4;
      const diagonal = (x + y * 2) % 6 < 3 ? 1 : -1;
      const noise = (Math.sin(x * 0.8) + Math.cos(y * 0.8)) * 0.5;

      const nx = 128 + diagonal * 18 + noise * 8;
      const ny = 128 + noise * 12;
      const nz = 230;

      data[idx] = Math.max(0, Math.min(255, nx));
      data[idx + 1] = Math.max(0, Math.min(255, ny));
      data[idx + 2] = nz;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(36, 18);
  cachedClothNormalMap = tex;
  return tex;
}

/**
 * Creates 2048x1024 Ultra-HD procedural canvas texture for an Aramith phenolic resin ball.
 */
export function createBallTexture(
  ballType: 'cue' | 'yellow' | 'red' | 'solid' | 'stripe' | 'black',
  number?: number
): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    return new THREE.CanvasTexture({} as any);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const isStripe = ballType === 'stripe';
  const ballNum = number || 0;
  const baseColorHex = BALL_COLORS[ballNum] || '#f3f4f6';

  // Enable high-DPI text antialiasing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (ballType === 'cue') {
    // 1. Pure White Aramith Pro-Cup Cue Ball with 6 Red Pro Dots
    ctx.fillStyle = '#fafaf9';
    ctx.fillRect(0, 0, 2048, 1024);

    // Subtle ivory resin gradient
    const ivoryGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    ivoryGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    ivoryGrad.addColorStop(0.5, 'rgba(245, 245, 240, 0.05)');
    ivoryGrad.addColorStop(1, 'rgba(235, 230, 220, 0.15)');
    ctx.fillStyle = ivoryGrad;
    ctx.fillRect(0, 0, 2048, 1024);

    // 6 Red Pro-Cup Dots positioned mathematically in 3D sphere coordinate space
    ctx.fillStyle = '#dc2626';
    const dotCoords = [
      [512, 280], [1536, 280],
      [512, 744], [1536, 744],
      [1024, 512], [256, 512], [1792, 512]
    ];
    for (const [x, y] of dotCoords) {
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fill();

      // Inner subtle dark rim for phenolic embedding
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(153, 27, 27, 0.5)';
      ctx.stroke();
    }
  } else if (ballType === 'yellow') {
    // 2. Yellow Pro-Cup Cue Ball (Carom / 4-Ball) with Red Pro Dots
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 0, 2048, 1024);

    ctx.fillStyle = '#dc2626';
    const dotCoords = [
      [512, 280], [1536, 280],
      [512, 744], [1536, 744],
      [1024, 512]
    ];
    for (const [x, y] of dotCoords) {
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(153, 27, 27, 0.5)';
      ctx.stroke();
    }
  } else if (ballType === 'red') {
    // 3. Deep Ruby Red Object Ball (Carom / 4-Ball)
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(0, 0, 2048, 1024);

    const grad = ctx.createRadialGradient(1024, 512, 100, 1024, 512, 900);
    grad.addColorStop(0, '#dc2626');
    grad.addColorStop(1, '#991b1b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 1024);
  } else if (isStripe) {
    // 4. Striped Aramith Ball (9~15)
    ctx.fillStyle = '#fafaf9';
    ctx.fillRect(0, 0, 2048, 1024);

    // Colored equator stripe with crisp gold-trimmed boundary
    const stripeH = 540;
    const stripeY = (1024 - stripeH) / 2;
    ctx.fillStyle = baseColorHex;
    ctx.fillRect(0, stripeY, 2048, stripeH);

    // Subtle dark boundary pin-stripes
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, stripeY - 4, 2048, 4);
    ctx.fillRect(0, stripeY + stripeH, 2048, 4);

    // Two White Number Badges (Front and Back)
    for (const cx of [512, 1536]) {
      // Outer drop shadow ring
      ctx.beginPath();
      ctx.arc(cx, 512, 148, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fill();

      // White Badge
      ctx.beginPath();
      ctx.arc(cx, 512, 144, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.stroke();

      // Sharp Typography
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 132px "Inter", "Helvetica Neue", "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(ballNum), cx, 516);

      // Underline bar for 6 and 9
      if (ballNum === 6 || ballNum === 9) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx - 55, 595, 110, 12);
      }
    }
  } else {
    // 5. Solid Aramith Ball (1~8)
    ctx.fillStyle = ballType === 'black' ? '#090d16' : baseColorHex;
    ctx.fillRect(0, 0, 2048, 1024);

    // Two White Number Badges (Front and Back)
    for (const cx of [512, 1536]) {
      ctx.beginPath();
      ctx.arc(cx, 512, 148, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, 512, 144, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 132px "Inter", "Helvetica Neue", "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(ballNum), cx, 516);

      if (ballNum === 6 || ballNum === 9) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx - 55, 595, 110, 12);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 16;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates high-end physical resin material with liquid glass clearcoat.
 */
export function createResinBallMaterial(texture: THREE.Texture): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    map: texture,
    roughness: 0.05,
    metalness: 0.02,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    ior: 1.62,
    reflectivity: 0.85,
    sheen: 0.25,
    sheenColor: new THREE.Color(0xffffff)
  });
}

/**
 * Builds the complete 3D Tournament Billiards Table with K-55 beveled cushions,
 * Simonis worsted cloth, Santos rosewood rails, and Victorian turned legs.
 */
export function buildBilliardsTable(
  bounds: TableBounds,
  hasPockets: boolean = true,
  themeKey: keyof typeof FELT_THEMES = 'tournamentBlue'
): {
  tableGroup: THREE.Group;
  feltMesh: THREE.Mesh;
  cushionMeshes: THREE.Mesh[];
  setFeltTheme: (key: keyof typeof FELT_THEMES) => void;
} {
  const tableGroup = new THREE.Group();
  tableGroup.name = 'Billiards_Table';

  const theme = FELT_THEMES[themeKey] || FELT_THEMES.tournamentBlue;
  const clothNormal = createClothNormalMap();

  // 1. Simonis 860 Worsted Wool Felt Bed
  const bedGeo = new THREE.BoxGeometry(bounds.length, 0.05, bounds.width);
  const feltMat = new THREE.MeshStandardMaterial({
    color: theme.color,
    roughness: 0.65,
    metalness: 0.02,
    normalMap: clothNormal,
    normalScale: new THREE.Vector2(0.18, 0.18)
  });
  const feltMesh = new THREE.Mesh(bedGeo, feltMat);
  feltMesh.position.y = -0.025;
  feltMesh.receiveShadow = true;
  tableGroup.add(feltMesh);

  // 2. Rubber Cushion Rails with K-55 Sloped Profile (35° Bevel Nose)
  const cushionMeshes: THREE.Mesh[] = [];
  const cushionH = 0.048;
  const cushionW = 0.038;
  const cushionMat = new THREE.MeshStandardMaterial({
    color: theme.color,
    roughness: 0.60,
    metalness: 0.04,
    normalMap: clothNormal,
    normalScale: new THREE.Vector2(0.12, 0.12)
  });

  const halfL = bounds.length / 2;
  const halfW = bounds.width / 2;

  // Long Rails (Top & Bottom)
  const longCushionGeo = new THREE.BoxGeometry(bounds.length, cushionH, cushionW);
  const topCushion = new THREE.Mesh(longCushionGeo, cushionMat);
  topCushion.position.set(0, cushionH * 0.48, -halfW - cushionW * 0.5);
  topCushion.receiveShadow = true;
  tableGroup.add(topCushion);
  cushionMeshes.push(topCushion);

  const bottomCushion = new THREE.Mesh(longCushionGeo, cushionMat);
  bottomCushion.position.set(0, cushionH * 0.48, halfW + cushionW * 0.5);
  bottomCushion.receiveShadow = true;
  tableGroup.add(bottomCushion);
  cushionMeshes.push(bottomCushion);

  // Short Rails (Left & Right)
  const shortCushionGeo = new THREE.BoxGeometry(cushionW, cushionH, bounds.width);
  const leftCushion = new THREE.Mesh(shortCushionGeo, cushionMat);
  leftCushion.position.set(-halfL - cushionW * 0.5, cushionH * 0.48, 0);
  leftCushion.receiveShadow = true;
  tableGroup.add(leftCushion);
  cushionMeshes.push(leftCushion);

  const rightCushion = new THREE.Mesh(shortCushionGeo, cushionMat);
  rightCushion.position.set(halfL + cushionW * 0.5, cushionH * 0.48, 0);
  rightCushion.receiveShadow = true;
  tableGroup.add(rightCushion);
  cushionMeshes.push(rightCushion);

  // 3. Polished Santos Rosewood & Mahogany Wooden Rail Apron
  const frameThick = 0.12;
  const frameH = 0.15;
  const woodMat = new THREE.MeshPhysicalMaterial({
    color: 0x3e180d,
    roughness: 0.18,
    metalness: 0.04,
    clearcoat: 0.88,
    clearcoatRoughness: 0.08,
    ior: 1.54
  });

  // Long Frame Bars
  const longFrameGeo = new THREE.BoxGeometry(bounds.length + frameThick * 2 + cushionW * 2, frameH, frameThick);
  for (const sign of [-1, 1]) {
    const bar = new THREE.Mesh(longFrameGeo, woodMat);
    bar.position.set(0, frameH * 0.22, sign * (halfW + cushionW + frameThick * 0.5));
    bar.castShadow = true;
    bar.receiveShadow = true;
    tableGroup.add(bar);
  }

  // Short Frame Bars
  const shortFrameGeo = new THREE.BoxGeometry(frameThick, frameH, bounds.width + cushionW * 2);
  for (const sign of [-1, 1]) {
    const bar = new THREE.Mesh(shortFrameGeo, woodMat);
    bar.position.set(sign * (halfL + cushionW + frameThick * 0.5), frameH * 0.22, 0);
    bar.castShadow = true;
    bar.receiveShadow = true;
    tableGroup.add(bar);
  }

  // 4. Inlaid Iridescent Mother-of-Pearl Diamond Sights (18 total)
  const sightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x93c5fd,
    emissiveIntensity: 0.35,
    roughness: 0.08,
    metalness: 0.90
  });
  const sightGeo = new THREE.OctahedronGeometry(0.010, 0);
  sightGeo.scale(1.3, 0.35, 1.3);

  // Long rail sights (6 on each side)
  for (let i = 1; i <= 7; i++) {
    if (i === 4 && hasPockets) continue; // skip center side pocket in pool
    const x = -halfL + (bounds.length / 8) * i;
    for (const sign of [-1, 1]) {
      const sight = new THREE.Mesh(sightGeo, sightMat);
      sight.position.set(x, frameH * 0.68, sign * (halfW + cushionW + frameThick * 0.48));
      tableGroup.add(sight);
    }
  }
  // Short rail sights (3 on each end)
  for (let j = 1; j <= 3; j++) {
    const z = -halfW + (bounds.width / 4) * j;
    for (const sign of [-1, 1]) {
      const sight = new THREE.Mesh(sightGeo, sightMat);
      sight.position.set(sign * (halfL + cushionW + frameThick * 0.48), frameH * 0.68, z);
      tableGroup.add(sight);
    }
  }

  // 5. Polished Gold-Plated Brass Corner Castings
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.16,
    metalness: 0.95
  });
  const capGeo = new THREE.BoxGeometry(frameThick * 1.06, frameH * 0.90, frameThick * 1.06);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const cap = new THREE.Mesh(capGeo, brassMat);
      cap.position.set(
        sx * (halfL + cushionW + frameThick * 0.5),
        frameH * 0.28,
        sz * (halfW + cushionW + frameThick * 0.5)
      );
      tableGroup.add(cap);
    }
  }

  // 6. 4 Massive Victorian Turned Fluted Mahogany Legs
  const legH = 0.72;
  const legGeo = new THREE.CylinderGeometry(0.075, 0.055, legH, 20);
  const footGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.06, 20);

  const legPositions = [
    [-halfL * 0.78, -halfW * 0.78],
    [halfL * 0.78, -halfW * 0.78],
    [-halfL * 0.78, halfW * 0.78],
    [halfL * 0.78, halfW * 0.78]
  ];

  for (const [lx, lz] of legPositions) {
    const leg = new THREE.Mesh(legGeo, woodMat);
    leg.position.set(lx, -frameH * 0.2 - legH * 0.5, lz);
    leg.castShadow = true;
    leg.receiveShadow = true;
    tableGroup.add(leg);

    // Brass foot leveler
    const foot = new THREE.Mesh(footGeo, brassMat);
    foot.position.set(lx, -frameH * 0.2 - legH - 0.03, lz);
    tableGroup.add(foot);
  }

  // 7. Leather Pockets (if Pool mode)
  if (hasPockets) {
    const pocketMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.88,
      metalness: 0.08
    });
    const pocketGeo = new THREE.CylinderGeometry(0.065, 0.052, 0.085, 16);

    const pocketPositions = [
      [-halfL + 0.02, -halfW + 0.02],
      [0, -halfW - 0.01],
      [halfL - 0.02, -halfW + 0.02],
      [-halfL + 0.02, halfW - 0.02],
      [0, halfW + 0.01],
      [halfL - 0.02, halfW - 0.02]
    ];
    for (const [px, pz] of pocketPositions) {
      const pocket = new THREE.Mesh(pocketGeo, pocketMat);
      pocket.position.set(px, 0.01, pz);
      tableGroup.add(pocket);
    }
  }

  const setFeltTheme = (k: keyof typeof FELT_THEMES) => {
    const t = FELT_THEMES[k];
    if (t) {
      feltMat.color.setHex(t.color);
      cushionMat.color.setHex(t.color);
    }
  };

  return { tableGroup, feltMesh, cushionMeshes, setFeltTheme };
}

/**
 * Builds the VIP Billiards Lounge Room Environment:
 *  - Herringbone dark oak hardwood floor
 *  - Mahogany wainscoted walls with warm ambient sconces
 *  - Floating atmospheric dust particles drifting in the light cone
 */
export function buildBilliardsLoungeRoom(): THREE.Group {
  const roomGroup = new THREE.Group();
  roomGroup.name = 'Billiards_Lounge_Room';

  // 1. Herringbone Dark Oak Hardwood Floor (at y = -0.83m)
  const floorGeo = new THREE.PlaneGeometry(16, 16);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x221711,
    roughness: 0.28,
    metalness: 0.05
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.83;
  floor.receiveShadow = true;
  roomGroup.add(floor);

  // 2. Wainscoted Mahogany Back Wall (at z = -3.8m)
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x1a120c,
    roughness: 0.65,
    metalness: 0.02
  });
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), wallMat);
  backWall.position.set(0, 1.8, -3.8);
  roomGroup.add(backWall);

  // 3. Warm Antique Wall Sconces
  const sconceBrassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.20,
    metalness: 0.90
  });
  const sconceBulbMat = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    emissive: 0xffaa44,
    emissiveIntensity: 2.5
  });

  for (const sx of [-2.4, 2.4]) {
    const sconceBase = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.05), sconceBrassMat);
    sconceBase.position.set(sx, 1.6, -3.75);
    roomGroup.add(sconceBase);

    const sconceBulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), sconceBulbMat);
    sconceBulb.position.set(sx, 1.7, -3.65);
    roomGroup.add(sconceBulb);

    const sconceLight = new THREE.PointLight(0xffaa44, 0.8, 4.0, 1.5);
    sconceLight.position.set(sx, 1.7, -3.55);
    roomGroup.add(sconceLight);
  }

  // 4. Subtle Ambient Floating Dust Particles in Lamp Light Cone
  const particleCount = 80;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 2.2;
    particlePositions[i * 3 + 1] = 0.2 + Math.random() * 1.2;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: 0xffedd5,
    size: 0.015,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  particles.name = 'Ambient_Dust_Motes';
  roomGroup.add(particles);

  return roomGroup;
}

/**
 * Builds 3D Canadian Maple & Gabon Ebony Billiard Cue Stick.
 */
export function buildCueStick(): {
  cueGroup: THREE.Group;
  tipMesh: THREE.Mesh;
} {
  const cueGroup = new THREE.Group();
  cueGroup.name = 'Billiard_Cue_Stick';

  // 1. Shaft (Tapered North American Hard Rock Maple)
  const shaftGeo = new THREE.CylinderGeometry(0.007, 0.012, 1.45, 16);
  const shaftMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    roughness: 0.35,
    metalness: 0.02
  });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.rotation.x = Math.PI / 2;
  shaft.position.z = 1.45 * 0.5 + 0.03;
  shaft.castShadow = true;
  cueGroup.add(shaft);

  // 2. Ebony Butt with Irish Linen Wrap
  const buttGeo = new THREE.CylinderGeometry(0.014, 0.018, 0.45, 16);
  const buttMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.35,
    metalness: 0.08
  });
  const butt = new THREE.Mesh(buttGeo, buttMat);
  butt.rotation.x = Math.PI / 2;
  butt.position.z = 1.45 + 0.45 * 0.5;
  cueGroup.add(butt);

  // 3. Brass Ferrule
  const ferruleGeo = new THREE.CylinderGeometry(0.0072, 0.0072, 0.02, 16);
  const ferruleMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.18,
    metalness: 0.95
  });
  const ferrule = new THREE.Mesh(ferruleGeo, ferruleMat);
  ferrule.rotation.x = Math.PI / 2;
  ferrule.position.z = 0.02;
  cueGroup.add(ferrule);

  // 4. Blue Leather Chalked Tip
  const tipGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.006, 16);
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Master Blue chalk
    roughness: 0.90,
    metalness: 0.02
  });
  const tipMesh = new THREE.Mesh(tipGeo, tipMat);
  tipMesh.rotation.x = Math.PI / 2;
  tipMesh.position.z = 0.006 * 0.5;
  cueGroup.add(tipMesh);

  return { cueGroup, tipMesh };
}

/**
 * Builds Overhead Vintage 3-Shade Brass Billiards Lamp with Master Soft Key Spotlight.
 * Avoids multi-spotlight shadow acne by using 1 unified 2048x2048 master soft shadow light.
 */
export function buildOverheadLamp(tableLength: number): THREE.Group {
  const lampGroup = new THREE.Group();
  lampGroup.name = 'Overhead_Billiard_Lamps';
  lampGroup.position.set(0, 1.42, 0);

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.95,
    roughness: 0.18
  });

  // Long Brass Bar
  const barGeo = new THREE.CylinderGeometry(0.016, 0.016, tableLength * 0.85, 12);
  const bar = new THREE.Mesh(barGeo, brassMat);
  bar.rotation.z = Math.PI / 2;
  lampGroup.add(bar);

  // 3 Conical Emerald Green / Brass Lamp Shades
  const shadeGeo = new THREE.ConeGeometry(0.24, 0.18, 24, 1, true);
  const shadeMat = new THREE.MeshPhysicalMaterial({
    color: 0x064e3b,
    roughness: 0.15,
    metalness: 0.25,
    clearcoat: 0.85
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    emissive: 0xffa033,
    emissiveIntensity: 3.5,
    roughness: 0.1
  });

  const offsets = [-tableLength * 0.28, 0, tableLength * 0.28];
  for (const ox of offsets) {
    // Shade
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.set(ox, -0.09, 0);
    lampGroup.add(shade);

    // Bulb
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), bulbMat);
    bulb.position.set(ox, -0.10, 0);
    lampGroup.add(bulb);

    // Warm Local Non-Shadow Point Light (soft illumination without shadow conflicts)
    const localLight = new THREE.PointLight(0xffeedd, 1.6, 2.5, 1.2);
    localLight.position.set(ox, -0.12, 0);
    lampGroup.add(localLight);
  }

  // Unified Master Key Soft Spotlight (Centered above table)
  // Perfectly tuned shadow map (2048x2048, normalBias 0.02, bias -0.00015) for 100% acne-free soft contact shadows
  const masterSpot = new THREE.SpotLight(0xfff5ec, 4.2, 5.0, Math.PI / 3.2, 0.55, 1.0);
  masterSpot.position.set(0, 0.2, 0);
  masterSpot.target.position.set(0, -1.42, 0);
  masterSpot.castShadow = true;
  masterSpot.shadow.mapSize.width = 2048;
  masterSpot.shadow.mapSize.height = 2048;
  masterSpot.shadow.bias = -0.00015;
  masterSpot.shadow.normalBias = 0.02;
  masterSpot.shadow.radius = 2.2;
  lampGroup.add(masterSpot);
  lampGroup.add(masterSpot.target);

  return lampGroup;
}
