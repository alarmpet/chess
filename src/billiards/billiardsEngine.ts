/**
 * billiardsEngine.ts — Main 3D Billiards Game Controller
 *
 * Orchestrates:
 *  - High-End Three.js PBR rendering & UnrealBloom post-processing
 *  - 8-Ball Pool, Korean 4-Ball, and 3-Cushion Carom rule modes
 *  - Aiming trajectory line & ghost ball collision forecast
 *  - 3D Cue stick stroke animation and power bar
 *  - Circular English/Spin controller (Follow, Draw, English/Sidespin)
 *  - Multi-camera presets (Aim View, Top-Down, Orbit)
 *  - Sound effects & Game Feel visual feedback
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import {
  BilliardsPhysicsEngine,
  type BallPhysicsState
} from './billiardsPhysics.ts';
import {
  buildBilliardsTable,
  buildCueStick,
  buildOverheadLamp,
  createBallTexture,
  createResinBallMaterial,
  FELT_THEMES
} from './billiardsAssets.ts';
import { billiardsAudio } from './billiardsAudio.ts';

export type BilliardsMode = '8ball' | '4ball' | '3cushion' | 'practice';
export type CameraPreset = 'aim' | 'top' | 'orbit';

export interface BilliardsGameState {
  mode: BilliardsMode;
  currentTurn: 1 | 2;
  player1Score: number;
  player2Score: number;
  player1Target?: 'solids' | 'stripes';
  player2Target?: 'solids' | 'stripes';
  isAiming: boolean;
  isShooting: boolean;
  shotPower: number; // 0.0 to 1.0
  english: { x: number; y: number }; // -1 to +1
  cameraPreset: CameraPreset;
  activeFeltTheme: keyof typeof FELT_THEMES;
  notification: string;
}

export class BilliardsGameEngine {
  private container: HTMLElement | null = null;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private composer: EffectComposer | null = null;
  private orbitControls: OrbitControls | null = null;

  public physics: BilliardsPhysicsEngine;
  private tableGroup: THREE.Group | null = null;
  private cueGroup: THREE.Group | null = null;
  private overheadLamp: THREE.Group | null = null;
  private aimLineMesh: THREE.Line | null = null;
  private ghostBallMesh: THREE.Mesh | null = null;
  private setFeltThemeFn: ((k: keyof typeof FELT_THEMES) => void) | null = null;

  public state: BilliardsGameState = {
    mode: '8ball',
    currentTurn: 1,
    player1Score: 0,
    player2Score: 0,
    isAiming: true,
    isShooting: false,
    shotPower: 0.5,
    english: { x: 0, y: 0 },
    cameraPreset: 'aim',
    activeFeltTheme: 'tournamentBlue',
    notification: 'Welcome to 3D Billiards! Drag to aim, pull back cue to shoot.'
  };

  private aimAngle: number = 0; // Radians around cue ball
  private strokeOffset: number = 0;
  private animationFrameId: number | null = null;
  private isPullingCue: boolean = false;
  private pullStartY: number = 0;
  private stateChangeCallbacks: ((st: BilliardsGameState) => void)[] = [];

  constructor() {
    this.physics = new BilliardsPhysicsEngine();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 40);
  }

  public subscribe(cb: (st: BilliardsGameState) => void): () => void {
    this.stateChangeCallbacks.push(cb);
    cb(this.state);
    return () => {
      this.stateChangeCallbacks = this.stateChangeCallbacks.filter((c) => c !== cb);
    };
  }

  private notify() {
    for (const cb of this.stateChangeCallbacks) {
      cb({ ...this.state });
    }
  }

  public init(container: HTMLElement) {
    this.container = container;
    this.container.innerHTML = '';

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Renderer with PCFSoft Contact Shadows
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 2. Camera & OrbitControls
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.12;
    this.orbitControls.maxPolarAngle = Math.PI * 0.48; // Don't clip under floor
    this.orbitControls.minDistance = 0.5;
    this.orbitControls.maxDistance = 6.0;

    // 3. UnrealBloom Post-Processing
    try {
      const renderPass = new RenderPass(this.scene, this.camera);
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        0.45, // gentle bloom for glossy reflections
        0.30,
        0.85
      );
      const outputPass = new OutputPass();
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(renderPass);
      this.composer.addPass(bloomPass);
      this.composer.addPass(outputPass);
    } catch (e) {
      this.composer = null;
    }

    // 4. Ambient Environment & Warm Lounge Lighting
    const ambientLight = new THREE.AmbientLight(0xffedd5, 0.45);
    this.scene.add(ambientLight);

    const floorBounce = new THREE.DirectionalLight(0x1e3a8a, 0.35);
    floorBounce.position.set(0, -2, 0);
    this.scene.add(floorBounce);

    // 5. Build 3D Assets
    this.buildScene();

    // 6. Setup Event Listeners
    this.setupPointerControls();
    window.addEventListener('resize', this.onResize);

    // 7. Start Render Loop
    this.animate();
  }

  private buildScene() {
    this.scene.clear();

    // 1. Table
    const tableBuild = buildBilliardsTable(
      this.physics.bounds,
      this.state.mode === '8ball',
      this.state.activeFeltTheme
    );
    this.tableGroup = tableBuild.tableGroup;
    this.setFeltThemeFn = tableBuild.setFeltTheme;
    this.scene.add(this.tableGroup);

    // 2. Overhead Vintage Lamps
    this.overheadLamp = buildOverheadLamp(this.physics.bounds.length);
    this.scene.add(this.overheadLamp);

    // 3. Cue Stick
    const cueBuild = buildCueStick();
    this.cueGroup = cueBuild.cueGroup;
    this.scene.add(this.cueGroup);

    // 4. Aim Trajectory Guide & Ghost Ball
    const lineMat = new THREE.LineDashedMaterial({
      color: 0xffffff,
      dashSize: 0.04,
      gapSize: 0.02,
      opacity: 0.85,
      transparent: true
    });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 1)
    ]);
    this.aimLineMesh = new THREE.Line(lineGeo, lineMat);
    this.aimLineMesh.computeLineDistances();
    this.scene.add(this.aimLineMesh);

    const ghostGeo = new THREE.SphereGeometry(this.physics.bounds.ballRadius, 16, 16);
    const ghostMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });
    this.ghostBallMesh = new THREE.Mesh(ghostGeo, ghostMat);
    this.scene.add(this.ghostBallMesh);

    // 5. Initialize Mode Balls
    this.rackBalls(this.state.mode);
    this.setCameraPreset(this.state.cameraPreset);
  }

  public setMode(mode: BilliardsMode) {
    this.state.mode = mode;
    this.state.player1Score = 0;
    this.state.player2Score = 0;
    this.state.currentTurn = 1;
    this.physics.hasPockets = mode === '8ball';

    if (mode === '8ball') {
      this.state.notification = '8-Ball Pool: Sink all your group (solids or stripes), then sink the 8-ball!';
    } else if (mode === '4ball') {
      this.state.notification = 'Korean 4-Ball: Strike both red balls to score 10 points. Avoid hitting yellow!';
    } else if (mode === '3cushion') {
      this.state.notification = '3-Cushion: Hit 3 cushions before contacting the second object ball to score!';
    } else {
      this.state.notification = 'Free Practice: Practice your bank shots, follow shots, and spin!';
    }

    this.buildScene();
    this.notify();
  }

  public setFeltTheme(key: keyof typeof FELT_THEMES) {
    this.state.activeFeltTheme = key;
    if (this.setFeltThemeFn) {
      this.setFeltThemeFn(key);
    }
    this.notify();
  }

  public rackBalls(mode: BilliardsMode) {
    // Clear old ball meshes
    for (const b of this.physics.balls) {
      if (b.mesh) this.scene.remove(b.mesh);
    }
    this.physics.balls = [];

    const R = this.bounds.ballRadius;
    const geo = new THREE.SphereGeometry(R, 32, 32);

    if (mode === '8ball') {
      // 1. Cue Ball (White) at head string (X = -0.55)
      const cueTex = createBallTexture('cue');
      const cueMat = createResinBallMaterial(cueTex);
      const cueMesh = new THREE.Mesh(geo, cueMat);
      cueMesh.castShadow = true;
      cueMesh.receiveShadow = true;
      this.scene.add(cueMesh);

      const cueBall: BallPhysicsState = {
        id: 0,
        type: 'cue',
        position: new THREE.Vector3(-0.55, R, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        angularVelocity: new THREE.Vector3(0, 0, 0),
        english: { x: 0, y: 0 },
        isPotted: false,
        state: 'resting',
        mesh: cueMesh
      };
      this.physics.balls.push(cueBall);

      // 2. Standard 15-Ball Triangle Rack at foot spot (X = 0.45)
      // Triangle pattern rows: 1, 2, 3, 4, 5
      const rackOrder = [
        1,
        10, 2,
        3, 8, 11,
        12, 4, 13, 5,
        6, 14, 7, 15, 9
      ];
      let orderIdx = 0;
      const rackX = 0.45;
      const dX = R * Math.sqrt(3) * 1.02;
      const dZ = R * 2.02;

      for (let row = 0; row < 5; row++) {
        const rowCount = row + 1;
        const curX = rackX + row * dX;
        const startZ = -((rowCount - 1) * dZ) * 0.5;

        for (let col = 0; col < rowCount; col++) {
          const ballNum = rackOrder[orderIdx++];
          const isStripe = ballNum > 8;
          const isBlack = ballNum === 8;
          const ballType = isBlack ? 'black' : isStripe ? 'stripe' : 'solid';

          const tex = createBallTexture(ballType, ballNum);
          const mat = createResinBallMaterial(tex);
          const mesh = new THREE.Mesh(geo, mat);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          this.scene.add(mesh);

          const curZ = startZ + col * dZ;
          const ball: BallPhysicsState = {
            id: ballNum,
            type: ballType,
            number: ballNum,
            position: new THREE.Vector3(curX, R, curZ),
            velocity: new THREE.Vector3(0, 0, 0),
            angularVelocity: new THREE.Vector3(0, 0, 0),
            english: { x: 0, y: 0 },
            isPotted: false,
            state: 'resting',
            mesh
          };
          this.physics.balls.push(ball);
        }
      }
    } else {
      // 4-Ball & 3-Cushion (Carom)
      // 1. White Cue Ball (Player 1)
      const whiteTex = createBallTexture('cue');
      const whiteMat = createResinBallMaterial(whiteTex);
      const whiteMesh = new THREE.Mesh(geo, whiteMat);
      whiteMesh.castShadow = true;
      this.scene.add(whiteMesh);

      this.physics.balls.push({
        id: 0,
        type: 'cue',
        position: new THREE.Vector3(-0.55, R, -0.18),
        velocity: new THREE.Vector3(),
        angularVelocity: new THREE.Vector3(),
        english: { x: 0, y: 0 },
        isPotted: false,
        state: 'resting',
        mesh: whiteMesh
      });

      // 2. Yellow Cue Ball (Player 2)
      const yellowTex = createBallTexture('yellow');
      const yellowMat = createResinBallMaterial(yellowTex);
      const yellowMesh = new THREE.Mesh(geo, yellowMat);
      yellowMesh.castShadow = true;
      this.scene.add(yellowMesh);

      this.physics.balls.push({
        id: 1,
        type: 'yellow',
        position: new THREE.Vector3(-0.55, R, 0.18),
        velocity: new THREE.Vector3(),
        angularVelocity: new THREE.Vector3(),
        english: { x: 0, y: 0 },
        isPotted: false,
        state: 'resting',
        mesh: yellowMesh
      });

      // 3. Red Object Ball 1
      const red1Tex = createBallTexture('red');
      const red1Mat = createResinBallMaterial(red1Tex);
      const red1Mesh = new THREE.Mesh(geo, red1Mat);
      red1Mesh.castShadow = true;
      this.scene.add(red1Mesh);

      this.physics.balls.push({
        id: 2,
        type: 'red',
        position: new THREE.Vector3(0.45, R, 0),
        velocity: new THREE.Vector3(),
        angularVelocity: new THREE.Vector3(),
        english: { x: 0, y: 0 },
        isPotted: false,
        state: 'resting',
        mesh: red1Mesh
      });

      // 4. Red Object Ball 2 (if 4-Ball)
      if (mode === '4ball' || mode === 'practice') {
        const red2Tex = createBallTexture('red');
        const red2Mat = createResinBallMaterial(red2Tex);
        const red2Mesh = new THREE.Mesh(geo, red2Mat);
        red2Mesh.castShadow = true;
        this.scene.add(red2Mesh);

        this.physics.balls.push({
          id: 3,
          type: 'red',
          position: new THREE.Vector3(0.68, R, 0),
          velocity: new THREE.Vector3(),
          angularVelocity: new THREE.Vector3(),
          english: { x: 0, y: 0 },
          isPotted: false,
          state: 'resting',
          mesh: red2Mesh
        });
      }
    }

    this.state.isAiming = true;
    this.state.isShooting = false;
    this.updateAimGuide();
  }

  public get bounds() {
    return this.physics.bounds;
  }

  public setEnglish(x: number, y: number) {
    this.state.english = {
      x: Math.max(-1, Math.min(x, 1)),
      y: Math.max(-1, Math.min(y, 1))
    };
    this.notify();
  }

  public setShotPower(p: number) {
    this.state.shotPower = Math.max(0.05, Math.min(p, 1.0));
    this.notify();
  }

  public setAimAngle(rad: number) {
    this.aimAngle = rad;
    this.updateAimGuide();
  }

  public adjustAimAngle(deltaRad: number) {
    this.aimAngle += deltaRad;
    this.updateAimGuide();
  }

  public setCameraPreset(preset: CameraPreset) {
    this.state.cameraPreset = preset;
    const cueBall = this.getCueBall();
    const cuePos = cueBall ? cueBall.position : new THREE.Vector3(0, 0, 0);

    if (preset === 'top') {
      if (this.orbitControls) {
        this.orbitControls.enabled = true;
        this.orbitControls.target.set(0, 0, 0);
      }
      this.camera.position.set(0, 2.6, 0.001);
      this.camera.lookAt(0, 0, 0);
    } else if (preset === 'aim') {
      if (this.orbitControls) {
        this.orbitControls.enabled = false;
      }
      this.updateAimCamera();
    } else {
      // Orbit view
      if (this.orbitControls) {
        this.orbitControls.enabled = true;
        this.orbitControls.target.set(0, 0, 0);
      }
      this.camera.position.set(0, 1.8, 2.1);
      this.camera.lookAt(0, 0, 0);
    }

    this.notify();
  }

  private getCueBall(): BallPhysicsState | undefined {
    // In 4-ball / 3-cushion, Player 1 uses White (id 0) and Player 2 uses Yellow (id 1)
    if (this.state.mode === '4ball' || this.state.mode === '3cushion') {
      const cueId = this.state.currentTurn === 1 ? 0 : 1;
      return this.physics.balls.find((b) => b.id === cueId);
    }
    return this.physics.balls.find((b) => b.id === 0);
  }

  private updateAimCamera() {
    if (this.state.cameraPreset !== 'aim') return;
    const cueBall = this.getCueBall();
    if (!cueBall) return;

    const dirX = Math.cos(this.aimAngle);
    const dirZ = Math.sin(this.aimAngle);

    // Camera sits behind the cue ball at eye level
    const distBack = 0.65;
    const height = 0.22;
    this.camera.position.set(
      cueBall.position.x - dirX * distBack,
      cueBall.position.y + height,
      cueBall.position.z - dirZ * distBack
    );
    this.camera.lookAt(
      cueBall.position.x + dirX * 1.2,
      cueBall.position.y,
      cueBall.position.z + dirZ * 1.2
    );
  }

  private updateAimGuide() {
    const cueBall = this.getCueBall();
    if (!cueBall || cueBall.isPotted || !this.aimLineMesh || !this.ghostBallMesh) return;

    const dirX = Math.cos(this.aimAngle);
    const dirZ = Math.sin(this.aimAngle);
    const origin = cueBall.position;
    const R = this.bounds.ballRadius;

    // Raycast against all object balls to find first collision point
    let closestDist = 2.5;
    let hitBall: BallPhysicsState | null = null;

    for (const b of this.physics.balls) {
      if (b.id === cueBall.id || b.isPotted) continue;
      const ox = b.position.x - origin.x;
      const oz = b.position.z - origin.z;

      // Project onto aim direction
      const proj = ox * dirX + oz * dirZ;
      if (proj > 0 && proj < closestDist) {
        // Perpendicular distance
        const perpSq = (ox * ox + oz * oz) - (proj * proj);
        const touchDist = R * 2;
        if (perpSq <= touchDist * touchDist) {
          const hitDist = proj - Math.sqrt(Math.max(0, touchDist * touchDist - perpSq));
          if (hitDist > 0 && hitDist < closestDist) {
            closestDist = hitDist;
            hitBall = b;
          }
        }
      }
    }

    // Update Aim Line
    const endPoint = new THREE.Vector3(
      origin.x + dirX * closestDist,
      origin.y,
      origin.z + dirZ * closestDist
    );
    const posAttr = this.aimLineMesh.geometry.attributes.position;
    posAttr.setXYZ(0, origin.x, origin.y, origin.z);
    posAttr.setXYZ(1, endPoint.x, endPoint.y, endPoint.z);
    posAttr.needsUpdate = true;
    this.aimLineMesh.computeLineDistances();

    // Update Ghost Ball Indicator
    if (hitBall) {
      this.ghostBallMesh.visible = true;
      this.ghostBallMesh.position.copy(endPoint);
    } else {
      this.ghostBallMesh.visible = false;
    }

    // Update Cue Stick Position & Rotation
    if (this.cueGroup) {
      const cueDist = R + 0.02 + this.strokeOffset;
      this.cueGroup.position.set(
        origin.x - dirX * cueDist,
        origin.y + 0.015,
        origin.z - dirZ * cueDist
      );
      this.cueGroup.rotation.y = -this.aimAngle + Math.PI / 2;
      this.cueGroup.rotation.x = 0.04; // Slight downward cue angle
    }

    this.updateAimCamera();
  }

  public shootCue() {
    if (!this.state.isAiming || this.physics.isSimulating()) return;

    const cueBall = this.getCueBall();
    if (!cueBall || cueBall.isPotted) return;

    this.state.isAiming = false;
    this.state.isShooting = true;

    // Cue stroke animation (thrust forward)
    const startStroke = this.strokeOffset;
    const duration = 120; // ms
    const startTime = performance.now();

    const animateStroke = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / duration);

      if (progress < 1.0) {
        this.strokeOffset = startStroke * (1.0 - progress);
        this.updateAimGuide();
        requestAnimationFrame(animateStroke);
      } else {
        // Strike moment!
        this.strokeOffset = 0;
        this.updateAimGuide();

        const dir = new THREE.Vector3(Math.cos(this.aimAngle), 0, Math.sin(this.aimAngle));
        this.physics.applyCueShot(
          cueBall.id,
          dir,
          this.state.shotPower,
          this.state.english.x,
          this.state.english.y
        );

        if (this.cueGroup) this.cueGroup.visible = false;
        if (this.aimLineMesh) this.aimLineMesh.visible = false;
        if (this.ghostBallMesh) this.ghostBallMesh.visible = false;
      }
    };

    requestAnimationFrame(animateStroke);
  }

  private setupPointerControls() {
    if (!this.renderer) return;
    const dom = this.renderer.domElement;

    let isPointerDown = false;
    let startX = 0;
    let startY = 0;

    dom.addEventListener('pointerdown', (e) => {
      if (!this.state.isAiming || this.physics.isSimulating()) return;
      isPointerDown = true;
      startX = e.clientX;
      startY = e.clientY;

      if (e.button === 0 && !e.shiftKey && this.state.cameraPreset === 'aim') {
        this.isPullingCue = true;
        this.pullStartY = e.clientY;
      }
    });

    dom.addEventListener('pointermove', (e) => {
      if (!isPointerDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (this.state.cameraPreset === 'aim') {
        // Horizontal mouse drag rotates aiming angle
        this.aimAngle += dx * 0.005;
        this.updateAimGuide();

        // Vertical mouse drag charges stroke pull-back
        if (this.isPullingCue) {
          const pull = Math.max(0, Math.min(0.24, (e.clientY - this.pullStartY) * 0.0018));
          this.strokeOffset = pull;
          this.state.shotPower = Math.min(1.0, Math.max(0.1, pull / 0.24));
          this.notify();
          this.updateAimGuide();
        }
      }

      startX = e.clientX;
      startY = e.clientY;
    });

    const onPointerUp = () => {
      if (isPointerDown && this.isPullingCue) {
        this.isPullingCue = false;
        if (this.strokeOffset > 0.02) {
          this.shootCue();
        } else {
          this.strokeOffset = 0;
          this.updateAimGuide();
        }
      }
      isPointerDown = false;
    };

    dom.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('pointerleave', onPointerUp);
  }

  private onResize = () => {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.composer) {
      this.composer.setSize(width, height);
    }
  };

  private lastSimulating = false;
  private evaluateTurnRules() {
    const mode = this.state.mode;

    if (mode === '4ball') {
      // 4-Ball Scoring: must hit both red balls (id 2 and id 3)
      const hitReds = this.physics.ballsHitSinceShot.filter((id) => id === 2 || id === 3).length;
      const hitOpponent = this.physics.ballsHitSinceShot.includes(this.state.currentTurn === 1 ? 1 : 0);

      if (hitOpponent) {
        this.state.notification = `Foul! Hit opponent cue ball (-10 pts)`;
        if (this.state.currentTurn === 1) this.state.player1Score = Math.max(0, this.state.player1Score - 10);
        else this.state.player2Score = Math.max(0, this.state.player2Score - 10);
      } else if (hitReds === 2) {
        this.state.notification = `★ PERFECT SHOT! Hit both Red Balls (+10 pts)!`;
        if (this.state.currentTurn === 1) this.state.player1Score += 10;
        else this.state.player2Score += 10;
      } else {
        this.state.notification = `No score. Switch turn.`;
      }
    } else if (mode === '3cushion') {
      const cushions = this.physics.cushionsHitSinceShot.length;
      const ballsHit = this.physics.ballsHitSinceShot.length;

      if (cushions >= 3 && ballsHit >= 2) {
        this.state.notification = `★ 3-CUSHION POINT SCORED! (+1 pt)`;
        if (this.state.currentTurn === 1) this.state.player1Score += 1;
        else this.state.player2Score += 1;
      } else {
        this.state.notification = `Cushions: ${cushions}/3 | Target Balls: ${ballsHit}/2. Switch turn.`;
      }
    } else if (mode === '8ball') {
      const cueBall = this.physics.balls.find((b) => b.id === 0);
      if (cueBall && cueBall.isPotted) {
        this.state.notification = `Scratch! Cue ball in pocket!`;
        cueBall.isPotted = false;
        cueBall.position.set(-0.55, this.bounds.ballRadius, 0);
        cueBall.velocity.set(0, 0, 0);
        if (cueBall.mesh) {
          cueBall.mesh.visible = true;
          cueBall.mesh.position.copy(cueBall.position);
        }
      }
    }

    // Switch turn
    this.state.currentTurn = this.state.currentTurn === 1 ? 2 : 1;
    this.notify();
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    // 1. Step Physics
    this.physics.step(0.016);
    const simulating = this.physics.isSimulating();

    // 2. Transition from shooting to resting
    if (this.lastSimulating && !simulating) {
      this.evaluateTurnRules();
      this.state.isAiming = true;
      this.state.isShooting = false;
      if (this.cueGroup) this.cueGroup.visible = true;
      if (this.aimLineMesh) this.aimLineMesh.visible = true;
      this.updateAimGuide();
      this.notify();
    }
    this.lastSimulating = simulating;

    // 3. OrbitControls update
    if (this.orbitControls && this.orbitControls.enabled) {
      this.orbitControls.update();
    }

    // 4. Render
    if (this.composer) {
      this.composer.render();
    } else if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  public destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer?.dispose();
  }
}

export const billiardsEngine = new BilliardsGameEngine();
