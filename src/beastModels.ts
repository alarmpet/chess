/**
 * beastModels.ts — Procedural 3D Sanctuary Beasts for Wizard Chess
 *
 * Replaces standard Staunton chess pieces with 6 majestic animal guardians:
 *  - ♚ King:   🦁 Golden Sovereign Lion (사자 - 절대 군주)
 *  - ♛ Queen:  🐯 Celestial Tiger (호랑이 - 전장 최강의 에이스)
 *  - ♜ Rook:   🐻 Bastion Armored Bear (성채 갑주 곰 - 직선 돌진 중전차)
 *  - ♝ Bishop: 🦅 Imperial Eagle (대성당 독수리 - 원거리 대각 저격수)
 *  - ♞ Knight: 🦌 Crowned Stag (성스러운 뿔 사슴 - 도약 기습수)
 *  - ♟️ Pawn:   🐕 Cloister Warhound (수도원 하운드 - 불굴의 전진병)
 *
 * Both White ('w') and Black ('b') share identical silhouettes for 100% rule
 * clarity, distinguished by holy white marble/gold vs obsidian basalt/crimson materials.
 */

import * as THREE from 'three';

export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type PieceColor = 'w' | 'b';

// ─────────────────────────────────────────────────────────────────────────────
// Material Palettes
// ─────────────────────────────────────────────────────────────────────────────

interface BeastPalette {
  body: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  eye: THREE.MeshStandardMaterial;
  pedestal: THREE.MeshStandardMaterial;
}

function createPalettes(): { w: BeastPalette; b: BeastPalette } {
  // White: Holy White Marble + Radiant Gold + Luminous Cyan Eyes
  const w: BeastPalette = {
    body: new THREE.MeshStandardMaterial({
      color: 0xf5f3ee,
      roughness: 0.28,
      metalness: 0.08
    }),
    accent: new THREE.MeshStandardMaterial({
      color: 0xecd9b5,
      roughness: 0.35,
      metalness: 0.15
    }),
    metal: new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Royal Gold
      roughness: 0.22,
      metalness: 0.88
    }),
    eye: new THREE.MeshStandardMaterial({
      color: 0x38bdf8, // Luminous Sapphire
      emissive: 0x0284c7,
      emissiveIntensity: 0.85,
      roughness: 0.1
    }),
    pedestal: new THREE.MeshStandardMaterial({
      color: 0xe2ded4,
      roughness: 0.42,
      metalness: 0.12
    })
  };

  // Black: Charred Obsidian + Forged Dark Steel + Luminous Magma Eyes
  const b: BeastPalette = {
    body: new THREE.MeshStandardMaterial({
      color: 0x1a1c23,
      roughness: 0.32,
      metalness: 0.22
    }),
    accent: new THREE.MeshStandardMaterial({
      color: 0x2a2220,
      roughness: 0.45,
      metalness: 0.28
    }),
    metal: new THREE.MeshStandardMaterial({
      color: 0xa87d32, // Dark Antique Bronze / Forged Gold
      roughness: 0.30,
      metalness: 0.82
    }),
    eye: new THREE.MeshStandardMaterial({
      color: 0xf97316, // Luminous Magma Amber / Crimson
      emissive: 0xd97706,
      emissiveIntensity: 0.95,
      roughness: 0.1
    }),
    pedestal: new THREE.MeshStandardMaterial({
      color: 0x14161c,
      roughness: 0.48,
      metalness: 0.25
    })
  };

  return { w, b };
}

