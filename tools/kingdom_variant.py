# Kingdom colour variant of a legend biped GLB (Blender 5.2, headless).
#   blender --background --python tools/kingdom_variant.py -- <in.glb> <out.glb> <w|b>
#
# Re-bakes the base colour texture so the two sides are told apart by the asset itself, not a runtime tint:
#   w (해의 왕국): fur a little brighter and warmer + a gold sash across the chest
#   b (달의 왕국): fur darker and cooler (moonlit)  + a violet sash across the chest
# The sash is a diagonal band in object space (left shoulder → right hip), masked to vertices skinned to the
# torso bones so it never paints the arms or head. Baked with Cycles (EMIT) into a copy of the texture on the
# same UVs, so geometry, skin weights and all eight clips stay exactly as they were.
import bpy, sys, os

argv = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT, SIDE = argv[0], argv[1], argv[2]
assert SIDE in ('w', 'b'), SIDE

STYLE = {
    # hsv: (hue, sat, val) of the Hue/Saturation/Value node; tint: multiplied over the fur
    'w': dict(hsv=(0.5, 0.95, 1.02), tint=(1.0, 0.97, 0.90, 1), tint_fac=0.25,
              sash=(0.98, 0.72, 0.10, 1), trim=(1.0, 0.93, 0.70, 1)),
    'b': dict(hsv=(0.5, 0.92, 0.84), tint=(0.82, 0.84, 1.0, 1), tint_fac=1.0,
              sash=(0.46, 0.24, 0.88, 1), trim=(0.86, 0.88, 1.0, 1)),
}[SIDE]
TORSO = ('Hips', 'Spine', 'Chest')

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.fps = 30          # same as legend_add_clips.py: keep clip timing 1:1
bpy.ops.import_scene.gltf(filepath=SRC)
sc = bpy.context.scene
sc.render.fps = 30

arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
meshes = [o for o in bpy.data.objects if o.type == 'MESH' and o.data.materials and o.vertex_groups]
assert meshes, 'no skinned mesh'

# Rest pose for the bake (object coords are rest-pose anyway, but keep the armature from evaluating a clip).
ad = arm.animation_data
if ad:
    ad.action = None

sc.render.engine = 'CYCLES'
sc.cycles.samples = 1
sc.cycles.device = 'CPU'
sc.render.bake.margin = 6

