# 🧍 의인화 치비 두 발 자동 리깅 (2026-10-09 · 사용자 "4발로 뛰는게 아니라 2발로 사람처럼 뛰고 탈것도 사람처럼 앉아서")
#   blender --background --python tools/legend/biped_rig.py -- <mesh.glb> <out.glb> <render_prefix>
# 메시 모양에서 다리·팔·꼬리 위치를 찾아 뼈대를 세우고(Hips·Spine·Chest·Head·UpperArm/LowerArm·UpperLeg/LowerLeg·Tail1/2),
# 가중치는 rig_transfer 와 같은 방식(복셀로 닫은 복제본에서 bone heat → 가장 가까운 면으로 옮김),
# 동작은 키프레임으로 직접 만든다: Idle · Walk · Run · Sit(탈것에 앉아 운전) · Cheer. 외부 동작 파일·계정 0.
# 축: glTF 앞(+Z) = Blender -Y. 높이는 1.0 으로 맞춘다(게임이 render.scale 로 키운다).
import bpy, sys, os, math
import numpy as np
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT, PRE = [os.path.abspath(a) for a in argv[:3]]
# 기존 치비 규약에 맞춘다: 키 1.5 · 발 높이 -0.5(원점이 몸 가운데) — 발이 원점이면 게임에서 0.5 떠 보였다(2026-10-09)
H = float(os.environ.get('HEIGHT', '1.5'))
FOOT_Y = float(os.environ.get('FOOT_Y', '-0.5'))

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
ms = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in ms: o.select_set(True)
bpy.context.view_layer.objects.active = ms[0]
if len(ms) > 1: bpy.ops.object.join()
mesh = bpy.context.view_layer.objects.active
for o in list(bpy.context.scene.objects):
    if o.type != 'MESH': bpy.data.objects.remove(o, do_unlink=True)
mesh.parent = None
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
# 🧭 앞 방향 보정(도) — 3/4 측면 콘셉트로 만든 TRELLIS 메시는 리그 기준 정면이 아니다(2026-10-14 맨몸 여우가 180° 뒤를 봄). 큐 env YAW 로 준다
YAW = float(os.environ.get('YAW', '0'))
if YAW:
    # glTF 가져온 오브젝트는 rotation_mode 가 QUATERNION 이라 rotation_euler 는 무시된다 → 정점 데이터를 직접 회전
    from mathutils import Matrix
    mesh.data.transform(Matrix.Rotation(math.radians(YAW), 4, 'Z')); mesh.data.update(); print('YAW', YAW)
# 겹친 정점 합치기 — TRELLIS 메시는 삼각형이 따로 놀아 가중치 다듬기가 이웃으로 퍼지지 못하고, 달릴 때 꼬리가 파편처럼 갈라졌다(시바 2026-10-09)
#   UV 는 면 모서리 값이라 합쳐도 텍스처는 그대로다
bpy.context.view_layer.objects.active = mesh; bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.remove_doubles(threshold=float(os.environ.get('WELD', '0.0006'))); bpy.ops.object.mode_set(mode='OBJECT')
print('WELD verts', len(mesh.data.vertices))
P = np.array([v.co[:] for v in mesh.data.vertices])
mn, mx = P.min(0), P.max(0); s = H / (mx[2] - mn[2])
mesh.scale = (s, s, s); bpy.ops.object.transform_apply(scale=True)
P = np.array([v.co[:] for v in mesh.data.vertices]); mn, mx = P.min(0), P.max(0)
mesh.location = Vector((-(mn[0] + mx[0]) / 2, -(mn[1] + mx[1]) / 2, -mn[2])); bpy.ops.object.transform_apply(location=True)
# 좌우 중심은 발(아래 12%) 기준 — 꼬리가 옆으로 뻗은 종(여우)은 상자 중심이 몸에서 벗어나 한쪽 팔·다리만 가중치를 받았다
P = np.array([v.co[:] for v in mesh.data.vertices]); feet = P[:, 2] < 0.12 * H
cx = float(np.median(P[feet, 0])) if feet.any() else 0.0; cy = float(np.median(P[feet, 1])) if feet.any() else 0.0
mesh.location = Vector((-cx, -cy, 0)); bpy.ops.object.transform_apply(location=True)
P = np.array([v.co[:] for v in mesh.data.vertices]); X, Y, Z = P[:, 0], P[:, 1], P[:, 2]
print('CENTER shift', round(cx, 3), round(cy, 3))

