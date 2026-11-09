"""Assemble real-time source trims into a labelled, silent review MP4.
No speech is generated or time-stretched. Narrated finishing is a separate step.
"""
from pathlib import Path
import os,json,subprocess,concurrent.futures
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(os.environ.get('ORBIT_MEDIA_DIR','/workspace/orbit-launch'))
manifest=json.loads((ROOT/'capture.json').read_text())
shots=manifest['shots'];OUT=ROOT/'edited';OUT.mkdir(exist_ok=True)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def run(args):subprocess.run(args,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
def encode(item):
 label=Image.new('RGBA',(1600,900),(0,0,0,0));d=ImageDraw.Draw(label)
 d.rectangle((0,0,1600,65),fill=(5,13,18,255));d.line((0,65,1600,65),fill=(90,211,191,255),width=2)
 title=item['title'];f=ImageFont.truetype(font,23)
 d.text((26,19),title,font=f,fill=(195,252,220,255))
 small=ImageFont.truetype(font,13);badge='SILENT REVIEW · NARRATION PENDING'
 d.text((1569-d.textlength(badge,font=small),27),badge,font=small,fill=(144,164,175,255))
 png=OUT/(item['id']+'.png');label.save(png)
 target=OUT/(item['id']+'.mp4')
 run(['ffmpeg','-y','-v','error','-ss',str(item['source_in']),'-i',item['path'],'-i',str(png),'-filter_complex','[0:v][1:v]overlay=0:0,format=yuv420p[v]','-map','[v]','-an','-t',str(item['duration']),'-r','25','-c:v','libx264','-threads','2','-preset','fast','-crf','20','-movflags','+faststart',str(target)])
 return target
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 paths=list(pool.map(encode,shots))
listing=OUT/'concat.txt';listing.write_text(''.join("file '"+p.name+"'\n" for p in paths))
final=ROOT/'Orbit-feature-demo-silent.mp4'
run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',str(listing),'-map','0:v:0','-c','copy','-movflags','+faststart',str(final)])
info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(final)]))
(ROOT/'export-info.json').write_text(json.dumps(info,indent=2))
run(['ffmpeg','-v','error','-i',str(final),'-f','null','-'])
print(json.dumps({'video':str(final),'duration':info['format']['duration'],'bytes':info['format']['size'],'scenes':len(shots),'browser_errors':manifest['errors'],'narration':False}))
