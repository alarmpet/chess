# Add Attack / Hit / Kneel clips to an already-rigged study-game "legend" biped (PLAN §1.2 "biped 보강").
#   "D:/tools/Blender 5.2/blender.exe" --background --python tools/legend_add_clips.py -- <in.glb> <out.glb>
# Keeps the existing armature, weights and the 5 original clips (Idle/Walk/Run/Sit/Cheer); only adds actions
# and re-exports with every action on its own NLA track. Bone conventions follow study-game/tools/legend/biped_rig.py:
#   bones Root·Hips·Spine·Chest·Head·UpperArm/LowerArm.{L,R}·UpperLeg/LowerLeg.{L,R}·Tail1/2, Euler XYZ degrees,
#   ARM_DOWN (arm rest angle) and LEG (leg swing sign) are read back from the imported Idle/Walk actions.
import bpy, sys, os, math
from mathutils import Euler, Vector

argv = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT = [os.path.abspath(a) for a in argv[:2]]
ATTACK_SIGN = float(os.environ.get('ATTACK_SIGN', '1'))   # flip if the swing goes backwards in the viewer

bpy.ops.wm.read_factory_settings(use_empty=True)
# fps BEFORE import: the glTF importer maps clip times onto scene frames, so importing at the default 24 fps and
# exporting at 30 would shorten every original clip to 0.8x (seen on the first trial: Idle 2.00 s -> 1.63 s).
bpy.context.scene.render.fps = 30
bpy.ops.import_scene.gltf(filepath=SRC)
arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
sc = bpy.context.scene
sc.render.fps = 30
pb = arm.pose.bones
H = max(b.tail.z for b in arm.data.bones) - min(b.head.z for b in arm.data.bones)
if H < 1e-3: H = 1.0

def action_fcurves(action):
    """Blender 5.x layered actions: fcurves live in channelbags per slot. Fall back to legacy .fcurves."""
    if hasattr(action, 'fcurves'):
        return list(action.fcurves)
    out = []
    for layer in action.layers:
        for strip in layer.strips:
            for slot in action.slots:
                cb = strip.channelbag(slot)
                if cb: out.extend(cb.fcurves)
    return out

def euler_of(action, bone, frame):
    """Evaluate a bone's rotation (XYZ degrees) in an imported action at a frame."""
    q = [1, 0, 0, 0]
    path = f'pose.bones["{bone}"].rotation_quaternion'
    found = False
    fcs = action_fcurves(action)
    for fc in fcs:
        if fc.data_path == path:
            q[fc.array_index] = fc.evaluate(frame); found = True
    if not found:
        path = f'pose.bones["{bone}"].rotation_euler'
        e = [0, 0, 0]
        for fc in fcs:
            if fc.data_path == path:
                e[fc.array_index] = fc.evaluate(frame); found = True
        return [math.degrees(x) for x in e]
    from mathutils import Quaternion
    return [math.degrees(x) for x in Quaternion(q).to_euler('XYZ')]

acts = {a.name: a for a in bpy.data.actions}
ARM_DOWN = euler_of(acts['Idle'], 'UpperArm.L', 0)[2] if 'Idle' in acts else 38.0
LEG = 1.0
if 'Walk' in acts:
    x = euler_of(acts['Walk'], 'UpperLeg.L', 2)[0]
    LEG = 1.0 if x >= 0 else -1.0
print('DERIVED ARM_DOWN', round(ARM_DOWN, 1), 'LEG', LEG, 'H', round(H, 3), 'bones', [b.name for b in arm.data.bones])

# Make sure every existing action sits on an NLA track so the exporter keeps it.
arm.animation_data_create()
ad = arm.animation_data
on_tracks = {s.action.name for t in ad.nla_tracks for s in t.strips if s.action}
def add_track(a):
    tr = ad.nla_tracks.new(); tr.name = a.name
    st = tr.strips.new(a.name, 0, a)
    if hasattr(st, 'action_slot') and getattr(a, 'slots', None) and len(a.slots):
        st.action_slot = a.slots[0]
for a in list(bpy.data.actions):
    if a.name not in on_tracks:
        add_track(a); on_tracks.add(a.name)

R = math.radians
def act(name, keys):
    """keys: {frame: {bone: (rx, ry, rz) degrees | ('loc', (x, y, z))}} — quaternion keys so the imported
    (quaternion-mode) bones evaluate them."""
    if name in bpy.data.actions:
        bpy.data.actions.remove(bpy.data.actions[name])
    a = bpy.data.actions.new(name)
    ad.action = a
    for f, kv in sorted(keys.items()):
        for b in pb:
            b.rotation_quaternion = (1, 0, 0, 0); b.location = (0, 0, 0)
        for bn, v in kv.items():
            if bn not in pb: continue
            if isinstance(v, tuple) and len(v) == 2 and v[0] == 'loc':
                pb[bn].location = v[1]
            else:
                pb[bn].rotation_quaternion = Euler(tuple(R(x) for x in v), 'XYZ').to_quaternion()
        for b in pb:
            b.keyframe_insert('rotation_quaternion', frame=f)
            b.keyframe_insert('location', frame=f)
    a.use_fake_user = True
    ad.action = None
    add_track(a)
    return a