# ── 몸 분석 ──
def band(z0, z1): return (Z >= z0 * H) & (Z < z1 * H)
low = band(0.0, 0.16)
lx = float(np.median(np.abs(X[low]))) if low.any() else 0.08 * H          # 다리 좌우 간격(발 쪽 정점 |x| 중앙값)
ly = float(np.median(Y[low])) if low.any() else 0.0
mid = band(0.30, 0.52)
core = mid & (np.abs(X) < np.percentile(np.abs(X[mid]), 60))
by = float(np.median(Y[core])) if core.any() else 0.0                     # 몸통 앞뒤 중심
if abs(by - ly) > 0.2 * H:   # 몸통 높이에 걸친 큰 꼬리(시바 by 0.58 · 발 0.01)가 몸 중심을 끌고 가 꼬리 가중치가 0 → 달릴 때 꼬리가 발끝까지 늘어났다(2026-10-11)
    print('BY guard', round(by, 3), '->', round(ly, 3)); by = ly; core = core & (np.abs(Y - by) < 0.2 * H)   # 몸통 두께(depth)도 꼬리를 빼고 잰다
ax = float(np.percentile(np.abs(X[mid]), 96)) if mid.any() else 0.2 * H    # 팔 끝 좌우
back = band(0.08, 0.5) & (Y > by + 0.5 * (Y[mid].max() - by))             # 몸 뒤로 튀어나온 것 = 꼬리
tail = back.sum() > 40 and os.environ.get('NO_TAIL', '0') != '1'   # NO_TAIL=1 (chess copy): chunky backs were mistaken for a tail and torn by the wag
tail_tip = Vector((float(np.median(X[back])), float(Y[back].max()) * 0.92, float(np.median(Z[back])))) if tail else None
# 손 — 좌우로 가장 바깥(팔을 벌린 A자 자세 입력 기준). 어깨는 몸통 가장자리, 팔꿈치는 가운데
HAND = {}
for sd, sg in (('L', 1), ('R', -1)):
    S = (sg * X > 0) & (Z > 0.25 * H) & (Z < 0.62 * H) & (np.abs(Y - by) < 0.25 * H)
    xm = float((sg * X[S]).max()) if S.any() else 0.3 * H
    hm = S & (sg * X > 0.86 * xm)
    hand = P[hm].mean(0) if hm.any() else np.array([sg * xm, by, 0.4 * H])
    sh = np.array([sg * max(0.45 * xm, lx * 1.6), by, min(0.52 * H, hand[2] + 0.08 * H)])
    HAND[sd] = (sh, (sh + hand) / 2, hand)
print('ARMS', {k: [list(np.round(x, 2)) for x in v] for k, v in HAND.items()})
# 가랑이 높이 — 다리 사이(가운데 좁은 띠)에서 가장 낮은 몸 정점. 키의 27% 고정이면 다리 긴 사슴은 허벅지가 몸통에 섞여 달릴 때 일그러졌다(2026-10-09)
gap = (np.abs(X) < max(0.3 * lx, 0.01 * H)) & (Z > 0.04 * H) & (np.abs(Y - ly) < 0.15 * H)
crotch = float(np.percentile(Z[gap], 20)) if gap.sum() > 20 else 0.25 * H
_hr = crotch / H + 0.02   # 탐지가 종마다 들쭉날쭉했다(고양이 0.40 → 몸 찢어짐) — 그럴듯한 범위만 믿고, 아니면 0.27(여우로 맞춘 값)
HR = float(os.environ['HIP']) if os.environ.get('HIP') else (_hr if 0.24 <= _hr <= 0.35 else 0.27)
print('HIP ratio', round(HR, 3))
print('BODY lx', round(lx, 3), 'ly', round(ly, 3), 'by', round(by, 3), 'ax', round(ax, 3), 'tail', bool(tail), tail_tip)

