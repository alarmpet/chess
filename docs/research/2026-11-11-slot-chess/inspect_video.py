import subprocess, pathlib, re, json
from PIL import Image, ImageDraw
root=pathlib.Path(__file__).parent/'video'
out=root/'uniform'; out.mkdir(exist_ok=True)
subprocess.run(['ffmpeg','-y','-i',str(root/'download/video.mp4'),'-vf','fps=1/3,scale=300:-1',str(out/'%03d.jpg')],capture_output=True,check=True)
paths=sorted(out.glob('*.jpg'))
for start in range(0,len(paths),12):
    subset=paths[start:start+12]; sheet=Image.new('RGB',(300*4,560*3),'#242424'); d=ImageDraw.Draw(sheet)
    for j,p in enumerate(subset):
        im=Image.open(p); im.thumbnail((300,530)); x=(j%4)*300; y=(j//4)*560
        sheet.paste(im,(x,y+25)); d.text((x+8,y+5),f'{(start+j)*3+1.5:.1f}s approx',fill='white')
    sheet.save(root/f'contact-{start//12+1}.jpg')
vtt=(root/'download/korean.ko-orig.vtt').read_text(encoding='utf-8')
seen=set(); lines=[]
for block in vtt.split('\n\n'):
    if '-->' not in block: continue
    ls=block.splitlines(); ts=next((l for l in ls if '-->' in l),'')
    for l in ls[ls.index(ts)+1:]:
        s=re.sub('<[^>]+>','',l).strip()
        if s and s not in seen: lines.append(ts.split(' -->')[0]+' '+s);seen.add(s)
(root/'transcript-ko.txt').write_text('\n'.join(lines),encoding='utf-8')
print('\n'.join(lines))
