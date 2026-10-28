import * as THREE from 'three';
import { CROPS } from './farmData';
import { farmEngine, FarmPlot } from './farmEngine';

export class SanctuaryGarden3D {
  public group: THREE.Group;
  private scene: THREE.Scene;
  private plotMeshes: THREE.Mesh[] = [];
  private cropGroups: THREE.Group[] = [];
  private harvestSparkles: THREE.Group[] = [];
  private fountainMesh: THREE.Group | null = null;
  private apiaryMesh: THREE.Group | null = null;
  private scarecrowMesh: THREE.Group | null = null;
  private restorationMeshes: Record<string, THREE.Group | null> = {};

  // Center coordinate of the garden courtyard
  public static readonly CENTER_POS = new THREE.Vector3(0, 0.85, 9.8);

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.position.copy(SanctuaryGarden3D.CENTER_POS);
    this.buildGardenCourtyard();
    this.scene.add(this.group);

    // Register global hooks
    const win = window as any;
    win.__updatePlotMesh = (idx: number, plot: FarmPlot) => this.updatePlot(idx, plot);
    win.__triggerHarvestParticles = (idx: number) => this.spawnHarvestSparkles(idx);
    win.__updateFacility3D = (facId: string) => this.updateFacility(facId);
    win.__updateRestoration3D = (zoneId: string) => this.updateRestoration(zoneId);
  }

  private buildGardenCourtyard() {
    // 1. Cobblestone Terrace Foundation
    const terraceGeo = new THREE.BoxGeometry(4.6, 0.22, 4.6);
    const terraceMat = new THREE.MeshStandardMaterial({
      color: 0x78716c,
      roughness: 0.85,
      metalness: 0.1
    });
    const terrace = new THREE.Mesh(terraceGeo, terraceMat);
    terrace.position.y = -0.11;
    terrace.receiveShadow = true;
    this.group.add(terrace);

    // 2. Lush Green Grass Lawn
    const grassGeo = new THREE.PlaneGeometry(4.2, 4.2);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x4d7c0f,
      roughness: 0.9,
      metalness: 0.05
    });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = 0.005;
    grass.receiveShadow = true;
    this.group.add(grass);

    // 3. Warm Garden Sunlight & Lanterns
    const gardenSun = new THREE.PointLight(0xfef08a, 4.5, 9);
    gardenSun.position.set(0, 2.8, 0);
    this.group.add(gardenSun);

    // 4. 3x3 Garden Plots
    const spacing = 1.15;
    const offset = -spacing; // -1.15, 0, 1.15

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const plotIdx = r * 3 + c;
        const posX = offset + c * spacing;
        const posZ = offset + r * spacing;

        // Soil mound
        const soilGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.08, 16);
        const soilMat = new THREE.MeshStandardMaterial({
          color: 0x543d2b, // Dry soil brown
          roughness: 0.95
        });
        const soilMesh = new THREE.Mesh(soilGeo, soilMat);
        soilMesh.position.set(posX, 0.04, posZ);
        soilMesh.receiveShadow = true;
        soilMesh.castShadow = true;

        // Interactive tag for Raycasting
        soilMesh.userData = {
          isGardenPlot: true,
          plotIndex: plotIdx
        };

        this.group.add(soilMesh);
        this.plotMeshes.push(soilMesh);

        // Crop mesh container
        const cropGroup = new THREE.Group();
        cropGroup.position.set(posX, 0.08, posZ);
        this.group.add(cropGroup);
        this.cropGroups.push(cropGroup);

        // Sync initial plot state
        const initialPlot = farmEngine.plots[plotIdx];
        if (initialPlot) {
          this.updatePlot(plotIdx, initialPlot);
        }
      }
    }

    // Build already unlocked facilities
    if (farmEngine.facilities.fountain) this.updateFacility('fountain');
    if (farmEngine.facilities.apiary) this.updateFacility('apiary');
    if (farmEngine.facilities.scarecrow) this.updateFacility('scarecrow');

    // Build already unlocked restorations
    for (const zoneId of Object.keys(farmEngine.restorations)) {
      if (farmEngine.restorations[zoneId]) {
        this.updateRestoration(zoneId);
      }
    }
  }

  public updatePlot(plotIdx: number, plot: FarmPlot) {
    const soilMesh = this.plotMeshes[plotIdx];
    const cropGroup = this.cropGroups[plotIdx];
    if (!soilMesh || !cropGroup) return;

    // 1. Update soil color (watered = dark fertile, unwatered = dry)
    const mat = soilMesh.material as THREE.MeshStandardMaterial;
    if (mat) {
      mat.color.setHex(plot.isWatered ? 0x271a0e : 0x543d2b);
    }

    // 2. Clear old crop meshes
    while (cropGroup.children.length > 0) {
      cropGroup.remove(cropGroup.children[0]);
    }

    if (!plot.cropId) return;
    const cropDef = CROPS[plot.cropId];
    if (!cropDef) return;

    // 3. Render crop according to stage (0: seed, 1: sprout, 2: growing, 3: harvestable)
    if (plot.stage === 0) {
      // Tiny seed mound
      const seedGeo = new THREE.SphereGeometry(0.06, 8, 8);
      const seedMat = new THREE.MeshStandardMaterial({ color: 0x854d0e });
      const seedMesh = new THREE.Mesh(seedGeo, seedMat);
      seedMesh.position.y = 0.03;
      cropGroup.add(seedMesh);
    } else if (plot.stage === 1) {
      // Little green two-leaf sprout
      const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.14, 8);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x65a30d });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.07;
      cropGroup.add(stem);

      const leafGeo = new THREE.SphereGeometry(0.05, 8, 4);
      leafGeo.scale(1.8, 0.4, 0.9);
      const leaf1 = new THREE.Mesh(leafGeo, stemMat);
      leaf1.position.set(0.04, 0.13, 0);
      leaf1.rotation.z = 0.4;
      cropGroup.add(leaf1);

      const leaf2 = new THREE.Mesh(leafGeo, stemMat);
      leaf2.position.set(-0.04, 0.13, 0);
      leaf2.rotation.z = -0.4;
      cropGroup.add(leaf2);
    } else if (plot.stage === 2) {
      // Thriving green bush / plant
      const stemGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.28, 8);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.14;
      cropGroup.add(stem);

      const foliageGeo = new THREE.DodecahedronGeometry(0.16);
      const foliageMat = new THREE.MeshStandardMaterial({ color: 0x3f6212 });
      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.y = 0.26;
      cropGroup.add(foliage);
    } else if (plot.stage === 3) {
      // Harvestable fruit with glowing particles & distinct shapes!
      this.buildHarvestableCropMesh(cropGroup, cropDef);
    }
  }

  private buildHarvestableCropMesh(cropGroup: THREE.Group, cropDef: any) {
    const plantColor = cropDef.color;
    const fruitMat = new THREE.MeshStandardMaterial({
      color: plantColor,
      roughness: 0.3,
      emissive: plantColor,
      emissiveIntensity: 0.4
    });

    const stemMat = new THREE.MeshStandardMaterial({ color: 0x3f6212 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.28, 8), stemMat);
    stem.position.y = 0.14;
    cropGroup.add(stem);

    if (cropDef.fruitGeometry === 'grapes') {
      // Cluster of 6 glowing grape spheres
      const grapeGeo = new THREE.SphereGeometry(0.07, 8, 8);
      const offsets = [
        [0, 0.28, 0],
        [0.06, 0.24, 0.05],
        [-0.06, 0.24, -0.05],
        [0.05, 0.20, -0.06],
        [-0.05, 0.20, 0.06],
        [0, 0.15, 0]
      ];
      offsets.forEach(([x, y, z]) => {
        const grape = new THREE.Mesh(grapeGeo, fruitMat);
        grape.position.set(x, y, z);
        cropGroup.add(grape);
      });
    } else if (cropDef.fruitGeometry === 'wheat') {
      // 5 swaying golden stalks
      const earGeo = new THREE.ConeGeometry(0.045, 0.22, 6);
      [-0.08, -0.04, 0, 0.04, 0.08].forEach((x, i) => {
        const ear = new THREE.Mesh(earGeo, fruitMat);
        ear.position.set(x, 0.26, (i % 2 === 0 ? 0.03 : -0.03));
        ear.rotation.z = x * 1.5;
        cropGroup.add(ear);
      });
    } else if (cropDef.fruitGeometry === 'pepper') {
      // Fiery tapered chilies
      const pepperGeo = new THREE.ConeGeometry(0.06, 0.24, 8);
      [-0.06, 0.06].forEach((x) => {
        const pepper = new THREE.Mesh(pepperGeo, fruitMat);
        pepper.rotation.z = Math.PI + (x > 0 ? 0.3 : -0.3);
        pepper.position.set(x, 0.25, 0);
        cropGroup.add(pepper);
      });
    } else if (cropDef.fruitGeometry === 'gourd') {
      // Plump ribbed pumpkin
      const pumpkinGeo = new THREE.SphereGeometry(0.18, 12, 10);
      pumpkinGeo.scale(1.2, 0.85, 1.2);
      const pumpkin = new THREE.Mesh(pumpkinGeo, fruitMat);
      pumpkin.position.set(0, 0.15, 0);
      cropGroup.add(pumpkin);
    } else {
      // Sacred glowing herb
      const herbGeo = new THREE.IcosahedronGeometry(0.14, 1);
      const herb = new THREE.Mesh(herbGeo, fruitMat);
      herb.position.set(0, 0.24, 0);
      cropGroup.add(herb);
    }

    // Add glowing harvest aura light
    const fruitLight = new THREE.PointLight(plantColor, 1.8, 1.2);
    fruitLight.position.set(0, 0.32, 0);
    cropGroup.add(fruitLight);
  }

  public spawnHarvestSparkles(plotIdx: number) {
    const cropGroup = this.cropGroups[plotIdx];
    if (!cropGroup) return;

    const sparkleGroup = new THREE.Group();
    sparkleGroup.position.copy(cropGroup.position);
    this.group.add(sparkleGroup);

    const geo = new THREE.DodecahedronGeometry(0.04);
    const mat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    const particles: { mesh: THREE.Mesh; vel: THREE.Vector3 }[] = [];
    for (let i = 0; i < 14; i++) {
      const p = new THREE.Mesh(geo, mat);
      sparkleGroup.add(p);
      particles.push({
        mesh: p,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 1.4,
          0.8 + Math.random() * 1.2,
          (Math.random() - 0.5) * 1.4
        )
      });
    }

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 0.04;
      particles.forEach((pt) => {
        pt.mesh.position.addScaledVector(pt.vel, 0.04);
        pt.mesh.scale.multiplyScalar(0.95);
      });

      if (elapsed >= 0.7) {
        clearInterval(interval);
        this.group.remove(sparkleGroup);
        geo.dispose();
        mat.dispose();
      }
    }, 16);
  }

  public updateFacility(facId: string) {
    if (facId === 'fountain' && !this.fountainMesh) {
      // Golden Angel Fountain at top of garden
      const fountain = new THREE.Group();
      fountain.position.set(0, 0, -2.1);

      const basinMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.8 });
      const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.38, 0.2, 16), basinMat);
      basin.position.y = 0.1;
      fountain.add(basin);

      const waterMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, transparent: true, opacity: 0.85 });
      const water = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.05, 16), waterMat);
      water.position.y = 0.18;
      fountain.add(water);

      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.45, 12), basinMat);
      pillar.position.y = 0.38;
      fountain.add(pillar);

      const waterGlow = new THREE.PointLight(0x38bdf8, 2.5, 3.0);
      waterGlow.position.set(0, 0.5, 0);
      fountain.add(waterGlow);

      this.group.add(fountain);
      this.fountainMesh = fountain;
    } else if (facId === 'apiary' && !this.apiaryMesh) {
      // Wooden Beehive Apiary at right side
      const apiary = new THREE.Group();
      apiary.position.set(2.0, 0, -1.8);

      const woodMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
      const hive = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.42, 0.35), woodMat);
      hive.position.y = 0.21;
      apiary.add(hive);

      const roofMat = new THREE.MeshStandardMaterial({ color: 0xa16207 });
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.22, 4), roofMat);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 0.52;
      apiary.add(roof);

      this.group.add(apiary);
      this.apiaryMesh = apiary;
    } else if (facId === 'scarecrow' && !this.scarecrowMesh) {
      // Stone Knight Scarecrow at left side
      const scarecrow = new THREE.Group();
      scarecrow.position.set(-2.0, 0, -1.8);

      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.7, 8), stoneMat);
      post.position.y = 0.35;
      scarecrow.add(post);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.06), stoneMat);
      arm.position.y = 0.52;
      scarecrow.add(arm);

      const hatMat = new THREE.MeshStandardMaterial({ color: 0xeab308 });
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.16, 8), hatMat);
      hat.position.y = 0.76;
      scarecrow.add(hat);

      this.group.add(scarecrow);
      this.scarecrowMesh = scarecrow;
    }
  }

  public updateRestoration(zoneId: string) {
    if (this.restorationMeshes[zoneId]) return; // Already rendered

    const zoneGroup = new THREE.Group();
    const marbleMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.35,
      metalness: 0.15
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.85
    });

    if (zoneId === 'cloister_walkway') {
      // 1. Ruined Cloister Walkway: Gothic Arched Colonnade around the terrace perimeter
      const pillarGeo = new THREE.CylinderGeometry(0.08, 0.10, 0.95, 12);
      const archGeo = new THREE.BoxGeometry(0.95, 0.08, 0.14);
      const positions = [
        [-2.1, 0, -1.2], [-2.1, 0, 0.0], [-2.1, 0, 1.2],
        [2.1, 0, -1.2], [2.1, 0, 0.0], [2.1, 0, 1.2]
      ];
      for (const pos of positions) {
        const col = new THREE.Mesh(pillarGeo, marbleMat);
        col.position.set(pos[0], 0.48, pos[2]);
        col.castShadow = true;
        col.receiveShadow = true;
        zoneGroup.add(col);
      }
      for (const sideX of [-2.1, 2.1]) {
        for (const z of [-0.6, 0.6]) {
          const arch = new THREE.Mesh(archGeo, marbleMat);
          arch.position.set(sideX, 0.96, z);
          arch.rotation.y = Math.PI / 2;
          zoneGroup.add(arch);
        }
      }
    } else if (zoneId === 'herb_sanctuary') {
      // 2. Sacred Herb Sanctuary: Lush glowing herb planter borders & green soil luminescence
      const herbMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.6 });
      const flowerGeo = new THREE.SphereGeometry(0.06, 8, 8);
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2;
        const rad = 1.65 + (i % 2) * 0.2;
        const fl = new THREE.Mesh(flowerGeo, herbMat);
        fl.position.set(Math.cos(ang) * rad, 0.14, Math.sin(ang) * rad);
        zoneGroup.add(fl);
      }
      const sacredLight = new THREE.PointLight(0x34d399, 1.8, 4.0);
      sacredLight.position.set(0, 0.8, 0);
      zoneGroup.add(sacredLight);
    } else if (zoneId === 'stained_glass') {
      // 3. Rose Window Stained Glass: Radiant multicolored light shafts slanting into courtyard
      const colors = [0x38bdf8, 0xf43f5e, 0xfacc15];
      colors.forEach((colHex, idx) => {
        const beamGeo = new THREE.CylinderGeometry(0.35, 0.55, 3.2, 16);
        const beamMat = new THREE.MeshBasicMaterial({
          color: colHex,
          transparent: true,
          opacity: 0.22,
          side: THREE.DoubleSide
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set((idx - 1) * 1.1, 1.6, (idx - 1) * 0.4);
        beam.rotation.x = 0.25;
        beam.rotation.z = (idx - 1) * 0.15;
        zoneGroup.add(beam);
      });
    } else if (zoneId === 'altar_brewery') {
      // 4. Holy Altar Brewery: Cauldron + alchemy barrel station
      const breweryGroup = new THREE.Group();
      breweryGroup.position.set(1.9, 0, 1.6);
      const copperMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.4, metalness: 0.7 });
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.32, 12), copperMat);
      pot.position.y = 0.16;
      breweryGroup.add(pot);

      const brewLiquidMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
      const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.02, 12), brewLiquidMat);
      liquid.position.y = 0.31;
      breweryGroup.add(liquid);

      const brewGlow = new THREE.PointLight(0xa855f7, 2.2, 2.5);
      brewGlow.position.set(0, 0.45, 0);
      breweryGroup.add(brewGlow);
      zoneGroup.add(breweryGroup);
    } else if (zoneId === 'bell_tower') {
      // 5. Angelic Bell Tower: Gothic spire pinnacle with bronze swinging bell
      const towerGroup = new THREE.Group();
      towerGroup.position.set(-1.9, 0, 1.7);
      const towerBase = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.2, 0.36), marbleMat);
      towerBase.position.y = 0.6;
      towerGroup.add(towerBase);

      const bronzeMat = new THREE.MeshStandardMaterial({ color: 0xcd7f32, roughness: 0.3, metalness: 0.85 });
      const bell = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.18, 12), bronzeMat);
      bell.position.y = 1.05;
      towerGroup.add(bell);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.45, 4), goldTrimMat);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 1.42;
      towerGroup.add(roof);
      zoneGroup.add(towerGroup);
    } else if (zoneId === 'high_altar') {
      // 6. Grand Sanctum High Altar: Elevated white marble altar with glowing golden chalice
      const altarGroup = new THREE.Group();
      altarGroup.position.set(0, 0, 2.0);
      const altarTable = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.35, 0.45), marbleMat);
      altarTable.position.y = 0.18;
      altarTable.castShadow = true;
      altarGroup.add(altarTable);

      const chalice = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.16, 12), goldTrimMat);
      chalice.position.y = 0.44;
      altarGroup.add(chalice);

      const holyLight = new THREE.PointLight(0xfff7ed, 3.2, 3.5);
      holyLight.position.set(0, 0.65, 0);
      altarGroup.add(holyLight);
      zoneGroup.add(altarGroup);
    }

    this.group.add(zoneGroup);
    this.restorationMeshes[zoneId] = zoneGroup;
  }
}