# ── 뼈대 ──
arm_data = bpy.data.armatures.new('Rig'); arm = bpy.data.objects.new('Rig', arm_data); bpy.context.scene.collection.objects.link(arm)
bpy.ops.object.select_all(action='DESELECT'); arm.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT'); eb = arm_data.edit_bones
def bone(name, head, tail_, parent=None, connect=False):
    b = eb.new(name); b.head = Vector(head); b.tail = Vector(tail_)
    if parent: b.parent = eb[parent]; b.use_connect = connect
    return b
hipZ = HR * H; chestZ = max(0.47 * H, hipZ + 0.12 * H); neckZ = max(0.55 * H, chestZ + 0.06 * H)
bone('Root', (0, by, 0), (0, by, 0.08 * H))
bone('Hips', (0, by, hipZ), (0, by, (hipZ + chestZ) / 2), 'Root')
bone('Spine', (0, by, (hipZ + chestZ) / 2), (0, by, chestZ), 'Hips', True)
bone('Chest', (0, by, chestZ), (0, by, neckZ), 'Spine', True)
bone('Head', (0, by, neckZ), (0, by, H), 'Chest', True)
sx = max(ax * 0.55, lx * 1.1)
for sd, sg in (('L', 1), ('R', -1)):
    sh, el, hd = HAND[sd]
    bone(f'UpperArm.{sd}', sh, el, 'Chest')
    bone(f'LowerArm.{sd}', el, hd, f'UpperArm.{sd}', True)
    bone(f'UpperLeg.{sd}', (sg * lx, ly, hipZ), (sg * lx, ly, 0.52 * hipZ), 'Hips')
    bone(f'LowerLeg.{sd}', (sg * lx, ly, 0.52 * hipZ), (sg * lx, ly - 0.02 * H, 0.015 * H), f'UpperLeg.{sd}', True)
if tail:
    t0 = Vector((0, by + 0.6 * (tail_tip.y - by) * 0.4, max(0.12 * H, min(0.3 * H, tail_tip.z))))
    tm = t0.lerp(tail_tip, 0.5)
    bone('Tail1', t0, tm, 'Hips'); bone('Tail2', tm, tail_tip, 'Tail1', True)
bpy.ops.object.mode_set(mode='OBJECT')

# ── 가중치: 모양 기반 직접 계산 ──
# bone heat 는 큰 머리·옆으로 붙은 꼬리에서 실패했다(여우: 몸 위쪽 정점 2.8만 중 2.2만이 왼팔, 1.3만이 꼬리 — 2026-10-09).
# 치비 체형은 단순해서 영역 규칙 + 뼈까지 거리로 정하는 쪽이 안정적이다.
def seg_dist(Pp, a, b):
    a, b = np.array(a), np.array(b); ab = b - a; t_ = np.clip(((Pp - a) @ ab) / max(ab @ ab, 1e-9), 0, 1)
    return np.linalg.norm(Pp - (a + t_[:, None] * ab), axis=1)
