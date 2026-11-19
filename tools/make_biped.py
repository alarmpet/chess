# Concept image → two-legged chess piece GLB, using the study-game pipeline end to end (PLAN §1.2 · §5).
#   python tools/make_biped.py <name> <concept.png> [--seeds 11,12,13] [--yaw 0] [--hip 0.27] [--tri 20000] [--tex 1024] [--lowpoly keepuv|bake]
# Steps (all local): TRELLIS v1 fp16 server (best-of-N by body thickness) → bake_low.py (Blender) → biped_rig.py (Blender)
# → pack-statue.mjs (meshopt + WebP) → tools/legend_add_clips.py (Attack/Hit/Kneel) → public/packs/legend/<name>.glb
# Intermediates land in .reports/biped/<name>/. Requires the TRELLIS server on :7960 (D:\trellis-local\app\run.bat --precision half).
import os, sys, subprocess, shutil, time, json, importlib.util

CHESS = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SG = r'D:\study-game'
BLENDER = r'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
args = sys.argv[1:]
def opt(name, default):
    if name in args:
        i = args.index(name); v = args[i + 1]; del args[i:i + 2]; return v
    return default
seeds = [int(s) for s in opt('--seeds', '11,12,13').split(',')]
yaw = opt('--yaw', '0'); hip = opt('--hip', ''); tri = opt('--tri', '20000'); tex = opt('--tex', '1024')
# Low-poly step: 'keepuv' (default since 2026-10-30) decimates TRELLIS's own mesh and keeps its UVs/texture; 'bake'
# is the old study-game bake_low.py re-projection, which left black cracks and smeared patches (PLAN §2.2.3).
lowpoly = opt('--lowpoly', 'keepuv')
name, concept = args[0], os.path.abspath(args[1])
d = os.path.join(CHESS, '.reports', 'biped', name)
os.makedirs(d, exist_ok=True)
# The TRELLIS server rejects multipart parts over 1024 KB ("Part exceeded maximum size of 1024KB."), and the image goes
# up base64-encoded (+33 %) — an 888 KB PNG failed (kangaroo 2026-10-29). Re-encode large concepts as JPEG first.
if os.path.getsize(concept) > 700 * 1024:
    from PIL import Image
    small = os.path.join(d, 'concept.jpg')
    Image.open(concept).convert('RGB').save(small, quality=92)
    print(f'  concept {os.path.getsize(concept) // 1024} KB -> {os.path.getsize(small) // 1024} KB JPEG (server part limit)', flush=True)
    concept = small

def run(cmd, cwd=SG, env=None):
    e = dict(os.environ); e.update(env or {})
    t = time.time()
    r = subprocess.run(cmd, cwd=cwd, env=e, capture_output=True, text=True, encoding='utf-8', errors='replace')
    tail = (r.stdout or '')[-600:] + (r.stderr or '')[-600:]
    print(f'  [{round(time.time() - t)} s] {" ".join(os.path.basename(str(c)) for c in cmd[:3])} rc={r.returncode}', flush=True)
    if r.returncode != 0:
        print(tail); raise SystemExit(f'step failed: {cmd[:2]}')
    return r.stdout

def thickness(path):
    spec = importlib.util.spec_from_file_location('th', os.path.join(SG, 'tools', 'legend', 'thickness.py'))
    th = importlib.util.module_from_spec(spec); spec.loader.exec_module(th)
    return th.thickness(path)[0]

# 1. TRELLIS best-of-N
raw = os.path.join(d, 'raw.glb')
if not os.path.exists(raw):
    best = None
    for sd in seeds:
        p = os.path.join(d, f'raw_s{sd}.glb')
        if not os.path.exists(p):
            run([sys.executable, 'tools/legend/run_trellis_local.py', concept, p, str(sd)])
        try:
            t = thickness(p)
        except Exception as ex:
            print('  thickness failed', sd, repr(ex)); t = -1
        print(f'  seed {sd} 몸통깊이/키 {t:.3f}', flush=True)
        if not os.path.exists(p.replace('.glb', '_a.png')):
            try: run([BLENDER, '--background', '--python', 'tools/legend/render_vc.py', '--', p, p[:-4], '35', '480'])
            except SystemExit: print('  (render failed, continuing)')
        if best is None or t > best[0]: best = (t, p, sd)
    shutil.copyfile(best[1], raw)
    json.dump({'seed': best[2], 'thickness': best[0], 'concept': concept}, open(os.path.join(d, 'pick.json'), 'w'))
    print('  picked seed', best[2], flush=True)

# 2. bake → 3. rig → 4. pack → 5. clips
bake, rig, packed, final = (os.path.join(d, n) for n in ('bake.glb', 'rig.glb', 'packed.glb', 'final.glb'))
env = {'VOXEL': '0', 'CAGE': '0.015', 'YAW': yaw}
if hip: env['HIP'] = hip
# Rigger knobs added in the chess copy (tools/biped_rig.py): NO_TAIL=1 (chunky backs mistaken for a tail → torn by the
# wag, rhino 2026-10-29), ARM_NEAR / ARM_FALL (arm weight capture radius). Pass through from the environment.
for k in ('NO_TAIL', 'ARM_NEAR', 'ARM_FALL', 'ARM_DOWN', 'TAILW', 'LEGSIGN', 'SKIRT', 'STRIDE'):
    if os.environ.get(k): env[k] = os.environ[k]
RIG = os.path.join(CHESS, 'tools', 'biped_rig.py')
if not os.path.exists(bake):
    if lowpoly == 'keepuv':
        run([sys.executable, os.path.join(CHESS, 'tools', 'keepuv_low.py'), raw, bake, '--tri', tri, '--tex', tex], cwd=CHESS)
    else:
        run([BLENDER, '--background', '--python', 'tools/legend/bake_low.py', '--', raw, bake, tri, tex], env=env)
if not os.path.exists(rig):
    run([BLENDER, '--background', '--python', RIG, '--', bake, rig, os.path.join(d, 'rig')], env=env)
if not os.path.exists(packed):
    run(['node', 'tools/legend/pack-statue.mjs', rig, packed, '999999', '88', tex])
run([BLENDER, '--background', '--python', os.path.join(CHESS, 'tools', 'legend_add_clips.py'), '--', packed, final], cwd=CHESS)
dst = os.path.join(CHESS, 'public', 'packs', 'legend', f'{name}.glb')
shutil.copyfile(final, dst)
print('DONE', dst, os.path.getsize(dst) // 1024, 'KB')
