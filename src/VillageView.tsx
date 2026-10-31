// The village screen (prototype, 2026-10-30): an 8×8 green where the last game's hero walks its real route.
// Own small three.js scene over the board, so the chess engine stays untouched while this is open.
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { BUILDINGS, PET_DAILY_CAP, buildBlocked, pet, stageForHearts, startBuild, tickVillage } from './village/economy.js';
import { villageTiles } from './village/roster.js';
import { sfx } from './audio/sfx.js';
import { loadVillage, saveVillage, villageRivals } from './village/store';

const FILES = 'abcdefgh';
const SIZE = 1;
const ROLE_OF: Record<string, string> = { a: 'rook', b: 'knight', c: 'bishop', d: 'queen', e: 'king', f: 'bishop', g: 'knight', h: 'rook' };
const ROLE_KO: Record<string, string> = { king: '킹', queen: '퀸', rook: '룩', bishop: '비숍', knight: '나이트', pawn: '폰' };
const SPECIES: Record<string, string> = { king: 'lion', queen: 'tiger', rook: 'rhino', bishop: 'panda', knight: 'kangaroo', pawn: 'meerkat' };
const SPECIES_KO: Record<string, string> = { lion: '사자', tiger: '호랑이', rhino: '코뿔소', panda: '판다', kangaroo: '캥거루', meerkat: '미어캣' };
const TILE_COLORS = [0x8fd46a, 0xc9df7d, 0xe9d9a0, 0xffd1dc];

const slotRole = (slot: string) => (slot[3] === '2' || slot[3] === '7' ? 'pawn' : ROLE_OF[slot[2]]);
const squareXZ = (sq: string): [number, number] => [(FILES.indexOf(sq[0]) - 3.5) * SIZE, (4.5 - Number(sq[1])) * SIZE];
const modelFor = (slot: string, hearts: number) => {
  const sp = SPECIES[slotRole(slot)];
  const stage = stageForHearts(hearts);
  const c = slot[0];
  const suffix = stage === 'grown' ? '_s2' : stage === 'adult' ? '_s3' : stage === 'starlit' ? '_s4' : '';
  return `./packs/legend/${sp}${suffix}_${c}.glb`;
};
export const slotLabel = (slot: string, names: Record<string, string>) => {
  if (names[slot]) return names[slot];
  const role = slotRole(slot);
  const species = SPECIES_KO[SPECIES[role]];
  if (role === 'pawn') return `${species} ${FILES.indexOf(slot[2]) + 1}호`;
  if (role === 'king' || role === 'queen') return species;
  return `${FILES.indexOf(slot[2]) < 4 ? '왼쪽' : '오른쪽'} ${species}`;
};

function mesh(geo: THREE.BufferGeometry, color: number) {
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.75 }));
  m.castShadow = true;
  return m;
}

// Round, toy-like buildings: no assets needed, and they read at this distance.
function makeBuilding(kind: string) {
  const g = new THREE.Group();
  if (kind === 'house') {
    const body = mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.42, 16), 0xfff1d6);
    body.position.y = 0.21;
    const roof = mesh(new THREE.ConeGeometry(0.46, 0.4, 16), 0xf08a8a);
    roof.position.y = 0.62;
    const door = mesh(new THREE.BoxGeometry(0.14, 0.22, 0.04), 0xa86f47);
    door.position.set(0, 0.11, 0.36);
    g.add(body, roof, door);
  } else if (kind === 'bench') {
    const seat = mesh(new THREE.BoxGeometry(0.62, 0.06, 0.2), 0xc98f58);
    seat.position.y = 0.2;
    const back = mesh(new THREE.BoxGeometry(0.62, 0.2, 0.05), 0xc98f58);
    back.position.set(0, 0.33, -0.09);
    for (const x of [-0.24, 0.24]) {
      const leg = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), 0x8a5a33);
      leg.position.set(x, 0.1, 0);
      g.add(leg);
    }
    g.add(seat, back);
  } else if (kind === 'stage') {
    const floor = mesh(new THREE.CylinderGeometry(0.44, 0.46, 0.12, 20), 0xb8a4f0);
    floor.position.y = 0.06;
    const star = mesh(new THREE.OctahedronGeometry(0.14), 0xffe08a);
    star.position.y = 0.42;
    g.add(floor, star);
  } else if (kind === 'fountain') {
    const base = mesh(new THREE.CylinderGeometry(0.44, 0.48, 0.16, 20), 0xd8dee8);
    base.position.y = 0.08;
    const water = mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.04, 20), 0x8fd3f4);
    water.position.y = 0.17;
    const top = mesh(new THREE.SphereGeometry(0.14, 16, 12), 0xbfe8fb);
    top.position.y = 0.34;
    g.add(base, water, top);
  }
  return g;
}