B = {b.name: (np.array(b.head_local[:]), np.array(b.tail_local[:])) for b in arm.data.bones}
names = [n for n in B if n != 'Root']; W = np.zeros((len(P), len(names))); col = {n: i for i, n in enumerate(names)}
def put(mask, n, w): W[mask, col[n]] += w[mask] if hasattr(w, '__len__') else w
smooth = lambda x, a, b: np.clip((x - a) / max(b - a, 1e-6), 0, 1)
# 1) 몸통 축(Hips·Spine·Chest·Head) — 높이로 섞는다
zH = Z / H
put(np.ones(len(P), bool), 'Hips', 1 - smooth(zH, HR + 0.03, HR + 0.13))
put(np.ones(len(P), bool), 'Spine', smooth(zH, HR + 0.03, HR + 0.13) * (1 - smooth(zH, 0.44, 0.50)))
put(np.ones(len(P), bool), 'Chest', smooth(zH, 0.44, 0.50) * (1 - smooth(zH, 0.53, 0.58)))
put(np.ones(len(P), bool), 'Head', smooth(zH, 0.53, 0.58))
# 2) 다리 — 엉덩이 아래, 좌우로 가른다(가운데 좁은 띠는 엉덩이와 섞음)
legm = zH < HR + 0.03
# 몸 뒤로 튀어나온 정점(꼬리)은 다리 가중치에서 뺀다 — 시바처럼 꼬리가 다리 높이까지 내려오면 달릴 때 꼬리가 늘어났다(2026-10-09)
_d0 = np.percentile(np.abs(Y[core] - by), 85) if core.any() else 0.15 * H
legm &= ~((Y - by) > _d0 * 0.8)
for sd, sg in (('L', 1), ('R', -1)):
    side = smooth(sg * X / max(lx, 1e-3), -0.15, 0.35)
    k = side * (1 - smooth(zH, HR - 0.05, HR + 0.03)); up = smooth(zH, HR * 0.4, HR * 0.62)
    put(legm, f'UpperLeg.{sd}', k * up); put(legm, f'LowerLeg.{sd}', k * (1 - up))
W[legm, col['Hips']] *= 1 - np.clip(sum(W[legm, col[f'{a}Leg.{s}']] for a in ('Upper', 'Lower') for s in ('L', 'R')), 0, 1)
# 3) 팔 — 몸통 축보다 팔 뼈가 확실히 가까운 정점만
spine_d = np.hypot(X, Y - by)
for sd in ('L', 'R'):
    ua, la = B[f'UpperArm.{sd}'], B[f'LowerArm.{sd}']
    du, dl = seg_dist(P, *ua), seg_dist(P, *la); da = np.minimum(du, dl)
    # ARM_NEAR / ARM_FALL (chess copy, 2026-10-29): chunky bodies (rhino) spilled arm weights into the torso → spikes
    # when the arms rotate. Smaller ARM_NEAR captures fewer torso vertices; ARM_FALL sets the falloff radius.
    ARM_NEAR = float(os.environ.get('ARM_NEAR', '0.55')); ARM_FALL = float(os.environ.get('ARM_FALL', '0.4'))
    near = (zH > 0.24) & (zH < 0.60) & (da < ARM_NEAR * spine_d) & (np.sign(X) == (1 if sd == 'L' else -1))
    k = np.clip(1.6 - da / (ARM_FALL * spine_d + 1e-6), 0, 1)
    W[near] *= (1 - k[near])[:, None]
    put(near, f'UpperArm.{sd}', k * (du <= dl)); put(near, f'LowerArm.{sd}', k * (dl < du))
# 4) 꼬리 — 몸통 뒤로 튀어나온 부분
if 'Tail1' in col:
    t1, t2 = seg_dist(P, *B['Tail1']), seg_dist(P, *B['Tail2'])
    depth = np.percentile(np.abs(Y[core] - by), 85) if core.any() else 0.15 * H
    tm = ((Y - by) > depth * 0.9) & (zH < 0.62)
    k = smooth(Y - by, depth * 0.9, depth * 1.3)
    W[tm] *= (1 - k[tm])[:, None]; put(tm, 'Tail1', k * (t1 <= t2)); put(tm, 'Tail2', k * (t2 < t1))
W /= np.maximum(W.sum(1, keepdims=True), 1e-6)
for n in names:
    g = mesh.vertex_groups.new(name=n); w = W[:, col[n]]
    for vi in np.nonzero(w > 0.01)[0]: g.add([int(vi)], float(w[vi]), 'REPLACE')