A = ARM_DOWN
REST = {'UpperArm.L': (0, 0, A), 'UpperArm.R': (0, 0, -A), 'LowerArm.L': (-8, 0, 0), 'LowerArm.R': (8, 0, 0)}

# Attack (24 f = 0.8 s): wind up with the right arm, lunge and swing it down across the body. Contact ≈ frame 12 (0.40 s).
S = ATTACK_SIGN
WIND = {'UpperArm.R': (S * 70, 0, -A - 25), 'LowerArm.R': (S * 40, 0, 0), 'UpperArm.L': (-S * 20, 0, A + 10),
        'Spine': (LEG * 8, 0, 0), 'Chest': (0, 0, -18), 'Head': (0, 0, -10), 'Tail1': (0, 0, 10),
        'UpperLeg.L': (LEG * 10, 0, 0), 'UpperLeg.R': (-LEG * 10, 0, 0), 'Hips': ('loc', (0, 0.01 * H, 0))}
STRIKE = {'UpperArm.R': (-S * 95, 0, -A + 30), 'LowerArm.R': (-S * 10, 0, 0), 'UpperArm.L': (S * 25, 0, A + 20),
          'Spine': (-LEG * 18, 0, 0), 'Chest': (0, 0, 22), 'Head': (-LEG * 8, 0, 6), 'Tail1': (0, 0, -12),
          'UpperLeg.L': (-LEG * 22, 0, 0), 'LowerLeg.L': (LEG * 18, 0, 0), 'UpperLeg.R': (LEG * 30, 0, 0), 'LowerLeg.R': (-LEG * 35, 0, 0),
          'Hips': ('loc', (0, -0.04 * H, 0))}
FOLLOW = {'UpperArm.R': (-S * 60, 0, -A + 10), 'LowerArm.R': (S * 30, 0, 0), 'UpperArm.L': (S * 10, 0, A + 5),
          'Spine': (-LEG * 10, 0, 0), 'Chest': (0, 0, 10), 'Head': (0, 0, 2), 'Tail1': (0, 0, -4),
          'UpperLeg.L': (-LEG * 10, 0, 0), 'UpperLeg.R': (LEG * 14, 0, 0), 'LowerLeg.R': (-LEG * 16, 0, 0),
          'Hips': ('loc', (0, -0.02 * H, 0))}
act('Attack', {0: dict(REST), 7: WIND, 12: STRIKE, 17: FOLLOW, 24: dict(REST)})

# Hit (15 f = 0.5 s): recoil back, arms fly up, settle.
HIT = {'Spine': (LEG * 22, 0, 0), 'Chest': (LEG * 8, 0, 0), 'Head': (LEG * 18, 0, 0),
       'UpperArm.L': (-40, 0, A + 30), 'UpperArm.R': (40, 0, -A - 30), 'LowerArm.L': (-30, 0, 0), 'LowerArm.R': (30, 0, 0),
       'Tail1': (0, 0, 14), 'Hips': ('loc', (0, -0.02 * H, -0.04 * H))}
act('Hit', {0: dict(REST), 4: HIT, 10: {**HIT, 'Spine': (LEG * 10, 0, 0), 'Head': (LEG * 6, 0, 0)}, 15: dict(REST)})

# Kneel (36 f = 1.2 s): legs buckle, sink to the knees, slump forward and stay there (clampWhenFinished in the game).
KNEEL = {'UpperLeg.L': (LEG * 70, 0, 6), 'UpperLeg.R': (LEG * 70, 0, -6), 'LowerLeg.L': (-LEG * 110, 0, 0), 'LowerLeg.R': (-LEG * 110, 0, 0),
         'Spine': (-LEG * 28, 0, 0), 'Chest': (-LEG * 10, 0, 0), 'Head': (-LEG * 22, 0, 0),
         'UpperArm.L': (-15, 0, A + 12), 'UpperArm.R': (15, 0, -A - 12), 'LowerArm.L': (-12, 0, 0), 'LowerArm.R': (12, 0, 0),
         'Tail1': (0, 0, 0), 'Hips': ('loc', (0, -0.30 * H, 0))}
HALF = {k: (tuple(x * 0.5 for x in v) if not (isinstance(v, tuple) and v and v[0] == 'loc') else ('loc', tuple(x * 0.5 for x in v[1]))) for k, v in KNEEL.items()}
act('Kneel', {0: dict(REST, Spine=(LEG * 6, 0, 0), Head=(LEG * 6, 0, 0)), 14: HALF, 26: KNEEL, 36: {**KNEEL, 'Head': (-LEG * 30, 0, 0)}})

ad.action = None
ad.use_nla = True
bpy.ops.object.select_all(action='DESELECT')
arm.select_set(True)
for m in meshes: m.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.export_scene.gltf(filepath=OUT, use_selection=True, export_yup=True, export_animations=True,
                          export_animation_mode='NLA_TRACKS', export_image_format='WEBP')
print('DONE', OUT, 'actions', [a.name for a in bpy.data.actions])
