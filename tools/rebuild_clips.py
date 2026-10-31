# Re-run only the clip step for every shipped character, then rebuild its colour variants. No TRELLIS, no re-rig.
#   python tools/rebuild_clips.py [species ...]
# Reads .reports/biped/<name>/packed.glb, writes public/packs/legend/<name>.glb, then runs build_looks.py --force.
import os, subprocess, sys, time

CHESS = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BLENDER = r'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
SPECIES = sys.argv[1:] or ['lion', 'tiger', 'rhino', 'panda', 'kangaroo', 'meerkat']

for sp in SPECIES:
    for suffix in ('', '_s2', '_s3'):
        name = sp + suffix
        d = os.path.join(CHESS, '.reports', 'biped', name)
        final = os.path.join(d, 'final.glb')
        t = time.time()
        r = subprocess.run([BLENDER, '--background', '--python', os.path.join(CHESS, 'tools', 'legend_add_clips.py'), '--',
                            os.path.join(d, 'packed.glb'), final, sp],
                           capture_output=True, text=True, encoding='utf-8', errors='replace')
        if r.returncode != 0 or 'DONE' not in (r.stdout or ''):
            print((r.stdout or '')[-800:], (r.stderr or '')[-800:])
            raise SystemExit(f'clips failed: {name}')
        os.replace(final, os.path.join(CHESS, 'public', 'packs', 'legend', f'{name}.glb'))
        print(f'[{round(time.time() - t)} s] {name} clips', flush=True)

r = subprocess.run([sys.executable, os.path.join(CHESS, 'tools', 'build_looks.py'), '--force', *SPECIES])
raise SystemExit(r.returncode)
