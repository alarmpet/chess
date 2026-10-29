# Concept image → small rigid accessory GLB for a bone socket (PLAN §14.3: non-weapon trinkets only).
#   python tools/make_prop.py <name> <concept.png> [--seeds 11,12] [--tri 2500] [--tex 512]
# TRELLIS v1 (local :7960) → bake_low.py → pack-statue.mjs (meshopt + WebP) → public/packs/legend/items/<name>.glb
# No rig: the engine parents the item to a bone and fits it to the socket. Seed renders land next to the raw GLBs
# (.reports/props/<name>/raw_s*_a.png) — pick by eye with --pick <seed> if the first one is wrong.
import os, sys, subprocess, shutil, time
CHESS = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SG = r'D:\study-game'
BLENDER = r'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
args = sys.argv[1:]
def opt(name, default):
    if name in args:
        i = args.index(name); v = args[i + 1]; del args[i:i + 2]; return v
    return default
seeds = [int(s) for s in opt('--seeds', '11').split(',')]
pick = opt('--pick', ''); tri = opt('--tri', '2500'); tex = opt('--tex', '512')
name, concept = args[0], os.path.abspath(args[1])
d = os.path.join(CHESS, '.reports', 'props', name); os.makedirs(d, exist_ok=True)
if os.path.getsize(concept) > 700 * 1024:          # TRELLIS server part limit (see make_biped.py)
    from PIL import Image
    small = os.path.join(d, 'concept.jpg'); Image.open(concept).convert('RGB').save(small, quality=92); concept = small
def run(cmd, cwd=SG, env=None):
    e = dict(os.environ); e.update(env or {}); t = time.time()
    r = subprocess.run(cmd, cwd=cwd, env=e, capture_output=True, text=True, encoding='utf-8', errors='replace')
    print(f'  [{round(time.time() - t)} s] {" ".join(os.path.basename(str(c)) for c in cmd[:3])} rc={r.returncode}', flush=True)
    if r.returncode != 0:
        print((r.stdout or '')[-600:] + (r.stderr or '')[-600:]); raise SystemExit(f'step failed: {cmd[:2]}')
for sd in seeds:
    p = os.path.join(d, f'raw_s{sd}.glb')
    if not os.path.exists(p):
        run([sys.executable, 'tools/legend/run_trellis_local.py', concept, p, str(sd)])
    if not os.path.exists(p[:-4] + '_a.png'):
        try: run([BLENDER, '--background', '--python', 'tools/legend/render_vc.py', '--', p, p[:-4], '35', '480'])
        except SystemExit: print('  (render failed, continuing)')
raw = os.path.join(d, f'raw_s{pick or seeds[0]}.glb')
bake, packed = os.path.join(d, 'bake.glb'), os.path.join(d, 'packed.glb')
for f in (bake, packed):
    if os.path.exists(f): os.remove(f)
run([BLENDER, '--background', '--python', 'tools/legend/bake_low.py', '--', raw, bake, tri, tex], env={'VOXEL': '0', 'CAGE': '0.015'})
run(['node', 'tools/legend/pack-statue.mjs', bake, packed, '999999', '88', tex])
dst = os.path.join(CHESS, 'public', 'packs', 'legend', 'items', f'{name}.glb')
os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copyfile(packed, dst)
print('DONE', dst, os.path.getsize(dst) // 1024, 'KB')
