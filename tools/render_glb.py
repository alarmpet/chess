# Quick front/back preview of a GLB (Blender 5.2 headless, Workbench + texture colours).
#   blender --background --python tools/render_glb.py -- <in.glb> <out_prefix> [pose_clip|rest] [size]
#   'rest' keeps the bind pose (arms out) — used to make an img2img start picture for a concept.
import bpy, sys, math, mathutils
argv = sys.argv[sys.argv.index('--') + 1:]
SRC, PRE = argv[0], argv[1]
CLIP = argv[2] if len(argv) > 2 else 'Idle'
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.fps = 30
bpy.ops.import_scene.gltf(filepath=SRC)
arm = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
if arm and arm.animation_data:
    ad = arm.animation_data
    for t in ad.nla_tracks: t.mute = True
    a = bpy.data.actions.get(CLIP) if CLIP != 'rest' else None
    if a:
        ad.action = a
        try: ad.action_slot = a.slots[0]
        except Exception: pass
    sc.frame_set(int(a.frame_range[0] + (a.frame_range[1] - a.frame_range[0]) * 0.3) if a else 0)
for o in bpy.data.objects:
    if o.type == 'MESH' and not o.vertex_groups and not o.data.materials: o.hide_render = True
ms = [o for o in bpy.data.objects if o.type == 'MESH' and not o.hide_render]
# Workbench TEXTURE mode shows the material's *active* image node — make that the base colour, not an emissive map.
for o in ms:
    for mat in o.data.materials:
        if not mat or not mat.node_tree: continue
        b = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if b and b.inputs['Base Color'].links:
            mat.node_tree.nodes.active = b.inputs['Base Color'].links[0].from_node
dg = bpy.context.evaluated_depsgraph_get()
pts = []
for o in ms:
    e = o.evaluated_get(dg); m = e.to_mesh()
    pts += [o.matrix_world @ v.co for v in m.vertices]; e.to_mesh_clear()
lo = mathutils.Vector([min(p[i] for p in pts) for i in range(3)]); hi = mathutils.Vector([max(p[i] for p in pts) for i in range(3)])
c = (lo + hi) / 2; H = hi.z - lo.z
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'TEXTURE'
SIZE = int(argv[3]) if len(argv) > 3 else 0
sc.render.resolution_x, sc.render.resolution_y = (SIZE, SIZE) if SIZE else (480, 560)
sc.render.film_transparent = bool(SIZE)
sc.world = bpy.data.worlds.new('w'); sc.display.shading.background_type = 'VIEWPORT' if hasattr(sc.display.shading,'background_type') else None
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = 'ORTHO'; cam.data.ortho_scale = H * 1.15
for tag, ang in (('front', 0), ('back', 180), ('side', 60)):
    r = math.radians(ang); d = H * 3
    cam.location = (c.x + d * math.sin(r), c.y - d * math.cos(r), c.z)
    cam.rotation_euler = (math.radians(90), 0, r)
    sc.render.filepath = f'{PRE}_{tag}.png'
    bpy.ops.render.render(write_still=True)
print('RENDERED', PRE)
