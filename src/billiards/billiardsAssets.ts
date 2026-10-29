/**
 * billiardsAssets.ts — Procedural 3D Billiards Assets, Shaders & Table Model
 *
 * Implements:
 *  - 100% Volumetric Aramith Phenolic Resin Ball textures (1~15 numbers, stripes/solids, red dots cue balls)
 *  - High-End PBR MeshPhysicalMaterial (Clearcoat 0.95, IOR 1.62, Liquid Resin Gloss)
 *  - Tournament Billiards Table (Simonis 860 felt, mahogany wood, rubber cushions, pearl diamond sights)
 *  - 3D Maple & Ebony Billiard Cue Stick with leather tip and blue chalk
 *  - Overhead Vintage 3-Shade Brass/Green Billiard Pendant Lamps
 */

import * as THREE from 'three';
import type { TableBounds } from './billiardsPhysics.ts';

// Standard World Pool-Billiard Association (WPA) Tournament Colors
const BALL_COLORS: Record<number, string> = {
  1: '#facc15', // Yellow
  2: '#2563eb', // Blue
  3: '#dc2626', // Red
  4: '#9333ea', // Purple
  5: '#ea580c', // Orange
  6: '#16a34a', // Green
  7: '#831843', // Maroon
  8: '#111827', // Black
  9: '#facc15', // Yellow Stripe
  10: '#2563eb', // Blue Stripe
  11: '#dc2626', // Red Stripe
  12: '#9333ea', // Purple Stripe
  13: '#ea580c', // Orange Stripe
  14: '#16a34a', // Green Stripe
  15: '#831843'  // Maroon Stripe
};

export const FELT_THEMES = {
  tournamentBlue: { name: 'Tournament Blue', color: 0x1d4ed8, lightColor: 0x2563eb },
  simonisGreen: { name: 'Simonis Green', color: 0x047857, lightColor: 0x059669 },
  burgundyRed: { name: 'Burgundy Red', color: 0x881337, lightColor: 0x9f1239 }
};

/**
 * Creates high-resolution procedural canvas texture for an Aramith phenolic resin ball.
 */