bpy.ops.object.select_all(action='DESELECT'); mesh.select_set(True); bpy.context.view_layer.objects.active = mesh
bpy.ops.object.mode_set(mode='WEIGHT_PAINT')
bpy.ops.object.vertex_group_smooth(group_select_mode='ALL', factor=0.5, repeat=2)
bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4)
bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)
bpy.ops.object.mode_set(mode='OBJECT')
cnt = {n: int((W[:, col[n]] > 0.5).sum()) for n in names}
print('WEIGHTS', cnt)
mesh.parent = arm; am = mesh.modifiers.new('arm', 'ARMATURE'); am.object = arm

# ── 동작(키프레임) ──
sc = bpy.context.scene; sc.render.fps = 30
pb = arm.pose.bones
for b in pb: b.rotation_mode = 'XYZ'
R = math.radians
def act(name, length, keys):
    """keys: {frame: {bone: (rx, ry, rz) 도 | ('loc', (x,y,z))}}"""
    a = bpy.data.actions.new(name); arm.animation_data_create(); arm.animation_data.action = a
    for b in pb: b.rotation_euler = (0, 0, 0); b.location = (0, 0, 0)
    for f, kv in sorted(keys.items()):
        for b in pb: b.rotation_euler = (0, 0, 0); b.location = (0, 0, 0)
        for bn, v in kv.items():
            if bn not in pb: continue
            if isinstance(v, tuple) and len(v) == 2 and v[0] == 'loc': pb[bn].location = v[1]
            else: pb[bn].rotation_euler = tuple(R(x) for x in v)
        for b in pb: b.keyframe_insert('rotation_euler', frame=f); b.keyframe_insert('location', frame=f)
    a.use_fake_user = True
    tr = arm.animation_data.nla_tracks.new(); tr.name = name; tr.strips.new(name, 0, a)
    return a
LEG = float(os.environ.get('LEGSIGN', '1'))
TAILW = float(os.environ.get('TAILW', '8'))   # 꼬리 흔들기(도) — 18° 는 옆으로 말린 큰 꼬리(시바)가 찢어졌다
ARM_DOWN = float(os.environ.get('ARM_DOWN', '38'))   # A자 팔을 몸 옆으로 내리는 각도(로컬 Z · L 양수 = 내림)   # 다리 앞뒤 회전 방향(렌더로 확인해 뒤집을 수 있다)
def stride(f, amp, arm_amp, bob, lean, n):
    k = {}
    for i in range(n + 1):
        ph = 2 * math.pi * i / n; s = math.sin(ph)
        k[f + i * 2] = {'UpperLeg.L': (LEG * amp * s, 0, 0), 'UpperLeg.R': (-LEG * amp * s, 0, 0),
                        'LowerLeg.L': (-LEG * max(0, -s) * amp * 1.2, 0, 0), 'LowerLeg.R': (-LEG * max(0, s) * amp * 1.2, 0, 0),
                        'UpperArm.L': (-arm_amp * s, 0, ARM_DOWN), 'UpperArm.R': (-arm_amp * s, 0, -ARM_DOWN),
                        'LowerArm.L': (-20, 0, 0), 'LowerArm.R': (20, 0, 0),
                        'Spine': (-LEG * lean, 0, 0), 'Hips': ('loc', (0, abs(math.cos(ph)) * bob * H, 0)),
                        'Tail1': (0, 0, TAILW * math.sin(ph)), 'Head': (LEG * 3 * math.cos(2 * ph), 0, 0)}
    return k
