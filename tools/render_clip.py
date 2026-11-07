# Contact sheet frames of one clip, for spotting tears before a batch rebuild (Blender 5.2 headless).
#   blender --background --python tools/render_clip.py -- <in.glb> <out_prefix> <clip> <frame,frame,...> [size]
# Writes <out_prefix>_<clip>_<frame>.png from a three-quarter view. The view stays fixed so frames can be compared.
import bpy, sys, math, mathutils
argv = sys.argv[sys.argv.index('--') + 1:]
SRC, PRE, CLIP = argv[:3]
FRAMES = [int(f) for f in argv[3].split(',')]
SIZE = int(argv[4]) if len(argv) > 4 else 300
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = 30
bpy.ops.import_scene.gltf(filepath=SRC)
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
ad = arm.animation_data
for t in ad.nla_tracks:
    t.mute = True
act = bpy.data.actions[CLIP]
ad.action = act
try:
    ad.action_slot = act.slots[0]
except Exception:
    pass
ms = [o for o in bpy.data.objects if o.type == 'MESH' and o.data.materials]
for o in ms:
    for mat in o.data.materials:
        if not mat or not mat.node_tree:
            continue
        b = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if b and b.inputs['Base Color'].links:
            mat.node_tree.nodes.active = b.inputs['Base Color'].links[0].from_node
sc.frame_set(FRAMES[0])
dg = bpy.context.evaluated_depsgraph_get()
pts = []
for o in ms:
    e = o.evaluated_get(dg)
    m = e.to_mesh()
    pts += [o.matrix_world @ v.co for v in m.vertices]
    e.to_mesh_clear()
lo = mathutils.Vector([min(p[i] for p in pts) for i in range(3)])
hi = mathutils.Vector([max(p[i] for p in pts) for i in range(3)])
c = (lo + hi) / 2
H = hi.z - lo.z
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'STUDIO'
sc.display.shading.color_type = 'TEXTURE'
sc.render.resolution_x = sc.render.resolution_y = SIZE
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
sc.collection.objects.link(cam)
sc.camera = cam
cam.data.type = 'ORTHO'
cam.data.ortho_scale = H * 1.6
r = math.radians(65)
d = H * 3
cam.location = (c.x + d * math.sin(r), c.y - d * math.cos(r), c.z)
cam.rotation_euler = (math.radians(90), 0, r)
for f in FRAMES:
    sc.frame_set(f)
    sc.render.filepath = f'{PRE}_{CLIP}_{f:02d}.png'
    bpy.ops.render.render(write_still=True)
print('RENDERED', PRE, CLIP)
