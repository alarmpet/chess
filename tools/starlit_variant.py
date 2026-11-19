# "별빛 털" look stage (PLAN §14.2: colour/material only, no gear): sprinkle small star speckles and a soft night-sky
# sheen over the fur, baked into the base colour, plus a faint emissive map so the speckles twinkle under the board
# lights. Geometry, skin weights and clips are untouched.
#   blender --background --python tools/starlit_variant.py -- <in.glb> <out.glb>
import bpy, sys, os

argv = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.fps = 30
bpy.ops.import_scene.gltf(filepath=SRC)
sc = bpy.context.scene; sc.render.fps = 30
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
meshes = [o for o in bpy.data.objects if o.type == 'MESH' and o.data.materials and o.vertex_groups]
if arm.animation_data: arm.animation_data.action = None
sc.render.engine = 'CYCLES'; sc.cycles.samples = 1; sc.cycles.device = 'CPU'

for ob in meshes:
    me = ob.data
    zs = [v.co.z for v in me.vertices]; H = max(zs) - min(zs)
    for mat in me.materials:
        nt = mat.node_tree; N = nt.nodes; L = nt.links
        bsdf = next(n for n in N if n.type == 'BSDF_PRINCIPLED')
        out = next(n for n in N if n.type == 'OUTPUT_MATERIAL')
        tex = bsdf.inputs['Base Color'].links[0].from_node
        W, Hh = tex.image.size
        def node(t, **kw):
            n = N.new(t)
            for k, v in kw.items(): setattr(n, k, v)
            return n
        tc = node('ShaderNodeTexCoord')
        # stars: Voronoi cells in object space, a dot where the distance to the feature point is small
        vor = node('ShaderNodeTexVoronoi', feature='F1'); vor.inputs['Scale'].default_value = 16.0 / max(H, 1e-3)
        vor.inputs['Randomness'].default_value = 1.0
        L.new(tc.outputs['Object'], vor.inputs['Vector'])
        dot = node('ShaderNodeMapRange', interpolation_type='SMOOTHSTEP')
        L.new(vor.outputs['Distance'], dot.inputs['Value'])
        dot.inputs['From Min'].default_value = 0.12; dot.inputs['From Max'].default_value = 0.2
        dot.inputs['To Min'].default_value = 1.0; dot.inputs['To Max'].default_value = 0.0
        # only some cells get a star (random cell colour threshold)
        sep = node('ShaderNodeSeparateColor'); L.new(vor.outputs['Color'], sep.inputs[0])
        keep = node('ShaderNodeMath', operation='GREATER_THAN'); L.new(sep.outputs[0], keep.inputs[0]); keep.inputs[1].default_value = 0.2
        star = node('ShaderNodeMath', operation='MULTIPLY'); L.new(dot.outputs['Result'], star.inputs[0]); L.new(keep.outputs[0], star.inputs[1])
        # night-sky sheen: a slow noise that cools and deepens the fur a little
        noise = node('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = 2.2 / max(H, 1e-3)
        L.new(tc.outputs['Object'], noise.inputs['Vector'])
        sheen = node('ShaderNodeMix', data_type='RGBA', blend_type='MULTIPLY')
        L.new(noise.outputs['Fac'], sheen.inputs['Factor'])
        L.new(tex.outputs['Color'], sheen.inputs['A']); sheen.inputs['B'].default_value = (0.60, 0.64, 1.0, 1)
        hsv = node('ShaderNodeHueSaturation'); hsv.inputs['Saturation'].default_value = 1.12; hsv.inputs['Value'].default_value = 1.0
        L.new(sheen.outputs[2], hsv.inputs['Color'])
        starcol = (1.0, 0.95, 0.72, 1)
        final = node('ShaderNodeMix', data_type='RGBA'); L.new(star.outputs[0], final.inputs['Factor'])
        L.new(hsv.outputs['Color'], final.inputs['A']); final.inputs['B'].default_value = starcol
        glow = node('ShaderNodeMix', data_type='RGBA'); L.new(star.outputs[0], glow.inputs['Factor'])
        glow.inputs['A'].default_value = (0, 0, 0, 1); glow.inputs['B'].default_value = starcol
        emit = node('ShaderNodeEmission'); surf = out.inputs['Surface']
        baked = {}
        for key, src in (('base', final), ('glow', glow)):
            img = bpy.data.images.new(f'{tex.image.name}_starlit_{key}', W if key == 'base' else W // 2, Hh if key == 'base' else Hh // 2, alpha=False)
            tgt = node('ShaderNodeTexImage', image=img)
            for n in N: n.select = False
            tgt.select = True; N.active = tgt
            L.new(src.outputs[2], emit.inputs['Color']); L.new(emit.outputs[0], surf)
            bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
            bpy.ops.object.bake(type='EMIT', margin=6, use_clear=True)
            img.pack(); baked[key] = tgt
        L.new(bsdf.outputs['BSDF'], surf)
        L.new(baked['base'].outputs['Color'], bsdf.inputs['Base Color'])
        L.new(baked['glow'].outputs['Color'], bsdf.inputs['Emission Color'])
        bsdf.inputs['Emission Strength'].default_value = 1.4
        keepn = {bsdf.name, out.name, baked['base'].name, baked['glow'].name}
        keepn |= {l.from_node.name for inp in bsdf.inputs for l in inp.links}
        keepn |= {l.from_node.name for n in list(N) if n.name in keepn and n.type == 'NORMAL_MAP' for inp in n.inputs for l in inp.links}
        for n in list(N):
            if n.name not in keepn: N.remove(n)

ad = arm.animation_data
if ad: ad.action = None; ad.use_nla = True
bpy.ops.object.select_all(action='DESELECT'); arm.select_set(True)
for m in meshes: m.select_set(True)
bpy.context.view_layer.objects.active = arm
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=OUT, use_selection=True, export_yup=True, export_animations=True,
                          export_animation_mode='NLA_TRACKS', export_image_format='WEBP')
print('DONE', OUT, 'actions', sorted(a.name for a in bpy.data.actions))
