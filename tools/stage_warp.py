# Make an img2img start picture for a later appearance stage (PLAN §14.2: same face, grown body).
#   python tools/stage_warp.py <concept.png> <out.png> --body 1.35 [--slim 0.95]
# Finds the arm line of the A-pose (the widest rows), keeps everything above it (head, arms) as it is and stretches
# the torso+legs below it vertically by --body (and horizontally by --slim). The figure is then refit into the
# square with the same gray background. img2img at ~0.55 afterwards hides the seam; the face survives because it
# never moved.
import sys
from PIL import Image
import numpy as np

args = sys.argv[1:]
def opt(name, default):
    if name in args:
        i = args.index(name); v = args[i + 1]; del args[i:i + 2]; return v
    return default
body = float(opt('--body', '1.35')); slim = float(opt('--slim', '1.0'))
src, out = args[0], args[1]

im = Image.open(src).convert('RGB'); W, H = im.size
a = np.asarray(im).astype(int)
# the studio background is a vertical gradient: judge each row against its own two edges
rowbg = np.median(np.concatenate([a[:, :12], a[:, -12:]], axis=1), axis=1)      # (H, 3)
fg = np.abs(a - rowbg[:, None, :]).sum(axis=2) > 45
bg = np.median(a[:8, :8].reshape(-1, 3), axis=0)
rows = np.where(fg.any(axis=1))[0]
top, bot = rows.min(), rows.max()
cols = np.where(fg.any(axis=0))[0]
widths = np.array([(np.ptp(np.where(fg[y])[0]) if fg[y].any() else 0) for y in range(H)])
band = np.zeros(H, bool); band[top:int(top + 0.7 * (bot - top))] = True     # arms are never in the feet/shadow
wb = np.where(band, widths, 0)
wide = np.where(wb > 0.78 * wb.max())[0]
arm = int(wide.max() + 0.015 * H)                      # just under the arms
print('figure', top, bot, 'arm line', arm, 'widest', widths.max())

from PIL import ImageFilter
# background plate = the source's own row gradient, so the refit leaves no visible frame
plate_rows = np.clip(rowbg, 0, 255).astype(np.uint8)
plate = Image.fromarray(np.repeat(plate_rows[:, None, :], W, axis=1))
mask = Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.5))

def warp(img, fill):
    upper = img.crop((0, top, W, arm))
    lower = img.crop((0, arm, W, bot + 1))
    lw = max(1, int(W * slim)); lh = int(lower.height * body)
    lower = lower.resize((lw, lh), Image.LANCZOS)
    fig = Image.new(img.mode, (W, upper.height + lh), fill)
    fig.paste(upper, (0, 0)); fig.paste(lower, ((W - lw) // 2, upper.height))
    return fig

fig, fmask = warp(im, (0, 0, 0)), warp(mask, 0)
margin_top, margin_bot = top, H - 1 - bot           # same ground line as the source
s = (H - margin_top - margin_bot) / fig.height
size = (max(1, int(W * s)), int(fig.height * s))
fig, fmask = fig.resize(size, Image.LANCZOS), fmask.resize(size, Image.LANCZOS)
canvas = plate.copy()
canvas.paste(fig, ((W - fig.width) // 2, margin_top), fmask)
canvas.save(out)
print('OK', out, 'scale', round(s, 3))
