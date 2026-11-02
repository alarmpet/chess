# Concept image → static village building GLB, keeping TRELLIS's own texture (see keepuv_low.py for why).
#   python tools/make_building.py <name> <concept.jpg> [--seeds 11,12] [--pick 12] [--tri 12000] [--tex 768] [--dir town]
# TRELLIS v1 (local :7960) → keepuv_low.py → public/packs/legend/town/<name>.glb
# Seed renders land next to the raw GLBs (.reports/town/<name>/raw_s*_a.png): pick by eye with --pick if the first is wrong.
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
pick = opt('--pick', ''); tri = opt('--tri', '12000'); tex = opt('--tex', '768'); folder = opt('--dir', 'town')
name, concept = args[0], os.path.abspath(args[1])
d = os.path.join(CHESS, '.reports', folder, name); os.makedirs(d, exist_ok=True)
if os.path.getsize(concept) > 700 * 1024:          # TRELLIS server part limit (see make_biped.py)
    from PIL import Image
    small = os.path.join(d, 'concept.jpg'); Image.open(concept).convert('RGB').save(small, quality=90); concept = small
def run(cmd, cwd=SG):
    t = time.time()
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, encoding='utf-8', errors='replace')
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
low = os.path.join(d, 'low.glb')
run([sys.executable, os.path.join(CHESS, 'tools', 'keepuv_low.py'), raw, low, '--tri', tri, '--tex', tex], cwd=CHESS)
dst = os.path.join(CHESS, 'public', 'packs', 'legend', folder, f'{name}.glb')
os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copyfile(low, dst)
print('DONE', dst, os.path.getsize(dst) // 1024, 'KB', flush=True)