let cachedPalettes: { w: BeastPalette; b: BeastPalette } | null = null;
function getPalettes() {
  if (!cachedPalettes) cachedPalettes = createPalettes();
  return cachedPalettes;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Pedestal Builder
// ─────────────────────────────────────────────────────────────────────────────

function createPedestal(
  radius: number,
  height: number,
  palette: BeastPalette,
  shape: 'round' | 'octagonal' | 'square' = 'round'
): THREE.Group {
  const group = new THREE.Group();
  const segments = shape === 'round' ? 24 : shape === 'octagonal' ? 8 : 4;

  // Base plinth
  const baseGeo = new THREE.CylinderGeometry(radius * 1.08, radius * 1.15, height * 0.45, segments);
  const baseMesh = new THREE.Mesh(baseGeo, palette.pedestal);
  baseMesh.position.y = height * 0.225;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Decorative metal rim ring
  const ringGeo = new THREE.CylinderGeometry(radius * 1.02, radius * 1.02, height * 0.18, segments);
  const ringMesh = new THREE.Mesh(ringGeo, palette.metal);
  ringMesh.position.y = height * 0.54;
  ringMesh.castShadow = true;
  group.add(ringMesh);

  // Upper pedestal cap
  const capGeo = new THREE.CylinderGeometry(radius * 0.92, radius * 0.98, height * 0.38, segments);
  const capMesh = new THREE.Mesh(capGeo, palette.pedestal);
  capMesh.position.y = height * 0.81;
  capMesh.castShadow = true;
  capMesh.receiveShadow = true;
  group.add(capMesh);

  return group;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ♚ King — 🦁 Golden Sovereign Lion (사자)
// ─────────────────────────────────────────────────────────────────────────────

function buildLion(palette: BeastPalette): THREE.Group {
  const root = new THREE.Group();
  const pedH = 0.16;
  root.add(createPedestal(0.42, pedH, palette, 'octagonal'));

  // Main muscular sitting torso
  const torsoGeo = new THREE.CylinderGeometry(0.24, 0.32, 0.58, 12);
  const torso = new THREE.Mesh(torsoGeo, palette.body);
  torso.position.set(0, pedH + 0.29, -0.04);
  torso.rotation.x = -0.12;
  torso.castShadow = true;
  root.add(torso);

  // Chest mantle
  const chestGeo = new THREE.SphereGeometry(0.26, 12, 10);
  chestGeo.scale(1.0, 1.15, 0.9);
  const chest = new THREE.Mesh(chestGeo, palette.accent);
  chest.position.set(0, pedH + 0.45, 0.08);
  chest.castShadow = true;
  root.add(chest);

  // Front paws
  for (const dx of [-0.14, 0.14]) {
    const legGeo = new THREE.CylinderGeometry(0.065, 0.08, 0.42, 8);
    const leg = new THREE.Mesh(legGeo, palette.body);
    leg.position.set(dx, pedH + 0.21, 0.16);
    leg.castShadow = true;
    root.add(leg);

    const pawGeo = new THREE.SphereGeometry(0.09, 8, 6);
    pawGeo.scale(1.0, 0.55, 1.35);
    const paw = new THREE.Mesh(pawGeo, palette.body);
    paw.position.set(dx, pedH + 0.05, 0.22);
    paw.castShadow = true;
    root.add(paw);
  }

  // Majestic layered sunburst mane (King's halo signature)
  const maneGroup = new THREE.Group();
  maneGroup.position.set(0, pedH + 0.68, 0.04);

  // Outer mane ring
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const spikeGeo = new THREE.ConeGeometry(0.09, 0.28, 5);
    const spike = new THREE.Mesh(spikeGeo, palette.accent);
    spike.position.set(Math.cos(angle) * 0.28, Math.sin(angle) * 0.28, -0.05);
    spike.rotation.z = angle - Math.PI / 2;
    spike.castShadow = true;
    maneGroup.add(spike);
  }
  // Inner mane collar
  const innerManeGeo = new THREE.TorusGeometry(0.20, 0.10, 8, 16);
  const innerMane = new THREE.Mesh(innerManeGeo, palette.accent);
  innerMane.castShadow = true;
  maneGroup.add(innerMane);
  root.add(maneGroup);

  // Head
  const headGeo = new THREE.SphereGeometry(0.18, 12, 10);
  headGeo.scale(0.95, 1.0, 1.15);
  const head = new THREE.Mesh(headGeo, palette.body);
  head.position.set(0, pedH + 0.68, 0.08);
  head.castShadow = true;
  root.add(head);

  // Muzzle & nose
  const muzzleGeo = new THREE.BoxGeometry(0.14, 0.11, 0.16);
  const muzzle = new THREE.Mesh(muzzleGeo, palette.accent);
  muzzle.position.set(0, pedH + 0.63, 0.22);
  muzzle.castShadow = true;
  root.add(muzzle);

  const noseGeo = new THREE.ConeGeometry(0.04, 0.05, 4);
  const nose = new THREE.Mesh(noseGeo, palette.metal);
  nose.position.set(0, pedH + 0.67, 0.30);
  nose.rotation.x = Math.PI / 2;
  root.add(nose);

  // Glowing eyes
  for (const dx of [-0.07, 0.07]) {
    const eyeGeo = new THREE.SphereGeometry(0.032, 8, 8);
    const eye = new THREE.Mesh(eyeGeo, palette.eye);
    eye.position.set(dx, pedH + 0.72, 0.21);
    root.add(eye);
  }

  // Rounded ears
  for (const dx of [-0.15, 0.15]) {
    const earGeo = new THREE.SphereGeometry(0.055, 8, 6);
    earGeo.scale(1.0, 1.0, 0.4);
    const ear = new THREE.Mesh(earGeo, palette.accent);
    ear.position.set(dx, pedH + 0.82, 0.02);
    root.add(ear);
  }

  // Royal Monastic Crown (King's identification)
  const crownGroup = new THREE.Group();
  crownGroup.position.set(0, pedH + 0.88, 0.06);

  const crownBase = new THREE.CylinderGeometry(0.12, 0.14, 0.08, 8);
  crownGroup.add(new THREE.Mesh(crownBase, palette.metal));

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const archGeo = new THREE.ConeGeometry(0.035, 0.10, 4);
    const arch = new THREE.Mesh(archGeo, palette.metal);
    arch.position.set(Math.cos(angle) * 0.10, 0.08, Math.sin(angle) * 0.10);
    crownGroup.add(arch);
  }

  // Cross / Finial atop crown
  const finialV = new THREE.BoxGeometry(0.02, 0.08, 0.02);
  const finialH = new THREE.BoxGeometry(0.06, 0.02, 0.02);
  const finialV_M = new THREE.Mesh(finialV, palette.metal);
  const finialH_M = new THREE.Mesh(finialH, palette.metal);
  finialV_M.position.y = 0.14;
  finialH_M.position.y = 0.14;
  crownGroup.add(finialV_M);
  crownGroup.add(finialH_M);
  root.add(crownGroup);

  // Tail curling alongside base
  const tailGeo = new THREE.TorusGeometry(0.18, 0.03, 6, 12, Math.PI);
  const tail = new THREE.Mesh(tailGeo, palette.body);
  tail.position.set(0.12, pedH + 0.08, -0.16);
  tail.rotation.x = Math.PI / 2;
  root.add(tail);

  return root;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ♛ Queen — 🐯 Celestial Tiger (호랑이)
// ─────────────────────────────────────────────────────────────────────────────

function buildTiger(palette: BeastPalette): THREE.Group {
  const root = new THREE.Group();
  const pedH = 0.15;
  root.add(createPedestal(0.38, pedH, palette, 'octagonal'));

  // Sleek, lethal predatory torso (stretched athletic posture)
  const torsoGeo = new THREE.CylinderGeometry(0.20, 0.27, 0.54, 12);
  const torso = new THREE.Mesh(torsoGeo, palette.body);
  torso.position.set(0, pedH + 0.28, -0.02);
  torso.rotation.x = -0.18;
  torso.castShadow = true;
  root.add(torso);

  // Shoulder blade muscles
  const shoulderGeo = new THREE.SphereGeometry(0.22, 10, 8);
  shoulderGeo.scale(1.1, 0.9, 0.85);
  const shoulder = new THREE.Mesh(shoulderGeo, palette.accent);
  shoulder.position.set(0, pedH + 0.44, 0.08);
  shoulder.castShadow = true;
  root.add(shoulder);

  // Stalking front legs
  for (const dx of [-0.13, 0.13]) {
    const legGeo = new THREE.CylinderGeometry(0.055, 0.07, 0.42, 8);
    const leg = new THREE.Mesh(legGeo, palette.body);
    leg.position.set(dx, pedH + 0.21, 0.14);
    leg.castShadow = true;
    root.add(leg);

    const pawGeo = new THREE.SphereGeometry(0.08, 8, 6);
    pawGeo.scale(1.0, 0.5, 1.4);
    const paw = new THREE.Mesh(pawGeo, palette.body);
    paw.position.set(dx, pedH + 0.04, 0.20);
    paw.castShadow = true;
    root.add(paw);
  }

  // Fierce predatory head
  const headGeo = new THREE.SphereGeometry(0.16, 12, 10);
  headGeo.scale(1.05, 0.95, 1.25);
  const head = new THREE.Mesh(headGeo, palette.body);
  head.position.set(0, pedH + 0.65, 0.10);
  head.castShadow = true;
  root.add(head);

  // Wide predatory muzzle & cheek ruffs
  const muzzleGeo = new THREE.BoxGeometry(0.16, 0.10, 0.14);
  const muzzle = new THREE.Mesh(muzzleGeo, palette.accent);
  muzzle.position.set(0, pedH + 0.60, 0.23);
  muzzle.castShadow = true;
  root.add(muzzle);

  // Curved fangs
  for (const dx of [-0.06, 0.06]) {
    const fangGeo = new THREE.ConeGeometry(0.02, 0.06, 4);
    const fang = new THREE.Mesh(fangGeo, palette.metal);
    fang.position.set(dx, pedH + 0.53, 0.26);
    fang.rotation.x = Math.PI;
    root.add(fang);
  }

  // Piercing predator eyes
  for (const dx of [-0.075, 0.075]) {
    const eyeGeo = new THREE.SphereGeometry(0.03, 8, 8);
    const eye = new THREE.Mesh(eyeGeo, palette.eye);
    eye.position.set(dx, pedH + 0.68, 0.22);
    root.add(eye);
  }

  // Alert rounded tiger ears
  for (const dx of [-0.14, 0.14]) {
    const earGeo = new THREE.SphereGeometry(0.045, 8, 6);
    earGeo.scale(1.0, 1.1, 0.4);
    const ear = new THREE.Mesh(earGeo, palette.body);
    ear.position.set(dx, pedH + 0.77, 0.04);
    root.add(ear);
  }

  // Queen's Royal Tiara / Coronal Crest (Queen's identification)
  const tiaraGroup = new THREE.Group();
  tiaraGroup.position.set(0, pedH + 0.81, 0.08);

  const circletGeo = new THREE.TorusGeometry(0.12, 0.02, 6, 16);
  circletGeo.rotateX(Math.PI / 2);
  tiaraGroup.add(new THREE.Mesh(circletGeo, palette.metal));

  // Central coronet jewel peak
  const peakGeo = new THREE.ConeGeometry(0.04, 0.12, 4);
  const peak = new THREE.Mesh(peakGeo, palette.metal);
  peak.position.set(0, 0.08, 0.10);
  tiaraGroup.add(peak);

  const jewelGeo = new THREE.OctahedronGeometry(0.03);
  const jewel = new THREE.Mesh(jewelGeo, palette.eye);
  jewel.position.set(0, 0.06, 0.12);
  tiaraGroup.add(jewel);

  root.add(tiaraGroup);

  // Royal chest gorget / armor collar
  const gorgetGeo = new THREE.TorusGeometry(0.18, 0.022, 6, 12, Math.PI);
  gorgetGeo.rotateX(Math.PI / 2);
  const gorget = new THREE.Mesh(gorgetGeo, palette.metal);
  gorget.position.set(0, pedH + 0.49, 0.16);
  root.add(gorget);

  // Long whip-like predatory tail curving in high S-arc
  const tailGeo = new THREE.TorusGeometry(0.24, 0.028, 6, 16, Math.PI * 1.2);
  const tail = new THREE.Mesh(tailGeo, palette.body);
  tail.position.set(-0.06, pedH + 0.28, -0.22);
  tail.rotation.y = 0.4;
  tail.castShadow = true;
  root.add(tail);

  return root;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ♜ Rook — 🐻 Bastion Armored Bear (성채 갑주 곰)
// ─────────────────────────────────────────────────────────────────────────────

function buildBear(palette: BeastPalette): THREE.Group {
  const root = new THREE.Group();
  const pedH = 0.14;
  root.add(createPedestal(0.42, pedH, palette, 'square'));

  // Massive, hulking barrel-chested ursine body
  const bodyGeo = new THREE.CylinderGeometry(0.28, 0.36, 0.54, 12);
  const body = new THREE.Mesh(bodyGeo, palette.body);
  body.position.set(0, pedH + 0.27, 0);
  body.castShadow = true;
  root.add(body);

  // Bulky shoulder hump
  const humpGeo = new THREE.SphereGeometry(0.28, 12, 10);
  humpGeo.scale(1.15, 0.85, 1.0);
  const hump = new THREE.Mesh(humpGeo, palette.accent);
  hump.position.set(0, pedH + 0.45, -0.04);
  hump.castShadow = true;
  root.add(hump);

  // Thick, pillar-like front paws
  for (const dx of [-0.18, 0.18]) {
    const legGeo = new THREE.CylinderGeometry(0.08, 0.10, 0.38, 8);
    const leg = new THREE.Mesh(legGeo, palette.body);
    leg.position.set(dx, pedH + 0.19, 0.14);
    leg.castShadow = true;
    root.add(leg);

    const pawGeo = new THREE.BoxGeometry(0.14, 0.08, 0.18);
    const paw = new THREE.Mesh(pawGeo, palette.accent);
    paw.position.set(dx, pedH + 0.04, 0.18);
    paw.castShadow = true;
    root.add(paw);

    // Claws
    for (let c = -1; c <= 1; c++) {
      const clawGeo = new THREE.ConeGeometry(0.015, 0.05, 4);
      const claw = new THREE.Mesh(clawGeo, palette.metal);
      claw.position.set(dx + c * 0.04, pedH + 0.03, 0.28);
      claw.rotation.x = Math.PI / 2;
      root.add(claw);
    }
  }

  // Broad ursine head
  const headGeo = new THREE.SphereGeometry(0.19, 12, 10);
  headGeo.scale(1.1, 0.95, 1.1);
  const head = new THREE.Mesh(headGeo, palette.body);
  head.position.set(0, pedH + 0.58, 0.14);
  head.castShadow = true;
  root.add(head);

  // Heavy muzzle
  const snoutGeo = new THREE.BoxGeometry(0.16, 0.12, 0.16);
  const snout = new THREE.Mesh(snoutGeo, palette.accent);
  snout.position.set(0, pedH + 0.53, 0.28);
  snout.castShadow = true;
  root.add(snout);

  const noseGeo = new THREE.SphereGeometry(0.04, 8, 6);
  const nose = new THREE.Mesh(noseGeo, palette.metal);
  nose.position.set(0, pedH + 0.57, 0.36);
  root.add(nose);

  // Eyes
  for (const dx of [-0.08, 0.08]) {
    const eyeGeo = new THREE.SphereGeometry(0.03, 8, 8);
    const eye = new THREE.Mesh(eyeGeo, palette.eye);
    eye.position.set(dx, pedH + 0.62, 0.24);
    root.add(eye);
  }

  // Small rounded ears
  for (const dx of [-0.15, 0.15]) {
    const earGeo = new THREE.SphereGeometry(0.045, 8, 6);
    const ear = new THREE.Mesh(earGeo, palette.body);
    ear.position.set(dx, pedH + 0.72, 0.08);
    root.add(ear);
  }

  // ♜ ROOK CASTLE BATTLEMENT (Tower on Bear's back — Rook's signature!)
  const towerGroup = new THREE.Group();
  towerGroup.position.set(0, pedH + 0.64, -0.06);

  // Square keep base
  const keepBase = new THREE.BoxGeometry(0.28, 0.18, 0.28);
  towerGroup.add(new THREE.Mesh(keepBase, palette.metal));

  // 4 corner crenellations / battlements
  const crenGeo = new THREE.BoxGeometry(0.07, 0.08, 0.07);
  for (const cx of [-0.11, 0.11]) {
    for (const cz of [-0.11, 0.11]) {
      const cren = new THREE.Mesh(crenGeo, palette.metal);
      cren.position.set(cx, 0.13, cz);
      towerGroup.add(cren);
    }
  }
  // Central golden dome / crest
  const domeGeo = new THREE.SphereGeometry(0.07, 8, 8);
  const dome = new THREE.Mesh(domeGeo, palette.accent);
  dome.position.y = 0.12;
  towerGroup.add(dome);

  root.add(towerGroup);

  return root;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ♝ Bishop — 🦅 Imperial Cathedral Eagle (대성당 독수리)
// ─────────────────────────────────────────────────────────────────────────────

function buildEagle(palette: BeastPalette): THREE.Group {
  const root = new THREE.Group();
  const pedH = 0.18;
  root.add(createPedestal(0.36, pedH, palette, 'round'));

  // Perched fluted column capital
  const capitalGeo = new THREE.CylinderGeometry(0.24, 0.20, 0.12, 12);
  const capital = new THREE.Mesh(capitalGeo, palette.accent);
  capital.position.y = pedH + 0.06;
  root.add(capital);

  // Powerful upright raptor body
  const bodyGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.52, 10);
  const body = new THREE.Mesh(bodyGeo, palette.body);
  body.position.set(0, pedH + 0.36, -0.02);
  body.rotation.x = -0.15;
  body.castShadow = true;
  root.add(body);

  // Sharp curved talons gripping the capital
  for (const dx of [-0.08, 0.08]) {
    for (let t = -1; t <= 1; t++) {
      const talonGeo = new THREE.ConeGeometry(0.018, 0.08, 4);
      const talon = new THREE.Mesh(talonGeo, palette.metal);
      talon.position.set(dx + t * 0.035, pedH + 0.13, 0.10 + Math.abs(t) * 0.01);
      talon.rotation.x = Math.PI / 2.4;
      root.add(talon);
    }
  }

  // Majestic folded wings at flanks (sculpted feathers)
  for (const sx of [-1, 1]) {
    const wingGeo = new THREE.BoxGeometry(0.06, 0.48, 0.22);
    const wing = new THREE.Mesh(wingGeo, palette.accent);
    wing.position.set(sx * 0.20, pedH + 0.36, -0.06);
    wing.rotation.y = sx * 0.18;
    wing.rotation.z = -sx * 0.15;
    wing.castShadow = true;
    root.add(wing);

    // Primary wing tips trailing down
    const tipGeo = new THREE.ConeGeometry(0.05, 0.24, 4);
    const tip = new THREE.Mesh(tipGeo, palette.metal);
    tip.position.set(sx * 0.21, pedH + 0.10, -0.12);
    tip.rotation.x = Math.PI;
    root.add(tip);
  }

  // Proud raptor head & neck
  const neckGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.18, 8);
  const neck = new THREE.Mesh(neckGeo, palette.body);
  neck.position.set(0, pedH + 0.62, 0.04);
  root.add(neck);

  const headGeo = new THREE.SphereGeometry(0.14, 10, 8);
  headGeo.scale(0.9, 1.0, 1.15);
  const head = new THREE.Mesh(headGeo, palette.body);
  head.position.set(0, pedH + 0.72, 0.08);
  head.castShadow = true;
  root.add(head);

  // Sharp razor-curved eagle beak
  const beakGeo = new THREE.ConeGeometry(0.045, 0.14, 4);
  const beak = new THREE.Mesh(beakGeo, palette.metal);
  beak.position.set(0, pedH + 0.68, 0.24);
  beak.rotation.x = Math.PI / 1.6;
  root.add(beak);

  // Fierce eyes under raptor brow
  for (const dx of [-0.07, 0.07]) {
    const eyeGeo = new THREE.SphereGeometry(0.028, 8, 8);
    const eye = new THREE.Mesh(eyeGeo, palette.eye);
    eye.position.set(dx, pedH + 0.74, 0.18);
    root.add(eye);
  }

  // ♝ BISHOP'S MITER CREST (Eagle's clerical feather crest)
  const crestGeo = new THREE.ConeGeometry(0.07, 0.22, 4);
  const crest = new THREE.Mesh(crestGeo, palette.metal);
  crest.position.set(0, pedH + 0.86, 0.04);
  crest.rotation.x = -0.22;
  root.add(crest);

  // Pectoral clerical medallion (Bishop's cross insignia)
  const crossV = new THREE.BoxGeometry(0.02, 0.10, 0.015);
  const crossH = new THREE.BoxGeometry(0.07, 0.02, 0.015);
  const cV = new THREE.Mesh(crossV, palette.metal);
  const cH = new THREE.Mesh(crossH, palette.metal);
  cV.position.set(0, pedH + 0.44, 0.18);
  cH.position.set(0, pedH + 0.46, 0.18);
  root.add(cV);
  root.add(cH);

  return root;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ♞ Knight — 🦌 Crowned Antler Stag (성스러운 뿔 사슴)
// ─────────────────────────────────────────────────────────────────────────────

function buildStag(palette: BeastPalette): THREE.Group {
  const root = new THREE.Group();
  const pedH = 0.15;
  root.add(createPedestal(0.36, pedH, palette, 'round'));

  // Graceful, athletic cervine torso
  const bodyGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.50, 10);
  const body = new THREE.Mesh(bodyGeo, palette.body);
  body.position.set(0, pedH + 0.32, -0.04);
  body.rotation.x = -0.25;
  body.castShadow = true;
  root.add(body);

  // Slender jumping legs with cloven hooves
  for (const dx of [-0.10, 0.10]) {
    // Left leg straight, right leg slightly raised in pride
    const isRaised = dx > 0;
    const legGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.44, 8);
    const leg = new THREE.Mesh(legGeo, palette.body);
    leg.position.set(dx, pedH + (isRaised ? 0.24 : 0.22), isRaised ? 0.16 : 0.10);
    leg.rotation.x = isRaised ? 0.35 : 0;
    leg.castShadow = true;
    root.add(leg);

    const hoofGeo = new THREE.CylinderGeometry(0.042, 0.048, 0.06, 6);
    const hoof = new THREE.Mesh(hoofGeo, palette.metal);
    hoof.position.set(dx, pedH + (isRaised ? 0.08 : 0.03), isRaised ? 0.24 : 0.10);
    root.add(hoof);
  }

  // Long, noble arched neck
  const neckGeo = new THREE.CylinderGeometry(0.10, 0.14, 0.34, 8);
  const neck = new THREE.Mesh(neckGeo, palette.body);
  neck.position.set(0, pedH + 0.58, 0.08);
  neck.rotation.x = 0.35;
  neck.castShadow = true;
  root.add(neck);

  // Refined stag head
  const headGeo = new THREE.SphereGeometry(0.13, 10, 8);
  headGeo.scale(0.85, 0.95, 1.35);
  const head = new THREE.Mesh(headGeo, palette.body);
  head.position.set(0, pedH + 0.74, 0.18);
  head.castShadow = true;
  root.add(head);

  // Gentle eyes
  for (const dx of [-0.07, 0.07]) {
    const eyeGeo = new THREE.SphereGeometry(0.026, 8, 8);
    const eye = new THREE.Mesh(eyeGeo, palette.eye);
    eye.position.set(dx, pedH + 0.78, 0.24);
    root.add(eye);
  }

  // Alert pointed cervine ears
  for (const sx of [-1, 1]) {
    const earGeo = new THREE.ConeGeometry(0.035, 0.14, 4);
    const ear = new THREE.Mesh(earGeo, palette.body);
    ear.position.set(sx * 0.12, pedH + 0.84, 0.14);
    ear.rotation.z = -sx * 0.55;
    ear.rotation.x = -0.3;
    root.add(ear);
  }

  // ♞ MAGNIFICENT MULTI-BRANCHING ANTLERS (Knight's iconic silhouette!)
  for (const sx of [-1, 1]) {
    // Main beam
    const beamGeo = new THREE.CylinderGeometry(0.022, 0.03, 0.36, 6);
    const beam = new THREE.Mesh(beamGeo, palette.metal);
    beam.position.set(sx * 0.11, pedH + 0.94, 0.15);
    beam.rotation.z = -sx * 0.42;
    beam.rotation.x = -0.25;
    beam.castShadow = true;
    root.add(beam);

    // Brow tine (front branch)
    const browGeo = new THREE.ConeGeometry(0.018, 0.14, 4);
    const brow = new THREE.Mesh(browGeo, palette.metal);
    brow.position.set(sx * 0.08, pedH + 0.90, 0.22);
    brow.rotation.x = 0.5;
    brow.rotation.z = -sx * 0.2;
    root.add(brow);

    // Crown tine (top tip)
    const crownTineGeo = new THREE.ConeGeometry(0.016, 0.16, 4);
    const crownTine = new THREE.Mesh(crownTineGeo, palette.metal);
    crownTine.position.set(sx * 0.22, pedH + 1.10, 0.08);
    crownTine.rotation.z = -sx * 0.65;
    root.add(crownTine);
  }

  return root;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. ♟️ Pawn — 🐕 Cloister Warhound (수도원 하운드)
// ─────────────────────────────────────────────────────────────────────────────

function buildHound(palette: BeastPalette): THREE.Group {
  const root = new THREE.Group();
  const pedH = 0.12;
  root.add(createPedestal(0.30, pedH, palette, 'round'));

  // Sturdy, compact muscular hound body
  const bodyGeo = new THREE.CylinderGeometry(0.15, 0.19, 0.38, 10);
  const body = new THREE.Mesh(bodyGeo, palette.body);
  body.position.set(0, pedH + 0.20, -0.02);
  body.rotation.x = -0.22;
  body.castShadow = true;
  root.add(body);

  // Front paws planted firmly forward
  for (const dx of [-0.08, 0.08]) {
    const legGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.28, 8);
    const leg = new THREE.Mesh(legGeo, palette.body);
    leg.position.set(dx, pedH + 0.14, 0.10);
    leg.castShadow = true;
    root.add(leg);

    const pawGeo = new THREE.SphereGeometry(0.06, 8, 6);
    pawGeo.scale(1.0, 0.5, 1.3);
    const paw = new THREE.Mesh(pawGeo, palette.accent);
    paw.position.set(dx, pedH + 0.03, 0.14);
    paw.castShadow = true;
    root.add(paw);
  }

  // Alert canine neck & head
  const neckGeo = new THREE.CylinderGeometry(0.09, 0.12, 0.20, 8);
  const neck = new THREE.Mesh(neckGeo, palette.body);
  neck.position.set(0, pedH + 0.38, 0.06);
  neck.rotation.x = 0.25;
  root.add(neck);

  const headGeo = new THREE.SphereGeometry(0.12, 10, 8);
  headGeo.scale(0.9, 0.95, 1.25);
  const head = new THREE.Mesh(headGeo, palette.body);
  head.position.set(0, pedH + 0.48, 0.12);
  head.castShadow = true;
  root.add(head);

  // Snout & black nose
  const snoutGeo = new THREE.BoxGeometry(0.09, 0.07, 0.12);
  const snout = new THREE.Mesh(snoutGeo, palette.accent);
  snout.position.set(0, pedH + 0.44, 0.22);
  root.add(snout);

  const noseGeo = new THREE.SphereGeometry(0.025, 6, 6);
  const nose = new THREE.Mesh(noseGeo, palette.metal);
  nose.position.set(0, pedH + 0.47, 0.28);
  root.add(nose);

  // Loyal alert eyes
  for (const dx of [-0.055, 0.055]) {
    const eyeGeo = new THREE.SphereGeometry(0.024, 8, 8);
    const eye = new THREE.Mesh(eyeGeo, palette.eye);
    eye.position.set(dx, pedH + 0.52, 0.18);
    root.add(eye);
  }

  // Perked ears
  for (const sx of [-1, 1]) {
    const earGeo = new THREE.ConeGeometry(0.035, 0.10, 4);
    const ear = new THREE.Mesh(earGeo, palette.body);
    ear.position.set(sx * 0.08, pedH + 0.58, 0.08);
    ear.rotation.z = -sx * 0.35;
    ear.rotation.x = 0.15;
    root.add(ear);
  }

  // ♟️ PAWN'S HERALDIC COLLAR & MONASTIC BELL
  const collarGeo = new THREE.TorusGeometry(0.11, 0.02, 6, 16);
  collarGeo.rotateX(Math.PI / 2);
  const collar = new THREE.Mesh(collarGeo, palette.metal);
  collar.position.set(0, pedH + 0.37, 0.09);
  root.add(collar);

  // Monastic bell charm hanging at throat
  const bellGeo = new THREE.SphereGeometry(0.035, 8, 8);
  const bell = new THREE.Mesh(bellGeo, palette.metal);
  bell.position.set(0, pedH + 0.32, 0.18);
  root.add(bell);

  // Upright tail
  const tailGeo = new THREE.CylinderGeometry(0.015, 0.025, 0.18, 6);
  const tail = new THREE.Mesh(tailGeo, palette.body);
  tail.position.set(0, pedH + 0.26, -0.16);
  tail.rotation.x = -0.55;
  root.add(tail);

  return root;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public Beast Builder Dispatcher
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates and returns a procedural 3D Sanctuary Beast model.
 * Fits within standard 1.0 unit height space, ready to be scaled by BOARD_SQ_SIZE.
 */
export function createBeastMesh(type: PieceType, color: PieceColor): THREE.Group {
  const palettes = getPalettes();
  const palette = color === 'w' ? palettes.w : palettes.b;

  let group: THREE.Group;

  switch (type) {
    case 'king':
      group = buildLion(palette);
      break;
    case 'queen':
      group = buildTiger(palette);
      break;
    case 'rook':
      group = buildBear(palette);
      break;
    case 'bishop':
      group = buildEagle(palette);
      break;
    case 'knight':
      group = buildStag(palette);
      break;
    case 'pawn':
      group = buildHound(palette);
      break;
    default:
      group = buildHound(palette);
  }

  // Tag with beast identifiers
  group.userData = {
    isSanctuaryBeast: true,
    beastType: type,
    beastColor: color
  };

  return group;
}
