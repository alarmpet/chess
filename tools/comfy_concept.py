# Generate a concept image with the local ComfyUI (Flux GGUF graph recovered from an earlier output PNG).
#   python -I tools/comfy_concept.py --prefix lion --seed 7 --steps 4 --unet flux1-schnell-Q4_K_S.gguf "prompt text"
#   img2img (keeps the face of an earlier concept): add --init docs/concepts/lion.png --denoise 0.62
# Writes <ComfyUI>/output/<prefix>_*.png and copies them to .reports/concepts/.
import json, sys, time, urllib.request, os, shutil, glob

URL = os.environ.get('COMFY_URL', 'http://127.0.0.1:8188')
COMFY_OUT = r'C:\Users\petbl\ComfyUI_windows_portable\ComfyUI\output'
args = sys.argv[1:]
def opt(name, default):
    if name in args:
        i = args.index(name); v = args[i + 1]; del args[i:i + 2]; return v
    return default
prefix = opt('--prefix', 'concept'); seed = int(opt('--seed', '1')); steps = int(opt('--steps', '4'))
unet = opt('--unet', 'flux1-schnell-Q4_K_S.gguf'); t5 = opt('--t5', 't5-v1_1-xxl-encoder-Q3_K_L.gguf')
guidance = float(opt('--guidance', '3.5')); size = int(opt('--size', '1024'))
init = opt('--init', None); denoise = float(opt('--denoise', '1.0'))
COMFY_IN = os.path.join(os.path.dirname(COMFY_OUT), 'input')
prompt = args[0]

wf = {
    '1': {'class_type': 'UnetLoaderGGUF', 'inputs': {'unet_name': unet}},
    '2': {'class_type': 'DualCLIPLoaderGGUF', 'inputs': {'clip_name1': 'clip_l.safetensors', 'clip_name2': t5, 'type': 'flux'}},
    '3': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'ae.safetensors'}},
    '4': {'class_type': 'CLIPTextEncode', 'inputs': {'text': prompt, 'clip': ['2', 0]}},
    '5': {'class_type': 'FluxGuidance', 'inputs': {'conditioning': ['4', 0], 'guidance': guidance}},
    '6': {'class_type': 'ConditioningZeroOut', 'inputs': {'conditioning': ['4', 0]}},
    '7': {'class_type': 'EmptySD3LatentImage', 'inputs': {'width': size, 'height': size, 'batch_size': 1}},
    '8': {'class_type': 'KSampler', 'inputs': {'model': ['1', 0], 'positive': ['5', 0], 'negative': ['6', 0], 'latent_image': ['7', 0],
                                               'seed': seed, 'steps': steps, 'cfg': 1.0, 'sampler_name': 'euler', 'scheduler': 'simple', 'denoise': 1.0}},
    '9': {'class_type': 'VAEDecode', 'inputs': {'samples': ['8', 0], 'vae': ['3', 0]}},
    '10': {'class_type': 'SaveImage', 'inputs': {'images': ['9', 0], 'filename_prefix': prefix}},
}
if init:
    # img2img: encode the earlier concept and only partly re-noise it, so the face and palette survive.
    name = f'chess_init_{os.path.basename(init)}'
    shutil.copy(init, os.path.join(COMFY_IN, name))
    wf['11'] = {'class_type': 'LoadImage', 'inputs': {'image': name}}
    wf['12'] = {'class_type': 'ImageScale', 'inputs': {'image': ['11', 0], 'upscale_method': 'lanczos', 'width': size, 'height': size, 'crop': 'center'}}
    wf['13'] = {'class_type': 'VAEEncode', 'inputs': {'pixels': ['12', 0], 'vae': ['3', 0]}}
    wf['8']['inputs']['latent_image'] = ['13', 0]
    wf['8']['inputs']['denoise'] = denoise
    del wf['7']

def post(path, data):
    req = urllib.request.Request(URL + path, data=json.dumps(data).encode(), headers={'Content-Type': 'application/json'})
    return json.loads(urllib.request.urlopen(req, timeout=60).read())

before = set(glob.glob(os.path.join(COMFY_OUT, prefix + '_*.png')))
r = post('/prompt', {'prompt': wf, 'client_id': 'chess-concept'})
pid = r['prompt_id']
t0 = time.time()
while True:
    h = json.loads(urllib.request.urlopen(URL + '/history/' + pid, timeout=30).read())
    if pid in h:
        st = h[pid].get('status', {})
        if st.get('status_str') == 'error':
            print('ERROR', json.dumps(st)[:800]); sys.exit(1)
        if h[pid].get('outputs'):
            break
    if time.time() - t0 > 900:
        print('TIMEOUT'); sys.exit(2)
    time.sleep(2)
after = set(glob.glob(os.path.join(COMFY_OUT, prefix + '_*.png'))) - before
dst = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.reports', 'concepts')
os.makedirs(dst, exist_ok=True)
for f in sorted(after):
    shutil.copy(f, dst)
    print('OK', os.path.join(dst, os.path.basename(f)), round(time.time() - t0), 's')