function makeTree() {
  const g = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.24, 8), 0xa86f47);
  trunk.position.y = 0.12;
  const top = mesh(new THREE.SphereGeometry(0.2, 14, 10), 0x6fbf73);
  top.position.y = 0.34;
  g.add(trunk, top);
  return g;
}

type Props = { open: boolean; onClose: () => void; lang: 'ko' | 'en'; summary: any | null };

export default function VillageView({ open, onClose, lang, summary }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [village, setVillage] = useState<any>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [away, setAway] = useState<any[]>([]);
  const [now, setNow] = useState(Date.now());
  const sceneApi = useRef<any>(null);
  const pickRef = useRef<string | null>(null);
  pickRef.current = picking;

  useEffect(() => {
    if (!open) return;
    setPicking(null);
    setNote('');
    const v = loadVillage();
    const t = Date.now();
    const events = tickVillage(v, villageRivals(), t);
    v.lastSeen = t;
    saveVillage(v);
    setVillage({ ...v });
    setAway(events);
    (window as any).wizardChess?.setRenderPaused?.(true);
    return () => { (window as any).wizardChess?.setRenderPaused?.(false); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const v = loadVillage();
      const events = tickVillage(v, villageRivals(), t);
      if (events.length) {
        saveVillage(v);
        setVillage({ ...v });
        setAway((a) => [...a, ...events]);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [open]);

  // Build the 3D green once per opening; later state changes redraw only the marks.
  useEffect(() => {
    if (!open || !hostRef.current || !village) return;
    const host = hostRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfe9ff);
    const camera = new THREE.PerspectiveCamera(38, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.set(0, 11, 11);
    camera.lookAt(0, 0, 0.4);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb8e0a0, 1.5));
    const sun = new THREE.DirectionalLight(0xfff2d8, 1.8);
    sun.position.set(5, 10, 6);
    sun.castShadow = true;
    sun.shadow.camera.left = sun.shadow.camera.bottom = -7;
    sun.shadow.camera.right = sun.shadow.camera.top = 7;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(9, 48), new THREE.MeshStandardMaterial({ color: 0x79c85f }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.03;
    ground.receiveShadow = true;
    scene.add(ground);

    const tileMeshes: THREE.Mesh[] = [];
    for (let f = 0; f < 8; f++) {
      for (let r = 1; r <= 8; r++) {
        const sq = `${FILES[f]}${r}`;
        const t = new THREE.Mesh(new THREE.BoxGeometry(SIZE * 0.96, 0.06, SIZE * 0.96), new THREE.MeshStandardMaterial({ color: TILE_COLORS[0], roughness: 0.9 }));
        const [x, z] = squareXZ(sq);
        t.position.set(x, 0, z);
        t.receiveShadow = true;
        t.userData.sq = sq;
        scene.add(t);
        tileMeshes.push(t);
      }
    }
    const marks = new THREE.Group();
    scene.add(marks);

    const loader = new GLTFLoader();
    const mixers: THREE.AnimationMixer[] = [];
    const actors: any[] = [];
    const addActor = (slot: string, hearts: number, sq: string) => {
      loader.load(modelFor(slot, hearts), (gltf: any) => {
        const model = cloneSkeleton(gltf.scene);
        const box = new THREE.Box3().setFromObject(model);
        const s = 0.95 / (box.max.y - box.min.y);
        model.scale.setScalar(s);
        model.position.y = -box.min.y * s;
        const root = new THREE.Group();
        root.add(model);
        const [x, z] = squareXZ(sq);
        root.position.set(x, 0.03, z);
        root.userData.slot = slot;
        model.traverse((o: any) => { if (o.isMesh) { o.castShadow = true; o.userData.slot = slot; } });
        scene.add(root);
        const mixer = new THREE.AnimationMixer(model);
        mixers.push(mixer);
        const play = (name: string) => {
          const clip = gltf.animations.find((c: any) => c.name === name);
          if (!clip) return;
          mixer.stopAllAction();
          mixer.clipAction(clip).play();
        };
        play('Idle');
        actors.push({ slot, root, play, path: [] as [number, number][] });
        const walk = sceneApi.current?.walk;
        if (walk && walk.slot === slot && walk.route.length > 1) {
          const a = actors[actors.length - 1];
          a.path = walk.route.slice(1).map(squareXZ);
          const [sx, sz] = squareXZ(walk.route[0]);
          root.position.set(sx, 0.03, sz);
          a.play('Walk');
        }
      }, undefined, () => { /* a missing stage model just leaves the square empty */ });
    };

    const redraw = (v: any) => {
      const tiles = villageTiles(v.map) as Record<string, number>;
      for (const t of tileMeshes) (t.material as THREE.MeshStandardMaterial).color.setHex(TILE_COLORS[tiles[t.userData.sq] || 0]);
      marks.clear();
      for (const tree of v.map.trees.slice(-24)) {
        const m = makeTree();
        const [x, z] = squareXZ(tree.sq);
        m.position.set(x + 0.28, 0.03, z - 0.28);
        marks.add(m);
      }
      for (const b of v.built) {
        const m = makeBuilding(b.kind);
        const [x, z] = squareXZ(b.sq);
        m.position.set(x, 0.03, z);
        marks.add(m);
      }
      if (v.build) {
        const m = makeBuilding(v.build.kind);
        const [x, z] = squareXZ(v.build.sq);
        m.position.set(x, 0.03, z);
        m.traverse((o: any) => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.45; } });
        marks.add(m);
      }
    };
    sceneApi.current = { redraw, walk: village.walk };
    redraw(village);

    const slots = [village.walk?.slot, ...Object.entries(village.hearts).sort((a: any, b: any) => b[1] - a[1]).map(([s]) => s)].filter(Boolean) as string[];
    const unique = [...new Set(slots)].slice(0, 3);
    if (!unique.length) unique.push('w_e2', 'w_e1');
    unique.forEach((slot, i) => addActor(slot, village.hearts[slot] || 0, ['e4', 'c5', 'f5'][i]));

    const ray = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      ptr.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ptr, camera);
      if (pickRef.current) {
        const hit = ray.intersectObjects(tileMeshes)[0];
        if (hit) {
          const v = loadVillage();
          if (startBuild(v, pickRef.current, hit.object.userData.sq, Date.now())) {
            saveVillage(v);
            setVillage({ ...v });
            redraw(v);
            setPicking(null);
          } else setNote('여기에는 지을 수 없습니다.');
        }
        return;
      }
      const hit = ray.intersectObjects(actors.map((a) => a.root), true)[0];
      const slot = hit?.object.userData.slot;
      if (!slot) return;
      const v = loadVillage();
      const gained = pet(v, slot, Date.now());
      saveVillage(v);
      setVillage({ ...v });
      const a = actors.find((x) => x.slot === slot);
      if (gained) sfx.voice(slotRole(slot));
      a?.play('Cheer');
      setTimeout(() => a?.play('Idle'), 1600);
      setNote(gained ? `${slotLabel(slot, v.names)}: 💗 ${v.hearts[slot]}` : `오늘은 충분히 쓰다듬었어요. 내일 또 만나요.`);
    };
    renderer.domElement.addEventListener('click', onClick);

    const clock = new THREE.Clock();
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = clock.getDelta();
      mixers.forEach((m) => m.update(dt));
      for (const a of actors) {
        if (!a.path.length) continue;
        const [x, z] = a.path[0];
        const dx = x - a.root.position.x;
        const dz = z - a.root.position.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.05) {
          a.path.shift();
          if (!a.path.length) a.play('Cheer');
          continue;
        }
        const step = Math.min(d, dt * 1.6);
        a.root.position.x += (dx / d) * step;
        a.root.position.z += (dz / d) * step;
        a.root.rotation.y = Math.atan2(dx, dz);
      }
      renderer.render(scene, camera);
    };
    loop();
    const onResize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.dispose();
      host.innerHTML = '';
      sceneApi.current = null;
    };
    // the scene is rebuilt per opening, not per coin
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, !!village]);

  useEffect(() => {
    if (village) sceneApi.current?.redraw(village);
  }, [village]);

  if (!open) return null;
  const rivals = villageRivals();
  const rivalName = (id: string) => rivals.find((r: any) => r.id === id)?.name?.ko || id;
  const left = village?.build ? Math.max(0, village.build.done - now) : 0;
  const leftText = left >= 60000 ? `${Math.ceil(left / 60000)}분` : `${Math.ceil(left / 1000)}초`;
  const hero = village?.walk?.slot;

  return (
    <div className="village-view" id="village-view">
      <div className="village-canvas" ref={hostRef} />
      <div className="village-top">
        <span className="village-pill">🌰 {village?.coins ?? 0}</span>
        <span className="village-pill">🤚 오늘 쓰다듬기 {Math.min(village?.petCount ?? 0, PET_DAILY_CAP)}/{PET_DAILY_CAP}</span>
        {village?.build && <span className="village-pill">🔨 {BUILDINGS[village.build.kind as keyof typeof BUILDINGS].ko} {leftText}</span>}
        <button type="button" className="hud-btn village-close" onClick={onClose}>{lang === 'en' ? 'Back to the board' : '♟ 체스로'}</button>
      </div>

      {(summary || away.length > 0 || note) && (
        <div className="village-card">
          {summary && (
            <div>
              <b>이번 판</b> 🌰 +{summary.coins} · {slotLabel(summary.mvp, village?.names || {})} 💗 +{summary.hearts}
              {summary.added.trees.length > 0 && ` · 나무 ${summary.added.trees.length}그루`}
              {summary.added.houses.length > 0 && ' · 승급한 폰의 집'}
            </div>
          )}
          {hero && <div>{slotLabel(hero, village?.names || {})}, 오늘 지나간 길을 다시 걷는 중이에요.</div>}
          {away.map((e, i) => (
            <div key={i}>
              {e.type === 'built' && `🔨 ${BUILDINGS[e.kind as keyof typeof BUILDINGS].ko} 완성!`}
              {e.type === 'visit' && `💌 ${rivalName(e.rival)} 다녀감, 🌰 +${e.coins}${e.memory ? ` — "지난번 ${slotLabel(e.memory.mvp, village?.names || {})} 멋졌어!"` : ''}`}
            </div>
          ))}
          {note && <div>{note}</div>}
        </div>
      )}

      <div className="village-build">
        {Object.entries(BUILDINGS).map(([id, b]) => {
          const blocked = village ? buildBlocked(village, id, '') : 'busy';
          return (
            <button
              key={id}
              type="button"
              className={`village-build-btn${picking === id ? ' active' : ''}`}
              disabled={blocked === 'busy' || blocked === 'coins'}
              onClick={() => { setPicking(picking === id ? null : id); setNote(picking === id ? '' : '지을 칸을 누르세요.'); }}
            >
              <span>{b.icon}</span>
              <span>{b.ko}</span>
              <small>🌰 {b.cost}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}
