# Build every look-stage GLB the legend pack ships (PLAN §14.2) from the rigged single-colour models:
#   <species>.glb     (stage 1 아기)   → <species>_w.glb / _b.glb
#   <species>_s2.glb  (stage 2 자람)   → <species>_s2_w.glb / _b.glb
#   <species>_s3.glb  (stage 3 의젓함) → <species>_s3_w.glb / _b.glb
#   <species>_s3.glb  + starlit bake   → <species>_s4.glb → <species>_s4_w.glb / _b.glb   (stage 4 별빛 털)
# Kingdom colours come from tools/kingdom_variant.py, stars from tools/starlit_variant.py (Blender 5.2 headless).
#   python tools/build_looks.py [species ...] [--only s1,s2,s3,s4] [--force]
import os, sys, subprocess, time
CHESS = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BLENDER = r'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
LEG = os.path.join(CHESS, 'public', 'packs', 'legend')
SPECIES = ['lion', 'tiger', 'rhino', 'panda', 'kangaroo', 'meerkat']
args = sys.argv[1:]
force = '--force' in args
if force: args.remove('--force')
only = None
if '--only' in args:
    i = args.index('--only'); only = set(args[i + 1].split(',')); del args[i:i + 2]
species = args or SPECIES

def blender(script, *a):
    t = time.time()
    r = subprocess.run([BLENDER, '--background', '--python', os.path.join(CHESS, 'tools', script), '--', *a],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    ok = r.returncode == 0 and 'DONE' in (r.stdout or '')
    print(f'  [{round(time.time() - t)} s] {script} {os.path.basename(a[1])} {"ok" if ok else "FAILED"}', flush=True)
    if not ok:
        print((r.stdout or '')[-800:], (r.stderr or '')[-800:]); raise SystemExit(1)

def need(path):
    return force or not os.path.exists(path)

for n in species:
    print('==', n, flush=True)
    stages = {'s1': n, 's2': f'{n}_s2', 's3': f'{n}_s3', 's4': f'{n}_s4'}
    for st, base in stages.items():
        if only and st not in only: continue
        src = os.path.join(LEG, f'{base}.glb')
        if st == 's4':
            s3 = os.path.join(LEG, f'{n}_s3.glb')
            if not os.path.exists(s3): print('  skip s4 (no s3 yet)'); continue
            if need(src): blender('starlit_variant.py', s3, src)
        if not os.path.exists(src): print(f'  skip {st} (no {base}.glb yet)'); continue
        for side in ('w', 'b'):
            out = os.path.join(LEG, f'{base}_{side}.glb')
            if need(out) or os.path.getmtime(out) < os.path.getmtime(src):
                blender('kingdom_variant.py', src, out, side)
print('BUILD_LOOKS_DONE')
