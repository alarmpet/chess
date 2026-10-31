# Low-poly piece from a TRELLIS raw GLB WITHOUT re-baking (2026-10-30 quality fix, PLAN §2.2.3).
#   python tools/keepuv_low.py <raw.glb> <out.glb> [--tri 16000] [--tex 1024]
# Why: the old path (study-game bake_low.py) decimated to 8k, made new UVs and ray-baked colour from the 126k mesh —
# rays hit TRELLIS's inner/overlapping faces, which left black cracks, smeared patches and split fur. Here the mesh
# is decimated in place so it keeps TRELLIS's own UVs and texture; only the texture's empty gutter is filled by
# dilating island colours outward, so collapsed edges that now sample the gutter read the right colour.
# Steps: Blender A (normalise like bake_low: base at 0, centred, height 2; dump original UV triangles + texture;
# decimate; export) → this python (rasterise the UV mask, dilate, downscale) → Blender B (swap texture, export).
import os, sys, subprocess, tempfile
import numpy as np
from PIL import Image, ImageDraw

BLENDER = r'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
args = sys.argv[1:]
def opt(name, default):
    if name in args:
        i = args.index(name); v = args[i + 1]; del args[i:i + 2]; return v
    return default
TRI = int(opt('--tri', '16000')); TEX = int(opt('--tex', '1024'))
SRC, OUT = os.path.abspath(args[0]), os.path.abspath(args[1])
work = tempfile.mkdtemp(prefix='keepuv_', dir=os.path.dirname(OUT))

A = r'''
import bpy, sys, numpy as np
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
SRC, WORK, TRI = a[0], a[1], int(a[2])
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=SRC)
ms = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in ms: o.select_set(True)
bpy.context.view_layer.objects.active = ms[0]
if len(ms) > 1: bpy.ops.object.join()
o = bpy.context.view_layer.objects.active
if o.parent: mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
mn = Vector([min(v[i] for v in bb) for i in range(3)]); mx = Vector([max(v[i] for v in bb) for i in range(3)])
o.location -= Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mn.z)); bpy.ops.object.transform_apply(location=True)
s = 2.0 / (mx.z - mn.z); o.scale = (s, s, s); bpy.ops.object.transform_apply(scale=True)
me = o.data; uv = me.uv_layers.active.data
tris = []
for p in me.polygons:
    li = list(p.loop_indices)
    for k in range(1, len(li) - 1):
        tris.append([uv[li[0]].uv[:], uv[li[k]].uv[:], uv[li[k + 1]].uv[:]])
np.save(WORK + '/uvtris.npy', np.array(tris, dtype=np.float32))
mat = me.materials[0]; b = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
img = b.inputs['Base Color'].links[0].from_node.image
img.filepath_raw = WORK + '/tex.png'; img.file_format = 'PNG'; img.save()
# glTF import splits vertices at every UV seam, so the mesh is a pile of separate islands; decimating those
# independently pulls their borders apart (black cracks, 2026-10-30). Weld first — UVs live on loops and survive.
import bmesh
bm = bmesh.new(); bm.from_mesh(me); nv = len(bm.verts)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4); print('WELD', nv, '->', len(bm.verts)); bm.to_mesh(me); bm.free()
n = sum(len(p.vertices) - 2 for p in me.polygons)
md = o.modifiers.new('d', 'DECIMATE'); md.ratio = min(1.0, TRI / n); bpy.ops.object.modifier_apply(modifier='d')
bpy.ops.object.shade_smooth()
o.name = 'low'; mat.name = 'legend'
print('TRIS', n, '->', sum(len(p.vertices) - 2 for p in me.polygons))
bpy.ops.wm.save_as_mainfile(filepath=WORK + '/dec.blend')
'''
B = r'''
import bpy, sys
a = sys.argv[sys.argv.index('--') + 1:]
WORK, OUT = a[0], a[1]
bpy.ops.wm.open_mainfile(filepath=WORK + '/dec.blend')
o = bpy.data.objects['low']; mat = o.data.materials[0]
b = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
node = b.inputs['Base Color'].links[0].from_node
node.image = bpy.data.images.load(WORK + '/fixed.png'); node.image.name = 'col'; node.image.pack()
b.inputs['Roughness'].default_value = 0.6; b.inputs['Metallic'].default_value = 0.0
bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
bpy.ops.export_scene.gltf(filepath=OUT, use_selection=True, export_yup=True, export_image_format='JPEG', export_jpeg_quality=92)
print('OK', OUT)
'''

def blender(code, *a):
    f = os.path.join(work, 'step.py'); open(f, 'w', encoding='utf-8').write(code)
    r = subprocess.run([BLENDER, '--background', '--python', f, '--', *a], capture_output=True, text=True, encoding='utf-8', errors='replace')
    for line in (r.stdout or '').splitlines():
        if line.startswith(('TRIS', 'OK', 'WELD')): print(' ', line)
    if r.returncode != 0 or 'Traceback' in (r.stderr or '') + (r.stdout or ''):
        print((r.stdout or '')[-1500:], (r.stderr or '')[-1500:]); raise SystemExit('blender step failed')

blender(A, SRC, work, str(TRI))

# --- texture: valid-texel mask from the ORIGINAL UV triangles, then dilate island colours into the gutter
im = Image.open(os.path.join(work, 'tex.png')).convert('RGB'); W, H = im.size
mask_img = Image.new('L', (W, H), 0); d = ImageDraw.Draw(mask_img)
for t in np.load(os.path.join(work, 'uvtris.npy')):
    d.polygon([(u * W, (1 - v) * H) for u, v in t], fill=255)
valid = np.asarray(mask_img) > 0
px = np.asarray(im).astype(np.float32)
filled = valid.copy()
acc = px * filled[..., None]
for it in range(64):                                   # push colours outward one texel ring at a time
    if filled.all(): break
    s = np.zeros_like(acc); c = np.zeros(filled.shape, np.float32)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
        s += np.roll(np.roll(acc, dy, 0), dx, 1); c += np.roll(np.roll(filled, dy, 0), dx, 1)
    grow = (~filled) & (c > 0)
    acc[grow] = s[grow] / c[grow][:, None]; filled |= grow
acc[~filled] = px[valid].mean(0)
out = Image.fromarray(np.clip(acc, 0, 255).astype(np.uint8))
if TEX and TEX < W: out = out.resize((TEX, TEX), Image.LANCZOS)
out.save(os.path.join(work, 'fixed.png'))
print(f'  texture {W}px valid {valid.mean():.0%} -> {out.size[0]}px')

blender(B, work, OUT)
import shutil; shutil.rmtree(work, ignore_errors=True)