export function createBallTexture(
  ballType: 'cue' | 'yellow' | 'red' | 'solid' | 'stripe' | 'black',
  number?: number
): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    return new THREE.CanvasTexture({} as any);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const isStripe = ballType === 'stripe';
  const ballNum = number || 0;
  const baseColorHex = BALL_COLORS[ballNum] || '#f3f4f6';

  // 1. Background
  if (ballType === 'cue') {
    // Pure White Cue Ball with 6 Aramith Red Pro Dots
    ctx.fillStyle = '#fafaf9';
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#dc2626';
    const dotPositions = [
      [128, 64], [384, 64], [128, 192], [384, 192], [256, 128], [64, 128]
    ];
    for (const [x, y] of dotPositions) {
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ballType === 'yellow') {
    // Yellow Cue Ball (Carom / 4-Ball) with Red Pro Dots
    ctx.fillStyle = '#fde047';
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#dc2626';
    const dotPositions = [
      [128, 64], [384, 64], [128, 192], [384, 192], [256, 128]
    ];
    for (const [x, y] of dotPositions) {
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ballType === 'red') {
    // Pure Red Object Ball (Carom / 4-Ball)
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(0, 0, 512, 256);
  } else if (isStripe) {
    // Striped Ball (9~15): White body with colored equator stripe
    ctx.fillStyle = '#f5f5f4';
    ctx.fillRect(0, 0, 512, 256);

    // Colored stripe
    ctx.fillStyle = baseColorHex;
    ctx.fillRect(0, 56, 512, 144);

    // Two White Number Discs (front and back)
    for (const cx of [128, 384]) {
      ctx.fillStyle = '#fafaf9';
      ctx.beginPath();
      ctx.arc(cx, 128, 38, 0, Math.PI * 2);
      ctx.fill();

      // Number text
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 36px "Inter", "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(ballNum), cx, 129);

      // Underline for 6 and 9
      if (ballNum === 6 || ballNum === 9) {
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 16, 148);
        ctx.lineTo(cx + 16, 148);
        ctx.stroke();
      }
    }
  } else {
    // Solid Ball (1~8)
    ctx.fillStyle = ballType === 'black' ? '#111827' : baseColorHex;
    ctx.fillRect(0, 0, 512, 256);

    // White Number Discs (front and back)
    for (const cx of [128, 384]) {
      ctx.fillStyle = '#fafaf9';
      ctx.beginPath();
      ctx.arc(cx, 128, 38, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 36px "Inter", "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(ballNum), cx, 129);

      if (ballNum === 6 || ballNum === 9) {
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 16, 148);
        ctx.lineTo(cx + 16, 148);
        ctx.stroke();
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates high-end physical resin material for a billiard ball.
 */
export function createResinBallMaterial(texture: THREE.Texture): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    map: texture,
    roughness: 0.08,
    metalness: 0.02,
    clearcoat: 0.95,
    clearcoatRoughness: 0.05,
    ior: 1.62,
    reflectivity: 0.65
  });
}

/**
 * Builds the complete 3D Tournament Billiards Table
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

  // 1. Simonis 860 Wool Felt Bed
  const bedGeo = new THREE.BoxGeometry(bounds.length, 0.05, bounds.width);
  const feltMat = new THREE.MeshStandardMaterial({
    color: theme.color,
    roughness: 0.72,
    metalness: 0.04
  });
  const feltMesh = new THREE.Mesh(bedGeo, feltMat);
  feltMesh.position.y = -0.025;
  feltMesh.receiveShadow = true;
  tableGroup.add(feltMesh);

  // 2. Rubber Cushion Rails (K-55 Profile)
  const cushionMeshes: THREE.Mesh[] = [];
  const cushionH = 0.05;
  const cushionW = 0.038;
  const cushionMat = new THREE.MeshStandardMaterial({
    color: theme.color,
    roughness: 0.68,
    metalness: 0.05
  });

  const halfL = bounds.length / 2;
  const halfW = bounds.width / 2;

  // Long Rails (Top & Bottom)
  const longCushionGeo = new THREE.BoxGeometry(bounds.length, cushionH, cushionW);
  const topCushion = new THREE.Mesh(longCushionGeo, cushionMat);
  topCushion.position.set(0, cushionH * 0.5, -halfW - cushionW * 0.5);
  topCushion.castShadow = true;
  topCushion.receiveShadow = true;
  tableGroup.add(topCushion);
  cushionMeshes.push(topCushion);

  const bottomCushion = new THREE.Mesh(longCushionGeo, cushionMat);
  bottomCushion.position.set(0, cushionH * 0.5, halfW + cushionW * 0.5);
  bottomCushion.castShadow = true;
  bottomCushion.receiveShadow = true;
  tableGroup.add(bottomCushion);
  cushionMeshes.push(bottomCushion);

  // Short Rails (Left & Right)
  const shortCushionGeo = new THREE.BoxGeometry(cushionW, cushionH, bounds.width);
  const leftCushion = new THREE.Mesh(shortCushionGeo, cushionMat);
  leftCushion.position.set(-halfL - cushionW * 0.5, cushionH * 0.5, 0);
  leftCushion.castShadow = true;
  leftCushion.receiveShadow = true;
  tableGroup.add(leftCushion);
  cushionMeshes.push(leftCushion);

  const rightCushion = new THREE.Mesh(shortCushionGeo, cushionMat);
  rightCushion.position.set(halfL + cushionW * 0.5, cushionH * 0.5, 0);
  rightCushion.castShadow = true;
  rightCushion.receiveShadow = true;
  tableGroup.add(rightCushion);
  cushionMeshes.push(rightCushion);

  // 3. Polished Solid Mahogany Outer Wooden Frame
  const frameThick = 0.12;
  const frameH = 0.14;
  const woodMat = new THREE.MeshPhysicalMaterial({
    color: 0x3b180d,
    roughness: 0.26,
    metalness: 0.05,
    clearcoat: 0.75,
    clearcoatRoughness: 0.14
  });

  // Long Frame Bars
  const longFrameGeo = new THREE.BoxGeometry(bounds.length + frameThick * 2 + cushionW * 2, frameH, frameThick);
  for (const sign of [-1, 1]) {
    const bar = new THREE.Mesh(longFrameGeo, woodMat);
    bar.position.set(0, frameH * 0.25, sign * (halfW + cushionW + frameThick * 0.5));
    bar.castShadow = true;
    bar.receiveShadow = true;
    tableGroup.add(bar);
  }

  // Short Frame Bars
  const shortFrameGeo = new THREE.BoxGeometry(frameThick, frameH, bounds.width + cushionW * 2);
  for (const sign of [-1, 1]) {
    const bar = new THREE.Mesh(shortFrameGeo, woodMat);
    bar.position.set(sign * (halfL + cushionW + frameThick * 0.5), frameH * 0.25, 0);
    bar.castShadow = true;
    bar.receiveShadow = true;
    tableGroup.add(bar);
  }

  // 4. Inlaid Mother-of-Pearl Diamond Sights (18 total)
  const sightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x93c5fd,
    emissiveIntensity: 0.45,
    roughness: 0.15,
    metalness: 0.85
  });
  const sightGeo = new THREE.OctahedronGeometry(0.009, 0);
  sightGeo.scale(1.2, 0.4, 1.2);

  // Long rail sights (6 on each side)
  for (let i = 1; i <= 7; i++) {
    if (i === 4) continue; // skip center side pocket
    const x = -halfL + (bounds.length / 8) * i;
    for (const sign of [-1, 1]) {
      const sight = new THREE.Mesh(sightGeo, sightMat);
      sight.position.set(x, frameH * 0.70, sign * (halfW + cushionW + frameThick * 0.48));
      tableGroup.add(sight);
    }
  }
  // Short rail sights (3 on each end)
  for (let j = 1; j <= 3; j++) {
    const z = -halfW + (bounds.width / 4) * j;
    for (const sign of [-1, 1]) {
      const sight = new THREE.Mesh(sightGeo, sightMat);
      sight.position.set(sign * (halfL + cushionW + frameThick * 0.48), frameH * 0.70, z);
      tableGroup.add(sight);
    }
  }

  // 5. Brass Corner Caps
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.22,
    metalness: 0.92
  });
  const capGeo = new THREE.BoxGeometry(frameThick * 1.05, frameH * 0.85, frameThick * 1.05);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const cap = new THREE.Mesh(capGeo, brassMat);
      cap.position.set(
        sx * (halfL + cushionW + frameThick * 0.5),
        frameH * 0.32,
        sz * (halfW + cushionW + frameThick * 0.5)
      );
      tableGroup.add(cap);
    }
  }

  // 6. Leather Pockets (if Pool mode)
  if (hasPockets) {
    const pocketMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.85,
      metalness: 0.1
    });
    const pocketGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.09, 16);

    const pocketPositions = [
      [-halfL + 0.02, -halfW + 0.02],
      [0, -halfW - 0.01],
      [halfL - 0.02, -halfW + 0.02],
      [-halfL + 0.02, halfW - 0.02],
      [0, halfW + 0.01],
      [halfL - 0.02, halfW - 0.02]
    ];
    for (const [px, pz] of pocketPositions) {
      const pMesh = new THREE.Mesh(pocketGeo, pocketMat);
      pMesh.position.set(px, -0.045, pz);
      tableGroup.add(pMesh);
    }
  }

  // 7. Sturdy Wooden Turned Table Legs (4 corners)
  const legGeo = new THREE.CylinderGeometry(0.08, 0.055, 0.68, 16);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, woodMat);
      leg.position.set(
        sx * (halfL - 0.12),
        -0.34,
        sz * (halfW - 0.08)
      );
      leg.castShadow = true;
      leg.receiveShadow = true;
      tableGroup.add(leg);
    }
  }

  function setFeltTheme(key: keyof typeof FELT_THEMES) {
    const th = FELT_THEMES[key] || FELT_THEMES.tournamentBlue;
    feltMat.color.setHex(th.color);
    cushionMat.color.setHex(th.color);
  }

  return { tableGroup, feltMesh, cushionMeshes, setFeltTheme };
}

/**
 * Builds the 3D Billiards Cue Stick
 */
export function buildCueStick(): {
  cueGroup: THREE.Group;
  tipMesh: THREE.Mesh;
} {
  const cueGroup = new THREE.Group();
  cueGroup.name = 'Billiard_Cue_Stick';

  // 1. Tapered Maple Shaft (Length: 1.45m)
  const shaftGeo = new THREE.CylinderGeometry(0.007, 0.015, 1.45, 16);
  const shaftMat = new THREE.MeshStandardMaterial({
    color: 0xf3e8d2, // Canadian Birdseye Maple
    roughness: 0.32,
    metalness: 0.02
  });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.rotation.x = Math.PI / 2;
  shaft.position.z = 1.45 * 0.5 + 0.03;
  shaft.castShadow = true;
  cueGroup.add(shaft);

  // 2. Ebony Butt with Irish Linen Wrap
  const buttGeo = new THREE.CylinderGeometry(0.015, 0.018, 0.45, 16);
  const buttMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.40,
    metalness: 0.1
  });
  const butt = new THREE.Mesh(buttGeo, buttMat);
  butt.rotation.x = Math.PI / 2;
  butt.position.z = 1.45 + 0.45 * 0.5;
  cueGroup.add(butt);

  // 3. Brass Ferrule
  const ferruleGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.02, 16);
  const ferruleMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.20,
    metalness: 0.92
  });
  const ferrule = new THREE.Mesh(ferruleGeo, ferruleMat);
  ferrule.rotation.x = Math.PI / 2;
  ferrule.position.z = 0.02;
  cueGroup.add(ferrule);

  // 4. Blue Leather Chalked Tip
  const tipGeo = new THREE.CylinderGeometry(0.0068, 0.0068, 0.006, 16);
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Blue chalk
    roughness: 0.90,
    metalness: 0.05
  });
  const tipMesh = new THREE.Mesh(tipGeo, tipMat);
  tipMesh.rotation.x = Math.PI / 2;
  tipMesh.position.z = 0.006 * 0.5;
  cueGroup.add(tipMesh);

  return { cueGroup, tipMesh };
}

/**
 * Builds Overhead Vintage 3-Shade Brass Billiards Lamp
 */
export function buildOverheadLamp(tableLength: number): THREE.Group {
  const lampGroup = new THREE.Group();
  lampGroup.name = 'Overhead_Billiard_Lamps';
  lampGroup.position.set(0, 1.42, 0);

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.92,
    roughness: 0.22
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
    roughness: 0.18,
    metalness: 0.2,
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

    // Focused downward spot light
    const spot = new THREE.SpotLight(0xfff5eb, 3.8, 4.5, Math.PI / 4, 0.45, 1.2);
    spot.position.set(ox, -0.08, 0);
    spot.target.position.set(ox, -1.42, 0);
    spot.castShadow = true;
    spot.shadow.mapSize.width = 1024;
    spot.shadow.mapSize.height = 1024;
    spot.shadow.bias = -0.0004;
    lampGroup.add(spot);
    lampGroup.add(spot.target);
  }

  return lampGroup;
}