IA = lambda d: {'UpperArm.L': (0, 0, ARM_DOWN + d), 'UpperArm.R': (0, 0, -ARM_DOWN - d), 'LowerArm.L': (-8, 0, 0), 'LowerArm.R': (8, 0, 0)}
act('Idle', 60, {0: dict(IA(0), Spine=(0, 0, 0), Head=(0, 0, -3), Tail1=(0, 0, -6)),
                 30: dict(IA(4), Spine=(-LEG * 2, 0, 0), Head=(0, 0, 4), Tail1=(0, 0, 6), Hips=('loc', (0, 0.008 * H, 0))),
                 60: dict(IA(0), Spine=(0, 0, 0), Head=(0, 0, -3), Tail1=(0, 0, -6))})
act('Walk', 24, stride(0, 28, 25, 0.02, 4, 12))
act('Run', 16, stride(0, 50, 50, 0.05, 12, 8))
SIT = {'UpperLeg.L': (LEG * 85, 0, 4), 'UpperLeg.R': (LEG * 85, 0, -4), 'LowerLeg.L': (-LEG * 80, 0, 0), 'LowerLeg.R': (-LEG * 80, 0, 0),
       'UpperArm.L': (-50, 0, 25), 'UpperArm.R': (50, 0, -25), 'LowerArm.L': (-30, 0, 0), 'LowerArm.R': (30, 0, 0), 'Spine': (-LEG * 4, 0, 0)}
act('Sit', 40, {0: dict(SIT, Head=(0, 0, -3)), 20: dict(SIT, Head=(0, 0, 3), Tail1=(0, 0, 4)), 40: dict(SIT, Head=(0, 0, -3))})
CH = lambda w: {'UpperArm.L': (0, 0, -95 - w), 'UpperArm.R': (0, 0, 95 + w), 'LowerArm.L': (0, 0, -10), 'LowerArm.R': (0, 0, 10), 'Hips': ('loc', (0, (0.06 if w > 0 else 0) * H, 0)), 'Tail1': (0, 0, w)}
act('Cheer', 24, {0: CH(0), 6: CH(15), 12: CH(0), 18: CH(15), 24: CH(0)})
arm.animation_data.action = None

# ── 확인 렌더 ──
sc.render.engine = 'BLENDER_EEVEE'; sc.view_settings.view_transform = 'Standard'; sc.render.resolution_x = sc.render.resolution_y = 360
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.55, 0.57, 0.62, 1)
for nm, e, rot in (('key', 3.0, (50, 0, 35)), ('fill', 1.2, (60, 0, -60))):
    L = bpy.data.objects.new(nm, bpy.data.lights.new(nm, 'SUN')); sc.collection.objects.link(L); L.data.energy = e; L.rotation_euler = tuple(math.radians(a) for a in rot)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.type = 'ORTHO'; cam.data.ortho_scale = 1.5 * H
a = math.radians(-60); tgt = Vector((0, 0, 0.5 * H)); cam.location = (8 * math.sin(a), -8 * math.cos(a), 0.5 * H + 1.5); cam.rotation_euler = (tgt - cam.location).to_track_quat('-Z', 'Y').to_euler()
arm.animation_data.use_nla = False   # 확인 렌더는 한 동작만 — NLA 트랙이 켜져 있으면 5개 동작이 겹쳐 몸이 통째로 누웠다(2026-10-09)
for nm, frames in (('Idle', (0,)), ('Run', (0, 4, 8, 12)), ('Sit', (0,)), ('Cheer', (6,))):
    arm.animation_data.action = bpy.data.actions[nm]
    for i, fr in enumerate(frames):
        sc.frame_set(fr); sc.render.filepath = f'{PRE}_{nm.lower()}_{i}.png'; bpy.ops.render.render(write_still=True)
arm.animation_data.action = None; arm.animation_data.use_nla = True
arm.location.z = FOOT_Y   # 내보낼 때만 발을 -0.5 로 내린다(뼈 위치 계산은 발=0 기준)
bpy.ops.object.select_all(action='DESELECT'); arm.select_set(True); mesh.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, use_selection=True, export_yup=True, export_animations=True, export_animation_mode='NLA_TRACKS', export_image_format='WEBP')
print('DONE', OUT)