for ob in meshes:
    me = ob.data
    # --- per-vertex torso weight → colour attribute "TorsoW"
    gidx = {vg.index for vg in ob.vertex_groups if vg.name in TORSO}
    attr = me.color_attributes.new('TorsoW', 'FLOAT_COLOR', 'POINT')
    for v in me.vertices:
        w = sum(g.weight for g in v.groups if g.group in gidx)
        w = max(0.0, min(1.0, (w - 0.70) / 0.25))   # only clearly-torso vertices
        attr.data[v.index].color = (w, w, w, 1)
    # --- sash plane from the rest-pose bounding box (Blender is Z-up after import)
    xs = [v.co.x for v in me.vertices]; zs = [v.co.z for v in me.vertices]
    xmin, xmax, zmin, zmax = min(xs), max(xs), min(zs), max(zs)
    H = zmax - zmin
    tz = [v.co.z for v in me.vertices if attr.data[v.index].color[0] > 0.5]
    t0, t1 = (min(tz), max(tz)) if tz else (zmin + 0.35 * H, zmin + 0.7 * H)
    zc = t0 + 0.55 * (t1 - t0)                       # band centre a little above the torso middle
    slope = 0.75 * (t1 - t0) / max(1e-6, (xmax - xmin) * 0.5)
    half = 0.10 * (t1 - t0) + 0.012 * H             # band half-width
    print('SASH', ob.name, 'H', round(H, 3), 'torso', round(t0, 3), round(t1, 3), 'zc', round(zc, 3), 'half', round(half, 3))

    for mat in me.materials:
        nt = mat.node_tree; N = nt.nodes; L = nt.links
        bsdf = next(n for n in N if n.type == 'BSDF_PRINCIPLED')
        out = next(n for n in N if n.type == 'OUTPUT_MATERIAL')
        base_link = next(l for l in bsdf.inputs['Base Color'].links)
        tex = base_link.from_node
        W, Hh = tex.image.size

        def node(t, **kw):
            n = N.new(t)
            for k, v in kw.items(): setattr(n, k, v)
            return n
        def math(op, a, b=None):
            m = node('ShaderNodeMath', operation=op)
            L.new(a, m.inputs[0]) if not isinstance(a, (int, float)) else setattr(m.inputs[0], 'default_value', a)
            if b is not None:
                L.new(b, m.inputs[1]) if not isinstance(b, (int, float)) else setattr(m.inputs[1], 'default_value', b)
            return m.outputs[0]

        # fur recolour
        hsv = node('ShaderNodeHueSaturation')
        hsv.inputs['Hue'].default_value, hsv.inputs['Saturation'].default_value, hsv.inputs['Value'].default_value = STYLE['hsv']
        L.new(tex.outputs['Color'], hsv.inputs['Color'])
        tint = node('ShaderNodeMix', data_type='RGBA', blend_type='MULTIPLY')
        tint.inputs['Factor'].default_value = STYLE['tint_fac']
        L.new(hsv.outputs['Color'], tint.inputs['A']); tint.inputs['B'].default_value = STYLE['tint']

        # sash mask: |z - zc - slope*x| < half, soft edge, times torso weight
        tc = node('ShaderNodeTexCoord'); sep = node('ShaderNodeSeparateXYZ')
        L.new(tc.outputs['Object'], sep.inputs[0])
        d = math('ABSOLUTE', math('SUBTRACT', math('SUBTRACT', sep.outputs['Z'], zc), math('MULTIPLY', sep.outputs['X'], slope)))
        band = node('ShaderNodeMapRange', interpolation_type='SMOOTHSTEP')
        L.new(d, band.inputs['Value'])
        band.inputs['From Min'].default_value = half * 0.82; band.inputs['From Max'].default_value = half
        band.inputs['To Min'].default_value = 1.0; band.inputs['To Max'].default_value = 0.0
        # thin light trim along both edges of the sash
        trimr = node('ShaderNodeMapRange', interpolation_type='SMOOTHSTEP')
        L.new(d, trimr.inputs['Value'])
        trimr.inputs['From Min'].default_value = half * 0.70; trimr.inputs['From Max'].default_value = half * 0.80
        trimr.inputs['To Min'].default_value = 0.0; trimr.inputs['To Max'].default_value = 1.0
        ca = node('ShaderNodeVertexColor', layer_name='TorsoW')
        mask = math('MULTIPLY', band.outputs['Result'], ca.outputs['Color'])
        trim_mask = math('MULTIPLY', mask, trimr.outputs['Result'])

        # sash keeps a little of the fur shading so it reads as cloth on a body, not a sticker
        bw = node('ShaderNodeRGBToBW'); L.new(tex.outputs['Color'], bw.inputs[0])
        shade = math('ADD', math('MULTIPLY', bw.outputs[0], 0.55), 0.62)
        sash = node('ShaderNodeMix', data_type='RGBA', blend_type='MULTIPLY')
        sash.inputs['Factor'].default_value = 1.0
        sash.inputs['A'].default_value = STYLE['sash']
        shade_rgb = node('ShaderNodeCombineColor')
        for i in range(3): L.new(shade, shade_rgb.inputs[i])
        L.new(shade_rgb.outputs[0], sash.inputs['B'])
        sash_t = node('ShaderNodeMix', data_type='RGBA')
        L.new(trim_mask, sash_t.inputs['Factor']); L.new(sash.outputs[2], sash_t.inputs['A']); sash_t.inputs['B'].default_value = STYLE['trim']

        final = node('ShaderNodeMix', data_type='RGBA')
        L.new(mask, final.inputs['Factor']); L.new(tint.outputs[2], final.inputs['A']); L.new(sash_t.outputs[2], final.inputs['B'])

        # bake target
        img = bpy.data.images.new(f'{mat.name}_{SIDE}', W, Hh, alpha=False)
        tgt = node('ShaderNodeTexImage', image=img)
        for n in N: n.select = False
        tgt.select = True; N.active = tgt
        emit = node('ShaderNodeEmission'); L.new(final.outputs[2], emit.inputs['Color'])
        surf = out.inputs['Surface']; old = surf.links[0].from_socket
        L.new(emit.outputs[0], surf)
        mat['_bake'] = (tgt.name, old.node.name)

    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.bake(type='EMIT', margin=6, use_clear=True)

    for mat in me.materials:
        nt = mat.node_tree; N = nt.nodes; L = nt.links
        tgt_name, bsdf_name = mat['_bake']
        tgt, bsdf = N[tgt_name], N[bsdf_name]
        out = next(n for n in N if n.type == 'OUTPUT_MATERIAL')
        tgt.image.pack()
        L.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
        old_tex = bsdf.inputs['Base Color'].links[0].from_node
        tgt.image.name = f'{old_tex.image.name}_{SIDE}'
        L.new(tgt.outputs['Color'], bsdf.inputs['Base Color'])
        # drop the bake helpers so the exporter sees a plain textured Principled material
        keep = {bsdf.name, out.name, tgt.name}
        keep |= {l.from_node.name for inp in bsdf.inputs for l in inp.links}
        keep |= {l.from_node.name for n in list(N) if n.name in keep and n.type == 'NORMAL_MAP' for inp in n.inputs for l in inp.links}
        for n in list(N):
            if n.name not in keep: N.remove(n)
        del mat['_bake']
    me.color_attributes.remove(me.color_attributes['TorsoW'])

ad = arm.animation_data
if ad:
    ad.action = None
    ad.use_nla = True
bpy.ops.object.select_all(action='DESELECT')
arm.select_set(True)
for m in meshes: m.select_set(True)
bpy.context.view_layer.objects.active = arm
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=OUT, use_selection=True, export_yup=True, export_animations=True,
                          export_animation_mode='NLA_TRACKS', export_image_format='WEBP')
print('DONE', OUT, 'side', SIDE, 'actions', sorted(a.name for a in bpy.data.actions))
